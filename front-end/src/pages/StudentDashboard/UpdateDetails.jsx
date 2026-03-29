import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";

const UpdateDetails = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "Male",
    dob: "",
    id_number: "",
    phone: "",
    email: "",
    address: "",
    guardian_name: "",
    guardian_phone: "",
  });

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const res = await makeRequest.get("/student/profile");
      setStudent(res.data);
      setFormData({
        first_name: res.data.first_name || "",
        middle_name: res.data.middle_name || "",
        last_name: res.data.last_name || "",
        gender: res.data.gender || "Male",
        dob: res.data.dob ? res.data.dob.split('T')[0] : "",
        id_number: res.data.id_number || "",
        phone: res.data.phone || "",
        email: res.data.email || "",
        address: res.data.address || "",
        guardian_name: res.data.guardian_name || "",
        guardian_phone: res.data.guardian_phone || "",
      });
    } catch (err) {
      console.error("Error fetching student data:", err);
      setError("Failed to load student data");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await makeRequest.put("/student/profile", formData);
      alert("Details updated successfully!");
      navigate("/student/dashboard");
    } catch (err) {
      console.error("Error updating details:", err);
      alert("Failed to update details");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/student/dashboard");
  };

  if (!student && !error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-800">Update Your Details</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First Name"
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                placeholder="Middle Name"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last Name"
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* DOB & ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                type="text"
                name="id_number"
                value={formData.id_number}
                onChange={handleChange}
                placeholder="ID Number"
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone"
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            {/* Address */}
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
            />

            {/* Guardian */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleChange}
                placeholder="Guardian Name"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                type="tel"
                name="guardian_phone"
                value={formData.guardian_phone}
                onChange={handleChange}
                placeholder="Guardian Phone"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {loading ? "Updating…" : "Update Details"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateDetails;