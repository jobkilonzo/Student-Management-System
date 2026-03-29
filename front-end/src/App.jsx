import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/** Pages */
import Home from "./pages/Home";
import Login from "./pages/Login";
import ExamManagement from "./pages/ExamManagement";

/** Admin */
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import SystemSettings from "./pages/AdminDashboard/SystemSettings";
import UsersManagement from "./pages/AdminDashboard/UsersManagement";
import CourseManagement from "./pages/AdminDashboard/CourseManagement";
import TranscriptLog from "./pages/AdminDashboard/TranscriptLog";
import Notifications from "./pages/AdminDashboard/Notifications";

/** Student */
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import UpdateDetails from "./pages/StudentDashboard/UpdateDetails";
import UnitsAssigned from "./pages/StudentDashboard/UnitsAssigned";
import FeeBalance from "./pages/StudentDashboard/FeeBalance";
import Results from "./pages/StudentDashboard/Results";

/** Exam Officer */
import ExamOfficerDashboard from "./pages/ExamOfficer/ExamOfficerDashboard";
import ManageExams from "./pages/ExamOfficer/ManageExams";
import ReviewMarks from "./pages/ExamOfficer/ReviewMarks";

/** Accountant */
import AccountantDashboard from "./pages/AccountantDashboard";

/** Tutor */
import TutorDashboard from "./pages/Tutor/TutorDashboard";
import AssignmentsPage from "./pages/Tutor/AssignmentsPage";
import AttendancePage from "./pages/Tutor/AttendancePage";
import EnterMarksPage from "./pages/Tutor/EnterMarksPage";
import ProgressReportsPage from "./pages/Tutor/ProgressReportsPage";

/** Registrar */
import RegistrarDashboard from "./pages/RegistrarDashboard/RegistrarDashboard";
import RegistrarCourses from "./pages/RegistrarDashboard/RegistrarCourses";
import AddUnits from "./pages/RegistrarDashboard/AddUnits";
import RegistrarStudents from "./pages/RegistrarDashboard/RegistrarStudents";
import RegistrarReports from "./pages/RegistrarDashboard/RegistrarReports";
import GenerateTranscript from "./pages/RegistrarDashboard/GenerateTranscript";
import AssignUnitsPage from "./pages/RegistrarDashboard/AssignUnitsPage";

/** Components */
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login route */}
        <Route
          path="/login"
          element={
            <AuthRedirect>
              <Login />
            </AuthRedirect>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin","registrar"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><SystemSettings /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><UsersManagement /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={["admin"]}><CourseManagement /></ProtectedRoute>} />
        <Route path="/admin/transcripts" element={<ProtectedRoute allowedRoles={["admin"]}><TranscriptLog /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["admin"]}><Notifications /></ProtectedRoute>} />

        {/* Student Routes */}
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/update-details" element={<ProtectedRoute allowedRoles={["student"]}><UpdateDetails /></ProtectedRoute>} />
        <Route path="/student/units" element={<ProtectedRoute allowedRoles={["student"]}><UnitsAssigned /></ProtectedRoute>} />
        <Route path="/student/fees" element={<ProtectedRoute allowedRoles={["student"]}><FeeBalance /></ProtectedRoute>} />
        <Route path="/student/results" element={<ProtectedRoute allowedRoles={["student"]}><Results /></ProtectedRoute>} />

        {/* Exam Officer Routes */}
        <Route path="/exam-officer" element={<ProtectedRoute allowedRoles={["exam_officer"]}><ExamOfficerDashboard /></ProtectedRoute>} />
        <Route path="/exam-officer/manage-exams" element={<ProtectedRoute allowedRoles={["exam_officer"]}><ManageExams /></ProtectedRoute>} />
        <Route path="/exam-officer/review-marks" element={<ProtectedRoute allowedRoles={["exam_officer"]}><ReviewMarks /></ProtectedRoute>} />

        {/* Accountant Routes */}
        <Route path="/accountant" element={<ProtectedRoute allowedRoles={["accountant"]}><AccountantDashboard /></ProtectedRoute>} />

        {/* Tutor Routes */}
        <Route path="/tutor" element={<ProtectedRoute allowedRoles={["tutor"]}><TutorDashboard /></ProtectedRoute>} />
        <Route path="/tutor/attendance" element={<ProtectedRoute allowedRoles={["tutor"]}><AttendancePage /></ProtectedRoute>} />
        <Route path="/tutor/marks" element={<ProtectedRoute allowedRoles={["tutor"]}><EnterMarksPage /></ProtectedRoute>} />
        <Route path="/tutor/assignments" element={<ProtectedRoute allowedRoles={["tutor"]}><AssignmentsPage /></ProtectedRoute>} />
        <Route path="/tutor/reports" element={<ProtectedRoute allowedRoles={["tutor"]}><ProgressReportsPage /></ProtectedRoute>} />

        {/* Registrar Routes */}
        <Route path="/registrar" element={<ProtectedRoute allowedRoles={["registrar","admin"]}><RegistrarDashboard /></ProtectedRoute>} />
        <Route path="/registrar/courses" element={<ProtectedRoute allowedRoles={["registrar","admin"]}><RegistrarCourses /></ProtectedRoute>} />
        <Route path="/registrar/courses/:courseId/units" element={<ProtectedRoute allowedRoles={["registrar","admin"]}><AddUnits /></ProtectedRoute>} />
        <Route path="/registrar/students" element={<ProtectedRoute allowedRoles={["registrar","admin"]}><RegistrarStudents /></ProtectedRoute>} />
        <Route path="/registrar/reports" element={<ProtectedRoute allowedRoles={["registrar","admin"]}><RegistrarReports /></ProtectedRoute>} />
        <Route path="/registrar/assign-units" element={<ProtectedRoute allowedRoles={["registrar","admin"]}><AssignUnitsPage /></ProtectedRoute>} />
        <Route path="/registrar/transcript" element={<ProtectedRoute allowedRoles={["registrar","admin"]}><GenerateTranscript /></ProtectedRoute>} />

        {/* Exam Management */}
        <Route path="/exam-management" element={<ProtectedRoute allowedRoles={["admin","registrar","tutor"]}><ExamManagement /></ProtectedRoute>} />

        {/* Catch all unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;