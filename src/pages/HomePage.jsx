import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Rating from "../component/Rating";
import { CartContext } from "../context/CartContext";
import Navbar from "../component/Navbar";
import "./HomePage.css";
import { API } from "../config";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/products`);
        setProducts(res.data);
      } catch (error) {
        console.error("Error fetching products:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Navbar />

      <section className="hero">
        <div className="hero-content">
          <h1>Shop Smart, Live Better</h1>
          <p>Discover top-quality products at unbeatable prices.</p>
          <a href="#products" className="btn-primary">Shop Now</a>
        </div>
      </section>

      <section className="products-section" id="products">
        <h2 className="section-title">Our Products</h2>

        {loading ? (
          <p className="loading">Loading products...</p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.slug} className="product-card">
                <Link to={`/product/${product.slug}`}>
                  <img src={`${API}${product.image}`} alt={product.name} />
                </Link>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <Rating value={product.rating} numReviews={product.numReviews} />
                  <p className="price">${product.price}</p>
                  {product.countInStock === 0 ? (
                    <button disabled className="btn-disabled">Out of Stock</button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => addToCart({ ...product, price: Number(product.price) })}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default HomePage;
