import React, { useState } from "react";
import { CartContext } from "./CartContext";

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Add product to cart
const addToCart = (product) => {
  setCartItems((prev) => {
    const productId = product._id;
    
    const existingItem = prev.find((item) => item._id === productId);

    if (existingItem) {
      return prev.map((item) =>
        item._id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      return [
        ...prev,
        { 
          ...product, 
          _id: productId,
          price: Number(product.price), 
          quantity: 1 
        },
      ];
    }
  });
};

  // Remove product from cart
  const removeFromCart = (product) => {
  setCartItems((prev) =>
    prev
      .map((item) =>
        item._id === product._id ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter((item) => item.quantity > 0)
  );
};


  const cartCount = cartItems.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  return (
    <CartContext.Provider value={{ cartItems, cartCount, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;