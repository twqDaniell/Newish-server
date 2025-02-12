import express from "express";
const router = express.Router();
import commentsController from "../controllers/comments_controller";
import { authMiddleware } from "../controllers/auth_controller";

router.post("/", authMiddleware, commentsController.createComment.bind(commentsController));
router.get("/", commentsController.getAllComments.bind(commentsController));
router.get("/:id", commentsController.getCommentById.bind(commentsController));
router.put("/:id", authMiddleware, commentsController.updateComment.bind(commentsController));
router.delete("/:id", authMiddleware, commentsController.deleteComment.bind(commentsController));

export default router;
