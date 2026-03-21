import { Router } from "express";
import {
  addCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  updateCourse,
  getDashboardStats
} from "../../controller/registrar/controller.courses.js";

const coursesRouter = Router();

coursesRouter.post('/create', addCourse);
coursesRouter.get('/dashboard', getDashboardStats);   // ✅ MOVE THIS UP
coursesRouter.get('/', getCourses);
coursesRouter.get('/:id', getCourseById);
coursesRouter.put('/:id', updateCourse);
coursesRouter.delete('/:id', deleteCourse);

export default coursesRouter;