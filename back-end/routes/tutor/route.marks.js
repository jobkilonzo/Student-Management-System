import express from "express";
import {
  getTutorClasses,
  getStudentsForMarks,
  saveMarks,
  resetMark
} from "../../controller/tutor/controller.marks.js";

import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";

const router = express.Router();

// Apply auth + role check to all routes
router.use(authenticateToken, authorizeRoles('tutor'));

// Fetch tutor's assigned classes
router.get("/classes", getTutorClasses);

// Fetch students + existing marks for a unit
// Removed :term param because term is now taken from students table
router.get("/students/:unitId", getStudentsForMarks);

// Save marks (bulk or single) – transaction-safe
router.post("/save", saveMarks);

// Reset a student's mark to 0 – transaction-safe
router.post("/reset", resetMark);

export default router;