import React, { useState } from "react";

export default function Support() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState(null);

  const supportNumber = "917414840927";
  const whatsappLink = `https://api.whatsapp.com/send?phone=${supportNumber}&text=Hello%20Support`;

  const submitTicket = async () => {
    if (!title || !message) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create ticket");
      }

      setTicketId(data.ticketId || "TKT" + Date.now());
      setTitle("");
      setMessage("");

      alert("Ticket created successfully");
    } catch (err) {
      alert(err.message || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="section-header" style={{ justifyContent: "space-between" }}>
        <h2>Support HQ</h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#10b981",
            background: "#dcfce7",
            padding: "5px 12px",
            borderRadius: "20px",
            fontWeight: "600",
          }}
        >
          🟢 Online
        </div>
      </div>

      <div className="box-card" style={{ textAlign: "center" }}>
        <h3>Need Help?</h3>
        <p style={{ color: "#4b5563" }}>
          Raise a ticket or contact support instantly
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#25D366",
              color: "white",
              padding: "14px",
              borderRadius: "8px",
              fontWeight: "700",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            WhatsApp Support
          </a>
        </div>
      </div>

      <div className="box-card">
        <h3>Create Support Ticket</h3>

        <input
          type="text"
          placeholder="Issue Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input"
        />

        <textarea
          placeholder="Describe your issue..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="form-input"
          style={{ height: "100px" }}
        />

        <button
          onClick={submitTicket}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: loading ? "#94a3b8" : "#0284c7",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Submitting..." : "Submit Ticket"}
        </button>
      </div>

      {ticketId && (
        <div
          className="box-card"
          style={{
            background: "#ecfeff",
            border: "1px solid #a5f3fc",
          }}
        >
          <h4>Ticket Created 🎫</h4>

          <p>
            Your Ticket ID:<b> {ticketId}</b>
          </p>

          <p style={{ fontSize: "0.9rem", color: "#64748b" }}>
            Our team will respond within 15-30 minutes
          </p>
        </div>
      )}

      <div
        className="box-card"
        style={{
          marginTop: "20px",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        24/7 Support Active • Avg Response: 15 min
      </div>
    </div>
  );
}
