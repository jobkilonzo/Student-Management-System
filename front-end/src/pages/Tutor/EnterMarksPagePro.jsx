import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const EnterMarksPagePro = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [marks, setMarks] = useState({});
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleEnterMarks = async (unitId) => {
    try {
      const res = await makeRequest.get(`/marks/students/${unitId}`);
      const studentsData = res.data.students || [];
      setStudents(studentsData);
      setSelectedUnit(unitId);

      const initialMarks = {};
      const initialEditing = {};
      studentsData.forEach((student) => {
        initialMarks[student.id] = {
          cat_mark: student.cat_mark || 0,
          exam_mark: student.exam_mark || 0,
          total: student.total || 0,
          grade: student.grade || "-",
        };
        initialEditing[student.id] = true;
      });
      setMarks(initialMarks);
      setEditing(initialEditing);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      alert("Error fetching students.");
    }
  };

  const calculate = (cat, exam) => {
    const total = Number(cat || 0) + Number(exam || 0);
    let grade = "F";
    if (total >= 70) grade = "A";
    else if (total >= 60) grade = "B";
    else if (total >= 50) grade = "C";
    else if (total >= 40) grade = "D";
    return { total, grade };
  };

  const handleChange = (id, field, value) => {
    let cat = field === "cat_mark" ? Number(value) : Number(marks[id]?.cat_mark || 0);
    let exam = field === "exam_mark" ? Number(value) : Number(marks[id]?.exam_mark || 0);

    cat = Math.max(0, Math.min(cat, 30));
    exam = Math.max(0, Math.min(exam, 70));

    const { total, grade } = calculate(cat, exam);

    setMarks((prev) => ({
      ...prev,
      [id]: { cat_mark: cat, exam_mark: exam, total, grade },
    }));
  };

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

  const handleDelete = async (studentId) => {
    if (!selectedUnit || !window.confirm("Delete this student's marks?")) return;
    try {
      await makeRequest.post("/marks/delete", { unitId: selectedUnit, studentId });
      setMarks((prev) => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });
      setStudents((prev) => prev.filter((student) => student.id !== studentId));
      alert("Marks deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete marks.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)]">
        <div className="rounded-3xl border border-sky-100 bg-white px-8 py-6 text-lg font-medium text-slate-600 shadow-sm">
          Loading marks workspace...
        </div>
      </div>
    );
  }

  if (!selectedUnit) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)] p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="relative overflow-hidden rounded-[30px] border border-sky-200/80 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 px-6 py-8 text-white shadow-[0_24px_70px_-35px_rgba(14,116,144,0.58)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.25),_transparent_32%)]" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-50">
                  Assessment Workspace
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight">Enter Marks</h1>
                <p className="mt-3 max-w-2xl text-sm text-sky-50/90 sm:text-base">
                  Select an assigned unit, open the student list for the active stage, and record assessment marks.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/tutor")}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-800 shadow-lg transition hover:bg-sky-50"
                >
                  Back to Tutor Dashboard
                </button>
                <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold text-white">
                  {units.length} units ready
                </div>
              </div>
            </div>
          </section>

          {units.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-center text-slate-500 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
              No units assigned yet.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {units.map((cls) => (
                <div
                  key={cls.unit_id}
                  className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold text-slate-900">{cls.name}</div>
                      <div className="mt-2 text-sm text-slate-600">{cls.course}</div>
                      <div className="mt-1 text-sm text-sky-700">{cls.term || "-"}</div>
                    </div>
                    <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                      Unit
                    </div>
                  </div>
                  <button
                    onClick={() => handleEnterMarks(cls.unit_id)}
                    className="mt-6 w-full rounded-2xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                  >
                    Enter Marks
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)] p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                Mark Entry
              </div>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">Enter Marks</h1>
              <p className="mt-2 text-sm text-slate-600">
                Capture and update assessment scores for the selected active-stage unit.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/tutor")}
                className="rounded-2xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                Tutor Dashboard
              </button>
              <button
                onClick={() => {
                  setSelectedUnit(null);
                  setStudents([]);
                  setMarks({});
                  setEditing({});
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-2xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                Back to Units
              </button>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-700">
                <span className="font-semibold">{students.length}</span> students
              </div>
            </div>
          </div>
        </section>

        {students.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-center text-slate-500 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
            No students found for this unit.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-100/80">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reg No</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">CAT (30)</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Exam (70)</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Grade</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {students.map((student) => (
                      <tr key={student.id} className="bg-white transition hover:bg-sky-50/60">
                        <td className="px-4 py-3 text-slate-700">{student.reg_no}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{student.name}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            className="w-full rounded-xl border border-sky-200 px-3 py-2 text-center outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                            disabled={!editing[student.id]}
                            value={marks[student.id]?.cat_mark ?? ""}
                            onChange={(e) => handleChange(student.id, "cat_mark", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            className="w-full rounded-xl border border-sky-200 px-3 py-2 text-center outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                            disabled={!editing[student.id]}
                            value={marks[student.id]?.exam_mark ?? ""}
                            onChange={(e) => handleChange(student.id, "exam_mark", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-900">{marks[student.id]?.total ?? 0}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            {marks[student.id]?.grade ?? "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            {!editing[student.id] ? (
                              <button
                                onClick={() => setEditing((prev) => ({ ...prev, [student.id]: true }))}
                                className="rounded-xl bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-200"
                              >
                                Edit
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSaveOne(student.id)}
                                className="rounded-xl bg-sky-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-800"
                              >
                                Save
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="rounded-xl bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save All"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnterMarksPagePro;
