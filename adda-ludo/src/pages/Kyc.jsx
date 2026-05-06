import React, { useState } from 'react';

export default function Kyc() {

    const [form, setForm] = useState({
        name: "",
        dob: "",
        docType: "aadhar",
        docNumber: ""
    });

    const [frontFile, setFrontFile] = useState(null);
    const [backFile, setBackFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // 🟢 HANDLE INPUT CHANGE
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    // 🟢 FILE HANDLER
    const handleFront = (e) => {
        setFrontFile(e.target.files[0]);
    };

    const handleBack = (e) => {
        setBackFile(e.target.files[0]);
    };

    // 🟢 AGE VALIDATION
    const isAdult = (dob) => {
        const birth = new Date(dob);
        const age = new Date().getFullYear() - birth.getFullYear();
        return age >= 18;
    };

    // 🟢 SUBMIT KYC
    const handleSubmit = async (e) => {
        e.preventDefault();

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

            // 🔥 HERE YOU CAN CONNECT BACKEND / SOCKET
            // Example:
            // socket.emit("kycSubmit", { form, frontFile, backFile });

            console.log("KYC SUBMITTED:", form);

            setTimeout(() => {
                setLoading(false);
                setSuccess(true);

                setForm({
                    name: "",
                    dob: "",
                    docType: "aadhar",
                    docNumber: ""
                });

                setFrontFile(null);
                setBackFile(null);

            }, 1500);

        } catch (error) {
            setLoading(false);
            alert("Something went wrong!");
        }
    };

    return (
        <div className="page-container">

            {/* HEADER */}
            <div className="section-header">
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>
                    <i className="fa-solid fa-shield-halved" style={{ color: '#10b981', marginRight: '8px' }}></i>
                    Identity Verification
                </h2>
            </div>

            {/* INFO */}
            <div className="box-card" style={{ background: '#f0fdf4', borderLeft: '4px solid #10b981' }}>
                <p style={{ margin: 0, fontWeight: '500', color: '#166534' }}>
                    Complete KYC to unlock withdrawals & premium matches
                </p>
            </div>

            {/* SUCCESS MESSAGE */}
            {success && (
                <div style={{
                    background: "#dcfce7",
                    color: "#166534",
                    padding: "10px",
                    marginTop: "10px",
                    borderRadius: "8px",
                    fontWeight: "600"
                }}>
                    ✅ KYC submitted successfully (Under review)
                </div>
            )}

            {/* FORM */}
            <form className="box-card" onSubmit={handleSubmit} style={{ padding: '20px' }}>

                {/* NAME */}
                <label>LEGAL FULL NAME</label>
                <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="As per document"
                />

                {/* DOB */}
                <label>DATE OF BIRTH</label>
                <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    className="form-input"
                />

                {/* DOC TYPE */}
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

                {/* DOC NUMBER */}
                <label>DOCUMENT NUMBER</label>
                <input
                    type="text"
                    name="docNumber"
                    value={form.docNumber}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="XXXX-XXXX-XXXX"
                />

                {/* FRONT UPLOAD */}
                <label>FRONT IMAGE</label>
                <input type="file" onChange={handleFront} />

                {/* BACK UPLOAD */}
                <label>BACK IMAGE</label>
                <input type="file" onChange={handleBack} />

                {/* SUBMIT */}
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
                        cursor: "pointer"
                    }}
                >
                    {loading ? "Submitting..." : "SUBMIT FOR REVIEW"}
                </button>

            </form>

        </div>
    );
}