import request from "supertest";
import mongoose from "mongoose";
import appInit from "../server";
import userModel from "../models/users_model";
import { Express } from "express";
import jwt from "jsonwebtoken";
import path from "path";

let app: Express;

type User = {
  username: string;
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

beforeAll(async () => {
  console.log("Before all auth tests");
  console.log(process.env.DB_CONNECTION)
  app = await appInit();
  await userModel.deleteMany(); // Clear users collection
});

afterAll(() => {
  console.log("After all auth tests");
  mongoose.connection.close();
});

describe("Authentication Test Suite", () => {
  test("Register a new user", async () => {
    const response = await request(app).post("/auth/register").send(testUser);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("User registered successfully");
    testUser._id = response.body.user._id;
  });

  test("Login with valid credentials", async () => {
    const response = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
  });

  test("Fail login with incorrect password", async () => {
    const response = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: "wrongpassword",
    });
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Invalid email or password");
  });

  test("Fail login with unregistered email", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "unknown@test.com",
      password: testUser.password,
    });
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Invalid email or password");
  });

  test("Fail login generate tokens", async () => {
    const originalEnv = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;

    const response = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(response.statusCode).toBe(500);

    process.env.TOKEN_SECRET = originalEnv;
  });

  test("Refresh token", async () => {
    const response = await request(app).post("/auth/refresh").send({
      refreshToken: testUser.refreshToken,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
  });

  test("Fail refresh with invalid token", async () => {
    const response = await request(app).post("/auth/refresh").send({
      refreshToken: "invalidToken",
    });
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Access Denied");
  });

  test("Access protected route with valid token", async () => {
    const response = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${testUser.accessToken}`);
    expect(response.statusCode).toBe(200); // Assuming the posts route is protected
  });

  test("Fail protected route access without token", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(401);
    expect(response.text).toBe("Access Denied");
  });

  test("Fail protected route access with invalid token", async () => {
    const response = await request(app)
      .get("/posts")
      .set("Authorization", "Bearer invalidToken");
    expect(response.statusCode).toBe(401);
    expect(response.text).toBe("Access Denied");
  });

  test("Delete tokens on logout", async () => {
    const logoutResponse = await request(app).post("/auth/logout").send({
      refreshToken: testUser.refreshToken,
    });
    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.text).toBe("Logged out");

    const refreshResponse = await request(app).post("/auth/refresh").send({
      refreshToken: testUser.refreshToken,
    });
    expect(refreshResponse.statusCode).toBe(400);
    expect(refreshResponse.text).toBe("Access Denied");
  });

  test("Fail logout with invalid refresh token", async () => {
    const response = await request(app).post("/auth/logout").send({
      refreshToken: "invalidToken",
    });
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Access Denied");
  });

  test("Google OAuth flow", async () => {
    // Simulate redirect to Google OAuth
    const response = await request(app).get("/auth/google");
    expect(response.statusCode).toBe(302); // Redirect to Google login page
    expect(response.headers.location).toContain("https://accounts.google.com");
  });

  test("Reject login with case-insensitive email", async () => {
    const response = await request(app).post("/auth/login").send({
      email: testUser.email.toUpperCase(),
      password: testUser.password,
    });
    expect(response.statusCode).toBe(200); // Should still work due to case insensitivity
    expect(response.body.accessToken).toBeDefined();
  });

  test("Fail registration with missing fields", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "incomplete@test.com",
    });
    expect(response.statusCode).toBe(400);
    expect(response.text).toContain("Error registering user");
  });

  test("Prevent duplicate email registration", async () => {
    const response = await request(app).post("/auth/register").send(testUser);
    expect(response.statusCode).toBe(400);
    expect(response.text).toContain("Error registering user");
  });

  test("Reject login with empty password", async () => {
    const response = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: "",
    });
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Invalid email or password");
  });

  test("Prevent access with expired tokens", async () => {
    const shortLivedToken = jwt.sign(
      { _id: testUser._id },
      process.env.TOKEN_SECRET!,
      { expiresIn: "1ms" }
    );

    const response = await request(app)
      .get("/posts")
      .set("Authorization", `Bearer ${shortLivedToken}`);
    expect(response.statusCode).toBe(401);
    expect(response.text).toBe("Access Denied");
  });

  test("Register with profile picture", async () => {
    const filePath = path.join(__dirname, "test_files", "test.jpg");
    const response = await request(app)
      .post("/auth/register")
      .field("username", "newUser")
      .field("email", "newuser@test.com")
      .field("password", "password123")
      .attach("profilePicture", filePath);
    expect(response.statusCode).toBe(200);
    expect(response.body.user.profilePicture).toBeDefined();
  });

  test("Logout after Google OAuth", async () => {
    // Simulate Google login callback (mocking success)
    const callbackResponse = await request(app).get("/auth/google/callback");
    expect(callbackResponse.statusCode).toBe(302); // Expect redirect to the app
  
    // Test logout functionality
    const logoutResponse = await request(app).get("/auth/logout");
    expect(logoutResponse.statusCode).toBe(302); // Redirect to home page
    expect(logoutResponse.headers.location).toBe("/"); // Verify redirection path
  });
});
