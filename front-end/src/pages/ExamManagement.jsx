import React, { useState } from "react";

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({
    unit: "",
    date: "",
    time: "",
    venue: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.unit || !form.date || !form.time || !form.venue) return;

    setExams([...exams, form]);
    setForm({ unit: "", date: "", time: "", venue: "" });
  };

  const deleteExam = (index) => {
    setExams(exams.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Exam Management
        </h1>
        <p className="text-slate-500">
          Create and manage examination schedules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Add Exam Form */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Add New Exam
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Unit Name"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              placeholder="e.g. Database Systems"
            />

            <Input
              label="Exam Date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />

            <Input
              label="Exam Time"
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
            />

            <Input
              label="Venue"
              name="venue"
              value={form.venue}
              onChange={handleChange}
              placeholder="e.g. Hall A"
            />

            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
              Add Exam
            </button>
          </form>
        </div>

        {/* Exam List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Scheduled Exams
          </h2>

          {exams.length === 0 ? (
            <p className="text-slate-500">No exams scheduled.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2">Unit</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam, index) => (
                  <tr key={index} className="border-b hover:bg-slate-50">
                    <td className="py-2">{exam.unit}</td>
                    <td>{exam.date}</td>
                    <td>{exam.time}</td>
                    <td>{exam.venue}</td>
                    <td>
                      <button
                        onClick={() => deleteExam(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

/* ---------- Reusable Input ---------- */
const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full rounded-lg border border-slate-300 px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export default ExamManagement;