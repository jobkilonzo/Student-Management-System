import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { makeRequest } from "../../../axios";
import SecretaryShell from "./SecretaryShell";

const formatCurrency = (value) => `KSh ${Number(value || 0).toLocaleString()}`;

const SecretaryFeePayments = () => {
  const [accounts, setAccounts] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    student_id: "",
    amount_paid: "",
    payment_date: "",
    reference: "",
    notes: "",
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await makeRequest.get("/secretary/student-balances");
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load student balances:", err);
      toast.error("Failed to load student balances");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return accounts;

    return accounts.filter((account) =>
      [account.student_name, account.reg_no, account.course_name, account.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [accounts, search]);

  const selectedAccount = accounts.find((account) => Number(account.id) === Number(paymentForm.student_id));

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const numericAmount = Number(paymentForm.amount_paid);

    if (!paymentForm.student_id) return toast.error("Select a student.");
    if (Number.isNaN(numericAmount) || numericAmount <= 0) return toast.error("Enter a valid amount.");

    setBusy(true);
    try {
      await makeRequest.post("/secretary/payments", {
        ...paymentForm,
        amount_paid: numericAmount,
      });
      toast.success("Payment recorded");
      setPaymentForm({
        student_id: "",
        amount_paid: "",
        payment_date: "",
        reference: "",
        notes: "",
      });
      await loadAccounts();
    } catch (err) {
      console.error("Failed to record payment:", err);
      toast.error(err?.response?.data?.error || "Failed to record payment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SecretaryShell title="Fee Payments" subtitle="Record fee payments and review current balances.">
      <Toaster position="top-right" />

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Student Balances</h2>
            <p className="mt-1 text-sm text-slate-600">Search by student name, registration number, course, or email.</p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full lg:w-80 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Record Fee Payment</h2>
        <p className="mt-1 text-sm text-slate-600">Select a student and record a payment using the accountant payment workflow.</p>

        <form onSubmit={handleRecordPayment} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={paymentForm.student_id}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, student_id: e.target.value }))}
            required
            disabled={busy || loading}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
          >
            <option value="">Select student</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.student_name} ({account.reg_no})
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            disabled={busy}
            placeholder="Amount paid"
            value={paymentForm.amount_paid}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount_paid: e.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
          />

          <input
            type="datetime-local"
            disabled={busy}
            value={paymentForm.payment_date}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_date: e.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
          />

          <input
            type="text"
            disabled={busy}
            placeholder="Reference"
            value={paymentForm.reference}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
          />

          <input
            type="text"
            disabled={busy}
            placeholder="Notes (optional)"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
            className="md:col-span-2 xl:col-span-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
          />

          <div className="md:col-span-2 xl:col-span-1 flex items-end justify-end">
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
            >
              {busy ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>

        {selectedAccount ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Current balance for <span className="font-semibold text-slate-900">{selectedAccount.student_name}</span>:{" "}
            <span className={`font-bold ${Number(selectedAccount.balance || 0) <= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {formatCurrency(selectedAccount.balance)}
            </span>
          </div>
        ) : null}
      </section>

      <section className="overflow-x-auto rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-slate-500">Loading balances...</div>
        ) : filteredAccounts.length === 0 ? (
          <div className="py-10 text-center text-slate-500">No students found.</div>
        ) : (
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b text-left text-sm text-slate-500">
                <th className="pb-3 font-semibold">Student</th>
                <th className="pb-3 font-semibold">Course</th>
                <th className="pb-3 font-semibold">Module</th>
                <th className="pb-3 font-semibold">Total Fees</th>
                <th className="pb-3 font-semibold">Paid</th>
                <th className="pb-3 font-semibold">Balance</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="py-4">
                    <div className="font-semibold text-slate-900">{account.student_name}</div>
                    <div className="text-sm text-slate-500">{account.reg_no}</div>
                  </td>
                  <td className="py-4 text-slate-700">{account.course_name || "-"}</td>
                  <td className="py-4 text-slate-700">{account.module || "-"}</td>
                  <td className="py-4 font-semibold text-slate-900">{formatCurrency(account.total_fees)}</td>
                  <td className="py-4 font-semibold text-emerald-700">{formatCurrency(account.amount_paid)}</td>
                  <td className={`py-4 font-semibold ${Number(account.balance || 0) <= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatCurrency(account.balance)}
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        account.status === "Cleared"
                          ? "bg-emerald-100 text-emerald-700"
                          : account.status === "Partially Paid"
                            ? "bg-amber-100 text-amber-700"
                            : account.status === "No Fee Set"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {account.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </SecretaryShell>
  );
};

export default SecretaryFeePayments;
