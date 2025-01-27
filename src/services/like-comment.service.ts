import prisma from "../libs/prisma";
import redis from "../libs/redis";
import  { CommentResponse, commentSchemaResponse, type Comment } from "../validations/comment.validation";

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
      include: {
        _count: {
          select: { likes: true },
        },
      },
    });

    const commentsWithLikeCount = comments.map((comment) => ({
      ...comment,
      likes: comment._count.likes,
    }));

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
  async likeComment(commentId: string, userId: string): Promise<void> {
    const likeKey = `${LIKE_KEY_PREFIX}${commentId}`;
    const countKey = `${LIKE_COUNT_PREFIX}${commentId}`;

    // Update Redis
    await Promise.all([
      redis.sadd(likeKey, userId),
      redis.incr(countKey),
      redis.expire(likeKey, CACHE_TTL),
      redis.expire(countKey, CACHE_TTL),
    ]);

    // Update database
    await this.updateDatabase(commentId, userId, true);
  }

  async unlikeComment(commentId: string, userId: string): Promise<void> {
    const likeKey = `${LIKE_KEY_PREFIX}${commentId}`;
    const countKey = `${LIKE_COUNT_PREFIX}${commentId}`;

    // Update Redis
    await Promise.all([
      redis.srem(likeKey, userId),
      redis.decr(countKey),
      redis.expire(likeKey, CACHE_TTL),
      redis.expire(countKey, CACHE_TTL),
    ]);

    // Update database
    await this.updateDatabase(commentId, userId, false);
  }

  async getLikes(commentId: string): Promise<number> {
    const countKey = `${LIKE_COUNT_PREFIX}${commentId}`;

    // Try cache first
    const cachedCount = await redis.get(countKey);
    if (cachedCount !== null) {
      return parseInt(cachedCount);
    }

    // If cache miss, get from database
    const count = await prisma.like.count({
      where: { commentId },
    });

    // Update cache
    await redis.setex(countKey, CACHE_TTL, count.toString());

    return count;
  }

  async hasUserLiked(commentId: string, userId: string): Promise<boolean> {
    const key = `${LIKE_KEY_PREFIX}${commentId}`;

    const exists = await redis.sismember(key, userId);
    if (exists !== null) {
      return exists === 1;
    }

    // If cache miss, check database
    const like = await prisma.like.findFirst({
      where: {
        AND: [{ commentId }, { userId }],
      },
    });

    // Update cache if like exists
    if (like) {
      await redis.sadd(key, userId);
      await redis.expire(key, CACHE_TTL);
    }

    return !!like;
  }

  async syncLikesToCache(commentId: string): Promise<void> {
    const likes = await prisma.like.findMany({
      where: { commentId },
    });

    const likeKey = `${LIKE_KEY_PREFIX}${commentId}`;
    const countKey = `${LIKE_COUNT_PREFIX}${commentId}`;

    if (likes.length > 0) {
      // Update like set
      await redis.del(likeKey);
      await redis.sadd(likeKey, ...likes.map((like) => like.userId));

      // Update count
      await redis.setex(countKey, CACHE_TTL, likes.length.toString());

      // Set expiration
      await redis.expire(likeKey, CACHE_TTL);
    }
  }

  private async updateDatabase(
    commentId: string,
    userId: string,
    isLike: boolean
  ): Promise<void> {
    if (isLike) {
      await prisma.like.create({
        data: {
          commentId,
          userId,
        },
      });
    } else {
      await prisma.like.deleteMany({
        where: {
          AND: [{ commentId }, { userId }],
        },
      });
    }
  }
}
