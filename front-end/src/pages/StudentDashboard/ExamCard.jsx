import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { makeRequest } from "../../../axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatMoney = (n) => `KSh ${Number(n || 0).toLocaleString()}`;

const ExamCard = () => {
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const title = useMemo(() => "My Exam Card", []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await makeRequest.get("/student/exam-card");
      setCard(res?.data?.exam_card || null);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to load exam card";
      toast.error(msg);
      setCard(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!card) return;
    setDownloading(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const studentName = [card?.student?.first_name, card?.student?.middle_name, card?.student?.last_name]
        .filter(Boolean)
        .join(" ");
      const regNo = String(card?.student?.reg_no || "student").replace(/[^\w.-]+/g, "_");
      const term = card?.course?.term ?? "N_A";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("EXAM CARD", 40, 50);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 70);

      doc.setFont("helvetica", "bold");
      doc.text("Student", 40, 100);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${studentName || "-"}`, 40, 118);
      doc.text(`Reg No: ${card?.student?.reg_no || "-"}`, 40, 136);

      doc.setFont("helvetica", "bold");
      doc.text("Course", 40, 166);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Course: ${(card?.course?.course_code || "-") + " - " + (card?.course?.course_name || "-")}`,
        40,
        184
      );
      doc.text(`Module: ${card?.course?.module ?? "N/A"}`, 40, 202);
      doc.text(`TERM: ${card?.course?.term ?? "N/A"}`, 40, 220);

      doc.setFont("helvetica", "bold");
      doc.text("Finance Clearance", 40, 250);
      doc.setFont("helvetica", "normal");
      doc.text(`Status: ${card?.finance?.clearance_status || "-"}`, 40, 268);
      doc.text(`Balance: ${formatMoney(card?.finance?.outstanding_balance)}`, 40, 286);
      if (card?.finance?.academic_hold?.active) {
        doc.text(`Academic Hold: Active (${card?.finance?.academic_hold?.source || "unknown"})`, 40, 304);
      } else {
        doc.text("Academic Hold: None", 40, 304);
      }

      const scheduleByUnitId = new Map((card?.exam_schedule_summary || []).map((s) => [Number(s.unit_id), s]));
      const unitRows = (card?.registered_units || []).map((u) => {
        const sched = scheduleByUnitId.get(Number(u.unit_id));
        return [
          `${u.unit_code || "-"} - ${u.unit_name || "-"}`,
          sched?.exam_date || "-",
          sched?.exam_time || "-",
        ];
      });

      autoTable(doc, {
        startY: 335,
        head: [["Registered Units (Current TERM)", "Exam Date", "Exam Time"]],
        body: unitRows.length ? unitRows : [["-", "-", "-"]],
        styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [15, 23, 42] },
        columnStyles: { 0: { cellWidth: 320 }, 1: { cellWidth: 110 }, 2: { cellWidth: 110 } },
      });

      const filename = `ExamCard_${regNo}_TERM_${String(term).replace(/[^\w.-]+/g, "_")}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download exam card PDF");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    load();
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
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-600 mt-1">Current TERM only.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-600">Loading...</div>
      ) : !card ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-600">
          Exam card not available.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Student Details</h2>
                <p className="mt-1 text-slate-700">
                  {card.student.first_name} {card.student.middle_name || ""} {card.student.last_name}
                </p>
                <p className="text-sm text-slate-500">Reg No: {card.student.reg_no}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">Clearance</p>
                <p
                  className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                    card.finance.clearance_status === "Cleared"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {card.finance.clearance_status}
                </p>
                <p className="mt-2 text-sm text-slate-600">Balance: {formatMoney(card.finance.outstanding_balance)}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Course</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {card.course.course_code} - {card.course.course_name}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Module</p>
                <p className="mt-1 font-semibold text-slate-900">{card.course.module || "N/A"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">TERM</p>
                <p className="mt-1 font-semibold text-slate-900">{card.course.term ?? "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Registered Units (Current TERM)</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadPdf}
                  disabled={downloading}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {downloading ? "Preparing..." : "Download PDF"}
                </button>
                <button
                  onClick={load}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold">Unit</th>
                    <th className="px-4 py-3 text-sm font-semibold">Exam Date</th>
                    <th className="px-4 py-3 text-sm font-semibold">Exam Time</th>
                  </tr>
                </thead>
                <tbody>
                  {card.registered_units.map((u) => {
                    const sched =
                      (card.exam_schedule_summary || []).find((s) => Number(s.unit_id) === Number(u.unit_id)) || null;
                    return (
                      <tr key={u.unit_id} className="border-t hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {u.unit_code} - {u.unit_name}
                        </td>
                        <td className="px-4 py-3 text-sm">{sched?.exam_date || "-"}</td>
                        <td className="px-4 py-3 text-sm">{sched?.exam_time || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamCard;
