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
  const [feeTypes, setFeeTypes] = useState([]);
  const [feeEditor, setFeeEditor] = useState(null);
  const [savingFees, setSavingFees] = useState(false);

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
    loadFeeTypes();
  }, []);

  const loadFeeTypes = async () => {
    try {
      const res = await makeRequest.get("/accountant/fee-types");
      setFeeTypes(res.data || []);
    } catch (err) {
      console.error("Failed to load fee types:", err);
      setFeeTypes([]);
    }
  };

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

  const openFeeEditor = (account) => {
    const existing = Array.isArray(account.fee_breakdown) ? account.fee_breakdown : [];
    setFeeEditor({
      student: account,
      items: existing.length
        ? existing.map((item) => ({
            fee_type_id: String(item.fee_type_id || ""),
            fee_type_name: item.fee_type_name || "",
            term: String(item.term || account.term || ""),
            module: item.module === null || item.module === undefined ? "" : String(item.module),
            total_fee: String(item.total_fee || 0),
          }))
        : [
            {
              fee_type_id: "",
              fee_type_name: "",
              term: String(account.term || ""),
              module: account.module === null || account.module === undefined ? "" : String(account.module),
              total_fee: "",
            },
          ],
    });
  };

  const updateFeeEditorItem = (index, key, value) => {
    setFeeEditor((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addFeeEditorItem = () => {
    setFeeEditor((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          fee_type_id: "",
          fee_type_name: "",
          term: String(prev.student.term || ""),
          module: prev.student.module === null || prev.student.module === undefined ? "" : String(prev.student.module),
          total_fee: "",
        },
      ],
    }));
  };

  const removeFeeEditorItem = (index) => {
    setFeeEditor((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const saveStudentFees = async () => {
    if (!feeEditor?.student?.id) return;

    const feeItems = feeEditor.items.map((item) => ({
      fee_type_id: Number(item.fee_type_id),
      term: item.term ? Number(item.term) : Number(feeEditor.student.term),
      module: item.module === "" ? null : Number(item.module),
      total_fee: Number(item.total_fee),
    }));

    if (feeItems.some((item) => !item.fee_type_id || Number.isNaN(item.total_fee) || item.total_fee < 0)) {
      setError("Each fee row needs a fee type and a valid amount.");
      return;
    }

    try {
      setSavingFees(true);
      setError("");
      await makeRequest.put(`/accountant/student-balances/${feeEditor.student.id}/fees`, {
        fee_items: feeItems,
      });
      setFeeEditor(null);
      await loadAccounts();
    } catch (err) {
      console.error("Failed to update student fees:", err);
      setError(err?.response?.data?.error || "Failed to update student fees.");
    } finally {
      setSavingFees(false);
    }
  };

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
                  <th className="pb-3 font-semibold">Action</th>
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
                    <td className="py-4">
                      <button
                        onClick={() => openFeeEditor(account)}
                        className="rounded-xl bg-teal-100 px-3 py-1.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-200"
                      >
                        Edit Fees
                      </button>
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

        {feeEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Edit Student Fees</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {feeEditor.student.student_name} ({feeEditor.student.reg_no})
                  </p>
                </div>
                <button
                  onClick={() => setFeeEditor(null)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {feeEditor.items.map((item, index) => (
                  <div key={`${item.fee_type_id}-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_0.7fr_0.7fr_0.8fr_auto]">
                    <select
                      value={item.fee_type_id}
                      onChange={(e) => updateFeeEditorItem(index, "fee_type_id", e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-teal-600"
                    >
                      <option value="">Fee type</option>
                      {feeTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.module}
                      onChange={(e) => updateFeeEditorItem(index, "module", e.target.value)}
                      placeholder="Module"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-teal-600"
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.term}
                      onChange={(e) => updateFeeEditorItem(index, "term", e.target.value)}
                      placeholder="Term"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-teal-600"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.total_fee}
                      onChange={(e) => updateFeeEditorItem(index, "total_fee", e.target.value)}
                      placeholder="Amount"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-teal-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeeEditorItem(index)}
                      disabled={feeEditor.items.length === 1}
                      className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={addFeeEditorItem}
                  className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-100"
                >
                  Add Fee Row
                </button>
                <button
                  type="button"
                  onClick={saveStudentFees}
                  disabled={savingFees}
                  className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {savingFees ? "Saving..." : "Save Fees"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AccountantLayout>
  );
};

export default StudentAccounts;
