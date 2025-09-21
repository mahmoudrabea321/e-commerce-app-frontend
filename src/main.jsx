import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import CartProvider from "./context/CartProvider";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toaster } from 'react-hot-toast';
import { OrderProvider } from './context/OrderContext.jsx';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <OrderProvider>
          <App />
          <Toaster position="top-center" reverseOrder={false} />
        </OrderProvider>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
