import { Request, Response } from "express";
import { DAOService } from "../services/dao.service";
import { InviteService } from "../services/invite.service";
import prisma from "../libs/prisma";
import { MerkleTree } from "../services/merkle-tree.service";

export class DAOController {
  private readonly daoService: DAOService;
  private readonly inviteService: InviteService;

  constructor() {
    this.daoService = new DAOService();
    this.inviteService = new InviteService();

    // Bind all methods to ensure correct 'this' context
    this.createDAO = this.createDAO.bind(this);
    this.removeDAO = this.removeDAO.bind(this);
    this.updateDAO = this.updateDAO.bind(this);
    this.getAllDAOs = this.getAllDAOs.bind(this);
    this.getSingleDAO = this.getSingleDAO.bind(this);
    this.addWhitelist = this.addWhitelist.bind(this);
    this.getMerkleTree = this.getMerkleTree.bind(this);
  }

  async createDAO(req: Request, res: Response) {
    try {
      const validInvite = await this.inviteService.getInvite(
        req.body.inviteCode
      );
      if (!validInvite) {
        res.status(400).json({ error: "Invalid invite code" });
        return;
      }
      const data = await this.daoService.createDAO(
        req.body,
        req.user?.walletAddress,
        req.body.whitelist || []
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ error });
    }
  }

  async removeDAO(req: Request, res: Response) {
    try {
      await this.daoService.removeDAO(req.params.id);
      res.status(200).json({ message: "DAO removed successfully" });
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  async updateDAO(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedDAO = await this.daoService.updateDAO(
        id,
        req.body,
        req.user?.role,
        req.user?.walletAddress
      );
      res
        .status(200)
        .json({ data: updatedDAO, message: "DAO Updated Successfully" });
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  async getAllDAOs(req: Request, res: Response) {
    try {
      if (req.body && "wallet" in req.body) {
        const wallet = req.body.wallet;
        const data = await this.daoService.getAllDAOsByWallet(wallet);
        res.status(200).json({ data });
        return;
      }

      const data = await this.daoService.getAllDAOs();
      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  async getSingleDAO(req: Request, res: Response) {
    const { address, amount } = req.body ?? {};
    try {
      const dao = await this.daoService.getSingleDAO(req.params.id, !!address);
      if (!dao) {
        res.status(404).json({ error: "DAO not found" });
        return;
      }

      if (address && amount) {
        const limit = dao?.whitelist.find(
          (item) => item.address === address
        )?.amount;
        const tree = new MerkleTree(
          dao?.whitelist.map((item) => ({
            ...item,
            amount: String(item.amount),
          }))
        );
        const proof = tree.getProof(address, amount);
        const root = tree.getRoot();
        res
          .status(200)
          .json({ data: { ...dao, merkle: { root, proof, limit } } });
        return;
      }

      res.status(200).json({ data: dao });
    } catch (error) {
      res.status(500).json({ error });
    }
  }

  async addWhitelist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const whitelistArr = req.body;

      if (!Array.isArray(whitelistArr)) {
        res
          .status(400)
          .json({ error: "Input must be an array of whitelist entries" });
        return;
      }

      const whitelist = await this.daoService.addWhitelist(
        id,
        whitelistArr,
        req.user?.walletAddress
      );

      res.status(200).json({ data: whitelist, message: "Whitelist Added" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  }

  async getMerkleTree(req: Request, res: Response) {
    const { id } = req.params; // DAO ID
    const addresses = await prisma.whitelist.findMany({
      where: {
        daoId: id,
      },
    });

    if (addresses.length === 0) {
      // TODO: Handle error
      res.status(400).json({ error: "No addresses found" });
      return;
    }
    const merkleTree = new MerkleTree(
      addresses.map((add) => ({ ...add, amount: add.amount.toString() }))
    );

    res.json({
      data: {
        root: merkleTree.getRoot().toString(),
        leaves: merkleTree.getLeaves().map((item) => item.toString()),
      },
    });
  }
}
