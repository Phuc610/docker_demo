# --- Stage 1: Build NestJS ---
FROM node:20-slim AS nest-builder

WORKDIR /nest

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN npm run build
RUN npm prune --omit=dev

# --- Stage 2: Final Runner (Python + Node.js) ---
FROM python:3.12-slim

# Cài đặt Node.js runtime cho NestJS
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Cài đặt dependencies cho FastAPI
WORKDIR /home/app
COPY /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy mã nguồn FastAPI
COPY ./app /home/app

# Copy dependencies và bản build của NestJS
WORKDIR /home/backend
COPY backend/package*.json ./
COPY --from=nest-builder /nest/node_modules ./node_modules
COPY --from=nest-builder /nest/dist ./dist

# Copy script khởi động chung
WORKDIR /home
COPY start.sh /home/start.sh
RUN chmod +x /home/start.sh

ENV MONGO_URI="mongodb://mongodb:27017"
ENV PORT=8000
EXPOSE 8000 3000

CMD ["/home/start.sh"]