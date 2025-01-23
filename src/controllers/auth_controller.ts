import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/users_model";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Document } from "mongoose";

type UserDocument = Document<unknown, {}, IUser> &
  IUser &
  Required<{
    _id: string;
  }> & {
    __v: number;
  };

export const generateTokens = (
  user: IUser
): { accessToken: string; refreshToken: string } | null => {
  if (!process.env.TOKEN_SECRET) {
    return null;
  }

  const random = Math.random().toString();
  const accessToken = jwt.sign(
    { _id: user._id, random: random },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRE }
  );
  const refreshToken = jwt.sign(
    { _id: user._id, random: random },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
  );

  if (user.refreshToken == null) {
    user.refreshToken = [];
  }

  user.refreshToken.push(refreshToken);

  return { accessToken: accessToken, refreshToken: refreshToken };
};

export const verifyAccessToken = (refreshToken: string | undefined) => {
  return new Promise<UserDocument>((resolve, reject) => {
    if (!refreshToken) {
      reject("Access denied");
      return;
    }

    if (!process.env.TOKEN_SECRET) {
      reject("Access denied");
      return;
    }

    jwt.verify(
      refreshToken,
      process.env.TOKEN_SECRET,
      async (err: any, payload: any) => {
        if (err) {
          reject("Access denied");
          return;
        }

        const userId = payload._id;

        try {
          const user = await userModel.findById(userId);

          if (!user) {
            return false;
          }

          if (!user.refreshToken || !user.refreshToken.includes(refreshToken)) {
            user.refreshToken = [];
            await user.save();
            reject("Access Denied");
            return;
          }

          user.refreshToken = user.refreshToken.filter(
            (token) => token !== refreshToken
          );
          resolve(user);
        } catch {
          reject("Access Denied");
          return;
        }
      }
    );
  });
};

const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, phoneNumber } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(req.file, req.file.path);
    

    // Handle uploaded file
    const profilePicture = req.file ? req.file.path : undefined;

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      profilePicture,
      phoneNumber,
    });

    res.status(200).send({
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(400).send("Error registering user");
  }
};

const login = async (req: Request, res: Response) => {
  try {
    let user: UserDocument | null = null;

    // Check if this is an OAuth login
    if (req.user) {
      user = req.user as UserDocument;
    } else {
      // Traditional login
      const { email, password } = req.body;

      user = await userModel.findOne({ email });

      console.log('start login');

      if (!user) {
        res.status(400).send("Invalid email or password");
        return;
      }

      // If the user is an OAuth user (e.g., Google login), skip password validation
      if (user.googleId) {
        // Proceed without password validation
      } else {
        // For traditional users, validate the password
        if (!user.password) {
          res.status(400).send("Invalid email or password");
          return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          res.status(400).send("Invalid email or password");
          return;
        }
      }
    }

    // At this point, user is authenticated (either via OAuth or traditional)

    const tokens = generateTokens(user);

    if (!tokens) {
      res.status(500).send("Failed to generate tokens");
      return;
    }

    // Save the refresh token to the database
    await user.save();

    // Determine response based on login type
    if (req.user) {
      // OAuth login: Redirect with tokens (you can adjust as needed)
      // For security, it's better to set tokens as HTTP-only cookies
      res.cookie("accessToken", tokens.accessToken, { httpOnly: true, secure: true });
      res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true, secure: true });
      
      // Redirect to the client application
      return res.redirect(`http://localhost:3003/oauth-callback#accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&user=${encodeURIComponent(
        JSON.stringify({
          _id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          soldItems: user.soldItems ? user.soldItems : 0,
        })
      )}`);
    } else {
      // Traditional login: Send JSON response
      res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      });
      return;
    }
  } catch (err) {
    console.error("Login error:", err);
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error");
    }
    // Optionally, log that a response was already sent
    console.error("Response already sent. Cannot send 500 error.");
  }
};


const logind = async (req: Request, res: Response) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });

    console.log(user);

    if (!user) {
      res.status(400).send("wrong email or password");
      return;
    }

    const valid = await bcrypt.compare(req.body.password, user.password);

    if (!valid) {
      res.status(400).send("wrong email or password");
      return;
    }

    const tokens = generateTokens(user);

    if (!tokens) {
      res.status(400).send("Access denied");
      return;
    }

    await user.save();

    res.status(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user._id,
      profilePicture: user.profilePicture,
      phoneNumber: user.phoneNumber,
      email: user.email,
      username: user.username,
      soldCount: user.soldCount
    });
  } catch (err) {
    res.status(400).send("wrong email or password");
  }
};

const logout = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;

  try {
    const user = await verifyAccessToken(refreshToken);
    await user.save();

    res.status(200).send("Logged out");
  } catch (err) {
    res.status(400).send("Access Denied");
  }
};

const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;

    try {
        const user = await verifyAccessToken(refreshToken);

        const tokens = generateTokens(user);
        await user.save();

        if(!tokens) {
            res.status(400).send("Access denied");
            return;
        }

        res.status(200).send({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (err) {
        res.status(400).send("Access Denied");
    }
}

type Payload = {
    _id: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    const token = authorization && authorization.split(" ")[1];
    if (!token) {
        res.status(401).send("Access Denied");
        return;
    }
    if (!process.env.TOKEN_SECRET) {
        res.status(400).send("Server Error");
        return;
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
        if (err) {
            res.status(401).send("Access Denied");
            return;
        }
        const userId = (payload as Payload)._id;
        req.params.userId = userId;
        next();
    });
};

export default { register, login, logout, refresh };
