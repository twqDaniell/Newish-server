import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/users_model";
import * as jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Document } from "mongoose";
import postModel from "../models/posts_model";

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
  const tokenSecret = process.env.TOKEN_SECRET;
  const tokenExpire = process.env.TOKEN_EXPIRE;
  const refreshTokenExpire = process.env.REFRESH_TOKEN_EXPIRE;

  if (!tokenSecret || !tokenExpire || !refreshTokenExpire) {
    return null;
  }

  const random = Math.random().toString();

  const accessToken = jwt.sign({ _id: user._id, random }, tokenSecret, {
    expiresIn: tokenExpire,
  });

  const refreshToken = jwt.sign({ _id: user._id, random }, tokenSecret, {
    expiresIn: refreshTokenExpire,
  });

  if (user.refreshToken == null) {
    user.refreshToken = [];
  }

  user.refreshToken.push(refreshToken);

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (refreshToken: string | undefined) => {
  return new Promise<UserDocument>((resolve, reject) => {
    if (!refreshToken) {
      reject("Access denied");
      return;
    }

    console.log("process.env.TOKEN_SECRET", process.env.TOKEN_SECRET);

    if (!process.env.TOKEN_SECRET) {
      reject("Access denied");
      return;
    }

    jwt.verify(
      refreshToken,
      process.env.TOKEN_SECRET,
      async (err: any, payload: any) => {
        console.log("err", err);
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

          console.log("user", user);

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
    console.log("register", req.body.email);

    const { username, email, password, phoneNumber } = req.body;
    console.log("body", req.body);
    
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("user", req.body);
    console.log("pic", req.file ? req.file.path : undefined);

    // Handle uploaded file
    const profilePicture = req.file ? req.file.path : undefined;

    const user = await userModel.create({
      username,
      email: email.toLowerCase(),
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

    if (req.user) {
      user = req.user as UserDocument;
    } else {
      const { email, password } = req.body;

      user = await userModel.findOne({ email: email.toLowerCase() });

      if (!user) {
        res.status(400).send("Invalid email or password");
        return;
      }

      if (!user.googleId) {
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          res.status(400).send("Invalid email or password");
          return;
        }
      }
    }

    const tokens = generateTokens(user);

    if (!tokens) {
      res.status(500).send("Failed to generate tokens");
      return;
    }

    await user.save();

    const postsCount = await postModel.countDocuments({ sender: user._id });

    if (req.user) {
      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: true,
      });
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: true,
      });


      return res.redirect(
        `https://${process.env.DOMAIN}/oauth-callback#accessToken=${
          tokens.accessToken
        }&refreshToken=${tokens.refreshToken}&user=${encodeURIComponent(
          JSON.stringify({
            _id: user._id,
            username: user.username,
            email: user.email.toLowerCase(),
            profilePicture: user.profilePicture,
            soldCount: user.soldCount ? user.soldCount : 0,
            googleId: user.googleId,
            phoneNumber: user.phoneNumber ? user.phoneNumber : null,
            postsCount,
          })
        )}`
      );
    } else {
      res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id,
        username: user.username,
        email: user.email.toLowerCase(),
        profilePicture: user.profilePicture,
        postsCount,
        phoneNumber: user.phoneNumber ? user.phoneNumber : null,
        soldCount: user.soldCount ? user.soldCount : 0,
      });
      return;
    }
  } catch (err) {
    console.error("Login error:", err);
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error");
    }
    console.error("Response already sent. Cannot send 500 error.");
  }
};

const logout = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  console.log("refreshToken", refreshToken);

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

    if (!tokens) {
      res.status(400).send("Access denied");
      return;
    }

    res.status(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    res.status(400).send("Access Denied");
  }
};

type Payload = {
  _id: string;
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
