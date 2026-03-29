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

  const filteredCourses = courses.filter(c => {
    const query = search.toLowerCase();
    return (
      c.course_code?.toLowerCase().includes(query) ||
      c.course_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 p-8">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto bg-white shadow rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <button
            onClick={() => navigate("/admin")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Admin Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Course Code"
            value={form.course_code}
            onChange={(e) => setForm({ ...form, course_code: e.target.value })}
            className="border rounded-lg p-2"
          />
          <input
            type="text"
            placeholder="Course Name"
            value={form.course_name}
            onChange={(e) => setForm({ ...form, course_name: e.target.value })}
            className="border rounded-lg p-2"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              {editingCourse ? "Update Course" : "Create Course"}
            </button>
            {editingCourse && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mb-4 flex justify-between items-center">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg p-2 w-1/2"
          />
          <span className="text-gray-500">{courses.length} courses</span>
        </div>

        <div className="overflow-auto">
          {loading ? (
            <p>Loading courses...</p>
          ) : (
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Course Code</th>
                  <th className="p-2 text-left">Course Name</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-4 text-center text-gray-500">
                      No courses found
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr key={course.course_id} className="hover:bg-gray-50">
                      <td className="p-2">{course.course_code}</td>
                      <td className="p-2">{course.course_name}</td>
                      <td className="p-2 space-x-2">
                        <button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                          onClick={() => handleEdit(course)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          onClick={() => handleDelete(course.course_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;
