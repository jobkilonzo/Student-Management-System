import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const AddUnits = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState({});
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courseStructureType, setCourseStructureType] = useState("unknown");

  // Form state
  const [form, setForm] = useState({
    code: "",
    name: "",
    module: "",
    stage: "",
    grade: "",
    level_based: "",
    non_modular: ""
  });
  const [editingUnitId, setEditingUnitId] = useState(null);

  // =============================
  // FETCH COURSE DETAILS
  // =============================
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await makeRequest.get(`registrar/courses/${courseId}`);
        console.log("Course data:", res.data);
        setCourse(res.data);
        determineCourseStructure(res.data);
      } catch (err) {
        console.error("Error fetching course:", err);
      }
    };
    fetchCourse();
  }, [courseId]);

  // =============================
  // DETERMINE COURSE STRUCTURE TYPE
  // =============================
  const determineCourseStructure = (courseData) => {
    if (!courseData) return;

    const courseType =
      courseData.course_type?.toLowerCase().trim() || "";

    console.log("Detected type:", courseType);

    if (courseType === "modular") {
      setCourseStructureType("modular");
      return;
    }

    if (courseType === "non_modular") {
      setCourseStructureType("non_modular");
      return;
    }

    if (courseType === "level_based") {
      setCourseStructureType("level_based");
      return;
    }

    if (courseType === "stage_based") {
      setCourseStructureType("stage");
      return;
    }

    if (courseType === "grade_based") {
      setCourseStructureType("grade");
      return;
    }

    setCourseStructureType("unknown");
  };

  // =============================
  // FETCH UNITS
  // =============================
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await makeRequest.get(`registrar/units/course/${courseId}`);
        console.log("Units data:", res.data);
        setUnits(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching units:", err);
        setUnits([]);
      }
    };
    fetchUnits();
  }, [courseId]);

  // =============================
  // MODULE OPTIONS (for modular/non_modular courses)
  // =============================
  const getModuleOptions = () => {
    if (courseStructureType !== "modular") return [];

    const courseName = course.course_name?.toLowerCase() || "";

    // Craft courses typically have 2 modules
    if (courseName.includes("craft")) return [1, 2];
    // Certificate courses might have 2-3 modules
    if (courseName.includes("diploma")) return [1, 2, 3];
    // Default for modular courses
    return [1, 2, 3];
  };

  // =============================
  // STAGE OPTIONS (for stage_based courses)
  // =============================
  const getStageOptions = () => {
    if (courseStructureType !== "stage") return [];

    const courseName = course.course_name?.toLowerCase() || "";

    // Diploma courses typically have 3 stages
    if (courseName.includes("diploma")) return [1, 2, 3];
    // Default for stage-based courses
    return [1, 2, 3];
  };
  const getLevelBasedOptions = () => {
    return [1, 2, 3];
  };

  const getNonModularOptions = () => {
    return [];
  };

  const level_basedOptions = getLevelBasedOptions();
  const non_modular = getNonModularOptions();

  const moduleOptions = getModuleOptions();
  const stageOptions = getStageOptions();

  // =============================
  // HANDLE FORM CHANGE
  // =============================
  const handleChange = (e) => {
    const value = e.target.name === "module" || e.target.name === "stage"
      ? Number(e.target.value)
      : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  // =============================
  // ADD OR EDIT UNIT
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate based on course type
    if (courseStructureType === "modular" && !form.module) {
      alert("Please select a module");
      setLoading(false);
      return;
    }

    if (courseStructureType === "stage" && !form.stage) {
      alert("Please select a stage/grade");
      setLoading(false);
      return;
    }

    // Prepare unit data based on course type
    const unitData = {
      unit_code: form.code,
      unit_name: form.name,
      course_id: courseId,
      course_code: course.course_code || course.code,
    };

    if (courseStructureType === "modular") {
      unitData.module = form.module;
    }

    else if (
      courseStructureType === "stage" ||
      courseStructureType === "grade" ||
      courseStructureType === "level_based" ||
      courseStructureType === "non_modular"
    ) {
      unitData.stage =
        form.stage ||
        form.grade ||
        form.level_based ||
        form.non_modular;
    }

    try {
      if (editingUnitId) {
        // EDIT
        const res = await makeRequest.put(`registrar/units/${editingUnitId}`, unitData);
        setUnits(units.map((u) => (u.unit_id === editingUnitId ? res.data : u)));
        setEditingUnitId(null);
      } else {
        // ADD
        const res = await makeRequest.post("registrar/units/create", unitData);
        setUnits([...units, res.data]);
        // Switch to edit mode for the newly added unit
        setEditingUnitId(res.data.unit_id);
        setForm({
          code: res.data.unit_code,
          name: res.data.unit_name,
          module: res.data.module || "",
          stage: res.data.stage || "",
          grade: res.data.stage || "",
          level_based: res.data.stage || "",
          non_modular: res.data.stage || ""
        });
      }
    } catch (err) {
      console.error("Error saving unit:", err);
      alert("Failed to save unit. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // EDIT / CANCEL
  // =============================
  const handleEdit = (unit) => {
    setEditingUnitId(unit.unit_id);
    setForm({
      code: unit.unit_code,
      name: unit.unit_name,
      module: unit.module || "",
      stage: unit.stage || "",
      grade: unit.stage || "",
      level_based: unit.stage || "",
      non_modular: unit.stage || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingUnitId(null);
    setForm({
      code: "",
      name: "",
      module: "",
      stage: "",
      grade: "",
      level_based: "",
      non_modular: ""
    });
  };

  // =============================
  // DELETE UNIT
  // =============================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;

    try {
      setLoading(true);
      await makeRequest.delete(`registrar/units/${id}`);
      setUnits(units.filter((u) => u.unit_id !== id));
    } catch (err) {
      console.error("Error deleting unit:", err);
      alert("Failed to delete unit");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // BACK BUTTON
  // =============================
  const handleBack = () => navigate(-1);

  // =============================
  // RENDER LEVEL SELECTOR (Module or Stage)
  // =============================
  const renderLevelSelector = () => {
    if (courseStructureType === "modular") {
      return (
        <select
          name="module"
          value={form.module}
          onChange={handleChange}
          required
          className="rounded-xl border border-sky-200 p-3"
          disabled={loading || moduleOptions.length === 0}
        >
          <option value="" disabled>Select Module</option>
          {moduleOptions.map((m) => (
            <option key={m} value={m}>
              Module {m}
            </option>
          ))}
        </select>
      );
    }

    if (courseStructureType === "non_modular") {
      return null;
    }

    if (courseStructureType === "level_based") {
      return (
        <select
          name="level_based"
          value={form.level_based}
          onChange={handleChange}
          required
          className="rounded-xl border border-sky-200 p-3"
          disabled={loading || level_basedOptions.length === 0}
        >
          <option value="" disabled>Select Level</option>
          {level_basedOptions.map((s) => (
            <option key={s} value={s}>
              Level {s}
            </option>
          ))}
        </select>
      );
    }

    if (courseStructureType === "stage") {
      return (
        <select
          name="stage"
          value={form.stage}
          onChange={handleChange}
          required
          className="rounded-xl border border-sky-200 p-3"
          disabled={loading || stageOptions.length === 0}
        >
          <option value="" disabled>Select Stage</option>
          {stageOptions.map((s) => (
            <option key={s} value={s}>
              Stage {s}
            </option>
          ))}
        </select>
      );
    }

    if (courseStructureType === "grade") {
      return (
        <select
          name="grade"
          value={form.grade}
          onChange={handleChange}
          required
          className="rounded-xl border border-sky-200 p-3"
        >
          <option value="" disabled>Select Grade</option>
          <option value="1">Grade 1</option>
          <option value="2">Grade 2</option>
          <option value="3">Grade 3</option>
        </select>
      );
    }

    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
        ⚠️ Unable to determine course structure. Course type:{" "}
        {course.course_type || "Not set"}
        <div className="text-xs mt-1">
          Course Name: {course.course_name || "N/A"}
          <br />
          Course Type: {course.course_type || "Not set"}
        </div>
      </div>
    );
  };
  // =============================
  // RENDER TABLE HEADER
  // =============================
  const renderTableHeader = () => {
    if (courseStructureType === "modular") {
      return (
        <thead className="bg-sky-100 text-sky-950">
          <tr>
            <th className="px-4 py-3">Unit Code</th>
            <th className="px-4 py-3">Unit Name</th>
            <th className="px-4 py-3">Module</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
      );
    }

    if (courseStructureType === "stage") {
      return (
        <thead className="bg-sky-100 text-sky-950">
          <tr>
            <th className="px-4 py-3">Unit Code</th>
            <th className="px-4 py-3">Unit Name</th>
            <th className="px-4 py-3">Stage/Grade</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
      );
    }

    return (
      <thead className="bg-sky-100 text-sky-950">
        <tr>
          <th className="px-4 py-3">Unit Code</th>
          <th className="px-4 py-3">Unit Name</th>
          <th className="px-4 py-3">Level</th>
          <th className="px-4 py-3">Actions</th>
        </tr>
      </thead>
    );
  };

  // =============================
  // RENDER TABLE ROW
  // =============================
  const renderTableRow = (u) => {
    if (courseStructureType === "modular") {
      return (
        <>
          <td className="px-4 py-2">{u.unit_code}</td>
          <td className="px-4 py-2">{u.unit_name}</td>
          <td className="px-4 py-2">
            {u.module ? `Module ${u.module}` : "-"}
          </td>
        </>
      );
    }

    if (courseStructureType === "non_modular") {
      return (
        <>
          <td className="px-4 py-2">{u.unit_code}</td>
          <td className="px-4 py-2">{u.unit_name}</td>
          <td className="px-4 py-2">
            {u.stage ? `Level ${u.stage}` : "-"}
          </td>
        </>
      );
    }

    if (courseStructureType === "level_based") {
      return (
        <>
          <td className="px-4 py-2">{u.unit_code}</td>
          <td className="px-4 py-2">{u.unit_name}</td>
          <td className="px-4 py-2">
            {u.stage ? `Level ${u.stage}` : "-"}
          </td>
        </>
      );
    }

    if (courseStructureType === "stage") {
      return (
        <>
          <td className="px-4 py-2">{u.unit_code}</td>
          <td className="px-4 py-2">{u.unit_name}</td>
          <td className="px-4 py-2">
            {u.stage ? `Stage ${u.stage}` : "-"}
          </td>
        </>
      );
    }

    if (courseStructureType === "grade") {
      return (
        <>
          <td className="px-4 py-2">{u.unit_code}</td>
          <td className="px-4 py-2">{u.unit_name}</td>
          <td className="px-4 py-2">
            {u.stage ? `Grade ${u.stage}` : "-"}
          </td>
        </>
      );
    }

    return (
      <>
        <td className="px-4 py-2">{u.unit_code}</td>
        <td className="px-4 py-2">{u.unit_name}</td>
        <td className="px-4 py-2">-</td>
      </>
    );
  };

  // Loading state
  if (!course.course_id && !course.course_name) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f0f9ff_38%,_#f8fafc_78%)] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f0f9ff_38%,_#f8fafc_78%)] p-4 sm:p-6 lg:p-8 flex flex-col">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mb-4 rounded-xl bg-slate-700 px-4 py-2 text-white transition hover:bg-slate-800 w-fit"
      >
        &larr; Back
      </button>

      <h1 className="text-3xl font-bold mb-6">
        Units for {course.course_name || course.name} ({course.course_code || course.code})
      </h1>

      {/* Course Type Indicator */}
      <div className={`mb-4 inline-block rounded-full px-4 py-1 text-sm font-semibold w-fit ${courseStructureType === "modular" ? "bg-green-100 text-green-700" :
        courseStructureType === "stage" ? "bg-purple-100 text-purple-700" :
          "bg-red-100 text-red-700"
        }`}>
        {
          courseStructureType === "modular"
            ? "📚 Modular Course"

            : courseStructureType === "non_modular"
              ? "📘 Non Modular Course"

              : courseStructureType === "level_based"
                ? "🎓 Level Based Course"

                : courseStructureType === "stage"
                  ? "📈 Stage Based Course"

                  : courseStructureType === "grade"
                    ? "🏅 Grade Based Course"

                    : "❓ Unknown Structure"
        }
      </div>

      {/* Unit Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 grid grid-cols-1 gap-4 rounded-[28px] border border-sky-100 bg-white/95 p-6 shadow-lg md:grid-cols-4"
      >
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Unit Code (e.g., 103)"
          required
          className="rounded-xl border border-sky-200 p-3"
          disabled={loading || courseStructureType === "unknown"}
        />
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Unit Name"
          required
          className="rounded-xl border border-sky-200 p-3"
          disabled={loading || courseStructureType === "unknown"}
        />

        {renderLevelSelector()}

        <div className="col-span-full flex gap-2">
          <button
            type="submit"
            disabled={loading || courseStructureType === "unknown"}
            className="flex-1 rounded-xl bg-sky-600 p-3 text-white transition hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : editingUnitId ? "Save Changes" : "Save"}
          </button>
          {editingUnitId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={loading}
              className="flex-1 rounded-xl bg-slate-600 p-3 text-white transition hover:bg-slate-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Units Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full rounded-[28px] bg-white/95 shadow-lg text-left">
          {renderTableHeader()}
          <tbody>
            {units.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">
                  No units added yet.
                </td>
              </tr>
            ) : (
              units.map((u) => (
                <tr
                  key={u.unit_id}
                  className="rounded-md border-t transition hover:bg-sky-50"
                >
                  {renderTableRow(u)}
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(u)}
                      disabled={loading}
                      className="rounded-lg bg-amber-500 px-3 py-1 text-white transition hover:bg-amber-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u.unit_id)}
                      disabled={loading}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddUnits;
