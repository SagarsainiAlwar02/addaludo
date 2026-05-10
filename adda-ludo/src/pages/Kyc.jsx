import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Kyc() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    dob: "",
    docType: "aadhar",
    docNumber: "",
  });

  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [kycStatus, setKycStatus] = useState("not_submitted");

  const statusText = {
    not_submitted: "Not Submitted",
    pending: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
  };

  useEffect(() => {
    const fetchKycStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user")) || {};

        if (!token) {
          setKycStatus(storedUser.kycStatus || "not_submitted");
          setProfileLoading(false);
          return;
        }

        const res = await axios.get(`${API_URL}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = res.data || {};
        const status = user.kycStatus || "not_submitted";

        setKycStatus(status);

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            ...user,
            kycStatus: status,
          })
        );
      } catch (err) {
        console.log("KYC status fetch error:", err);
        const storedUser = JSON.parse(localStorage.getItem("user")) || {};
        setKycStatus(storedUser.kycStatus || "not_submitted");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchKycStatus();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleFront = (e) => {
    setFrontFile(e.target.files[0]);
  };

  const handleBack = (e) => {
    setBackFile(e.target.files[0]);
  };

  const isAdult = (dob) => {
    const birth = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= 18;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (kycStatus === "approved") {
      alert("Your KYC is already approved");
      return;
    }

    if (kycStatus === "pending") {
      alert("Your KYC is already under review");
      return;
    }

    if (!form.name || !form.dob || !form.docNumber) {
      alert("Please fill all fields");
      return;
    }

    if (!isAdult(form.dob)) {
      alert("Must be 18+ to submit KYC");
      return;
    }

    if (!frontFile || !backFile) {
      alert("Please upload both documents");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again");
        navigate("/login");
        return;
      }

     const res = await axios.post(`${API_URL}/kyc/submit`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const newStatus = res.data?.kycStatus || "pending";

      setKycStatus(newStatus);
      setSuccess(true);

      const storedUser = JSON.parse(localStorage.getItem("user")) || {};
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          kycStatus: newStatus,
        })
      );

      setForm({
        name: "",
        dob: "",
        docType: "aadhar",
        docNumber: "",
      });

      setFrontFile(null);
      setBackFile(null);
    } catch (error) {
      console.log("KYC submit error:", error);
      alert(error.response?.data?.msg || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="page-container">
        <div className="box-card" style={{ padding: "20px" }}>
          Loading KYC status...
        </div>
      </div>
    );
  }

  if (kycStatus === "approved") {
    return (
      <div className="page-container">
        <div className="section-header">
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700" }}>
            ✅ KYC Approved
          </h2>
        </div>

        <div
          className="box-card"
          style={{
            background: "#dcfce7",
            borderLeft: "4px solid #16a34a",
            padding: "18px",
          }}
        >
          <p style={{ margin: 0, fontWeight: "700", color: "#166534" }}>
            Your KYC is approved. Now you can use withdrawals and premium
            matches.
          </p>
        </div>

        <button
          onClick={() => navigate("/profile")}
          style={{
            width: "100%",
            background: "#111827",
            color: "white",
            padding: "14px",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            marginTop: "20px",
            cursor: "pointer",
          }}
        >
          BACK TO PROFILE
        </button>
      </div>
    );
  }

  if (kycStatus === "pending") {
    return (
      <div className="page-container">
        <div className="section-header">
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700" }}>
            ⏳ KYC Under Review
          </h2>
        </div>

        <div
          className="box-card"
          style={{
            background: "#fff7ed",
            borderLeft: "4px solid #f97316",
            padding: "18px",
          }}
        >
          <p style={{ margin: 0, fontWeight: "700", color: "#9a3412" }}>
            Your KYC has already been submitted. Please wait for admin approval.
          </p>
        </div>

        <button
          onClick={() => navigate("/profile")}
          style={{
            width: "100%",
            background: "#111827",
            color: "white",
            padding: "14px",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            marginTop: "20px",
            cursor: "pointer",
          }}
        >
          BACK TO PROFILE
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <h2 style={{ fontSize: "1.4rem", fontWeight: "700" }}>
          <i
            className="fa-solid fa-shield-halved"
            style={{ color: "#10b981", marginRight: "8px" }}
          ></i>
          Identity Verification
        </h2>
      </div>

      <div
        className="box-card"
        style={{ background: "#f0fdf4", borderLeft: "4px solid #10b981" }}
      >
        <p style={{ margin: 0, fontWeight: "500", color: "#166534" }}>
          Complete KYC to unlock withdrawals & premium matches
        </p>
      </div>

      {success && (
        <div
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "10px",
            marginTop: "10px",
            borderRadius: "8px",
            fontWeight: "600",
          }}
        >
          ✅ KYC submitted successfully. Status: {statusText[kycStatus]}
        </div>
      )}

      <form className="box-card" onSubmit={handleSubmit} style={{ padding: "20px" }}>
        <label>LEGAL FULL NAME</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="form-input"
          placeholder="As per document"
        />

        <label>DATE OF BIRTH</label>
        <input
          type="date"
          name="dob"
          value={form.dob}
          onChange={handleChange}
          className="form-input"
        />

        <label>DOCUMENT TYPE</label>
        <select
          name="docType"
          value={form.docType}
          onChange={handleChange}
          className="form-input"
        >
          <option value="aadhar">Aadhar Card</option>
          <option value="pan">PAN Card</option>
          <option value="passport">Passport</option>
        </select>

        <label>DOCUMENT NUMBER</label>
        <input
          type="text"
          name="docNumber"
          value={form.docNumber}
          onChange={handleChange}
          className="form-input"
          placeholder="XXXX-XXXX-XXXX"
        />

        <label>FRONT IMAGE</label>
        <input type="file" onChange={handleFront} />

        <label>BACK IMAGE</label>
        <input type="file" onChange={handleBack} />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#9ca3af" : "#10b981",
            color: "white",
            padding: "14px",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            marginTop: "20px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Submitting..." : "SUBMIT FOR REVIEW"}
        </button>
      </form>
    </div>
  );
}