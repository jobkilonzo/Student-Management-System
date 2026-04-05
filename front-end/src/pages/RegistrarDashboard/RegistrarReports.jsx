import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import { makeRequest } from "../../../axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const RegistrarReports = () => {
  const navigate = useNavigate(); // Add navigate hook
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    genderDistribution: [],
    courseDistribution: [],
    moduleDistribution: [],
    termDistribution: [],
  });

  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    const fetchData = async () => {
      try {
    
        
        const [coursesRes, studentsRes] = await Promise.all([
          makeRequest.get("/registrar/courses/"),
          makeRequest.get("/registrar/students/"),
        ]);
        
        const coursesData = coursesRes.data || [];
        const studentsData = studentsRes.data || [];
        
     
        
        setCourses(coursesData);
        setStudents(studentsData);
        setFilteredStudents(studentsData);
        
        // Calculate statistics
        calculateStats(coursesData, studentsData);
      } catch (err) {
        console.error("Failed to fetch reports data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => {
        const fullName = `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.toLowerCase();
        const regNo = (student.reg_no || "").toLowerCase();
        const courseName = (student.course_name || "").toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return fullName.includes(searchLower) || 
               regNo.includes(searchLower) || 
               courseName.includes(searchLower);
      });
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  const calculateStats = (coursesData, studentsData) => {
    // Gender distribution - with better null handling
    const genderCounts = {};
    studentsData.forEach(student => {
      const gender = student.gender || 'Unknown';
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    });

    const genderDist = Object.keys(genderCounts).map(gender => ({
      name: gender,
      value: genderCounts[gender]
    }));

   
    // Course distribution
    const courseDist = coursesData.map(course => {
      const count = studentsData.filter(s => s.course_id === course.course_id).length;
      return {
        name: course.course_code || 'N/A',
        fullName: course.course_name || 'Unknown Course',
        count,
        percentage: studentsData.length ? ((count / studentsData.length) * 100).toFixed(1) : 0
      };
    }).sort((a, b) => b.count - a.count);

    // Module distribution
    const moduleCounts = {};
    studentsData.forEach(student => {
      if (student.module) {
        const moduleKey = `Module ${student.module}`;
        moduleCounts[moduleKey] = (moduleCounts[moduleKey] || 0) + 1;
      }
    });

    const moduleData = Object.keys(moduleCounts).map(key => ({
      name: key,
      value: moduleCounts[key]
    }));

    // Term distribution
    const termCounts = {};
    studentsData.forEach(student => {
      if (student.term) {
        termCounts[student.term] = (termCounts[student.term] || 0) + 1;
      }
    });

    const termData = Object.keys(termCounts).map(key => ({
      name: key,
      value: termCounts[key]
    }));

    setStats({
      totalStudents: studentsData.length,
      totalCourses: coursesData.length,
      genderDistribution: genderDist,
      courseDistribution: courseDist,
      moduleDistribution: moduleData,
      termDistribution: termData,
    });
  };

  // Back button handler
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Clear search handler
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f0f9ff_35%,_#f8fafc_78%)] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-sky-600"></div>
          <p className="text-xl font-medium text-sky-900/70">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f0f9ff_35%,_#f8fafc_78%)] p-8">
      {/* Header Section with Back Button */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 font-semibold text-white transition duration-300 hover:bg-slate-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <h1 className="bg-gradient-to-r from-sky-700 via-sky-500 to-cyan-500 bg-clip-text text-4xl font-extrabold text-transparent">
            Registrar Reports
          </h1>
        </div>
        <p className="mt-2 text-lg text-sky-950/70">
          Comprehensive overview of courses, students, and enrollment statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="transform rounded-[28px] border border-sky-100 bg-white/95 p-6 shadow-lg transition-transform duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalStudents}</p>
            </div>
            <div className="rounded-full bg-sky-100 p-3">
              <svg className="h-8 w-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="transform rounded-[28px] border border-sky-100 bg-white/95 p-6 shadow-lg transition-transform duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Courses</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalCourses}</p>
            </div>
            <div className="rounded-full bg-cyan-100 p-3">
              <svg className="h-8 w-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        {/* Dynamic Gender Cards */}
        {stats.genderDistribution.map((gender, index) => (
          <div key={gender.name} className="transform rounded-[28px] border border-sky-100 bg-white/95 p-6 shadow-lg transition-transform duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{gender.name} Students</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{gender.value}</p>
              </div>
              <div className={`p-3 rounded-full ${gender.name === 'Male' ? 'bg-sky-100' : gender.name === 'Female' ? 'bg-amber-100' : 'bg-cyan-100'}`}>
                <svg className={`w-8 h-8 ${gender.name === 'Male' ? 'text-sky-600' : gender.name === 'Female' ? 'text-amber-600' : 'text-cyan-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Course Distribution Chart */}
        <div className="rounded-[28px] border border-sky-100 bg-white/95 p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-3 h-6 w-2 rounded-full bg-sky-600"></span>
            Student Distribution by Course
          </h2>
          {stats.courseDistribution.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.courseDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 shadow-lg rounded-lg border">
                            <p className="font-semibold">{payload[0].payload.fullName}</p>
                            <p className="text-sm">Students: {payload[0].value}</p>
                            <p className="text-sm">Percentage: {payload[0].payload.percentage}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" name="Number of Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No course distribution data available
            </div>
          )}
        </div>

        {/* Gender Distribution Pie Chart */}
        <div className="rounded-[28px] border border-sky-100 bg-white/95 p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-3 h-6 w-2 rounded-full bg-cyan-600"></span>
            Gender Distribution
          </h2>
          {stats.genderDistribution.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.genderDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.genderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.name === 'Male' ? '#3B82F6' : 
                        entry.name === 'Female' ? '#EC4899' : 
                        '#8B5CF6'
                      } />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No gender distribution data available
            </div>
          )}
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Courses Table */}
        <div className="rounded-[28px] border border-sky-100 bg-white/95 p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-3 h-6 w-2 rounded-full bg-sky-600"></span>
            Courses Overview
          </h2>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Course Name</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Students</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map((c) => {
                  const studentCount = students.filter(s => s.course_id === c.course_id).length;
                  return (
                    <tr 
                      key={c.course_id} 
                      className={`hover:bg-blue-50 transition cursor-pointer ${selectedCourse === c.course_id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedCourse(selectedCourse === c.course_id ? null : c.course_id)}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{c.course_code}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.course_name}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {studentCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourse(selectedCourse === c.course_id ? null : c.course_id);
                          }}
                        >
                          {selectedCourse === c.course_id ? 'Hide Details' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Course Details */}
          {selectedCourse && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <h3 className="font-semibold text-blue-800 mb-3">
                Students in Selected Course
              </h3>
              <div className="max-h-48 overflow-y-auto">
                {students.filter(s => s.course_id === selectedCourse).map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-blue-100 last:border-0">
                    <span className="text-sm text-gray-700">
                      {s.first_name} {s.last_name}
                    </span>
                    <span className="text-xs text-gray-500">{s.reg_no}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Students Table with Search */}
        <div className="rounded-[28px] border border-sky-100 bg-white/95 p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-3 h-6 w-2 rounded-full bg-amber-500"></span>
            Students Overview
          </h2>
          
          {/* Search Input */}
          <div className="mb-4 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, registration number, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <svg 
                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-2">
                Found {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
              </p>
            )}
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Reg No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Course</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Gender</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Module</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Term</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.slice(0, 10).map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-mono text-blue-600 font-medium">{s.reg_no}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {s.first_name} {s.middle_name} {s.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{s.course_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          s.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 
                          s.gender === 'Female' ? 'bg-pink-100 text-pink-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {s.gender || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">Module {s.module}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{s.term}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No students found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredStudents.length > 10 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Showing 10 of {filteredStudents.length} students
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 p-6 text-white shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Average Students per Course</h3>
          <p className="text-3xl font-bold">
            {stats.totalCourses ? (stats.totalStudents / stats.totalCourses).toFixed(1) : 0}
          </p>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-r from-slate-700 to-sky-700 p-6 text-white shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Most Popular Course</h3>
          <p className="text-xl font-bold">
            {stats.courseDistribution[0]?.fullName || 'N/A'}
          </p>
          <p className="text-sm opacity-90 mt-1">
            {stats.courseDistribution[0]?.count || 0} students ({stats.courseDistribution[0]?.percentage}%)
          </p>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-sky-600 p-6 text-white shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Gender Distribution</h3>
          <div className="space-y-2">
            {stats.genderDistribution.map(g => (
              <div key={g.name} className="flex justify-between">
                <span>{g.name}:</span>
                <span className="font-bold">{g.value} ({((g.value/stats.totalStudents)*100).toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrarReports;
