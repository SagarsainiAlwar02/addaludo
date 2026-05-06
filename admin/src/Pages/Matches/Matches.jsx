import React, { useEffect, useState } from "react";
import API from "../../api";
import "./Matches.css";

const Matches = () => {
  const [tab, setTab] = useState("running");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await API.get("/matches");
      setMatches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Matches error:", err.response?.data || err.message);
      alert(err.response?.data?.msg || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();

    const interval = setInterval(() => {
      fetchMatches();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredMatches =
    tab === "total"
      ? matches
      : matches.filter((m) => m.status === tab);

  return (
    <div className="matches-container">
      <h1>Matches</h1>

      <div className="tabs">
        <button className={tab === "running" ? "active-tab" : ""} onClick={() => setTab("running")}>
          Running Match
        </button>

        <button className={tab === "pending" ? "active-tab" : ""} onClick={() => setTab("pending")}>
          Pending Match
        </button>

        <button className={tab === "completed" ? "active-tab" : ""} onClick={() => setTab("completed")}>
          Completed Match
        </button>

        <button className={tab === "cancelled" ? "active-tab" : ""} onClick={() => setTab("cancelled")}>
          Cancel Match
        </button>

        <button className={tab === "total" ? "active-tab" : ""} onClick={() => setTab("total")}>
          Total Match
        </button>
      </div>

      {loading && <p>Loading matches...</p>}

      <table className="match-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Room</th>
            <th>Player 1</th>
            <th>Player 2</th>
            <th>Amount</th>
            <th>Winner</th>
            <th>Status</th>
            <th>View</th>
          </tr>
        </thead>

        <tbody>
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match) => (
              <tr key={match._id}>
                <td>{match._id?.slice(-6)}</td>
                <td>{match.roomId}</td>

                <td>{match.players?.[0]?.username || "N/A"}</td>
                <td>{match.players?.[1]?.username || "Waiting"}</td>

                <td>₹{match.entryFee || match.players?.[0]?.amount || 0}</td>
                <td>{match.winner?.username || "-"}</td>

                <td className={match.status}>{match.status}</td>

                <td>
                  <button className="view" onClick={() => setSelectedMatch(match)}>
                    View
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No matches found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedMatch && (
        <div className="modal">
          <div className="modal-content">
            <h2>Match Details</h2>

            <p><b>Room ID:</b> {selectedMatch.roomId}</p>
            <p><b>Status:</b> {selectedMatch.status}</p>
            <p><b>Entry Fee:</b> ₹{selectedMatch.entryFee}</p>
            <p><b>Prize Pool:</b> ₹{selectedMatch.prizePool || 0}</p>
            <p><b>Win Amount:</b> ₹{selectedMatch.winAmount || 0}</p>
            <p><b>Commission:</b> ₹{selectedMatch.commission || 0}</p>
            <p><b>Winner:</b> {selectedMatch.winner?.username || "-"}</p>

            {selectedMatch.cancelledReason && (
              <p><b>Cancel Reason:</b> {selectedMatch.cancelledReason}</p>
            )}

            <p>
              <b>Started:</b>{" "}
              {selectedMatch.startedAt
                ? new Date(selectedMatch.startedAt).toLocaleString()
                : "-"}
            </p>

            <p>
              <b>Completed:</b>{" "}
              {selectedMatch.completedAt
                ? new Date(selectedMatch.completedAt).toLocaleString()
                : "-"}
            </p>

            <h3>Players</h3>

            {selectedMatch.players?.map((p, i) => (
              <p key={i}>
                {i + 1}. {p.username || "Player"} - ₹{p.amount || 0} - {p.color || "-"}
              </p>
            ))}

            <button onClick={() => setSelectedMatch(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;