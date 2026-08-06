import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API, { getData, getError, serverBase } from "../../api";
import "./Matches.css";

const PAGE_SIZE = 50;

const Matches = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "running";
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMobile, setSearchMobile] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/contests?limit=500");
      const data = getData(res);
      setMatches(data?.contests || []);
    } catch (err) {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusGroup = (status) => {
    status = String(status || "").toLowerCase();
    if (["running", "room_submitted", "result_submitted", "loss_submitted"].includes(status)) return "running";
    if (["join_requested", "cancel_requested"].includes(status)) return "pending";
    if (["approved", "completed"].includes(status)) return "completed";
    if (["cancelled", "rejected"].includes(status)) return "cancelled";
    return "pending";
  };

  const getUserPhone = (user) => user?.phone || user?.mobile || "";
  const getUserName = (user) => user?.name || user?.username || "N/A";

  // ✅ Naye matches pehle (createdAt descending)
const filteredMatches = useMemo(() => {
  const mobile = searchMobile.replace(/\D/g, "");
  const filtered = matches
    .filter((match) => {
      const status = String(match.status || "").toLowerCase();
      // ✅ "open" (waiting/no-opponent) sirf non-total tabs se hide hoga; Total tab mein sab dikhega
      if (tab !== "total" && status === "open") return false;
      const creatorPhone = getUserPhone(match.createdBy);
      const opponentPhone = getUserPhone(match.opponent);
      const mobileOk = !mobile || String(creatorPhone).includes(mobile) || String(opponentPhone).includes(mobile);
      const tabOk = tab === "total" ? true : getStatusGroup(match.status) === tab;
      return mobileOk && tabOk;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // ✅ Newest first
  return filtered;
}, [matches, searchMobile, tab]);

  // ✅ Pagination logic
  const totalPages = Math.ceil(filteredMatches.length / PAGE_SIZE);
  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMatches.slice(start, start + PAGE_SIZE);
  }, [filteredMatches, currentPage]);

  // Tab change hone par page reset
  useEffect(() => {
    setCurrentPage(1);
  }, [tab, searchMobile]);

  const getScreenshotUrl = (path) => {
    if (!path) return "";
    if (String(path).startsWith("http")) return path;
    return `${serverBase}${String(path).startsWith("/") ? path : `/${path}`}`;
  };

  const getUserResult = (match, userId) => {
    if (!userId || !Array.isArray(match.results)) return null;
    return match.results.find((result) => {
      const resultUserId = result.user?._id || result.user;
      return String(resultUserId) === String(userId);
    });
  };

  const openMatchDetails = async (match) => {
    setSelectedMatch(match);
    try {
      setActionLoading(true);
      const id = match?._id || match?.id;
      if (!id) return;
      const res = await API.get(`/admin/contests/${id}`);
      const data = getData(res);
      setSelectedMatch(data?.contest || data || match);
    } catch (err) {
      setSelectedMatch(match);
    } finally {
      setActionLoading(false);
    }
  };

  const decideWinner = async (match, user, label) => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) { alert(`${label} user missing hai`); return; }
      const ok = window.confirm(`${label} ko winner banana hai?`);
      if (!ok) return;
      setActionLoading(true);
      await API.patch(`/admin/contests/${match._id}/approve`, {
        winnerId: userId,
        adminNote: `${label} marked winner by admin`,
      });
      alert(`${label} winner set ho gaya`);
      setSelectedMatch(null);
      fetchMatches();
    } catch (err) {
      alert(getError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const cancelMatch = async (match) => {
    try {
      const ok = window.confirm("Is match ko cancel karke dono players ko refund karna hai?");
      if (!ok) return;
      setActionLoading(true);
      await API.patch(`/admin/contests/${match._id}/reject`, {
        adminNote: "Cancelled by admin from match view",
      });
      alert("Match cancel/refund ho gaya");
      setSelectedMatch(null);
      fetchMatches();
    } catch (err) {
      alert(getError(err));
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => { fetchMatches(); }, []);

  // ✅ Pagination buttons
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);

    return (
      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>First</button>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</button>

        {pages
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
          .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="pagination-dots">...</span>
            ) : (
              <button
                key={p}
                className={currentPage === p ? "active-page" : ""}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            )
          )}

        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</button>
      </div>
    );
  };

  const renderPlayerCard = (match, user, label) => {
    const userId = user?._id || user?.id;
    const result = getUserResult(match, userId);
    const screenshot = result?.screenshot || result?.image || result?.proof || "";
    const canAction = ["pending", "running"].includes(getStatusGroup(match.status));

    return (
      <div className="player-detail-card">
        <h3>{label}</h3>
        <p><b>Name:</b> {user ? getUserName(user) : "Waiting"}</p>
        <p><b>Mobile:</b> {getUserPhone(user) || "-"}</p>
        <p><b>User ID:</b> {userId || "-"}</p>
        <p><b>Room Code:</b> {match.ludoKingRoomCode || "-"}</p>
        <p><b>Result:</b> {result?.result || result?.status || "-"}</p>
        <p><b>Win Screenshot:</b></p>
        {getScreenshotUrl(screenshot) ? (
          <a href={getScreenshotUrl(screenshot)} target="_blank" rel="noreferrer">
            <img src={getScreenshotUrl(screenshot)} alt="match proof" className="proof-img" onError={(e) => { e.target.style.display = "none"; }} />
          </a>
        ) : <p>-</p>}
        {canAction && userId && (
          <div className="player-action-row">
            <button className="win-btn" disabled={actionLoading} onClick={() => decideWinner(match, user, label)}>
              {actionLoading ? "Wait..." : "Win"}
            </button>
            <button className="cancel-btn" disabled={actionLoading} onClick={() => cancelMatch(match)}>
              {actionLoading ? "Wait..." : "Cancel"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="matches-container">
      <h1>Matches</h1>
      <h3>Total Matches: {matches.length}</h3>

      <div className="search-box">
        <input
          type="text"
          value={searchMobile}
          maxLength={10}
          placeholder="Mobile number se match search karo"
          onChange={(e) => setSearchMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
        />
        {searchMobile && <button type="button" onClick={() => setSearchMobile("")}>Clear</button>}
      </div>

      {loading && <p>Loading matches...</p>}

      <div className="pagination-info">
        Showing {paginatedMatches.length} of {filteredMatches.length} matches
        {totalPages > 1 && ` — Page ${currentPage} of ${totalPages}`}
      </div>

      {renderPagination()}

      <div className="matches-scroll">
      <table className="match-table">
        <thead>
          <tr>
            <th>#</th>
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
          {paginatedMatches.length > 0 ? (
            paginatedMatches.map((match, index) => (
              <tr key={match._id}>
                <td data-label="#">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                <td data-label="ID">{match.contestId || match.battleId || match._id?.slice(-6)}</td>
                <td data-label="Room Code">{match.ludoKingRoomCode || "-"}</td>
                <td data-label="Player 1">{getUserName(match.createdBy)}</td>
                <td data-label="Mobile 1">{getUserPhone(match.createdBy) || "-"}</td>
                <td data-label="Player 2">{match.opponent ? getUserName(match.opponent) : "Waiting"}</td>
                <td data-label="Mobile 2">{getUserPhone(match.opponent) || "-"}</td>
                <td data-label="Amount">₹{match.entryFee || match.amount || 0}</td>
                <td data-label="Winner">{match?.winner?.name || match?.winner?.username || "-"}</td>
                <td data-label="Status" className={getStatusGroup(match.status)}>{match.status || "-"}</td>
                <td data-label="View">
                  <button className="view" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openMatchDetails(match); }}>
                    View
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="11" style={{ textAlign: "center" }}>No matches found</td></tr>
          )}
        </tbody>
      </table>
      </div>

      {renderPagination()}

      {selectedMatch && (
        <div className="modal">
          <div className="modal-content match-modal">
            <h2>Match Details</h2>
            <div className="match-basic">
              <p><b>Battle ID:</b> {selectedMatch.contestId || selectedMatch.battleId || selectedMatch._id}</p>
              <p><b>Status:</b> {selectedMatch.status || "-"}</p>
              <p><b>Amount:</b> ₹{selectedMatch.entryFee || selectedMatch.amount || 0}</p>
              <p><b>Prize:</b> ₹{selectedMatch.prize || 0}</p>
              <p><b>Room Code:</b> {selectedMatch.ludoKingRoomCode || "-"}</p>
              <p><b>Winner:</b> {selectedMatch.winner ? getUserName(selectedMatch.winner) : "-"}</p>
              <p><b>Created:</b> {selectedMatch.createdAt ? new Date(selectedMatch.createdAt).toLocaleString() : "-"}</p>
              <p><b>Updated:</b> {selectedMatch.updatedAt ? new Date(selectedMatch.updatedAt).toLocaleString() : "-"}</p>
            </div>
            <div className="player-detail-grid">
              {renderPlayerCard(selectedMatch, selectedMatch.createdBy, "Table Creator")}
              {renderPlayerCard(selectedMatch, selectedMatch.opponent, "Opponent")}
            </div>
            {["pending", "running"].includes(getStatusGroup(selectedMatch.status)) && (
              <button className="modal-cancel-full" type="button" disabled={actionLoading} onClick={() => cancelMatch(selectedMatch)}>
                {actionLoading ? "Please wait..." : "Cancel Full Match / Refund"}
              </button>
            )}
            <button type="button" className="close-btn" onClick={() => setSelectedMatch(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;
