import express from "express";
import {
  getTutorClasses,
  getStudentsForMarks,
  saveMarks,
  deleteMark
} from "../../controller/tutor/controller.marks.js";

import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";

const router = express.Router();

// Apply auth + role check to all routes
router.use(authenticateToken, authorizeRoles('tutor'));

// Fetch tutor's assigned classes
router.get("/classes", getTutorClasses);

// Fetch students + existing marks for a unit
router.get("/students/:unitId", getStudentsForMarks);

// Save marks (bulk or single) – transaction-safe
router.post("/save", saveMarks);

// Delete a student's mark – transaction-safe
router.post("/delete", deleteMark);

export default router;