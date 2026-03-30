import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getCourseFees, upsertCourseFee } from "../../controller/accountant/courseFees.controller.js";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("accountant"));

router.get("/course-fees", getCourseFees);
router.post("/course-fees", upsertCourseFee);

export default router;
