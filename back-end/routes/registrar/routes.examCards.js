import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import {
  getStudentExamCard,
  listExamCardStudents,
  downloadStudentExamCard,
} from "../../controller/exams/controller.examCard.js";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles("registrar", "admin", "exam_officer"));

router.get("/", listExamCardStudents);
router.get("/:studentId", getStudentExamCard);
router.get("/:studentId/download", downloadStudentExamCard);

export default router;

