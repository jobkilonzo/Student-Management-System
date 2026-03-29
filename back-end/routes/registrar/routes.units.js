import { Router } from "express";
import { createUnit, updateUnit, getUnitsByCourse, deleteUnit, getAllUnits, getUnitsWithCourseName } from "../../controller/registrar/controller.units.js";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";

const unitsRouter = Router()

// All routes require authentication and registrar/admin role
unitsRouter.use(authenticateToken);
unitsRouter.use(authorizeRoles("registrar", "admin"));

unitsRouter.post('/create', createUnit)
unitsRouter.put('/:id', updateUnit)
unitsRouter.get('/course/:id', getUnitsByCourse)
unitsRouter.get('/', getAllUnits)
unitsRouter.delete('/:id', deleteUnit)
unitsRouter.get('/with-course-name', getUnitsWithCourseName);
export default unitsRouter