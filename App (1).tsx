import React, { useState, useEffect } from 'react';

const App = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Backend not started? Using dummy data.");
        setProducts([
            {id: 1, name: "Wireless Headphones", price: 49.99, category: "Electronics", seller: "TechWorld", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"},
            {id: 2, name: "Classic T-Shirt", price: 19.99, category: "Fashion", seller: "StyleHub", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"},
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">DealBazaar</h1>
          <div className="space-x-4">
            <button className="text-slate-600 hover:text-indigo-600">Browse</button>
            <button className="bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700 transition">Join to Sell</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-12 text-center">
            <h2 className="text-4xl font-extrabold mb-4">Discover Amazing Deals</h2>
            <p className="text-slate-500">Fast, secure, and open-source marketplace.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition">
              <img src={p.image} alt={p.name} className="w-full h-48 object-cover rounded-xl mb-4" />
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-slate-500 text-sm">{p.seller}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-indigo-600">${p.price}</span>
                <button className="bg-slate-100 text-slate-800 px-4 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition">Buy Now</button>
              </div>
            </div>
          ))}
        </section>
      </main>
      
      <footer className="py-8 border-t border-slate-200 mt-12 text-center text-slate-400 text-sm">
        <p>Terms of Service: This is an open-source marketplace. The platform owner is not responsible for seller fraud.</p>
      </footer>
    </div>
  );
};

export default App;
