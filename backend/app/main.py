import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.config import settings
from app.database import init_db
from app.services.llm_provider import ConfigurationError

logging.basicConfig(level=logging.INFO if not settings.DEBUG else logging.DEBUG)
logger = logging.getLogger("claimscope")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager: sets up database tables on startup."""
    logger.info("Initializing ClaimScope database...")
    try:
        await init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.warning("Database initialization skipped or encountered error: %s", e)
    yield
    logger.info("ClaimScope API shutting down.")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="US P&C Auto Accident Claim Investigation Platform API",
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handlers
    @app.exception_handler(ConfigurationError)
    async def configuration_error_handler(request: Request, exc: ConfigurationError):
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": str(exc)},
        )

    # Root & Health check
    @app.get("/", tags=["health"])
    @app.get("/health", tags=["health"])
    async def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": "debug" if settings.DEBUG else "production",
        }

    # Mount API routers
    app.include_router(api_router)

    return app


app = create_app()
