import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./OrderHistoryPage.css";

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!userInfo?.token) {
          navigate("/signin?redirect=/orderHistory");
          return;
        }

        const { data } = await axios.get("/api/orders/mine", {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        setOrders(data);
      } catch (err) {
        console.error("❌ Fetch Orders Error:", err.response || err.message);
        setError(
          err.response?.data?.message || "Failed to fetch order history"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userInfo, navigate]);

  if (loading) return <div className="loading">⏳ Loading orders...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="order-history-page">
      <div className="order-history-card">
        <h1 className="title">📦 My Order History</h1>

        {orders.length === 0 ? (
          <p className="no-orders">No orders found</p>
        ) : (
          <div className="table-wrapper">
            <table className="order-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Total</th>
                  <th>Delivered</th>
                  <th>Date</th>
                  <th>Paid</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order._id.slice(0, 8)}...</td>
                    <td>${order.totalPrice}</td>
                    <td>{order.isDelivered ? "✅ Yes" : "❌ No"}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.isPaid ? "✅ Yes" : "❌ No"}</td>
                    <td>
                      <button
                        className="details-btn"
                        onClick={() => navigate(`/order/${order._id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
