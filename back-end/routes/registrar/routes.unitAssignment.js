import express from "express";
import {
  assignUnit,
  getAssignments,
  getAssignmentsWithControls,
  updateControl
} from "../../controller/registrar/controller.unitAssignmentController.js";

const unitAssignment = express.Router();

// Assign unit
unitAssignment.post("/assign-unit", assignUnit);

// Get all assignments (without controls)
unitAssignment.get("/", getAssignments);

// Get assignments WITH control flags
unitAssignment.get("/with-controls", getAssignmentsWithControls);

// Toggle marks entry / edit/delete permissions
unitAssignment.post("/update-control", updateControl);

export default unitAssignment;