import logging
import os
import uuid

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

load_dotenv()

from database import Profile, Project, SessionLocal, engine, project_payload

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("portfolio")

ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PHOTO_BYTES = 2 * 1024 * 1024

STARTER_PROJECTS = [
    {
        "id": "nyatefe",
        "name": "Nyatefe (OSINT Platform)",
        "project_date": "",
        "description": "An OSINT workspace for gathering, organizing, and reviewing publicly available information in one place.",
        "live_url": "",
        "source_url": "",
    },
]

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app = FastAPI(title="Wisdom Kudzo Portfolio API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


def get_db():
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database is not configured")
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def prepare_database() -> None:
    if engine is None:
        logger.warning("DATABASE_URL is not set. Database routes will stay unavailable.")
        return
    from database import Base

    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        if session.get(Profile, 1) is None:
            session.add(Profile(id=1))
        if session.scalar(select(Project.id).limit(1)) is None:
            session.add_all(Project(**project) for project in STARTER_PROJECTS)
        session.commit()


@app.on_event("startup")
def startup() -> None:
    try:
        prepare_database()
    except SQLAlchemyError:
        logger.exception("Could not prepare the PostgreSQL schema")


class ProjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    date: str = ""
    description: str = Field(min_length=1)
    liveUrl: str = ""
    sourceUrl: str = ""


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
def health_db() -> dict[str, str]:
    if engine is None:
        return {"status": "not_configured"}
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("PostgreSQL health check failed")
        return {"status": "unavailable"}
    return {"status": "ok"}


@app.get("/api/profile")
def get_profile(db: Session = Depends(get_db)) -> dict:
    profile = db.get(Profile, 1)
    return {"hasPhoto": bool(profile and profile.photo)}


@app.get("/api/profile/photo")
def get_photo(db: Session = Depends(get_db)) -> Response:
    profile = db.get(Profile, 1)
    if profile is None or not profile.photo:
        raise HTTPException(status_code=404, detail="No profile photo")
    return Response(content=profile.photo, media_type=profile.photo_type or "application/octet-stream")


@app.put("/api/profile/photo")
async def replace_photo(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    if file.content_type not in ALLOWED_PHOTO_TYPES:
        raise HTTPException(status_code=400, detail="Use a JPEG, PNG, or WebP image")
    content = await file.read()
    if not content or len(content) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=400, detail="Image must be under 2 MB")
    profile = db.get(Profile, 1) or Profile(id=1)
    profile.photo = content
    profile.photo_type = file.content_type
    db.add(profile)
    db.commit()
    return {"hasPhoto": True}


@app.get("/api/projects")
def list_projects(db: Session = Depends(get_db)) -> dict:
    rows = db.scalars(select(Project).order_by(Project.created_at.desc())).all()
    return {
        "projects": [project_payload(row) for row in rows if not row.deleted],
        "deleted": [project_payload(row) for row in rows if row.deleted],
    }


@app.post("/api/projects", status_code=201)
def add_project(payload: ProjectIn, db: Session = Depends(get_db)) -> dict:
    project = Project(
        id=str(uuid.uuid4()),
        name=payload.name.strip(),
        project_date=payload.date,
        description=payload.description.strip(),
        live_url=payload.liveUrl.strip(),
        source_url=payload.sourceUrl.strip(),
        deleted=False,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project_payload(project)


def require_project(project_id: str, db: Session) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.post("/api/projects/{project_id}/remove")
def remove_project(project_id: str, db: Session = Depends(get_db)) -> dict:
    project = require_project(project_id, db)
    project.deleted = True
    db.commit()
    return project_payload(project)


@app.post("/api/projects/{project_id}/restore")
def restore_project(project_id: str, db: Session = Depends(get_db)) -> dict:
    project = require_project(project_id, db)
    project.deleted = False
    db.commit()
    return project_payload(project)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
