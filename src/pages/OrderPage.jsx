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

        console.log("=== ORDER FETCH DEBUG ===");
        console.log("Fetching order with ID:", orderId);
        console.log("User token exists:", !!userInfo?.token);
        console.log("API URL:", API);

        const { data } = await axios.get(`${API}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        });

        console.log("✅ Order fetched successfully:", data);
        console.log("Order is paid:", data.isPaid);
        console.log("Order total items:", data.orderItems?.length);
        console.log("Order total amount:", (data.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15);
        
        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error("❌ Order fetch error:", err);
        console.error("Error response:", err.response?.data);
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
      console.log("=== PAYPAL APPROVAL DEBUG ===");
      console.log("PayPal approval details:", details);
      
      if (!details.id || !details.status) {
        throw new Error("Invalid payment details received from PayPal");
      }

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

      console.log("Sending payment data to backend for order:", order._id);
      console.log("Payment data:", paymentResult);
      
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

      console.log("✅ Backend response:", response.data);
      
      if (response.status === 200) {
        alert("✅ Payment successful! Order updated.");
        setOrder(response.data);
      } else {
        throw new Error(`Server returned status: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Payment error details:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "❌ Payment failed. Please try again.";
      
      if (error.response?.status === 404) {
        errorMessage = "❌ Order not found. Please contact support.";
      } else if (error.response?.status === 401) {
        errorMessage = "❌ Session expired. Please log in again.";
      } else if (error.response?.data?.message) {
        errorMessage = `❌ Payment failed: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `❌ Payment failed: ${error.message}`;
      }
      
      alert(errorMessage);
      
      if (error.response?.status === 404) {
        setTimeout(() => {
          window.location.href = '/orders';
        }, 3000);
      }
    } finally {
      setPaying(false);
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
                  
                  {/* PayPal Payment Section - Clean and Professional */}
                  {paypalClientId ? (
                    <div className="payment-section">
                      <h3 className="payment-title">Secure Payment</h3>
                      <p className="payment-subtitle">Pay safely with PayPal</p>
                      
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
                            console.log("💰 Creating PayPal order for amount:", total.toFixed(2));
                            
                            return actions.order.create({
                              purchase_units: [
                                {
                                  amount: {
                                    value: total.toFixed(2),
                                    currency_code: "USD",
                                  },
                                  custom_id: order._id,
                                  description: `Order #${order._id.substring(0, 8)}`
                                },
                              ],
                              application_context: {
                                shipping_preference: "NO_SHIPPING",
                                user_action: "PAY_NOW",
                              }
                            });
                          }}
                          onApprove={async (data, actions) => {
                            try {
                              console.log("✅ PayPal order approved:", data.orderID);
                              
                              await new Promise(resolve => setTimeout(resolve, 500));
                              
                              const details = await actions.order.capture();
                              console.log("💰 PayPal capture successful:", details);
                              
                              await handleApprove(details);
                              
                            } catch (error) {
                              console.error("❌ PayPal capture error:", error);
                              alert("❌ Payment failed. Please try again.");
                            }
                          }}
                          onError={(err) => {
                            console.error("❌ PayPal SDK error:", err);
                            alert("❌ Payment system error. Please refresh the page.");
                          }}
                          onCancel={(data) => {
                            console.log("⚠️ Payment cancelled by user:", data);
                          }}
                        />
                      </PayPalScriptProvider>
                      
                      <div className="security-notice">
                        <p>🔒 Your payment is secure and encrypted</p>
                      </div>
                    </div>
                  ) : (
                    <div className="error" style={{padding: '15px', textAlign: 'center'}}>
                      <h3>❌ Payment System Unavailable</h3>
                      <p>Please try again later or contact support.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="paid-success">
                  <p className="paid-msg">✅ Order already paid</p>
                  <p>Paid on: {new Date(order.paidAt).toLocaleDateString()}</p>
                  {order.paymentResult && (
                    <p>Transaction ID: {order.paymentResult.id.substring(0, 15)}...</p>
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