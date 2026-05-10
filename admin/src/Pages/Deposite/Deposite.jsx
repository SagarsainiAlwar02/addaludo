



import React, { useEffect, useState } from "react";
import API from "../../api";
import "./Deposite.css";

const IMAGE_BASE = "https://api.addaludo.com";

const Deposit = () => {
  const [tab, setTab] = useState("request");
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchMobile, setSearchMobile] = useState("");

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/deposits");
      const list = Array.isArray(res.data) ? res.data : res.data.deposits || [];
      setDeposits(list);
    } catch (err) {
      console.log("Deposit fetch error:", err.response?.data || err.message);
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const approveDeposit = async (id) => {
    try {
      await API.patch(`/deposit/admin/approve/${id}`, {
        adminNote: "Approved from admin panel",
      });
      alert("Deposit approved");
      fetchDeposits();
    } catch (err) {
      alert(err.response?.data?.msg || "Approve failed");
    }
  };

  const rejectDeposit = async (id) => {
    try {
      await API.patch(`/deposit/admin/reject/${id}`, {
        adminNote: "Rejected from admin panel",
      });
      alert("Deposit rejected");
      fetchDeposits();
    } catch (err) {
      alert(err.response?.data?.msg || "Reject failed");
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

  if (loading) return <p>Loading...</p>;

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
          {list.length > 0 ? (
            list.map((item) => {
              const user = item.userId || {};
              const admin = item.approvedBy || {};
              const screenshotUrl = item.screenshot
                ? `${IMAGE_BASE}${item.screenshot}`
                : "";

              const isBonus = item.type === "bonus";

              return (
                <tr key={item._id}>
                  <td>{item._id?.slice(-6)}</td>
                  <td>{user.name || "-"}</td>
                  <td>{user.phone || "-"}</td>
                  <td>₹{item.amount || 0}</td>
                  <td>{isBonus ? "Bonus" : "Deposit"}</td>
                  <td>{item.utr || "-"}</td>

                  <td>
                    {screenshotUrl ? (
                      <a href={screenshotUrl} target="_blank" rel="noreferrer">
                        <img src={screenshotUrl} alt="proof" className="proof-img" />
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className={item.status}>{item.status}</td>

                  <td>
                    {admin.name ? `${admin.name} (${admin.role || "admin"})` : "-"}
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
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={tab === "request" ? "11" : "10"}>
                No deposits found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Deposit;