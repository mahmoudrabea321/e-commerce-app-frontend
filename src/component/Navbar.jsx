import React, { useContext, useState, useEffect } from "react";
import { ShoppingCart, Menu, X } from "lucide-react";
import { CartContext } from "../context/CartContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";
import "./Navbar.css";

const Navbar = () => {
  const { cartCount } = useContext(CartContext);
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get("/api/categories");
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error.message);
      }
    };
    fetchCategories();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/category/${search}`);
      setSearch("");
    }
  };

  return (
    <>
      <header className="navbar">
        <button className="hamburger" onClick={() => setIsOpen(true)}>
          <Menu size={28} />
        </button>

        <Link to={"/"}>
          <div className="logo">Zelia</div>
        </Link>

        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <Link to={"/cart"}>
          <div className="cart">
            <ShoppingCart size={20} /> Cart ({cartCount})
          </div>
        </Link>

        <nav>
          {user ? (
            <div className="user-menu-wrapper">
              <span
                className="username"
                onClick={() => setShowUserMenu((prev) => !prev)}
              >
                Hello, {user.name} ▼
              </span>

              {showUserMenu && (
                <div className="user-dropdown">
                  <Link
                    to="/profilePage"
                    onClick={() => setShowUserMenu(false)}
                    className="blackBtn"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/orderHistory"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Order History
                  </Link>

                  {user.isAdmin && (
                    <>
                      <hr />
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Admin Dashboard
                      </Link>
                      <Link
                        to="/admin/products"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Manage Products
                      </Link>
                      <Link
                        to="/admin/orders"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Manage Orders
                      </Link>
                      <Link
                        to="/admin/users"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Manage Users
                      </Link>


                    </>
                  )}

                  <button onClick={handleLogout} className="redBtn">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to={`/signin?redirect=${location.pathname}`}>Sign In</Link>
              <Link to="/signup">Sign Up</Link>
            </>
          )}
        </nav>
      </header>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setIsOpen(false)}>
          <X size={28} />
        </button>
        <h3>Categories</h3>
        <ul>
          {categories.length > 0 ? (
            categories.map((cat) => (
              <li key={cat}>
                <Link to={`/category/${cat}`} onClick={() => setIsOpen(false)}>
                  {cat}
                </Link>
              </li>
            ))
          ) : (
            <li>No categories found</li>
          )}
        </ul>
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default Navbar;
