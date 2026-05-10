import React, { useEffect, useMemo, useState } from "react";
import API from "../../api";
import "./Matches.css";

const IMAGE_BASE = "https://api.addaludo.com";

const Matches = () => {
  const [tab, setTab] = useState("running");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMobile, setSearchMobile] = useState("");

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/battles");
      setMatches(Array.isArray(res.data) ? res.data : res.data.battles || []);
    } catch (err) {
      console.log("Matches error:", err.response?.data || err.message);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusGroup = (status) => {
    if (["running", "room_submitted", "result_submitted", "loss_submitted"].includes(status)) return "running";
    if (["open", "join_requested", "cancel_requested"].includes(status)) return "pending";
    if (["approved", "completed"].includes(status)) return "completed";
    if (["cancelled", "rejected"].includes(status)) return "cancelled";
    return status;
  };

  const getUserPhone = (user) => user?.phone || user?.mobile || "";

  const filteredMatches = useMemo(() => {
    const mobile = searchMobile.replace(/\D/g, "");

    return matches.filter((m) => {
      const statusOk = tab === "total" || getStatusGroup(m.status) === tab;

      const creatorPhone = getUserPhone(m.createdBy);
      const opponentPhone = getUserPhone(m.opponent);

      const mobileOk =
        !mobile ||
        String(creatorPhone).includes(mobile) ||
        String(opponentPhone).includes(mobile) ||
        m.players?.some((p) => String(p.phone || p.mobile || "").includes(mobile));

      return statusOk && mobileOk;
    });
  }, [matches, tab, searchMobile]);

  const getScreenshotUrl = (path) => {
    if (!path) return "";
    if (String(path).startsWith("http")) return path;
    return `${IMAGE_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const getUserResult = (match, userId) => {
    if (!userId) return null;
    return match.results?.find((r) => {
      const resultUserId = r.user?._id || r.user;
      return String(resultUserId) === String(userId);
    });
  };

  const renderPlayerCard = (match, user, label) => {
    const userId = user?._id || user?.id;
    const result = getUserResult(match, userId);
    const roomCodeOwner = match.roomCodeSetBy?._id || match.roomCodeSetBy;
    const isRoomCodeOwner = userId && String(roomCodeOwner) === String(userId);

    const screenshot =
      result?.screenshot ||
      (String(match.resultSubmittedBy?._id || match.resultSubmittedBy) === String(userId)
        ? match.screenshot
        : "");

    return (
      <div className="player-detail-card">
        <h3>{label}</h3>

        <p><b>Name:</b> {user?.name || user?.username || "N/A"}</p>
        <p><b>Mobile:</b> {user?.phone || user?.mobile || "-"}</p>
        <p><b>Room Code:</b> {isRoomCodeOwner ? match.ludoKingRoomCode || "-" : "-"}</p>
        <p><b>Result:</b> {result?.result || "-"}</p>

        <p><b>Win Screenshot:</b></p>
        {getScreenshotUrl(screenshot) ? (
          <a href={getScreenshotUrl(screenshot)} target="_blank" rel="noreferrer">
            <img src={getScreenshotUrl(screenshot)} alt="match proof" className="proof-img" />
          </a>
        ) : (
          <p>-</p>
        )}
      </div>
    );
  };

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

      <div className="search-box">
        <input
          type="text"
          value={searchMobile}
          maxLength={10}
          placeholder="Mobile number se match search karo"
          onChange={(e) => setSearchMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
        />

        {searchMobile && <button onClick={() => setSearchMobile("")}>Clear</button>}
      </div>

      {loading && <p>Loading matches...</p>}

      <table className="match-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Room Code</th>
            <th>Player 1</th>
            <th>Mobile 1</th>
            <th>Player 2</th>
            <th>Mobile 2</th>
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
                <td>{match.battleId || match._id?.slice(-6)}</td>
                <td>{match.ludoKingRoomCode || "-"}</td>
                <td>{match.createdBy?.name || "N/A"}</td>
                <td>{match.createdBy?.phone || "-"}</td>
                <td>{match.opponent?.name || "Waiting"}</td>
                <td>{match.opponent?.phone || "-"}</td>
                <td>₹{match.amount || 0}</td>
                <td>{match.winner?.name || "-"}</td>
                <td className={getStatusGroup(match.status)}>{match.status}</td>
                <td>
                  <button className="view" onClick={() => setSelectedMatch(match)}>
                    View
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" style={{ textAlign: "center" }}>
                No matches found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedMatch && (
        <div className="modal">
          <div className="modal-content match-modal">
            <h2>Match Details</h2>

            <div className="match-basic">
              <p><b>Battle ID:</b> {selectedMatch.battleId || selectedMatch._id}</p>
              <p><b>Status:</b> {selectedMatch.status}</p>
              <p><b>Amount:</b> ₹{selectedMatch.amount || 0}</p>
              <p><b>Prize:</b> ₹{selectedMatch.prize || 0}</p>
              <p><b>Room Code:</b> {selectedMatch.ludoKingRoomCode || "-"}</p>
              <p><b>Winner:</b> {selectedMatch.winner?.name || "-"}</p>
              <p><b>Created:</b> {selectedMatch.createdAt ? new Date(selectedMatch.createdAt).toLocaleString() : "-"}</p>
              <p><b>Updated:</b> {selectedMatch.updatedAt ? new Date(selectedMatch.updatedAt).toLocaleString() : "-"}</p>
            </div>

            <div className="player-detail-grid">
              {renderPlayerCard(selectedMatch, selectedMatch.createdBy, "Table Creator")}
              {renderPlayerCard(selectedMatch, selectedMatch.opponent, "Opponent")}
            </div>

            <button onClick={() => setSelectedMatch(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;