import express from "express";
const router = express.Router();
import authController from "../controllers/auth_controller";
import { upload } from "../utils/multer";
const passport = require("passport");

router.post("/register", upload.single("profilePicture"), authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.get("/google", (req, res, next) => {
  console.log("Redirecting to Google OAuth...");
  next();
}, passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    authController.login(req, res);
  }
);
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

export default router;
