import React, { useEffect, useState } from "react";
import "./Withdraw.css";
import API from "../../api";

const Withdrawal = () => {
  const [tab, setTab] = useState("request");
  const [selectedUser, setSelectedUser] = useState(null);
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchMobile, setSearchMobile] = useState("");

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

  const approve = async (item) => {
    if (item.type === "penalty") {
      alert("Penalty already deducted. Ye sirf pending history me show hogi.");
      return;
    }

    try {
      await API.patch(`/admin/withdraw/approve/${item._id}`);
      alert("Withdraw approved");
      fetchWithdraws();
    } catch (err) {
      alert(err.response?.data?.msg || "Approve failed");
    }
  };

  const reject = async (item) => {
    if (item.type === "penalty") {
      alert("Penalty already deducted. Isko reject nahi karna.");
      return;
    }

    try {
      await API.patch(`/admin/withdraw/reject/${item._id}`);
      alert("Withdraw rejected");
      fetchWithdraws();
    } catch (err) {
      alert(err.response?.data?.msg || "Reject failed");
    }
  };

  const getDetailValue = (details, keys) => {
    for (const key of keys) {
      if (details?.[key]) return details[key];
    }
    return "-";
  };

  const requests = withdraws.filter((item) => item.status === "pending");
  const history = withdraws.filter((item) => item.status !== "pending");

  const currentList = tab === "request" ? requests : history;

  const list = currentList.filter((item) =>
    String(item.userId?.phone || "").includes(searchMobile)
  );

  if (loading) return <p>Loading...</p>;

  return (
    <div className="withdraw-container">
      <h1>Withdrawal</h1>

      <div className="tabs">
        <button
          className={tab === "request" ? "active-tab" : ""}
          onClick={() => setTab("request")}
        >
          Pending Withdraw ({requests.length})
        </button>

        <button
          className={tab === "history" ? "active-tab" : ""}
          onClick={() => setTab("history")}
        >
          Withdraw History ({history.length})
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
          {list.length > 0 ? (
            list.map((item) => {
              const user = item.userId || {};
              const admin = item.actionBy || item.approvedBy || {};
              const isPenalty = item.type === "penalty";

              return (
                <tr key={item._id}>
                  <td>{item._id?.slice(-6)}</td>
                  <td>{user.name || "User"}</td>
                  <td>{user.phone || "-"}</td>
                  <td>₹{item.amount || 0}</td>
                  <td>{isPenalty ? "Penalty" : item.method || "Withdraw"}</td>
                  <td className={item.status}>{item.status}</td>

                  <td>
                    {admin.name ? `${admin.name} (${admin.role || "admin"})` : "-"}
                  </td>

                  <td>
                    {item.actionAt
                      ? new Date(item.actionAt).toLocaleString()
                      : item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "-"}
                  </td>

                  <td>
                    <button className="view" onClick={() => setSelectedUser(item)}>
                      View
                    </button>
                  </td>

                  {tab === "request" && (
                    <td>
                      {isPenalty ? (
                        <span className="penalty-text">Penalty Pending</span>
                      ) : (
                        <>
                          <button className="approve" onClick={() => approve(item)}>
                            Approve
                          </button>

                          <button className="reject" onClick={() => reject(item)}>
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={tab === "request" ? "10" : "9"}>
                No withdrawal found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <h2>
              {selectedUser.type === "penalty"
                ? "Penalty Details"
                : "Withdrawal Details"}
            </h2>

            <p><b>User:</b> {selectedUser.userId?.name || "User"}</p>
            <p><b>Mobile:</b> {selectedUser.userId?.phone || "-"}</p>
            <p><b>Amount:</b> ₹{selectedUser.amount || 0}</p>
            <p><b>Method:</b> {selectedUser.method || selectedUser.type || "-"}</p>
            <p><b>Status:</b> {selectedUser.status}</p>

            <hr />

            <h3>Payment Details</h3>

            <p>
              <b>UPI ID:</b>{" "}
              {getDetailValue(selectedUser.details, ["upi", "upiId", "upi_id", "vpa"])}
            </p>

            <p>
              <b>Account Holder:</b>{" "}
              {getDetailValue(selectedUser.details, [
                "accountHolder",
                "accountHolderName",
                "holderName",
                "name",
              ])}
            </p>

            <p>
              <b>Account Number:</b>{" "}
              {getDetailValue(selectedUser.details, [
                "accountNumber",
                "accountNo",
                "account",
                "bankAccount",
              ])}
            </p>

            <p>
              <b>IFSC:</b>{" "}
              {getDetailValue(selectedUser.details, ["ifsc", "ifscCode"])}
            </p>

            <p>
              <b>Bank Name:</b>{" "}
              {getDetailValue(selectedUser.details, ["bankName", "bank"])}
            </p>

            <p>
              <b>Reason:</b>{" "}
              {selectedUser.details?.reason ||
                selectedUser.note ||
                selectedUser.reason ||
                "-"}
            </p>

            <hr />

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