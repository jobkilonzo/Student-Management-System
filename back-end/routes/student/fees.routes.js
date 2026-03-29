import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getFeeBalance } from "../../controller/student/fees.controller.js";

const router = express.Router();

// All fees routes require authentication and student role
router.use(authenticateToken);
router.use(authorizeRoles("student"));

// GET /student/fees
router.get("/fees", getFeeBalance);

export default router;