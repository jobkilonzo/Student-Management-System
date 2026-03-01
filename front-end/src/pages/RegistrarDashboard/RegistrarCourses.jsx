import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const RegistrarCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState({ code: "", name: "" });
  const [editingCourseId, setEditingCourseId] = useState(null);
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

  const handleChange = (e) =>
    setCourseForm({ ...courseForm, [e.target.name]: e.target.value });

  // =============================
  // ADD OR EDIT COURSE
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCourseId) {
        // EDIT course
        const res = await makeRequest.put(
          `/registrar/courses/${editingCourseId}`,
          courseForm
        );
        setCourses(
          courses.map((c) =>
            c.id === editingCourseId ? { ...c, ...res.data } : c
          )
        );
        setEditingCourseId(null);
      } else {
        // CREATE course
        const res = await makeRequest.post(
          "/registrar/courses/create",
          courseForm
        );
        setCourses([...courses, res.data]);
        // Redirect to add units
        navigate(`/registrar/courses/${res.data.id}/units`);
      }

      setCourseForm({ code: "", name: "" });
    } catch (err) {
      console.error(err);
      alert("Error saving course");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // SET FORM FOR EDITING
  // =============================
  const handleEdit = (course) => {
    setCourseForm({ code: course.code, name: course.name });
    setEditingCourseId(course.id);
  };

  // =============================
  // REDIRECT TO ADD UNITS
  // =============================
  const handleAddUnits = (courseId) => {
    navigate(`/registrar/courses/${courseId}/units`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 p-6">
      <h1 className="text-4xl font-extrabold text-center text-slate-800 mb-8">
        Registrar Courses
      </h1>

      {/* FORM */}
      <div className="bg-white w-full max-w-2xl mx-auto p-8 rounded-2xl shadow-lg mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          {editingCourseId ? "Edit Course" : "Add New Course"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <input
            name="code"
            value={courseForm.code}
            onChange={handleChange}
            placeholder="Course Code (e.g., BIT)"
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="name"
            value={courseForm.name}
            onChange={handleChange}
            placeholder="Course Name"
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading
              ? "Saving..."
              : editingCourseId
              ? "Update Course"
              : "Create Course & Add Units"}
          </button>
        </form>
      </div>

      {/* COURSES TABLE */}
      <div className="bg-white w-full max-w-4xl mx-auto p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">All Courses</h2>
        <table className="w-full table-auto border-collapse">
          <thead className="bg-slate-200">
            <tr>
              <th className="border px-4 py-2">Course Code</th>
              <th className="border px-4 py-2">Course Name</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  No courses found.
                </td>
              </tr>
            )}
            {courses.map((c) => (
              <tr key={c.id} className="text-center border-t">
                <td className="border px-4 py-2">{c.code}</td>
                <td className="border px-4 py-2">{c.name}</td>
                <td className="border px-4 py-2 flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(c)}
                    className="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleAddUnits(c.id)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white"
                  >
                    Add Units
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegistrarCourses;