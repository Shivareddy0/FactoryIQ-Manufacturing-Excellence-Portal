from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import SessionLocal, engine, Base
from app.core.seed import seed_db
from app.api.v1 import auth, projects, production, quality, supply_chain, after_sales

# Auto-create tables on startup (simplifies SQLite development)
Base.metadata.create_all(bind=engine)

# Seed database with initial baseline data
db = SessionLocal()
try:
    seed_db(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS for local frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production bounds
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(production.router, prefix=f"{settings.API_V1_STR}/production", tags=["production"])
app.include_router(quality.router, prefix=f"{settings.API_V1_STR}/quality", tags=["quality"])
app.include_router(supply_chain.router, prefix=f"{settings.API_V1_STR}/supply-chain", tags=["supply-chain"])
app.include_router(after_sales.router, prefix=f"{settings.API_V1_STR}/after-sales", tags=["after-sales"])

@app.get("/")
def read_root():
    return {"message": "Welcome to FactoryIQ API. Head to /docs for Swagger documentation."}
