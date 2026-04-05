import express from "express";
import { authenticateToken, authorizeRoles } from "../../middleware/auth.js";
import { getCollections } from "../../controller/accountant/collections.controller.js";
import { getFeeTypes } from "../../controller/accountant/feeTypes.controller.js";


const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("accountant"));

router.get("/collections", getCollections);
router.get("/fee-types", getFeeTypes);

export default router;
