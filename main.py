import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="DealBazaar API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to your Vercel URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Database
products = [
    {"id": 1, "name": "Wireless Headphones", "price": 49.99, "category": "Electronics", "seller": "TechWorld", "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"},
    {"id": 2, "name": "Classic T-Shirt", "price": 19.99, "category": "Fashion", "seller": "StyleHub", "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"},
]

@app.get("/products")
async def get_products():
    return products

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
