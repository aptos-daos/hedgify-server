import prisma from "../libs/prisma";
import redis from "../libs/redis";

// TODO: IMPLEMENT REDIS CACHE, GET ARRAY OF IDs and REMOVE INSTEAD OF REMOVING ALL
export class DaoCleanupWorker {
  private static readonly PROCESS_INTERVAL =
    Number(process.env.DAO_CLEANUP_INTERVAL) || 3600;
  private static readonly BATCH_SIZE = 100; // Process DAOs in batches

  async start(): Promise<void> {
    setInterval(async () => {
      await this.processNullTreasuryDaos();
    }, DaoCleanupWorker.PROCESS_INTERVAL * 1000);
  }

  private async processNullTreasuryDaos(): Promise<void> {
    try {
      const daosToDelete = await prisma.dao.findMany({
        where: {
          treasuryAddress: null,
        },
        take: DaoCleanupWorker.BATCH_SIZE,
      });

      if (daosToDelete.length === 0) return;

      await prisma.$transaction(async (tx) => {
        for (const dao of daosToDelete) {
          await tx.comment.deleteMany({
            where: {
              daoId: dao.id,
            },
          });

          await tx.whitelist.deleteMany({
            where: {
              daoId: dao.id,
            },
          });

          await tx.dao.delete({
            where: {
              id: dao.id,
            },
          });
        }
      });

      console.log(
        `Processed and deleted ${daosToDelete.length} DAOs with null treasuryAddress`
      );
    } catch (error) {
      console.error("Error processing null treasury DAOs:", error);
    }
  }
}
