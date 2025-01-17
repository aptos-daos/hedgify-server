import { Request, Response, NextFunction } from "express";
import { JwtPayload, JwtService } from "../services/jwt.service";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const jwtService = new JwtService();

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "No Authentication Token provided",
      });
      return;
    }

    req.user = jwtService.verify(token);
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export const adminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) =>
  auth(req, res, async () => {
    try {
      if (req.user?.role !== "ADMIN") {
        res.status(403).json({
          success: false,
          message: "Admin access required",
        });
        return;
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(403).json({
        success: false,
        message: "Admin authentication failed",
      });
    }
  });
