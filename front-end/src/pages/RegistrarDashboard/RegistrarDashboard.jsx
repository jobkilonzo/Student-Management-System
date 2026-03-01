import { useNavigate } from "react-router-dom";
import PortalItem from "../../components/PortalItem";

const RegistrarDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Registrar Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage courses, units, students, and their registrations.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PortalItem
          label="Manage Courses"
          to="/registrar/courses"
          description="Add courses and define units."
          icon="📚"
        />
        <PortalItem
          label="Manage Students"
          to="/registrar/students"
          description="Add students and assign courses."
          icon="🎓"
        />
        <PortalItem
          label="View Reports"
          to="/registrar/reports"
          description="View courses, units, and student details."
          icon="📄"
        />
      </div>
    </div>
  );
};

export default RegistrarDashboard;