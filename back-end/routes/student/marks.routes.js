import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getStudentMarks, updateStudentMarks } from "../../controller/student/marks.controller.js";

const router = express.Router();

// All marks routes require authentication and student role
router.use(authenticateToken);
router.use(authorizeRoles("student"));

// GET /student/marks - get all units with marks
router.get("/marks", getStudentMarks);

// PUT /student/marks - update marks for a unit
router.put("/marks", updateStudentMarks);

export default router;