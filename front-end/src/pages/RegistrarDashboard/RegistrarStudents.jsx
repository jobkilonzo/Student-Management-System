import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import { makeRequest } from "../../../axios";

const courseModules = {
  Craft: {
    "1": ["Term 1", "Term 2", "Term 3"],
    "2": ["Term 1", "Term 2", "Optional Term 3"],
  },
  Diploma: {
    "1": ["Term 1", "Term 2", "Term 3"],
    "2": ["Term 1", "Term 2", "Optional Term 3"],
    "3": ["Term 1", "Term 2", "Optional Term 3"],
  },
};

const RegistrarStudents = () => {
  const navigate = useNavigate(); // Add navigate hook
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [availableTerms, setAvailableTerms] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [studentForm, setStudentForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "Male",
    dob: "",
    id_number: "",
    phone: "",
    email: "",
    course_id: "",
    module: "",
    term: "",
    address: "",
    guardian_name: "",
    guardian_phone: "",
    photo: null,
  });

  // Fetch students and courses
  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await makeRequest.get("/registrar/students/");
      setStudents(res.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students. Please check if the server is running.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await makeRequest.get("/registrar/courses/");
      setCourses(res.data || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    }
  };

  // Update available terms when course or module changes
  useEffect(() => {
    if (!studentForm.course_id || !studentForm.module) {
      setAvailableTerms([]);
      return;
    }

    const selectedCourse = courses.find(
      (c) => c.course_id === parseInt(studentForm.course_id)
    );
    const courseName = selectedCourse?.course_name || "";

    let courseLevel = "";
    if (courseName.toLowerCase().includes("diploma")) courseLevel = "Diploma";
    else if (courseName.toLowerCase().includes("craft")) courseLevel = "Craft";

    if (courseLevel && courseModules[courseLevel]) {
      setAvailableTerms(courseModules[courseLevel][studentForm.module] || []);
    } else setAvailableTerms([]);

    // Reset term if module changes
    setStudentForm((prev) => ({ ...prev, term: "" }));
  }, [studentForm.course_id, studentForm.module, courses]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      const file = files[0];
      setStudentForm({ ...studentForm, photo: file });
      setSelectedPhoto(file);
      
      // Create preview URL
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setPhotoPreview(previewUrl);
      }
    } else {
      setStudentForm({ ...studentForm, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(studentForm).forEach((key) => {
        if (studentForm[key] !== null && studentForm[key] !== "") {
          formData.append(key, studentForm[key]);
        }
      });

      if (editingStudentId) {
        // UPDATE student
        await makeRequest.put(`/registrar/students/${editingStudentId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Student updated successfully!");
      } else {
        // CREATE student
        await makeRequest.post("/registrar/students/create", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Student registered successfully!");
      }

      // Reset form
      resetForm();

      // Refresh students
      await fetchStudents();
    } catch (err) {
      console.error("Error saving student:", err);
      if (err.response) {
        alert(`Error: ${err.response.data.error || err.response.data.message || "Failed to save student"}`);
      } else {
        alert("Network error. Please check if the server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudentId(student.id);
    setStudentForm({
      first_name: student.first_name || "",
      middle_name: student.middle_name || "",
      last_name: student.last_name || "",
      gender: student.gender || "Male",
      dob: student.dob ? student.dob.split('T')[0] : "",
      id_number: student.id_number || "",
      phone: student.phone || "",
      email: student.email || "",
      course_id: student.course_id || "",
      module: student.module || "",
      term: student.term || "",
      address: student.address || "",
      guardian_name: student.guardian_name || "",
      guardian_phone: student.guardian_phone || "",
      photo: null,
    });
    
    // Clear photo preview
    setPhotoPreview(null);
    setSelectedPhoto(null);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      await makeRequest.delete(`/registrar/students/${studentId}`);
      alert("Student deleted successfully!");
      await fetchStudents(); // Refresh the list
    } catch (err) {
      console.error("Error deleting student:", err);
      alert(`Error deleting student: ${err.response?.data?.error || err.message}`);
    }
  };

  const resetForm = () => {
    setStudentForm({
      first_name: "",
      middle_name: "",
      last_name: "",
      gender: "Male",
      dob: "",
      id_number: "",
      phone: "",
      email: "",
      course_id: "",
      module: "",
      term: "",
      address: "",
      guardian_name: "",
      guardian_phone: "",
      photo: null,
    });
    setEditingStudentId(null);
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  // Back button handler
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const filteredStudents = students.filter((s) => {
    const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    const email = s.email?.toLowerCase() || "";
    const regNo = s.reg_no?.toLowerCase() || "";
    const termSearch = search.toLowerCase();
    return name.includes(termSearch) || email.includes(termSearch) || regNo.includes(termSearch);
  });

  return (
    <div className="p-6 min-h-screen bg-slate-100">
      {/* Header with Back Button */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Register Students</h1>
        </div>
        <p className="text-gray-600 mt-2">
          {editingStudentId ? "Edit student information" : "Add new students and assign them to courses."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">
            {editingStudentId ? "Edit Student" : "Add New Student"}
          </h2>
          
          {/* Photo Preview */}
          {photoPreview && (
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-full border-4 border-blue-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null);
                    setSelectedPhoto(null);
                    setStudentForm({ ...studentForm, photo: null });
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="first_name"
                value={studentForm.first_name}
                onChange={handleChange}
                placeholder="First Name"
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                type="text"
                name="middle_name"
                value={studentForm.middle_name}
                onChange={handleChange}
                placeholder="Middle Name"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="last_name"
                value={studentForm.last_name}
                onChange={handleChange}
                placeholder="Last Name"
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
              <select
                name="gender"
                value={studentForm.gender}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* DOB & ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                name="dob"
                value={studentForm.dob}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                type="text"
                name="id_number"
                value={studentForm.id_number}
                onChange={handleChange}
                placeholder="ID Number"
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="tel"
                name="phone"
                value={studentForm.phone}
                onChange={handleChange}
                placeholder="Phone"
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                type="email"
                name="email"
                value={studentForm.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            {/* Address */}
            <input
              type="text"
              name="address"
              value={studentForm.address}
              onChange={handleChange}
              placeholder="Address"
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
            />

            {/* Course Dropdown */}
            <select
              name="course_id"
              value={studentForm.course_id}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_name} ({c.course_code})
                </option>
              ))}
            </select>

            {/* Module & Term */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="module"
                value={studentForm.module}
                onChange={handleChange}
                required
                disabled={!studentForm.course_id}
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              >
                <option value="">Select Module</option>
                {studentForm.course_id &&
                  (() => {
                    const selectedCourse = courses.find(
                      (c) => c.course_id === parseInt(studentForm.course_id)
                    );
                    const courseName = selectedCourse?.course_name || "";
                    let courseLevel = "";
                    if (courseName.toLowerCase().includes("diploma"))
                      courseLevel = "Diploma";
                    else if (courseName.toLowerCase().includes("craft"))
                      courseLevel = "Craft";
                    if (!courseModules[courseLevel]) return null;
                    return Object.keys(courseModules[courseLevel]).map((mod) => (
                      <option key={`module-${mod}`} value={mod}>
                        Module {mod}
                      </option>
                    ));
                  })()}
              </select>

              <select
                name="term"
                value={studentForm.term}
                onChange={handleChange}
                required
                disabled={!studentForm.module || availableTerms.length === 0}
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              >
                <option value="">Select Term</option>
                {availableTerms.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Guardian & Photo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="guardian_name"
                value={studentForm.guardian_name}
                onChange={handleChange}
                placeholder="Guardian Name"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                type="tel"
                name="guardian_phone"
                value={studentForm.guardian_phone}
                onChange={handleChange}
                placeholder="Guardian Phone"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {loading ? "Saving…" : editingStudentId ? "Update Student" : "Register Student"}
              </button>
              
              {editingStudentId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 rounded-xl bg-gray-500 text-white font-semibold hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Students Table */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Registered Students</h2>

          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, email or registration number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-400 focus:outline-none"
            />
          </div>

          {loadingStudents ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-gray-500">Loading students...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Reg No</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Course</th>
                    <th className="p-3 text-left">Module</th>
                    <th className="p-3 text-left">Term</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500">
                        No students found. Add your first student above!
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b hover:bg-blue-50 transition"
                      >
                        <td className="p-3 font-semibold text-blue-600">
                          {s.reg_no || "-"}
                        </td>
                        <td className="p-3">{`${s.first_name || ""} ${
                          s.middle_name ? s.middle_name + " " : ""
                        }${s.last_name || ""}`}</td>
                        <td className="p-3">
                          {s.course_name || "-"} ({s.course_code || "-"})
                        </td>
                        <td className="p-3">{s.module || "-"}</td>
                        <td className="p-3">{s.term || "-"}</td>
                        <td className="p-3">{s.phone || "-"}</td>
                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEdit(s)}
                              className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm font-medium transition"
                              title="Edit student"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                              title="Delete student"
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
          
          {/* Student Count */}
          {!loadingStudents && !error && filteredStudents.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrarStudents;