import React, { useEffect, useState } from "react";
import { initDB, getProductsByCategory, addToCart, getCart } from "./db";

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    initDB();
    setProducts(getProductsByCategory("All"));
    setCart(getCart());
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
    setCart(getCart());
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>OpenMarket</h1>
      <p>Marketplace is running.</p>

      <h2>Products</h2>

      {products.length === 0 && <p>No products yet</p>}

      {products.map((p) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "10px",
            borderRadius: "10px"
          }}
        >
          <h3>{p.name}</h3>
          <p>Price: ₹{p.price}</p>

          <button onClick={() => handleAddToCart(p)}>
            Add to Cart
          </button>
        </div>
      ))}

      <h2>Cart</h2>
      <p>{cart.length} items</p>
    </div>
  );
}