import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../../config.js";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        if (!userInfo?.isAdmin) {
          navigate("/signin");
          return;
        }

        const { data } = await axios.get(`${API}/api/admin/summary`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        setSummary(data);
      } catch (err) {
        console.error(" Error fetching dashboard summary:", err);
        setError("Failed to load dashboard summary");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [userInfo, navigate]);

  if (loading) return <p className="loading">⏳ Loading dashboard...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="admin-dashboard">
      <h1>📊 Admin Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card users">
          <h2>👤 Users</h2>
          <p>{summary?.users?.numUsers || 0}</p>
        </div>

        <div className="stat-card orders">
          <h2>🛒 Orders</h2>
          <p>{summary?.orders?.numOrders || 0}</p>
        </div>

        <div className="stat-card sales">
          <h2>💵 Sales</h2>
          <p>${summary?.orders?.totalSales?.toFixed(2) || 0}</p>
        </div>
      </div>

      <h2 className="category-title">📦 Products by Category</h2>
      <ul className="category-list">
        {summary?.productCategories?.length > 0 ? (
          summary.productCategories.map((c) => (
            <li key={c._id} className="category-item">
              <span className="category-name">{c._id}</span>
              <span className="category-count">{c.count}</span>
            </li>
          ))
        ) : (
          <p>No categories yet</p>
        )}
      </ul>
    </div>
  );
};

export default AdminDashboard;
