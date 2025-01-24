import mongoose from "mongoose";
const Schema = mongoose.Schema;

export interface IUser {
  username: string;
  email: string;
  password: string;
  refreshToken: string[];
  profilePicture?: string;
  googleId?: string;
  phoneNumber?: string;
  _id: string;
  soldCount: number;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  refreshToken: {
    type: [String],
    default: [],
  },
  profilePicture: { type: String },
  phoneNumber: {
    type: String,
    required: false,
  },
  googleId: { type: String, required: false },
  soldCount: {
    type: Number,
    default: 0,
  }
});

const userModel = mongoose.model<IUser>("Users", userSchema);

export default userModel;
