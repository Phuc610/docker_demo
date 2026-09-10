import os
import re
from typing import List
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field, field_validator
from motor.motor_asyncio import AsyncIOMotorClient

app = FastAPI(
    title="User Profile App",
    description="FastAPI profile application connected to MongoDB (Docker)",
    version="1.0.0"
)

# Mount static files (CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates configuration
templates = Jinja2Templates(directory="templates")

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

# --- MongoDB Configuration ---
# Lấy URI từ biến môi trường, mặc định kết nối localhost:27017
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "profile_app")

client = AsyncIOMotorClient(MONGO_URI)
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
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Render the main profile web page."""
    profile_data = await fetch_profile_from_db()
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"profile": profile_data}
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
