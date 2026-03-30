import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { makeRequest } from "../../../axios";
import StudentPortalLayout from "./StudentPortalLayout";

const INSTITUTE_NAME = "St John Paul II Institute";
const INSTITUTE_ADDRESS = "P.O. BOX 300 - 90200";
const INSTITUTE_PHONE = "0706333977 / 0726607683";
const INSTITUTE_EMAIL = "stjohnpauliiinstitute@gmail.com";

const FeeBalance = () => {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchFeeBalance();
  }, []);

  const fetchFeeBalance = async () => {
    try {
      setLoading(true);
      const res = await makeRequest.get("/student/fees");
      setFeeData(res.data);
    } catch (err) {
      console.error("Error fetching fee balance:", err);
      setError("Failed to load fee balance");
    } finally {
      setLoading(false);
    }
  };

  const buildReceiptLines = (payment) => [
    ["Student Name", feeData?.student_name || "N/A"],
    ["Receipt No", `RCPT-${payment.id}`],
    ["Reference", payment.reference || "N/A"],
    ["Payment Date", new Date(payment.payment_date).toLocaleString()],
    ["Registration No", feeData?.reg_no || "N/A"],
    ["Course", `${feeData?.course_name || "Not assigned"}${feeData?.course_code ? ` (${feeData.course_code})` : ""}`],
    ["Amount Paid", `KSh ${Number(payment.amount_paid || 0).toLocaleString()}`],
    ["Recorded Balance", `KSh ${Number(feeData?.balance || 0).toLocaleString()}`],
    ["Notes", payment.notes || "Fee payment received"],
  ];

  const handleDownloadReceipt = (payment) => {
    const doc = new jsPDF();
    const lines = buildReceiptLines(payment);

    doc.setFontSize(18);
    doc.text(INSTITUTE_NAME, 20, 20);
    doc.setFontSize(11);
    doc.text(INSTITUTE_ADDRESS, 20, 30);
    doc.text(`Phone: ${INSTITUTE_PHONE}`, 20, 38);
    doc.text(`Email: ${INSTITUTE_EMAIL}`, 20, 46);
    doc.setFontSize(14);
    doc.text("Student Fee Receipt", 20, 58);

    let y = 72;
    lines.forEach(([label, value]) => {
      doc.setFont(undefined, "bold");
      doc.text(`${label}:`, 20, y);
      doc.setFont(undefined, "normal");
      doc.text(String(value), 75, y);
      y += 10;
    });

    doc.save(`receipt_${payment.id}.pdf`);
  };

  return (
    <StudentPortalLayout
      title="Fee Balance"
      subtitle="Review your current fee position, recorded payments, and download official receipts."
    >
      <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-gray-500">Loading fee balance...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : feeData ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-blue-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Course</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {feeData.course_name || "Not assigned"}
                    {feeData.course_code ? ` (${feeData.course_code})` : ""}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Student</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">{feeData.student_name || "Student"}</p>
                  <p className="text-sm text-slate-500">{feeData.reg_no || "No registration number"}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-sky-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">Current Level Fee</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">KSh {feeData.current_fee?.toLocaleString() || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Total Billed</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">KSh {feeData.total_fees?.toLocaleString() || 0}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Amount Paid</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">KSh {feeData.amount_paid?.toLocaleString() || 0}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">Balance</p>
                  <p className="mt-2 text-2xl font-bold text-rose-700">KSh {feeData.balance?.toLocaleString() || 0}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Module And Fee History</h2>
                    <p className="text-sm text-slate-500">
                      Previous modules and levels remain visible here, and unpaid balances continue into your current billing.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                    Historical billed fees: <span className="font-semibold text-slate-900">KSh {feeData.historical_fee_total?.toLocaleString() || 0}</span>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                        <th className="pb-3 font-semibold">Course</th>
                        <th className="pb-3 font-semibold">Module</th>
                        <th className="pb-3 font-semibold">Term</th>
                        <th className="pb-3 font-semibold">Fee</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100 bg-sky-50/60">
                        <td className="py-4 font-medium text-slate-900">
                          {feeData.current_stage?.course_name || "Not assigned"}
                          {feeData.current_stage?.course_code ? ` (${feeData.current_stage.course_code})` : ""}
                        </td>
                        <td className="py-4 text-slate-700">{feeData.current_stage?.module || "-"}</td>
                        <td className="py-4 text-slate-700">{feeData.current_stage?.term || "-"}</td>
                        <td className="py-4 font-semibold text-slate-900">
                          KSh {Number(feeData.current_stage?.fee_amount || 0).toLocaleString()}
                        </td>
                        <td className="py-4">
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            Current
                          </span>
                        </td>
                      </tr>
                      {feeData.fee_history?.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="py-4 text-slate-700">
                            {item.course_name || "Not assigned"}
                            {item.course_code ? ` (${item.course_code})` : ""}
                          </td>
                          <td className="py-4 text-slate-700">{item.module || "-"}</td>
                          <td className="py-4 text-slate-700">{item.term || "-"}</td>
                          <td className="py-4 font-semibold text-slate-900">
                            KSh {Number(item.fee_amount || 0).toLocaleString()}
                          </td>
                          <td className="py-4">
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                              Archived
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {feeData.balance > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> You have an outstanding balance. Please contact the accountant for payment details.
                  </p>
                </div>
              )}

              <div className="mt-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Recent Payments</h2>
                {feeData.payments?.length ? (
                  <div className="space-y-3">
                    {feeData.payments.map((payment) => (
                      <div key={payment.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 bg-slate-50 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 text-lg">KSh {payment.amount_paid?.toLocaleString() || 0}</p>
                          <p className="text-sm text-gray-500">{payment.reference || "No reference provided"}</p>
                        </div>
                        <div className="flex flex-col items-start gap-3 md:items-end">
                          <p className="text-sm text-gray-500">
                            {new Date(payment.payment_date).toLocaleString()}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedReceipt(payment)}
                              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100"
                            >
                              View Receipt
                            </button>
                            <button
                              onClick={() => handleDownloadReceipt(payment)}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              Download Receipt
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No fee payments recorded yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No fee information available.</p>
            </div>
          )}
      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{INSTITUTE_NAME}</h2>
                <p className="text-sm text-gray-500">{INSTITUTE_ADDRESS}</p>
                <p className="text-sm text-gray-500">Phone: {INSTITUTE_PHONE}</p>
                <p className="text-sm text-gray-500">Email: {INSTITUTE_EMAIL}</p>
                <p className="text-sm font-semibold text-gray-600 mt-2">Receipt No: RCPT-{selectedReceipt.id}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-2xl leading-none text-gray-400 hover:text-gray-600"
              >
                x
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {buildReceiptLines(selectedReceipt).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-gray-700">{label}</span>
                  <span className="text-right text-gray-600">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => handleDownloadReceipt(selectedReceipt)}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Download PDF
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentPortalLayout>
  );
};

export default FeeBalance;
