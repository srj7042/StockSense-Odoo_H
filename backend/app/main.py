from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import engine, Base, SessionLocal
from app.seed import seed_database
from app.routers import (
    auth, products, categories, warehouses, locations, suppliers,
    receipts, deliveries, transfers, adjustments, stock, alerts,
    reorder, dashboard, search
)

# Initialize Database tables
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title="StockSense API",
    description="Production-Ready Modular Inventory Management System API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(warehouses.router)
app.include_router(locations.router)
app.include_router(suppliers.router)
app.include_router(receipts.router)
app.include_router(deliveries.router)
app.include_router(transfers.router)
app.include_router(adjustments.router)
app.include_router(stock.router)
app.include_router(alerts.router)
app.include_router(reorder.router)
app.include_router(dashboard.router)
app.include_router(search.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "app": "StockSense Inventory API", "version": "1.0.0"}
