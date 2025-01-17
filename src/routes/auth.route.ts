import express from "express";
import { validateResponse } from "../middlewares/validate.middleware";
import { AuthController } from "../controller/auth.controller";

const router = express.Router();
const authController = new AuthController();

router.use(validateResponse);

// TODO - Add routes for auth
router.post("/", authController.signin);
router.post("/request-message", authController.requestMessage);

export default router;