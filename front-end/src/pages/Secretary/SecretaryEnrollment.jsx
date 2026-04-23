import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { makeRequest } from "../../../axios";
import SecretaryShell from "./SecretaryShell";

const SecretaryEnrollment = () => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [units, setUnits] = useState([]);
  const [busy, setBusy] = useState(false);

  const searchStudents = async () => {
    try {
      const res = await makeRequest.get("/secretary/students", { params: { search, limit: 10, page: 1 } });
      setResults(res.data.students || []);
    } catch (err) {
      console.error(err);
      toast.error("Search failed");
      setResults([]);
    }
  };

  useEffect(() => {
    if (!selected?.student_id) return;
    const loadUnits = async () => {
      try {
        const res = await makeRequest.get(`/secretary/students/${selected.student_id}/units`);
        setUnits(res.data.units || []);
      } catch (err) {
        console.error(err);
        setUnits([]);
      }
    };
    loadUnits();
  }, [selected]);

  const assignAll = async () => {
    if (!selected?.student_id) return;
    setBusy(true);
    try {
      const res = await makeRequest.post(`/secretary/students/${selected.student_id}/assign-units`);
      toast.success(`Assigned ${res.data.assigned || 0} units`);
      const unitsRes = await makeRequest.get(`/secretary/students/${selected.student_id}/units`);
      setUnits(unitsRes.data.units || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Assign failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SecretaryShell
      title="Course Enrollment"
      subtitle="Search a student, then assign all units for their current course and module."
    >
      <Toaster position="top-right" />

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, reg no, email, course..."
            className="w-full md:w-[420px] rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
          <button
            onClick={searchStudents}
            className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
          >
            Search
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Results</div>
            <div className="mt-3 space-y-2">
              {results.length === 0 ? (
                <div className="text-slate-500 text-sm">No results yet.</div>
              ) : (
                results.map((r) => (
                  <button
                    key={r.student_id}
                    onClick={() => setSelected(r)}
                    className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                      selected?.student_id === r.student_id ? "bg-sky-100" : "bg-white hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{r.full_name}</div>
                    <div className="text-sm text-slate-600">{r.reg_no} • {r.course_name || "—"}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Selected</div>
                <div className="mt-2 font-semibold text-slate-900">{selected?.full_name || "—"}</div>
                <div className="text-sm text-slate-600">{selected?.reg_no || ""}</div>
              </div>
              <button
                onClick={assignAll}
                disabled={!selected || busy}
                className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Assigning..." : "Assign All Units"}
              </button>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Assigned Units</div>
              {units.length === 0 ? (
                <div className="mt-3 text-sm text-slate-500">No units assigned.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {units.map((u) => (
                    <div key={u.unit_id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <div className="font-semibold text-slate-900">{u.unit_name}</div>
                        <div className="text-sm text-slate-600">{u.unit_code}</div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {u.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </SecretaryShell>
  );
};

export default SecretaryEnrollment;

