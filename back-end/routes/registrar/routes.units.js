import { Router } from "express";
import { createUnit, updateUnit, getUnitsByCourse, deleteUnit, getAllUnits } from "../../controller/registrar/controller.units.js";

const unitsRouter = Router()

unitsRouter.post('/create', createUnit)
unitsRouter.put('/:id', updateUnit)
unitsRouter.get('/course/:id', getUnitsByCourse)
unitsRouter.get('/', getAllUnits)
unitsRouter.delete('/:id', deleteUnit)

export default unitsRouter