import prisma from "../libs/prisma";
import redis from "../libs/redis";
import {
  CommentResponse,
  commentSchemaResponse,
  type Comment,
  type Like,
} from "../validations/comment.validation";

const CACHE_TTL = process.env.CACHE_TTL || 3600;
const LIKE_KEY_PREFIX = "like:";
const LIKE_COUNT_PREFIX = "like:count:";
const COMMENT_KEY_PREFIX = "comment:";
const DAO_COMMENTS_KEY_PREFIX = "dao:comments:";

export class CommentService {
  private async cacheComment(comment: Comment): Promise<void> {
    const key = `${COMMENT_KEY_PREFIX}${comment.id}`;
    await redis.setex(key, CACHE_TTL, JSON.stringify(comment));

    // Add to DAO's comment list
    const daoKey = `${DAO_COMMENTS_KEY_PREFIX}${comment.daoId}`;
    await redis.sadd(daoKey, comment.id!);
    await redis.expire(daoKey, CACHE_TTL);
  }

  async createComment(comment: Comment): Promise<Comment> {
    const newComment = await prisma.comment.create({
      data: {
        comment: comment.comment,
        name: comment.name,
        userId: comment.userId,
        daoId: comment.daoId,
        image: comment.image,
      },
    });

    // Cache in Redis
    await this.cacheComment(newComment);

    return newComment;
  }

  async getCommentsByDao(daoId: string): Promise<CommentResponse[]> {
    const daoKey = `${DAO_COMMENTS_KEY_PREFIX}${daoId}`;

    // Try to get comment IDs from cache
    const cachedCommentIds = await redis.smembers(daoKey);

    if (cachedCommentIds.length > 0) {
      // Get all cached comments
      const commentKeys = cachedCommentIds.map(
        (id) => `${COMMENT_KEY_PREFIX}${id}`
      );
      const cachedComments = await redis.mget(commentKeys);

      const validComments = cachedComments
        .filter((comment) => comment !== null)
        .map((comment) => JSON.parse(comment!));

      if (validComments.length === cachedCommentIds.length) {
        return validComments;
      }
    }

    // If cache miss or incomplete, get from database
    const comments = await prisma.comment.findMany({
      where: { daoId },
    });

    const commentsWithLikeCount = comments.map((comment) => {
      const { ...commentWithoutCount } = comment;
      return {
        ...commentWithoutCount,
      };
    });

    // Update cache
    await Promise.all(
      commentsWithLikeCount.map((comment) => this.cacheComment(comment))
    );
    return commentSchemaResponse.array().parse(commentsWithLikeCount);
  }

  async getComment(id: string): Promise<Comment | null> {
    // Try cache first
    const key = `${COMMENT_KEY_PREFIX}${id}`;
    const cachedComment = await redis.get(key);

    if (cachedComment) {
      return JSON.parse(cachedComment);
    }

    // If cache miss, get from database
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (comment) {
      // Update cache
      await this.cacheComment(comment);
    }

    return comment;
  }
}

export class LikeService {
  private async cacheLike(like: Like): Promise<void> {
    const likeKey = `${LIKE_KEY_PREFIX}${like.commentId}:${like.userId}`;
    const likeCountKey = `${LIKE_COUNT_PREFIX}${like.commentId}`;
    
    await redis.setex(likeKey, CACHE_TTL, JSON.stringify(like));
    await redis.incr(likeCountKey);
    await redis.expire(likeCountKey, CACHE_TTL);
  }

  private async removeLikeFromCache(commentId: string, userId: string): Promise<void> {
    const likeKey = `${LIKE_KEY_PREFIX}${commentId}:${userId}`;
    const likeCountKey = `${LIKE_COUNT_PREFIX}${commentId}`;
    
    await redis.del(likeKey);
    await redis.decr(likeCountKey);
  }

  private async queueLikeOperation(like: Like, operation: 'add' | 'remove'): Promise<void> {
    const queueKey = 'like:queue';
    await redis.rpush(queueKey, JSON.stringify({ ...like, operation }));
  }

  async hasUserLiked(commentId: string, userId: string): Promise<boolean> {
    const likeKey = `${LIKE_KEY_PREFIX}${commentId}:${userId}`;
    const exists = await redis.exists(likeKey);
    return exists === 1;
  }

  async getLikes(commentId: string): Promise<number> {
    const likeCountKey = `${LIKE_COUNT_PREFIX}${commentId}`;
    const count = await redis.get(likeCountKey);
    
    if (count !== null) {
      return parseInt(count, 10);
    }

    // If count not in cache, get from database and cache it
    const dbCount = await prisma.like.count({
      where: { commentId }
    });

    await redis.setex(likeCountKey, CACHE_TTL, dbCount.toString());
    return dbCount;
  }

  async likeComment(commentId: string, userId: string): Promise<void> {
    const like: Like = {
      id: crypto.randomUUID(),
      commentId,
      userId,
      daoId: '', // You'll need to get this from the comment
      createdAt: new Date()
    };

    // Update cache immediately
    await this.cacheLike(like);
    
    // Queue database operation
    await this.queueLikeOperation(like, 'add');
  }

  async unlikeComment(commentId: string, userId: string): Promise<void> {
    // Update cache immediately
    await this.removeLikeFromCache(commentId, userId);
    
    // Queue database operation
    await this.queueLikeOperation({ commentId, userId } as Like, 'remove');
  }
}
