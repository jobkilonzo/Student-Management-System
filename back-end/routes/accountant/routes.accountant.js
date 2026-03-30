import express from "express";
import profileRoutes from "./profile.routes.js";
import overviewRoutes from "./overview.routes.js";
import balancesRoutes from "./balances.routes.js";
import collectionsRoutes from "./collections.routes.js";
import reportsRoutes from "./reports.routes.js";
import courseFeesRoutes from "./courseFees.routes.js";
import paymentsRoutes from "./payments.routes.js";

const router = express.Router();

router.use("/", profileRoutes);
router.use("/", overviewRoutes);
router.use("/", balancesRoutes);
router.use("/", collectionsRoutes);
router.use("/", reportsRoutes);
router.use("/", courseFeesRoutes);
router.use("/", paymentsRoutes);

export default router;
