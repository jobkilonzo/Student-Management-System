import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getStudentBalances, updateStudentFees } from "../../controller/accountant/balances.controller.js";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("accountant", "secretary"));

router.get("/student-balances", getStudentBalances);
router.put("/student-balances/:studentId/fees", authorizeRoles("accountant"), updateStudentFees);

export default router;
