import mongoose from "mongoose";
const Schema = mongoose.Schema;

export interface IComment {
  _id?: string;
  postId: string;
  user: string;
  message: string;
  createdAt?: Date;
}

const commentsSchema = new Schema<IComment>({
  postId: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const commentModel = mongoose.model<IComment>("Comments", commentsSchema);

export default commentModel;
