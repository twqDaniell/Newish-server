// import request from "supertest";
// import appInit from "../server";
// import mongoose from "mongoose";
// import postsModel from "../models/posts_model";

// import testPostsData from "./test_posts.json";
// import { Express } from "express";

// let app: Express;

// type Post = {
//   _id?: string;
//   title: string;
//   content: string;
//   sender: string;
//   price?: number;
//   picture?: string;
// };

// type User = {
//   username?: string;
//   email: string;
//   password: string;
//   accessToken?: string;
//   refreshToken?: string;
//   _id?: string;
// };

// const testUser: User = {
//   username: "testuser",
//   email: "user@test.com",
//   password: "1234567",
// };

// let testSender: String = "Daniel1";

// const testPosts: Post[] = testPostsData;

// beforeAll(async () => {
//   console.log("Before all tests");
//   app = await appInit();
//   await postsModel.deleteMany();

//   await request(app).post("/auth/register").send(testUser);
//   const response = await request(app).post("/auth/login").send(testUser);

//   // console.log(response);
//   testUser.refreshToken = response.body.refreshToken;
//   testUser.accessToken = response.body.accessToken;
//   testUser._id = response.body._id;
//   expect(response.statusCode).toBe(200);
// });

// afterAll(() => {
//   console.log("After all tests");
//   mongoose.connection.close();
// });

// describe("Posts Test", () => {
//   test("Test get all post empty", async () => {
//     const response = await request(app).get("/posts");
//     expect(response.statusCode).toBe(200);
//     expect(response.body.length).toBe(0);
//   });

//   test("Test create new post", async () => {
//     for (let post of testPosts) {
//       const response = await request(app).post("/posts").set("authorization", "JWT " + testUser.accessToken).send(post);
//       expect(response.statusCode).toBe(201);
//       expect(response.body.title).toBe(post.title);
//       expect(response.body.content).toBe(post.content);
//       post._id = response.body._id;
//     }
//   });

//   test("Test get all post", async () => {
//     const response = await request(app).get("/posts");
//     expect(response.statusCode).toBe(200);
//     expect(response.body.length).toBe(testPosts.length);
//   });

//   test("Test get post by id", async () => {
//     const response = await request(app).get("/posts/" + testPosts[0]._id);
//     expect(response.statusCode).toBe(200);
//     expect(response.body._id).toBe(testPosts[0]._id);
//   });

//   test("Test filter post by owner", async () => {
//     const response = await request(app).get("/posts?sender=" + testSender);
//     expect(response.statusCode).toBe(200);
//     expect(response.body.length).toBe(2);
//   });

//   test("Test update post", async () => {
//     const updatedData = { title: "Updated Title", content: "Updated Content" };
//     const response = await request(app)
//       .put("/posts/" + testPosts[0]._id)
//       .set("authorization", "JWT " + testUser.accessToken)
//       .send(updatedData);
//     expect(response.statusCode).toBe(200);
//     expect(response.body.title).toBe(updatedData.title);
//     expect(response.body.content).toBe(updatedData.content);
//   });

//   test("Test update post with non-existent ID", async () => {
//     const updatedData = { title: "Non-existent Title" };
//     const response = await request(app)
//       .put("/posts/invalidPostId")
//       .set("authorization", "JWT " + testUser.accessToken)
//       .send(updatedData);
//     expect(response.statusCode).toBe(400);
//   });

//   test("Test Delete post", async () => {
//     const response = await request(app).delete('/posts/' + testPosts[0]._id).set("authorization", "JWT " + testUser.accessToken);
//     expect(response.statusCode).toBe(200);

//     const responseGet = await request(app).get('/posts/' + testPosts[0]._id);
//     expect(responseGet.statusCode).toBe(404);
//   });

//   test("Test create new post fail", async () => {
//     const response = await request(app).post("/posts").set("authorization", "JWT " + testUser.accessToken).send({
//       content: "Test Content 1",
//     });
//     expect(response.statusCode).toBe(400);
//   });
// });
