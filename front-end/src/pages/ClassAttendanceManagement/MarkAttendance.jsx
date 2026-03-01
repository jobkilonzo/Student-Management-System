import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MarkAttendance = () => {
  const navigate = useNavigate();

  // Sample students (replace later with API data)
  const [students, setStudents] = useState([
    { id: 1, regNo: "CSC/001/24", name: "John Mutua", present: true },
    { id: 2, regNo: "CSC/002/24", name: "Mary Kilonzo", present: true },
    { id: 3, regNo: "CSC/003/24", name: "Peter Mwangi", present: true },
    { id: 4, regNo: "CSC/004/24", name: "Ann Wambui", present: true },
  ]);

  const toggleAttendance = (id) => {
    setStudents(
      students.map((s) =>
        s.id === id ? { ...s, present: !s.present } : s
      )
    );
  };

  const handleSubmit = () => {
    console.log("Attendance Submitted:", students);
    alert("Attendance saved successfully ✅");
  };

  return (
    <div className="p-6 min-h-screen bg-slate-100">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-slate-700 hover:text-blue-600 flex items-center space-x-2"
      >
        <span>←</span>
        <span>Back</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Mark Class Attendance
        </h1>
        <p className="text-gray-600 mt-2">
          Tick present students and submit attendance.
        </p>
      </div>

      {/* Class Info */}
      <div className="bg-white p-5 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input className="input" placeholder="Unit Code" />
        <input className="input" placeholder="Class / Group" />
        <input className="input" type="date" />
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Reg No</th>
              <th className="p-3 text-left">Student Name</th>
              <th className="p-3 text-center">Present</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, index) => (
              <tr key={s.id} className="border-t hover:bg-slate-50">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{s.regNo}</td>
                <td className="p-3">{s.name}</td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={s.present}
                    onChange={() => toggleAttendance(s.id)}
                    className="w-5 h-5 accent-blue-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="btn px-6 py-2"
        >
          Save Attendance
        </button>
      </div>
    </div>
  );
};

export default MarkAttendance;