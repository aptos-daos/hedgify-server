import { Router } from "express";
import { DAOController } from "../controller/dao.controller";
import { validateResponse } from "../middlewares/validate.middleware";
import { auth, adminAuth } from "../middlewares/auth.middleware";
import commentRoute from "./comment.dao.route";

const router = Router();
const daoController = new DAOController();

// Middlewares
router.use(validateResponse);
router.use("/comments", commentRoute);

// Create DAO
router.post("/", auth, daoController.createDAO);

// Add Whitelist
router.post("/whitelist/:id", auth, daoController.addWhitelist);

// Delete DAO
router.delete("/:id", adminAuth, daoController.removeDAO);

// Update DAO
router.put("/:id", auth, daoController.updateDAO);

// Get all DAOs
router.get("/", daoController.getAllDAOs);

// Get Merkle Tree
router.get("/merkle/:id", daoController.getMerkleTree);

// Get single DAO
router.get("/:id", daoController.getSingleDAO);


export default router;
