# Docker Profile App

Ứng dụng **FastAPI** đơn giản được đóng gói bằng **Docker**, kết nối **MongoDB** để lưu trữ hồ sơ cá nhân.

## Cấu trúc project

```
.
├── app/                    # Source code ứng dụng
│   ├── main.py             # FastAPI app chính
│   ├── requirements.txt    # Python dependencies
│   ├── static/             # CSS, JS
│   └── templates/          # HTML templates (Jinja2)
├── dockerfile              # Định nghĩa Docker image cho app
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
| Mongo Express (DB UI) | http://localhost:8081 |

## ech Stack

- **FastAPI** — Python web framework
- **MongoDB** — NoSQL database
- **Motor** — Async MongoDB driver
- **Jinja2** — HTML templating
- **Docker & Docker Compose** — Container hóa ứng dụng
