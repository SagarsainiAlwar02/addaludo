import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminControl.css";

const API_BASE = "http://localhost:5000";

const AdminControl = () => {
  const [tab, setTab] = useState("website");
  const [admins, setAdmins] = useState([]);
  const [agentReport, setAgentReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin"
  });

  const [settings, setSettings] = useState({
    websiteName: "",
    supportNumber: ""
  });

  const getAdminToken = () => localStorage.getItem("adminToken");

  const authHeader = () => ({
    headers: {
      Authorization: `Bearer ${getAdminToken()}`
    }
  });

  const money = (num) => `₹${Number(num || 0).toLocaleString("en-IN")}`;

  // ================= GET ADMINS =================
  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/admin-list`, authHeader());
      setAdmins(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Admin list error:", err);
      setAdmins([]);
    }
  };

  // ================= GET AGENT REPORT =================
  const fetchAgentReport = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/admin/agent-report`, authHeader());
      setAgentReport(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Agent report error:", err);
      setAgentReport([]);
      alert(err.response?.data?.msg || "Agent report load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "data") {
      fetchAdmins();
      fetchAgentReport();
    }
  }, [tab]);

  // ================= CREATE ADMIN =================
  const createAdmin = async () => {
    try {
      if (!form.name || !form.email || !form.password) {
        alert("Name, Email aur Password required hai");
        return;
      }

      await axios.post(`${API_BASE}/api/admin/create-admin`, form, authHeader());

      alert("Admin / Agent Created");

      setForm({
        name: "",
        email: "",
        password: "",
        role: "admin"
      });

      setTab("data");
      fetchAdmins();
      fetchAgentReport();
    } catch (err) {
      alert(err.response?.data?.msg || "Admin create failed");
    }
  };

  // ================= DELETE ADMIN =================
  const deleteAdmin = async (id) => {
    try {
      const ok = window.confirm("Kya tum is admin/agent ko delete karna chahte ho?");
      if (!ok) return;

      await axios.delete(`${API_BASE}/api/admin/delete/${id}`, authHeader());
      fetchAdmins();
      fetchAgentReport();
    } catch (err) {
      alert(err.response?.data?.msg || "Delete Failed");
    }
  };

  // ================= SAVE SETTINGS =================
  const saveSettings = async () => {
    try {
      await axios.post(`${API_BASE}/api/admin/settings`, settings, authHeader());
      alert("Settings Saved");
    } catch (err) {
      alert(err.response?.data?.msg || "Settings save failed");
    }
  };

  return (
    <div className="admin-container">
      <h1>Admin Control</h1>

      <div className="tabs">
        <button onClick={() => setTab("website")}>Website Settings</button>
        <button onClick={() => setTab("add")}>Add Admin/Agent</button>
        <button onClick={() => setTab("data")}>Admin/Agent Data</button>
        <button onClick={() => setTab("permission")}>Permissions</button>
      </div>

      {tab === "website" && (
        <div className="form-box">
          <h3>Website Settings</h3>

          <input
            type="text"
            placeholder="Website Name"
            value={settings.websiteName}
            onChange={(e) =>
              setSettings({ ...settings, websiteName: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Support Number"
            value={settings.supportNumber}
            onChange={(e) =>
              setSettings({ ...settings, supportNumber: e.target.value })
            }
          />

          <button className="btn save" onClick={saveSettings}>
            Save
          </button>
        </div>
      )}

      {tab === "add" && (
        <div className="form-box">
          <h3>Add Admin / Agent</h3>

          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
          </select>

          <button className="btn save" onClick={createAdmin}>
            Create
          </button>
        </div>
      )}

      {tab === "data" && (
        <div>
          <div style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <h3>Admin / Agent Data Report</h3>
            <button className="btn save" onClick={fetchAgentReport}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading report...</p>
          ) : (
            <div style={{ overflowX: "auto", marginBottom: "30px" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email / Phone</th>
                    <th>Role</th>
                    <th>Total Deposit</th>
                    <th>Total Withdraw</th>
                    <th>Today Deposit</th>
                    <th>Today Withdraw</th>
                    <th>Total Bonus</th>
                    <th>Total Penalty</th>
                    <th>Approved Count</th>
                  </tr>
                </thead>

                <tbody>
                  {agentReport.length === 0 ? (
                    <tr>
                      <td colSpan="10">No Agent/Admin Report Found</td>
                    </tr>
                  ) : (
                    agentReport.map((r) => (
                      <tr key={r.adminId || r._id}>
                        <td>{r.adminName || "Unknown Admin"}</td>
                        <td>{r.adminEmail || r.adminPhone || "-"}</td>
                        <td>{r.adminRole || "admin"}</td>
                        <td>{money(r.totalDeposit)}</td>
                        <td>{money(r.totalWithdraw)}</td>
                        <td>{money(r.todayDeposit)}</td>
                        <td>{money(r.todayWithdraw)}</td>
                        <td>{money(r.totalBonus)}</td>
                        <td>{money(r.totalPenalty)}</td>
                        <td>{r.totalApprovedCount || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <h3>Admin / Agent List</h3>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan="4">No Admin Found</td>
                  </tr>
                ) : (
                  admins.map((a) => (
                    <tr key={a._id}>
                      <td>{a.name}</td>
                      <td>{a.email}</td>
                      <td>{a.role}</td>
                      <td>
                        <button
                          className="delete"
                          onClick={() => deleteAdmin(a._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "permission" && (
        <div className="form-box">
          <h3>Set Permissions</h3>

          <label><input type="checkbox" /> Dashboard</label>
          <label><input type="checkbox" /> Users</label>
          <label><input type="checkbox" /> Deposit</label>
          <label><input type="checkbox" /> Withdraw</label>
          <label><input type="checkbox" /> Matches</label>

          <button className="btn save">Save Permissions</button>
        </div>
      )}
    </div>
  );
};

export default AdminControl;