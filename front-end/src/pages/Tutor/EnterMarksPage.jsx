import { useState, useEffect } from "react";
import { makeRequest } from "../../../axios";

const EnterMarksPage = () => {
  const [units, setUnits] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [marks, setMarks] = useState({});
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch tutor's assigned units
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await makeRequest.get("/marks/classes");
        setUnits(res.data.units || []);
      } catch (err) {
        console.error("Failed to load units:", err);
        setUnits([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUnits();
  }, []);

  // Fetch students for a selected unit
  const handleEnterMarks = async (unitId) => {
    try {
      const res = await makeRequest.get(`/marks/students/${unitId}`);
      const studentsData = res.data.students || [];
      setStudents(studentsData);
      setSelectedUnit(unitId);

      // Initialize marks and editing state
      const initialMarks = {};
      const initialEditing = {};
      studentsData.forEach((s) => {
        initialMarks[s.id] = {
          cat_mark: s.cat_mark || 0,
          exam_mark: s.exam_mark || 0,
          total: s.total || 0,
          grade: s.grade || "-",
        };
        initialEditing[s.id] = true; // editable by default
      });
      setMarks(initialMarks);
      setEditing(initialEditing);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      alert("Error fetching students.");
    }
  };

  // Calculate total and grade
  const calculate = (cat, exam) => {
    const total = Number(cat || 0) + Number(exam || 0);
    let grade = "F";
    if (total >= 70) grade = "A";
    else if (total >= 60) grade = "B";
    else if (total >= 50) grade = "C";
    else if (total >= 40) grade = "D";
    return { total, grade };
  };

  // Handle input change
  const handleChange = (id, field, value) => {
    let cat = field === "cat_mark" ? Number(value) : Number(marks[id]?.cat_mark || 0);
    let exam = field === "exam_mark" ? Number(value) : Number(marks[id]?.exam_mark || 0);

    // Clamp values
    cat = Math.max(0, Math.min(cat, 30));
    exam = Math.max(0, Math.min(exam, 70));

    const { total, grade } = calculate(cat, exam);

    setMarks((prev) => ({
      ...prev,
      [id]: { cat_mark: cat, exam_mark: exam, total, grade },
    }));
  };

  // Save all marks
  const handleSaveAll = async () => {
    if (!selectedUnit) return;
    setSaving(true);
    try {
      await makeRequest.post("/marks/save", {
        unitId: selectedUnit,
        marks: Object.keys(marks).map((id) => ({
          student_id: id,
          cat_mark: marks[id].cat_mark,
          exam_mark: marks[id].exam_mark,
        })),
      });
      alert("Marks saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save marks.");
    } finally {
      setSaving(false);
    }
  };

  // Save single mark
  const handleSaveOne = async (studentId) => {
    try {
      await makeRequest.post("/marks/save", {
        unitId: selectedUnit,
        marks: [
          {
            student_id: studentId,
            cat_mark: marks[studentId].cat_mark,
            exam_mark: marks[studentId].exam_mark,
          },
        ],
      });
      alert("Mark saved successfully!");
      setEditing((prev) => ({ ...prev, [studentId]: false }));
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save mark.");
    }
  };

  // Delete mark
  const handleDelete = async (studentId) => {
    if (!selectedUnit || !window.confirm("Delete this student's marks?")) return;
    try {
      await makeRequest.post("/marks/delete", { unitId: selectedUnit, studentId });

      // Remove student from state
      setMarks((prev) => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      alert("Marks deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete marks.");
    }
  };

  if (loading) return <div className="p-8 text-gray-600">Loading units...</div>;

  // Display units list
  if (!selectedUnit)
    return (
      <div className="p-8 min-h-screen bg-gray-50">
        <h1 className="text-3xl font-bold mb-6">Enter Marks</h1>
        {units.length === 0 ? (
          <div className="text-gray-500">No units assigned yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {units.map((cls) => (
              <div
                key={cls.unit_id}
                className="p-4 bg-white shadow rounded flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-lg">{cls.name}</div>
                  <div className="text-sm text-gray-500">{cls.course}</div>
                  <div className="text-sm text-gray-400">{cls.term}</div>
                </div>
                <button
                  onClick={() => handleEnterMarks(cls.unit_id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Enter Marks
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );

  // Display students marks table
  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-2">Enter Marks</h1>

      <button
        onClick={() => {
          setSelectedUnit(null);
          setStudents([]);
          setMarks({});
          setEditing({});
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="mb-4 text-blue-600 hover:underline flex items-center"
      >
        ← Back
      </button>

      <div className="mb-2 font-semibold">Total Students: {students.length}</div>

      {students.length === 0 ? (
        <div className="text-gray-500">No students found for this unit.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Reg No</th>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">CAT (30)</th>
                  <th className="px-4 py-2 border">Exam (70)</th>
                  <th className="px-4 py-2 border">Total</th>
                  <th className="px-4 py-2 border">Grade</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="odd:bg-white even:bg-gray-50">
                    <td className="px-4 py-2 border">{s.reg_no}</td>
                    <td className="px-4 py-2 border">{s.name}</td>
                    <td className="px-4 py-2 border">
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1 text-center"
                        disabled={!editing[s.id]}
                        value={marks[s.id]?.cat_mark ?? ""}
                        onChange={(e) => handleChange(s.id, "cat_mark", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1 text-center"
                        disabled={!editing[s.id]}
                        value={marks[s.id]?.exam_mark ?? ""}
                        onChange={(e) => handleChange(s.id, "exam_mark", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 border text-center">{marks[s.id]?.total ?? 0}</td>
                    <td className="px-4 py-2 border text-center">{marks[s.id]?.grade ?? "-"}</td>
                    <td className="px-4 py-2 border text-center flex gap-1 justify-center">
                      {!editing[s.id] ? (
                        <button
                          onClick={() => setEditing((prev) => ({ ...prev, [s.id]: true }))}
                          className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSaveOne(s.id)}
                          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Save All
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EnterMarksPage;