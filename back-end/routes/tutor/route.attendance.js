import express from "express";
import {
  getUnitStudents,
  markUnitAttendance,
  getTodaysClasses,
  getDailyAttendance,
  downloadAllAttendance
} from "../../controller/tutor/controller.attendance.js";
import { authenticateToken } from "../../middleware/auth.js";

const router = express.Router();

// GET students for a unit
router.get("/unit/:unitId/students", authenticateToken, getUnitStudents);

// POST attendance for a unit
router.post("/unit/:unitId/attendance", authenticateToken, markUnitAttendance);

// GET all units/classes assigned to logged-in tutor
router.get("/today", authenticateToken, getTodaysClasses);
// GET all attendance CSV download (must come first)
router.get("/unit/:unitId/attendance/download", authenticateToken, downloadAllAttendance);

// GET daily attendance for a unit (optional date)
router.get("/unit/:unitId/attendance/:date", authenticateToken, getDailyAttendance);

export default router;