import { useState } from "react";

const CATMarks = () => {
  const [marks, setMarks] = useState([]);

  const addMark = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    setMarks([...marks, data]);
    e.target.reset();
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
        <h1 className="text-3xl font-bold text-slate-800">CAT Marks</h1>
        <p className="text-slate-600 mt-2">Manage Continuous Assessment Test (CAT) marks.</p>
      </div>

      {/* Form */}
      <form
        onSubmit={addMark}
        className="bg-white p-6 rounded-2xl shadow grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 w-full max-w-5xl mx-auto"
      >
        <input
          name="student"
          placeholder="Student Name"
          required
          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        <input
          name="unit"
          placeholder="Unit"
          required
          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        <input
          name="cat"
          type="number"
          placeholder="CAT (30)"
          min="0"
          max="30"
          required
          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        <button
          type="submit"
          className="md:col-span-3 mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
        >
          Save CAT
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto w-full max-w-6xl mx-auto flex-1">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-200 text-slate-700">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-center">CAT</th>
            </tr>
          </thead>
          <tbody>
            {marks.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-6 text-slate-500">
                  No CAT marks available.
                </td>
              </tr>
            ) : (
              marks.map((m, i) => (
                <tr key={i} className="border-t hover:bg-slate-50 transition text-center">
                  <td className="px-4 py-3">{m.student}</td>
                  <td className="px-4 py-3">{m.unit}</td>
                  <td className="px-4 py-3 font-semibold">{m.cat}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CATMarks;