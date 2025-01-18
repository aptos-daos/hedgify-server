import { error } from "console";
import { Request, Response, NextFunction } from "express";

const twitterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.body;
  if (!userId) {
    res.json({ error: "Twitter Havn't Logged in Yet" });
  }
  next();
};

export default twitterMiddleware;
