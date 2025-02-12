import express from "express";
const router = express.Router();
import usersController from "../controllers/users_controller";
import { authMiddleware } from "../controllers/auth_controller";
import { upload } from "../utils/multer";

router.put("/:id", authMiddleware, upload.single("profilePicture"), usersController.updateUser.bind(usersController));
router.put("/sell/:id", authMiddleware, usersController.sellProduct.bind(usersController));

export default router;
