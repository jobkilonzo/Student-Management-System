const AttendanceRecords = () => {
  const records = [
    { date: "2026-03-01", unit: "CSC101", present: 38, total: 42 },
    { date: "2026-03-02", unit: "CSC101", present: 35, total: 42 },
  ];

  return (
    <div className="p-6 min-h-screen bg-slate-100">
      <h1 className="text-3xl font-bold mb-6">Attendance Records</h1>

      <div className="bg-white rounded-xl shadow">
        <table className="w-full">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Unit</th>
              <th className="p-3 text-center">Present</th>
              <th className="p-3 text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i} className="border-t text-center">
                <td className="p-3">{r.date}</td>
                <td className="p-3">{r.unit}</td>
                <td className="p-3">{r.present}</td>
                <td className="p-3">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceRecords;