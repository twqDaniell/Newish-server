import request from "supertest";
import appInit from "../server";
import mongoose from "mongoose";
import commentsModel, { IComment } from "../models/comments_model";

import testCommentsData from "./test_comments.json";
import { Express } from "express";

let app: Express;

type Comment = {
  _id?: string;
  message: string;
  postId: string;
  user: string;
  createdAt?: Date;
}

const testComments: Comment[] = testCommentsData.map(comment => ({
    ...comment,
    createdAt: new Date(comment.createdAt),
  }));

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
  

const baseUrl = "/comments";

beforeAll(async () => {
  console.log("Before all tests");
  app = await appInit();
  await commentsModel.deleteMany();

  await request(app).post("/auth/register").send(testUser);
  const response = await request(app).post("/auth/login").send(testUser);
  testUser.refreshToken = response.body.refreshToken;
  testUser.accessToken = response.body.accessToken;
  testUser._id = response.body._id;
  expect(response.statusCode).toBe(200);
});

afterAll(async () => {
  console.log("After all tests");
  await commentsModel.deleteMany();
  mongoose.connection.close();
});

describe("Comments Test", () => {
  test("Test get all comments empty", async () => {
    const response = await request(app).get(baseUrl);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test create new comment", async () => {
    for (let comment of testComments) {
      const response = await request(app).post(baseUrl).set("authorization", "JWT " + testUser.accessToken).send(comment);
      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe(comment.message);
      expect(response.body.postId).toBe(comment.postId);
      expect(response.body.user).toBe(comment.user);
      comment._id = response.body._id;
    }
  });

  test("Test get all comments", async () => {
    const response = await request(app).get(baseUrl);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(testComments.length);
  });

  test("Test get comment by id", async () => {
    const response = await request(app).get(baseUrl + "/" + testComments[0]._id);
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(testComments[0]._id);
  });

  test("Test filter commments by user", async () => {
    const response = await request(app).get(baseUrl + "?user=" + testComments[0].user);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("Test filter commments by post", async () => {
    const response = await request(app).get(baseUrl + "?postId=" + testComments[0].postId);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });


  test("Test update comment", async () => {
    const updatedData = { message: "Updated Comment Message" };
    const response = await request(app)
      .put(baseUrl + "/" + testComments[0]._id)
      .set("authorization", "JWT " + testUser.accessToken)
      .send(updatedData);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(updatedData.message);
  });

  test("Test update comment with non-existent ID", async () => {
    const updatedData = { message: "Non-existent Comment Update" };
    const response = await request(app)
      .put(baseUrl + "/invalidCommentId")
      .set("authorization", "JWT " + testUser.accessToken)
      .send(updatedData);
    expect(response.statusCode).toBe(400);
  });
  
  test("Test Delete comment", async () => {
    const response = await request(app).delete(baseUrl + "/" + testComments[0]._id).set("authorization", "JWT " + testUser.accessToken);
    expect(response.statusCode).toBe(200);

    const responseGet = await request(app).get(baseUrl + "/" + testComments[0]._id);
    expect(responseGet.statusCode).toBe(404);
  });

  test("Test create new comment fail", async () => {
    const response = await request(app).post(baseUrl).set("authorization", "JWT " + testUser.accessToken).send({
      title: "Test Comment 1",
      content: "Test Content 1",
    });
    expect(response.statusCode).toBe(400);
  });
});
