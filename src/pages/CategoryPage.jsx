import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Rating from "../component/Rating";
import Navbar from "../component/Navbar";
import { CartContext } from "../context/CartContext";
import "./HomePage.css"; 
import { API } from "../config";

const CategoryPage = () => {
  const { category } = useParams(); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/api/products?category=${category}`);
        setProducts(Array.isArray(data) ? data : data.products || []);
      } catch (error) {
        console.error("Error fetching category products:", error.message);
        setProducts([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category]);

  return (
    <div>
      <Navbar />
      
      <section className="hero">
        <div className="hero-content">
          <h1>Products in "{category}"</h1>
          <p>Discover amazing products in this category</p>
        </div>
      </section>

      <section className="products-section">
        <h2 className="section-title">{category} Products</h2>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : Array.isArray(products) && products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product._id || product.slug} className="product-card">
                <img src={`${API}${product.image}`} alt={product.name} />
                <Link to={`/product/${product.slug}`}>
                  <h3>{product.name}</h3>
                  <Rating value={product.rating} numReviews={product.numReviews} />
                </Link>
                <p className="price">${product.price}</p>
                {product.countInStock === 0 ? (
                  <button disabled className="btn-disabled">
                    Out of Stock
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() =>
                      addToCart({ ...product, price: Number(product.price) })
                    }
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="loading">No products found in this category.</p>
        )}
      </section>
    </div>
  );
};

export default CategoryPage;