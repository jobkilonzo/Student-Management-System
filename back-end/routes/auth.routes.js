import { Router } from "express";
import {
  login,
  logout,
  registerUser,
  getUsers,
  getDeletedUsers,
  restoreUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  permanentDeleteUser,
  getAuditLogs,
  getCurrentUser,
  getUsersWithStudentDetails,
  getUsersByRole,
  searchUsers,
  getUserStatistics,
  getUserById,
  checkUserDeleted
} from "../controller/auth.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

// Middleware to check if user is deleted (applies to all protected routes)
const checkUserStatus = [authenticateToken, checkUserDeleted];

/* =========================
   PUBLIC ROUTES
========================= */
router.post("/login", login);

/* =========================
   PROTECTED ROUTES (with user deletion check)
========================= */
// Auth routes
router.post("/logout", checkUserStatus, logout);
router.get("/me", checkUserStatus, getCurrentUser);

// User registration - Admin only
router.post("/register", authenticateToken, authorizeRoles("admin"), registerUser);

// Get all active users
router.get("/users", authenticateToken, authorizeRoles("admin", "registrar"), checkUserDeleted, getUsers);

// Get users with student details
router.get("/users/with-student-details", authenticateToken, authorizeRoles("admin", "registrar"), checkUserDeleted, getUsersWithStudentDetails);

// Get users by role
router.get("/users/role/:role", authenticateToken, authorizeRoles("admin", "registrar"), checkUserDeleted, getUsersByRole);

// Search users
router.get("/users/search", authenticateToken, authorizeRoles("admin", "registrar"), checkUserDeleted, searchUsers);

// Get user statistics
router.get("/users/statistics", authenticateToken, authorizeRoles("admin"), checkUserDeleted, getUserStatistics);

// ✅ MOVED THIS UP - Get soft-deleted users (trash) - MUST come before /users/:id
router.get("/users/deleted", authenticateToken, authorizeRoles("admin"), getDeletedUsers);

// ✅ MOVED THIS UP - Restore deleted user - MUST come before /users/:id
router.put("/users/restore/:id", authenticateToken, authorizeRoles("admin"), restoreUserByAdmin);

// ⚠️ This generic route should come LAST - it will catch anything not matched above
router.get("/users/:id", authenticateToken, authorizeRoles("admin", "registrar"), checkUserDeleted, getUserById);

// Update a user
router.put("/users/:id", authenticateToken, authorizeRoles("admin"), checkUserDeleted, updateUserByAdmin);

// Soft delete a user
router.delete("/users/:id", authenticateToken, authorizeRoles("admin"), checkUserDeleted, deleteUserByAdmin);

// Permanently delete a user (hard delete)
router.delete("/users/:id/permanent", authenticateToken, authorizeRoles("admin"), checkUserDeleted, permanentDeleteUser);

// Audit logs
router.get("/audit-logs", authenticateToken, authorizeRoles("admin"), getAuditLogs);

export default router;