import Home from "./pages/Home";
import ExamManagement from "./pages/ExamManagement";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AccountantDashboard from "./pages/AccountantDashboard";
import TutorDashboard from "./pages/Tutor/TutorDashboard";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";

import RegistrarDashboard from "./pages/RegistrarDashboard/RegistrarDashboard";
import RegistrarCourses from "./pages/RegistrarDashboard/RegistrarCourses";
import AddUnits from "./pages/RegistrarDashboard/AddUnits";
import RegistrarStudents from "./pages/RegistrarDashboard/RegistrarStudents";
import RegistrarReports from "./pages/RegistrarDashboard/RegistrarReports";
import AssignUnitsPage from "./pages/RegistrarDashboard/AssignUnitsPage";

import AssignmentsPage from "./pages/Tutor/AssignmentsPage";
import AttendancePage from "./pages/Tutor/AttendancePage";
import EnterMarksPage from "./pages/Tutor/EnterMarksPage";
import ProgressReportsPage from "./pages/Tutor/ProgressReportsPage";

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

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "registrar"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Accountant */}
        <Route
          path="/accountant"
          element={
            <ProtectedRoute allowedRoles={["accountant"]}>
              <AccountantDashboard />
            </ProtectedRoute>
          }
        />

        {/* Tutor */}
        <Route
          path="/tutor"
          element={
            <ProtectedRoute allowedRoles={["tutor"]}>
              <TutorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Registrar */}
        <Route
          path="/registrar"
          element={
            <ProtectedRoute allowedRoles={["registrar", "admin"]}>
              <RegistrarDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/registrar/courses"
          element={
            <ProtectedRoute allowedRoles={["registrar", "admin"]}>
              <RegistrarCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/registrar/courses/:courseId/units"
          element={
            <ProtectedRoute allowedRoles={["registrar", "admin"]}>
              <AddUnits />
            </ProtectedRoute>
          }
        />

        <Route
          path="/registrar/students"
          element={
            <ProtectedRoute allowedRoles={["registrar", "admin"]}>
              <RegistrarStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/registrar/reports"
          element={
            <ProtectedRoute allowedRoles={["registrar", "admin"]}>
              <RegistrarReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrar/assign-units"
          element={
            <ProtectedRoute allowedRoles={["registrar", "admin"]}>
              <AssignUnitsPage />
            </ProtectedRoute>
          }
        />

        {/* Exam Management */}
        <Route
          path="/exam-management"
          element={
            <ProtectedRoute allowedRoles={["admin", "registrar", "tutor"]}>
              <ExamManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/attendance"
          element={
            <ProtectedRoute allowedRoles={["tutor"]}>
              <AttendancePage /> {/* create this component */}
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/marks"
          element={
            <ProtectedRoute allowedRoles={["tutor"]}>
              <EnterMarksPage /> {/* create this component */}
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/assignments"
          element={
            <ProtectedRoute allowedRoles={["tutor"]}>
              <AssignmentsPage /> {/* create this component */}
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/reports"
          element={
            <ProtectedRoute allowedRoles={["tutor"]}>
              <ProgressReportsPage /> {/* create this component */}
            </ProtectedRoute>
          }
        />

        {/* Catch all unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;