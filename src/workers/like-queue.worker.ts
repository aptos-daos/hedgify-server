import prisma from "../libs/prisma";
import redis from "../libs/redis";

interface QueueItem {
  operation: 'add' | 'remove';
  commentId: string;
  userId: string;
  id?: string;
  daoId?: string;
}

export class LikeQueueWorker {
  private static readonly QUEUE_KEY = 'like:queue';
  private static readonly BATCH_SIZE = 100;
  private static readonly PROCESS_INTERVAL = Number(process.env.CACHE_TTL) || 5;

  async start(): Promise<void> {
    setInterval(async () => {
      await this.processQueue();
    }, LikeQueueWorker.PROCESS_INTERVAL * 1000);
  }

  private async processQueue(): Promise<void> {
    const batch = await redis.lrange(
      LikeQueueWorker.QUEUE_KEY,
      0,
      LikeQueueWorker.BATCH_SIZE - 1
    );

    if (batch.length === 0) return;

    const operations = batch.map(item => JSON.parse(item) as QueueItem);

    await prisma.$transaction(async (tx) => {
      for (const op of operations) {
        if (op.operation === 'add') {
          await tx.like.create({
            data: {
              id: op.id!,
              commentId: op.commentId,
              userId: op.userId,
              daoId: op.daoId!
            }
          });
        } else {
          await tx.like.deleteMany({
            where: {
              commentId: op.commentId,
              userId: op.userId
            }
          });
        }
      }
    });

    // Remove processed items from queue
    await redis.ltrim(
      LikeQueueWorker.QUEUE_KEY,
      batch.length,
      -1
    );
  }
}