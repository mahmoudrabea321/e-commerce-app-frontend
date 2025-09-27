import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OrderPage.css";
import { useParams } from "react-router-dom";
import Navbar from "../component/Navbar";
import { API } from "../config";

const OrderPage = () => {
  const { id: orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          setError("Order ID is missing");
          setLoading(false);
          return;
        }

        const { data } = await axios.get(`${API}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        });

        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error("Order fetch error:", err);
        setError("Failed to fetch order details");
        setLoading(false);
      }
    };

    if (userInfo && orderId) {
      fetchOrder();
    } else {
      setError("Not authorized or missing order ID");
      setLoading(false);
    }
  }, [orderId, userInfo]);

  const handleManualPayment = async () => {
    const transactionId = prompt("Enter PayPal Transaction ID:");
    const payerEmail = prompt("Enter payer email address:");
    
    if (!transactionId || !payerEmail) return;

    try {
      const paymentResult = {
        id: transactionId,
        status: "COMPLETED",
        update_time: new Date().toISOString(),
        email_address: payerEmail,
      };

      const response = await axios.put(
        `${API}/api/orders/${order._id}/pay`,
        paymentResult,
        {
          headers: { 
            Authorization: `Bearer ${userInfo?.token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.status === 200) {
        alert("✅ Payment verified successfully!");
        setOrder({ ...order, isPaid: true, paidAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("❌ Payment verification failed.");
    }
  };

  if (loading) return <div className="loading">Loading order details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!order) return <div className="error">No order found</div>;

  return (
    <>
      <Navbar />
      <div className="order-page">
        <h1 className="page-title">Order # {orderId}</h1>

        <div className="order-section">
          <div className="section-header">
            <h2>Shipping Information</h2>
          </div>
          <div className="order-info">
            <p><strong>Name:</strong> {order?.shipping?.name || "N/A"}</p>
            <p><strong>Address:</strong> {order?.shipping?.address || "N/A"}, {order?.shipping?.city || "N/A"}</p>
            <p><strong>Postal Code:</strong> {order?.shipping?.postalCode || "N/A"}</p>
            <p><strong>Country:</strong> {order?.shipping?.country || "N/A"}</p>
          </div>
        </div>

        <div className="order-section">
          <div className="section-header">
            <h2>Order Items</h2>
          </div>
          <table className="order-products">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order?.orderItems?.length > 0 ? (
                order.orderItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>${item.price}</td>
                    <td>${(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No items found in this order</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="order-section order-summary">
          <div className="summary-header">
            <div className="summary-prices">
              <h3>Subtotal: ${order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0).toFixed(2) || "0.00"}</h3>
              <h3>Shipping: $10.00</h3>
              <h3>Tax: $5.00</h3>
              <h3>
                Total: <span className="total-amount">
                  ${((order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15).toFixed(2)}
                </span>
              </h3>
            </div>

            <div className="summary-payment">
              {!order.isPaid ? (
                <div className="manual-payment-section">
                  <h3>Payment Instructions</h3>
                  <div className="payment-steps">
                    <p>1. Send ${((order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15).toFixed(2)} via PayPal to your-business@email.com</p>
                    <p>2. Complete your payment on PayPal</p>
                    <p>3. Return here and click the button below</p>
                    <p>4. Enter your Transaction ID when prompted</p>
                  </div>
                  
                  <button 
                    className="verify-payment-btn"
                    onClick={handleManualPayment}
                  >
                    ✅ Verify PayPal Payment
                  </button>
                  
                  <div className="payment-help">
                    <p><strong>Need help?</strong> Check your PayPal account under "Activity" to find your Transaction ID.</p>
                  </div>
                </div>
              ) : (
                <div className="paid-success">
                  <p className="paid-msg">✅ Order already paid</p>
                  <p>Paid on: {new Date(order.paidAt).toLocaleDateString()}</p>
                  {order.paymentResult && (
                    <p>Transaction ID: {order.paymentResult.id}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderPage;