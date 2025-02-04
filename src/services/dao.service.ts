import prisma from "../libs/prisma";
import { DAODataSchema } from "../validations/dao.validation";
import { WhitelistRowSchema } from "../validations/whitelist.validation";

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

    return createdDao;
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

  async getSingleDAO(id: string) {
    return prisma.dao.findUnique({
      where: { id },
      include: { comments: false, whitelist: true },
    });
  }

  async checkSlug(slug: string) {
    return prisma.dao.findUnique({ where: { slug } });
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
    //   data: addresses.map(adderss => ({
    //     ...address,
    //     daoId: id,
    //   })),
    // });
  }
}
