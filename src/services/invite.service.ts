import prisma from "../libs/prisma";
import { Role } from "@prisma/client";
import { addDays } from "date-fns";
import { generateInviteCode } from "../utils/invite-code";

const DEFAULT_EXPIRY_DAYS = 90;

export class InviteService {
  async createInvite(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user?.role !== Role.ADMIN) {
      throw new Error("Only admins can create invite codes");
    }

    const invite = await prisma.inviteCode.create({
      data: {
        code: generateInviteCode(),
        expiresAt: addDays(new Date(), DEFAULT_EXPIRY_DAYS),
        userId,
      },
    });

    return invite;
  }

  async getInvite(code: string): Promise<any> {
    const invite = await prisma.inviteCode.findUnique({
      where: { code },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.expiresAt < new Date()) {
      throw new Error("Invite has expired");
    }

    return invite;
  }

  async validateInvite(code?: string): Promise<boolean> {
    if (!code) {
      throw new Error("Invite code is required");
    }
    
    const invite = await prisma.inviteCode.findUnique({
      where: { code },
    });

    if (!invite) {
      throw new Error("Invalid invite code");
    }

    if (invite.expiresAt < new Date()) {
      throw new Error("Invite code has expired");
    }

    return true;
  }
}