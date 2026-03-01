import { Router } from "express";
import { createUnit, updateUnit, getUnitsByCourse } from "../../controller/registrar/controller.units.js";

const unitsRouter = Router()

unitsRouter.post('/create', createUnit)
unitsRouter.put('/:id', updateUnit)
unitsRouter.get('/course/:id', getUnitsByCourse)

export default unitsRouter