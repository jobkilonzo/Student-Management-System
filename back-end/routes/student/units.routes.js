import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getAssignedUnits } from "../../controller/student/units.controller.js";

const router = express.Router();

// All units routes require authentication and student role
router.use(authenticateToken);
router.use(authorizeRoles("student"));

// GET /student/units
router.get("/units", getAssignedUnits);

export default router;