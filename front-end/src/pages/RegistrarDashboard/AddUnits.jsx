import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const AddUnits = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState({});
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({ code: "", name: "", module: "" });
  const [editingUnitId, setEditingUnitId] = useState(null);

  // =============================
  // FETCH COURSE DETAILS
  // =============================
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await makeRequest.get(`registrar/courses/${courseId}`);
        setCourse(res.data); // res.data should include course_type
      } catch (err) {
        console.error("Error fetching course:", err);
      }
    };
    fetchCourse();
  }, [courseId]);

  // =============================
  // FETCH UNITS
  // =============================
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await makeRequest.get(`registrar/units/course/${courseId}`);
        setUnits(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching units:", err);
        setUnits([]);
      }
    };
    fetchUnits();
  }, [courseId]);

  // =============================
  // MODULE OPTIONS BASED ON COURSE TYPE
  // =============================
  const getModuleOptions = () => {
    if (!course || !course.course_name) return [];
    // Using course_name to determine type (adjust if you store course_type)
    if (course.course_name.toLowerCase().includes("craft")) return [1, 2];
    if (course.course_name.toLowerCase().includes("diploma")) return [1, 2, 3];
    return [];
  };

  const moduleOptions = getModuleOptions();

  // =============================
  // HANDLE FORM CHANGE
  // =============================
  const handleChange = (e) => {
    const value = e.target.name === "module" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  // =============================
  // ADD OR EDIT UNIT
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUnitId) {
        // EDIT
        const res = await makeRequest.put(`registrar/units/${editingUnitId}`, {
          unit_code: form.code,
          unit_name: form.name,
          module: form.module,
          course_id: courseId,
          course_code: course.course_code || course.code,
        });

        setUnits(units.map((u) => (u.unit_id === editingUnitId ? res.data : u)));
        setEditingUnitId(null);
      } else {
        // ADD
        const res = await makeRequest.post("registrar/units/create", {
          unit_code: form.code,
          unit_name: form.name,
          module: form.module,
          course_id: courseId,
          course_code: course.course_code || course.code,
        });

        setUnits([...units, res.data]);
      }

      setForm({ code: "", name: "", module: "" });
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
    setForm({ code: unit.unit_code, name: unit.unit_name, module: unit.module || "" });
  };
  const handleCancelEdit = () => {
    setEditingUnitId(null);
    setForm({ code: "", name: "", module: "" });
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f0f9ff_38%,_#f8fafc_78%)] p-8 flex flex-col">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mb-4 rounded-xl bg-slate-700 px-4 py-2 text-white transition hover:bg-slate-800"
      >
        &larr; Back
      </button>

      <h1 className="text-3xl font-bold mb-6">
        Units for {course.course_name || course.name} ({course.course_code || course.code})
      </h1>

      {/* Unit Form (Add/Edit) */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 grid grid-cols-1 gap-4 rounded-[28px] border border-sky-100 bg-white/95 p-6 shadow-lg md:grid-cols-4"
      >
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Unit Code (e.g., BIT101)"
          required
          className="rounded-xl border border-sky-200 p-3"
          disabled={loading}
        />
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Unit Name"
          required
          className="rounded-xl border border-sky-200 p-3"
          disabled={loading}
        />
        <select
          name="module"
          value={form.module}
          onChange={handleChange}
          required
          className="rounded-xl border border-sky-200 p-3"
          disabled={loading || moduleOptions.length === 0}
        >
          <option value="" disabled>
            Select Module
          </option>
          {moduleOptions.map((m) => (
            <option key={m} value={m}>
              Module {m}
            </option>
          ))}
        </select>
        <div className="col-span-full flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-sky-600 p-3 text-white transition hover:bg-sky-700"
          >
            {loading ? "Saving..." : editingUnitId ? "Save Changes" : "Add Unit"}
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
          <thead className="bg-sky-100 text-sky-950">
            <tr>
              <th className="px-4 py-3">Unit Code</th>
              <th className="px-4 py-3">Unit Name</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
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
                  <td className="px-4 py-2">{u.unit_code}</td>
                  <td className="px-4 py-2">{u.unit_name}</td>
                  <td className="px-4 py-2">{u.module ? `Module ${u.module}` : "-"}</td>
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