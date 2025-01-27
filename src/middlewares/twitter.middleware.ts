import { Request, Response, NextFunction } from "express";

const twitterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.body;
  if (!userId) {
    res.json({ error: "Twitter Havn't Logged in Yet" });
    return;
  }
  next();
};

export default twitterMiddleware;
