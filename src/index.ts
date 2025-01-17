import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import morgan from "morgan";
import "dotenv/config";

import daoRoute from "./routes/dao.route";
import authRoute from "./routes/auth.route";
import inviteRoute from "./routes/invite.route";

const app: Express = express();
const port = process.env.SERVER_PORT || 8080;

const CLIENT_URL = process.env.CLIENT_URL || "*";

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);
app.use(helmet());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use("/api/v1/dao", daoRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/invite", inviteRoute);

app.get("/healthcheck", (_: Request, res: Response) => {
  const now = new Date();
  res.json({
    success: true,
    timestamp: now.toISOString(),
    uptime: process.uptime(),
  });
});

app.use((_: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
