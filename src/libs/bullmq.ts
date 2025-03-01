import { Queue, Worker } from "bullmq";
import prisma from "./prisma";
import connection from "./redis";

export const daoQueue = new Queue("dao-expiry-queue", { connection });

new Worker(
  "dao-expiry-queue",
  async (job) => {
    const { daoId } = job.data;

    await prisma.dao.delete({
      where: {
        id: daoId,
        treasuryAddress: undefined,
      },
    });

    console.log(`${daoId} REMOVED`);
  },
  { connection }
);
