import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { recordFeePayment } from "../../controller/accountant/payments.controller.js";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("accountant"));

router.post("/payments", recordFeePayment);

export default router;
