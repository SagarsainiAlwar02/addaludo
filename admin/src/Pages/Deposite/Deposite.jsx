import React, { useEffect, useState } from "react";
import API, { getData, getError, serverBase } from "../../api";
import "./Deposite.css";

const ITEMS_PER_PAGE = 40;

const Deposit = () => {
  const [tab, setTab] = useState("request");
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMobile, setSearchMobile] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDeposits = async () => {
    try {
      setLoading(true);

      const res = await API.get("/admin/deposits?limit=2000");
      const data = getData(res);

      const list = Array.isArray(data)
        ? data
        : data.deposits || [];

      setDeposits(list);
    } catch (err) {
      console.log("Deposit fetch error:", getError(err));
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // Reset to page 1 whenever tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tab, searchMobile]);

  const approveDeposit = async (id) => {
    try {
      await API.patch(`/admin/deposits/${id}/approve`, {
        adminNote: "Approved from admin panel",
      });

      alert("Deposit approved");
      fetchDeposits();
    } catch (err) {
      alert(getError(err));
    }
  };

  const rejectDeposit = async (id) => {
    try {
      await API.patch(`/admin/deposits/${id}/reject`, {
        adminNote: "Rejected from admin panel",
      });

      alert("Deposit rejected");
      fetchDeposits();
    } catch (err) {
      alert(getError(err));
    }
  };

  const requests = deposits.filter(
    (item) => item.status === "pending" && item.type !== "bonus"
  );

  const history = deposits.filter(
    (item) => item.status !== "pending" || item.type === "bonus"
  );

  const currentList = tab === "request" ? requests : history;

  const list = currentList.filter((item) =>
    String(item.userId?.phone || "").includes(searchMobile)
  );

  // ---------- PAGINATION LOGIC ----------
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
  // ---------------------------------------

  return (
    <div className="deposit-container">
      <h1>Deposit</h1>

      <div className="tabs">
        <button
          className={tab === "request" ? "active-tab" : ""}
          onClick={() => setTab("request")}
        >
          Pending Deposit ({requests.length})
        </button>

        <button
          className={tab === "history" ? "active-tab" : ""}
          onClick={() => setTab("history")}
        >
          Deposit History ({history.length})
        </button>
      </div>

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
        <table className="deposit-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Amount</th>
              <th>Type</th>
              <th>UTR</th>
              <th>Screenshot</th>
              <th>Status</th>
              <th>Approved / Rejected By</th>
              <th>Action Date</th>
              {tab === "request" && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={tab === "request" ? "11" : "10"} className="empty-row">
                  Loading deposits...
                </td>
              </tr>
            ) : paginatedList.length > 0 ? (
              paginatedList.map((item) => {
                const user = item.userId || {};
                const admin = item.approvedBy || {};

                const screenshotUrl = item.screenshot
                  ? item.screenshot.startsWith("http")
                    ? item.screenshot
                    : `${serverBase}${item.screenshot}`
                  : "";

                const isBonus = item.type === "bonus";

                return (
                  <tr key={item._id}>
                    <td className="mono">{item._id?.slice(-6)}</td>
                    <td>{user.name || "-"}</td>
                    <td>{user.phone || "-"}</td>
                    <td className="amount-cell">₹{item.amount || 0}</td>
                    <td>
                      <span className={`type-badge ${isBonus ? "bonus" : "deposit"}`}>
                        {isBonus ? "Bonus" : "Deposit"}
                      </span>
                    </td>
                    <td className="mono">{item.utr || "-"}</td>

                    <td>
                      {screenshotUrl ? (
                        <a href={screenshotUrl} target="_blank" rel="noreferrer">
                          <img
                            src={screenshotUrl}
                            alt="proof"
                            className="proof-img"
                            loading="lazy"
                            width="60"
                            height="60"
                          />
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status}
                      </span>
                    </td>

                    <td>
                      {admin.name
                        ? `${admin.name} (${admin.role || "admin"})`
                        : "-"}
                    </td>

                    <td>
                      {item.approvedAt
                        ? new Date(item.approvedAt).toLocaleString()
                        : item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "-"}
                    </td>

                    {tab === "request" && (
                      <td>
                        <div className="action-buttons">
                          <button
                            className="approve"
                            onClick={() => approveDeposit(item._id)}
                          >
                            Approve
                          </button>

                          <button
                            className="reject"
                            onClick={() => rejectDeposit(item._id)}
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
                <td colSpan={tab === "request" ? "11" : "10"} className="empty-row">
                  No deposits found
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
    </div>
  );
};

export default Deposit;
