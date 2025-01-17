import { Request, Response } from "express";
import { JwtService, AptosVerificationService } from "../services";
import { InviteService } from "../services/invite.service";
import { UserService } from "../services/user.service";

export class AuthController {
  private jwtService: JwtService;
  private aptosVerificationService: AptosVerificationService;
  private inviteService: InviteService;
  private userService: UserService;

  constructor() {
    this.jwtService = new JwtService();
    this.aptosVerificationService = new AptosVerificationService();
    this.inviteService = new InviteService();
    this.userService = new UserService();

    this.signin = this.signin.bind(this);
    this.requestMessage = this.requestMessage.bind(this);
  }

  async signin(req: Request, res: Response) {
    try {
      const { account, message, signature } = req.body;

      if (!account || !message || !signature) {
        res.status(400).json({
          message: "Account, Message and Signature are required to login.",
        });
        return;
      }

      const resp = await this.aptosVerificationService.verifySignature(
        message,
        signature,
        account
      );

      if (!resp) {
        res.status(400).json({
          error: "Message verification failed.",
        });
        return;
      }

      const user = await this.userService.createUser(account);

      const token = await this.jwtService.sign(account);

      res.status(200).json({
        message: "success",
        data: {
          token: token,
          walletAddress: user?.walletAddress,
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
}
