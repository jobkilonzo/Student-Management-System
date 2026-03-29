import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const FeeBalance = () => {
  const navigate = useNavigate();
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleBack = () => {
    navigate("/student/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Fee Balance</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
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
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold">Total Fees:</span>
                <span className="text-lg font-bold text-gray-800">KSh {feeData.total_fees?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold">Amount Paid:</span>
                <span className="text-lg font-bold text-green-600">KSh {feeData.amount_paid?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <span className="font-semibold">Balance:</span>
                <span className="text-lg font-bold text-red-600">KSh {feeData.balance?.toLocaleString() || 0}</span>
              </div>
              {feeData.balance > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> You have an outstanding balance. Please contact the accountant for payment details.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No fee information available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeBalance;