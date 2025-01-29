// utils/tokenUtils.ts
import { Response } from 'express';
import { IUser } from '../models/users_model'; // Adjust the path as needed
import { generateTokens } from '../controllers/auth_controller'; // Adjust the path as needed
import { Document } from 'mongoose';

type UserDocument = Document<unknown, {}, IUser> &
  IUser &
  Required<{
    _id: string;
  }> & {
    __v: number;
  };

export const handleAuthSuccess = async (res: Response, user: UserDocument) => {
  try {
    const tokens = generateTokens(user);

    if (!tokens) {
      return res.status(500).send("Failed to generate tokens");
    }

    // Save the refresh token to the database
    await user.save();

    // Set tokens as HTTP-only cookies (optional but recommended for security)
    res.cookie("accessToken", tokens.accessToken, { httpOnly: true, secure: true });
    res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true, secure: true });

    // Send a success response or redirect with tokens
    // Here, we're redirecting to the client application
    res.redirect(`http://${process.env.IP}:3003`);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).send("Internal Server Error");
  }
};
