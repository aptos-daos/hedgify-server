import express from "express";
import { validateResponse } from "../middlewares/validate.middleware";
import { AuthController } from "../controller/auth.controller";
import { auth } from "../middlewares/auth.middleware";

const router = express.Router();
const authController = new AuthController();

router.use(validateResponse);

router.post("/", authController.signin);
router.post("/request-message", authController.requestMessage);
router.post("/admin", auth, authController.adminSignature);

export default router;