import express, { Express } from "express";
const app = express();
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bodyParser from "body-parser";
import postsRoute from "./routes/posts_route";
import commentsRoute from "./routes/comments_route";
import authRoute from "./routes/auth_route";
import usersRoute from "./routes/users_route";
const session = require("express-session");
const passport = require("./config/passport");
const cors = require("cors");
import { getSustainabilityTips } from "./controllers/sustainability_controller";
import MongoStore from "connect-mongo";
const fs = require("fs");

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));

app.use(express.json());
app.use(cors());

const swaggerDocument = JSON.parse(fs.readFileSync("./swagger.json", "utf8"));

app.use("/api_docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.get("/api/sustainability-tips", getSustainabilityTips);

// Middleware for sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.DB_CONNECTION, // Your MongoDB connection string
      ttl: 14 * 24 * 60 * 60, // Session expiration (14 days in seconds)
    }),
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(cors());
app.use("/posts", postsRoute);
app.use("/comments", commentsRoute);
app.use("/auth", authRoute);
app.use("/users", usersRoute);

const initApp = () => {
  console.log(process.env.DB_CONNECTION);
  return new Promise<Express>(async (resolve, reject) => {
    if (process.env.DB_CONNECTION == undefined) {
      reject("DB_CONNECTION is not defined");
    } else {
      await mongoose.connect(process.env.DB_CONNECTION);
      resolve(app);
    }
  });
};

export default initApp;
