import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import {
  generateTimetable,
  listTimetables,
  getTimetableDetails,
  deleteTimetable,
  updateTimetableEntry,
  getStudentExamTimetable,
} from "../../controller/exams/controller.timetable.js";

const router = Router();

router.use(authenticateToken);

const forceCategory =
  (category) =>
  (req, res, next) => {
    req.body = { ...(req.body || {}), category, department: category };
    next();
  };

// ========================================
// Registrar & Exam Officer Routes
// ========================================

// Generate timetable (Technical or Business)
router.post(
  "/",
  authorizeRoles("admin", "registrar", "exam_officer"),
  generateTimetable
);

// Generate timetable (separate KNEC-style endpoints)
router.post(
  "/technical",
  authorizeRoles("admin", "registrar", "exam_officer"),
  forceCategory("Technical"),
  generateTimetable
);
router.post(
  "/business",
  authorizeRoles("admin", "registrar", "exam_officer"),
  forceCategory("Business"),
  generateTimetable
);

// List all timetables
router.get(
  "/",
  authorizeRoles("admin", "registrar", "exam_officer", "tutor"),
  listTimetables
);

// List timetables by category (keeps existing list endpoint intact)
router.get(
  "/technical",
  authorizeRoles("admin", "registrar", "exam_officer", "tutor"),
  (req, _res, next) => {
    req.category = "Technical";
    next();
  },
  listTimetables
);
router.get(
  "/business",
  authorizeRoles("admin", "registrar", "exam_officer", "tutor"),
  (req, _res, next) => {
    req.category = "Business";
    next();
  },
  listTimetables
);

// Get timetable details with entries
router.get(
  "/:id",
  authorizeRoles("admin", "registrar", "exam_officer", "tutor"),
  getTimetableDetails
);

// Update individual timetable entry (reschedule exam)
router.put(
  "/entry/:id",
  authorizeRoles("admin", "registrar", "exam_officer"),
  updateTimetableEntry
);

// Delete timetable
router.delete(
  "/:id",
  authorizeRoles("admin", "registrar", "exam_officer"),
  deleteTimetable
);

// ========================================
// Student Routes
// ========================================

// Get student's exam timetable
router.get(
  "/student/:studentId",
  authorizeRoles("admin", "registrar", "student", "exam_officer"),
  getStudentExamTimetable
);

export default router;
