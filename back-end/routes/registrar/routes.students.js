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

// All routes require authentication
router.use(authenticateToken);

// Students list and details may also be viewed by exam officers for transcript generation
router.get("/", authorizeRoles("registrar", "admin", "exam_officer"), getStudents);
router.get("/:id", authorizeRoles("registrar", "admin", "exam_officer"), getStudentById);

// Registrar/admin-only student management
router.post("/create", authorizeRoles("registrar", "admin"), upload.single("photo"), addStudent);
router.put("/:id", authorizeRoles("registrar", "admin"), upload.single("photo"), updateStudent);
router.delete("/:id", authorizeRoles("registrar", "admin"), deleteStudent);

// Bulk import
router.post("/import", authorizeRoles("registrar", "admin"), upload.single("file"), importStudentsExcel);

export default router;