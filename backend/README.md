# NestJS Auth & Profile Backend

Hệ thống Backend viết bằng **NestJS** kết hợp **MongoDB** (Mongoose), hỗ trợ xác thực tài khoản qua **JWT** và tự động sinh tài liệu **Swagger**.

---

## 🛠️ Công nghệ sử dụng
- **Framework**: NestJS (TypeScript)
- **Database**: MongoDB qua `@nestjs/mongoose`
- **Authentication**: JWT (`@nestjs/jwt`, `passport-jwt`, `bcrypt`)
- **Validation**: `class-validator`, `class-transformer`
- **Documentation**: Swagger UI (`@nestjs/swagger`)

---

## 🚀 Hướng dẫn chạy

### 1. Chạy trực tiếp (Local Development)
Yêu cầu: Máy đã có Node.js (>= 18) và MongoDB đang chạy ở port 27017.

```bash
cd backend
npm install
npm run start:dev
```

### 2. Các địa chỉ truy cập
- **API Base URL**: `http://localhost:3000`
- **Swagger UI (Test API trực quan)**: `http://localhost:3000/api/docs`

---

## 📋 Danh sách Endpoints Auth

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Đăng ký tài khoản (email, password >= 6 ký tự, name) |
| `POST` | `/auth/login` | Public | Đăng nhập lấy Bearer Access Token |
| `GET` | `/auth/me` | Bearer Token | Lấy thông tin tài khoản đang đăng nhập |

### Ví dụ Body đăng ký (`POST /auth/register`):
```json
{
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "password": "password123",
  "interests": ["NestJS", "Docker", "TypeScript"]
}
```

### Ví dụ Body đăng nhập (`POST /auth/login`):
```json
{
  "email": "nguyenvana@example.com",
  "password": "password123"
}
```
