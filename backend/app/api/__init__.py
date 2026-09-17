from .auth import router as auth_router
from .routes import router as routes_router
from .stations import router as stations_router
from .live import router as live_router
from .predict import router as predict_router
from .journeys import router as journeys_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "routes_router",
    "stations_router",
    "live_router",
    "predict_router",
    "journeys_router",
    "admin_router"
]
