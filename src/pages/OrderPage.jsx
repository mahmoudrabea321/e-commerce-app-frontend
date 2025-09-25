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

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 
                        "AXgjXvV9ul6KUiTw9uKwpKuMObDmWqw3_ZuF9V-v6W1xW76I-tSdx8EnAvO3lVmaRqIEmD0QDAB33fCJ";

  // Load PayPal script manually to avoid CSP issues
  useEffect(() => {
    const loadPaypalScript = () => {
      if (window.paypal) {
        setPaypalLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;
      script.addEventListener('load', () => {
        setPaypalLoaded(true);
      });
      script.addEventListener('error', () => {
        console.error('Failed to load PayPal SDK');
      });
      document.body.appendChild(script);
    };

    if (paypalClientId) {
      loadPaypalScript();
    }
  }, [paypalClientId]);

  // Render PayPal buttons manually
  useEffect(() => {
    if (paypalLoaded && window.paypal && order && !order.isPaid) {
      try {
        // Clean up any existing buttons
        const existingContainer = document.getElementById('paypal-button-container');
        if (existingContainer) {
          existingContainer.innerHTML = '';
        }

        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          },
          createOrder: function(data, actions) {
            const totalAmount = (order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15;
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: totalAmount.toFixed(2),
                  currency_code: "USD",
                }
              }]
            });
          },
          onApprove: async function(data, actions) {
            try {
              setPaying(true);
              const details = await actions.order.capture();
              
              const paymentResult = {
                id: details.id,
                status: details.status,
                update_time: details.update_time || new Date().toISOString(),
                email_address: details.payer?.email_address,
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
                setOrder(response.data);
              }
            } catch (error) {
              console.error("Payment error:", error);
              alert("❌ Payment failed. Please try again.");
            } finally {
              setPaying(false);
            }
          },
          onError: function(err) {
            console.error('PayPal error:', err);
            alert('❌ Payment failed. Please try again.');
          }
        }).render('#paypal-button-container');
      } catch (error) {
        console.error('Error rendering PayPal buttons:', error);
      }
    }
  }, [paypalLoaded, order, userInfo]);

  // Your existing useEffect for fetching order
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!order) return <div>No order found</div>;

  const subtotal = order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0;
  const total = subtotal + 15;

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
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order?.orderItems?.length > 0 ? (
                order.orderItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>${item.price.toFixed(2)}</td>
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
              <h3>Subtotal: <span>${subtotal.toFixed(2)}</span></h3>
              <h3>Shipping: <span>$10.00</span></h3>
              <h3>Tax: <span>$5.00</span></h3>
              <h3>Total: <span>${total.toFixed(2)}</span></h3>
            </div>

            <div className="summary-payment">
              {!order.isPaid ? (
                <>
                  {paying && <div className="loading">Processing payment...</div>}
                  
                  <div className="paypal-container">
                    <h3 className="payment-title">Secure Payment</h3>
                    
                    {paypalLoaded ? (
                      <div id="paypal-button-container"></div>
                    ) : (
                      <div className="loading">Loading payment system...</div>
                    )}
                    
                    <div className="security-notice">
                      <p>🔒 Your payment is secure and encrypted</p>
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