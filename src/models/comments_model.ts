import mongoose from "mongoose";
const Schema = mongoose.Schema;

export interface IComment {
  _id?: string;
  postId: mongoose.Schema.Types.ObjectId;
  user: mongoose.Schema.Types.ObjectId;
  message: string;
  createdAt?: Date;
}

const commentsSchema = new Schema<IComment>({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Posts",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users", 
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
