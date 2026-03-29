import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getResults } from "../../controller/student/results.controller.js";

const router = express.Router();

// All results routes require authentication and student role
router.use(authenticateToken);
router.use(authorizeRoles("student"));

// GET /student/results
router.get("/results", getResults);

export default router;