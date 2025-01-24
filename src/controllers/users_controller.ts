import { Request, Response } from "express";
import mongoose, { Model } from "mongoose";
import userModel, { IUser } from "../models/users_model";
import bcrypt from "bcrypt";

class UsersController<IUser> {
  user: Model<IUser>;
  constructor(user: Model<IUser>) {
    this.user = user;
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params; 

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send("Invalid user ID");
      }

      const { username, email, phoneNumber, password } = req.body;

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

  async sellProduct(req: Request, res: Response) {
    try {
      const { id } = req.params; // User ID from the route

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send("Invalid user ID");
      }
  
      // Find the user by ID
      const user = await userModel.findById(id);
      if (!user) {
        return res.status(404).send("User not found");
      }
  
      // Ensure the soldCount field exists and is initialized
      if (typeof user.soldCount !== "number") {
        user.soldCount = 0; // Initialize if not already present
      }
  
      // Increment the soldCount field
      user.soldCount += 1;
  
      // Save the updated user
      await user.save();
  
      res.status(200).send({
        message: "Product sold count updated successfully",
        user,
      });
    } catch (error) {
      console.error("Error updating sold count:", error);
      res.status(500).send("Error updating sold count");
    }
  }  
}

export default new UsersController(userModel);
