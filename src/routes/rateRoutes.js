import { Router } from "express";
import { hit, usage } from "../controllers/rateController.js";

const router = Router();

router.post("/api/hit", hit);
router.get("/api/usage/:userId", usage);

export default router;
