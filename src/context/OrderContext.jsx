/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const [shippingInfo, setShippingInfo] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [cart, setCart] = useState([]);

  const saveShippingInfo = (info) => {
    setShippingInfo(info);
  };

  const savePaymentInfo = (info) => {
    setPaymentInfo(info);
  };

  const placeOrder = async () => {
    try {
      const orderData = {
        orderItems: cart.map((item) => ({
          name: item.name,
          qty: item.qty || 1,
          price: item.price,
          product: item._id,
          image: item.image,
        })),
        shipping: shippingInfo,
        payment: paymentInfo,
        totalPrice: cart.reduce(
          (acc, item) => acc + (item.qty || 1) * item.price,
          0
        ),
      };

      const { data } = await axios.post('/api/orders', orderData);
      console.log('Order placed:', data);
      return data;
    } catch (error) {
      console.error('Error placing order:', error.response?.data || error.message);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        shippingInfo,
        paymentInfo,
        saveShippingInfo,
        savePaymentInfo,
        placeOrder,
        cart,
        setCart,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
