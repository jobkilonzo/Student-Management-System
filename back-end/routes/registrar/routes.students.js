import { Router } from "express";
import {
  addStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  importStudentsExcel,
} from "../../controller/registrar/controller.students.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";

import multer from "multer";
const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (
      file.mimetype.includes("excel") ||
      file.mimetype.includes("spreadsheet") ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".csv")
    ) {
      cb(null, "uploads/excel");
    } else {
      cb(null, "uploads/students");
    }
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// All routes require authentication and registrar/admin role
router.use(authenticateToken);
router.use(authorizeRoles("registrar", "admin"));

// Use upload.single("photo") for photo field
router.post("/create", upload.single("photo"), addStudent);
router.get("/", getStudents);
router.get("/:id", getStudentById);
router.put("/:id", upload.single("photo"), updateStudent);
router.delete("/:id", deleteStudent);

// Bulk import
router.post("/import", upload.single("file"), importStudentsExcel);

export default router;