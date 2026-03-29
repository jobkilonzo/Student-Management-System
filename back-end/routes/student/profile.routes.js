import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getProfile, updateProfile } from "../../controller/student/profile.controller.js";

const router = express.Router();

// All profile routes require authentication and student role
router.use(authenticateToken);
router.use(authorizeRoles("student"));

// GET /student/profile
router.get("/profile", getProfile);

// PUT /student/profile
router.put("/profile", updateProfile);

export default router;