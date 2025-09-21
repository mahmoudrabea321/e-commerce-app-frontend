import { Routes, Route } from "react-router-dom";
import ShoppingCart from "./pages/ShoppingCart";
import HomePage from "./pages/HomePage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import SignInPage from "./pages/signInPage.jsx";
import SignUp from "./pages/SignUp.jsx";
import { UserProvider } from "./context/UserContext";
import ShippingPage from "./pages/ShippingPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import OrderPage from "./pages/OrderPage.jsx";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import OrderHistoryPage from './pages/orderHistoryPage.jsx'
import ProfilePage from "./pages/profilePage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProducts from "./pages/admin/AdminProducts.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminAddProduct from "./pages/admin/AdminAddProduct.jsx";
import AdminEditProduct from "./pages/admin/AdminEditProduct.jsx";

function App() {
  return (
    <UserProvider>
      <PayPalScriptProvider options={{ "client-id": "test" }}>
        <main>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<ShoppingCart />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/shipping" element={<ShippingPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/order/:id" element={<OrderPage />} />
            <Route path="/orderHistory" element={<OrderHistoryPage />} />
            <Route path="/profilePage" element={<ProfilePage />} />
            <Route path="/category/:category" element={<CategoryPage />} />

            {/* Admin Pages */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/add-product" element={<AdminAddProduct />} />
            <Route path="//AdminEditProduct/:id" element={<AdminEditProduct />} />

          </Routes>
        </main>
      </PayPalScriptProvider>
    </UserProvider>
  );
}

export default App;
