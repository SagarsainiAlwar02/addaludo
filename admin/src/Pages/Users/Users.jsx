import React, { useState, useEffect } from "react";
import "./Users.css";
import API from "../../api";

const getTotalBalance = (user) => {
  const deposit = Number(user?.wallet?.balance || 0);
  const winnings = Number(user?.wallet?.winnings || 0);
  const totalBalance = Number(user?.wallet?.totalBalance || 0);

  return totalBalance || deposit + winnings || Number(user?.balance || 0);
};




const Users = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
     const res = await API.get(`/admin/users?limit=50&search=${search}`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Fetch users error:", err.response?.data || err.message);
    }
  };

 useEffect(() => {
  const timer = setTimeout(() => {
    fetchUsers();
  }, 400);

  return () => clearTimeout(timer);
}, [search]);

  const filteredUsers = users.filter((user) => {
    const status = user.status || "active";
    const phone = String(user.phone || user.mobile || "");
    const name = String(user.name || "");
    const referral = String(user.referralCode || "");
    const searchValue = search.trim().toLowerCase();

    const matchFilter = filter === "all" || status === filter;

    const matchSearch =
      !searchValue ||
      phone.toLowerCase().includes(searchValue) ||
      name.toLowerCase().includes(searchValue) ||
      referral.toLowerCase().includes(searchValue);

    return matchFilter && matchSearch;
  });

  const toggleBan = async (id) => {
    try {
      await API.patch(`/admin/block/${id}`);
      fetchUsers();
    } catch (err) {
      console.log("Block user error:", err.response?.data || err.message);
    }
  };

  const deleteUser = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirmDelete) return;

    try {
      await API.delete(`/admin/user/${id}`);
      fetchUsers();
    } catch (err) {
      console.log("Delete user error:", err.response?.data || err.message);
    }
  };

  return (
    <div className="users-container">
      <h1>Users</h1>

      <input
        type="text"
        placeholder="Search by mobile number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      <div className="filters">
        <button
          className={filter === "all" ? "active-filter" : ""}
          onClick={() => setFilter("all")}
        >
          All Users
        </button>

        <button
          className={filter === "active" ? "active-filter" : ""}
          onClick={() => setFilter("active")}
        >
          Active
        </button>

        <button
          className={filter === "blocked" ? "active-filter" : ""}
          onClick={() => setFilter("blocked")}
        >
          Blocked
        </button>

        <button
          className={filter === "mismatch" ? "active-filter" : ""}
          onClick={() => setFilter("mismatch")}
        >
          Mismatch
        </button>
      </div>

      <p className="scroll-hint">← Swipe left/right to see full table →</p>

      <div className="table-scroll">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Referral</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const status = user.status || "active";
                const phone = user.phone || user.mobile || "-";

                return (
                  <tr key={user._id}>
                    <td className="user-id">{user._id}</td>
                    <td>{user.name || "Player"}</td>
                    <td>{phone}</td>
                    <td>{user.referralCode || "-"}</td>
                   <td>₹{getTotalBalance(user)}</td>
                    <td>
                      <span className={`status-badge ${status}`}>{status}</span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="view"
                          onClick={() => setSelectedUser(user)}
                        >
                          View
                        </button>

                        <button
                          className={status === "blocked" ? "unban" : "ban"}
                          onClick={() => toggleBan(user._id)}
                        >
                          {status === "blocked" ? "Unban" : "Ban"}
                        </button>

                        <button
                          className="delete"
                          onClick={() => deleteUser(user._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="modal" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>User Details</h2>

            <p>
              <b>ID:</b> {selectedUser._id}
            </p>
            <p>
              <b>Name:</b> {selectedUser.name || "Player"}
            </p>
            <p>
              <b>Mobile:</b> {selectedUser.phone || selectedUser.mobile || "-"}
            </p>
            <p>
              <b>Referral:</b> {selectedUser.referralCode || "-"}
            </p>
            <p>
              <b>Balance:</b> ₹
              {getTotalBalance(selectedUser)}
            </p>
            <p>
              <b>Status:</b> {selectedUser.status || "active"}
            </p>

            <button onClick={() => setSelectedUser(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;