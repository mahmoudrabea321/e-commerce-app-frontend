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
  const [paying, setPaying] = useState(false);

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

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

  const handleManualVerification = async () => {
    const transactionId = prompt("Please enter your PayPal Transaction ID:");
    const payerEmail = prompt("Please enter the email address used for PayPal:");
    
    if (!transactionId || !payerEmail) return;

    try {
      setPaying(true);
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
        alert("✅ Payment verified successfully! Order updated.");
        setOrder({ ...order, isPaid: true, paidAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error("Manual verification error:", error);
      alert("❌ Verification failed. Please check the Transaction ID and try again.");
    } finally {
      setPaying(false);
    }
  };

  const PayPalRedirectSection = ({ order }) => {
    if (!order || !paypalClientId) {
      return <div className="error">❌ PayPal is not configured properly.</div>;
    }

    const totalAmount = (order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15;
    const amountFormatted = totalAmount.toFixed(2);
    
    // Simple form that redirects to PayPal
    return (
      <div className="paypal-redirect-container">
        <div className="payment-amount">
          <h3>Total Amount: ${amountFormatted}</h3>
        </div>
        
        <div className="payment-options">
          {/* Option 1: Direct PayPal Link */}
          <div className="payment-option">
            <h4>Option 1: Direct PayPal Payment</h4>
            <a 
              href={`https://www.paypal.com/paypalme/yourmerchantid/${amountFormatted}USD`}
              target="_blank"
              rel="noopener noreferrer"
              className="paypal-direct-link"
            >
              💳 Pay ${amountFormatted} via PayPal.Me
            </a>
            <p className="option-note">(Fastest option - uses PayPal.Me link)</p>
          </div>

          {/* Option 2: Manual Verification */}
          <div className="payment-option">
            <h4>Option 2: Manual Verification</h4>
            <p>If you've already paid via PayPal, click below to verify:</p>
            <button 
              className="verify-payment-btn"
              onClick={handleManualVerification}
              disabled={paying}
            >
              {paying ? 'Verifying...' : '🔍 Verify Payment Manually'}
            </button>
          </div>
        </div>
        
        <div className="payment-instructions">
          <h4>📋 Payment Instructions:</h4>
          <div className="instructions-grid">
            <div className="instruction-step">
              <span className="step-number">1</span>
              <p>Click the PayPal.Me link above</p>
            </div>
            <div className="instruction-step">
              <span className="step-number">2</span>
              <p>Complete payment on PayPal</p>
            </div>
            <div className="instruction-step">
              <span className="step-number">3</span>
              <p>Return to this page</p>
            </div>
            <div className="instruction-step">
              <span className="step-number">4</span>
              <p>Click "Verify Payment Manually"</p>
            </div>
            <div className="instruction-step">
              <span className="step-number">5</span>
              <p>Enter your Transaction ID and email</p>
            </div>
          </div>
          
          <div className="important-notes">
            <p>💡 <strong>Where to find Transaction ID:</strong></p>
            <ul>
              <li>PayPal confirmation email</li>
              <li>PayPal website under "Activity"</li>
              <li>PayPal mobile app transaction history</li>
            </ul>
          </div>
        </div>
      </div>
    );
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
              <h3>
                Subtotal: $
                {order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0).toFixed(2) || "0.00"}
              </h3>
              <h3>Shipping: $10.00</h3>
              <h3>Tax: $5.00</h3>
              <h3>
                Total:{" "}
                <span className="total-amount">
                  ${((order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15).toFixed(2)}
                </span>
              </h3>
            </div>

            <div className="summary-payment">
              {!order.isPaid ? (
                <>
                  {paying && (
                    <div className="payment-processing">
                      <div className="loading-spinner"></div>
                      <p>Processing payment verification...</p>
                    </div>
                  )}
                  
                  <PayPalRedirectSection order={order} />
                </>
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