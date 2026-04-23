import express from "express";
import {
  getTutorClasses,
  getStudentsForMarks,
  saveMarks,
  resetMark,
  uploadMarksFile,
  exportMarksCsv,
  releaseMarks,
  getUnitMarksSummary,
  getCourseMarksSummary,
  getStudentMarksSummary
} from "../../controller/tutor/controller.marks.js";

import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import multer from "multer";
import fs from "fs";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync("uploads/excel", { recursive: true });
    } catch {
      // ignore
    }
    cb(null, "uploads/excel");
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Apply auth + role check to all routes
router.use(authenticateToken, authorizeRoles("tutor", "registrar", "exam_officer"));

// Fetch tutor's assigned classes
router.get("/classes", getTutorClasses);

// Fetch students + existing marks for a unit
// Removed :term param because term is now taken from students table
router.get("/students/:unitId", getStudentsForMarks);

// Save marks (bulk or single) – transaction-safe
router.post("/save", saveMarks);

// Reset a student's mark to 0 – transaction-safe
router.post("/reset", resetMark);

router.post(
  "/upload",
  authorizeRoles("registrar", "exam_officer"),
  upload.single("file"),
  uploadMarksFile
);

router.get("/export/:unitId.csv", exportMarksCsv);

router.post("/release", authorizeRoles("registrar", "exam_officer"), releaseMarks);

// Summaries (class/course/student)
router.get("/summary/unit/:unitId", authorizeRoles("admin", "registrar", "tutor", "exam_officer"), getUnitMarksSummary);
router.get("/summary/course/:courseId", authorizeRoles("admin", "registrar", "tutor", "exam_officer"), getCourseMarksSummary);
router.get("/summary/student/:studentId", authorizeRoles("admin", "registrar", "tutor", "exam_officer"), getStudentMarksSummary);

export default router;
