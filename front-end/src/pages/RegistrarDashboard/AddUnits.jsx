import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { makeRequest } from "../../../axios";

const AddUnits = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState({});
  const [unitForm, setUnitForm] = useState({ code: "", name: "" });
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editForm, setEditForm] = useState({ code: "", name: "" });

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
  // FETCH UNITS FOR COURSE
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

  const handleChange = (e) =>
    setUnitForm({ ...unitForm, [e.target.name]: e.target.value });

  // =============================
  // ADD UNIT
  // =============================
  const handleAddUnit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await makeRequest.post("registrar/units/create", {
        ...unitForm,
        course_id: courseId,
      });

      setUnits([...units, res.data]);
      setUnitForm({ code: "", name: "" });
    } catch (err) {
      console.error("Error adding unit:", err);
      alert("Failed to add unit");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // EDIT UNIT
  // =============================
  const handleEdit = (unit) => {
    setEditingUnitId(unit.id);
    setEditForm({ code: unit.code, name: unit.name });
  };

  const handleEditChange = (e) =>
    setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleSaveEdit = async (id) => {
    try {
      const res = await makeRequest.put(`registrar/units/${id}`, editForm);
      setUnits(units.map((u) => (u.id === id ? res.data : u)));
      setEditingUnitId(null);
    } catch (err) {
      console.error("Error updating unit:", err);
      alert("Failed to update unit");
    }
  };

  const handleCancelEdit = () => setEditingUnitId(null);

  // =============================
  // DELETE UNIT
  // =============================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;

    try {
      await makeRequest.delete(`registrar/units/${id}`);
      setUnits(units.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Error deleting unit:", err);
      alert("Failed to delete unit");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col">
      <h1 className="text-3xl font-bold mb-6">
        Units for {course.course_name || course.name} ({course.course_code || course.code})
      </h1>

      {/* Unit Form */}
      <form
        onSubmit={handleAddUnit}
        className="bg-white p-6 rounded-xl shadow grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <input
          name="code"
          value={unitForm.code}
          onChange={handleChange}
          placeholder="Unit Code (e.g., BIT101)"
          required
          className="border p-2 rounded"
          disabled={loading}
        />
        <input
          name="name"
          value={unitForm.name}
          onChange={handleChange}
          placeholder="Unit Name"
          required
          className="border p-2 rounded"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded p-2 col-span-full hover:bg-blue-700 transition"
        >
          {loading ? "Adding..." : "Add Unit"}
        </button>
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
                  key={u.id}
                  className="border-t hover:bg-blue-50 transition rounded-md"
                >
                  {editingUnitId === u.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          name="code"
                          value={editForm.code}
                          onChange={handleEditChange}
                          className="border p-1 rounded w-full"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                          className="border p-1 rounded w-full"
                        />
                      </td>
                      <td className="px-4 py-2 flex gap-2 justify-center">
                        <button
                          onClick={() => handleSaveEdit(u.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{u.code}</td>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2 flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(u)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
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