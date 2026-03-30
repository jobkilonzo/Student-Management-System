import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getCollections } from "../../controller/accountant/collections.controller.js";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("accountant"));

router.get("/collections", getCollections);

export default router;
