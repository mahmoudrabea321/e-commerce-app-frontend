import React, { useState, useMemo, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import "./PaymentPage.css";
import { CartContext } from "../context/CartContext";
import { API } from "../config"; 

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [token, setToken] = useState("");
  const [shippingData, setShippingData] = useState(null);
  
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedShipping = localStorage.getItem("shippingData");
    
    if (cartItems.length === 0) {
      console.warn("WARNING: Cart is empty! Redirecting to cart page.");
      toast.error("Your cart is empty");
      navigate('/cart');
    }

    if (storedToken) setToken(storedToken);
    else {
      toast.error("Unauthorized, please login again!");
      navigate("/signin");
    }

    if (storedShipping) {
      setShippingData(JSON.parse(storedShipping));
    } else {
      toast.error("Please enter shipping info first");
      navigate("/shipping");
    }
  }, [navigate, cartItems]);

  const computedTotal = useMemo(() => {
    return cartItems.reduce(
      (acc, it) => acc + (Number(it.price) || 0) * (it.quantity || 1),
      0
    );
  }, [cartItems]);

  const validateCard = () => {
    if (!/^\d{12,19}$/.test(cardNumber.replace(/\s+/g, ""))) {
      toast.error("Please enter a valid card number (12–19 digits).");
      return false;
    }
    if (!/^\d{2}\/\d{2,4}$/.test(expiry)) {
      toast.error("Please enter expiry in MM/YY or MM/YYYY format.");
      return false;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      toast.error("Please enter a valid CVV (3–4 digits).");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (paymentMethod === "card" && !validateCard()) return;

    try {
      const orderPayload = {
        orderItems: cartItems.map(item => ({
          name: item.name,
          qty: item.quantity || 1,
          price: item.price,
          product: item._id 
        })),
        shipping: shippingData,
        payment: {
          method: paymentMethod,
          details: paymentMethod === "card" 
            ? { cardNumber: "**** **** **** " + cardNumber.slice(-4), expiry }
            : null,
        },
        totalPrice: computedTotal,
      };

      const { data: savedOrder } = await axios.post(`${API}/api/orders`, orderPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Order placed successfully!");
      navigate(`/order/${savedOrder._id}`, { replace: true });
    } catch (error) {
      console.error("Order error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to place order");
    }
  };

  return (
    <div className="payment-container">
      <form onSubmit={handleSubmit} className="payment-form">
        <h2>💳 Payment Information</h2>

        <div className="payment-options">
          <label className={`option ${paymentMethod === "paypal" ? "active" : ""}`}>
            <input
              type="radio"
              name="payment"
              value="paypal"
              checked={paymentMethod === "paypal"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>PayPal</span>
          </label>

          <label className={`option ${paymentMethod === "card" ? "active" : ""}`}>
            <input
              type="radio"
              name="payment"
              value="card"
              checked={paymentMethod === "card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>Credit / Debit Card</span>
          </label>
        </div>

        {paymentMethod === "card" && (
          <div className="card-details">
            <div className="form-row">
              <label>Card Number</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </div>
            <div className="form-row small">
              <label>Expiry (MM/YY)</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
              <label>CVV</label>
              <input
                type="password"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
              />
            </div>
          </div>
        )}

        <button type="submit" className="submit-btn">
          ✅ Complete Order
        </button>
      </form>
    </div>
  );
};

export default PaymentPage;