import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getStudentBalances } from "../../controller/accountant/balances.controller.js";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("accountant"));

router.get("/student-balances", getStudentBalances);

export default router;
