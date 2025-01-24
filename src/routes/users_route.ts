import express from "express";
const router = express.Router();
import usersController from "../controllers/users_controller";
import { authMiddleware } from "../controllers/auth_controller";
import { upload } from "../utils/multer";

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "Updated User Name"
 *               email:
 *                 type: string
 *                 example: "Updated User Email"
 *               phoneNumber:
 *                 type: string
 *                 example: "Updated User Phone Number"
 *              profilePicture:
 *                type: string
 *               example: "Updated User Profile Picture"
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put("/:id", authMiddleware, upload.single("profilePicture"), usersController.updateUser.bind(usersController));

/**
 * @swagger
 * /users/sell/{id}:
 *   put:
 *     summary: Increment sold count for a user
 *     tags:
 *       - Users
 *     description: Allows an authenticated user to increment the sold count for a specific user by their ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user whose sold count is to be incremented.
 *         schema:
 *           type: string
 *           example: "63c69f3f6b3e2b001c5e9c8f"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sold count incremented successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product sold count updated successfully"
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: Invalid request or user ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid user ID"
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access Denied"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Something went wrong"
 */
router.put("/sell/:id", authMiddleware, usersController.sellProduct.bind(usersController));

export default router;
