const AttendanceReports = () => {
  return (
    <div className="p-6 min-h-screen bg-slate-100 print:bg-white">
      <h1 className="text-3xl font-bold mb-6">Attendance Reports</h1>

      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-gray-600 mb-4">
          Generate official attendance summaries for audit and exam clearance.
        </p>

        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 print:hidden"
        >
          Print Attendance Report
        </button>
      </div>
    </div>
  );
};

export default AttendanceReports;