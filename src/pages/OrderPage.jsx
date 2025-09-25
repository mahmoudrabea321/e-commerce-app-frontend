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
  const [paying, setPaying] = useState(false);

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

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

  const handleApprove = async (details) => {
    try {
      setPaying(true);
      console.log("PayPal approval details:", details);
      
      // Prepare the payment data for backend
      const paymentResult = {
        id: details.id,
        status: details.status,
        update_time: details.update_time,
        email_address: details.payer.email_address,
      };

      console.log("Sending payment data to backend:", paymentResult);
      
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

      console.log("Backend response:", response.data);
      
      if (response.status === 200) {
        alert("✅ Payment successful! Order updated.");
        setOrder({ ...order, isPaid: true, paidAt: new Date().toISOString() });
      } else {
        throw new Error("Payment update failed");
      }
    } catch (error) {
      console.error("Payment error details:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "❌ Payment failed. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = `❌ Payment failed: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `❌ Payment failed: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!order) return <div>No order found</div>;

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
              <h3>
                Subtotal: $
                {order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0}
              </h3>
              <h3>Shipping: $10</h3>
              <h3>Tax: $5</h3>
              <h3>
                Total:{" "}
                <span>
                  ${(order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15}
                </span>
              </h3>
            </div>

            <div className="summary-payment">
              {!order.isPaid ? (
                <>
                  {paying && <div className="loading">Processing payment...</div>}
                  
                  {paypalClientId ? (
                    <PayPalScriptProvider
                      options={{
                        "client-id": paypalClientId,
                        currency: "USD",
                        intent: "capture",
                      }}
                    >
                      <PayPalButtons
                        style={{ layout: "vertical" }}
                        createOrder={(data, actions) => {
                          const totalAmount = (order?.orderItems?.reduce(
                            (a, c) => a + c.price * c.qty, 0
                          ) || 0) + 15;
                          
                          return actions.order.create({
                            purchase_units: [
                              {
                                amount: {
                                  value: totalAmount.toFixed(2),
                                  currency_code: "USD",
                                },
                              },
                            ],
                          });
                        }}
                        onApprove={async (data, actions) => {
                          try {
                            const details = await actions.order.capture();
                            console.log("PayPal capture successful:", details);
                            await handleApprove(details);
                          } catch (error) {
                            console.error("PayPal capture error:", error);
                            alert("❌ Payment capture failed. Please try again.");
                          }
                        }}
                        onError={(err) => {
                          console.error("PayPal SDK error:", err);
                          alert("❌ PayPal loading failed. Please refresh the page.");
                        }}
                        onCancel={(data) => {
                          console.log("Payment cancelled by user:", data);
                        }}
                      />
                    </PayPalScriptProvider>
                  ) : (
                    <div className="error">
                      ❌ PayPal is not configured properly.
                    </div>
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
