import os
import sys
import re
from typing import List
import httpx
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field, field_validator
from motor.motor_asyncio import AsyncIOMotorClient

APP_VERSION = "1.1.0"

app = FastAPI(
    title="User Profile App",
    description="FastAPI profile application connected to MongoDB (Docker)",
    version=APP_VERSION
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

# Mount static files (CSS, JS)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Mount uploads directory (Avatar files)
UPLOAD_DIR = os.getenv("UPLOAD_DIR")
if not UPLOAD_DIR:
    if sys.platform == "linux" and os.path.exists("/home/app"):
        UPLOAD_DIR = "/home/uploads"
    else:
        UPLOAD_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Templates configuration
templates = Jinja2Templates(directory=TEMPLATES_DIR)

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

# --- MongoDB Configuration ---
# Lấy URI từ biến môi trường, mặc định kết nối localhost:27017
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "profile_app")

client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[MONGO_DB_NAME]
collection = db["profiles"]

# Profile mặc định ban đầu nếu database còn trống
DEFAULT_PROFILE = {
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "interests": ["FastAPI", "Python", "Docker", "MongoDB", "AI & Machine Learning"]
}

# --- Pydantic Schema ---
class ProfileSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Full name")
    email: str = Field(..., description="Email address")
    interests: List[str] = Field(default_factory=list, description="List of user interests/skills")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip()
        if not re.match(EMAIL_REGEX, v):
            raise ValueError("Địa chỉ email không hợp lệ")
        return v


# --- Helper to get or init profile ---
async def fetch_profile_from_db():
    try:
        profile = await collection.find_one({}, {"_id": 0})
        if not profile:
            # Tạo document mặc định đầu tiên nếu chưa có
            await collection.insert_one(DEFAULT_PROFILE.copy())
            return DEFAULT_PROFILE.copy()
        return profile
    except Exception as e:
        print(f"[MongoDB Warning] Không thể truy vấn MongoDB: {e}")
        # Fallback tạm thời nếu chưa bật container MongoDB
        return DEFAULT_PROFILE.copy()


# --- Routes ---
@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring & CI/CD pipeline tests."""
    db_status = "connected"
    try:
        await client.admin.command('ping')
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy",
        "service": "user-profile-app",
        "version": APP_VERSION,
        "database": db_status
    }


@app.get("/api/version")
async def get_version():
    """Returns application version and metadata."""
    return {
        "version": APP_VERSION,
        "environment": os.getenv("ENVIRONMENT", "production")
    }


# --- Reverse Proxy: chuyển tiếp request /auth sang NestJS (port 3000) ---
NEST_INTERNAL_URL = os.getenv("NEST_INTERNAL_URL", "http://127.0.0.1:3000")

@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_to_nest(request: Request, path: str):
    """Forward /auth requests to internal NestJS service on port 3000."""
    target_url = f"{NEST_INTERNAL_URL}/auth/{path}"
    body = await request.body()

    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=request.query_params
            )
            resp_headers = {k: v for k, v in res.headers.items() if k.lower() not in ("transfer-encoding", "content-encoding", "content-length")}
            return Response(
                content=res.content,
                status_code=res.status_code,
                headers=resp_headers,
                media_type=res.headers.get("content-type")
            )
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"NestJS service error: {str(e)}"
            )


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Render the main profile web page."""
    profile_data = await fetch_profile_from_db()
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"profile": profile_data, "version": APP_VERSION}
    )


@app.get("/api/profile", response_model=ProfileSchema)
async def get_profile():
    """Retrieve current profile information from MongoDB."""
    profile_data = await fetch_profile_from_db()
    return profile_data


@app.put("/api/profile", response_model=ProfileSchema)
async def update_profile(profile_data: ProfileSchema):
    """Update or upsert profile information in MongoDB."""
    try:
        # Chuẩn hoá danh sách sở thích
        cleaned_interests = [item.strip() for item in profile_data.interests if item.strip()]
        
        doc_data = {
            "name": profile_data.name.strip(),
            "email": profile_data.email.strip(),
            "interests": cleaned_interests
        }

        # Lưu / Ghi đè vào MongoDB (upsert=True)
        await collection.update_one(
            {},
            {"$set": doc_data},
            upsert=True
        )

        return doc_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lưu vào MongoDB: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
