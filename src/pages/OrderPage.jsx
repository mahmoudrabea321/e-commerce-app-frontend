import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OrderPage.css";
import { useParams } from "react-router-dom";
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

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 
                        "AXgjXvV9ul6KUiTw9uKwpKuMObDmWqw3_ZuF9V-v6W1xW76I-tSdx8EnAvO3lVmaRqIEmD0QDAB33fCJ";

  useEffect(() => {
    console.log("=== ENVIRONMENT VARIABLES DEBUG ===");
    console.log("VITE_PAYPAL_CLIENT_ID:", import.meta.env.VITE_PAYPAL_CLIENT_ID);
    console.log("PayPal Client ID to be used:", paypalClientId);
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

        console.log("✅ Order fetched successfully:", data);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error("❌ Order fetch error:", err);
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
      
      const paymentResult = {
        id: details.id,
        status: details.status,
        update_time: details.update_time || new Date().toISOString(),
        email_address: details.payer?.email_address || "unknown@email.com",
        payer: {
          email_address: details.payer?.email_address,
          payer_id: details.payer?.payer_id,
          name: details.payer?.name
        }
      };
      
      const response = await axios.put(
        `${API}/api/orders/${order._id}/pay`,
        paymentResult,
        {
          headers: { 
            Authorization: `Bearer ${userInfo?.token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000, 
        }
      );

      if (response.status === 200) {
        alert("✅ Payment successful! Order updated.");
        setOrder(response.data);
      }
    } catch (error) {
      console.error("❌ Payment error:", error);
      alert("❌ Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="loading">Loading</div>;
  if (error) return <div className="error">{error}</div>;
  if (!order) return <div className="error">No order found</div>;

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
            <p><strong>Name:</strong> {order.shipping?.name || "N/A"}</p>
            <p><strong>Address:</strong> {order.shipping?.address || "N/A"}</p>
            <p><strong>City:</strong> {order.shipping?.city || "N/A"}</p>
            <p><strong>Postal Code:</strong> {order.shipping?.postalCode || "N/A"}</p>
            <p><strong>Country:</strong> {order.shipping?.country || "N/A"}</p>
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
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems?.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${(item.price * item.qty).toFixed(2)}</td>
                </tr>
              ))}
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
                  {paying && <div className="loading">Processing payment</div>}
                  
                  <div className="paypal-status">
                    <h4>🔧 Payment Gateway Status</h4>
                    <p>
                      <strong>Connection:</strong> 
                      <span className={paypalClientId ? "status-success" : "status-failed"}>
                        {paypalClientId ? ' ✅ Established' : ' ❌ Failed'}
                      </span>
                    </p>
                    {paypalClientId && (
                      <p><strong>Gateway:</strong> PayPal Secure Payment</p>
                    )}
                  </div>

                  {paypalClientId ? (
                    <div className="paypal-button-container">
                      <PayPalScriptProvider
                        options={{
                          "client-id": paypalClientId,
                          currency: "USD",
                          intent: "capture",
                          components: "buttons",
                        }}
                      >
                        <PayPalButtons
                          style={{ 
                            layout: "vertical",
                            color: "gold",
                            shape: "rect",
                            height: 45,
                            label: "paypal"
                          }}
                          createOrder={(data, actions) => {
                            return actions.order.create({
                              purchase_units: [{
                                amount: {
                                  value: total.toFixed(2),
                                  currency_code: "USD",
                                },
                                custom_id: order._id,
                                description: `Order #${order._id.substring(0, 8)}`
                              }],
                            });
                          }}
                          onApprove={async (data, actions) => {
                            try {
                              const details = await actions.order.capture();
                              await handleApprove(details);
                            } catch  {
                              alert("❌ Payment failed. Please try again.");
                            }
                          }}
                          onError={() => {
                            alert("❌ Payment system error. Please refresh the page.");
                          }}
                        />
                      </PayPalScriptProvider>
                    </div>
                  ) : (
                    <div className="error">
                      <h3>❌ Payment System Offline</h3>
                      <p>Please contact support for assistance.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="paid-success">
                  <p className="paid-msg">✅ Payment Completed</p>
                  <p>Paid on: {new Date(order.paidAt).toLocaleDateString()}</p>
                  <p>Transaction ID: {order.paymentResult?.id.substring(0, 15)}...</p>
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