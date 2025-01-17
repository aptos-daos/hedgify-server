import { Request, Response } from "express";
import { InviteService } from "../services/invite.service";
import prisma from "../libs/prisma";
import { addDays } from "date-fns";

const DEFAULT_EXPIRY_DAYS = 7;

export class InviteController {
  private inviteService: InviteService;
  constructor() {
    this.inviteService = new InviteService();

    this.listInvite = this.listInvite.bind(this);
    this.removeInvite = this.removeInvite.bind(this);
    this.validateInvite = this.validateInvite.bind(this);
    this.createInvite = this.createInvite.bind(this);
    this.insertInviteCode = this.insertInviteCode.bind(this);
  }

  async listInvite(req: Request, res: Response) {
    try {
      const invites = await prisma.inviteCode.findMany();
      res.status(200).json(invites);
    } catch (error) {
      console.error("Error listing invites:", error);
      res.status(500).json({ error: "Failed to list invites" });
    }
  }

  async removeInvite(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedInvite = await prisma.inviteCode.delete({
        where: {
          id: String(id),
        },
      });
      res.status(200).json(deletedInvite);
    } catch (error) {
      console.error("Error removing invite:", error);
      res.status(500).json({ error: "Failed to remove invite" });
    }
  }

  async validateInvite(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const response = await this.inviteService.validateInvite(code);
      if (!response) {
        res.status(400).json({ error: "Failed to validate invite" });
      }
      res.status(200).json({ message: "Token is Verified" });
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  async createInvite(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      const invite = await this.inviteService.createInvite(userId);
      res.status(200).json(invite);
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(500).json({ error: "Failed to create invite" });
    }
  }

  async insertInviteCode(req: Request, res: Response) {
    try {
      if (!req.body) {
        res
          .status(400)
          .json({ success: false, error: "Request body is missing" });
        return;
      }
      const { code } = req.body;
      if (!code) {
        res.status(400).json({ success: false, error: "Invite Code Required" });
        return;
      }
      const invite = await prisma.inviteCode.create({
        data: {
          code,
          expiresAt: addDays(new Date(), DEFAULT_EXPIRY_DAYS),
        },
      });
      res.status(201).json({ data: invite.code });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error });
    }
  }
}
