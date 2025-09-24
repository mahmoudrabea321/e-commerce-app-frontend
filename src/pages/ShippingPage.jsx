import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './ShippingPage.css';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { API } from '../config'; 

const ShippingPage = () => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return setError('Please enter your full name');
    if (!address.trim()) return setError('Please enter your address');
    if (!country.trim()) return setError('Please enter your country');
    if (!city.trim()) return setError('Please enter your city');
    if (!/^\d{5}(-\d{4})?$/.test(postalCode)) {
      return setError('Please enter a valid postal code (e.g. 12345 or 12345-6789)');
    }

    setError('');
    setLoading(true);

    const shippingInfo = { name, address, country, city, postalCode };
    localStorage.setItem('shippingData', JSON.stringify(shippingInfo));

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized, please login again!");
        navigate("/signin");
        return;
      }

      const orderPayload = {
        orderItems: cartItems.map(item => ({
          name: item.name,
          qty: item.quantity || 1,
          price: item.price,
          product: item._id,
          image: item.image
        })),
        shipping: shippingInfo,
        payment: { method: "Cash On Delivery" }, 
        totalPrice: cartItems.reduce(
          (acc, it) => acc + (Number(it.price) || 0) * (it.quantity || 1),
          0
        ),
      };

      const { data: savedOrder } = await axios.post(`${API}/api/orders`, orderPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Order placed successfully!');
      navigate(`/order/${savedOrder._id}`);
    } catch (err) {
      console.error("Order error:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shipping-container">
      <form className="shipping-form" onSubmit={handleSubmit}>
        <h2>Shipping Information</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address *</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="country">Country *</label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="city">City *</label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="postalCode">Postal Code *</label>
          <input
            id="postalCode"
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};

export default ShippingPage;