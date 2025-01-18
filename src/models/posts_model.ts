import mongoose from "mongoose";
const { Schema } = mongoose;

export interface IPost {
  title: string;
  content?: string;
  sender: string;
  price?: number;
  picture?: string;
  createdAt?: Date;
  timesWorn?: number;
}

const postSchema = new Schema<IPost>({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default: "",
  },
  sender: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  picture: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  timesWorn: {
    type: Number,
    default: 0,
  },
});

const postModel = mongoose.model<IPost>("Posts", postSchema);

export default postModel;
