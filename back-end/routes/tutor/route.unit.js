// routes/tutor.routes.js
import express from "express";

import { getAssignedUnits } from "../../controller/tutor/controller.units.js";

import { authenticateToken } from "../../middleware/auth.js";


const router = express.Router();

router.get("/assigned-units", authenticateToken, getAssignedUnits);

export default router;