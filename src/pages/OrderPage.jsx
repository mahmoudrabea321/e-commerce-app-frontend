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
        alert("Payment successful! Order updated.");
        setOrder(response.data);
      } else {
        throw new Error(`Server returned status: ${response.status}`);
      }
    } catch (error) {
      console.error("Payment error details:", error);
      
      let errorMessage = "Payment failed. Please try again.";
      
      if (error.response?.status === 404) {
        errorMessage = "Order not found. Please contact support.";
      } else if (error.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (error.response?.data?.message) {
        errorMessage = `Payment failed: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Payment failed: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="loading">Loading order details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!order) return <div className="error">No order found</div>;

  const subtotal = order?.orderItems?.reduce((a, c) => a + c.price * c.qty, 0) || 0;
  const shipping = 10;
  const tax = 5;
  const total = subtotal + shipping + tax;

  return (
    <>
      <Navbar />
      <div className="order-page">
        <div className="order-header">
          <h1 className="page-title">Order #${orderId}</h1>
          <div className={`order-status ${order.isPaid ? 'paid' : 'pending'}`}>
            {order.isPaid ? 'Paid' : 'Pending Payment'}
          </div>
        </div>

        <div className="order-layout">
          {/* Left Column - Order Details */}
          <div className="order-details-column">
            <div className="order-section">
              <div className="section-header">
                <h2>Shipping Information</h2>
              </div>
              <div className="order-info">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{order?.shipping?.name || "N/A"}</span>
                </div>
                <div className="info-row">
                  <span className="label">Address:</span>
                  <span className="value">{order?.shipping?.address || "N/A"}</span>
                </div>
                <div className="info-row">
                  <span className="label">City:</span>
                  <span className="value">{order?.shipping?.city || "N/A"}</span>
                </div>
                <div className="info-row">
                  <span className="label">Postal Code:</span>
                  <span className="value">{order?.shipping?.postalCode || "N/A"}</span>
                </div>
                <div className="info-row">
                  <span className="label">Country:</span>
                  <span className="value">{order?.shipping?.country || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="order-section">
              <div className="section-header">
                <h2>Order Items</h2>
              </div>
              <div className="order-items">
                {order?.orderItems?.length > 0 ? (
                  order.orderItems.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">Qty: {item.qty}</span>
                      </div>
                      <span className="item-price">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-items">No items found in this order</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payment Section */}
          <div className="payment-column">
            <div className="order-section payment-section">
              <div className="section-header">
                <h2>Order Summary</h2>
              </div>
              
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="price-row">
                  <span>Shipping:</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="price-row">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="price-row total">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Processing */}
              {paying && (
                <div className="payment-processing">
                  <div className="spinner"></div>
                  <p>Processing your payment...</p>
                </div>
              )}

              {/* Payment Section */}
              {!order.isPaid ? (
                <div className="payment-interface">
                  {/* Configuration Status */}
                  <div className="payment-config-status">
                    <div className="status-header">
                      <span className="status-icon">⚙️</span>
                      <span>Payment Gateway Status</span>
                    </div>
                    <div className="status-details">
                      <div className="status-item">
                        <span className="label">PayPal Integration:</span>
                        <span className={`status ${paypalClientId ? 'success' : 'error'}`}>
                          {paypalClientId ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {paypalClientId && (
                        <div className="status-item">
                          <span className="label">Client ID:</span>
                          <span className="client-id">
                            {paypalClientId.substring(0, 8)}...{paypalClientId.substring(paypalClientId.length - 8)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PayPal Payment Section */}
                  <div className="paypal-payment-section">
                    <div className="payment-header">
                      <h4>Secure Payment</h4>
                      <div className="secure-badge">
                        <span className="lock-icon">🔒</span>
                        <span>SSL Secured</span>
                      </div>
                    </div>
                    
                    <div className="payment-methods">
                      <div className="method-label">
                        <span>Pay with:</span>
                        <div className="paypal-logo">
                          <span>Pay</span>
                          <span>Pal</span>
                        </div>
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
                                color: "blue",
                                shape: "rect",
                                height: 48,
                                label: "paypal",
                                tagline: false
                              }}
                              createOrder={(data, actions) => {
                                return actions.order.create({
                                  purchase_units: [
                                    {
                                      amount: {
                                        value: total.toFixed(2),
                                        currency_code: "USD",
                                        breakdown: {
                                          item_total: {
                                            value: subtotal.toFixed(2),
                                            currency_code: "USD"
                                          },
                                          shipping: {
                                            value: shipping.toFixed(2),
                                            currency_code: "USD"
                                          },
                                          tax_total: {
                                            value: tax.toFixed(2),
                                            currency_code: "USD"
                                          }
                                        }
                                      },
                                      items: order?.orderItems?.map(item => ({
                                        name: item.name.substring(0, 127), // PayPal limit
                                        unit_amount: {
                                          value: item.price.toFixed(2),
                                          currency_code: "USD"
                                        },
                                        quantity: item.qty.toString(),
                                        category: "PHYSICAL_GOODS"
                                      })) || [],
                                      description: `Order #${order._id}`
                                    },
                                  ],
                                  application_context: {
                                    shipping_preference: "NO_SHIPPING",
                                    user_action: "PAY_NOW",
                                    brand_name: "Your Store"
                                  }
                                });
                              }}
                              onApprove={async (data, actions) => {
                                try {
                                  const details = await actions.order.capture();
                                  await handleApprove(details);
                                } catch (error) {
                                  console.error("Payment capture error:", error);
                                  alert("Payment processing failed. Please try again.");
                                }
                              }}
                              onError={(err) => {
                                console.error("PayPal SDK error:", err);
                                alert("Payment system unavailable. Please try again later.");
                              }}
                              onCancel={() => {
                                console.log("Payment cancelled by user");
                              }}
                            />
                          </PayPalScriptProvider>
                        </div>
                      ) : (
                        <div className="payment-error">
                          <div className="error-icon">⚠️</div>
                          <div className="error-content">
                            <h4>Payment System Unavailable</h4>
                            <p>We're experiencing technical difficulties with our payment processor. Please try again later or contact support.</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="payment-security">
                      <p className="security-note">
                        Your payment information is securely encrypted and processed by PayPal. 
                        We never store your financial details.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="payment-success">
                  <div className="success-icon">✅</div>
                  <div className="success-content">
                    <h4>Payment Successful</h4>
                    <p>Thank you for your purchase! Your order has been confirmed.</p>
                    <div className="payment-details">
                      <p><strong>Paid on:</strong> {new Date(order.paidAt).toLocaleDateString()}</p>
                      {order.paymentResult && (
                        <p className="transaction-id">
                          <strong>Transaction ID:</strong> {order.paymentResult.id}
                        </p>
                      )}
                    </div>
                  </div>
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