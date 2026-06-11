import express from "express";
import profileRoutes from "./profile.routes.js";
import unitsRoutes from "./units.routes.js";
import feesRoutes from "./fees.routes.js";
import resultsRoutes from "./results.routes.js";
import marksRoutes from "./marks.routes.js";
import examCardRoutes from "./examCard.routes.js";
import transcriptRoutes from "./transcript.routes.js";

const router = express.Router();

// Mount separate route modules
router.use("/", profileRoutes);
router.use("/", unitsRoutes);
router.use("/", feesRoutes);
router.use("/", resultsRoutes);
router.use("/", marksRoutes);
router.use("/", examCardRoutes);
router.use("/", transcriptRoutes);

export default router;
