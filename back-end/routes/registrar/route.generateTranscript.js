import express from "express";
import { generateTranscript } from "../../controller/registrar/controller.generateTranscript.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";

const router = express.Router();

// All routes require authentication and registrar/admin role
router.use(authenticateToken);
router.use(authorizeRoles("registrar", "admin"));

// Generate transcript
router.get("/transcript/:studentId", generateTranscript);

export default router;