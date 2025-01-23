import { Request, Response } from "express";
import { Model } from "mongoose";
import postModel, { IPost } from "../models/posts_model";
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
  }

  async createPost(req: Request, res: Response) {
    const { title, content, oldPrice, newPrice, city, timesWorn, sender } =
      req.body;

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
        sender,
      });

      res.status(201).json(newPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  }

  async getAllPosts(req: Request, res: Response) {
    const ownerFilter = req.query.sender;
    const page = parseInt(req.query.page as string) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit as string) || 8; // Default to 10 items per page

    try {
      const matchCondition = ownerFilter && typeof ownerFilter === "string"
      ? { sender: new mongoose.Types.ObjectId(ownerFilter) }
      : {};
  
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
          $unwind: "$sender", // Unwind the sender array to include only the first matched sender
        },
        {
          $project: {
            comments: 0, // Exclude the comments array from the response
            "sender.password": 0, // Exclude sensitive fields from the sender details
            "sender.refreshToken": 0,
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $skip: (page - 1) * limit, // Skip documents for previous pages
        },
        {
          $limit: limit, // Limit the number of documents returned
        },
      ]);
  
      // Get the total count of posts for pagination metadata
      const totalPosts = await this.post.countDocuments(matchCondition);
      const totalPages = Math.ceil(totalPosts / limit);
  
      res.status(200).send({
        posts: postsWithCommentCount,
        currentPage: page,
        totalPages,
        totalPosts,
      });
    } catch (error) {
      console.error("Error fetching posts with comment counts:", error);
      res.status(500).send({ error: "Failed to fetch posts" });
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

  async likePost(req: Request, res: Response) {
    const { id: postId } = req.params; // Post ID from params
    const { userId } = req.body; // User ID from request body
  
    try {
      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ message: "Invalid user ID" });
      }
  
      // Find the post by ID
      const post = await postModel.findById(postId);
  
      if (!post) {
        return res.status(404).send({ message: "Post not found" });
      }
  
      // Convert userId to the correct type (Schema.Types.ObjectId)
      const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);
  
      // Check if the user has already liked the post
      const isLiked = post.likes.some((id) => id.toString() === userObjectId.toString());
  
      if (isLiked) {
        // If liked, remove the user ID from the likes array
        post.likes = post.likes.filter((id) => id.toString() !== userObjectId.toString());
      } else {
        // If not liked, add the user ID to the likes array
        post.likes.push(userObjectId as any);
      }
  
      // Save the updated post
      const updatedPost = await post.save();
  
      res.status(200).send(updatedPost);
    } catch (error) {
      console.error("Error in likePost:", error);
      res.status(500).send({ message: "Failed to like/unlike post", error });
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
  }
}

export default new PostsController(postModel);
