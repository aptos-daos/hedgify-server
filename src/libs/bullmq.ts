import { Queue, Worker } from "bullmq";
import prisma from "./prisma";
import connection from "./redis";

export const daoQueue = new Queue("dao-expiry-queue", { connection });

new Worker(
  "dao-expiry-queue",
  async (job) => {
    const { daoId } = job.data;

    // First check if the DAO exists and has undefined treasury address
    const dao = await prisma.dao.findFirst({
      where: {
        id: daoId,
        treasuryAddress: null,
      },
    });

    if (!dao) {
      console.log(
        `${daoId} SKIPPED: DAO either doesn't exist or has a treasury address`
      );
      return;
    }

    await prisma.dao.delete({
      where: {
        id: daoId,
      },
    });

    console.log(`${daoId} REMOVED: DAO with undefined treasury address`);
  },
  { connection }
);
