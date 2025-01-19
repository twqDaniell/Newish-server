import { Request, Response } from "express";
import { Model } from "mongoose";
import commentModel, { IComment } from "../models/comments_model";

class CommentsController<IComment> {
  comment: Model<IComment>;
  constructor(comment: Model<IComment>) {
    this.comment = comment;
  }

  async createComment(req: Request, res: Response) {
    const newComment = req.body;

    try {
      const comment = await this.comment.create(newComment);
      res.status(201).send(comment);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  async updateComment(req: Request, res: Response) {
    const commentId = req.params.id;
    const updateData = req.body;

    try {
      const updatedComment = await this.comment.findByIdAndUpdate(
        commentId,
        updateData,
        { new: true }
      );
      res.status(200).send(updatedComment);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  async deleteComment(req: Request, res: Response) {
    const commentId = req.params.id;

    try {
      await this.comment.findByIdAndDelete(commentId);
      res.status(200).send();
    } catch (error) {
      res.status(400).send(error);
    }
  }

  async getAllComments(req: Request, res: Response) {
    const postFilter = req.query.postId;
    const userFilter = req.query.user;
  
    try {
      let comments;
  
      if (postFilter) {
        comments = await this.comment
          .find({ postId: postFilter })
          .populate("user", "username profilePicture");
      } else if (userFilter) {
        comments = await this.comment
          .find({ user: userFilter })
          .populate("user", "username profilePicture");
      } else {
        comments = await this.comment
          .find()
          .populate("user", "username profilePicture");
      }
  
      res.status(200).send(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(400).send({ error: "Failed to fetch comments" });
    }
  }  

  async getCommentById(req: Request, res: Response) {
    const commentId = req.params.id;

    try {
      const comment = await this.comment.findById(commentId);

      if (comment === null) {
        res.status(404).send("not found");
      } else {
        res.status(200).send(comment);
      }
    } catch (error) {
      res.status(400).send(error);
    }
  }
}

export default new CommentsController(commentModel);
