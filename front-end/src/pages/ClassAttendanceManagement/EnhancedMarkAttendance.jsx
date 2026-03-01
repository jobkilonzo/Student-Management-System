import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

const studentsSeed = [
  { id: 1, regNo: "CSC/001/24", name: "John Mutua" },
  { id: 2, regNo: "CSC/002/24", name: "Mary Kilonzo" },
  { id: 3, regNo: "CSC/003/24", name: "Peter Mwangi" },
  { id: 4, regNo: "CSC/004/24", name: "Ann Wambui" },
];

const DailyUnitAttendance = () => {
  const { unitCode } = useParams();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [students, setStudents] = useState(
    studentsSeed.map((s) => ({ ...s, attendance: {} }))
  );

  /* ---------- Toggle Present ---------- */
  const togglePresent = (studentId) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const current = s.attendance[date] || false;
          return {
            ...s,
            attendance: { ...s.attendance, [date]: !current },
          };
        }
        return s;
      })
    );
  };

  /* ---------- Calculations ---------- */
  const totalMarkedDays = (s) => Object.keys(s.attendance).length;
  const presentDays = (s) =>
    Object.values(s.attendance).filter((v) => v).length;
  const percentage = (s) =>
    totalMarkedDays(s) === 0
      ? 0
      : Math.round((presentDays(s) / totalMarkedDays(s)) * 100);
  const isFlagged = (s) => percentage(s) < 75;

  /* ---------- Save / Print (API-ready) ---------- */
  const saveAttendance = async () => {
    const payload = {
      unitCode,
      date,
      records: students.map((s) => ({
        studentId: s.id,
        present: s.attendance[date] || false,
        percentage: percentage(s),
      })),
    };

    try {
      await fetch("https://api.yourschool.com/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert("Attendance saved ✅");
    } catch (err) {
      console.error(err);
      alert("Failed ❌");
    }
  };

  const printRegister = () => window.print();

  return (
    <div className="p-6 min-h-screen bg-slate-100 print:bg-white">
      <button onClick={() => navigate(-1)} className="mb-4 print:hidden">
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-2">Daily Attendance – {unitCode}</h1>
      <p className="text-gray-600 mb-4">
        Percentage is calculated only from days already marked. Below 75% is flagged.
      </p>

      {/* Date */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4 border rounded-lg px-3 py-2"
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-3">Reg No</th>
              <th className="p-3">Name</th>
              <th className="p-3 text-center">Present</th>
              <th className="p-3 text-center">Attendance %</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className={isFlagged(s) ? "bg-red-50" : ""}>
                <td className="p-3">{s.regNo}</td>
                <td className="p-3">{s.name}</td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={s.attendance[date] || false}
                    onChange={() => togglePresent(s.id)}
                    className="w-5 h-5 accent-blue-600 print:hidden"
                  />
                </td>
                <td className="p-3 text-center font-semibold">{percentage(s)}%</td>
                <td className="p-3 text-center font-semibold">
                  {isFlagged(s) ? (
                    <span className="text-red-600">⚠ Below 75%</span>
                  ) : (
                    <span className="text-green-600">✔ OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-4 justify-end print:hidden">
        <button onClick={printRegister} className="btn bg-gray-600 hover:bg-gray-700">
          Print
        </button>
        <button onClick={saveAttendance} className="btn bg-blue-600 hover:bg-blue-700">
          Save
        </button>
      </div>
    </div>
  );
};

export default DailyUnitAttendance;