import mongoose from "mongoose";
const Schema = mongoose.Schema;

export interface IUser {
  username: string;
  email: string;
  password: string;
  refreshToken: string[];
  profilePicture?: string;
  phoneNumber?: string;
  _id: string;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: [String],
    default: [],
  },
  profilePicture: { type: String },
  phoneNumber: {
    type: String,
    required: true,
  }
});

const userModel = mongoose.model<IUser>("Users", userSchema);

export default userModel;
