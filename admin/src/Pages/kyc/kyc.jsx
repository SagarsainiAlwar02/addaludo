import React, { useEffect, useState } from "react";
import API, { getData, getError, serverBase } from "../../api";
import "./kyc.css";

const ITEMS_PER_PAGE = 40;

const Kyc = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const getImageUrl = (path) => {
    if (!path) return "";
    if (String(path).startsWith("http")) return path;
    return `${serverBase}${path}`;
  };

  const fetchKyc = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/kyc");
      const data = getData(res);
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err) {
      console.log("KYC fetch error:", getError(err));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
  }, []);

  // Reset to page 1 whenever search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const approve = async (id) => {
    try {
      await API.patch(`/admin/kyc/${id}/approve`);
      alert("KYC approved");
      setSelected(null);
      fetchKyc();
    } catch (err) {
      alert(getError(err));
    }
  };

  const reject = async (id) => {
    const reason = prompt("Reject reason likho:");
    if (!reason) return;

    try {
      await API.patch(`/admin/kyc/${id}/reject`, { reason });
      alert("KYC rejected");
      setSelected(null);
      fetchKyc();
    } catch (err) {
      alert(getError(err));
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

  // ---------- PAGINATION LOGIC ----------
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;

    let start = Math.max(1, safePage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };
  // ---------------------------------------

  if (loading) return <p className="kyc-loading">Loading KYC...</p>;

  return (
    <div className="kyc-admin-container">
      <h1>KYC Management</h1>

      <div className="toolbar-row">
        <input
          className="kyc-search"
          placeholder="Search by name, mobile, document number, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filtered.length > 0 && (
          <div className="result-count">
            Showing{" "}
            <strong>
              {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}
            </strong>{" "}
            of <strong>{filtered.length}</strong> records
          </div>
        )}
      </div>

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
            {paginatedList.length > 0 ? (
              paginatedList.map((u) => (
                <tr key={u._id}>
                  <td>{u.kyc?.name || u.name || "User"}</td>
                  <td>{u.phone || "-"}</td>
                  <td className="capitalize">{u.kyc?.docType || "-"}</td>
                  <td className="mono">{u.kyc?.docNumber || "-"}</td>
                  <td>
                    <span className={`status-badge ${u.kycStatus}`}>
                      {u.kycStatus || "-"}
                    </span>
                  </td>
                  <td>
                    {u.kyc?.submittedAt
                      ? new Date(u.kyc.submittedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    <span className={`doc-badge ${u.kyc?.frontImage || u.kyc?.backImage ? "uploaded" : "missing"}`}>
                      {u.kyc?.frontImage || u.kyc?.backImage ? "Uploaded" : "No Image"}
                    </span>
                  </td>
                  <td>
                    <button className="view" onClick={() => setSelected(u)}>
                      View
                    </button>
                  </td>
                  <td>
                    {u.kycStatus === "pending" ? (
                      <div className="action-buttons">
                        <button className="approve" onClick={() => approve(u._id)}>
                          Approve
                        </button>
                        <button className="reject" onClick={() => reject(u._id)}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="empty-row">
                  No KYC found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn nav"
            onClick={() => goToPage(1)}
            disabled={safePage === 1}
          >
            « First
          </button>

          <button
            className="page-btn nav"
            onClick={() => goToPage(safePage - 1)}
            disabled={safePage === 1}
          >
            ‹ Prev
          </button>

          {getPageNumbers().map((page) => (
            <button
              key={page}
              className={`page-btn ${page === safePage ? "active" : ""}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="page-btn nav"
            onClick={() => goToPage(safePage + 1)}
            disabled={safePage === totalPages}
          >
            Next ›
          </button>

          <button
            className="page-btn nav"
            onClick={() => goToPage(totalPages)}
            disabled={safePage === totalPages}
          >
            Last »
          </button>
        </div>
      )}

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
              <b>Status:</b>{" "}
              <span className={`status-badge inline ${selected.kycStatus}`}>
                {selected.kycStatus || "-"}
              </span>
            </p>
            <p>
              <b>Reject Reason:</b> {selected.kyc?.rejectReason || "-"}
            </p>

            <div className="kyc-doc-section">
              <h3>Uploaded Documents</h3>

              <div className="kyc-doc-block">
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
                      className="kyc-doc-img"
                    />
                  </a>
                ) : (
                  <p className="no-doc">No front image uploaded</p>
                )}
              </div>

              <div className="kyc-doc-block">
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
                      className="kyc-doc-img"
                    />
                  </a>
                ) : (
                  <p className="no-doc">No back image uploaded</p>
                )}
              </div>
            </div>

            <div className="kyc-modal-actions">
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

              <button className="close-btn" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kyc;
