import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Rating from "../component/Rating";
import Navbar from "../component/Navbar";
import { CartContext } from "../context/CartContext";
import "./HomePage.css"; 
import { API } from "../config"; // ✅ ADDED IMPORT

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
      <h2>Products in "{category}"</h2>

      {loading ? (
        <p>Loading...</p>
      ) : Array.isArray(products) && products.length > 0 ? ( 
        <div className="products">
          {products.map((product) => (
            <div key={product._id || product.slug} className="product">
              <img src={`${API}${product.image}`} alt={product.name} />
              <Link to={`/product/${product.slug}`}>
                <h3>{product.name}</h3>
                <Rating value={product.rating} numReviews={product.numReviews} />
              </Link>
              <p>${product.price}</p>
              {product.countInStock === 0 ? (
                <button disabled variant="light">
                  Out of Stock
                </button>
              ) : (
                <button
                  className="btn"
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
        <p>No products found in this category.</p>
      )}
    </div>
  );
};

export default CategoryPage;