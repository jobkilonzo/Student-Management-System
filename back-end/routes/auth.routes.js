import { Router } from "express";
import {
  login,
  registerUser,
  getUsers,
  me,
  updateMe,
  updateUserByAdmin,
  deleteUserByAdmin,
} from "../controller/auth.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.get("/me", authenticateToken, me);
router.put("/me", authenticateToken, updateMe);

// Updated: allow both admin and registrar to fetch users
router.get("/users", authenticateToken, authorizeRoles("admin", "registrar"), getUsers);

router.put("/users/:id", authenticateToken, authorizeRoles("admin"), updateUserByAdmin);
router.delete("/users/:id", authenticateToken, authorizeRoles("admin"), deleteUserByAdmin);

// Only admin can register users
router.post("/register", authenticateToken, authorizeRoles("admin"), registerUser);

export default router;