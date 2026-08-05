import React, { useEffect, useState } from "react";
import API, { getData, getError } from "../../api";
import "./DummyBattles.css";

export default function DummyBattles() {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", amount: "" });

  const fetchDummyBattles = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/dummy-contests");
      const data = getData(res);
      setBattles(data?.contests || []);
    } catch (err) {
      setBattles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDummyBattles();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) {
      alert("Player name aur amount zaroori hai");
      return;
    }
    try {
      setCreating(true);
      await API.post("/admin/dummy-contests", {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        amount: Number(form.amount),
      });
      setForm({ name: "", mobile: "", amount: "" });
      fetchDummyBattles();
    } catch (err) {
      alert(getError(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (id) => {
    const ok = window.confirm("Ye dummy battle hatani hai?");
    if (!ok) return;
    try {
      await API.delete(`/admin/dummy-contests/${id}`);
      fetchDummyBattles();
    } catch (err) {
      alert(getError(err));
    }
  };

  return (
    <div className="dummy-wrap">
      <h1 className="dummy-title">Dummy battles</h1>
      <p className="dummy-subtitle">
        Users ko open table jaisi dikhti hain. Koi real user join karne ki koshish kare to turant hat jaati hain.
      </p>

      <div className="dummy-card">
        <div className="dummy-card-title">Create dummy battle</div>
        <form className="dummy-form-row" onSubmit={handleCreate}>
          <div className="dummy-field">
            <label className="dummy-label">Player name</label>
            <input
              className="dummy-input"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Rohit_99"
            />
          </div>
          <div className="dummy-field">
            <label className="dummy-label">Amount</label>
            <input
              className="dummy-input"
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="500"
              min="50"
            />
          </div>
          <div className="dummy-field">
            <label className="dummy-label">Mobile (fake)</label>
            <input
              className="dummy-input"
              type="text"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="9812345678"
              maxLength={10}
            />
          </div>
          <button type="submit" disabled={creating} className="dummy-btn">
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      <div className="dummy-count-line">
        Active dummy battles: <b>{battles.length}</b>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : battles.length === 0 ? (
        <div className="dummy-card dummy-empty">Koi dummy battle nahi hai abhi</div>
      ) : (
        <table className="dummy-table">
          <thead>
            <tr>
              <th className="dummy-th">Player</th>
              <th className="dummy-th">Mobile</th>
              <th className="dummy-th">Amount</th>
              <th className="dummy-th">Status</th>
              <th className="dummy-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {battles.map((b) => (
              <tr key={b._id}>
                <td className="dummy-td">{b.dummyName || "-"}</td>
                <td className="dummy-td">{b.dummyMobile || "-"}</td>
                <td className="dummy-td">₹{b.entryFee || b.amount}</td>
                <td className="dummy-td">
                  <span className="dummy-badge">{b.status}</span>
                </td>
                <td className="dummy-td">
                  <button className="dummy-remove-btn" onClick={() => handleRemove(b._id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
