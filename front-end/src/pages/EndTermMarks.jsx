import { useState } from "react";

const EndTermMarks = () => {
  /* ---- Mock Data ---- */
  const students = [
    { id: "BIT/001/24", name: "John Mwangi" },
    { id: "BIT/002/24", name: "Mary Achieng" },
    { id: "BIT/003/24", name: "Peter Kilonzo" },
  ];

  const units = [
    { code: "BIT101", name: "Introduction to IT" },
    { code: "BIT203", name: "Database Systems" },
    { code: "BIT305", name: "Computer Networks" },
  ];

  /* ---- State ---- */
  const [records, setRecords] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({ studentId: "", unitCode: "", exam: "" });

  /* ---- Handlers ---- */
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const student = students.find((s) => s.id === form.studentId);
    const unit = units.find((u) => u.code === form.unitCode);
    if (!student || !unit) return;

    const record = {
      studentId: student.id,
      studentName: student.name,
      unitCode: unit.code,
      unitName: unit.name,
      exam: Number(form.exam),
    };

    if (editIndex !== null) {
      const updated = [...records];
      updated[editIndex] = record;
      setRecords(updated);
      setEditIndex(null);
    } else {
      setRecords([...records, record]);
    }

    setForm({ studentId: "", unitCode: "", exam: "" });
  };

  const handleEdit = (index) => {
    const r = records[index];
    setForm({ studentId: r.studentId, unitCode: r.unitCode, exam: r.exam });
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    if (!window.confirm("Delete this exam record?")) return;
    setRecords(records.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()} // Works without router
        className="mb-6 text-slate-700 font-medium hover:text-blue-600 transition flex items-center space-x-2"
      >
        <span className="mr-1">←</span>
        <span>Back</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">End-Term Examination Marks</h1>
        <p className="text-slate-600 mt-2">
          Manage final examination results for registered candidates.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-2xl shadow mb-10 w-full max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          {editIndex !== null ? "Edit Exam Marks" : "Add Exam Marks"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Student Dropdown */}
          <select
            name="studentId"
            value={form.studentId}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="">Select Candidate</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>

          {/* Unit Dropdown */}
          <select
            name="unitCode"
            value={form.unitCode}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="">Select Unit</option>
            {units.map((u) => (
              <option key={u.code} value={u.code}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>

          {/* Exam Marks Input */}
          <input
            name="exam"
            type="number"
            min="0"
            max="100"
            value={form.exam}
            onChange={handleChange}
            placeholder="Exam Marks (70)"
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />

          {/* Submit Button */}
          <button
            type="submit"
            className={`md:col-span-3 mt-4 text-white font-semibold py-2 rounded-lg transition
              ${editIndex !== null ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {editIndex !== null ? "Update Marks" : "Save Marks"}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto w-full max-w-6xl mx-auto flex-1">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-200 text-slate-700">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Reg. No</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-center">Exam</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-slate-500">
                  No exam records available.
                </td>
              </tr>
            ) : (
              records.map((r, i) => (
                <tr key={i} className="border-t hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium">{r.studentName}</td>
                  <td className="px-4 py-3">{r.studentId}</td>
                  <td className="px-4 py-3">
                    {r.unitName} ({r.unitCode})
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{r.exam}</td>
                  <td className="px-4 py-3 text-center space-x-3">
                    <button
                      onClick={() => handleEdit(i)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="text-red-600 hover:underline"
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

export default EndTermMarks;