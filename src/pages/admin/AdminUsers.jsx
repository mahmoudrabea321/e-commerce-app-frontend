import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API } from "../../config.js";
import "./AdminUsers.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  useEffect(() => {
    if (!userInfo?.isAdmin) {
      navigate("/signin");
      return;
    }

    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(`${API}/api/admin/users`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setUsers(data);
      } catch (err) {
        console.error("❌ Error fetching users:", err);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userInfo?.token, userInfo?.isAdmin, navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`${API}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      alert("Failed to delete user");
    }
  };

  const toggleAdmin = async (id, isAdmin) => {
    try {
      const { data } = await axios.put(
        `${API}/api/admin/users/${id}`,
        { isAdmin: !isAdmin },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );

      setUsers((prev) => prev.map((u) => (u._id === id ? data : u)));
    } catch (err) {
      console.error("❌ Error updating user role:", err);
      alert("Failed to update user role");
    }
  };

  return (
    <div className="admin-container">
      <h1>👥 Manage Users</h1>

      {loading ? (
        <p className="loading">⏳ Loading users...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : users.length === 0 ? (
        <p className="no-data">No users found</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Admin</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u._id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.isAdmin ? "✅ Yes" : "❌ No"}</td>
                <td>
                  <button
                    className={`btn ${u.isAdmin ? "remove" : "make"}`}
                    onClick={() => toggleAdmin(u._id, u.isAdmin)}
                  >
                    {u.isAdmin ? "Remove Admin" : "Make Admin"}
                  </button>
                  <button
                    className="btn delete"
                    onClick={() => handleDelete(u._id)}
                  >
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsers;
