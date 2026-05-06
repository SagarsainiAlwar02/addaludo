import React, { useState, useEffect } from "react";
import "./Users.css";
import API from "../../api";

const Users = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Fetch users error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ================= FILTER =================
  const filteredUsers = users.filter((user) => {
    const status = user.status || "active";
    const phone = user.phone || user.mobile || "";

    const matchFilter = filter === "all" || status === filter;
    const matchSearch = phone.includes(search);

    return matchFilter && matchSearch;
  });

  // ================= BAN / UNBAN =================
  const toggleBan = async (id) => {
    try {
      await API.patch(`/admin/block/${id}`);
      fetchUsers();
    } catch (err) {
      console.log("Block user error:", err.response?.data || err.message);
    }
  };

  // ================= DELETE =================
  const deleteUser = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
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
        <button onClick={() => setFilter("all")}>All Users</button>
        <button onClick={() => setFilter("active")}>Active</button>
        <button onClick={() => setFilter("blocked")}>Blocked</button>
        <button onClick={() => setFilter("mismatch")}>Mismatch</button>
      </div>

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
                  <td>{user._id}</td>
                  <td>{user.name || "Player"}</td>
                  <td>{phone}</td>
                  <td>{user.referralCode || "-"}</td>
                  <td>₹{user.balance || user.wallet?.balance || 0}</td>

                  <td className={status}>{status}</td>

                  <td>
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
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <h2>User Details</h2>

            <p><b>Name:</b> {selectedUser.name || "Player"}</p>
            <p><b>Mobile:</b> {selectedUser.phone || selectedUser.mobile || "-"}</p>
            <p><b>Referral:</b> {selectedUser.referralCode || "-"}</p>
            <p><b>Balance:</b> ₹{selectedUser.balance || selectedUser.wallet?.balance || 0}</p>
            <p><b>Status:</b> {selectedUser.status || "active"}</p>

            <button onClick={() => setSelectedUser(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;