import { Router } from "express";
import { addCourse, deleteCourse, getCourseById, getCourses, updateCourse } from "../../controller/registrar/controller.courses.js";

const coursesRouter = Router()
coursesRouter.post('/create', addCourse)
coursesRouter.get('/', getCourses)
coursesRouter.get('/:id', getCourseById)
coursesRouter.put('/:id', updateCourse)
coursesRouter.delete('/create', deleteCourse)


// units

export default coursesRouter