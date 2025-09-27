import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OrderPage.css";
import { useParams, Link } from "react-router-dom";
import Navbar from "../component/Navbar";
import { API } from "../config";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const OrderPage = () => {
  const { id: orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paypalError, setPaypalError] = useState("");

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  // Check if PayPal client ID is available
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  
  useEffect(() => {
    if (!paypalClientId || paypalClientId === 'test') {
      setPaypalError("PayPal client ID is missing or invalid");
    }
  }, [paypalClientId]);

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
      } catch {
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

  const handleApprove = async (details) => {
    try {
      await axios.put(`${API}/api/orders/${order._id}/pay`, details, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      alert("✅ Payment successful!");
      window.location.reload();
    } catch (error) {
      alert("❌ Payment failed. Please try again.");
      console.error("Payment error:", error);
    }
  };

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
            <Link to="/Shipping" className="edit-btn">Edit</Link>
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
            <Link to="/cart" className="edit-btn">Edit</Link>
          </div>
          <table className="order-products">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {order?.orderItems?.length > 0 ? (
                order.orderItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>${item.price}</td>
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
              <h3>Subtotal: ${subtotal}</h3>
              <h3>Shipping: $10</h3>
              <h3>Tax: $5</h3>
              <h3>Total: <span>${total}</span></h3>
            </div>

            <div className="summary-payment">
              {!order.isPaid ? (
                <>
                  {paypalError && (
                    <div className="error">
                      PayPal unavailable: {paypalError}
                      <br />
                      Please check your environment variables.
                    </div>
                  )}
                  
                  {paypalClientId && paypalClientId !== 'test' ? (
                    <PayPalScriptProvider
                      options={{
                        "client-id": paypalClientId,
                        currency: "USD",
                        components: "buttons",
                        intent: "capture",
                      }}
                    >
                      <PayPalButtons
                        style={{ 
                          layout: "vertical",
                          color: "gold",
                          shape: "rect",
                          label: "paypal"
                        }}
                        createOrder={(data, actions) => {
                          return actions.order.create({
                            purchase_units: [
                              {
                                amount: {
                                  value: total.toFixed(2),
                                  currency_code: "USD",
                                },
                              },
                            ],
                          });
                        }}
                        onApprove={async (data, actions) => {
                          try {
                            const details = await actions.order.capture();
                            await handleApprove(details);
                          } catch (error) {
                            console.error("Payment capture error:", error);
                            alert("❌ Payment capture failed.");
                          }
                        }}
                        onError={(err) => {
                          console.error("PayPal Button Error:", err);
                          setPaypalError("Failed to initialize PayPal");
                        }}
                      />
                    </PayPalScriptProvider>
                  ) : (
                    <div className="error">
                      PayPal configuration error. Please contact support.
                    </div>
                  )}
                </>
              ) : (
                <p className="paid-msg">✅ Order already paid</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderPage;