import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import {
  listRetakeEligible,
  listSupplementaryEligible,
} from "../../controller/exams/controller.eligibility.js";

const router = Router();

router.use(authenticateToken);

router.get(
  "/retake",
  authorizeRoles("admin", "registrar", "exam_officer", "tutor"),
  listRetakeEligible
);

router.get(
  "/supplementary",
  authorizeRoles("admin", "registrar", "exam_officer", "tutor"),
  listSupplementaryEligible
);

export default router;

