import React, { useContext } from "react";
import Navbar from "../component/Navbar";
import { CartContext } from "../context/CartContext";
import { Row, Col } from "react-bootstrap";
import "./ShoppingCart.css";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";

const ShoppingCart = () => {
  const { cartItems, cartCount, addToCart, removeFromCart } =
    useContext(CartContext);
  const { user } = useUser();
  const navigate = useNavigate();

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please sign in to proceed to checkout");
      navigate("/signin?redirect=/shipping"); 
    } else if (cartItems.length === 0) {
      toast.error("Your cart is empty");
    } else {
      navigate("/shipping");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div>
        <Navbar />
        <div className="shopping-page">
          <h2>Your cart is empty</h2>
          <Link to="/">
            <button className="continue-shopping-btn">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="shopping-page">
        <h2 className="page-title">Shopping Cart</h2>

        <div className="cart-container">
          <div className="cart-items">
            {cartItems.map((item) => (
              <Row key={`${item._id}-${item.quantity}`} className="cart-row">
                <Col md={3}>
      
                <Col md={3}>
               <img
                src={`${"http://localhost:5000"}${item.image}`}
                alt={item.name}
                className="cart-img"
                onError={(e) => {
                e.target.src = '/images/placeholder.jpg'; 
                 }}
              />
                </Col>
                </Col>
                <Col md={3} className="item-name">{item.name}</Col>
                <Col md={2}>${Number(item.price).toFixed(2)}</Col>
                <Col md={2}>
                  <button
                    className="qty-btn"
                    onClick={() => removeFromCart(item)}
                  >
                    -
                  </button>

                  <span className="quantity">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => addToCart(item)}
                  >
                    +
                  </button>
                </Col>
                <Col md={2} className="item-total">
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </Col>
              </Row>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <p>
              Total Items: <strong>{cartCount}</strong>
            </p>
            <p>
              Total Price: <strong>${totalPrice.toFixed(2)}</strong>
            </p>

            <button className="checkout-btn" onClick={handleCheckout}>
              {user ? "Proceed to Checkout" : "Sign In to Checkout"}
            </button>

            <Link to="/">
              <button className="continue-shopping-btn">
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;

