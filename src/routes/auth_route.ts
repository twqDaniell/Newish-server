import express from "express";
const router = express.Router();
import authController from "../controllers/auth_controller";
import { upload } from "../utils/multer";
const passport = require("passport");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "testuser"
 *               email:
 *                 type: string
 *                 example: "user@test.com"
 *               password:
 *                 type: string
 *                 example: "1234567"
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post("/register", upload.single("profilePicture"), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@test.com"
 *               password:
 *                 type: string
 *                 example: "1234567"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "refresh_token_example"
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh an access token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "refresh_token_example"
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Start Google OAuth flow
 *     tags:
 *       - Authentication
 *     description: Redirect the user to Google's OAuth 2.0 authentication flow.
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth login page
 *       500:
 *         description: Server error
 */
router.get("/google", (req, res, next) => {
  console.log("Redirecting to Google OAuth...");
  next();
}, passport.authenticate("google", { scope: ["profile", "email"] }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags:
 *       - Authentication
 *     description: Callback route after Google OAuth login. Handles the response from Google.
 *     responses:
 *       302:
 *         description: Redirect to the desired page after successful login
 *       401:
 *         description: Unauthorized - Failed to authenticate with Google
 *       500:
 *         description: Server error
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // Redirect to your desired page after successful login
    authController.login(req, res);
  }
);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout a user
 *     tags:
 *       - Authentication
 *     description: Logs out the current user and redirects them to the homepage.
 *     responses:
 *       302:
 *         description: Successfully logged out and redirected to the homepage
 *       500:
 *         description: Server error
 */
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

export default router;
