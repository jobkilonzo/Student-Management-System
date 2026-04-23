import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import RegistrarPageShell from "./RegistrarPageShell";

const RegistrarCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState({
    course_code: "",
    course_name: "",
    course_type: "",
  });
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Course type options
  const courseTypeOptions = [
    { value: "non_modular", label: "Non Modular" },
    { value: "stage_based", label: "Stage Based" },
    { value: "modular", label: "Modular" },
    { value: "level_based", label: "Level Based" },
    { value: "grade_based", label: "Grade Based" },
  ];

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
        alert("Failed to fetch courses. Please refresh the page.");
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
    
    // Validate course type is selected
    if (!courseForm.course_type) {
      alert("Please select a course type");
      return;
    }
    
    setLoading(true);

    try {
      if (editingCourseId) {
        // EDIT course
        await makeRequest.put(`/registrar/courses/${editingCourseId}`, courseForm);
        // Refresh the courses list
        const fetchRes = await makeRequest.get("/registrar/courses");
        setCourses(fetchRes.data);
        alert("Course updated successfully!");
        setEditingCourseId(null);
        setShowCourseForm(false);
      } else {
        // CREATE course
        const response = await makeRequest.post("/registrar/courses/create", courseForm);
        
        // Check if response has the course_id
        if (response.data && response.data.course_id) {
          // Navigate to add units for the new course
          navigate(`/registrar/courses/${response.data.course_id}/units`);
        } else {
          // Fallback: just refresh the list
          const fetchRes = await makeRequest.get("/registrar/courses");
          setCourses(fetchRes.data);
          setShowCourseForm(false);
          alert("Course created successfully!");
        }
      }

      // Reset form
      setCourseForm({
        course_code: "",
        course_name: "",
        course_type: "",
      });
    } catch (err) {
      if (err.response) {
        console.error("Server responded with error:", err.response.data);
        alert(`Error: ${err.response.data.error || err.response.data.message || "Bad Request"}`);
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
    setCourseForm({
      course_code: course.course_code,
      course_name: course.course_name,
      course_type: course.course_type || "",
    });
    setEditingCourseId(course.course_id);
    setShowCourseForm(true);
  };

  // =============================
  // DELETE COURSE
  // =============================
  const handleDelete = async (courseId, courseCode) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete course "${courseCode}"? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    setDeleteLoading(true);
    try {
      await makeRequest.delete(`/registrar/courses/${courseId}`);
      // Refresh the courses list
      const fetchRes = await makeRequest.get("/registrar/courses");
      setCourses(fetchRes.data);
      alert("Course deleted successfully!");
    } catch (err) {
      if (err.response) {
        console.error("Delete error:", err.response.data);
        alert(`Error: ${err.response.data.error || "Failed to delete course"}`);
      } else {
        console.error("Network error:", err);
        alert("Network error. Please try again.");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // =============================
  // REDIRECT TO ADD UNITS
  // =============================
  const handleAddUnits = (courseId) => {
    navigate(`/registrar/courses/${courseId}/units`);
  };

  // Format course type for display
  const formatCourseType = (type) => {
    if (!type) return "Not Specified";
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

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
              setCourseForm({
                course_code: "",
                course_name: "",
                course_type: "",
              });
              setShowCourseForm(true);
            }}
            className="rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-700 hover:to-cyan-600"
          >
            Add Course
          </button>
        </div>
      }
    >
      {/* Scrollable Modal Form */}
      {showCourseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[32px] border border-sky-100 bg-white shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)]">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 border-b border-sky-100 bg-white px-7 pb-5 pt-7">
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

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: "calc(90vh - 180px)" }}>
  <form onSubmit={handleSubmit} className="space-y-4">
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        Course Code <span className="text-red-500">*</span>
      </label>
      <input
        name="course_code"
        value={courseForm.course_code}
        onChange={handleChange}
        placeholder="e.g., BIT, BCS, BBA"
        required
        className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
      <p className="mt-1 text-xs text-slate-500">Unique identifier for the course</p>
    </div>

    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        Course Name <span className="text-red-500">*</span>
      </label>
      <input
        name="course_name"
        value={courseForm.course_name}
        onChange={handleChange}
        placeholder="Enter full course name"
        required
        className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
      <p className="mt-1 text-xs text-slate-500">Official name of the programme</p>
    </div>

    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        Course Type <span className="text-red-500">*</span>
      </label>
      <select
        name="course_type"
        value={courseForm.course_type}
        onChange={handleChange}
        required
        className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      >
        <option value="" disabled>Select course type</option>
        {courseTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-slate-500">
        Defines how the course structure is organized
      </p>
    </div>
  </form>
</div>

            {/* Sticky Footer with Buttons */}
            <div className="sticky bottom-0 border-t border-sky-100 bg-white px-7 py-5">
              <div className="flex gap-3">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg transition hover:from-sky-700 hover:to-cyan-600 disabled:opacity-50"
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
                    setCourseForm({
                      course_code: "",
                      course_name: "",
                      course_type: "",
                    });
                    setShowCourseForm(false);
                  }}
                  className="rounded-2xl bg-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courses Table Section */}
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
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="bg-gradient-to-r from-sky-100 to-cyan-50 text-sky-950">
              <tr>
                <th className="border-b border-sky-100 px-4 py-3 text-left text-sm font-semibold">Course Code</th>
                <th className="border-b border-sky-100 px-4 py-3 text-left text-sm font-semibold">Course Name</th>
                <th className="border-b border-sky-100 px-4 py-3 text-left text-sm font-semibold">Course Type</th>
                <th className="border-b border-sky-100 px-4 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                    No courses found. Click "Add Course" to create one.
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.course_id} className="border-b border-sky-100 transition hover:bg-sky-50/80">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-sky-700 text-sm">{c.course_code}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-sm">{c.course_name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {formatCourseType(c.course_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(c)}
                          className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-amber-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleAddUnits(c.course_id)}
                          className="rounded-md bg-sky-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-sky-700"
                        >
                          Units
                        </button>
                        <button
                          onClick={() => handleDelete(c.course_id, c.course_code)}
                          disabled={deleteLoading}
                          className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                        >
                          Del
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