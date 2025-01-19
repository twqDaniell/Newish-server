import { Request, Response } from "express";
import { Model } from "mongoose";
import postModel, { IPost } from "../models/posts_model";
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
  }

  async createPost(req: Request, res: Response) {
    const { title, content, oldPrice, newPrice, city, timesWorn, sender } = req.body;

    try {
      // Access the uploaded file
      const picture = req.file ? req.file.path : null;

      const newPost = await this.post.create({
        title,
        content,
        oldPrice,
        newPrice,
        city,
        timesWorn,
        picture,
        sender
      });

      res.status(201).json(newPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  }

  async getAllPosts(req: Request, res: Response) {
    const ownerFilter = req.query.sender;
    try {
      let posts;

      if (ownerFilter) {
        posts = await this.post
          .find({ sender: ownerFilter })
          .populate("sender", "username profilePicture");
      } else {
        posts = await this.post
          .find()
          .populate("sender", "username profilePicture");
      }

      res.status(200).send(posts);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  async updatePost(req: Request, res: Response) {
    const postId = req.params.id;
    const updateData = req.body;

    try {
      const updatedPost = await this.post.findByIdAndUpdate(
        postId,
        updateData,
        { new: true }
      );
      res.status(200).send(updatedPost);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  async deletePost(req: Request, res: Response) {
    const postId = req.params.id;

    try {
      await this.post.findByIdAndDelete(postId);
      res.status(200).send();
    } catch (error) {
      res.status(400).send(error);
    }
  }
}

export default new PostsController(postModel);
