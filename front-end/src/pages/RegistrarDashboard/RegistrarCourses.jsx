import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import RegistrarPageShell from "./RegistrarPageShell";

const RegistrarCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState({ course_code: "", course_name: "" });
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // =============================
  // FETCH ALL COURSES
  // =============================
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await makeRequest.get("/registrar/courses");
        setCourses(res.data);
      } catch (err) {
        console.error("Fetch Courses Error:", err);
      }
    };
    fetchCourses();
  }, []);

  // =============================
  // HANDLE INPUT CHANGE
  // =============================
  const handleChange = (e) =>
    setCourseForm({ ...courseForm, [e.target.name]: e.target.value });

  // =============================
  // ADD OR EDIT COURSE
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (editingCourseId) {
        // EDIT course
        response = await makeRequest.put(`/registrar/courses/${editingCourseId}`, courseForm);
        const fetchRes = await makeRequest.get("/registrar/courses");
        setCourses(fetchRes.data);
        setEditingCourseId(null);
        setShowCourseForm(false);
      } else {
        // CREATE course
        response = await makeRequest.post("/registrar/courses/create", courseForm);
        setCourses([...courses, response.data]);
        navigate(`/registrar/courses/${response.data.course_id}/units`);
      }

      // Reset form
      setCourseForm({ course_code: "", course_name: "" });
    } catch (err) {
      if (err.response) {
        console.error("Server responded with error:", err.response.data);
        alert(`Error: ${err.response.data.message || "Bad Request"}`);
      } else {
        console.error("Network or client error:", err);
        alert("Network or client error. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // SET FORM FOR EDITING
  // =============================
  const handleEdit = (course) => {
    setCourseForm({ course_code: course.course_code, course_name: course.course_name });
    setEditingCourseId(course.course_id);
    setShowCourseForm(true);
  };

  // =============================
  // REDIRECT TO ADD UNITS
  // =============================
  const handleAddUnits = (courseId) => {
    navigate(`/registrar/courses/${courseId}/units`);
  };

  // =============================
  // BACK BUTTON
  // =============================
  return (
    <RegistrarPageShell
      title="Course Management"
      subtitle="Create, refine, and organize programme records before proceeding to the unit-level academic structure."
      actions={
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
            Total courses: {courses.length}
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingCourseId(null);
              setCourseForm({ course_code: "", course_name: "" });
              setShowCourseForm(true);
            }}
            className="rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-700 hover:to-cyan-600"
          >
            Add Course
          </button>
        </div>
      }
    >
      {showCourseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
        <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-sky-100 bg-white p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)]">
          <div className="mb-6 border-b border-sky-100 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Programme Setup
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {editingCourseId ? "Edit Course" : "Add New Course"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep programme names and codes consistent so downstream student, unit, and reporting records stay clean.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Course Code
              </label>
              <input
                name="course_code"
                value={courseForm.course_code}
                onChange={handleChange}
                placeholder="e.g. BIT"
                required
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Course Name
              </label>
              <input
                name="course_name"
                value={courseForm.course_name}
                onChange={handleChange}
                placeholder="Enter full course name"
                required
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg transition hover:from-sky-700 hover:to-cyan-600"
              >
                {loading
                  ? "Saving..."
                  : editingCourseId
                  ? "Update Course"
                  : "Create Course & Add Units"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCourseId(null);
                  setCourseForm({ course_code: "", course_name: "" });
                  setShowCourseForm(false);
                }}
                className="rounded-2xl bg-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
        </div>
      )}

        <section className="rounded-[32px] border border-sky-100 bg-white/95 p-7 shadow-[0_24px_50px_-38px_rgba(14,116,144,0.45)]">
          <div className="mb-6 flex flex-col gap-3 border-b border-sky-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Programme Catalogue
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">All Courses</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review the live programme list and jump directly into unit management when a course is ready.
              </p>
            </div>
            <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
              {courses.length} total
            </div>
          </div>

          <div className="overflow-x-auto rounded-[24px] border border-sky-100">
            <table className="w-full border-collapse">
              <thead className="bg-gradient-to-r from-sky-100 to-cyan-50 text-sky-950">
                <tr>
                  <th className="border-b border-sky-100 px-4 py-3 text-left">Course Code</th>
                  <th className="border-b border-sky-100 px-4 py-3 text-left">Course Name</th>
                  <th className="border-b border-sky-100 px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-slate-500">
                      No courses found.
                    </td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c.course_id} className="border-b border-sky-100 transition hover:bg-sky-50/80">
                      <td className="px-4 py-4 font-semibold text-sky-700">{c.course_code}</td>
                      <td className="px-4 py-4 text-slate-700">{c.course_name}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            onClick={() => handleEdit(c)}
                            className="rounded-lg bg-amber-500 px-3 py-1 text-white transition hover:bg-amber-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAddUnits(c.course_id)}
                            className="rounded-lg bg-sky-600 px-3 py-1 text-white transition hover:bg-sky-700"
                          >
                            Manage Units
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
    </RegistrarPageShell>
  );
};

export default RegistrarCourses;
