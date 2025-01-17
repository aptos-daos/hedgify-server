import { Request, Response } from "express";
import { DAODataSchema } from "../validations/dao.validation";
import prisma from "../libs/prisma";
import { InviteService } from "../services/invite.service";

export class DAOController {
  private inviteService: InviteService;
  constructor() {
    this.inviteService = new InviteService();

    this.createDAO = this.createDAO.bind(this);
    this.removeDAO = this.removeDAO.bind(this);
    this.updateDAO = this.updateDAO.bind(this);
    this.getAllDAOs = this.getAllDAOs.bind(this);
    this.getSingleDAO = this.getSingleDAO.bind(this);
  }
  async createDAO(req: Request, res: Response) {
    try {
      const validInvite = await this.inviteService.validateInvite(req.body.inviteCode);

      if (!validInvite) {
        res.status(400).json({ error: "Invalid invite code" });
        return;
      }

      const daoData = DAODataSchema.parse({
        ...req.body,
        walletAddress: req.user?.walletAddress,
      });
      const newDAO = await prisma.dAO.create({
        data: daoData,
      });
      res.status(201).json({ success: true, data: newDAO });
    } catch (error) {
      res.status(400).json({ error });
    }
  }

  async removeDAO(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (id) {
        await prisma.dAO.delete({
          where: { id },
        });
        res.status(200).json({ message: "DAO removed successfully" });
      }
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  async updateDAO(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const data = await prisma.dAO.update({
        where: { id },
        data: req.body,
      });

      res.status(200).json({ data, message: "DAO Updated Successfully" });
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  async getAllDAOs(_: Request, res: Response) {
    try {
      const data = await prisma.dAO.findMany();
      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  async getSingleDAO(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dao = await prisma.dAO.findUnique({
        where: { id },
      });

      if (dao) {
        res.status(200).json({data: dao});
      } else {
        res.status(404).json({ error: "DAO not found" });
      }
    } catch (error) {
      res.status(500).json({ error });
    }
  }
}
