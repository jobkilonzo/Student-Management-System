import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/** Pages */
import Home from "./pages/Home";
import Login from "./pages/Login";
import ExamManagement from "./pages/ExamManagement";
import ChangePassword from "./pages/ChangePassword";
import MyAccount from "./pages/Account/MyAccount";

/** Admin */
import AdminDashboard from "./pages/AdminDashboard/AdminDashboardV2";
import SystemSettings from "./pages/AdminDashboard/SystemSettings";
import UsersManagement from "./pages/AdminDashboard/UsersManagement";
import CourseManagement from "./pages/AdminDashboard/CourseManagement";
import TranscriptLog from "./pages/AdminDashboard/TranscriptLog";
import Notifications from "./pages/AdminDashboard/Notifications";

/** Student */
import StudentDashboardPro from "./pages/StudentDashboard/StudentDashboardPro";
import UpdateDetailsPro from "./pages/StudentDashboard/UpdateDetailsPro";
import UnitsAssigned from "./pages/StudentDashboard/UnitsAssigned";
import FeeBalance from "./pages/StudentDashboard/FeeBalance";
import ResultsPro from "./pages/StudentDashboard/ResultsPro";
import ExamCard from "./pages/StudentDashboard/ExamCard";
import StudentTranscript from "./pages/StudentDashboard/StudentTranscript";

/** Exam Officer */
import ExamOfficerDashboard from "./pages/ExamOfficer/ExamOfficerDashboard";
import ManageExams from "./pages/ExamOfficer/ManageExamsPro";
import ReviewMarks from "./pages/ExamOfficer/ReviewMarksPro";
import ExamOfficerAttendance from "./pages/ExamOfficer/ExamOfficerAttendance";
import ManageExamSessions from "./pages/ExamOfficer/ManageExamSessions";

/** Accountant */
import AccountantDashboard from "./pages/AccountantDashboard/AccountantDashboard";
import StudentAccounts from "./pages/AccountantDashboard/StudentAccounts";
import Collections from "./pages/AccountantDashboard/Collections";
import AccountantReports from "./pages/AccountantDashboard/Reports";

/** Tutor */
import TutorDashboard from "./pages/Tutor/TutorDashboardPro";
import AssignmentsPage from "./pages/Tutor/AssignmentsPage";
import AttendancePage from "./pages/Tutor/AttendancePagePro";
import EnterMarksPage from "./pages/Tutor/EnterMarksPagePro";
import ProgressReportsPage from "./pages/Tutor/ProgressReportsPage";

/** Registrar */
import RegistrarDashboard from "./pages/RegistrarDashboard/RegistrarDashboard";
import RegistrarCourses from "./pages/RegistrarDashboard/RegistrarCourses";
import AddUnits from "./pages/RegistrarDashboard/AddUnits";
import RegistrarStudents from "./pages/RegistrarDashboard/RegistrarStudents";
import RegistrarReports from "./pages/RegistrarDashboard/RegistrarReports";
import GenerateTranscript from "./pages/RegistrarDashboard/GenerateTranscript";
import AssignUnitsPage from "./pages/RegistrarDashboard/AssignUnitsPage";
import RegistrarAttendance from "./pages/RegistrarDashboard/RegistrarAttendance";
import RegistrarMarks from "./pages/RegistrarDashboard/RegistrarMarks";
import RegistrarExamCards from "./pages/RegistrarDashboard/RegistrarExamCards";
import RegistrarExamTimetableTechnical from "./pages/RegistrarDashboard/RegistrarExamTimetableTechnical";
import RegistrarExamTimetableBusiness from "./pages/RegistrarDashboard/RegistrarExamTimetableBusiness";

/** Secretary */
import SecretaryDashboard from "./pages/Secretary/SecretaryDashboard";
import SecretaryStudents from "./pages/Secretary/SecretaryStudents";
import SecretaryStudentDetail from "./pages/Secretary/SecretaryStudentDetail";
import SecretaryEnrollment from "./pages/Secretary/SecretaryEnrollment";
import SecretaryReports from "./pages/Secretary/SecretaryReports";
import SecretaryNotifications from "./pages/Secretary/SecretaryNotifications";
import SecretaryFeePayments from "./pages/Secretary/SecretaryFeePayments";


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

        {/* Force password change */}
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

        {/* My Account (all roles) */}
        <Route path="/account" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin","registrar"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><SystemSettings /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><UsersManagement /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={["admin"]}><CourseManagement /></ProtectedRoute>} />
        <Route path="/admin/transcripts" element={<ProtectedRoute allowedRoles={["admin"]}><TranscriptLog /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["admin"]}><Notifications /></ProtectedRoute>} />

        {/* Student Routes */}
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboardPro /></ProtectedRoute>} />
        <Route path="/student/update-details" element={<ProtectedRoute allowedRoles={["student"]}><UpdateDetailsPro /></ProtectedRoute>} />
        <Route path="/student/units" element={<ProtectedRoute allowedRoles={["student"]}><UnitsAssigned /></ProtectedRoute>} />
        <Route path="/student/fees" element={<ProtectedRoute allowedRoles={["student"]}><FeeBalance /></ProtectedRoute>} />
        <Route path="/student/exam-card" element={<ProtectedRoute allowedRoles={["student"]}><ExamCard /></ProtectedRoute>} />
        <Route path="/student/results" element={<ProtectedRoute allowedRoles={["student"]}><ResultsPro /></ProtectedRoute>} />
        <Route path="/student/transcript" element={<ProtectedRoute allowedRoles={["student"]}><StudentTranscript /></ProtectedRoute>} />

        {/* Exam Officer Routes */}
        <Route path="/exam-officer" element={<ProtectedRoute allowedRoles={["exam_officer"]}><ExamOfficerDashboard /></ProtectedRoute>} />
        <Route path="/exam-officer/manage-exams" element={<ProtectedRoute allowedRoles={["exam_officer"]}><ManageExams /></ProtectedRoute>} />
        <Route path="/exam-officer/exam-sessions" element={<ProtectedRoute allowedRoles={["exam_officer","registrar","admin"]}><ManageExamSessions /></ProtectedRoute>} />
        <Route path="/exam-officer/review-marks" element={<ProtectedRoute allowedRoles={["exam_officer"]}><ReviewMarks /></ProtectedRoute>} />
        <Route path="/exam-officer/attendance" element={<ProtectedRoute allowedRoles={["exam_officer"]}><ExamOfficerAttendance /></ProtectedRoute>} />

        {/* Accountant Routes */}
        <Route path="/accountant" element={<Navigate to="/accountant/dashboard" replace />} />
        <Route path="/accountant/dashboard" element={<ProtectedRoute allowedRoles={["accountant"]}><AccountantDashboard /></ProtectedRoute>} />
        <Route path="/accountant/student-accounts" element={<ProtectedRoute allowedRoles={["accountant"]}><StudentAccounts /></ProtectedRoute>} />
        <Route path="/accountant/collections" element={<ProtectedRoute allowedRoles={["accountant"]}><Collections /></ProtectedRoute>} />
        <Route path="/accountant/reports" element={<ProtectedRoute allowedRoles={["accountant"]}><AccountantReports /></ProtectedRoute>} />

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
        <Route path="/registrar/transcript" element={<ProtectedRoute allowedRoles={["registrar","admin","exam_officer"]}><GenerateTranscript /></ProtectedRoute>} />
        <Route path="/registrar/attendance" element={<ProtectedRoute allowedRoles={["registrar","admin"]}><RegistrarAttendance /></ProtectedRoute>} />
        <Route path="/registrar/marks" element={<ProtectedRoute allowedRoles={["registrar","admin"]}><RegistrarMarks /></ProtectedRoute>} />
        <Route path="/registrar/exam-cards" element={<ProtectedRoute allowedRoles={["registrar","admin"]}><RegistrarExamCards /></ProtectedRoute>} />
        <Route path="/registrar/exams/timetable/technical" element={<ProtectedRoute allowedRoles={["registrar","admin","exam_officer"]}><RegistrarExamTimetableTechnical /></ProtectedRoute>} />
        <Route path="/registrar/exams/timetable/business" element={<ProtectedRoute allowedRoles={["registrar","admin","exam_officer"]}><RegistrarExamTimetableBusiness /></ProtectedRoute>} />

        {/* Secretary Routes */}
        <Route path="/secretary" element={<ProtectedRoute allowedRoles={["secretary"]}><SecretaryDashboard /></ProtectedRoute>} />
        <Route path="/secretary/students" element={<ProtectedRoute allowedRoles={["secretary"]}><SecretaryStudents /></ProtectedRoute>} />
        <Route path="/secretary/students/:id" element={<ProtectedRoute allowedRoles={["secretary"]}><SecretaryStudentDetail /></ProtectedRoute>} />
        <Route path="/secretary/enrollment" element={<ProtectedRoute allowedRoles={["secretary"]}><SecretaryEnrollment /></ProtectedRoute>} />
        <Route path="/secretary/fee-payments" element={<ProtectedRoute allowedRoles={["secretary"]}><SecretaryFeePayments /></ProtectedRoute>} />
        <Route path="/secretary/reports" element={<ProtectedRoute allowedRoles={["secretary"]}><SecretaryReports /></ProtectedRoute>} />
        <Route path="/secretary/notifications" element={<ProtectedRoute allowedRoles={["secretary"]}><SecretaryNotifications /></ProtectedRoute>} />
        

        {/* Exam Management */}
        <Route path="/exam-management" element={<ProtectedRoute allowedRoles={["admin","registrar","tutor","exam_officer"]}><ExamManagement /></ProtectedRoute>} />

        {/* Catch all unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
