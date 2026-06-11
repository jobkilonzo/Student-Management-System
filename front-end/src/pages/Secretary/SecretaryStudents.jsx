import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { makeRequest } from "../../../axios";
import SecretaryShell from "./SecretaryShell";

const TYPES = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const SecretaryStudents = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [courseFees, setCourseFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    course_id: "",
    level: "",
    term: "",
    page: 1,
    limit: 10,
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [credentials, setCredentials] = useState(null);

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    gender: "Male",
    course_id: "",
    level: "",
    term: "",
    phone: "",
    guardian_name: "",
    guardian_phone: "",
    selected_fee_ids: [],
  });

  const selectedCourse = useMemo(() => {
    return courses.find((c) => String(c.course_id) === String(form.course_id));
  }, [courses, form.course_id]);

  // Get course type and level configuration
  const courseConfig = useMemo(() => {
    if (!selectedCourse) return { type: "none", count: 0, label: "", hasLevels: false };
    
    const courseType = selectedCourse.course_type?.toLowerCase() || "";
    const courseName = selectedCourse.course_name?.toLowerCase() || "";
    
    // stage_based courses
    if (courseType === "stage_based") {
      return { type: "stage", count: 3, label: "Stage", hasLevels: true };
    }
    
    // modular courses
    if (courseType === "modular") {
      if (courseName.includes("craft")) {
        return { type: "module", count: 2, label: "Module", hasLevels: true };
      }
      if (courseName.includes("diploma")) {
        return { type: "module", count: 3, label: "Module", hasLevels: true };
      }
      return { type: "module", count: 3, label: "Module", hasLevels: true };
    }
    
    // non_modular courses - NO levels
    if (courseType === "non_modular") {
      return { type: "none", count: 0, label: "", hasLevels: false };
    }
    
    // grade_based or level_based courses
    if (courseType === "grade_based") {
      return { type: "grade", count: 4, label: "Grade", hasLevels: true };
    }
    if (courseType === "level_based") {
      return { type: "level", count: 3, label: "Level", hasLevels: true };
    }
    
    return { type: "none", count: 0, label: "", hasLevels: false };
  }, [selectedCourse]);

  const levelOptions = useMemo(() => {
    if (!form.course_id || !courseConfig.hasLevels) return [];
    return Array.from({ length: courseConfig.count }, (_, i) => ({
      value: i + 1,
      label: `${courseConfig.label} ${i + 1}`
    }));
  }, [courseConfig, form.course_id]);

  const termOptions = useMemo(() => {
    if (!form.course_id) return [];
    return ["Term 1", "Term 2", "Term 3"];
  }, [form.course_id]);

  const matchingFees = useMemo(() => {
    if (!form.course_id || !form.term) return [];

    const course = courseFees.find((item) => String(item.course_id) === String(form.course_id));
    if (!course?.fees_per_term?.length) return [];

    return course.fees_per_term.filter((fee) => {
      const termMatches = String(fee.term) === String(form.term);
      const levelMatches = courseConfig.hasLevels
        ? String(fee.module) === String(form.level)
        : fee.module === null || fee.module === undefined || fee.module === "";
      return termMatches && levelMatches;
    });
  }, [courseFees, courseConfig.hasLevels, form.course_id, form.level, form.term]);

  const selectedFeeTotal = useMemo(() => {
    return matchingFees
      .filter((fee) => form.selected_fee_ids.includes(fee.id))
      .reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  }, [form.selected_fee_ids, matchingFees]);

  const fetchCourses = async () => {
    try {
      const res = await makeRequest.get("/secretary/courses");
      setCourses(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load courses");
      setCourses([]);
    }
  };

  const fetchCourseFees = async () => {
    try {
      const res = await makeRequest.get("/secretary/course-fees");
      setCourseFees(res.data || []);
    } catch (err) {
      console.error(err);
      setCourseFees([]);
      toast.error("Failed to load fee options");
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await makeRequest.get("/secretary/students", {
        params: {
          search: filters.search || undefined,
          course_id: filters.course_id || undefined,
          module: filters.level || undefined,
          term: filters.term || undefined,
          page: filters.page,
          limit: filters.limit,
        },
      });
      setStudents(res.data.students || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load students");
      setStudents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCourseFees();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [filters.page, filters.limit, filters.search, filters.course_id, filters.level, filters.term]);

  useEffect(() => {
    if (editing || !form.course_id || !form.term || (courseConfig.hasLevels && !form.level)) return;
    setForm((prev) => ({
      ...prev,
      selected_fee_ids: matchingFees.map((fee) => fee.id),
    }));
  }, [courseConfig.hasLevels, editing, form.course_id, form.level, form.term, matchingFees]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / filters.limit)), [total, filters.limit]);

  const openCreate = () => {
    setEditing(null);
    setCredentials(null);
    setForm({
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      gender: "Male",
      course_id: "",
      level: "",
      term: "",
      phone: "",
      guardian_name: "",
      guardian_phone: "",
      selected_fee_ids: [],
    });
    setShowForm(true);
  };

  const openEdit = async (studentId) => {
    try {
      const res = await makeRequest.get(`/secretary/students/${studentId}`);
      const s = res.data.student;
      setEditing({ student_id: studentId, user_id: s.user_id });
      setCredentials(null);
      setForm({
        first_name: s.user_first_name || s.first_name || "",
        middle_name: s.user_middle_name || s.middle_name || "",
        last_name: s.user_last_name || s.last_name || "",
        email: s.user_email || s.email || "",
        gender: s.gender || "Male",
        course_id: s.course_id ? String(s.course_id) : "",
        level: s.module || s.stage || "",
        term: s.term || "",
        phone: s.phone || "",
        guardian_name: s.guardian_name || "",
        guardian_phone: s.guardian_phone || "",
        selected_fee_ids: [],
      });
      setShowForm(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load student");
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = {
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        guardian_name: form.guardian_name,
        guardian_phone: form.guardian_phone,
        term: form.term ? Number(form.term) : undefined,
        course_id: form.course_id ? Number(form.course_id) : undefined,
        selected_fee_ids: form.selected_fee_ids,
      };

      // Add level based on course type
      if (courseConfig.hasLevels && form.level) {
        submitData.module = Number(form.level);
      }

      if (editing) {
        await makeRequest.put(`/secretary/students/${editing.student_id}`, submitData);
        toast.success("Student updated successfully");
        setShowForm(false);
        fetchStudents();
      } else {
        const res = await makeRequest.post("/secretary/students/register", {
          ...submitData,
          gender: form.gender,
        });

        setCredentials({
          reg_no: res.data.reg_no,
          temp_password: res.data.temp_password,
        });
        toast.success("Student created successfully");
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const applySearch = () => {
    setFilters((p) => ({ ...p, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      course_id: "",
      level: "",
      term: "",
      page: 1,
      limit: 10,
    });
  };

  // Helper to display level value (Module or Stage)
  const getLevelDisplay = (student) => {
    const courseType = student.course_type;
    const levelValue = student.module || student.stage;
    
    if (!levelValue) return "—";
    
    if (courseType === "stage_based") return `Stage ${levelValue}`;
    if (courseType === "modular") return `Module ${levelValue}`;
    if (courseType === "grade_based") return `Grade ${levelValue}`;
    if (courseType === "level_based") return `Level ${levelValue}`;
    
    return levelValue;
  };

  return (
    <SecretaryShell
      title="Manage Students"
      subtitle="Add new students, search and filter, and update limited details (names, email, phone, guardian, level, term, course)."
    >
      <Toaster position="top-right" />

      {/* Credentials Display */}
      {credentials && (
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 mb-6">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Temporary Credentials</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <div className="text-xs text-slate-500">Registration Number</div>
              <div className="mt-1 font-mono text-lg font-bold">{credentials.reg_no}</div>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <div className="text-xs text-slate-500">Default Password</div>
              <div className="mt-1 font-mono text-lg font-bold">{credentials.temp_password}</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-emerald-800">
            ⚠️ Share these credentials with the student. They will be required to change password on first login.
          </div>
        </div>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <input
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              onKeyPress={(e) => e.key === "Enter" && applySearch()}
              placeholder="Search name, reg no, email..."
              className="w-full md:w-[280px] rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
            <select
              value={filters.course_id}
              onChange={(e) => setFilters((p) => ({ ...p, course_id: e.target.value, page: 1 }))}
              className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_name}
                </option>
              ))}
            </select>
            <input
              value={filters.level}
              onChange={(e) => setFilters((p) => ({ ...p, level: e.target.value, page: 1 }))}
              placeholder="Module/Stage"
              className="w-[130px] rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
            />
            <select
              value={filters.term}
              onChange={(e) => setFilters((p) => ({ ...p, term: e.target.value, page: 1 }))}
              className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
            >
              <option value="">All Terms</option>
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
            <button
              onClick={applySearch}
              className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Search
            </button>
            <button
              onClick={clearFilters}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          </div>

          <button
            onClick={openCreate}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            + Add New Student
          </button>
        </div>

        {/* Students Table */}
        <div className="mt-5 overflow-auto rounded-3xl border border-slate-200 bg-slate-50">
          <table className="min-w-full">
            <thead className="bg-slate-100/80">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reg No</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Full Name</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Course</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Level</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Term</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent"></div>
                      Loading students...
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                    No students found. Try adjusting your filters or add a new student.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.student_id} className="bg-white transition hover:bg-sky-50/60">
                    <td className="px-5 py-4 font-mono font-semibold text-sky-700">{s.reg_no}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{s.full_name}</td>
                    <td className="px-5 py-4 text-slate-700">{s.email || "—"}</td>
                    <td className="px-5 py-4 text-slate-700">{s.course_name || "—"}</td>
                    <td className="px-5 py-4 text-slate-700">{getLevelDisplay(s)}</td>
                    <td className="px-5 py-4 text-slate-700">{s.term ? `Term ${s.term}` : "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/secretary/students/${s.student_id}`)}
                          className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEdit(s.student_id)}
                          className="rounded-xl bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-200"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <div>
            Showing page <span className="font-semibold">{filters.page}</span> of{" "}
            <span className="font-semibold">{pages}</span> • Total <span className="font-semibold">{total}</span> students
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={filters.page <= 1}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, page: Math.min(pages, p.page + 1) }))}
              disabled={filters.page >= pages}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editing ? "Edit Student" : "Add New Student"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {editing
                    ? "Update student information. Fields marked with * are required."
                    : "Fill in the student details. Temporary credentials will be shown after creation."}
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submitForm} className="mt-5 grid gap-4 md:grid-cols-2">
              <Field 
                label="First Name *" 
                value={form.first_name} 
                onChange={(v) => setForm((p) => ({ ...p, first_name: v }))} 
                required 
              />
              <Field 
                label="Middle Name" 
                value={form.middle_name} 
                onChange={(v) => setForm((p) => ({ ...p, middle_name: v }))} 
              />
              <Field 
                label="Last Name *" 
                value={form.last_name} 
                onChange={(v) => setForm((p) => ({ ...p, last_name: v }))} 
                required 
              />
              <Field 
                label="Email *" 
                value={form.email} 
                onChange={(v) => setForm((p) => ({ ...p, email: v }))} 
                required 
                type="email" 
              />

              {!editing ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Gender *</span>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-sky-500"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Gender cannot be changed after creation
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Course *</span>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value, level: "", term: "", selected_fee_ids: [] }))}
                  required
                  className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-sky-500"
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course_name} ({c.course_type === "non_modular" ? "No levels" : c.course_type === "stage_based" ? "Stages" : "Modules"})
                    </option>
                  ))}
                </select>
              </label>

              {/* Level dropdown - only for courses with levels */}
              {courseConfig.hasLevels && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">{courseConfig.label} *</span>
                  <select
                    value={form.level}
                    onChange={(e) => setForm((p) => ({ ...p, level: e.target.value, term: "", selected_fee_ids: [] }))}
                    required
                    disabled={!form.course_id}
                    className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!form.course_id ? "Select course first" : `Select ${courseConfig.label}`}
                    </option>
                    {levelOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Term *</span>
                <select
                  value={form.term}
                  onChange={(e) => setForm((p) => ({ ...p, term: e.target.value, selected_fee_ids: [] }))}
                  required
                  disabled={!form.course_id || (courseConfig.hasLevels && !form.level)}
                  className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!form.course_id 
                      ? "Select course first" 
                      : (courseConfig.hasLevels && !form.level) 
                      ? `Select ${courseConfig.label} first` 
                      : "Select term"}
                  </option>
                  {termOptions.map((t, index) => (
                    <option key={t} value={index + 1}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <Field 
                label="Phone" 
                value={form.phone} 
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))} 
              />
              <Field 
                label="Guardian Name" 
                value={form.guardian_name} 
                onChange={(v) => setForm((p) => ({ ...p, guardian_name: v }))} 
              />
              <Field 
                label="Guardian Phone" 
                value={form.guardian_phone} 
                onChange={(v) => setForm((p) => ({ ...p, guardian_phone: v }))} 
              />

              {!editing && form.course_id && form.term && (!courseConfig.hasLevels || form.level) && (
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Fees for this student</p>
                      <p className="text-xs text-slate-500">Pick the fee items to assign for the selected course, module, and term.</p>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                      Total: KSh {selectedFeeTotal.toLocaleString()}
                    </div>
                  </div>

                  {matchingFees.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      No fee setup found for this course selection. The student can still be created, then accountant can edit fees later.
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {matchingFees.map((fee) => (
                        <label key={fee.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <input
                            type="checkbox"
                            checked={form.selected_fee_ids.includes(fee.id)}
                            onChange={(e) => {
                              setForm((prev) => ({
                                ...prev,
                                selected_fee_ids: e.target.checked
                                  ? [...prev.selected_fee_ids, fee.id]
                                  : prev.selected_fee_ids.filter((id) => id !== fee.id),
                              }));
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-sky-700"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800">{fee.fee_type_name}</span>
                            <span className="block text-xs text-slate-500">KSh {Number(fee.amount || 0).toLocaleString()}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {editing ? "Updating..." : "Creating..."}
                    </span>
                  ) : (
                    editing ? "Update Student" : "Create Student"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SecretaryShell>
  );
};

const Field = ({ label, value, onChange, required, type = "text" }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
    />
  </label>
);

export default SecretaryStudents;
