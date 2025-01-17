import jwt from "jsonwebtoken";
import { UserService } from "./user.service";

type Role = "ADMIN" | "USER";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN as string) || "24h";

export interface JwtPayload {
  id: string;
  walletAddress: string;
  role: Role;
}

export class JwtService {
  private readonly secret = JWT_SECRET;
  private readonly userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async sign(wallet: string) {
    const user = await this.userService.getUser(wallet);
    if(!user) {
      new Error("User not found");
      return;
    }

    const obj = {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role
    }
    const token = jwt.sign(obj, this.secret, { expiresIn: JWT_EXPIRES_IN });
    return token;
  }

  verify(token: string): JwtPayload {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    return decoded;
  }
}
