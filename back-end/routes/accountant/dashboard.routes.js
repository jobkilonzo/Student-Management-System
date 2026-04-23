import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getDashboard, getStudentLedger } from "../../controller/accountant/dashboard.controller.js";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("accountant"));

router.get("/dashboard", getDashboard);
router.get("/ledger/:student_id", getStudentLedger);

export default router;

