import mongoose from "mongoose";
const { Schema } = mongoose;

export interface IPost {
  title: string;
  content?: string;
  sender: mongoose.Schema.Types.ObjectId;
  newPrice?: number;
  oldPrice?: number;
  picture?: string;
  createdAt?: Date;
  timesWorn?: number;
  city?: string;
  likes?: mongoose.Schema.Types.ObjectId[];
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
    type: Schema.Types.ObjectId,
    ref: "Users", 
    required: true 
  },
  newPrice: {
    type: Number,
    default: 0,
  },
  oldPrice: {
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
  city: {
    type: String,
    default: "",
  },
  likes: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: [],
  } 
});

const postModel = mongoose.model<IPost>("Posts", postSchema);

export default postModel;
