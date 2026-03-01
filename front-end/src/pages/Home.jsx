import React from "react";
import {
  AcademicCapIcon,
  UserGroupIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import PortalCard from "../components/PortalCard";
import PortalItem from "../components/PortalItem";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 p-10">
      
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
          Student Management System
        </h1>
        <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
          A unified platform for academic, teaching, and administrative operations
        </p>
      </div>

      {/* Portals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 max-w-7xl mx-auto">

        {/* Student Portal */}
        <PortalCard
          title="Student Portal"
          icon={<AcademicCapIcon className="h-10 w-10 text-blue-600" />}
        >
          <PortalItem label="Class Attendance Management" />
          <PortalItem label="Examination Management" />
          <PortalItem label="Fee Management" />
          <PortalItem label="Timetable Management" />
        </PortalCard>

        {/* Teaching Staff Portal */}
        <PortalCard
          title="Teaching Staff Portal"
          icon={<UserGroupIcon className="h-10 w-10 text-emerald-600" />}
        >
          <PortalItem label="Class Attendance Management" to="/class-attendance-management" />
          <PortalItem label="Exam Management" to="/exam-management"/>
        </PortalCard>

        {/* Non-Teaching Staff Portal */}
        <PortalCard
          title="Non-Teaching Staff Portal"
          icon={<BriefcaseIcon className="h-10 w-10 text-purple-600" />}
        >
          <PortalItem label="Work Attendance Management" />
          <PortalItem label="Salary Management" />
        </PortalCard>

        {/* Registrar Portal */}
        <PortalCard
          title="Registrar Portal"
          icon={<BuildingLibraryIcon className="h-10 w-10 text-orange-600" />}
        >
          <PortalItem
            label="Manage Courses"
            to="/registrar/courses"
            description="Add courses and define units"
          />
          <PortalItem
            label="Manage Students"
            to="/registrar/students"
            description="Add students and assign courses"
          />
          <PortalItem
            label="View Reports"
            to="/registrar/reports"
            description="View courses, units, and student details"
          />
        </PortalCard>

      </div>
    </div>
  );
};

export default Home;