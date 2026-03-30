import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../../../axios";
import StudentPortalLayout from "./StudentPortalLayout";

const Field = ({ label, ...props }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />
  </label>
);

const UpdateDetailsPro = () => {
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
        dob: res.data.dob ? res.data.dob.split("T")[0] : "",
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await makeRequest.put("/student/profile", formData);
      navigate("/student/dashboard");
    } catch (err) {
      console.error("Error updating details:", err);
      setError("Failed to update details");
    } finally {
      setLoading(false);
    }
  };

  if (!student && !error) {
    return (
      <StudentPortalLayout title="Update Details" subtitle="Loading your profile information...">
        <div className="py-12 text-center text-slate-500">Loading...</div>
      </StudentPortalLayout>
    );
  }

  return (
    <StudentPortalLayout
      title="Update Your Details"
      subtitle="Keep your contact information and guardian details current so the institution can reach you when needed."
    >
      {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
          <Field label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleChange} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Gender</span>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} required />
          <Field label="ID Number" name="id_number" value={formData.id_number} onChange={handleChange} required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
          <Field label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <Field label="Address" name="address" value={formData.address} onChange={handleChange} />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Guardian Name" name="guardian_name" value={formData.guardian_name} onChange={handleChange} />
          <Field label="Guardian Phone" type="tel" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </StudentPortalLayout>
  );
};

export default UpdateDetailsPro;
