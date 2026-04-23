import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getCourses } from "../../controller/registrar/controller.courses.js";
import {
  registerStudentBySecretary,
  getStudentsBySecretary,
  updateStudentBySecretary,
  assignUnitsToStudent,
  getStudentUnits,
  exportStudentListCsv,
  exportStudentListPdfData,
  sendNotificationToStudent,
  getStudentNotificationHistory,
  listStudentNotifications,
  feeReminderToStudent,
  getSecretaryAuditLogs,
  getSecretaryDashboard,
  getStudentByIdForSecretary,
} from "../../controller/secretary/controller.secretary.js";
import { getStudentBalances } from "../../controller/accountant/balances.controller.js";
import { recordFeePayment } from "../../controller/accountant/payments.controller.js";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles("secretary"));

router.get("/dashboard", getSecretaryDashboard);

// Courses (reuse registrar controller)
router.get("/courses", getCourses);

// Students
router.post("/students/register", registerStudentBySecretary);
router.get("/students", getStudentsBySecretary);
router.get("/students/:id", getStudentByIdForSecretary);
router.put("/students/:id", updateStudentBySecretary);

// Units assignment
router.post("/students/:id/assign-units", assignUnitsToStudent);
router.get("/students/:id/units", getStudentUnits);

// Reports
router.get("/export/csv", exportStudentListCsv);
router.get("/export/pdf", exportStudentListPdfData);

// Notifications
router.post("/students/:id/notifications", sendNotificationToStudent);
router.get("/students/:id/notifications", getStudentNotificationHistory);
router.get("/notifications", listStudentNotifications);

// Fee reminder trigger (no amounts)
router.post("/fee-reminder/:student_id", feeReminderToStudent);

// Audit logs (read-only)
router.get("/audit-logs", getSecretaryAuditLogs);

// Fee payments (reuse accountant functionality)
router.get("/student-balances", getStudentBalances);
router.post("/payments", recordFeePayment);

export default router;
