# Social App (mạng xã hội)

Monorepo: **NestJS API** + **Next.js web** + **shared types**. Mobile (Flutter) sẽ thêm ở giai đoạn sau, dùng chung API.

## Cấu trúc

```
social-app/
├── apps/
│   ├── api/      # NestJS + Prisma + PostgreSQL (REST API, prefix /api/v1)
│   └── web/      # Next.js (App Router) + Tailwind + TanStack Query + Zustand
├── packages/
│   └── shared/   # Type/DTO/enum dùng chung giữa api & web
└── docker-compose.yml   # Postgres + Redis
```

## Yêu cầu
- Node >= 20, pnpm >= 9, Docker (colima/Docker Desktop)

## Chạy lần đầu

```bash
# 1. Cài dependencies
pnpm install

# 2. Tạo file env
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Bật Postgres + Redis
pnpm db:up            # docker compose up -d

# 4. Tạo bảng (migrate) + sinh Prisma client
pnpm prisma:migrate   # lần đầu sẽ tạo migration "init"

# 5. Chạy cả API và web
pnpm dev              # api: http://localhost:4000 | web: http://localhost:3000
```

- Swagger API docs: http://localhost:4000/api/docs
- Web: http://localhost:3000 (tự chuyển tới /login hoặc /feed)

## Script hữu ích

| Lệnh | Tác dụng |
|------|----------|
| `pnpm dev` | Chạy song song api + web |
| `pnpm dev:api` / `pnpm dev:web` | Chạy riêng |
| `pnpm build` | Build tất cả |
| `pnpm db:up` | Bật Postgres (KHÔNG kèm Redis — mặc định) |
| `pnpm db:up:redis` | Bật Postgres **+ Redis** |
| `pnpm db:down` | Tắt tất cả |
| `pnpm prisma:migrate` | Tạo & áp migration |
| `pnpm prisma:studio` | Mở Prisma Studio xem DB |

## Trạng thái hiện tại (đã xong)

- ✅ **GĐ0** — Khung monorepo, Docker Compose, Prisma schema đầy đủ 10 bảng
- ✅ **GĐ1 (Auth)** — Backend: register / login / refresh (rotation) / logout / me
  (JWT access+refresh, argon2, Passport guard). Web: trang Login/Register, auth store
  (Zustand), axios interceptor tự refresh token, protected route.

### Đã smoke-test (8/8 pass)
register → me → 401 khi thiếu token → login → 401 sai mật khẩu → 409 trùng email →
refresh rotation → 400 validation.

## Upload ảnh (Storage)

Upload đi qua lớp trừu tượng `StorageProvider` → đổi nhà cung cấp = đổi env, không sửa code nghiệp vụ.

- **Mặc định `STORAGE_DRIVER=local`**: lưu vào `apps/api/uploads/`, phục vụ tại `/uploads/*`. Chạy được ngay, không cần tài khoản.
- **Chuyển sang Cloudinary**: trong `apps/api/.env` đặt:
  ```
  STORAGE_DRIVER=cloudinary
  CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...
  ```
  Không phải sửa controller/service/frontend. Muốn thêm S3/R2: viết 1 provider mới trong
  `apps/api/src/modules/uploads/providers/` rồi thêm 1 case ở `uploads.module.ts`.

## Bước tiếp theo (GĐ1 còn lại)

1. **Post + Feed** — module `posts` (CRUD + cursor pagination), upload ảnh, UI feed & tạo bài
2. **Reaction + Comment** — module `reactions`, `comments` + UI
3. **Friendship** — module `friendships` (gửi/chấp nhận) + trang bạn bè

Xem kế hoạch tổng thể ở `../social_app_plan/KE_HOACH.md`.
