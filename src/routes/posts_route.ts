import express from "express";
const router = express.Router();
import postsController from "../controllers/posts_controller";
import { authMiddleware } from "../controllers/auth_controller";
import { upload } from "../utils/multer";

router.post("/", authMiddleware, upload.single("picture"), postsController.createPost.bind(postsController));
router.get("/:id", postsController.getPostById.bind(postsController));
router.get("/", authMiddleware, postsController.getAllPosts.bind(postsController));
router.put(
    "/:id",
    authMiddleware,
    (req, res, next) => {
        console.log(req.headers["content-type"]);
      if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
        upload.single("picture")(req, res, next);
      } else {
        next();
      }
    },
    postsController.updatePost.bind(postsController)
  );
router.delete("/:id", authMiddleware, postsController.deletePost.bind(postsController));
router.put("/:id/like", authMiddleware, postsController.likePost.bind(postsController));

export default router;
