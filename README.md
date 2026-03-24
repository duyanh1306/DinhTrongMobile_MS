# Management System for Dinh Trong Mobile

Hệ thống quản lý cho Dinh Trong Mobile - một ứng dụng web full-stack được xây dựng với React, Express, MongoDB và Docker.

## Mục lục
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Chạy với Docker](#chạy-với-docker)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Các dịch vụ](#các-dịch-vụ)
- [Biến môi trường](#biến-môi-trường)
- [Khắc phục sự cố](#khắc-phục-sự-cố)

## Yêu cầu hệ thống

Để chạy dự án này bằng Docker, bạn cần cài đặt:

- **Docker**: [Tải Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Docker Compose**: Thường được đi kèm với Docker Desktop

### Kiểm tra cài đặt
```bash
docker --version
docker-compose --version
```

## Chạy với Docker

### 1. Khởi động tất cả các dịch vụ

Từ thư mục gốc của dự án, chạy lệnh:

```bash
docker-compose up
```

Khi muốn update code mới và muốn build lại website:

```bash
docker-compose up -d --build
```

Lần đầu tiên chạy sẽ mất một chút thời gian để tải và build các image. Sau đó, bạn sẽ thấy các dịch vụ khởi động:

```
mobile_mongo is healthy
mobile_server started
mobile_client started
```

### 2. Truy cập ứng dụng

Sau khi các dịch vụ khởi động thành công:

- **Frontend (Client)**: http://localhost:3000
- **Backend (Server)**: http://localhost:9999
- **MongoDB**: localhost:27017 (chỉ sử dụng trong container)
- **API Documentation**: http://localhost:9999/api-docs (Swagger)

### 3. Dừng các dịch vụ

```bash
# Dừng nhưng giữ lại container
docker-compose stop

# Dừng và xóa container (dữ liệu MongoDB vẫn được lưu)
docker-compose down

# Dừng và xóa tất cả bao gồm volumes (xóa xác dữ liệu)
docker-compose down -v
```

### 4. Xem logs

```bash
# Xem logs từ tất cả các dịch vụ
docker-compose logs -f

# Xem logs từ một dịch vụ cụ thể
docker-compose logs -f server    # Logs từ backend
docker-compose logs -f client    # Logs từ frontend
docker-compose logs -f mongo     # Logs từ MongoDB
```

## Cấu trúc dự án

```
DinhTrongMobile_MS/
├── client/                 # React Frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── server/                 # Express Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── config/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Orchestration file
└── README.md
```

## Các dịch vụ

### Client (Frontend)
- **Công nghệ**: React, Tailwind CSS
- **Port**: 3000
- **Container**: mobile_client
- **Thư mục**: `/client`

### Server (Backend)
- **Công nghệ**: Express.js, Node.js
- **Port**: 9999
- **Container**: mobile_server
- **Thư mục**: `/server`
- **Database**: MongoDB (URI: `mongodb://mongo:27017/dinh_trong_mobile`)

### MongoDB
- **Version**: 7.0
- **Port**: 27017
- **Container**: mobile_mongo
- **Volume**: `mongo_data` (dữ liệu được lưu giữ)
- **Database mặc định**: `dinh_trong_mobile`

## Biến môi trường

### Server
Các biến môi trường được set trong `docker-compose.yml`:
```
NODE_ENV=development
PORT=9999
MONGODB_URI=mongodb://mongo:27017/dinh_trong_mobile
```

### Client
```
REACT_APP_API_URL=http://server:9999
```

Để thêm biến môi trường khác, hãy cập nhật file `docker-compose.yml` hoặc tạo file `.env` trong các thư mục `client/` và `server/`.

## Khắc phục sự cố

### Port đã được sử dụng
Nếu nhận lỗi "Port already in use", thay đổi port trong `docker-compose.yml`:

```yaml
server:
  ports:
    - "5000:9999"  # Thay 9999 bằng 5000

client:
  ports:
    - "3001:3000"  # Thay 3000 bằng 3001
```

### Dữ liệu MongoDB không được lưu
Nếu dữ liệu bị mất khi restart, kiểm tra xem `mongo_data` volume có tồn tại:

```bash
docker volume ls | grep mongo_data
```

### Rebuild Docker images
Nếu thay đổi Dockerfile hoặc muốn rebuild từ đầu:

```bash
docker-compose build --no-cache
docker-compose up
```

### Xóa tất cả dữ liệu và start fresh
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Không thể kết nối đến database
- Đảm bảo MongoDB container đang chạy: `docker-compose ps`
- Kiểm tra logs MongoDB: `docker-compose logs mongo`
- Xác nhận MONGODB_URI đúng trong server environment variables

## Chạy mà không dùng Docker (Local Development)

### Frontend
```bash
cd client
npm install
npm start
```

### Backend
```bash
cd server
npm install
node server.js
# hoặc dùng nodemon để auto-reload
nodemon server.js
```

**Lưu ý**: Bạn cần MongoDB chạy locally trên `localhost:27017`

---

Để có thêm thông tin, vui lòng liên hệ team phát triển.
