import { Router } from "express";
import { LikeCommentController } from "../controller/comment.controller";
import { validateResponse } from "../middlewares/validate.middleware";
import { auth } from "../middlewares/auth.middleware";
import twitter from "../middlewares/twitter.middleware";

const router = Router();
const commentController = new LikeCommentController();

router.use(validateResponse);

// Add comment to DAO
router.post("/", commentController.addComment);

// Get all comments for a DAO
router.get("/:daoId", commentController.getComments);

// Like Routes
// Like a comment
router.post("/like-toogle/:commentId", commentController.toggleLikeComment);

// Get likes for a comment
router.get("/:commentId/likes", commentController.getCommentLikes);

export default router;