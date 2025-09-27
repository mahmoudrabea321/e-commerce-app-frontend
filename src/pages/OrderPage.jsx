import React, { useEffect, useState, useCallback } from "react";
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
  const [paymentVerified, setPaymentVerified] = useState(false);

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  // Define verifyPayment with useCallback to avoid infinite re-renders
  const verifyPayment = useCallback(async (paymentId, token, PayerID) => {
    if (!order) return;
    
    try {
      setPaying(true);
      
      const paymentResult = {
        id: paymentId,
        status: "COMPLETED",
        update_time: new Date().toISOString(),
        email_address: PayerID || "customer@example.com",
        token: token,
        PayerID: PayerID
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
        setPaymentVerified(true);
        setOrder({ ...order, isPaid: true, paidAt: new Date().toISOString() });
        alert("✅ Payment verified successfully! Order updated.");
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      alert("❌ Payment verification failed. Please contact support.");
    } finally {
      setPaying(false);
    }
  }, [order, userInfo?.token]);

  // Check for payment verification on component mount and when order loads
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('paymentId');
    const token = urlParams.get('token');
    const PayerID = urlParams.get('PayerID');

    if (paymentId && token && PayerID && order) {
      verifyPayment(paymentId, token, PayerID);
    }
  }, [order, verifyPayment]); // Now verifyPayment is properly included in dependencies

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

  const handleApprove = async (paymentData) => {
    try {
      setPaying(true);
      
      const paymentResult = {
        id: paymentData.id,
        status: paymentData.status,
        update_time: paymentData.update_time,
        email_address: paymentData.email_address,
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
        alert("✅ Payment successful! Order updated.");
        setOrder({ ...order, isPaid: true, paidAt: new Date().toISOString() });
      } else {
        throw new Error("Payment update failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("❌ Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const PayPalHostedButton = ({ order }) => {
    if (!order || !paypalClientId) {
      return <div className="error">❌ PayPal is not configured properly.</div>;
    }

    const totalAmount = (order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15;
    const amountFormatted = totalAmount.toFixed(2);
    
    // Create a basic PayPal checkout URL
    const paypalCheckoutUrl = `https://www.paypal.com/checkoutnow?client-id=${paypalClientId}&amount=${amountFormatted}&currency=USD&returnUrl=${encodeURIComponent(window.location.origin + `/order/${order._id}?paymentSuccess=true`)}&cancelUrl=${encodeURIComponent(window.location.origin + `/order/${order._id}?paymentCancelled=true`)}`;

    const handlePayPalRedirect = () => {
      // Store order info in localStorage for verification
      localStorage.setItem(`pendingOrder_${order._id}`, JSON.stringify({
        orderId: order._id,
        amount: amountFormatted,
        timestamp: new Date().toISOString()
      }));
      
      // Open PayPal in new tab
      window.open(paypalCheckoutUrl, '_blank');
      
      // Show verification instructions
      alert(`🔔 Important: After completing payment on PayPal, please return to this page and click "Verify Payment" to confirm your transaction.`);
    };

    const handleManualVerification = async () => {
      const transactionId = prompt("Please enter your PayPal Transaction ID:");
      if (!transactionId) return;

      try {
        setPaying(true);
        const paymentResult = {
          id: transactionId,
          status: "COMPLETED",
          update_time: new Date().toISOString(),
          email_address: "manual_verification@example.com",
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

    return (
      <div className="paypal-hosted-container">
        <div className="payment-amount">
          <h3>Total Amount: ${amountFormatted}</h3>
        </div>
        
        <div className="paypal-buttons">
          <button 
            className="paypal-hosted-btn"
            onClick={handlePayPalRedirect}
            disabled={paying}
          >
            {paying ? 'Processing...' : '🅿️ Pay with PayPal'}
          </button>
          
          <button 
            className="verify-payment-btn"
            onClick={handleManualVerification}
            disabled={paying}
          >
            🔍 Verify Payment
          </button>
        </div>
        
        <div className="payment-instructions">
          <h4>Payment Instructions:</h4>
          <ol>
            <li>Click "Pay with PayPal" to open PayPal checkout</li>
            <li>Complete your payment on PayPal</li>
            <li>Return to this page and click "Verify Payment"</li>
            <li>Enter your Transaction ID when prompted</li>
          </ol>
          <p className="note">
            💡 <strong>Note:</strong> You can find your Transaction ID in your PayPal account under "Activity" or in the confirmation email from PayPal.
          </p>
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
        <h1 className="page-title">Order Details</h1>

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
                  
                  {paymentVerified ? (
                    <div className="payment-success">
                      <p>✅ Payment verified successfully!</p>
                    </div>
                  ) : (
                    <PayPalHostedButton order={order} onSuccess={handleApprove} />
                  )}
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