import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { makeRequest } from "../../../axios";
import SecretaryShell from "./SecretaryShell";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SecretaryReports = () => {
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ course_id: "", module: "", term: "" });
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await makeRequest.get("/secretary/courses");
        setCourses(res.data || []);
      } catch (err) {
        console.error(err);
        setCourses([]);
      }
    };
    loadCourses();
  }, []);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await makeRequest.get("/secretary/students", {
        params: { ...filters, page: 1, limit: 10 },
      });
      setPreview(res.data.students || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load preview");
      setPreview([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadCsv = async () => {
    try {
      const res = await makeRequest.get("/secretary/export/csv", {
        params: {
          course_id: filters.course_id || undefined,
          module: filters.module || undefined,
          term: filters.term || undefined,
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "students_export.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      toast.error("CSV export failed");
    }
  };

  const downloadPdf = async () => {
    try {
      const res = await makeRequest.get("/secretary/export/pdf", {
        params: {
          course_id: filters.course_id || undefined,
          module: filters.module || undefined,
          term: filters.term || undefined,
        },
      });
      const rows = res.data.rows || [];

      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text("Student List Export", 14, 14);

      autoTable(doc, {
        startY: 22,
        head: [["Reg No", "Name", "Email", "Phone", "Course", "Module", "Term", "Guardian"]],
        body: rows.map((r) => [
          r.reg_no,
          r.student_name,
          r.email || "",
          r.phone || "",
          r.course_name || "",
          r.module ?? "",
          r.term ?? "",
          r.guardian_name || "",
        ]),
      });

      doc.save("students_export.pdf");
    } catch (err) {
      console.error(err);
      toast.error("PDF export failed");
    }
  };

  return (
    <SecretaryShell
      title="Reports"
      subtitle="Export student lists using filters. CSV downloads from the server; PDF is generated in-browser using existing PDF tools."
    >
      <Toaster position="top-right" />

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4 md:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Course</span>
            <select
              value={filters.course_id}
              onChange={(e) => setFilters((p) => ({ ...p, course_id: e.target.value }))}
              className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none"
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_name}
                </option>
              ))}
            </select>
          </label>
          <Field label="Module" value={filters.module} onChange={(v) => setFilters((p) => ({ ...p, module: v }))} />
          <Field label="Term" value={filters.term} onChange={(v) => setFilters((p) => ({ ...p, term: v }))} />
          <div className="flex flex-wrap gap-2 md:justify-end">
            <button
              onClick={fetchPreview}
              disabled={loading}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Preview
            </button>
            <button
              onClick={downloadCsv}
              className="rounded-2xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Generate CSV
            </button>
            <button
              onClick={downloadPdf}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Generate PDF
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Preview</div>
          <div className="mt-3 overflow-auto rounded-3xl border border-slate-200 bg-slate-50">
            <table className="min-w-full">
              <thead className="bg-slate-100/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reg No</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Course</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Module</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Term</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-500">Loading…</td></tr>
                ) : preview.length === 0 ? (
                  <tr><td colSpan="5" className="px-5 py-8 text-center text-slate-500">No preview data.</td></tr>
                ) : (
                  preview.map((s) => (
                    <tr key={s.student_id} className="bg-white">
                      <td className="px-5 py-4 font-semibold text-sky-700">{s.reg_no}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{s.full_name}</td>
                      <td className="px-5 py-4 text-slate-700">{s.course_name}</td>
                      <td className="px-5 py-4 text-slate-700">{s.module ?? "—"}</td>
                      <td className="px-5 py-4 text-slate-700">{s.term ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </SecretaryShell>
  );
};

const Field = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm outline-none"
    />
  </label>
);

export default SecretaryReports;
