import React, { useEffect, useState } from "react";
import API from "../../api";
import "./kyc.css";

const API_HOST = "https://api.addaludo.com";

const Kyc = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (path) => {
    if (!path) return "";
    if (String(path).startsWith("http")) return path;
    return `${API_HOST}${path}`;
  };

  const fetchKyc = async () => {
    try {
      setLoading(true);
      const res = await API.get("/kyc/admin/all");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("KYC fetch error:", err.response?.data || err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
  }, []);

  const approve = async (id) => {
    try {
      await API.patch(`/kyc/admin/approve/${id}`);
      alert("KYC approved");
      setSelected(null);
      fetchKyc();
    } catch (err) {
      alert(err.response?.data?.msg || "Approve failed");
    }
  };

  const reject = async (id) => {
    const reason = prompt("Reject reason likho:");
    if (!reason) return;

    try {
      await API.patch(`/kyc/admin/reject/${id}`, { reason });
      alert("KYC rejected");
      setSelected(null);
      fetchKyc();
    } catch (err) {
      alert(err.response?.data?.msg || "Reject failed");
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();

    return (
      String(u.name || "").toLowerCase().includes(q) ||
      String(u.phone || "").includes(q) ||
      String(u.email || "").toLowerCase().includes(q) ||
      String(u.kyc?.name || "").toLowerCase().includes(q) ||
      String(u.kyc?.docType || "").toLowerCase().includes(q) ||
      String(u.kyc?.docNumber || "").toLowerCase().includes(q) ||
      String(u.kycStatus || "").toLowerCase().includes(q)
    );
  });

  if (loading) return <p>Loading KYC...</p>;

  return (
    <div className="kyc-admin-container">
      <h1>KYC Management</h1>

      <input
        className="kyc-search"
        placeholder="Search by name, mobile, document number, status..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="kyc-table-scroll">
        <table className="kyc-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Mobile</th>
              <th>Doc Type</th>
              <th>Doc Number</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Documents</th>
              <th>View</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((u) => (
                <tr key={u._id}>
                  <td>{u.kyc?.name || u.name || "User"}</td>
                  <td>{u.phone || "-"}</td>
                  <td>{u.kyc?.docType || "-"}</td>
                  <td>{u.kyc?.docNumber || "-"}</td>
                  <td className={u.kycStatus}>{u.kycStatus || "-"}</td>
                  <td>
                    {u.kyc?.submittedAt
                      ? new Date(u.kyc.submittedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    {u.kyc?.frontImage || u.kyc?.backImage ? "Uploaded" : "No Image"}
                  </td>
                  <td>
                    <button className="view" onClick={() => setSelected(u)}>
                      View
                    </button>
                  </td>
                  <td>
                    {u.kycStatus === "pending" ? (
                      <>
                        <button className="approve" onClick={() => approve(u._id)}>
                          Approve
                        </button>
                        <button className="reject" onClick={() => reject(u._id)}>
                          Reject
                        </button>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>
                  No KYC found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="kyc-modal">
          <div className="kyc-modal-content">
            <h2>KYC Details</h2>

            <p>
              <b>Name:</b> {selected.kyc?.name || selected.name || "-"}
            </p>
            <p>
              <b>Mobile:</b> {selected.phone || "-"}
            </p>
            <p>
              <b>Email:</b> {selected.email || "-"}
            </p>
            <p>
              <b>DOB:</b> {selected.kyc?.dob || "-"}
            </p>
            <p>
              <b>Doc Type:</b> {selected.kyc?.docType || "-"}
            </p>
            <p>
              <b>Doc Number:</b> {selected.kyc?.docNumber || "-"}
            </p>
            <p>
              <b>Status:</b> {selected.kycStatus || "-"}
            </p>
            <p>
              <b>Reject Reason:</b> {selected.kyc?.rejectReason || "-"}
            </p>

            <div style={{ marginTop: "18px" }}>
              <h3>Uploaded Documents</h3>

              <div style={{ marginTop: "12px" }}>
                <b>Front Image:</b>
                <br />
                {selected.kyc?.frontImage ? (
                  <a
                    href={getImageUrl(selected.kyc.frontImage)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={getImageUrl(selected.kyc.frontImage)}
                      alt="Front Document"
                      style={{
                        width: "100%",
                        maxWidth: "420px",
                        maxHeight: "280px",
                        objectFit: "contain",
                        borderRadius: "10px",
                        marginTop: "8px",
                        border: "1px solid #ddd",
                        background: "#f8fafc",
                      }}
                    />
                  </a>
                ) : (
                  <p>No front image uploaded</p>
                )}
              </div>

              <div style={{ marginTop: "18px" }}>
                <b>Back Image:</b>
                <br />
                {selected.kyc?.backImage ? (
                  <a
                    href={getImageUrl(selected.kyc.backImage)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={getImageUrl(selected.kyc.backImage)}
                      alt="Back Document"
                      style={{
                        width: "100%",
                        maxWidth: "420px",
                        maxHeight: "280px",
                        objectFit: "contain",
                        borderRadius: "10px",
                        marginTop: "8px",
                        border: "1px solid #ddd",
                        background: "#f8fafc",
                      }}
                    />
                  </a>
                ) : (
                  <p>No back image uploaded</p>
                )}
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              {selected.kycStatus === "pending" && (
                <>
                  <button className="approve" onClick={() => approve(selected._id)}>
                    Approve
                  </button>
                  <button className="reject" onClick={() => reject(selected._id)}>
                    Reject
                  </button>
                </>
              )}

              <button onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kyc;