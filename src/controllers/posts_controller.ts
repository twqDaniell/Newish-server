import { Request, Response } from "express";
import { Model } from "mongoose";
import postModel, { IPost } from "../models/posts_model";
import commentModel from "../models/comments_model";
import mongoose from "mongoose";
class PostsController<IPost> {
  post: Model<IPost>;
  constructor(post: Model<IPost>) {
    this.post = post;
  }

  async getPostById(req: Request, res: Response) {
    const postId = req.params.id;

    try {
      const post = await this.post.findById(postId);

      if (post === null) {
        res.status(404).send("not found");
      } else {
        res.status(200).send(post);
      }
    } catch (error) {
      res.status(400).send(error);
    }
  };

  async createPost(req: Request, res: Response) {
    const post = req.body;

    try {
      const newPost = await this.post.create(post);
      res.status(201).send(newPost);
    } catch (error) {
      res.status(400).send(error);
    }
  };

  async getAllPosts(req: Request, res: Response) {
    const ownerFilter = req.query.sender;
  
    try {
      const matchCondition = ownerFilter ? { sender: ownerFilter } : {};
  
      const postsWithCommentCount = await this.post.aggregate([
        {
          $match: matchCondition, // Apply the sender filter if provided
        },
        {
          $lookup: {
            from: "comments", // Name of the comments collection in MongoDB
            localField: "_id", // Field in the posts collection
            foreignField: "postId", // Field in the comments collection
            as: "comments", // The joined field
          },
        },
        {
          $addFields: {
            commentCount: { $size: "$comments" }, // Add a field for the count of comments
          },
        },
        {
          $lookup: {
            from: "users", // Name of the users collection in MongoDB
            localField: "sender", // Field in the posts collection
            foreignField: "_id", // Field in the users collection
            as: "sender", // The joined field
          },
        },
        {
          $unwind: "$sender", // Unwind the senderDetails array to include only the first matched sender
        },
        {
          $project: {
            comments: 0, // Exclude the comments array from the response
            "sender.password": 0, // Exclude sensitive fields from the sender details
            "sender.refreshToken": 0,
          },
        },
      ]);
  
      res.status(200).send(postsWithCommentCount);
    } catch (error) {
      console.error("Error fetching posts with comment counts:", error);
      res.status(500).send({ error: "Failed to fetch posts" });
    }
  }  

  async updatePost(req: Request, res: Response) {
    const postId = req.params.id;
    const updateData = req.body;
  
    try {
      const updatedPost = await this.post.findByIdAndUpdate(postId, updateData, { new: true });
      res.status(200).send(updatedPost);
    } catch (error) {
      res.status(400).send(error);
    }
  };

  async deletePost(req: Request, res: Response) {
    const postId = req.params.id;

    try {
      await this.post.findByIdAndDelete(postId);
      res.status(200).send();
    } catch (error) {
      res.status(400).send(error);
    }
  };
};

export default new PostsController(postModel);
