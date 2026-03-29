// routes/tutor/route.unit.js
import express from "express";
import { getUnitStudents, markUnitAttendance, getTodaysClasses } from "../../controller/tutor/controller.attendance.js";
import { authenticateToken } from "../../middleware/auth.js";

const router = express.Router();

// GET students for a unit
router.get("/unit/:unitId/students", authenticateToken, getUnitStudents);

// POST attendance for a unit
router.post("/unit/:unitId/attendance", authenticateToken, markUnitAttendance);

// GET all units/classes assigned to logged-in tutor
router.get("/today", authenticateToken, getTodaysClasses);

export default router;