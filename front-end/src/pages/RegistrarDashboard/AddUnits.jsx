import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const AddUnits = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState({});
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state (used for both add & edit)
  const [form, setForm] = useState({ code: "", name: "" });
  const [editingUnitId, setEditingUnitId] = useState(null);

  // =============================
  // FETCH COURSE DETAILS
  // =============================
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await makeRequest.get(`registrar/courses/${courseId}`);
        setCourse(res.data);
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
  // HANDLE FORM CHANGE
  // =============================
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
        });
        setUnits(units.map((u) => (u.unit_id === editingUnitId ? res.data : u)));
        setEditingUnitId(null);
      } else {
        // ADD
        const res = await makeRequest.post("registrar/units/create", {
          unit_code: form.code,
          unit_name: form.name,
          course_id: courseId,
        });
        setUnits([...units, res.data]);
      }

      setForm({ code: "", name: "" });
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
    setForm({ code: unit.unit_code, name: unit.unit_name });
  };
  const handleCancelEdit = () => {
    setEditingUnitId(null);
    setForm({ code: "", name: "" });
  };

  // =============================
  // DELETE UNIT
  // =============================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;

    try {
      await makeRequest.delete(`registrar/units/${id}`);
      setUnits(units.filter((u) => u.unit_id !== id));
    } catch (err) {
      console.error("Error deleting unit:", err);
      alert("Failed to delete unit");
    }
  };

  // =============================
  // BACK BUTTON
  // =============================
  const handleBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="bg-gray-500 text-white px-4 py-2 rounded mb-4 hover:bg-gray-600 transition"
      >
        &larr; Back
      </button>

      <h1 className="text-3xl font-bold mb-6">
        Units for {course.course_name || course.name} ({course.course_code || course.code})
      </h1>

      {/* Unit Form (Add/Edit) */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Unit Code (e.g., BIT101)"
          required
          className="border p-2 rounded"
          disabled={loading}
        />
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Unit Name"
          required
          className="border p-2 rounded"
          disabled={loading}
        />
        <div className="col-span-full flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 text-white rounded p-2 flex-1 hover:bg-blue-700 transition`}
          >
            {loading ? "Saving..." : editingUnitId ? "Save Changes" : "Add Unit"}
          </button>
          {editingUnitId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-500 text-white rounded p-2 flex-1 hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Units Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full bg-white rounded-xl shadow text-left">
          <thead className="bg-slate-200">
            <tr>
              <th className="px-4 py-3">Unit Code</th>
              <th className="px-4 py-3">Unit Name</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-gray-500">
                  No units added yet.
                </td>
              </tr>
            ) : (
              units.map((u) => (
                <tr
                  key={u.unit_id} // ✅ Unique key
                  className="border-t hover:bg-blue-50 transition rounded-md"
                >
                  <td className="px-4 py-2">{u.unit_code}</td>
                  <td className="px-4 py-2">{u.unit_name}</td>
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(u)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u.unit_id)}
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