import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { makeRequest } from "../../../axios";
import SecretaryShell from "./SecretaryShell";

const SecretaryAuditLogs = () => {
  const [filters, setFilters] = useState({ search: "", action: "", page: 1, limit: 20 });
  const [data, setData] = useState({ logs: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await makeRequest.get("/secretary/audit-logs", { params: filters });
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit logs");
      setData({ logs: [], total: 0, page: filters.page, limit: filters.limit });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit]);

  const pages = Math.max(1, Math.ceil((data.total || 0) / (filters.limit || 20)));

  return (
    <SecretaryShell
      title="Audit Logs"
      subtitle="Read-only audit trail. Filter and search by action or target id/details."
    >
      <Toaster position="top-right" />

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <input
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              placeholder="Search target id or details..."
              className="w-full md:w-[360px] rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none"
            />
            <input
              value={filters.action}
              onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))}
              placeholder="Action filter (optional)"
              className="w-[220px] rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm shadow-sm outline-none"
            />
            <button
              onClick={() => {
                setFilters((p) => ({ ...p, page: 1 }));
                load();
              }}
              className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-auto rounded-3xl border border-slate-200 bg-slate-50">
          <table className="min-w-full">
            <thead className="bg-slate-100/80">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Time</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Action</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Target</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-500">Loading…</td></tr>
              ) : (data.logs || []).length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-500">No logs found.</td></tr>
              ) : (
                (data.logs || []).map((l) => (
                  <tr key={l.id} className="bg-white">
                    <td className="px-5 py-4 text-sm text-slate-600">{l.created_at ? new Date(l.created_at).toLocaleString() : ""}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{l.action}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{l.target_id ?? "—"}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{String(l.details || "").slice(0, 120)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <div>
            Page <span className="font-semibold">{filters.page}</span> / <span className="font-semibold">{pages}</span> • Total{" "}
            <span className="font-semibold">{data.total || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={filters.page <= 1}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, page: Math.min(pages, p.page + 1) }))}
              disabled={filters.page >= pages}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </SecretaryShell>
  );
};

export default SecretaryAuditLogs;

