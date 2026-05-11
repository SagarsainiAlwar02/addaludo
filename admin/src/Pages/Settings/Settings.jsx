import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Settings.css";

const API_BASE = "https://api.addaludo.com/api";

const Settings = () => {
  const [tab, setTab] = useState("bonus");
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const [bonusData, setBonusData] = useState({
    name: "",
    mobile: "",
    amount: "",
    reason: "",
  });

  const [penaltyData, setPenaltyData] = useState({
    name: "",
    mobile: "",
    amount: "",
    reason: "",
  });

  const [bonusReport, setBonusReport] = useState([]);
  const [penaltyReport, setPenaltyReport] = useState([]);

  const adminToken = localStorage.getItem("adminToken");

  const headers = {
    Authorization: "Bearer " + adminToken,
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN");
  };

  const fetchReports = async () => {
    try {
      setReportLoading(true);

      const res = await axios.get(`${API_BASE}/admin/settings-report`, {
        headers,
      });

      setBonusReport(Array.isArray(res.data?.bonus) ? res.data.bonus : []);
      setPenaltyReport(Array.isArray(res.data?.penalty) ? res.data.penalty : []);
    } catch (err) {
      console.log("Report Error:", err.response?.data || err.message);
      alert(err.response?.data?.msg || "Report fetch failed");
    } finally {
      setReportLoading(false);
    }
  };

  const validateForm = (data) => {
    const mobile = String(data.mobile || "").replace(/\D/g, "");

    if (!mobile || mobile.length !== 10) {
      alert("Valid 10 digit mobile number required");
      return false;
    }

    if (!data.amount || Number(data.amount) <= 0) {
      alert("Valid amount required");
      return false;
    }

    return true;
  };

  const addBonus = async () => {
    if (!validateForm(bonusData)) return;

    try {
      setLoading(true);

      const payload = {
        ...bonusData,
        mobile: String(bonusData.mobile).replace(/\D/g, "").slice(-10),
        amount: Number(bonusData.amount),
      };

      const res = await axios.post(`${API_BASE}/admin/add-bonus`, payload, {
        headers,
      });

      alert(res.data?.msg || "Bonus added successfully");

      setBonusData({
        name: "",
        mobile: "",
        amount: "",
        reason: "",
      });

      await fetchReports();
      setTab("bonusReport");
    } catch (err) {
      console.log("Bonus Error:", err.response?.data || err.message);
      alert(err.response?.data?.msg || "Error adding bonus");
    } finally {
      setLoading(false);
    }
  };

  const addPenalty = async () => {
    if (!validateForm(penaltyData)) return;

    try {
      setLoading(true);

      const payload = {
        ...penaltyData,
        mobile: String(penaltyData.mobile).replace(/\D/g, "").slice(-10),
        amount: Number(penaltyData.amount),
      };

      const res = await axios.post(`${API_BASE}/admin/add-penalty`, payload, {
        headers,
      });

      alert(res.data?.msg || "Penalty deducted successfully");

      setPenaltyData({
        name: "",
        mobile: "",
        amount: "",
        reason: "",
      });

      await fetchReports();
      setTab("penaltyReport");
    } catch (err) {
      console.log("Penalty Error:", err.response?.data || err.message);
      alert(err.response?.data?.msg || "Error adding penalty");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>

      <div className="tabs">
        <button
          onClick={() => setTab("bonus")}
          className={tab === "bonus" ? "active-tab" : ""}
        >
          Bonus
        </button>

        <button
          onClick={() => setTab("penalty")}
          className={tab === "penalty" ? "active-tab" : ""}
        >
          Penalty
        </button>

        <button
          onClick={() => {
            setTab("bonusReport");
            fetchReports();
          }}
          className={tab === "bonusReport" ? "active-tab" : ""}
        >
          Bonus Report
        </button>

        <button
          onClick={() => {
            setTab("penaltyReport");
            fetchReports();
          }}
          className={tab === "penaltyReport" ? "active-tab" : ""}
        >
          Penalty Report
        </button>
      </div>

      {tab === "bonus" && (
        <div className="form-box">
          <h3>Add Bonus</h3>

          <input
            type="text"
            placeholder="User Name Optional"
            value={bonusData.name}
            onChange={(e) =>
              setBonusData({ ...bonusData, name: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Mobile Number"
            maxLength="10"
            value={bonusData.mobile}
            onChange={(e) =>
              setBonusData({
                ...bonusData,
                mobile: e.target.value.replace(/\D/g, ""),
              })
            }
          />

          <input
            type="number"
            placeholder="Amount"
            value={bonusData.amount}
            onChange={(e) =>
              setBonusData({ ...bonusData, amount: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Reason"
            value={bonusData.reason}
            onChange={(e) =>
              setBonusData({ ...bonusData, reason: e.target.value })
            }
          />

          <button className="btn bonus-btn" onClick={addBonus} disabled={loading}>
            {loading ? "Please wait..." : "Add Bonus"}
          </button>
        </div>
      )}

      {tab === "penalty" && (
        <div className="form-box">
          <h3>Add Penalty</h3>

          <input
            type="text"
            placeholder="User Name Optional"
            value={penaltyData.name}
            onChange={(e) =>
              setPenaltyData({ ...penaltyData, name: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Mobile Number"
            maxLength="10"
            value={penaltyData.mobile}
            onChange={(e) =>
              setPenaltyData({
                ...penaltyData,
                mobile: e.target.value.replace(/\D/g, ""),
              })
            }
          />

          <input
            type="number"
            placeholder="Amount"
            value={penaltyData.amount}
            onChange={(e) =>
              setPenaltyData({ ...penaltyData, amount: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Reason"
            value={penaltyData.reason}
            onChange={(e) =>
              setPenaltyData({ ...penaltyData, reason: e.target.value })
            }
          />

          <button
            className="btn penalty-btn"
            onClick={addPenalty}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Add Penalty"}
          </button>
        </div>
      )}

      {tab === "bonusReport" && (
        <div className="report-box">
          <h3 className="report-title">Bonus Report</h3>

          {reportLoading ? (
            <p className="empty-text">Loading...</p>
          ) : (
            <div className="table-scroll">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Mobile</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Balance After</th>
                    <th>Admin</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {bonusReport.length === 0 ? (
                    <tr>
                      <td data-label="Info" colSpan="7">
                        No bonus report found
                      </td>
                    </tr>
                  ) : (
                    bonusReport.map((item) => (
                      <tr key={item._id}>
                        <td data-label="User">{item.name || "-"}</td>
                        <td data-label="Mobile">{item.mobile || "-"}</td>
                        <td data-label="Amount">₹{item.amount || 0}</td>
                        <td data-label="Reason">{item.reason || "-"}</td>
                        <td data-label="Balance After">
                          ₹{item.balanceAfter || 0}
                        </td>
                        <td data-label="Admin">{item.adminName || "-"}</td>
                        <td data-label="Date">{formatDate(item.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "penaltyReport" && (
        <div className="report-box">
          <h3 className="report-title">Penalty Report</h3>

          {reportLoading ? (
            <p className="empty-text">Loading...</p>
          ) : (
            <div className="table-scroll">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Mobile</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Balance After</th>
                    <th>Admin</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {penaltyReport.length === 0 ? (
                    <tr>
                      <td data-label="Info" colSpan="7">
                        No penalty report found
                      </td>
                    </tr>
                  ) : (
                    penaltyReport.map((item) => (
                      <tr key={item._id}>
                        <td data-label="User">{item.name || "-"}</td>
                        <td data-label="Mobile">{item.mobile || "-"}</td>
                        <td data-label="Amount">₹{item.amount || 0}</td>
                        <td data-label="Reason">{item.reason || "-"}</td>
                        <td data-label="Balance After">
                          ₹{item.balanceAfter || 0}
                        </td>
                        <td data-label="Admin">{item.adminName || "-"}</td>
                        <td data-label="Date">{formatDate(item.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;