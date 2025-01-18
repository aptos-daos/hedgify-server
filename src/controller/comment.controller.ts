import { Request, Response } from "express";
import { LikeService, CommentService } from "../services/like-comment.service";
import { commentSchema } from "../validations/comment.validation";
import { error } from "console";

export class LikeCommentController {
  private likeService: LikeService;
  private commentService: CommentService;

  constructor() {
    this.likeService = new LikeService();
    this.commentService = new CommentService();
  }

  /**
   * Toggle like on a comment
   */
  toggleLikeComment = async (req: Request, res: Response) => {
    try {
      const { id: daoId, commentId } = req.params;
      const { userId } = req.body;

      // Check if user has already liked the comment
      const hasLiked = await this.likeService.hasUserLiked(commentId, userId);

      if (hasLiked) {
        await this.likeService.unlikeComment(commentId, userId);
      } else {
        await this.likeService.likeComment(commentId, userId);
      }

      // Get updated like count
      const likeCount = await this.likeService.getLikes(commentId);

      res.status(200).json({
        success: true,
        message: hasLiked
          ? "Comment unliked successfully"
          : "Comment liked successfully",
        data: {
          commentId,
          daoId,
          likeCount,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      res.json({ error: "Failed to toggle like on comment" });
    }
  };

  /**
   * Get likes count for a comment
   */
  getCommentLikes = async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const likeCount = await this.likeService.getLikes(commentId);

      res.status(200).json({
        success: true,
        data: {
          commentId,
          likeCount,
        },
      });
    } catch (error) {
      throw new Error("Failed to get comment likes");
    }
  };

  getComment = async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;

      if (!commentId) {
        res.json({ error: "No Comment Id Found" });
      }
      const comment = await this.commentService.getComment(commentId);
      res.json({ success: true, data: comment });
    } catch (e: any) {
      res.json({ error: e.message });
    }
  };

  getComments = async (req: Request, res: Response) => {
    try {
      const { daoId } = req.params;
      const comments = await this.commentService.getCommentsByDao(daoId);

      res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (error) {
      throw new Error("Failed to get comments");
    }
  };

  /**
   * Add a comment
   */
  addComment = async (req: Request, res: Response) => {
    try {
      const comment = commentSchema.parse(req.body);
      const newComment = await this.commentService.createComment(comment);

      res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: newComment,
      });
    } catch (error) {
      throw new Error("Failed to add comment");
    }
  };
}
