import { useState, useEffect } from "react";

const RegistrarReports = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  // Simulate fetching data (replace with SQL/API later)
  useEffect(() => {
    setCourses([
      { id: 1, code: "CSC101", name: "Computer Science" },
      { id: 2, code: "BIT102", name: "Business IT" },
    ]);

    setStudents([
      { id: 1, name: "John Mutua", regNo: "CSC/001/24", courseId: 1 },
      { id: 2, name: "Mary Kilonzo", regNo: "BIT/002/24", courseId: 2 },
    ]);
  }, []);

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <h1 className="text-3xl font-bold mb-6">Registrar Reports</h1>

      <h2 className="text-xl font-semibold mb-2">Courses</h2>
      <table className="w-full bg-white rounded-xl shadow mb-6">
        <thead className="bg-slate-200">
          <tr>
            <th className="p-3">Course Code</th>
            <th className="p-3">Course Name</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-3">{c.code}</td>
              <td className="p-3">{c.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mb-2">Students</h2>
      <table className="w-full bg-white rounded-xl shadow">
        <thead className="bg-slate-200">
          <tr>
            <th className="p-3">Reg No</th>
            <th className="p-3">Name</th>
            <th className="p-3">Course</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const course = courses.find((c) => c.id === s.courseId);
            return (
              <tr key={s.id} className="border-t">
                <td className="p-3">{s.regNo}</td>
                <td className="p-3">{s.name}</td>
                <td className="p-3">{course ? course.name : "N/A"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RegistrarReports;