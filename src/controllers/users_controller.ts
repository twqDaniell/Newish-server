import { Request, Response } from "express";
import { Model } from "mongoose";
import userModel, { IUser } from "../models/users_model";
import bcrypt from "bcrypt";

class UsersController<IUser> {
  user: Model<IUser>;
  constructor(user: Model<IUser>) {
    this.user = user;
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params; // User ID from the route
      const { username, email, phoneNumber, password } = req.body; // Other fields from the body

      // Handle uploaded file
      const profilePicture = req.file
        ? req.file.path.replace(/\\/g, "/")
        : undefined;

      // Find the user by ID
      const user = await userModel.findById(id);
      if (!user) {
        return res.status(404).send("User not found");
      }

      // Update user fields
      if (username) user.username = username;
      if (email) user.email = email;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (profilePicture) user.profilePicture = profilePicture;
      // Hash and update the password if provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
      }

      // Save the updated user
      await user.save();

      res.status(200).send({
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).send("Error updating user");
    }
  }
}

export default new UsersController(userModel);
