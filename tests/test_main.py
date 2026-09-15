import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

import sys
import os

# Add app directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app")))

from main import app, ProfileSchema, APP_VERSION

client = TestClient(app)


def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "user-profile-app"
    assert data["version"] == APP_VERSION
    assert "database" in data


def test_version_endpoint():
    """Test version endpoint."""
    response = client.get("/api/version")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == APP_VERSION
    assert "environment" in data


def test_read_root():
    """Test homepage rendering."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Hồ Sơ Cá Nhân" in response.text
    assert "FastAPI" in response.text


def test_profile_schema_valid():
    """Test ProfileSchema with valid data."""
    valid_data = {
        "name": "Trần Văn B",
        "email": "tranvanb@gmail.com",
        "interests": ["Python", "CI/CD", "Docker"]
    }
    profile = ProfileSchema(**valid_data)
    assert profile.name == "Trần Văn B"
    assert profile.email == "tranvanb@gmail.com"
    assert len(profile.interests) == 3


def test_profile_schema_invalid_email():
    """Test ProfileSchema with invalid email."""
    invalid_data = {
        "name": "Trần Văn B",
        "email": "invalid-email-format",
        "interests": ["Python"]
    }
    with pytest.raises(ValidationError):
        ProfileSchema(**invalid_data)
