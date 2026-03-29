import { useState, useEffect } from "react";
import { makeRequest } from "../../../axios";

const AttendancePage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [marking, setMarking] = useState(false);

  // Fetch all classes assigned to the tutor
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await makeRequest.get("/attendance/today");
        setClasses(res.data.classes || []);
      } catch (err) {
        console.error("Failed to fetch classes:", err);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Handle marking attendance for a specific class
  const handleMarkAttendance = async (cls) => {
    setSelectedClass(cls);
    setMarking(true);
    setStudents([]); // clear previous students

    try {
      const res = await makeRequest.get(`/attendance/unit/${cls.unit_id}/students`);
      const studentsWithStatus = (res.data.students || []).map((s) => ({
        ...s,
        status: s.status || "Absent", // default to Absent if not marked
      }));
      setStudents(studentsWithStatus);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudents([]);
    }
  };

  // Submit attendance for selected students
  const handleSubmitAttendance = async () => {
    if (!selectedClass) return;

    // Only submit students that have been marked present or absent explicitly
    const studentsToSubmit = students.map((s) => ({
      student_id: s.id,
      status: s.status,
    }));

    if (!studentsToSubmit.length) {
      alert("No students selected for attendance.");
      return;
    }

    try {
      await makeRequest.post(`/attendance/unit/${selectedClass.unit_id}/attendance`, {
        students: studentsToSubmit,
      });
      alert("Attendance submitted successfully!");
      setMarking(false);
      setSelectedClass(null);
    } catch (err) {
      console.error("Failed to submit attendance:", err);
      alert("Error submitting attendance. Try again.");
    }
  };

  if (loading) return <div className="p-8">Loading attendance...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Mark Attendance</h1>

      {/* List of classes */}
      {!marking && (
        <>
          {classes.length === 0 ? (
            <p>No classes scheduled for today.</p>
          ) : (
            <div className="space-y-4">
              {classes.map((cls) => (
                <div
                  key={cls.assignment_id || cls.unit_id}
                  className="p-4 bg-white shadow rounded flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{cls.subject}</div>
                    <div className="text-sm text-slate-600">
                      {cls.room || "N/A"} - {cls.year || "N/A"}
                    </div>
                  </div>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => handleMarkAttendance(cls)}
                  >
                    Mark Attendance
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Mark attendance view */}
      {marking && selectedClass && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Students in {selectedClass.subject}</h2>
          {students.length === 0 ? (
            <p>No students found for this unit.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id || student.reg_no}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    {student.reg_no} - {student.first_name} {student.last_name}
                  </div>
                  <div className="flex gap-2">
                    <label>
                      <input
                        type="radio"
                        name={`status-${student.id}`}
                        value="Present"
                        checked={student.status === "Present"}
                        onChange={() =>
                          setStudents((prev) =>
                            prev.map((s) =>
                              s.id === student.id ? { ...s, status: "Present" } : s
                            )
                          )
                        }
                      />
                      Present
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`status-${student.id}`}
                        value="Absent"
                        checked={student.status === "Absent"}
                        onChange={() =>
                          setStudents((prev) =>
                            prev.map((s) =>
                              s.id === student.id ? { ...s, status: "Absent" } : s
                            )
                          )
                        }
                      />
                      Absent
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              onClick={() => setMarking(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={handleSubmitAttendance}
            >
              Submit Attendance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;