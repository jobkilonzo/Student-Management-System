import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const RegistrarCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState({ course_code: "", course_name: "" });
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
  const handleBack = () => navigate(-1); // go back to previous page

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 p-6">
      <h1 className="text-4xl font-extrabold text-center text-slate-800 mb-8">
        Registrar Courses
      </h1>

      {/* BACK BUTTON */}
      <div className="max-w-2xl mx-auto mb-4">
        <button
          onClick={handleBack}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded"
        >
          &larr; Back
        </button>
      </div>

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
            name="course_code"
            value={courseForm.course_code}
            onChange={handleChange}
            placeholder="Course Code (e.g., BIT)"
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="course_name"
            value={courseForm.course_name}
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
              <tr key={c.course_id} className="text-center border-t">
                <td className="border px-4 py-2">{c.course_code}</td>
                <td className="border px-4 py-2">{c.course_name}</td>
                <td className="border px-4 py-2 flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(c)}
                    className="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleAddUnits(c.course_id)}
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