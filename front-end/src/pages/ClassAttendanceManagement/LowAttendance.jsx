const LowAttendance = () => {
  const students = [
    { regNo: "CSC/003/24", name: "Peter Mwangi", percentage: 62 },
    { regNo: "CSC/006/24", name: "Jane Njeri", percentage: 71 },
  ];

  return (
    <div className="p-6 min-h-screen bg-slate-100">
      <h1 className="text-3xl font-bold mb-6 text-red-700">
        🚨 Low Attendance Alerts
      </h1>

      <div className="bg-white rounded-xl shadow">
        <table className="w-full">
          <thead className="bg-red-100">
            <tr>
              <th className="p-3">Reg No</th>
              <th className="p-3">Name</th>
              <th className="p-3 text-center">Attendance %</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={i} className="border-t text-center">
                <td className="p-3">{s.regNo}</td>
                <td className="p-3">{s.name}</td>
                <td className="p-3 font-bold text-red-600">
                  {s.percentage}%
                </td>
                <td className="p-3 font-semibold text-red-600">
                  🚫 EXAM BLOCKED
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LowAttendance;