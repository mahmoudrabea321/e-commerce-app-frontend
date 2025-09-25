// Fixed OrderPage component - removed unused navigate import
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OrderPage.css";
import { useParams } from "react-router-dom"; // Removed useNavigate
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
    console.log("NODE_ENV:", import.meta.env.MODE);
  }, [paypalClientId]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          setError("Order ID is missing");
          setLoading(false);
          return;
        }

        if (!userInfo?.token) {
          setError("Please log in to view this order");
          setLoading(false);
          return;
        }

        console.log("=== ORDER FETCH DEBUG ===");
        console.log("Fetching order with ID:", orderId);
        console.log("User token exists:", !!userInfo?.token);
        console.log("API URL:", API);

        const { data } = await axios.get(`${API}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        console.log("✅ Order fetched successfully:", data);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error("❌ Order fetch error:", err);
        setError(err.response?.data?.message || "Failed to fetch order details");
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, userInfo]);

  // Check if order is already paid
  const isOrderPaid = order?.isPaid;

  const handleApprove = async (details) => {
    try {
      setPaying(true);
      console.log("PayPal approval details:", details);
      
      const paymentResult = {
        id: details.id,
        status: details.status,
        update_time: details.update_time || new Date().toISOString(),
        email_address: details.payer?.email_address,
      };

      console.log("Sending payment result to backend:", paymentResult);

      const response = await axios.put(
        `${API}/api/orders/${order._id}/pay`,
        paymentResult,
        {
          headers: { 
            Authorization: `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.status === 200) {
        console.log("✅ Payment successful! Order updated:", response.data);
        alert("✅ Payment successful! Order updated.");
        setOrder(response.data);
        // You can add navigation here if needed in the future:
        // navigate(`/order-confirmation/${order._id}`);
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage = error.response?.data?.message || "Payment failed. Please try again.";
      alert(`❌ ${errorMessage}`);
    } finally {
      setPaying(false);
    }
  };

  const createOrder = (data, actions) => {
    const subtotal = order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0;
    const total = subtotal + 15;
    
    return actions.order.create({
      purchase_units: [{
        amount: {
          value: total.toFixed(2),
          currency_code: "USD",
          breakdown: {
            item_total: {
              value: subtotal.toFixed(2),
              currency_code: "USD"
            },
            shipping: {
              value: "10.00",
              currency_code: "USD"
            },
            tax_total: {
              value: "5.00",
              currency_code: "USD"
            }
          }
        },
        items: order?.orderItems?.map(item => ({
          name: item.name,
          unit_amount: {
            value: item.price.toFixed(2),
            currency_code: "USD"
          },
          quantity: item.qty.toString(),
          sku: item.product || "item"
        })) || []
      }]
    });
  };

  const onApprove = async (data, actions) => {
    try {
      const details = await actions.order.capture();
      await handleApprove(details);
    } catch (error) {
      console.error("PayPal capture error:", error);
      alert("❌ Payment capture failed. Please try again.");
    }
  };

  const onError = (err) => {
    console.error("PayPal error:", err);
    alert("❌ Payment system error. Please try again or use another payment method.");
  };

  if (loading) return <div className="loading">Loading order details...</div>;
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
              {!isOrderPaid ? (
                <>
                  {paying && <div className="loading">Processing payment...</div>}
                  
                  {paypalClientId && paypalClientId.startsWith('A') ? (
                    <div className="paypal-container">
                      <h3 className="payment-title">Secure Payment</h3>
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
                            label: "paypal",
                            height: 40
                          }}
                          createOrder={createOrder}
                          onApprove={onApprove}
                          onError={onError}
                          disabled={paying}
                        />
                      </PayPalScriptProvider>
                      <div className="security-notice">
                        <p>🔒 Your payment is secure and encrypted</p>
                      </div>
                    </div>
                  ) : (
                    <div className="error">
                      <h3>❌ Payment System Unavailable</h3>
                      <p>Invalid PayPal client ID configuration.</p>
                      <p>Please contact support.</p>
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