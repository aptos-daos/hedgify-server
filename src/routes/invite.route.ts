import express from "express";
import { InviteController } from "../controller/invite.controller";
import { adminAuth, auth } from "../middlewares/auth.middleware";
import { validateResponse } from "../middlewares/validate.middleware";

const router = express.Router();
const inviteController = new InviteController();

router.use(validateResponse);

router.get("/", adminAuth, inviteController.listInvite);

router.post("/add", adminAuth, inviteController.insertInviteCode);
// router.post("/:code", auth, inviteController.validateInvite);

// router.delete("/:code", adminAuth, inviteController.removeInvite);

export default router;