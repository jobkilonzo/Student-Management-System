import { useState, useEffect } from "react";
import { makeRequest } from "../../../axios";

const AssignUnitsPage = () => {
  const [tutors, setTutors] = useState([]);
  const [units, setUnits] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedTutor, setSelectedTutor] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch data including mark controls
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [tutorsRes, unitsRes, assignmentsRes] = await Promise.all([
          makeRequest.get("auth/users?tutor=true"),
          makeRequest.get("registrar/units/with-course-name"),
          makeRequest.get("registrar/unit-assignments/with-controls"),
        ]);

        // Exclude Admin and Accountant roles from tutors
        setTutors(
          (tutorsRes.data?.users || []).filter(
            (u) => !["Admin", "Accountant"].includes(u.role)
          )
        );

        setUnits(unitsRes.data?.units || []);
        setAssignments(assignmentsRes.data?.assignments || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check if a unit is already assigned to any tutor
  const isUnitAssigned = (unitId, module) => {
    return assignments.some(
      (a) => a.unit_id === unitId && a.module === module
    );
  };

  // Assign a unit to a tutor
  const handleAssign = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedTutor || !selectedUnit) {
      setError("Please select a tutor and a unit");
      return;
    }

    const unitObj = units.find((u) => u.unit_id === Number(selectedUnit));

    if (isUnitAssigned(unitObj.unit_id, unitObj.module)) {
      setError("This unit is already assigned to a tutor");
      return;
    }

    try {
      await makeRequest.post("registrar/unit-assignments/assign-unit", {
        tutorId: selectedTutor,
        unitId: unitObj.unit_id,
        courseId: unitObj.course_id,
        module: unitObj.module,
      });

      setSuccess("Unit assigned successfully!");

      const tutorObj = tutors.find((t) => t.id === Number(selectedTutor));

      setAssignments((prev) => [
        {
          tutor_id: Number(selectedTutor),
          unit_id: unitObj.unit_id,
          tutorName: tutorObj?.name,
          unit_name: unitObj.unit_name,
          course_name: unitObj.course_name,
          module: unitObj.module,
          can_enter_marks: false,
          can_edit_delete: false,
        },
        ...prev,
      ]);

      setSelectedTutor("");
      setSelectedUnit("");
    } catch (err) {
      console.error("Error assigning unit:", err);
      setError(err?.response?.data?.message || "Failed to assign unit");
    }
  };

  // Toggle enable/disable flags for marks entry or edit/delete
  const handleToggle = async (assignment, field) => {
    try {
      const updatedValue = !assignment[field];
      await makeRequest.post("registrar/unit-assignments/update-control", {
        tutorId: assignment.tutor_id,
        unitId: assignment.unit_id,
        field,
        value: updatedValue ? 1 : 0,
      });

      setAssignments((prev) =>
        prev.map((a) =>
          a.tutor_id === assignment.tutor_id && a.unit_id === assignment.unit_id
            ? { ...a, [field]: updatedValue }
            : a
        )
      );
    } catch (err) {
      console.error("Toggle error:", err);
      setError("Failed to update control");
    }
  };

  if (loading) return <div className="p-8 text-gray-600">Loading data...</div>;

  return (
    <div className="min-h-screen bg-indigo-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Assign Units to Tutors</h1>

      {error && (
        <div className="mb-4 bg-red-100 px-4 py-2 rounded text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-100 px-4 py-2 rounded text-green-700">
          {success}
        </div>
      )}

      {/* Assignment Form */}
      <form onSubmit={handleAssign} className="flex flex-col md:flex-row gap-4 mb-4">
        <select
          value={selectedTutor}
          onChange={(e) => setSelectedTutor(e.target.value)}
          className="border rounded px-4 py-2"
          required
        >
          <option value="">Select a Tutor</option>
          {tutors.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>

        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="border rounded px-4 py-2"
          required
        >
          <option value="">Select a Unit</option>
          {units
            // Remove units already assigned to any tutor
            .filter((u) => !isUnitAssigned(u.unit_id, u.module))
            .map((u) => (
              <option key={u.unit_id} value={u.unit_id}>
                {u.unit_name} - {u.course_name} ({u.module})
              </option>
            ))}
        </select>

        <button
          type="submit"
          disabled={!selectedUnit || !selectedTutor}
          className={`px-4 py-2 rounded text-white ${
            !selectedUnit || !selectedTutor ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
          }`}
        >
          Assign Unit
        </button>
      </form>

      {/* Assignments Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Tutor</th>
              <th className="px-4 py-2 border">Unit</th>
              <th className="px-4 py-2 border">Course</th>
              <th className="px-4 py-2 border">Module</th>
              <th className="px-4 py-2 border text-center">Enable Marks Entry</th>
              <th className="px-4 py-2 border text-center">Enable Edit/Delete</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No unit assignments found
                </td>
              </tr>
            ) : (
              assignments.map((a, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-2 border">{a.tutorName}</td>
                  <td className="px-4 py-2 border">{a.unit_name}</td>
                  <td className="px-4 py-2 border">{a.course_name}</td>
                  <td className="px-4 py-2 border">{a.module}</td>
                  <td className="px-4 py-2 border text-center">
                    <input
                      type="checkbox"
                      checked={a.can_enter_marks}
                      onChange={() => handleToggle(a, "can_enter_marks")}
                    />
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <input
                      type="checkbox"
                      checked={a.can_edit_delete}
                      onChange={() => handleToggle(a, "can_edit_delete")}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignUnitsPage;