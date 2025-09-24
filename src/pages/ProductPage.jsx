import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProductPage.css";
import Navbar from "../component/Navbar.jsx";
import { CartContext } from "../context/CartContext";
import { API } from "../config";

function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart } = useContext(CartContext);

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API}/api/products/${slug}`);
      setProduct(res.data);
    } catch (err) {
      console.error(" Error fetching product:", err.message);
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API}/api/products/${slug}`);
      setProduct(res.data);
    } catch (err) {
      console.error(" Error fetching product:", err.message);
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  };

  if (slug) fetchProduct();
}, [slug]);

  // Submit review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!userInfo) {
      navigate("/signin");
      return;
    }

    try {
      setReviewLoading(true);
      setReviewError("");

      await axios.post(
        `${API}/api/products/${product._id}/reviews`,
        { rating, comment },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
      );

      setRating(0);
      setComment("");
      await fetchProduct(); 
    } catch (err) {
      console.error("Error submitting review:", err);
      setReviewError(
        err.response?.data?.message || "Failed to submit review"
      );
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="loading">⏳ Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="not-found">Product not found</div>;

  return (
    <div>
      <Navbar />
      <div className="product-page">
        <div className="product-container">
          <div className="product-image-section">
            <img
              src={`${API}${product.image}`}
              alt={product.name}
              className="product-image"
            />
          </div>
          <div className="product-details-section">
            <h1 className="product-title">{product.name}</h1>

            <div className="product-rating">
              <span className="rating-stars">
                {"⭐".repeat(Math.round(product.rating || 0))}
                {"☆".repeat(5 - Math.round(product.rating || 0))}
              </span>
              <span className="rating-text">
                {product.numReviews > 0
                  ? `(${product.numReviews} reviews)`
                  : "No reviews yet"}
              </span>
            </div>

            <div className="product-price">
              <span className="price-amount">${product.price}</span>
            </div>

            <div className="product-stock">
              <span
                className={`stock-status ${
                  product.countInStock > 0 ? "in-stock" : "out-of-stock"
                }`}
              >
                {product.countInStock > 0 ? "In Stock" : "Out of Stock"}
              </span>
              {product.countInStock > 0 && (
                <span className="stock-quantity">
                  ({product.countInStock} available)
                </span>
              )}
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            <div className="product-meta">
              <div className="meta-item">
                <span className="meta-label">Brand:</span>
                <span className="meta-value">{product.brand}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="meta-value">{product.category}</span>
              </div>
            </div>

            <div className="product-actions">
              {product.countInStock === 0 ? (
                <button disabled className="btn-disabled add-to-cart-btn">
                  Out of Stock
                </button>
              ) : (
                <button
                  className="btn-primary add-to-cart-btn"
                  onClick={() =>
                    addToCart({ ...product, price: Number(product.price) })
                  }
                >
                  🛒 Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="reviews-section">
          <h2>Customer Reviews</h2>
          {product.reviews.length === 0 && <p>No reviews yet</p>}
          <ul className="review-list">
            {product.reviews.map((review) => (
              <li key={review._id} className="review-item">
                <div className="review-header">
                  <strong>{review.name}</strong>
                  <span className="review-rating">
                    {"⭐".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
                <small className="review-date">
                  {review.createdAt.substring(0, 10)}
                </small>
              </li>
            ))}
          </ul>

          {userInfo ? (
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <h3>Write a Review</h3>
              {reviewError && <p className="error-message">{reviewError}</p>}

              <div className="form-group">
                <label>Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  required
                >
                  <option value="">Select...</option>
                  <option value="1">⭐ Poor</option>
                  <option value="2">⭐⭐ Fair</option>
                  <option value="3">⭐⭐⭐ Good</option>
                  <option value="4">⭐⭐⭐⭐ Very Good</option>
                  <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Comment</label>
                <textarea
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={reviewLoading}>
                {reviewLoading ? "⏳ Submitting..." : "✅ Submit Review"}
              </button>
            </form>
          ) : (
            <p>
              <a href="/signin">Sign in</a> to write a review
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
