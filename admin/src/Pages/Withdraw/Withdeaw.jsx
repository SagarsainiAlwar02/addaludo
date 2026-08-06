import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Withdraw.css";
import API, { getData, getError } from "../../api";

const ITEMS_PER_PAGE = 40;

const Withdrawal = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "request";
  const [selectedUser, setSelectedUser] = useState(null);
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMobile, setSearchMobile] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchWithdraws = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/withdraws?limit=2000");
      const data = getData(res);
      setWithdraws(Array.isArray(data?.withdraws) ? data.withdraws : []);
    } catch (err) {
      console.log("Withdraw fetch error:", getError(err));
      setWithdraws([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, searchMobile]);

  const approve = async (item) => {
    try {
      // Optimistically remove the row so it disappears from the pending list instantly
      setWithdraws((prev) => prev.filter((w) => w._id !== item._id));
      await API.patch(`/admin/withdraws/${item._id}/approve`);
      alert("Withdraw approved");
    } catch (err) {
      fetchWithdraws(); // restore the list if the API call failed
      alert(getError(err));
    }
  };

  const reject = async (item) => {
    try {
      // Optimistically remove the row so it disappears from the pending list instantly
      setWithdraws((prev) => prev.filter((w) => w._id !== item._id));
      await API.patch(`/admin/withdraws/${item._id}/reject`, {
        adminNote: "Rejected from admin panel",
      });
      alert("Withdraw rejected");
    } catch (err) {
      fetchWithdraws(); // restore the list if the API call failed
      alert(getError(err));
    }
  };

  const getDetailValue = (details, keys) => {
    for (const key of keys) {
      if (details?.[key]) return details[key];
    }
    return "-";
  };

  const requests = withdraws.filter(
    (item) => item.type === "withdraw" && item.status === "pending"
  );

  const history = withdraws.filter(
    (item) => item.type === "withdraw" && item.status !== "pending"
  );

  const currentList = tab === "request" ? requests : history;

  const list = currentList.filter((item) =>
    String(item.userId?.phone || "").includes(searchMobile)
  );

  const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedList = list.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  return (
    <div className="withdraw-container">
      <h1>Withdrawal</h1>

      <div className="toolbar-row">
        <div className="search-box">
          <input
            type="text"
            placeholder="Mobile number se search karo"
            value={searchMobile}
            maxLength={10}
            onChange={(e) =>
              setSearchMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
          />
          {searchMobile && (
            <button onClick={() => setSearchMobile("")}>Clear</button>
          )}
        </div>

        {list.length > 0 && (
          <div className="result-count">
            Showing{" "}
            <strong>
              {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, list.length)}
            </strong>{" "}
            of <strong>{list.length}</strong> records
          </div>
        )}
      </div>

      <div className="table-wrapper">
        <table className="withdraw-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Mobile</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Approved / Rejected By</th>
              <th>Action Date</th>
              <th>View</th>
              {tab === "request" && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={tab === "request" ? "10" : "9"} className="empty-row">
                  Loading withdrawals...
                </td>
              </tr>
            ) : paginatedList.length > 0 ? (
              paginatedList.map((item) => {
                const user = item.userId || {};
                const admin = item.actionBy || item.approvedBy || {};

                return (
                  <tr key={item._id}>
                    <td className="mono" data-label="ID">{item._id?.slice(-6)}</td>
                    <td data-label="User">{user.name || "User"}</td>
                    <td data-label="Mobile">{user.phone || "-"}</td>
                    <td className="amount-cell" data-label="Amount">₹{item.amount || 0}</td>
                    <td data-label="Method">
                      <span className="method-badge">
                        {item.withdrawMethod || item.method || "Withdraw"}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td data-label="Approved / Rejected By">
                      {admin.name
                        ? `${admin.name} (${admin.role || "admin"})`
                        : "-"}
                    </td>
                    <td data-label="Action Date">
                      {item.approvedAt
                        ? new Date(item.approvedAt).toLocaleString()
                        : item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "-"}
                    </td>
                    <td data-label="View">
                      <button
                        className="view"
                        onClick={() => setSelectedUser(item)}
                      >
                        View
                      </button>
                    </td>
                    {tab === "request" && (
                      <td data-label="Action">
                        <div className="action-buttons">
                          <button
                            className="approve"
                            onClick={() => approve(item)}
                          >
                            Approve
                          </button>
                          <button
                            className="reject"
                            onClick={() => reject(item)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={tab === "request" ? "10" : "9"} className="empty-row">
                  No withdrawal found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {list.length > 0 && totalPages > 1 && (
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

      {selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <h2>Withdrawal Details</h2>
            <p><b>User:</b> {selectedUser.userId?.name || "User"}</p>
            <p><b>Mobile:</b> {selectedUser.userId?.phone || "-"}</p>
            <p><b>Amount:</b> ₹{selectedUser.amount || 0}</p>
            <p><b>Method:</b> {selectedUser.withdrawMethod || selectedUser.method || "-"}</p>
            <p><b>Status:</b> {selectedUser.status}</p>
            <hr />
            <h3>Payment Details</h3>
            <p><b>UPI ID:</b> {getDetailValue(selectedUser.details, ["upi", "upiId", "upi_id", "vpa"])}</p>
            <p><b>Account Holder:</b> {getDetailValue(selectedUser.details, ["accountHolder", "accountHolderName", "holderName", "name"])}</p>
            <p><b>Account Number:</b> {getDetailValue(selectedUser.details, ["accountNumber", "accountNo", "account", "bankAccount"])}</p>
            <p><b>IFSC:</b> {getDetailValue(selectedUser.details, ["ifsc", "ifscCode"])}</p>
            <p><b>Bank Name:</b> {getDetailValue(selectedUser.details, ["bankName", "bank"])}</p>
            <hr />
            <p><b>Approved / Rejected By:</b> {(selectedUser.actionBy || selectedUser.approvedBy)?.name || "-"}</p>
            <p><b>Action Date:</b> {selectedUser.approvedAt ? new Date(selectedUser.approvedAt).toLocaleString() : "-"}</p>
            <p><b>Requested At:</b> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "-"}</p>
            <button onClick={() => setSelectedUser(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawal;
