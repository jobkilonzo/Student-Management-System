import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getMyExamCard, downloadMyExamCard } from "../../controller/exams/controller.examCard.js";

const router = Router();

router.use(authenticateToken);

router.get(
  "/exam-card",
  authorizeRoles("student", "admin", "registrar", "exam_officer"),
  getMyExamCard
);

router.get(
  "/exam-card/download",
  authorizeRoles("student", "admin", "registrar", "exam_officer"),
  downloadMyExamCard
);

export default router;

