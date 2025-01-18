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
      if (ownerFilter) {
        const posts = await this.post.find({ sender: ownerFilter });
        res.status(200).send(posts);
      } else {
        const posts = await this.post.find();
        res.status(200).send(posts);
      }
    } catch (error) {
      res.status(400).send(error);
    }
  };

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
