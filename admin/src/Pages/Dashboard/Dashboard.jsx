import React, { useEffect, useState } from "react";
import API from "../../api";
import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/dashboard");

      setStats([
        { title: "Total Users", value: res.data.totalUsers || 0, isCount: true },
        { title: "Total Deposit", value: res.data.totalDeposit || 0 },
        { title: "Total Withdraw", value: res.data.totalWithdraw || 0 },
        { title: "Total Earnings", value: res.data.totalEarnings || 0 },
        { title: "Total Commission", value: res.data.totalCommission || 0 },
        { title: "Total Referral", value: res.data.totalReferral || 0 },
        { title: "Total Bonus", value: res.data.totalBonus || 0 },
        { title: "Total Penalty", value: res.data.totalPenalty || 0 },
        { title: "Hold Balance", value: res.data.holdBalance || 0 },
        { title: "Wallet Balance", value: res.data.walletBalance || 0 },
      ]);
    } catch (err) {
      console.log("DASHBOARD ERROR:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="heading">Dashboard</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="card-grid">
          {stats.map((item, index) => (
            <div className="card" key={index}>
              <h3>{item.title}</h3>
              <p>
                {item.isCount ? "" : "₹"}
                {Number(item.value || 0).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;