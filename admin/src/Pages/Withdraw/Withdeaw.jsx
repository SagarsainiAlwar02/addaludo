import React, { useState, useEffect } from "react";
import "./Withdraw.css";
import API from "../../api";

const Withdrawal = () => {
  const [tab, setTab] = useState("request");
  const [selectedUser, setSelectedUser] = useState(null);
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdraws = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/withdraws");
      setWithdraws(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Withdraw fetch error:", err.response?.data || err.message);
      setWithdraws([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  const approve = async (id) => {
    try {
      await API.patch(`/admin/withdraw/approve/${id}`);
      alert("Withdraw approved");
      fetchWithdraws();
    } catch (err) {
      alert(err.response?.data?.msg || "Approve failed");
    }
  };

  const reject = async (id) => {
    try {
      await API.patch(`/admin/withdraw/reject/${id}`);
      alert("Withdraw rejected");
      fetchWithdraws();
    } catch (err) {
      alert(err.response?.data?.msg || "Reject failed");
    }
  };

  const requests = withdraws.filter((item) => item.status === "pending");
  const history = withdraws.filter((item) => item.status !== "pending");
  const list = tab === "request" ? requests : history;

  if (loading) return <p>Loading...</p>;

  return (
    <div className="withdraw-container">
      <h1>Withdrawal</h1>

      <div className="tabs">
        <button
          className={tab === "request" ? "active-tab" : ""}
          onClick={() => setTab("request")}
        >
          Pending Withdraw
        </button>

        <button
          className={tab === "history" ? "active-tab" : ""}
          onClick={() => setTab("history")}
        >
          Withdraw History
        </button>
      </div>

      <table className="withdraw-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Mobile</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Approved / Rejected By</th>
            <th>Action Date</th>
            <th>View</th>
            {tab === "request" && <th>Action</th>}
          </tr>
        </thead>

        <tbody>
          {list.length > 0 ? (
            list.map((item) => {
              const user = item.userId || {};
              const admin = item.actionBy || item.approvedBy || {};

              return (
                <tr key={item._id}>
                  <td>{item._id?.slice(-6)}</td>
                  <td>{user.name || "User"}</td>
                  <td>{user.phone || "-"}</td>
                  <td>₹{item.amount}</td>
                  <td className={item.status}>{item.status}</td>

                  <td>
                    {admin.name
                      ? `${admin.name} (${admin.role || "admin"})`
                      : "-"}
                  </td>

                  <td>
                    {item.actionAt
                      ? new Date(item.actionAt).toLocaleString()
                      : "-"}
                  </td>

                  <td>
                    <button className="view" onClick={() => setSelectedUser(item)}>
                      View
                    </button>
                  </td>

                  {tab === "request" && (
                    <td>
                      <button className="approve" onClick={() => approve(item._id)}>
                        Approve
                      </button>

                      <button className="reject" onClick={() => reject(item._id)}>
                        Reject
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={tab === "request" ? "9" : "8"} style={{ textAlign: "center" }}>
                No withdrawal found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <h2>Withdrawal Details</h2>

            <p><b>User:</b> {selectedUser.userId?.name || "User"}</p>
            <p><b>Mobile:</b> {selectedUser.userId?.phone || "-"}</p>
            <p><b>Amount:</b> ₹{selectedUser.amount}</p>
            <p><b>Status:</b> {selectedUser.status}</p>

            <p>
              <b>Approved / Rejected By:</b>{" "}
              {(selectedUser.actionBy || selectedUser.approvedBy)?.name || "-"}
            </p>

            <p>
              <b>Action Date:</b>{" "}
              {selectedUser.actionAt
                ? new Date(selectedUser.actionAt).toLocaleString()
                : "-"}
            </p>

            <p>
              <b>Requested At:</b>{" "}
              {selectedUser.createdAt
                ? new Date(selectedUser.createdAt).toLocaleString()
                : "-"}
            </p>

            <button onClick={() => setSelectedUser(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawal;