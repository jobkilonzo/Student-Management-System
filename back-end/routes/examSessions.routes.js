import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import {
  listExamSessions,
  getExamSession,
  createExamSession,
  updateExamSession,
  deleteExamSession,
} from "../controller/exams/controller.examSessions.js";

const router = Router();

router.use(authenticateToken);

// List and create (admin/registrar)
router.get("/", authorizeRoles("admin", "registrar", "exam_officer"), listExamSessions);
router.post("/", authorizeRoles("admin", "registrar"), createExamSession);

// Single resource
router.get("/:id", authorizeRoles("admin", "registrar", "exam_officer"), getExamSession);
router.put("/:id", authorizeRoles("admin", "registrar"), updateExamSession);
router.delete("/:id", authorizeRoles("admin", "registrar"), deleteExamSession);

export default router;
