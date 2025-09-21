import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../../config.js";
import { useNavigate } from "react-router-dom";
import "./AdminOrders.css";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!userInfo?.isAdmin) {
          navigate("/signin");
          return;
        }

        const { data } = await axios.get(`${API}/api/admin/orders`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        setOrders(data);
      } catch (err) {
        console.error("❌ Error fetching orders:", err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userInfo, navigate]);

  const handleDeliver = async (id) => {
    try {
      await axios.put(
        `${API}/api/admin/orders/${id}/deliver`,
        {},
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === id ? { ...order, isDelivered: true } : order
        )
      );
    } catch (err) {
      console.error("❌ Failed to mark as delivered:", err);
      alert("Failed to mark as delivered");
    }
  };

  return (
    <div className="admin-container">
      <h1>📦 Manage Orders</h1>

      {loading ? (
        <p className="loading">⏳ Loading orders...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : orders.length === 0 ? (
        <p className="no-data">No orders found</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Delivered</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>{o._id}</td>
                <td>{o.user?.name || "Deleted User"}</td>
                <td>${o.totalPrice.toFixed(2)}</td>
                <td>{o.isPaid ? "✅ Yes" : "❌ No"}</td>
                <td>{o.isDelivered ? "✅ Yes" : "❌ No"}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn details"
                    onClick={() => navigate(`/order/${o._id}`)}
                  >
                    Details
                  </button>
                  {!o.isDelivered && (
                    <button
                      className="btn deliver"
                      onClick={() => handleDeliver(o._id)}
                    >
                      Mark Delivered
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminOrders;
