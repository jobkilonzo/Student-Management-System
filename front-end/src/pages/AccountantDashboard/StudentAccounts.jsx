import { useEffect, useMemo, useState } from "react";
import { makeRequest } from "../../../axios";
import AccountantLayout from "./AccountantLayout";

// Format numbers as Kenyan Shillings
const formatCurrency = (value) => `KSh ${Number(value || 0).toLocaleString()}`;

const StudentAccounts = () => {
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
  const [error, setError] = useState("");

  // Load student accounts and balances
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await makeRequest.get("/accountant/student-balances");
      // Compute balance as total_fees - amount_paid
      const accountsWithBalance = res.data.map(acc => ({
        ...acc,
        balance: (acc.total_fees || 0) - (acc.amount_paid || 0),
      }));
      setAccounts(accountsWithBalance);
    } catch (err) {
      console.error("Failed to load student accounts:", err);
      setError("Failed to load student accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Filter accounts by search
  const filteredAccounts = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return accounts;

    return accounts.filter(account =>
      [account.student_name, account.reg_no, account.course_name, account.email]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term))
    );
  }, [accounts, search]);

  const selectedAccount = accounts.find(
    account => Number(account.id) === Number(paymentForm.student_id)
  );

  // Compute balance helper
  const computeBalance = (account) => (account.total_fees || 0) - (account.amount_paid || 0);

  // Handle fee payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();

    const numericAmount = Number(paymentForm.amount_paid);

    if (!paymentForm.student_id) return setError("Select a student.");
    if (Number.isNaN(numericAmount) || numericAmount <= 0)
      return setError("Enter a valid amount.");

    try {
      setError("");
      await makeRequest.post("/accountant/payments", {
        ...paymentForm,
        amount_paid: numericAmount,
      });

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
      setError(err?.response?.data?.error || "Failed to record payment.");
    }
  };

  return (
    <AccountantLayout
      title="Student Accounts"
      subtitle="Review balances, payment progress, and account status for every student."
    >
      <div className="space-y-6">

        {/* Record Fee Payment */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900">Record Fee Payment</h2>
          <p className="text-slate-500 text-sm mt-1">
            Select a student, enter the amount paid, and the system will update their balance.
          </p>

          <form onSubmit={handleRecordPayment} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
            <select
              value={paymentForm.student_id}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, student_id: e.target.value }))}
              required
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
            >
              <option value="">Select student</option>
              {accounts.map(account => (
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
              placeholder="Amount paid"
              value={paymentForm.amount_paid}
              onChange={e => setPaymentForm(prev => ({ ...prev, amount_paid: e.target.value }))}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
            />

            <input
              type="datetime-local"
              value={paymentForm.payment_date}
              onChange={e => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
            />

            <input
              type="text"
              placeholder="Reference"
              value={paymentForm.reference}
              onChange={e => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
            />

            <button
              type="submit"
              className="rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800"
            >
              Post Payment
            </button>
          </form>

          {/* Selected student balance */}
          {selectedAccount && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Current balance for <span className="font-semibold text-slate-900">{selectedAccount.student_name}</span>:{" "}
              <span className={`font-semibold ${computeBalance(selectedAccount) < 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(computeBalance(selectedAccount))}
              </span>
            </div>
          )}
        </section>

        {/* Account Register */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Account Register</h2>
              <p className="text-slate-500 text-sm">Search by student name, registration number, course, or email.</p>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts..."
              className="w-full lg:w-80 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
            />
          </div>
        </section>

        {/* Accounts Table */}
        <section className="bg-white rounded-2xl shadow-sm p-6 overflow-x-auto">
          {loading ? (
            <div className="text-center text-slate-500 py-10">Loading student accounts...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center text-slate-500 py-10">No student accounts match your search.</div>
          ) : (
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b">
                  <th className="pb-3 font-semibold">Student</th>
                  <th className="pb-3 font-semibold">Course</th>
                  <th className="pb-3 font-semibold">Module</th>
                  <th className="pb-3 font-semibold">Total Fees</th>
                  <th className="pb-3 font-semibold">Paid</th>
                  <th className="pb-3 font-semibold">Balance</th>
                  <th className="pb-3 font-semibold">Last Payment</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(account => (
                  <tr key={account.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="py-4">
                      <p className="font-semibold text-slate-900">{account.student_name}</p>
                      <p className="text-sm text-slate-500">{account.reg_no}</p>
                    </td>
                    <td className="py-4 text-slate-700">{account.course_name || "-"}</td>
                    <td className="py-4 text-slate-700">{account.module || "-"}</td>
                    <td className="py-4 font-semibold text-slate-900">{formatCurrency(account.total_fees)}</td>
                    <td className="py-4 font-semibold text-emerald-600">{formatCurrency(account.amount_paid)}</td>
                    <td className={`py-4 font-semibold ${computeBalance(account) < 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatCurrency(computeBalance(account))}
                    </td>
                    <td className="py-4 text-slate-700">
                      {account.last_payment_amount ? formatCurrency(account.last_payment_amount) : "-"}
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          account.status === "Cleared"
                            ? "bg-emerald-100 text-emerald-700"
                            : account.status === "Partially Paid"
                            ? "bg-amber-100 text-amber-700"
                            : account.status === "No Fee Set"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {account.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Recent Payments */}
        {selectedAccount?.payments?.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Payments for {selectedAccount.student_name}</h2>
            <div className="mt-4 space-y-3">
              {selectedAccount.payments.map(payment => (
                <div key={payment.id} className="rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{formatCurrency(payment.amount_paid)}</p>
                    <p className="text-sm text-slate-500">{payment.reference || "No reference"}</p>
                  </div>
                  <p className="text-sm text-slate-500">{new Date(payment.payment_date).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </AccountantLayout>
  );
};

export default StudentAccounts;