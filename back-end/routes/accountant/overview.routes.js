import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getOverview } from "../../controller/accountant/overview.controller.js";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("accountant"));

router.get("/overview", getOverview);

export default router;
