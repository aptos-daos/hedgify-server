import { daoQueue } from "../libs/bullmq";
import prisma from "../libs/prisma";
import { DAODataSchema } from "../validations/dao.validation";
import { WhitelistRowSchema } from "../validations/whitelist.validation";
import { MerkleTree } from "./merkle-tree.service";

export class DAOService {
  async createDAO(daoData: any, walletAddress?: string, whitelist: any[] = []) {
    const parsedData = DAODataSchema.parse({ ...daoData, walletAddress });
    const parsedWhitelist = WhitelistRowSchema.array().parse(whitelist);
    const data =
      parsedWhitelist?.length === 0
        ? { ...parsedData }
        : { ...parsedData, whitelist: { create: parsedWhitelist } };

    const createdDao = await prisma.dao.create({
      data,
    });

    await daoQueue.add(
      "expire-dao",
      { daoId: createdDao.id },
      { delay: 15 * 60 * 1000 } // 15 minutes delay
    );

    const tree = new MerkleTree(
      parsedWhitelist.map((item) => ({ ...item, amount: String(item.amount) }))
    );

    return parsedWhitelist?.length === 0
      ? { ...createdDao }
      : { ...createdDao, merkle: { root: tree.getRoot().toString() } };
  }

  async removeDAO(id: string) {
    return prisma.dao.delete({ where: { id } });
  }

  async updateDAO(
    id: string,
    data: any,
    role?: string,
    walletAddress?: string
  ) {
    const where = role === "USER" ? { id, walletAddress } : { id };
    return prisma.dao.update({ where, data });
  }

  async getAllDAOs() {
    return prisma.dao.findMany();
  }

  async getAllDAOsByWallet(walletAddress: string) {
    return prisma.dao.findMany({
      where: { walletAddress },
    });
  }

  async getSingleDAO(id: string, whitelist = false) {
    return prisma.dao.findUnique({
      where: { id },
      include: { comments: false, whitelist },
    });
  }

  async addWhitelist(
    id: string,
    addresses: Array<{
      address: string;
      maxAmount: number;
    }>,
    role?: string,
    walletAddress?: string
  ) {
    const where = role === "USER" ? { id, walletAddress } : { id };
    const dao = await prisma.dao.findUnique({ where });

    if (!dao) throw new Error("DAO not found");

    // return prisma.whitelist.createMany({
    //   data: addresses.map(address => ({
    //     ...address,
    //     daoId: id,
    //   })),
    // });
  }
}
