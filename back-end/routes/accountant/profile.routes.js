import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getProfile } from "../../controller/accountant/profile.controller.js";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("accountant"));

router.get("/profile", getProfile);

export default router;
