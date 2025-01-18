import { Router } from "express";
import { DAOController } from "../controller/dao.controller";
import { validateResponse } from "../middlewares/validate.middleware";
import { auth, adminAuth } from "../middlewares/auth.middleware";
import commentRoute from "./comment.dao.route";

const router = Router();
const daoController = new DAOController();

router.use(validateResponse);
router.use("/comments", commentRoute);

// Create DAO
router.post("/", auth, daoController.createDAO);

// Delete DAO
router.delete("/:id", adminAuth, daoController.removeDAO);

// Update DAO
router.put("/:id", adminAuth, daoController.updateDAO);

// Get all DAOs
router.get("", daoController.getAllDAOs);

// Get single DAO
router.get("/:id", daoController.getSingleDAO);


export default router;
