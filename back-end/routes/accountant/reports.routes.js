import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getReports } from "../../controller/accountant/reports.controller.js";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("accountant"));

router.get("/reports", getReports);

export default router;
