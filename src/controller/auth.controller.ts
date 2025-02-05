import { Request, Response } from "express";
import { JwtService, AptosVerificationService } from "../services";
import { UserService } from "../services/user.service";

export class AuthController {
  private jwtService: JwtService;
  private aptosVerificationService: AptosVerificationService;
  private userService: UserService;

  constructor() {
    this.jwtService = new JwtService();
    this.aptosVerificationService = new AptosVerificationService();
    this.userService = new UserService();

    this.signin = this.signin.bind(this);
    this.requestMessage = this.requestMessage.bind(this);
    this.adminSignature = this.adminSignature.bind(this);
  }

  async signin(req: Request, res: Response) {
    try {
      const { address, message, signature, publicKey } = req.body;

      if (!address || !message || !signature || !publicKey) {
        res.status(400).json({
          message:
            "Address, Message, Public Key and Signature are required to login.",
        });
        return;
      }

      const isValid = await this.aptosVerificationService.verifySignature(
        message,
        signature,
        publicKey
      );

      if (!isValid) {
        res.status(400).json({
          error: "Message verification failed.",
        });
        return;
      }

      const user = await this.userService.createUser(address);

      const token = await this.jwtService.sign(address);

      res.status(200).json({
        message: "success",
        data: {
          token: token,
          walletAddress: user?.walletAddress,
          ...(user.role === "ADMIN" && { role: user.role.toLowerCase() }),
        },
      });
    } catch (error: any) {
      res.status(200).json({ error });
    }
  }

  requestMessage(req: Request, res: Response) {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      res.status(400).json({
        message: "Wallet address not found",
      });
      return;
    }

    const message = this.aptosVerificationService.requestMessage(walletAddress);
    if (message.message === "") {
      res.status(400).json({
        message: "Message generation failed.",
      });
      return;
    }
    res.status(200).json({
      message: "success",
      data: message,
    });
  }

  async adminSignature(req: Request, res: Response) {
    const { contractAddress, sender, receiver, claimNumber } = req.body || {};
    const signature = this.aptosVerificationService.adminSignature(
      contractAddress,
      sender,
      receiver,
      claimNumber
    );
    res.json({ data: { signature } });
  }
}
