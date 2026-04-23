import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import {
  listExamSchedules,
  createExamSchedule,
  updateExamSchedule,
  deleteExamSchedule,
} from "../controller/exams/controller.exams.js";

const router = Router();

router.use(authenticateToken);

// View schedules (staff)
router.get("/", authorizeRoles("admin", "registrar", "tutor", "exam_officer"), listExamSchedules);

// Manage schedules
router.post("/", authorizeRoles("admin", "registrar", "exam_officer"), createExamSchedule);
router.put("/:id", authorizeRoles("admin", "registrar", "exam_officer"), updateExamSchedule);
router.delete("/:id", authorizeRoles("admin", "registrar", "exam_officer"), deleteExamSchedule);

export default router;

