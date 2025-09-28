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

  const paypalClientId =
    import.meta.env.VITE_PAYPAL_CLIENT_ID ||
    "AXgjXvV9ul6KUiTw9uKwpKuMObDmWqw3_ZuF9V-v6W1xW76I-tSdx8EnAvO3lVmaRqIEmD0QDAB33fCJ";

  useEffect(() => {
    console.log("=== ENVIRONMENT VARIABLES DEBUG ===");
    console.log("VITE_PAYPAL_CLIENT_ID:", import.meta.env.VITE_PAYPAL_CLIENT_ID);
    console.log("PayPal Client ID to be used:", paypalClientId);
    console.log("Client ID length:", paypalClientId.length);
    console.log("Client ID starts with:", paypalClientId.substring(0, 10));
  }, [orderId, userInfo, paypalClientId]);

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
          name: details.payer?.name,
        },
      };

      const response = await axios.put(
        `${API}/api/orders/${order._id}/pay`,
        paymentResult,
        {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.status === 200) {
        alert("✅ Payment successful! Order updated.");
        setOrder(response.data);
      } else {
        throw new Error(`Server returned status: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Payment error details:", error);

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

        {/* Shipping Info */}
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

        {/* Order Items */}
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

        {/* Summary + Payment */}
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
                  {(order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0) + 15}
                </span>
              </h3>
            </div>

            <div className="summary-payment">
              {!order.isPaid ? (
                <>
                  {paying && <div className="loading">Processing payment...</div>}

                  <div className="paypal-box">
                    <h4>Secure Payment</h4>
                    <p className={`paypal-status ${paypalClientId ? "success" : "failed"}`}>
                      {paypalClientId ? "✅ Ready" : "❌ Not Configured"}
                    </p>

                    {paypalClientId ? (
                      <div className="paypal-buttons">
                        <PayPalScriptProvider
                          options={{
                            "client-id": paypalClientId,
                            currency: "USD",
                            intent: "capture",
                          }}
                        >
                          <PayPalButtons
                            style={{
                              layout: "vertical",
                              color: "gold",
                              shape: "rect",
                              height: 45,
                            }}
                            fundingSource="paypal"
                            createOrder={(data, actions) => {
                              const totalAmount =
                                (order?.orderItems?.reduce(
                                  (a, c) => a + c.price * c.qty,
                                  0
                                ) || 0) + 15;

                              return actions.order.create({
                                purchase_units: [
                                  {
                                    amount: {
                                      value: totalAmount.toFixed(2),
                                      currency_code: "USD",
                                    },
                                    items:
                                      order?.orderItems?.map((item) => ({
                                        name: item.name,
                                        unit_amount: {
                                          value: item.price.toFixed(2),
                                          currency_code: "USD",
                                        },
                                        quantity: item.qty.toString(),
                                      })) || [],
                                    custom_id: order._id,
                                  },
                                ],
                              });
                            }}
                            onApprove={async (data, actions) => {
                              const details = await actions.order.capture();
                              await handleApprove(details);
                            }}
                            onError={(err) => {
                              console.error("❌ PayPal SDK error:", err);
                              alert("❌ PayPal failed to load. Please refresh and try again.");
                            }}
                            onCancel={() => {
                              alert("Payment was cancelled. You can try again anytime.");
                            }}
                          />
                        </PayPalScriptProvider>
                      </div>
                    ) : (
                      <div className="error">
                        ❌ PayPal Configuration Error. Please check your .env file.
                      </div>
                    )}
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

