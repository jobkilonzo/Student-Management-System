import express from "express";
import { generateTranscript } from "../../controller/registrar/controller.generateTranscript.js";
const router = express.Router();

// Generate transcript
router.get("/transcript/:studentId", generateTranscript);

export default router;