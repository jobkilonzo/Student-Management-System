import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import toast, { Toaster } from "react-hot-toast";

const CourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ course_code: "", course_name: "" });
  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await makeRequest.get("/registrar/courses");
      setCourses(res.data || []);
    } catch (error) {
      console.error("Failed to fetch courses", error);
      toast.error("Could not load courses");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ course_code: "", course_name: "" });
    setEditingCourse(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.course_code || !form.course_name) {
      toast.error("Course code and name are required");
      return;
    }

    try {
      setLoading(true);
      if (editingCourse) {
        await makeRequest.put(`/registrar/courses/${editingCourse.course_id}`, form);
        toast.success("Course updated");
      } else {
        await makeRequest.post("/registrar/courses/create", form);
        toast.success("Course created");
      }
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setForm({ course_code: course.course_code, course_name: course.course_name });
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await makeRequest.delete(`/registrar/courses/${courseId}`);
      toast.success("Course deleted");
      fetchCourses();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete course");
    }
  };

  const filteredCourses = courses.filter((course) => {
    const query = search.toLowerCase();
    return (
      course.course_code?.toLowerCase().includes(query) ||
      course.course_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eff6ff_35%,_#f8fafc_70%)]">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <section className="relative overflow-hidden rounded-[30px] border border-sky-200/80 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 px-6 py-8 text-white shadow-[0_24px_70px_-35px_rgba(14,116,144,0.6)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.25),_transparent_32%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-50">
                Academic Catalogue
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight">Course Management</h1>
              <p className="mt-3 max-w-2xl text-sm text-sky-50/90 sm:text-base">
                Maintain the programme catalogue from one polished admin workspace with cleaner
                search, editing, and course review.
              </p>
            </div>
            <button
              onClick={() => navigate("/admin")}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-800 shadow-lg transition hover:bg-sky-50"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.25fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="mb-6">
              <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                {editingCourse ? "Edit Course" : "Create Course"}
              </div>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                {editingCourse ? "Update course details" : "Add a new programme"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Keep course codes and programme names consistent across the institution.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Course Code"
                value={form.course_code}
                onChange={(e) => setForm({ ...form, course_code: e.target.value })}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
              <input
                type="text"
                placeholder="Course Name"
                value={form.course_name}
                onChange={(e) => setForm({ ...form, course_name: e.target.value })}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
                >
                  {editingCourse ? "Update Course" : "Create Course"}
                </button>
                {editingCourse && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                  Course Directory
                </div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Programme catalogue</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Search, review, and update available courses from one table.
                </p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                <span className="font-semibold">{filteredCourses.length}</span> courses shown
              </div>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              {loading ? (
                <p className="p-8 text-center text-slate-500">Loading courses...</p>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-100/80">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Course Code</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Course Name</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredCourses.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-slate-500">
                            No courses found
                          </td>
                        </tr>
                      ) : (
                        filteredCourses.map((course) => (
                          <tr key={course.course_id} className="bg-white transition hover:bg-sky-50/60">
                            <td className="px-5 py-4 font-semibold text-slate-900">{course.course_code}</td>
                            <td className="px-5 py-4 text-slate-600">{course.course_name}</td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="rounded-xl bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-200"
                                  onClick={() => handleEdit(course)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="rounded-xl bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                                  onClick={() => handleDelete(course.course_id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;
