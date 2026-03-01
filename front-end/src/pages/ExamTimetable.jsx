import { useState } from "react";

const ExamTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [form, setForm] = useState({ unit: "", date: "", time: "", venue: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setTimetable([...timetable, form]);
    setForm({ unit: "", date: "", time: "", venue: "" });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="mb-6 text-slate-700 font-medium hover:text-blue-600 transition flex items-center space-x-2"
      >
        <span className="mr-1">←</span>
        <span>Back</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Exam Timetable</h1>
        <p className="text-slate-600 mt-2">Add and manage your exam schedule.</p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow mb-10 grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-6xl mx-auto"
      >
        <input
          placeholder="Unit"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          required
          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        <input
          type="time"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
          required
          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        <input
          placeholder="Venue"
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
          required
          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        <button
          type="submit"
          className="md:col-span-4 mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
        >
          Publish Exam
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto w-full max-w-6xl mx-auto flex-1">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-200 text-slate-700">
            <tr>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Venue</th>
            </tr>
          </thead>
          <tbody>
            {timetable.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-6 text-slate-500">
                  No exam timetable available.
                </td>
              </tr>
            ) : (
              timetable.map((e, i) => (
                <tr key={i} className="border-t hover:bg-slate-50 transition text-center">
                  <td className="px-4 py-3">{e.unit}</td>
                  <td className="px-4 py-3">{e.date}</td>
                  <td className="px-4 py-3">{e.time}</td>
                  <td className="px-4 py-3">{e.venue}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamTimetable;