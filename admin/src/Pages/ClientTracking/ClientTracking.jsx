import React, { useEffect, useState } from "react";
import API, { getData, getError } from "../../api";
import "./ClientTracking.css";

export default function ClientTracking() {
  const [tracked, setTracked] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ phone: "", note: "" });

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/tracked-accounts/report");
      const data = getData(res);
      setAccounts(data?.accounts || []);
      setSummary(data?.summary || null);
      setTracked(data?.trackedList || []);
    } catch (err) {
      console.log("REPORT ERROR:", getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.phone || form.phone.replace(/\D/g, "").length !== 10) {
      alert("Valid 10 digit mobile number daalo");
      return;
    }
    try {
      setAdding(true);
      await API.post("/admin/tracked-accounts", { phone: form.phone, note: form.note });
      setForm({ phone: "", note: "" });
      fetchReport();
    } catch (err) {
      alert(getError(err));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    const ok = window.confirm("Ye number tracking se hatana hai?");
    if (!ok) return;
    try {
      await API.delete(`/admin/tracked-accounts/${id}`);
      fetchReport();
    } catch (err) {
      alert(getError(err));
    }
  };

  const fmt = (v) => "₹" + Number(v || 0).toLocaleString("en-IN");

  return (
    <div className="ct-wrap">
      <h1 className="ct-title">Client Tracking</h1>
      <p className="ct-subtitle">
        Client ke phone numbers add karo — un IDs ke saare matches, win/loss aur net hisaab yahan dikhega.
      </p>

      <div className="ct-card">
        <div className="ct-card-title">Add number to track</div>
        <form className="ct-form-row" onSubmit={handleAdd}>
          <div className="ct-field">
            <label className="ct-label">Mobile number</label>
            <input
              className="ct-input"
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="9812345678"
              maxLength={10}
            />
          </div>
          <div className="ct-field" style={{ flex: 1 }}>
            <label className="ct-label">Note (optional)</label>
            <input
              className="ct-input"
              type="text"
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="e.g. Client ID 2"
            />
          </div>
          <button type="submit" disabled={adding} className="ct-btn">
            {adding ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      {tracked.length > 0 && (
        <div className="ct-tracked-list">
          {tracked.map((t) => (
            <span key={t._id} className="ct-tracked-chip">
              {t.phone} {t.note ? `— ${t.note}` : ""}
              <button className="ct-chip-remove" onClick={() => handleRemove(t._id)}>×</button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <p>Loading report...</p>
      ) : tracked.length === 0 ? (
        <div className="ct-card ct-empty">Koi number track nahi ho raha abhi — upar se add karo</div>
      ) : (
        <>
          {summary && (
            <div className="ct-summary-grid">
              <div className="ct-summary-box">
                <span className="ct-summary-label">Matches Played</span>
                <span className="ct-summary-value">{summary.matchesPlayed}</span>
              </div>
              <div className="ct-summary-box">
                <span className="ct-summary-label">Total Wins</span>
                <span className="ct-summary-value ct-green">{summary.wins}</span>
              </div>
              <div className="ct-summary-box">
                <span className="ct-summary-label">Total Losses</span>
                <span className="ct-summary-value ct-red">{summary.losses}</span>
              </div>
              <div className="ct-summary-box">
                <span className="ct-summary-label">Total Entry Paid</span>
                <span className="ct-summary-value">{fmt(summary.totalEntry)}</span>
              </div>
              <div className="ct-summary-box">
                <span className="ct-summary-label">Total Winnings</span>
                <span className="ct-summary-value">{fmt(summary.totalWinnings)}</span>
              </div>
              <div className="ct-summary-box">
                <span className="ct-summary-label">Net Profit / Loss</span>
                <span className={`ct-summary-value ${summary.net >= 0 ? "ct-green" : "ct-red"}`}>
                  {summary.net >= 0 ? "+" : ""}{fmt(summary.net)}
                </span>
              </div>
            </div>
          )}

          <table className="ct-table">
            <thead>
              <tr>
                <th className="ct-th">Name</th>
                <th className="ct-th">Mobile</th>
                <th className="ct-th">Matches</th>
                <th className="ct-th">Wins</th>
                <th className="ct-th">Losses</th>
                <th className="ct-th">Entry Paid</th>
                <th className="ct-th">Winnings</th>
                <th className="ct-th">Net</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.userId}>
                  <td className="ct-td">{a.name || "-"}</td>
                  <td className="ct-td">{a.phone}</td>
                  <td className="ct-td">{a.matchesPlayed}</td>
                  <td className="ct-td ct-green">{a.wins}</td>
                  <td className="ct-td ct-red">{a.losses}</td>
                  <td className="ct-td">{fmt(a.totalEntry)}</td>
                  <td className="ct-td">{fmt(a.totalWinnings)}</td>
                  <td className={`ct-td ${a.net >= 0 ? "ct-green" : "ct-red"}`}>
                    {a.net >= 0 ? "+" : ""}{fmt(a.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
