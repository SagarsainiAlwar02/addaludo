import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= FETCH DASHBOARD DATA =================
  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/admin/dashboard");

      setStats([
        { title: "Total Deposit", value: res.data.totalDeposit },
        { title: "Total Withdraw", value: res.data.totalWithdraw },
        { title: "Total Earnings", value: res.data.totalEarnings },
        { title: "Total Commission", value: res.data.totalCommission },
        { title: "Total Referral", value: res.data.totalReferral },
        { title: "Total Bonus", value: res.data.totalBonus },
        { title: "Total Penalty", value: res.data.totalPenalty },
        { title: "Hold Balance", value: res.data.holdBalance },
        { title: "Wallet Balance", value: res.data.walletBalance },
      ]);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="heading">Dashboard</h1>

      {/* LOADING */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="card-grid">
          {stats.map((item, index) => (
            <div className="card" key={index}>
              <h3>{item.title}</h3>

              <p>
                {item.title === "Total Referral"
                  ? item.value
                  : `₹${Number(item.value || 0).toLocaleString()}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;