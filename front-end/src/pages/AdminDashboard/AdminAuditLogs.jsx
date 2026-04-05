import { useEffect, useState } from "react";
import { makeRequest } from "../../../axios";
import toast from "react-hot-toast";

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);

  const [filters, setFilters] = useState({
    action: "",
    user: "",
    from: "",
    to: ""
  });

  /** FETCH LOGS */
  const fetchLogs = async () => {
    try {
      const res = await makeRequest.get("auth/audit-logs");
      setLogs(res.data.logs || []);
      setFilteredLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch logs");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  /** FILTER LOGIC */
  useEffect(() => {
    let data = [...logs];

    if (filters.action) {
      data = data.filter(l => l.action === filters.action);
    }

    if (filters.user) {
      data = data.filter(l =>
        l.performed_by?.toLowerCase().includes(filters.user.toLowerCase())
      );
    }

    if (filters.from) {
      data = data.filter(l => new Date(l.created_at) >= new Date(filters.from));
    }

    if (filters.to) {
      data = data.filter(l => new Date(l.created_at) <= new Date(filters.to));
    }

    setFilteredLogs(data);
  }, [filters, logs]);

  /** EXPORT CSV */
  const exportCSV = () => {
    const headers = ["User", "Action", "Target ID", "Date"];
    const rows = filteredLogs.map(l => [
      l.performed_by,
      l.action,
      l.target_id,
      new Date(l.created_at).toLocaleString()
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "audit_logs.csv";
    link.click();
  };

  /** EXPORT PDF (simple) */
  const exportPDF = () => {
    const win = window.open("", "", "width=900,height=700");
    win.document.write("<h2>Audit Logs</h2>");
    win.document.write("<table border='1' style='width:100%;border-collapse:collapse'>");
    win.document.write("<tr><th>User</th><th>Action</th><th>Target</th><th>Date</th></tr>");

    filteredLogs.forEach(l => {
      win.document.write(`
        <tr>
          <td>${l.performed_by || ""}</td>
          <td>${l.action}</td>
          <td>${l.target_id}</td>
          <td>${new Date(l.created_at).toLocaleString()}</td>
        </tr>
      `);
    });

    win.document.write("</table>");
    win.print();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Audit Logs</h2>

      {/* FILTERS */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <input
          placeholder="Search user..."
          onChange={e => setFilters({ ...filters, user: e.target.value })}
          className="border p-2 rounded"
        />

        <select
          onChange={e => setFilters({ ...filters, action: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">All Actions</option>
          <option value="SOFT_DELETE_USER">Delete</option>
          <option value="UPDATE_USER">Update</option>
          <option value="RESTORE_USER">Restore</option>
        </select>

        <input
          type="date"
          onChange={e => setFilters({ ...filters, from: e.target.value })}
          className="border p-2 rounded"
        />

        <input
          type="date"
          onChange={e => setFilters({ ...filters, to: e.target.value })}
          className="border p-2 rounded"
        />
      </div>

      {/* EXPORT BUTTONS */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={exportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export Excel (CSV)
        </button>

        <button
          onClick={exportPDF}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Export PDF
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Target</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} className="border-t">
                <td className="p-3">{log.performed_by}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.target_id}</td>
                <td className="p-3">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAuditLogs;