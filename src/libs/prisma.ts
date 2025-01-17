import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => {
    console.info("⚡️[POSTGRESQL]: CONNECTED TO PRISMA DATABASE");
  })
  .catch((error) => {
    console.error("⚡️[POSTGRESQL]: ERROR CONNECTING TO DATABASE", error);
    process.exit(1);
  });

export default prisma;
