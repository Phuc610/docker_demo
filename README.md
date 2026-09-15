# Docker Profile App

Ứng dụng **FastAPI** đơn giản được đóng gói bằng **Docker**, kết nối **MongoDB** để lưu trữ hồ sơ cá nhân.

## Cấu trúc project

```
.
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI/CD pipeline
├── app/                    # Source code ứng dụng
│   ├── main.py             # FastAPI app chính
│   ├── requirements.txt    # Python dependencies
│   ├── static/             # CSS, JS
│   └── templates/          # HTML templates (Jinja2)
├── tests/                  # Bộ kiểm thử tự động (Unit / Integration Tests)
│   ├── __init__.py
│   └── test_main.py        # Test endpoints, schema validation & UI render
├── Dockerfile              # Định nghĩa Docker image cho app
├── compose.yaml            # Docker Compose (MongoDB + App)
└── .gitignore
```

## Cách chạy

```bash
# Khởi động toàn bộ stack (MongoDB + App)
docker compose -f compose.yaml up --build
```

Sau khi chạy xong:

| Service | URL |
|---|---|
| FastAPI App | http://localhost:8000 |
| Health Check API | http://localhost:8000/api/health |
| Version API | http://localhost:8000/api/version |
| Mongo Express (DB UI) | http://localhost:8081 |

## Chạy Test tự động (Pytest)

```bash
pytest -v tests/
```

## GitHub Actions CI/CD Pipeline

Khi bạn `git push` hoặc tạo `Pull Request` lên nhánh `main`/`master` trên GitHub, pipeline `.github/workflows/ci.yml` sẽ tự động kích hoạt 2 jobs:
1. **Run Unit Tests (`test`)**: Cài đặt dependencies và chạy bộ test `pytest` để kiểm tra tính đúng đắn của logic & endpoints.
2. **Build Docker Image (`docker-build`)**: Tự động build Dockerfile nhằm đảm bảo Docker image không bị lỗi cú pháp hay thiếu packages khi deploy.

## Tech Stack

- **FastAPI** — Python web framework
- **MongoDB** — NoSQL database
- **Motor** — Async MongoDB driver
- **Jinja2** — HTML templating
- **Pytest** — Automated Testing Framework
- **GitHub Actions** — CI/CD Pipeline
- **Docker & Docker Compose** — Container hóa ứng dụng
