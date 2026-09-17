"""KMLR – AI-Enabled Unified Multimodal Urban Mobility Platform for the Kochi Metropolitan Region.

Main FastAPI Application.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .api import (
    auth_router,
    routes_router,
    stations_router,
    live_router,
    predict_router,
    journeys_router,
    admin_router
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KMLR - Kochi Multimodal Urban Mobility API",
    description="Unified Multimodal Routing, AI Travel/Delay Predictions, and Real-Time Transit Simulation Engine for Kochi",
    version="1.0.0"
)

# CORS configuration to allow local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(routes_router)
app.include_router(stations_router)
app.include_router(live_router)
app.include_router(predict_router)
app.include_router(journeys_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "platform": "KMLR - Kochi Metropolitan Urban Mobility Platform",
        "version": "1.0.0",
        "status": "online",
        "simulation_mode": True,
        "supported_modes": [
            "Kochi Metro",
            "Kochi Water Metro",
            "Feeder Buses",
            "Auto-rickshaws",
            "Walking",
            "Cycling"
        ],
        "documentation": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected", "ml_models": "loaded"}
