import express from "express";
import {
  generateStudentTranscript,
  getAvailableLevels,
  getAvailableTerms,
} from "../../controller/student/transcript.controller.js";
import { authenticateToken } from "../../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Generate transcript for current student
router.get("/transcript", generateStudentTranscript);

// Get available levels for current student's course
router.get("/available-levels", getAvailableLevels);

// Get available terms for current student
router.get("/available-terms/:level", getAvailableTerms);

export default router;
