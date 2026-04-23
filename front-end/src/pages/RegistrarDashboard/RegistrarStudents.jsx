import { useState, useEffect } from "react";
import { makeRequest } from "../../../axios";
import toast, { Toaster } from "react-hot-toast";
import RegistrarPageShell from "./RegistrarPageShell";

const RegistrarStudents = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [availableTerms, setAvailableTerms] = useState([]);
  const [availableLevels, setAvailableLevels] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [transitionContext, setTransitionContext] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [skipNextTermReset, setSkipNextTermReset] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCourseType, setSelectedCourseType] = useState(null);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [dropdownKey, setDropdownKey] = useState(0);

  // Term mapping based on course type and level
  const termMapping = {
    modular: {
      1: [1, 2, 3],
      2: [1, 2, 3],
      3: [1, 2, 3]
    },
    stage_based: {
      1: [1, 2],
      2: [1, 2],
      3: [1, 2]
    },
    grade_system: {
      1: [1, 2, 3],
      2: [1, 2, 3],
      3: [1, 2, 3]
    },
    level_based: {
      1: [1, 2, 3],
      2: [1, 2, 3],
      3: [1, 2, 3]
    }
  };

  // Special case for Craft courses (modular based but only 2 modules)
  const craftModules = {
    1: [1, 2, 3],
    2: [1, 2, 3]
  };

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
    stage: "",
    grade: "",
    level: "",
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

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

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

  // Get course type and name from course data
  const getCourseDetails = (courseId) => {
    if (!courseId) return { type: null, name: "" };
    
    const selectedCourse = courses.find(c => c.course_id === parseInt(courseId));
    if (!selectedCourse) return { type: null, name: "" };

    
    return {
      type: selectedCourse.course_type || "modular",
      name: selectedCourse.course_name || ""
    };
  };

  // Get available levels based on course type and name
  const getAvailableLevels = (courseType, courseName) => {
 
    
    if (!courseType || courseType === "non_modular") return [];
    
    // Special case for Craft courses (only 2 modules)
    if (courseName?.toLowerCase().includes("craft") && courseType === "modular") {
      const levels = [];
      for(let i = 1; i <= 2; i++) {
        levels.push({ value: i, label: `Module ${i}` });
      }
      return levels;
    }
    
    // For modular courses: 3 modules
    if (courseType === "modular") {
      const levels = [];
      for(let i = 1; i <= 3; i++) {
        levels.push({ value: i, label: `Module ${i}` });
      }
      return levels;
    }
    
    // For other course types
    const levels = [];
    for(let i = 1; i <= 3; i++) {
      switch(courseType) {
        case "stage_based":
          levels.push({ value: i, label: `Stage ${i}` });
          break;
        case "grade_system":
          levels.push({ value: i, label: `Grade ${i}` });
          break;
        case "level_based":
          levels.push({ value: i, label: `Level ${i}` });
          break;
        default:
          return [];
      }
    }
    return levels;
  };

  // Get terms based on course type, level, and course name
  const getAvailableTerms = (courseType, levelValue, courseName) => {
    if (!courseType || !levelValue) return [];
    
    // Special case for Craft courses
    if (courseName?.toLowerCase().includes("craft") && courseType === "modular") {
      return craftModules[levelValue] || [];
    }
    
    // For stage_based: 2 terms per stage
    if (courseType === "stage_based") {
      return termMapping.stage_based[levelValue] || [];
    }
    
    // For all other types: 3 terms per level
    return termMapping[courseType]?.[levelValue] || [];
  };

  // Get the current level field name based on course type
  const getLevelFieldName = (courseType) => {
    switch(courseType) {
      case "modular": return "module";
      case "stage_based": return "stage";
      case "grade_system": return "grade";
      case "level_based": return "level";
      default: return null;
    }
  };

  // Get the current level value from form based on course type
  const getCurrentLevelValue = (courseType, formData) => {
    switch(courseType) {
      case "modular": return formData.module;
      case "stage_based": return formData.stage;
      case "grade_system": return formData.grade;
      case "level_based": return formData.level;
      default: return null;
    }
  };

  // Update level value in form based on course type
  const updateLevelValue = (courseType, value, formData) => {
    const updatedForm = { ...formData };
    // Reset all level fields first
    updatedForm.module = "";
    updatedForm.stage = "";
    updatedForm.grade = "";
    updatedForm.level = "";
    
    // Set the appropriate field
    switch(courseType) {
      case "modular":
        updatedForm.module = value;
        break;
      case "stage_based":
        updatedForm.stage = value;
        break;
      case "grade_system":
        updatedForm.grade = value;
        break;
      case "level_based":
        updatedForm.level = value;
        break;
    }
    return updatedForm;
  };

  // Update available levels and reset form when course changes
  useEffect(() => {
    if (!studentForm.course_id) {
      setAvailableLevels([]);
      setAvailableTerms([]);
      setSelectedCourseType(null);
      setSelectedCourseName("");
      return;
    }

    const { type: courseType, name: courseName } = getCourseDetails(studentForm.course_id);
   
    setSelectedCourseType(courseType);
    setSelectedCourseName(courseName);
    
    const levels = getAvailableLevels(courseType, courseName);

    setAvailableLevels(levels);
    setDropdownKey(prev => prev + 1);
    
    // Reset level and term when course changes (unless skipping)
    if (!skipNextTermReset) {
      const resetForm = updateLevelValue(courseType, "", studentForm);
      resetForm.term = "";
      setStudentForm(resetForm);
      setAvailableTerms([]);
    } else {
      setSkipNextTermReset(false);
    }
  }, [studentForm.course_id, courses, skipNextTermReset]);

  // Update available terms when level changes
  useEffect(() => {
    if (!studentForm.course_id || !selectedCourseType || selectedCourseType === "non_modular") {
      setAvailableTerms([]);
      return;
    }

    const currentLevel = getCurrentLevelValue(selectedCourseType, studentForm);
    
    if (currentLevel) {
      const terms = getAvailableTerms(selectedCourseType, parseInt(currentLevel), selectedCourseName);
  
      setAvailableTerms(terms);
    } else {
      setAvailableTerms([]);
    }
    
    if (!skipNextTermReset) {
      setStudentForm(prev => ({ ...prev, term: "" }));
    }
  }, [studentForm.module, studentForm.stage, studentForm.grade, studentForm.level, studentForm.course_id, selectedCourseType, selectedCourseName, skipNextTermReset]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      const file = files[0];
      setStudentForm({ ...studentForm, photo: file });
      if (file) {
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        const previewUrl = URL.createObjectURL(file);
        setPhotoPreview(previewUrl);
      }
    } else if (name === "course_id") {
      // When course changes, reset all level-specific fields
      setStudentForm({
        ...studentForm,
        course_id: value,
        module: "",
        stage: "",
        grade: "",
        level: "",
        term: ""
      });
    } else {
      setStudentForm({ ...studentForm, [name]: value });
    }
  };

  const handleLevelChange = (value) => {
    if (!selectedCourseType) return;
    console.log("Level changed to:", value);
    const updatedForm = updateLevelValue(selectedCourseType, value, studentForm);
    updatedForm.term = "";
    setStudentForm(updatedForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingStudentId) {
      toast.error("No student selected for update");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      const submissionData = {
        course_id: studentForm.course_id,
        term: studentForm.term,
      };
      
      if (selectedCourseType && selectedCourseType !== "non_modular") {
        const levelValue = getCurrentLevelValue(selectedCourseType, studentForm);
        submissionData[getLevelFieldName(selectedCourseType)] = levelValue;
      }
      
      if (formMode === "edit") {
        Object.assign(submissionData, {
          first_name: studentForm.first_name,
          middle_name: studentForm.middle_name,
          last_name: studentForm.last_name,
          gender: studentForm.gender,
          dob: studentForm.dob,
          id_number: studentForm.id_number,
          phone: studentForm.phone,
          email: studentForm.email,
          address: studentForm.address,
          guardian_name: studentForm.guardian_name,
          guardian_phone: studentForm.guardian_phone,
        });
        
        if (studentForm.photo) {
          formData.append("photo", studentForm.photo);
        }
      }
      
      Object.keys(submissionData).forEach((key) => {
        if (submissionData[key] !== null && submissionData[key] !== "") {
          formData.append(key, submissionData[key]);
        }
      });

      await makeRequest.put(`/registrar/students/${editingStudentId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      toast.success(
        formMode === "transition" 
          ? "Student transitioned successfully!" 
          : "Student updated successfully!"
      );

      resetForm();
      await fetchStudents();
      
    } catch (err) {
      console.error("Error saving student:", err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to save student");
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
    
    const { type: courseType, name: courseName } = getCourseDetails(student.course_id);

    setSelectedCourseType(courseType);
    setSelectedCourseName(courseName);
    
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
      stage: student.stage || "",
      grade: student.grade || "",
      level: student.level || "",
      term: student.term || "",
      address: student.address || "",
      guardian_name: student.guardian_name || "",
      guardian_phone: student.guardian_phone || "",
      photo: null,
    });
    
    const levels = getAvailableLevels(courseType, courseName);
    setAvailableLevels(levels);
    setDropdownKey(prev => prev + 1);
    
    const currentLevel = getCurrentLevelValue(courseType, student);
    if (currentLevel) {
      const terms = getAvailableTerms(courseType, parseInt(currentLevel), courseName);
      setAvailableTerms(terms);
    }
    
    setPhotoPreview(student.photo_url ? student.photo_url : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTransition = (student) => {
    setEditingStudentId(student.id);
    setFormMode("transition");
    setSkipNextTermReset(true);
    setShowForm(true);
    
    const { type: courseType, name: courseName } = getCourseDetails(student.course_id);
    setSelectedCourseType(courseType);
    setSelectedCourseName(courseName);
    
    setTransitionContext({
      student_name: `${student.first_name || ""} ${student.middle_name ? `${student.middle_name} ` : ""}${student.last_name || ""}`.trim(),
      reg_no: student.reg_no || "-",
      current_course_name: student.course_name || "",
      current_course_code: student.course_code || "",
      current_level: getLevelDisplay(courseType, student),
      current_term: student.term || "",
    });
    
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
      stage: student.stage || "",
      grade: student.grade || "",
      level: student.level || "",
      term: student.term || "",
      address: student.address || "",
      guardian_name: student.guardian_name || "",
      guardian_phone: student.guardian_phone || "",
      photo: null,
    });
    
    const levels = getAvailableLevels(courseType, courseName);
    setAvailableLevels(levels);
    setDropdownKey(prev => prev + 1);
    
    setPhotoPreview(null);
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
      stage: "",
      grade: "",
      level: "",
      term: "",
      address: "",
      guardian_name: "",
      guardian_phone: "",
      photo: null,
    });
    setEditingStudentId(null);
    setFormMode("create");
    setTransitionContext(null);
    setPhotoPreview(null);
    setShowForm(false);
    setSelectedCourseType(null);
    setSelectedCourseName("");
    setAvailableLevels([]);
    setAvailableTerms([]);
    setDropdownKey(prev => prev + 1);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const getLevelDisplay = (courseType, student) => {
    if (!courseType || courseType === "non_modular") return "N/A";
    
    switch(courseType) {
      case "modular":
        return student.module ? `Module ${student.module}` : "-";
      case "stage_based":
        return student.stage ? `Stage ${student.stage}` : "-";
      case "grade_system":
        return student.grade ? `Grade ${student.grade}` : "-";
      case "level_based":
        return student.level ? `Level ${student.level}` : "-";
      default:
        return "-";
    }
  };

  const getTermHelpText = () => {
    if (!selectedCourseType) return "";
    
    switch(selectedCourseType) {
      case "stage_based":
        return "Stage-based courses have 2 terms per stage";
      case "modular":
        return "Modular courses have 3 terms per module";
      case "grade_system":
        return "Grade system courses have 3 terms per grade";
      case "level_based":
        return "Level-based courses have 3 terms per level";
      default:
        return "";
    }
  };

  const renderLevelDropdown = () => {
    
    if (!selectedCourseType || selectedCourseType === "non_modular") {
      console.log("Not rendering dropdown - invalid course type");
      return null;
    }

    const currentValue = getCurrentLevelValue(selectedCourseType, studentForm);
    const levelFieldName = getLevelFieldName(selectedCourseType);
    
    const getLevelLabel = () => {
      switch(selectedCourseType) {
        case "modular":
          return selectedCourseName?.toLowerCase().includes("craft") ? "Select Module" : "Select Module";
        case "stage_based":
          return "Select Stage";
        case "grade_system":
          return "Select Grade";
        case "level_based":
          return "Select Level";
        default:
          return "Select Level";
      }
    };
    
    return (
      <div key={dropdownKey}>
        <select
          value={currentValue || ""}
          onChange={(e) => handleLevelChange(e.target.value)}
          required
          disabled={!studentForm.course_id}
          className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        >
          <option value="">{getLevelLabel()}</option>
          {availableLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
        {selectedCourseType === "stage_based" && (
          <p className="mt-1 text-xs text-slate-500">Note: Each stage has 2 terms</p>
        )}
        {(selectedCourseType === "modular" || selectedCourseType === "grade_system" || selectedCourseType === "level_based") && (
          <p className="mt-1 text-xs text-slate-500">Note: Each {levelFieldName} has 3 terms</p>
        )}
      </div>
    );
  };

  const filteredStudents = students.filter((s) => {
    const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    const email = s.email?.toLowerCase() || "";
    const regNo = s.reg_no?.toLowerCase() || "";
    const searchTerm = search.toLowerCase();
    return name.includes(searchTerm) || email.includes(searchTerm) || regNo.includes(searchTerm);
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
                Changing course, level, or term archives the previous level automatically and keeps any unpaid fee balance in billing.
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
                  {transitionContext.current_course_code ? ` (${transitionContext.current_course_code})` : ""} | 
                  {transitionContext.current_level} | Term {transitionContext.current_term || "-"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Update the course, level, or term below to move this student to the next level. Previous billing will be archived automatically.
                </p>
              </div>
            )}

            {/* Photo Preview */}
            {photoPreview && (
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
                      if (photoPreview) URL.revokeObjectURL(photoPreview);
                      setPhotoPreview(null);
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
                    {c.course_name} ({c.course_code}) - {c.course_type === 'modular' ? 'Modular Based' : c.course_type?.replace('_', ' ') || 'Modular Based'}
                  </option>
                ))}
              </select>

              {/* Level Dropdown - Dynamic based on course type */}
              {renderLevelDropdown()}

              {/* Term Dropdown */}
              {selectedCourseType && selectedCourseType !== "non_modular" && (
                <div className="grid grid-cols-1 gap-4">
                  <select
                    name="term"
                    value={studentForm.term}
                    onChange={handleChange}
                    required
                    disabled={!studentForm.course_id || !getCurrentLevelValue(selectedCourseType, studentForm)}
                    className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">Select Term</option>
                    {availableTerms.map((t) => (
                      <option key={t} value={t}>
                        Term {t}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">{getTermHelpText()}</p>
                </div>
              )}

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
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gradient-to-r from-sky-100 to-cyan-50 text-sky-950 text-xs">
          <tr>
            <th className="p-2 text-left">Reg No</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Course</th>
            <th className="p-2 text-left">Level</th>
            <th className="p-2 text-left">Term</th>
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {filteredStudents.length === 0 ? (
            <tr>
              <td colSpan="7" className="p-6 text-center text-gray-500">
                No students found.
              </td>
            </tr>
          ) : (
            filteredStudents.map((s) => {
              const courseType = getCourseDetails(s.course_id).type;
              return (
                <tr
                  key={s.id}
                  className="border-b border-sky-100 transition hover:bg-sky-50/80"
                >
                  <td className="p-2 font-semibold text-sky-700">
                    {s.reg_no || "-"}
                  </td>
                  <td className="p-2">
                    <div>
                      <p className="font-semibold text-slate-900">{`${s.first_name || ""} ${s.middle_name ? s.middle_name + " " : ""
                        }${s.last_name || ""}`}</p>
                      <p className="text-[11px] text-slate-500">{s.email || "No email"}</p>
                    </div>
                  </td>
                  <td className="p-2">
                    <div>
                      <p className="font-medium text-slate-900">{s.course_name || "-"}</p>
                      <p className="text-[11px] text-slate-500">{s.course_code || "-"}</p>
                    </div>
                  </td>
                  <td className="p-2">
                    <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800">
                      {getLevelDisplay(courseType, s)}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-800">
                      {s.term ? `Term ${s.term}` : "-"}
                    </span>
                  </td>
                  <td className="p-2 text-[11px] text-slate-600">
                    {s.phone || "-"}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap justify-center gap-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleTransition(s)}
                        className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-semibold text-sky-700 transition hover:bg-sky-200"
                        title="Transition student"
                      >
                        Move
                      </button>
                      <button
                        onClick={() => handleEdit(s)}
                        className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-200"
                        title="Edit student details"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-200"
                        title="Delete student"
                      >
                        Delete
                      </button>
                    </div>
                   </td>
                 </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  )}

  {/* Student Count */}
  {!loadingStudents && !error && filteredStudents.length > 0 && (
    <div className="mt-4 text-xs text-slate-500">
      Showing {filteredStudents.length} of {students.length} students
    </div>
  )}
</div>
    </RegistrarPageShell>
  );
};

export default RegistrarStudents;