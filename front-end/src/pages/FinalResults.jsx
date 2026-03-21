import { useState } from "react";

const FinalResults = () => {
  // Mock data (later this can come from API / shared state)
  const results = [
    {
      studentId: "BIT/001/24",
      studentName: "John Mwangi",
      unit: "Introduction to IT",
      cat: 24,
      exam: 56,
    },
    {
      studentId: "BIT/002/24",
      studentName: "Mary Achieng",
      unit: "Database Systems",
      cat: 27,
      exam: 61,
    },
  ];

  const calculateGrade = (total) => {
    if (total >= 70) return "Distinction 1";
    if (total >= 60) return "Distinction 1";
    if (total >= 50) return "Credit";
    if (total >= 40) return "Pass";
    return "Refer";
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="mb-6 text-slate-700 font-medium hover:text-blue-600 transition flex items-center"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Final Results (CAT + End-Term)
        </h1>
        <p className="text-slate-600 mt-2">
          CAT (30) + End-Term (70) = Total (100)
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto w-full max-w-7xl mx-auto flex-1">
        <table className="w-full min-w-[800px] text-left">
          <thead className="bg-slate-200 text-slate-700">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Reg. No</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-center">CAT (30)</th>
              <th className="px-4 py-3 text-center">Exam (70)</th>
              <th className="px-4 py-3 text-center">Total (100)</th>
              <th className="px-4 py-3 text-center">Grade</th>
            </tr>
          </thead>

          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-6 text-slate-500">
                  No results available.
                </td>
              </tr>
            ) : (
              results.map((r, i) => {
                const total = r.cat + r.exam;
                return (
                  <tr key={i} className="border-t hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium">{r.studentName}</td>
                    <td className="px-4 py-3">{r.studentId}</td>
                    <td className="px-4 py-3">{r.unit}</td>
                    <td className="px-4 py-3 text-center">{r.cat}</td>
                    <td className="px-4 py-3 text-center">{r.exam}</td>
                    <td className="px-4 py-3 text-center font-bold">
                      {total}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {calculateGrade(total)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinalResults;