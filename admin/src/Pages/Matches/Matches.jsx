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
  const [actionLoading, setActionLoading] = useState(false);


const fetchMatches = async () => {
  try {
    setLoading(true);

    const res = await API.get("/admin/battles?limit=200");

    console.log("MATCH API RESPONSE", res.data);

    setMatches(
      Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.battles)
        ? res.data.battles
        : []
    );
  } catch (err) {
    console.log("Matches error:", err.response?.data || err.message);
    setMatches([]);
  } finally {
    setLoading(false);
  }
};

  const getStatusGroup = (status) => {
    if (
      ["running", "room_submitted", "result_submitted", "loss_submitted"].includes(
        status
      )
    ) {
      return "running";
    }

    if (["open", "join_requested", "cancel_requested"].includes(status)) {
      return "pending";
    }

    if (["approved", "completed"].includes(status)) {
      return "completed";
    }

    if (["cancelled", "rejected"].includes(status)) {
      return "cancelled";
    }

    return status || "pending";
  };

  const getUserPhone = (user) => {
    return user?.phone || user?.mobile || "";
  };

  const getUserName = (user) => {
    return user?.name || user?.username || "N/A";
  };

  const filteredMatches = useMemo(() => {
    const mobile = searchMobile.replace(/\D/g, "");

    return matches.filter((match) => {
      const statusOk = tab === "total" || getStatusGroup(match.status) === tab;

      const creatorPhone = getUserPhone(match.createdBy);
      const opponentPhone = getUserPhone(match.opponent);

      const mobileOk =
        !mobile ||
        String(creatorPhone).includes(mobile) ||
        String(opponentPhone).includes(mobile);

      return statusOk && mobileOk;
    });
  }, [matches, tab, searchMobile]);

  const getScreenshotUrl = (path) => {
    if (!path) return "";
    if (String(path).startsWith("http")) return path;

    return `${IMAGE_BASE}${String(path).startsWith("/") ? path : `/${path}`}`;
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
    const id = match?._id || match?.id;

    if (!id) return;

    const res = await API.get(`/admin/battles/${id}`);

    setSelectedMatch(
      res.data?.battle ||
      res.data?.match ||
      res.data ||
      match
    );
  } catch (err) {
    console.log("Match detail error:", err.response?.data || err.message);
    setSelectedMatch(match);
  }
};

  const decideWinner = async (match, user, label) => {
    try {
      const userId = user?._id || user?.id;

      if (!userId) {
        alert(`${label} user missing hai`);
        return;
      }

      const ok = window.confirm(`${label} ko winner banana hai?`);
      if (!ok) return;

      setActionLoading(true);

      await API.patch(`/admin/battles/approve/${match._id}`, {
        winnerId: userId,
        adminNote: `${label} marked winner by admin`,
      });

      alert(`${label} winner set ho gaya`);

      setSelectedMatch(null);
      fetchMatches();
    } catch (err) {
      console.log("Winner set error:", err.response?.data || err.message);
      alert(err.response?.data?.msg || "Winner set failed");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelMatch = async (match) => {
    try {
      const ok = window.confirm(
        "Is match ko cancel karke dono players ko refund karna hai?"
      );
      if (!ok) return;

      setActionLoading(true);

      await API.patch(`/admin/battles/reject/${match._id}`, {
        adminNote: "Cancelled by admin from match view",
      });

      alert("Match cancel/refund ho gaya");

      setSelectedMatch(null);
      fetchMatches();
    } catch (err) {
      console.log("Cancel match error:", err.response?.data || err.message);
      alert(err.response?.data?.msg || "Cancel failed");
    } finally {
      setActionLoading(false);
    }
  };

  const renderPlayerCard = (match, user, label) => {
    const userId = user?._id || user?.id;
    const result = getUserResult(match, userId);

    const roomCodeOwner = match.roomCodeSetBy?._id || match.roomCodeSetBy;
    const isRoomCodeOwner =
      userId && roomCodeOwner && String(roomCodeOwner) === String(userId);

    const resultSubmittedBy =
      match.resultSubmittedBy?._id || match.resultSubmittedBy;

    const screenshot =
      result?.screenshot ||
      result?.image ||
      result?.proof ||
      (resultSubmittedBy &&
      userId &&
      String(resultSubmittedBy) === String(userId)
        ? match.screenshot || match.proof || ""
        : "");

    const canAction = ["pending", "running"].includes(
      getStatusGroup(match.status)
    );

    return (
      <div className="player-detail-card">
        <h3>{label}</h3>

        <p>
          <b>Name:</b> {user ? getUserName(user) : "Waiting"}
        </p>

        <p>
          <b>Mobile:</b> {getUserPhone(user) || "-"}
        </p>

        <p>
          <b>User ID:</b> {userId || "-"}
        </p>

        <p>
          <b>Room Code:</b>{" "}
          {isRoomCodeOwner ? match.ludoKingRoomCode || "-" : "-"}
        </p>

        <p>
          <b>Result:</b> {result?.result || result?.status || "-"}
        </p>

        <p>
          <b>Win Screenshot:</b>
        </p>

        {getScreenshotUrl(screenshot) ? (
          <a href={getScreenshotUrl(screenshot)} target="_blank" rel="noreferrer">
            <img
              src={getScreenshotUrl(screenshot)}
              alt="match proof"
              className="proof-img"
            />
          </a>
        ) : (
          <p>-</p>
        )}

        {canAction && userId && (
          <div className="player-action-row">
            <button
              className="win-btn"
              disabled={actionLoading}
              onClick={() => decideWinner(match, user, label)}
            >
              {actionLoading ? "Wait..." : "Win"}
            </button>

            <button
              className="cancel-btn"
              disabled={actionLoading}
              onClick={() => cancelMatch(match)}
            >
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

      <div className="tabs">
        <button
          className={tab === "running" ? "active-tab" : ""}
          onClick={() => setTab("running")}
        >
          Running Match
        </button>

        <button
          className={tab === "pending" ? "active-tab" : ""}
          onClick={() => setTab("pending")}
        >
          Pending Match
        </button>

        <button
          className={tab === "completed" ? "active-tab" : ""}
          onClick={() => setTab("completed")}
        >
          Completed Match
        </button>

        <button
          className={tab === "cancelled" ? "active-tab" : ""}
          onClick={() => setTab("cancelled")}
        >
          Cancel Match
        </button>

        <button
          className={tab === "total" ? "active-tab" : ""}
          onClick={() => setTab("total")}
        >
          Total Match
        </button>
      </div>

      <div className="search-box">
        <input
          type="text"
          value={searchMobile}
          maxLength={10}
          placeholder="Mobile number se match search karo"
          onChange={(e) =>
            setSearchMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
        />

        {searchMobile && (
          <button type="button" onClick={() => setSearchMobile("")}>
            Clear
          </button>
        )}
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
                <td>{getUserName(match.createdBy)}</td>
                <td>{getUserPhone(match.createdBy) || "-"}</td>
                <td>{match.opponent ? getUserName(match.opponent) : "Waiting"}</td>
                <td>{getUserPhone(match.opponent) || "-"}</td>
                <td>₹{match.amount || 0}</td>
                <td>{match.winner ? getUserName(match.winner) : "-"}</td>
                <td className={getStatusGroup(match.status)}>
                  {match.status || "-"}
                </td>
                <td>
 <button
  className="view"
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    openMatchDetails(match);
  }}
>
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
              <p>
                <b>Battle ID:</b> {selectedMatch.battleId || selectedMatch._id}
              </p>

              <p>
                <b>Status:</b> {selectedMatch.status || "-"}
              </p>

              <p>
                <b>Amount:</b> ₹{selectedMatch.amount || 0}
              </p>

              <p>
                <b>Prize:</b> ₹{selectedMatch.prize || 0}
              </p>

              <p>
                <b>Room Code:</b> {selectedMatch.ludoKingRoomCode || "-"}
              </p>

              <p>
                <b>Winner:</b>{" "}
                {selectedMatch.winner ? getUserName(selectedMatch.winner) : "-"}
              </p>

              <p>
                <b>Created:</b>{" "}
                {selectedMatch.createdAt
                  ? new Date(selectedMatch.createdAt).toLocaleString()
                  : "-"}
              </p>

              <p>
                <b>Updated:</b>{" "}
                {selectedMatch.updatedAt
                  ? new Date(selectedMatch.updatedAt).toLocaleString()
                  : "-"}
              </p>
            </div>

            <div className="player-detail-grid">
              {renderPlayerCard(
                selectedMatch,
                selectedMatch.createdBy,
                "Table Creator"
              )}

              {renderPlayerCard(
                selectedMatch,
                selectedMatch.opponent,
                "Opponent"
              )}
            </div>

            {["pending", "running"].includes(getStatusGroup(selectedMatch.status)) && (
              <button
                className="modal-cancel-full"
                type="button"
                disabled={actionLoading}
                onClick={() => cancelMatch(selectedMatch)}
              >
                {actionLoading ? "Please wait..." : "Cancel Full Match / Refund"}
              </button>
            )}

            <button
              type="button"
              className="close-btn"
              onClick={() => setSelectedMatch(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;