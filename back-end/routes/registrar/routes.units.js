import { Router } from "express";
import { createUnit, updateUnit, getUnitsByCourse, deleteUnit, getAllUnits, getUnitsWithCourseName } from "../../controller/registrar/controller.units.js";

const unitsRouter = Router()

unitsRouter.post('/create', createUnit)
unitsRouter.put('/:id', updateUnit)
unitsRouter.get('/course/:id', getUnitsByCourse)
unitsRouter.get('/', getAllUnits)
unitsRouter.delete('/:id', deleteUnit)
unitsRouter.get('/with-course-name', getUnitsWithCourseName);
export default unitsRouter