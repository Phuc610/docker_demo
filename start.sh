#!/bin/bash
set -e

# Khởi động NestJS Auth Backend ở chế độ chạy nền
echo "🚀 Đang khởi động NestJS Auth Backend..."
cd /home/backend
node dist/main &

# Chờ 2 giây để NestJS sẵn sàng
sleep 2

# Khởi động FastAPI (nhận cổng từ Render qua biến PORT, mặc định 8000)
echo "🚀 Đang khởi động FastAPI trên cổng ${PORT:-8000}..."
cd /home/app
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
