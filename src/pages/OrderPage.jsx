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
  const [paypalLoaded, setPaypalLoaded] = useState(false);

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

  // Load PayPal SDK manually with CSP fixes
  useEffect(() => {
    if (!order || order.isPaid) return;

    const loadPayPalSDK = () => {
      // Check if already loaded
      if (window.paypal) {
        setPaypalLoaded(true);
        return;
      }

      // Remove any existing script
      const existingScript = document.querySelector('script[src*="paypal"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=AeDj5t99cWRPf-9ZWOULuehZ-15UDfvNfR9NpHWyF-iGZLpmhSWrdRI3df9IZAjIjcteZPINRjQu5zzg&currency=USD`;
      script.setAttribute('data-namespace', 'paypal_sdk');
      script.async = true;
      
      script.onload = () => {
        console.log('PayPal SDK loaded successfully');
        setPaypalLoaded(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load PayPal SDK');
        setPaypalLoaded(false);
      };
      
      document.head.appendChild(script);
    };

    // Delay loading to avoid CSP conflicts
    const timer = setTimeout(loadPayPalSDK, 1000);
    return () => clearTimeout(timer);
  }, [order]);

  // Handle PayPal approval
  const handleApprove = async (orderID) => {
    try {
      setPaying(true);
      console.log("Capturing order:", orderID);

      // Capture the order on your backend
      const response = await axios.post(
        `${API}/api/orders/${order._id}/capture`,
        { orderID },
        {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        alert("✅ Payment successful! Order updated.");
        setOrder({ 
          ...order, 
          isPaid: true, 
          paidAt: new Date().toISOString(),
          paymentResult: {
            id: orderID,
            status: "COMPLETED",
            update_time: new Date().toISOString()
          }
        });
      } else {
        throw new Error("Payment capture failed");
      }
    } catch (error) {
      console.error("Payment error:", error.response?.data || error);
      
      let errorMessage = "❌ Payment failed. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = `❌ ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setPaying(false);
    }
  };

  // Render PayPal buttons manually
  const renderPayPalButton = () => {
    if (!paypalLoaded || !window.paypal) {
      return <div className="paypal-loading">Loading PayPal...</div>;
    }

    const totalAmount = ((order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15).toFixed(2);

    return (
      <div 
        id="paypal-button-container"
        ref={(node) => {
          if (node && window.paypal && !node.hasChildNodes()) {
            try {
              window.paypal.Buttons({
                style: {
                  layout: 'vertical',
                  color: 'blue',
                  shape: 'rect',
                  label: 'paypal'
                },
                
                createOrder: function(data, actions) {
                  return actions.order.create({
                    purchase_units: [{
                      amount: {
                        value: totalAmount,
                        currency_code: "USD",
                      },
                    }],
                    application_context: {
                      shipping_preference: "NO_SHIPPING"
                    }
                  });
                },

                // Fixed: Remove unused 'actions' parameter
                onApprove: function(data) {
                  console.log("Order approved:", data.orderID);
                  return handleApprove(data.orderID);
                },

                onError: function(err) {
                  console.error("PayPal error:", err);
                  alert("❌ PayPal error occurred. Please try again.");
                },

                onCancel: function(data) {
                  console.log("Payment cancelled:", data);
                }

              }).render('#paypal-button-container');
            } catch (error) {
              console.error("Error rendering PayPal button:", error);
              return <div className="error">Error loading PayPal button</div>;
            }
          }
        }}
      />
    );
  };

  // Manual payment fallback
  const handleManualPayment = async () => {
    const transactionId = prompt("Enter PayPal Transaction ID:");
    const payerEmail = prompt("Enter payer email address:");
    
    if (!transactionId || !payerEmail) {
      alert("Transaction ID and email are required.");
      return;
    }

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
        alert("✅ Payment verified successfully!");
        setOrder({ ...order, isPaid: true, paidAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error("Manual payment error:", error);
      alert("❌ Payment verification failed. Please check your details.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="loading">Loading order details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!order) return <div className="error">No order found</div>;

  const totalAmount = ((order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15).toFixed(2);

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
                Total: <span className="total-amount">${totalAmount}</span>
              </h3>
            </div>

            <div className="summary-payment">
              {!order.isPaid ? (
                <>
                  {paying && (
                    <div className="payment-processing">
                      <div className="loading-spinner"></div>
                      <p>Processing payment...</p>
                    </div>
                  )}
                  
                  <div className="payment-options">
                    <div className="paypal-option">
                      <h3>Pay with PayPal</h3>
                      {renderPayPalButton()}
                    </div>
                    
                    <div className="manual-option">
                      <h3>Manual Payment Verification</h3>
                      <p>If you've already paid via PayPal, click below to verify:</p>
                      <button 
                        className="manual-verify-btn"
                        onClick={handleManualPayment}
                        disabled={paying}
                      >
                        {paying ? 'Verifying...' : 'Verify Manual Payment'}
                      </button>
                    </div>
                  </div>
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