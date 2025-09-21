import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../../config.js";
import { useParams, useNavigate } from "react-router-dom";
import "./AdminEditProduct.css";

const AdminEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  useEffect(() => {
    if (!userInfo?.isAdmin) {
      navigate("/signin");
      return;
    }

    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`${API}/api/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setProduct(data);
      } catch (err) {
        console.error(" Error fetching product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, userInfo?.token, userInfo?.isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put(
        `${API}/api/admin/products/${id}`,
        product,
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      alert("✅ Product updated successfully!");
      navigate("/admin/products");
    } catch (err) {
      console.error(" Error updating product:", err);
      alert("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>⏳ Loading product...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!product) return <p>Product not found</p>;

  return (
    <div className="admin-wrapper">
      <div className="admin-card">
        <h1>Edit Product</h1>
        <form className="admin-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              value={product.price}
              onChange={(e) =>
                setProduct({ ...product, price: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              value={product.category}
              onChange={(e) =>
                setProduct({ ...product, category: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Brand</label>
            <input
              value={product.brand}
              onChange={(e) =>
                setProduct({ ...product, brand: e.target.value })
              }
            />
          </div>

          <div className="form-group full-width">
            <label>Stock</label>
            <input
              type="number"
              value={product.countInStock}
              onChange={(e) =>
                setProduct({ ...product, countInStock: e.target.value })
              }
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "⏳ Saving..." : "💾 Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditProduct;
