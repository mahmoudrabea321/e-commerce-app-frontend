import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../../config.js";
import { useNavigate } from "react-router-dom";
import "./AdminProducts.css";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  useEffect(() => {
    if (!userInfo?.isAdmin) {
      navigate("/signin");
      return;
    }

    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`${API}/api/admin/products`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setProducts(data);
      } catch (err) {
        console.error(" Error fetching products:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userInfo?.token, userInfo?.isAdmin, navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`${API}/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(" Error deleting product:", err);
      alert("Failed to delete product");
    }
  };

  return (
    <div className="admin-container">
      <h1>🛒 Manage Products</h1>

      <button
        className="btn add"
        onClick={() => navigate("/admin/add-product")}
      >
        ➕ Add New Product
      </button>

      {loading ? (
        <p className="loading">⏳ Loading products...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : products.length === 0 ? (
        <p className="no-data">No products found</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p._id}</td>
                <td>
                  <img
                    src={`${API}${p.image}`}
                    alt={p.name}
                    className="product-img"
                  />
                </td>
                <td>{p.name}</td>
                <td>${p.price}</td>
                <td>{p.category}</td>
                <td>{p.brand}</td>
                <td>{p.countInStock}</td>
                <td>
                  <button
                    className="btn edit"
                    onClick={() => navigate(`/AdminEditProduct/${p._id}`)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn delete"
                    onClick={() => handleDelete(p._id)}
                  >
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminProducts;
