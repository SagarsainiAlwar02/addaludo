import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API, { getData, getError } from "../../api";
import { PERMISSIONS, isAdmin } from "../../permissions";
import "./AdminControl.css";

const AdminControl = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "website";
  const [admins, setAdmins] = useState([]);
  const [agentReport, setAgentReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [reportError, setReportError] = useState("");
  const [isAdminUser] = useState(() => isAdmin());

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "agent",
    permissions: [],
  });

  const [editTarget, setEditTarget] = useState(null); // admin being edited
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "agent",
    permissions: [],
  });

  const [settings, setSettings] = useState({
    websiteName: "",
    supportNumber: "",
  });

  const money = (num) => `₹${Number(num || 0).toLocaleString("en-IN")}`;

  // Handle both wrapped ({ admins }) and bare-array responses defensively
  const pickList = (data, key) => {
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.[key]) ? data[key] : [];
  };

  // ================= GET ADMINS =================
  const fetchAdmins = async () => {
    try {
      const res = await API.get("/admin/admin-list");
      const data = getData(res);
      setAdmins(pickList(data, "admins"));
      setAdminError("");
    } catch (err) {
      console.log("Admin list error:", getError(err));
      setAdmins([]);
      setAdminError(getError(err));
    }
  };

  // ================= GET AGENT REPORT =================
  const fetchAgentReport = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/agent-report");
      const data = getData(res);
      setAgentReport(pickList(data, "agentReport"));
      setReportError("");
    } catch (err) {
      console.log("Agent report error:", getError(err));
      setAgentReport([]);
      setReportError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  // ================= GET WEBSITE SETTINGS =================
  const fetchSettings = async () => {
    try {
      const res = await API.get("/admin/settings");
      const data = getData(res);
      setSettings({
        websiteName: data?.websiteName || "",
        supportNumber: data?.supportNumber || ""
      });
    } catch (err) {
      console.log("Settings fetch error:", getError(err));
    }
  };

  useEffect(() => {
    if (tab === "website") {
      fetchSettings();
    }
    if (tab === "data") {
      fetchAdmins();
      fetchAgentReport();
    }
  }, [tab]);

  // ================= PERMISSION TOGGLES =================
  const togglePerm = (key, setter, current) => {
    setter(
      current.includes(key)
        ? current.filter((p) => p !== key)
        : [...current, key]
    );
  };

  // ================= CREATE ADMIN =================
  const createAdmin = async () => {
    try {
      if (!form.name || !form.email || !form.password) {
        alert("Name, Email aur Password required hai");
        return;
      }

      await API.post("/admin/create-admin", form);

      alert("Admin / Agent Created");

      setForm({
        name: "",
        email: "",
        password: "",
        role: "agent",
        permissions: [],
      });

      setSearchParams({ tab: "data" });
      fetchAdmins();
      fetchAgentReport();
    } catch (err) {
      alert(getError(err));
    }
  };

  // ================= DELETE ADMIN =================
  const deleteAdmin = async (id) => {
    if (!id) {
      alert("Admin/Agent record not found - refresh karke dobara try karo");
      return;
    }

    try {
      const ok = window.confirm("Kya tum is admin/agent ko delete karna chahte ho?");
      if (!ok) return;

      await API.delete(`/admin/delete/${id}`);
      alert("Admin / Agent Deleted");
      fetchAdmins();
      fetchAgentReport();
    } catch (err) {
      alert(getError(err));
    }
  };

  // ================= EDIT ADMIN =================
  const openEdit = (admin) => {
    // Admins store no permissions but implicitly have FULL access,
    // so pre-tick every permission to reflect what the account can access.
    const isAdminRecord = admin.role === "admin";
    const currentPerms = isAdminRecord
      ? PERMISSIONS.map((p) => p.key)
      : Array.isArray(admin.permissions)
      ? admin.permissions
      : [];

    setEditTarget(admin);
    setEditForm({
      name: admin.name || "",
      email: admin.email || "",
      password: "",
      role: admin.role || "agent",
      permissions: currentPerms,
    });
  };

  // Report rows come from the aggregate endpoint (no permissions field),
  // so resolve the full admin record from the loaded admin list by id.
  const openEditFromReport = (row) => {
    const full = admins.find((a) => String(a._id) === String(row.adminId));
    if (full) {
      openEdit(full);
      return;
    }
    alert("Admin/Agent record not found - refresh karke dobara try karo");
  };

  const saveEdit = async () => {
    try {
      if (!editForm.name || !editForm.email) {
        alert("Name aur Email required hai");
        return;
      }

      await API.patch(`/admin/update/${editTarget._id}`, editForm);

      alert("Admin / Agent Updated");

      setEditTarget(null);
      fetchAdmins();
      fetchAgentReport();
    } catch (err) {
      alert(getError(err));
    }
  };

  // ================= SAVE SETTINGS =================
  const saveSettings = async () => {
    try {
      await API.post("/admin/settings", settings);
      alert("Settings Saved");
    } catch (err) {
      alert(getError(err));
    }
  };

  // Agents (even with admin_control) can only ever see Website Settings
  const effectiveTab = isAdminUser ? tab : "website";

  return (
    <div className="admin-container">
      <h1>Admin Control</h1>

      {effectiveTab === "website" && (
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

      {effectiveTab === "add" && (
        <div className="add-admin-grid">
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
              onChange={(e) => {
                const role = e.target.value;
                setForm({
                  ...form,
                  role,
                  permissions: role === "admin" ? [] : form.permissions,
                });
              }}
            >
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
            </select>

            <button className="btn save" onClick={createAdmin}>
              Create
            </button>
          </div>

          <div className="perm-box">
            <h3>
              Permissions
              {form.role === "agent" ? (
                <span className="perm-hint"> (Agent ke liye)</span>
              ) : (
                <span className="perm-hint perm-hint-admin">
                  {" "}
                  (Admin ko sab access hai)
                </span>
              )}
            </h3>

            <div className="perm-grid">
              {PERMISSIONS.map((p) => {
                const checked = form.permissions.includes(p.key);
                return (
                  <label
                    key={p.key}
                    className={`perm-chip ${checked ? "checked" : ""} ${
                      form.role === "admin" ? "disabled" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={form.role === "admin"}
                      onChange={() =>
                        togglePerm(p.key, (next) =>
                          setForm({ ...form, permissions: next }),
                          form.permissions
                        )
                      }
                    />
                    <span className="perm-chip-label">{p.label}</span>
                  </label>
                );
              })}
            </div>

            {form.role === "admin" && (
              <p className="perm-note">
                Admin ko saari sections ka access automatically milta hai.
                Permissions sirf Agent ke liye select karein.
              </p>
            )}
          </div>
        </div>
      )}

      {effectiveTab === "data" && (
        <div>
          <div style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <h3>Admin / Agent Data Report</h3>
            <button className="btn save" onClick={fetchAgentReport}>
              Refresh
            </button>
          </div>

          {(adminError || reportError) && (
            <div style={{ marginBottom: "15px", padding: "12px", borderRadius: "8px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", fontSize: "13.5px" }}>
              {adminError && <div>⚠️ Admin list error: {adminError}</div>}
              {reportError && <div>⚠️ Agent report error: {reportError}</div>}
            </div>
          )}

          {loading ? (
            <p>Loading report...</p>
          ) : (
            <div className="admin-table-wrap" style={{ marginBottom: "30px" }}>
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
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {agentReport.length === 0 ? (
                    <tr>
                      <td colSpan="11">No Agent/Admin Report Found</td>
                    </tr>
                  ) : (
                    agentReport.map((r) => (
                      <tr key={r.adminId || r._id}>
                        <td data-label="Name">{r.adminName || "Unknown Admin"}</td>
                        <td data-label="Email / Phone">{r.adminEmail || r.adminPhone || "-"}</td>
                        <td data-label="Role">{r.adminRole || "admin"}</td>
                        <td data-label="Total Deposit">{money(r.totalDeposit)}</td>
                        <td data-label="Total Withdraw">{money(r.totalWithdraw)}</td>
                        <td data-label="Today Deposit">{money(r.todayDeposit)}</td>
                        <td data-label="Today Withdraw">{money(r.todayWithdraw)}</td>
                        <td data-label="Total Bonus">{money(r.totalBonus)}</td>
                        <td data-label="Total Penalty">{money(r.totalPenalty)}</td>
                        <td data-label="Approved Count">{r.totalApprovedCount || 0}</td>
                        <td data-label="Action">
                          <div className="admin-actions">
                            <button
                              className="edit"
                              onClick={() => openEditFromReport(r)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete"
                              onClick={() => deleteAdmin(r.adminId)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <h3>Admin / Agent List</h3>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan="5">No Admin Found</td>
                  </tr>
                ) : (
                  admins.map((a) => (
                    <tr key={a._id}>
                      <td data-label="Name">{a.name}</td>
                      <td data-label="Email">{a.email}</td>
                      <td data-label="Role">{a.role}</td>
                      <td data-label="Permissions">
                        {a.role === "admin"
                          ? "All"
                          : Array.isArray(a.permissions) && a.permissions.length > 0
                          ? a.permissions
                              .map((p) => {
                                const def = PERMISSIONS.find((x) => x.key === p);
                                return def ? def.label : p;
                              })
                              .join(", ")
                          : "None"}
                      </td>
                      <td data-label="Action">
                        <div className="admin-actions">
                          <button
                            className="edit"
                            onClick={() => openEdit(a)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete"
                            onClick={() => deleteAdmin(a._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editTarget && (
        <div className="edit-modal-overlay" onClick={() => setEditTarget(null)}>
          <div
            className="edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-modal-head">
              <h3>Edit {editTarget.name}</h3>
              <button
                className="edit-modal-close"
                onClick={() => setEditTarget(null)}
              >
                ×
              </button>
            </div>

            <div className="edit-modal-body">
              <div className="form-box">
                <input
                  type="text"
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />

                <input
                  type="password"
                  placeholder="Password (blank = no change)"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                />

                <select
                  value={editForm.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    // Keep the current ticked permissions when switching roles,
                    // so converting Admin -> Agent retains the full-access set
                    // (admin can then untick what they want to revoke).
                    setEditForm({
                      ...editForm,
                      role,
                      permissions:
                        role === "admin"
                          ? PERMISSIONS.map((p) => p.key)
                          : editForm.permissions,
                    });
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              <div className="perm-box">
                <h3>
                  Permissions
                  {editForm.role === "agent" ? (
                    <span className="perm-hint"> (Current permissions)</span>
                  ) : (
                    <span className="perm-hint perm-hint-admin">
                      {" "}
                      (Admin = full access)
                    </span>
                  )}
                </h3>

                <div className="perm-grid">
                  {PERMISSIONS.map((p) => {
                    const checked = editForm.permissions.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className={`perm-chip ${checked ? "checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            togglePerm(
                              p.key,
                              (next) =>
                                setEditForm({ ...editForm, permissions: next }),
                              editForm.permissions
                            )
                          }
                        />
                        <span className="perm-chip-label">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="perm-note">
                  {editForm.role === "admin"
                    ? "Is account ko Agent banane ke liye role dropdown se 'Agent' chuno - phir jo permissions deni ho unhe tick rakhkho aur baaki untick karo."
                    : "Ye account ki current permissions hain. Role 'Admin' karne par account ko full access mil jayega."}
                </p>
              </div>
            </div>

            <button className="btn save" onClick={saveEdit}>
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControl;
