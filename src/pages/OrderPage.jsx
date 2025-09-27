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
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [formData, setFormData] = useState({
    transactionId: "",
    payerEmail: "",
    amount: ""
  });

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
        // Pre-fill amount in form
        const total = ((data?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15).toFixed(2);
        setFormData(prev => ({ ...prev, amount: total }));
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleManualPayment = async (e) => {
    e.preventDefault();
    
    const { transactionId, payerEmail, amount } = formData;
    
    if (!transactionId.trim() || !payerEmail.trim() || !amount.trim()) {
      alert("All fields are required.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payerEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      setPaying(true);
      const paymentResult = {
        id: transactionId.trim(),
        status: "COMPLETED",
        update_time: new Date().toISOString(),
        email_address: payerEmail.trim(),
        amount: parseFloat(amount)
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
        setOrder({ 
          ...order, 
          isPaid: true, 
          paidAt: new Date().toISOString(),
          paymentResult: paymentResult
        });
        setShowPaymentForm(false);
        // Reset form but keep amount
        setFormData(prev => ({ 
          transactionId: "", 
          payerEmail: "", 
          amount: prev.amount 
        }));
      }
    } catch (error) {
      console.error("Manual payment error:", error);
      let errorMessage = "❌ Payment verification failed. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = `❌ ${error.response.data.message}`;
      } else if (error.response?.status === 404) {
        errorMessage = "❌ Order not found. Please check the order ID.";
      }
      
      alert(errorMessage);
    } finally {
      setPaying(false);
    }
  };

  const PaymentForm = () => (
    <div className="payment-form-container">
      <h3>💰 Payment Verification</h3>
      <p className="form-description">Enter your payment details to verify your order</p>
      
      <form onSubmit={handleManualPayment} className="payment-form">
        <div className="form-group">
          <label htmlFor="transactionId">Transaction ID *</label>
          <input
            id="transactionId"
            name="transactionId"
            type="text"
            value={formData.transactionId}
            onChange={handleInputChange}
            required
            placeholder="Ex: 5HY78923KL1234567"
            disabled={paying}
          />
          <small>From PayPal confirmation email or transaction history</small>
        </div>

        <div className="form-group">
          <label htmlFor="payerEmail">Your Email Address *</label>
          <input
            id="payerEmail"
            name="payerEmail"
            type="email"
            value={formData.payerEmail}
            onChange={handleInputChange}
            required
            placeholder="your-email@example.com"
            disabled={paying}
          />
          <small>Email used for the payment</small>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount Paid (USD) *</label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={handleInputChange}
            required
            disabled={paying}
          />
          <small>Total amount you paid</small>
        </div>

        <div className="form-buttons">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => setShowPaymentForm(false)}
            disabled={paying}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="verify-btn"
            disabled={paying}
          >
            {paying ? '⏳ Verifying...' : '✅ Verify Payment'}
          </button>
        </div>
      </form>

      <div className="payment-help">
        <h4>💡 Need help finding your Transaction ID?</h4>
        <ul>
          <li><strong>PayPal Email:</strong> Check your PayPal confirmation email</li>
          <li><strong>PayPal Website:</strong> Go to Activity → Transactions</li>
          <li><strong>PayPal App:</strong> Check your transaction history</li>
          <li><strong>Format:</strong> Usually starts with letters and numbers (ex: 5HY78923KL1234567)</li>
        </ul>
      </div>
    </div>
  );

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading order details...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={() => window.history.back()} className="back-btn">
        ← Go Back
      </button>
    </div>
  );
  
  if (!order) return (
    <div className="error-container">
      <h2>Order Not Found</h2>
      <p>No order found with ID: {orderId}</p>
      <button onClick={() => window.history.back()} className="back-btn">
        ← Go Back
      </button>
    </div>
  );

  const totalAmount = ((order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15).toFixed(2);

  return (
    <>
      <Navbar />
      <div className="order-page">
        <div className="order-header">
          <h1 className="page-title">Order # {orderId}</h1>
          <div className={`order-status ${order.isPaid ? 'paid' : 'pending'}`}>
            {order.isPaid ? '✅ Paid' : '⏳ Pending Payment'}
          </div>
        </div>

        <div className="order-grid">
          {/* Shipping Information */}
          <div className="order-section">
            <div className="section-header">
              <h2>📦 Shipping Information</h2>
            </div>
            <div className="order-info">
              <div className="info-item">
                <strong>Name:</strong> {order.shipping?.name || "N/A"}
              </div>
              <div className="info-item">
                <strong>Address:</strong> {order.shipping?.address || "N/A"}
              </div>
              <div className="info-item">
                <strong>City:</strong> {order.shipping?.city || "N/A"}
              </div>
              <div className="info-item">
                <strong>Postal Code:</strong> {order.shipping?.postalCode || "N/A"}
              </div>
              <div className="info-item">
                <strong>Country:</strong> {order.shipping?.country || "N/A"}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="order-section">
            <div className="section-header">
              <h2>🛒 Order Items</h2>
            </div>
            <div className="order-items-container">
              {order.orderItems?.length > 0 ? (
                <table className="order-products">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.orderItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.qty}</td>
                        <td>${item.price}</td>
                        <td>${(item.price * item.qty).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No items found in this order</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-section order-summary">
            <div className="section-header">
              <h2>💰 Order Summary</h2>
            </div>
            <div className="summary-content">
              <div className="summary-prices">
                <div className="price-row">
                  <span>Subtotal:</span>
                  <span>${order.orderItems?.reduce((a, c) => a + c.price * c.qty, 0).toFixed(2) || "0.00"}</span>
                </div>
                <div className="price-row">
                  <span>Shipping:</span>
                  <span>$10.00</span>
                </div>
                <div className="price-row">
                  <span>Tax:</span>
                  <span>$5.00</span>
                </div>
                <div className="price-row total">
                  <span>Total:</span>
                  <span>${totalAmount}</span>
                </div>
              </div>

              <div className="payment-section">
                {order.isPaid ? (
                  <div className="paid-success">
                    <div className="success-icon">✅</div>
                    <h3>Payment Confirmed</h3>
                    <p>Paid on: {new Date(order.paidAt).toLocaleDateString()}</p>
                    {order.paymentResult && (
                      <p>Transaction ID: {order.paymentResult.id}</p>
                    )}
                  </div>
                ) : (
                  <div className="payment-actions">
                    {showPaymentForm ? (
                      <PaymentForm />
                    ) : (
                      <>
                        <h3>Complete Your Order</h3>
                        <p>Pay via PayPal and then verify your payment below:</p>
                        <button 
                          className="verify-payment-btn"
                          onClick={() => setShowPaymentForm(true)}
                        >
                            💳 Verify Payment
                        </button>
                        <div className="payment-instructions">
                          <h4>Payment Instructions:</h4>
                          <ol>
                            <li>Send <strong>${totalAmount}</strong> via PayPal</li>
                            <li>Complete your payment</li>
                            <li>Return here and click "Verify Payment"</li>
                            <li>Enter your Transaction ID and email</li>
                          </ol>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderPage;