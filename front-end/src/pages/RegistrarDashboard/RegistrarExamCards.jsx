import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { makeRequest } from "../../../axios";

const RegistrarExamCards = () => {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [card, setCard] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await makeRequest.get("/registrar/exam-cards", { params: { search, term } });
      setStudents(res?.data?.students || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const loadCard = async (studentId) => {
    setCardLoading(true);
    try {
      const res = await makeRequest.get(`/registrar/exam-cards/${studentId}`, { params: { term } });
      setCard(res?.data?.exam_card || null);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load exam card");
      setCard(null);
    } finally {
      setCardLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />

      <button
        onClick={() => window.history.back()}
        className="mb-6 text-slate-700 font-medium hover:text-blue-600 transition"
      >
        ← Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Exam Cards</h1>
        <p className="text-slate-600 mt-1">Generate/view exam cards (current TERM filtering supported).</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reg no / name / email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">TERM (Optional)</label>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. 1"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-3">
            <button
              onClick={loadStudents}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Students</h2>
            <p className="text-sm text-slate-500">{students.length} found (showing up to 200)</p>
          </div>
          <div className="max-h-[520px] overflow-auto">
            {students.length === 0 ? (
              <div className="p-6 text-slate-500">No students found.</div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {students.map((s) => (
                  <li key={s.id} className="p-4 hover:bg-slate-50">
                    <button
                      className="w-full text-left"
                      onClick={() => {
                        setSelected(s);
                        loadCard(s.id);
                      }}
                    >
                      <p className="font-semibold text-slate-900">{s.student_name}</p>
                      <p className="text-sm text-slate-600">
                        {s.reg_no} • {s.course_code} • TERM {s.term ?? "-"}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Exam Card Preview</h2>
            <p className="text-sm text-slate-500">
              {selected ? `${selected.student_name} (${selected.reg_no})` : "Select a student"}
            </p>
          </div>

          {cardLoading ? (
            <div className="p-6 text-slate-600">Loading exam card...</div>
          ) : !card ? (
            <div className="p-6 text-slate-500">No exam card loaded.</div>
          ) : (
            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Clearance</p>
                <p className="mt-1 font-bold text-slate-900">{card.finance.clearance_status}</p>
                <p className="text-sm text-slate-600">
                  Balance: KSh {Number(card.finance.outstanding_balance || 0).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">Registered Units (Current TERM)</p>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
                  {card.registered_units.map((u) => (
                    <li key={u.unit_id}>
                      {u.unit_code} - {u.unit_name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrarExamCards;

