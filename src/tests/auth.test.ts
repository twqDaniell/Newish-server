import request from "supertest";
import appInit from "../server";
import mongoose from "mongoose";
import postsModel from "../models/posts_model";
import userModel from "../models/users_model";
import {
  generateTokens,
  verifyAccessToken,
} from "../controllers/auth_controller";

import testPostsData from "./test_posts.json";
import { Express } from "express";

let app: Express;

type Post = {
  _id?: string;
  title: string;
  content: string;
  sender: string;
};
const testPosts: Post[] = testPostsData;

beforeAll(async () => {
  console.log("Before all tests");
  app = await appInit();
  await postsModel.deleteMany();
  await userModel.deleteMany();
});

afterAll(() => {
  console.log("After all tests");
  mongoose.connection.close();
});

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

describe("Auth Test", () => {
  test("generateTokens fails when TOKEN_SECRET is missing", async () => {
    const originalTokenSecret = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;

    const tokens = generateTokens({
      _id: "testUserId",
      username: "testuser",
      email: "user@test.com",
      password: "1234567",
      refreshToken: [],
    });

    expect(tokens).toBeNull();

    process.env.TOKEN_SECRET = originalTokenSecret; // Restore
  });

  test("Test registration", async () => {
    const response = await request(app).post("/auth/register").send(testUser);
    expect(response.statusCode).toBe(200);
  });

  test("Test registration fail", async () => {
    const response = await request(app).post("/auth/register").send(testUser);
    expect(response.statusCode).not.toBe(200);
  });

  test("Test registration fail", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "",
    });
    expect(response.statusCode).not.toBe(200);
  });

  test("Test registration fail", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "",
    });
    expect(response.statusCode).not.toBe(200);
  });

  test("Test login", async () => {
    const response = await request(app).post("/auth/login").send(testUser);
    expect(response.statusCode).toBe(200);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
    expect(testUser.accessToken).toBeDefined();
    expect(testUser.refreshToken).toBeDefined();
    testUser._id = response.body._id;
  });

  test("Test login", async () => {
    const response = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: "wrongpassword",
    });
    expect(response.statusCode).not.toBe(200);

    const response2 = await request(app).post("/auth/login").send({
      email: "asdfasdf",
      password: "wrongpassword",
    });
    expect(response2.statusCode).not.toBe(200);
  });

  test("Using token", async () => {
    const response = await request(app).post("/posts").send(testPosts[0]);
    expect(response.statusCode).not.toBe(201);

    const response2 = await request(app)
      .post("/posts")
      .set({ authorization: "JWT " + testUser.accessToken })
      .send(testPosts[0]);
    expect(response2.statusCode).toBe(201);

    const response3 = await request(app)
      .post("/posts")
      .set({ authorization: "JWT " + testUser.accessToken + "f" })
      .send(testPosts[0]);
    expect(response3.statusCode).not.toBe(201);
  });

  test("Test refresh token", async () => {
    const response = await request(app).post("/auth/refresh").send({
      refreshToken: testUser.refreshToken,
    });

    expect(response.statusCode).toBe(200);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
    expect(testUser.accessToken).toBeDefined;
    expect(testUser.refreshToken).toBeDefined;
  });

  test("Test logout", async () => {
    const response1 = await request(app).post("/auth/login").send(testUser);
    expect(response1.statusCode).toBe(200);

    const response = await request(app).post("/auth/logout").send({
      refreshToken: testUser.refreshToken,
    });

    expect(response.statusCode).toBe(200);

    const response2 = await request(app).post("/auth/refresh").send({
      refreshToken: testUser.refreshToken,
    });

    expect(response2.statusCode).not.toBe(200);
  });

  test("Test distinct tokens", async () => {
    const response = await request(app).post("/auth/login").send(testUser);
    expect(response.statusCode).toBe(200);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;

    const response2 = await request(app).post("/auth/login").send(testUser);
    expect(response2.statusCode).toBe(200);
    expect(response2.body.refreshToken).not.toEqual(testUser.refreshToken);
  });

  test("Test refresh token fail", async () => {
    const response = await request(app).post("/auth/refresh").send({
      refreshToken: testUser.refreshToken,
    });

    expect(response.statusCode).toBe(200);

    const response2 = await request(app).post("/auth/refresh").send({
      refreshToken: testUser.refreshToken,
    });

    expect(response2.statusCode).not.toBe(200);

    const response3 = await request(app).post("/auth/refresh").send({
      refreshToken: testUser.refreshToken,
    });

    expect(response3.statusCode).not.toBe(200);
  });

  test("verifyAccessToken fails with no refreshToken provided", async () => {
    const promise = verifyAccessToken(undefined);
    await expect(promise).rejects.toEqual("Access denied");
  });

  test("verifyAccessToken fails when TOKEN_SECRET is missing", async () => {
    const originalTokenSecret = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;

    const promise = verifyAccessToken("someRefreshToken");
    await expect(promise).rejects.toEqual("Access denied");

    process.env.TOKEN_SECRET = originalTokenSecret; // Restore
  });

  test("verifyAccessToken fails when refreshToken is invalid", async () => {
    const promise = verifyAccessToken("invalidRefreshToken");
    await expect(promise).rejects.toEqual("Access denied");
  });

  test("verifyAccessToken fails when user is not found", async () => {
    jest.spyOn(userModel, "findById").mockResolvedValueOnce(null); // Mock user not found
    const promise = verifyAccessToken("validRefreshToken");
    await expect(promise).rejects.toEqual("Access denied");
  });
});
