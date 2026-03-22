import express from "express";
import {
  assignUnit,
  getAssignments,
  getAssignmentsWithControls,
  updateControl,
  unassignUnit,
  checkIfUserIsTutor
} from "../../controller/registrar/controller.unitAssignmentController.js";
import { authenticateToken } from "../../middleware/auth.js"; // your file

const unitAssignment = express.Router();

// Assign unit
unitAssignment.post("/assign-unit", assignUnit);

// Get all assignments (without controls)
unitAssignment.get("/", getAssignments);

// Get assignments WITH control flags
unitAssignment.get("/with-controls", getAssignmentsWithControls);

// Toggle marks entry / edit/delete permissions
unitAssignment.post("/update-control", updateControl);
unitAssignment.post("/unassign", unassignUnit);// GET tutors assigned to registrar
unitAssignment.get("/check-is-tutor", authenticateToken, checkIfUserIsTutor);
export default unitAssignment;