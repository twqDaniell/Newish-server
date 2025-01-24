import request from "supertest";
import appInit from "../server";
import mongoose from "mongoose";
import userModel from "../models/users_model";
import { Express } from "express";
import path from "path";
require("dotenv").config({ path: ".env.test" });

let app: Express;

type User = {
  _id?: string;
  username?: string;
  email: string;
  password: string;
  refreshToken?: string[];
  profilePicture?: string;
  phoneNumber?: string;
  soldCount?: number;
};

const testUser: User = {
  username: "testuser",
  email: "user@test.com",
  password: "1234567",
};

const updatedUser: Partial<User> = {
  username: "updatedUser",
  email: "updateduser@test.com",
  phoneNumber: "0501234567",
};

beforeAll(async () => {
  app = await appInit();
  await userModel.deleteMany(); // Clear the users collection

  // Register the test user
  const registerResponse = await request(app)
    .post("/auth/register")
    .send(testUser);
  expect(registerResponse.statusCode).toBe(200);

  // Log in the test user
  const loginResponse = await request(app)
    .post("/auth/login")
    .send({ email: testUser.email, password: testUser.password });
  expect(loginResponse.statusCode).toBe(200);

  // Extract tokens and user ID
  testUser.refreshToken = loginResponse.body.refreshToken;
  testUser._id = loginResponse.body._id;
});

afterAll(() => {
  mongoose.connection.close();
});

describe("Users Test Suite", () => {
  test("Update user profile successfully", async () => {
    const response = await request(app)
      .put(`/users/${testUser._id}`)
      .set("Authorization", "Bearer " + testUser.refreshToken)
      .field("username", updatedUser.username)
      .field("email", updatedUser.email)
      .field("phoneNumber", updatedUser.phoneNumber)
      .attach("profilePicture", path.resolve(__dirname, "test_files/test.jpg"));


    expect(response.statusCode).toBe(200);
    expect(response.body.user.username).toBe(updatedUser.username);
    expect(response.body.user.email).toBe(updatedUser.email);
    expect(response.body.user.phoneNumber).toBe(updatedUser.phoneNumber);
    expect(response.body.user.profilePicture).toBeDefined();
  });

//   test("Update user profile with missing fields", async () => {
//     const response = await request(app)
//       .put(`/users/${testUser._id}`)
//       .set("Authorization", "Bearer " + testUser.refreshToken![0])
//       .field("username", "partialUpdate");

//     expect(response.statusCode).toBe(200);
//     expect(response.body.user.username).toBe("partialUpdate");
//     expect(response.body.user.email).toBe(updatedUser.email);
//   });

  test("Fail to update user without auth token", async () => {
    const response = await request(app)
      .put(`/users/${testUser._id}`)
      .field("username", "unauthorizedUpdate");

    expect(response.statusCode).toBe(401);
    expect(response.text).toBe("Access Denied");
  });

  test("Fail to update non-existent user (invalid id)", async () => {
    console.log("Token:", testUser.refreshToken);

    const response = await request(app)
      .put("/users/invalidUserId")
      .set("Authorization", "Bearer " + testUser.refreshToken)
      .field("username", updatedUser.username)
      .field("email", updatedUser.email)
      .field("phoneNumber", updatedUser.phoneNumber)
      .attach("profilePicture", path.resolve(__dirname, "test_files/test.jpg"));

    expect(response.statusCode).toBe(400); // Invalid user ID
  });

  test("Fail to update non-existent user (valid id)", async () => {
    console.log("Token:", testUser.refreshToken);

    const response = await request(app)
      .put("/users/678d00d799775f01ed9aa60f")
      .set("Authorization", "Bearer " + testUser.refreshToken)
      .field("username", updatedUser.username)
      .field("email", updatedUser.email)
      .field("phoneNumber", updatedUser.phoneNumber)
      .attach("profilePicture", path.resolve(__dirname, "test_files/test.jpg"));

    expect(response.statusCode).toBe(404); 
  });

  test("Increment sold count successfully", async () => {
    const response = await request(app)
      .put(`/users/sell/${testUser._id}`)
      .set("Authorization", "Bearer " + testUser.refreshToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.user.soldCount).toBe(1);
  });

  test("Fail to increment sold count without auth token", async () => {
    const response = await request(app).put(`/users/sell/${testUser._id}`);
    expect(response.statusCode).toBe(401);
    expect(response.text).toBe("Access Denied");
  });

  test("Fail to increment sold count for non-existent user", async () => {
    const response = await request(app)
      .put("/users/sell/invalidUserId")
      .set("Authorization", "Bearer " + testUser.refreshToken);

    expect(response.statusCode).toBe(400); // Invalid user ID
  });

  test("Fail to update user with an invalid profile picture format", async () => {
    const response = await request(app)
      .put(`/users/${testUser._id}`)
      .set("Authorization", "Bearer " + testUser.refreshToken)
      .field("username", updatedUser.username)
      .field("email", updatedUser.email)
      .field("phoneNumber", updatedUser.phoneNumber)
      .attach("profilePicture", path.resolve(__dirname, "test_files/invalid_file.txt")); // Invalid file format
  
    expect(response.statusCode).toBe(500); 
  });
  
});
