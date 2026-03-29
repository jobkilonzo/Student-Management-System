import { Router } from "express";
import {
  addCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  updateCourse,
  getDashboardStats
} from "../../controller/registrar/controller.courses.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";

const coursesRouter = Router();

// All routes require authentication and registrar/admin role
coursesRouter.use(authenticateToken);
coursesRouter.use(authorizeRoles("registrar", "admin"));

coursesRouter.post('/create', addCourse);
coursesRouter.get('/dashboard', getDashboardStats);   // ✅ MOVE THIS UP
coursesRouter.get('/', getCourses);
coursesRouter.get('/:id', getCourseById);
coursesRouter.put('/:id', updateCourse);
coursesRouter.delete('/:id', deleteCourse);

export default coursesRouter;