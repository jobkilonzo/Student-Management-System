import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import toast, { Toaster } from "react-hot-toast";
import RegistrarPageShell from "./RegistrarPageShell";

const courseModules = {
  Craft: {
    1: [1, 2, 3],
    2: [1, 2, 3],
  },
  Diploma: {
    1: [1, 2, 3],
    2: [1, 2, 3],
    3: [1, 2, 3],
  },
};

const RegistrarStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [availableTerms, setAvailableTerms] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [transitionContext, setTransitionContext] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [skipNextTermReset, setSkipNextTermReset] = useState(false);
  const [showForm, setShowForm] = useState(false); // New state to control form visibility

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
      toast.error("Failed to load students");
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
      toast.error("Failed to load courses");
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

    if (skipNextTermReset) {
      setSkipNextTermReset(false);
      return;
    }

    // Reset term only for user-driven course/module changes
    setStudentForm((prev) => ({ ...prev, term: "" }));
  }, [studentForm.course_id, studentForm.module, courses, skipNextTermReset]);

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
  
  if (!editingStudentId) {
    toast.error("No student selected for update");
    return;
  }

  // Log what's being sent
  console.log("Form Mode:", formMode);
  console.log("Student Form Data:", studentForm);
  console.log("Current values:", {
    course_id: studentForm.course_id,
    module: studentForm.module,
    term: studentForm.term
  });

  setLoading(true);

  try {
    const formData = new FormData();
    
    if (formMode === "transition") {
      // For transition, ONLY send academic fields that changed
      // But we need to send ALL academic fields to properly update
      formData.append("course_id", studentForm.course_id);
      formData.append("module", studentForm.module);
      formData.append("term", studentForm.term);
      
      // Log transition data
      console.log("Transition data being sent:", {
        course_id: studentForm.course_id,
        module: studentForm.module,
        term: studentForm.term
      });
    } else {
      // For edit, send all fields
      Object.keys(studentForm).forEach((key) => {
        if (studentForm[key] !== null && studentForm[key] !== "") {
          formData.append(key, studentForm[key]);
        }
      });
    }

    const response = await makeRequest.put(`/registrar/students/${editingStudentId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("Update response:", response.data);
    
    toast.success(
      formMode === "transition" 
        ? "Student transitioned successfully!" 
        : "Student updated successfully!"
    );

    resetForm();
    await fetchStudents();
    
  } catch (err) {
    console.error("Error saving student:", err);
    if (err.response) {
      toast.error(err.response.data.error || err.response.data.message || "Failed to save student");
    } else {
      toast.error("Network error. Please check if the server is running.");
    }
  } finally {
    setLoading(false);
  }
};

  const handleEdit = (student) => {
    setEditingStudentId(student.id);
    setFormMode("edit");
    setTransitionContext(null);
    setSkipNextTermReset(true);
    setShowForm(true);
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

  const handleTransition = (student) => {
    setEditingStudentId(student.id);
    setFormMode("transition");
    setSkipNextTermReset(true);
    setShowForm(true);
    setTransitionContext({
      student_name: `${student.first_name || ""} ${student.middle_name ? `${student.middle_name} ` : ""}${student.last_name || ""}`.trim(),
      reg_no: student.reg_no || "-",
      current_course_name: student.course_name || "",
      current_course_code: student.course_code || "",
      current_module: student.module || "",
      current_term: student.term || "",
    });
    
    // For transition, only pre-fill the current values (they can be changed)
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
    
    setPhotoPreview(null);
    setSelectedPhoto(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      await makeRequest.delete(`/registrar/students/${studentId}`);
      toast.success("Student deleted successfully!");
      await fetchStudents();
    } catch (err) {
      console.error("Error deleting student:", err);
      toast.error(`Error deleting student: ${err.response?.data?.error || err.message}`);
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
    setFormMode("create");
    setTransitionContext(null);
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setShowForm(false); // Hide the form modal
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const filteredStudents = students.filter((s) => {
    const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    const email = s.email?.toLowerCase() || "";
    const regNo = s.reg_no?.toLowerCase() || "";
    const termSearch = search.toLowerCase();
    return name.includes(termSearch) || email.includes(termSearch) || regNo.includes(termSearch);
  });

  return (
    <RegistrarPageShell
      title={formMode === "transition" ? "Transition Student" : editingStudentId ? "Edit Student" : "Student Registry"}
      subtitle={
        formMode === "transition"
          ? "Move the selected learner to a new academic stage while preserving billing history and prior level records."
          : editingStudentId
            ? "Review the selected student, update core details, and keep the academic record current."
            : "Search the registrar record, open a student profile for editing, or transition a learner to the next course level."
      }
      actions={
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
            Total students: {students.length}
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-sky-100">
            Actions: Edit, Transition, Delete
          </div>
        </div>
      }
    >
      <Toaster position="top-right" />

      {/* Edit/Transition Modal */}
      {showForm && editingStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-sky-100 bg-white p-7 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)]">
            <div className="mb-6 flex flex-col gap-3 border-b border-sky-100 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Student Workspace
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                {formMode === "transition" ? "Transition Student" : "Edit Student"}
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Changing course, module, or term archives the previous level automatically and keeps any unpaid fee balance in billing.
              </p>
            </div>

            {formMode === "transition" && transitionContext && (
              <div className="mb-6 rounded-[24px] border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Transition Summary</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {transitionContext.student_name} <span className="text-sm font-medium text-slate-500">({transitionContext.reg_no})</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Current stage: {transitionContext.current_course_name || "-"}
                  {transitionContext.current_course_code ? ` (${transitionContext.current_course_code})` : ""} | Module {transitionContext.current_module || "-"} | Term {transitionContext.current_term || "-"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Update the course, module, or term below to move this student to the next level. Previous billing will be archived automatically.
                </p>
              </div>
            )}

            {/* Photo Preview - Only for Edit mode */}
            {formMode === "edit" && photoPreview && (
              <div className="mb-4 flex justify-center">
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-32 w-32 rounded-full border-4 border-sky-200 object-cover shadow-md"
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Show personal info fields only in Edit mode */}
              {formMode === "edit" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="first_name"
                      value={studentForm.first_name}
                      onChange={handleChange}
                      placeholder="First Name"
                      required
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                    <input
                      type="text"
                      name="middle_name"
                      value={studentForm.middle_name}
                      onChange={handleChange}
                      placeholder="Middle Name"
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                    <select
                      name="gender"
                      value={studentForm.gender}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="date"
                      name="dob"
                      value={studentForm.dob}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                    <input
                      type="text"
                      name="id_number"
                      value={studentForm.id_number}
                      onChange={handleChange}
                      placeholder="ID Number"
                      required
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="tel"
                      name="phone"
                      value={studentForm.phone}
                      onChange={handleChange}
                      placeholder="Phone"
                      required
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                    <input
                      type="email"
                      name="email"
                      value={studentForm.email}
                      onChange={handleChange}
                      placeholder="Email"
                      required
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <input
                    type="text"
                    name="address"
                    value={studentForm.address}
                    onChange={handleChange}
                    placeholder="Address"
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </>
              )}

              {/* Course Dropdown - Always shown */}
              <select
                name="course_id"
                value={studentForm.course_id}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
                  className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
                  className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">Select Term</option>
                  {availableTerms.map((t) => (
                    <option key={t} value={t}>
                      Term {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Guardian and Photo - Only for Edit mode */}
              {formMode === "edit" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="guardian_name"
                    value={studentForm.guardian_name}
                    onChange={handleChange}
                    placeholder="Guardian Name"
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                  <input
                    type="tel"
                    name="guardian_phone"
                    value={studentForm.guardian_phone}
                    onChange={handleChange}
                    placeholder="Guardian Phone"
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg transition hover:from-sky-700 hover:to-cyan-600 disabled:opacity-60"
                >
                  {loading ? "Saving..." : formMode === "transition" ? "Transition Student" : "Update Student"}
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-2xl bg-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="rounded-[32px] border border-sky-100 bg-white/95 p-7 shadow-[0_24px_50px_-38px_rgba(14,116,144,0.45)]">
        <div className="mb-6 flex flex-col gap-3 border-b border-sky-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Student Directory
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Registered Students</h2>
            <p className="mt-2 text-sm text-slate-600">
              Search, review, and manage active student records from one table.
            </p>
          </div>
          <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
            Total students: {students.length}
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by name, email or registration number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
          <div className="overflow-x-auto rounded-[24px] border border-sky-100">
            <table className="w-full border-collapse">
              <thead className="bg-gradient-to-r from-sky-100 to-cyan-50 text-sky-950">
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
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-sky-100 transition hover:bg-sky-50/80"
                    >
                      <td className="p-3 font-semibold text-sky-700">
                        {s.reg_no || "-"}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-semibold text-slate-900">{`${s.first_name || ""} ${s.middle_name ? s.middle_name + " " : ""
                            }${s.last_name || ""}`}</p>
                          <p className="text-xs text-slate-500">{s.email || "No email"}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        {s.course_name || "-"} ({s.course_code || "-"})
                      </td>
                      <td className="p-3">{s.module || "-"}</td>
                      <td className="p-3">{s.term || "-"}</td>
                      <td className="p-3">{s.phone || "-"}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap justify-center gap-2 whitespace-nowrap">
                          <button
                            onClick={() => handleTransition(s)}
                            className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-200"
                            title="Transition student"
                          >
                            Move
                          </button>
                          <button
                            onClick={() => handleEdit(s)}
                            className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-200"
                            title="Edit student details"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-200"
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
          <div className="mt-4 text-sm text-slate-500">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        )}
      </div>
    </RegistrarPageShell>
  );
};

export default RegistrarStudents;