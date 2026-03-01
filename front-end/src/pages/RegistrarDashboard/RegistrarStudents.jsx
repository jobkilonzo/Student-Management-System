import { useState } from "react";

const RegistrarStudents = () => {
  const [students, setStudents] = useState([]);
  return (
    <div className="p-6 min-h-screen bg-slate-100">
      <h1 className="text-3xl font-bold mb-6">Add Students</h1>
      <p className="mb-4 text-gray-600">
        Register new students and assign them to courses.
      </p>

      {/* Form and table will go here */}
    </div>
  );
};

export default RegistrarStudents;