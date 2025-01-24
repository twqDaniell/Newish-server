import express from "express";
const router = express.Router();
import usersController from "../controllers/users_controller";
import { authMiddleware } from "../controllers/auth_controller";
import { upload } from "../utils/multer";

// /**
//  * @swagger
//  * /users/{id}:
//  *   put:
//  *     summary: Update a user
//  *     tags:
//  *       - Users
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: The ID of the user to update
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               username:
//  *                 type: string
//  *                 example: "Updated User Name"
//  *               email:
//  *                 type: string
//  *                 example: "Updated User Email"
//  *               phoneNumber:
//  *                 type: string
//  *                 example: "Updated User Phone Number"
//  *              profilePicture:
//  *                type: string
//  *               example: "Updated User Profile Picture"
//  *     responses:
//  *       200:
//  *         description: User updated successfully
//  *       401:
//  *         description: Unauthorized
//  *       404:
//  *         description: User not found
//  */
router.put("/:id", authMiddleware, upload.single("profilePicture"), usersController.updateUser.bind(usersController));

router.put("/sell/:id", authMiddleware, usersController.sellProduct.bind(usersController));

export default router;
