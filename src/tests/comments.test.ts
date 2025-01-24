import request from "supertest";
import appInit from "../server";
import mongoose from "mongoose";
import postsModel from "../models/posts_model";
import commentsModel from "../models/comments_model";
import { Express } from "express";

let app: Express;

type Post = {
  _id?: string;
  title: string;
  content: string;
  sender: string;
  price?: number;
  picture?: string;
  city?: string;
  created_at?: string;
  timesWorn?: number;
};

type Comment = {
  _id?: string;
  postId: string;
  user: string;
  message: string;
};

type User = {
  username?: string;
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
  _id?: string;
};

const testUser: User = {
  username: "testuser",
  email: "user@test.com",
  password: "1234567",
};

const testPost: Post = {
  title: "Test Post",
  content: "Content for Test Post",
  sender: "",
};

const testComments: Comment[] = [
  { postId: "", user: "", message: "Test Comment 1" },
  { postId: "", user: "", message: "Test Comment 2" },
];

beforeAll(async () => {
  console.log("Before all tests");
  app = await appInit();
  await postsModel.deleteMany();
  await commentsModel.deleteMany();

  await request(app).post("/auth/register").send(testUser);
  const response = await request(app).post("/auth/login").send(testUser);

  testUser.refreshToken = response.body.refreshToken;
  testUser.accessToken = response.body.accessToken;
  testUser._id = response.body._id;

  expect(response.statusCode).toBe(200);

  const postResponse = await request(app)
    .post("/posts")
    .set("Authorization", "Bearer " + testUser.accessToken)
    .send({ ...testPost, sender: testUser._id });

  testPost._id = postResponse.body._id;

  for (let comment of testComments) {
    comment.postId = testPost._id!;
    comment.user = testUser._id!;
  }
});

afterAll(() => {
  console.log("After all tests");
  mongoose.connection.close();
});

describe("Comments Test Suite", () => {
  test("Get all comments initially empty", async () => {
    const response = await request(app).get("/comments");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Create new comments with JWT", async () => {
    for (let comment of testComments) {
      const response = await request(app)
        .post("/comments")
        .set("Authorization", "Bearer " + testUser.accessToken)
        .send(comment);
      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe(comment.message);
      comment._id = response.body._id; 
    }
  });

  test("Get all comments for a post", async () => {
    const response = await request(app).get(`/comments?postId=${testPost._id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(testComments.length);
    expect(response.body[0].postId).toBe(testPost._id);
  });

  test("Get a comment by ID", async () => {
    const response = await request(app).get(`/comments/${testComments[0]._id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(testComments[0]._id);
  });

  test("Update a comment", async () => {
    const updatedMessage = "Updated Test Comment 1";
    const response = await request(app)
      .put(`/comments/${testComments[0]._id}`)
      .set("Authorization", "Bearer " + testUser.accessToken)
      .send({ message: updatedMessage });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(updatedMessage);
  });

  test("Delete a comment", async () => {
    const response = await request(app)
      .delete(`/comments/${testComments[0]._id}`)
      .set("Authorization", "Bearer " + testUser.accessToken);
    expect(response.statusCode).toBe(200);

    const responseGet = await request(app).get(`/comments/${testComments[0]._id}`);
    expect(responseGet.statusCode).toBe(404);
  });

  test("Fail to create a comment without JWT", async () => {
    const response = await request(app).post("/comments").send({
      postId: testPost._id,
      user: testUser._id,
      message: "Unauthorized Comment",
    });
    expect(response.statusCode).toBe(401);
  });
});
