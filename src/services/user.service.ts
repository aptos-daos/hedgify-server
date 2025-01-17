import prisma from "../libs/prisma";

export class UserService {
  async createUser(walletAddress: string) {
    let user = await prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
        },
      });
    }

    return user;
  }

  async getUser(walletAddress: string) {
    return prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });
  }
}
