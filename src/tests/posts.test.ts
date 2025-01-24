import request from "supertest";
import appInit from "../server";
import mongoose from "mongoose";
import postsModel from "../models/posts_model";
import { Express } from "express";

let app: Express;

type Post = {
  _id?: string;
  title: string;
  content: string;
  sender: string;
  oldPrice?: number;
  newPrice?: number;
  picture?: string;
  city?: string;
  created_at?: string;
  timesWorn?: number;
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

const testPosts: Post[] = [
  {
    title: "Test Post 1",
    content: "Content for Post 1",
    sender: "",
    oldPrice: 100,
    newPrice: 50,
    city: "New York",
    created_at: "2025-01-01T00:00:00Z",
    timesWorn: 1,
  },
  {
    title: "Test Post 2",
    content: "Content for Post 2",
    sender: "",
    oldPrice: 200,
    newPrice: 150,
    city: "Los Angeles",
    created_at: "2025-01-02T00:00:00Z",
    timesWorn: 0,
  },
];

beforeAll(async () => {
  console.log("Before all tests");
  app = await appInit();
  await postsModel.deleteMany();

  await request(app).post("/auth/register").send(testUser);
  const response = await request(app).post("/auth/login").send(testUser);

  testUser.refreshToken = response.body.refreshToken;
  testUser.accessToken = response.body.accessToken;
  testUser._id = response.body._id;

  expect(response.statusCode).toBe(200);

  for (let post of testPosts) {
    post.sender = testUser._id;
  }
});

afterAll(() => {
  console.log("After all tests");
  mongoose.connection.close();
});

describe("Posts Test Suite", () => {
  test("Get all posts initially empty", async () => {
    const response = await request(app).get("/posts").set("Authorization", "Bearer " + testUser.accessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.posts.length).toBe(0);
  });

  test("Create new posts with JWT", async () => {
    for (let post of testPosts) {
      const response = await request(app)
        .post("/posts")
        .set("Authorization", "Bearer " + testUser.accessToken)
        .send(post);
      expect(response.statusCode).toBe(201);
      expect(response.body.title).toBe(post.title);
      expect(response.body.content).toBe(post.content);
      post._id = response.body._id;
    }
  });

  test("Get all posts", async () => {
    const response = await request(app).get("/posts").set("Authorization", "Bearer " + testUser.accessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.posts.length).toBe(testPosts.length);
  });

  test("Get post by ID", async () => {
    const response = await request(app).get(`/posts/${testPosts[0]._id}`).set("Authorization", "Bearer " + testUser.accessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(testPosts[0]._id);
  });

  test("Filter posts by owner using sender query", async () => {
    const response = await request(app).get(`/posts?sender=${testUser._id}`).set("Authorization", "Bearer " + testUser.accessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.posts.length).toBe(testPosts.length);
  });

  test("Update a post", async () => {
    const updatedData = { title: "Updated Title", content: "Updated Content" };
    const response = await request(app)
      .put(`/posts/${testPosts[0]._id}`)
      .set("Authorization", "Bearer " + testUser.accessToken)
      .send(updatedData);
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(updatedData.title);
    expect(response.body.content).toBe(updatedData.content);
  });

  test("Delete a post", async () => {
    const response = await request(app)
      .delete(`/posts/${testPosts[0]._id}`)
      .set("Authorization", "Bearer " + testUser.accessToken);
    expect(response.statusCode).toBe(200);

    const responseGet = await request(app).get(`/posts/${testPosts[0]._id}`).set("Authorization", "Bearer " + testUser.accessToken);
    expect(responseGet.statusCode).toBe(404);
  });

  test("Fail to create a post without JWT", async () => {
    const response = await request(app).post("/posts").send({
      title: "Unauthorized Post",
      content: "Should not be created",
    });
    expect(response.statusCode).toBe(401);
  });

  test("Fail to get post with invalid ID", async () => {
    const response = await request(app).get("/posts/invalidPostId").set("Authorization", "Bearer " + testUser.accessToken);
    expect(response.statusCode).toBe(400);
  });

  test("Pagination: Get posts with page and limit", async () => {
    const response = await request(app).get("/posts?page=1&limit=1").set("Authorization", "Bearer " + testUser.accessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.posts.length).toBe(1);
    expect(response.body.currentPage).toBe(1);
    expect(response.body.totalPages).toBeGreaterThanOrEqual(1);
  });

  test("Pagination: Get posts beyond the total pages", async () => {
    const response = await request(app).get("/posts?page=999&limit=1").set("Authorization", "Bearer " + testUser.accessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.posts.length).toBe(0);
  });

  test("Like a post", async () => {
    const response = await request(app)
      .put(`/posts/${testPosts[1]._id}/like`)
      .set("Authorization", "Bearer " + testUser.accessToken)
      .send({ userId: testUser._id });
    expect(response.statusCode).toBe(200);
    expect(response.body.likes).toContain(testUser._id);
  });

  test("Unlike a post", async () => {
    const response = await request(app)
      .put(`/posts/${testPosts[1]._id}/like`)
      .set("Authorization", "Bearer " + testUser.accessToken)
      .send({ userId: testUser._id });
    expect(response.statusCode).toBe(200);
    expect(response.body.likes).not.toContain(testUser._id);
  });

  test("Fail to like a post with invalid user ID", async () => {
    const response = await request(app)
      .put(`/posts/${testPosts[1]._id}/like`)
      .set("Authorization", "Bearer " + testUser.accessToken)
      .send({ userId: "invalidUserId" });
    expect(response.statusCode).toBe(400);
  });

  test("Fail to update a post without JWT", async () => {
    const updatedData = { title: "Unauthorized Update" };
    const response = await request(app)
      .put(`/posts/${testPosts[1]._id}`)
      .send(updatedData);
    expect(response.statusCode).toBe(401);
  });

  test("Fail to delete a post without JWT", async () => {
    const response = await request(app).delete(`/posts/${testPosts[1]._id}`);
    expect(response.statusCode).toBe(401);
  });

  test("Fail to delete a non-existent post", async () => {
    const response = await request(app)
      .delete("/posts/invalidPostId")
      .set("Authorization", "Bearer " + testUser.accessToken);
    expect(response.statusCode).toBe(400);
  });

  test("Create a post with missing fields", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", "Bearer " + testUser.accessToken)
      .send({
        content: "Missing title",
      });
    expect(response.statusCode).toBe(500);
  });

  test("Update a post with invalid data", async () => {
    const updatedData = { newPrice: "invalidPrice" };
    const response = await request(app)
      .put(`/posts/${testPosts[1]._id}`)
      .set("Authorization", "Bearer " + testUser.accessToken)
      .send(updatedData);
    expect(response.statusCode).toBe(400);
  });
});
