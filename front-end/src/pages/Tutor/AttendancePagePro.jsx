import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const AttendancePagePro = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [marking, setMarking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await makeRequest.get("/attendance/today");
        setClasses(res.data.classes || []);
      } catch (err) {
        console.error("Failed to fetch classes:", err);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleMarkAttendance = async (cls) => {
    setSelectedClass(cls);
    setMarking(true);
    setStudents([]);

    try {
      const res = await makeRequest.get(`/attendance/unit/${cls.unit_id}/students`);
      const studentsWithStatus = (res.data.students || []).map((student) => ({
        ...student,
        status: student.status || "Absent",
      }));
      setStudents(studentsWithStatus);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudents([]);
    }
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClass) return;

    const studentsToSubmit = students.map((student) => ({
      student_id: student.id,
      status: student.status,
    }));

    if (!studentsToSubmit.length) {
      alert("No students selected for attendance.");
      return;
    }

    try {
      setSubmitting(true);
      await makeRequest.post(`/attendance/unit/${selectedClass.unit_id}/attendance`, {
        students: studentsToSubmit,
      });
      alert("Attendance submitted successfully!");
      setMarking(false);
      setSelectedClass(null);
    } catch (err) {
      console.error("Failed to submit attendance:", err);
      alert("Error submitting attendance. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)]">
        <div className="rounded-3xl border border-sky-100 bg-white px-8 py-6 text-lg font-medium text-slate-600 shadow-sm">
          Loading attendance workspace...
        </div>
      </div>
    );
  }

  if (!marking) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)] p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="relative overflow-hidden rounded-[30px] border border-sky-200/80 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 px-6 py-8 text-white shadow-[0_24px_70px_-35px_rgba(14,116,144,0.58)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.25),_transparent_32%)]" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-50">
                  Attendance Workspace
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight">Mark Attendance</h1>
                <p className="mt-3 max-w-2xl text-sm text-sky-50/90 sm:text-base">
                  Review your scheduled classes, open the student list, and record attendance from one professional tutor page.
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
                  {classes.length} classes
                </div>
              </div>
            </div>
          </section>

          {classes.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-center text-slate-500 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
              No classes scheduled for today.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {classes.map((cls) => (
                <div
                  key={cls.assignment_id || cls.unit_id}
                  className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold text-slate-900">{cls.subject}</div>
                      <div className="mt-2 text-sm text-slate-600">{cls.room || "N/A"} - {cls.year || "N/A"}</div>
                    </div>
                    <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                      Class
                    </div>
                  </div>
                  <button
                    className="mt-6 w-full rounded-2xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                    onClick={() => handleMarkAttendance(cls)}
                  >
                    Mark Attendance
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
                Live Attendance
              </div>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">Students in {selectedClass?.subject}</h1>
              <p className="mt-2 text-sm text-slate-600">
                Mark each student as present or absent, then submit the register for this class.
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
                  setMarking(false);
                  setSelectedClass(null);
                  setStudents([]);
                }}
                className="rounded-2xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                Back to Classes
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
              <div className="overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-100/80">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reg No</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Student</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {students.map((student) => (
                      <tr key={student.id || student.reg_no} className="bg-white transition hover:bg-sky-50/60">
                        <td className="px-4 py-4 text-slate-700">{student.reg_no}</td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-3">
                            <label className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${student.status === "Present" ? "border-sky-300 bg-sky-100 text-sky-700" : "border-slate-200 bg-white text-slate-600"}`}>
                              <input
                                type="radio"
                                name={`status-${student.id}`}
                                value="Present"
                                checked={student.status === "Present"}
                                onChange={() =>
                                  setStudents((prev) =>
                                    prev.map((s) => (s.id === student.id ? { ...s, status: "Present" } : s))
                                  )
                                }
                                className="mr-2"
                              />
                              Present
                            </label>
                            <label className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${student.status === "Absent" ? "border-rose-300 bg-rose-100 text-rose-700" : "border-slate-200 bg-white text-slate-600"}`}>
                              <input
                                type="radio"
                                name={`status-${student.id}`}
                                value="Absent"
                                checked={student.status === "Absent"}
                                onChange={() =>
                                  setStudents((prev) =>
                                    prev.map((s) => (s.id === student.id ? { ...s, status: "Absent" } : s))
                                  )
                                }
                                className="mr-2"
                              />
                              Absent
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  setMarking(false);
                  setSelectedClass(null);
                  setStudents([]);
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-50"
                onClick={handleSubmitAttendance}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Attendance"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendancePagePro;
