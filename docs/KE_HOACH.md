# Kế hoạch xây dựng ứng dụng Mạng xã hội (kiểu Facebook)

> Mục tiêu: Xây dựng mạng xã hội với các chức năng cốt lõi: đăng bài, tương tác
> (like/comment/share), kết bạn, nhắn tin realtime, thông báo.
>
> **Chiến lược nền tảng:** Làm **WEB TRƯỚC** (NestJS backend + Next.js frontend),
> **MOBILE MỞ RỘNG SAU** (Flutter cắm vào cùng API — không phải làm lại backend).

---

## 1. Đánh giá độ khả thi

| Yếu tố | Đánh giá |
|--------|----------|
| Khả thi kỹ thuật | ✅ Hoàn toàn làm được, công nghệ đã có sẵn hết |
| Độ khó | 🟠 Trung bình → Cao (do nhiều tính năng ghép lại, không phải 1 tính năng khó) |
| Làm 1 mình | ✅ Được, nhưng phải làm theo giai đoạn (MVP trước), đừng ôm hết |
| Rào cản lớn nhất | Chat realtime, feed ranking, upload/xử lý media, scale khi nhiều user |

**Lời khuyên:** Đừng cố clone 100% Facebook. Làm **MVP** (đăng bài + kết bạn + feed + like/comment) chạy được trước, rồi mới thêm chat, notification, story...

---

## 2. Công nghệ sử dụng

> Toàn bộ dùng **TypeScript** cho cả backend lẫn frontend web → chung ngôn ngữ,
> có thể chia sẻ type/DTO giữa 2 bên.

### 🎯 Backend — NestJS (ưu tiên, làm trước)
- **NestJS** (Node.js + TypeScript) — REST API (cân nhắc GraphQL nếu cần)
- **PostgreSQL** — DB chính
- **Prisma** (hoặc TypeORM) — ORM, migration, type-safe query
- **Redis** — cache feed, session, pub/sub cho realtime
- **Socket.IO** (`@nestjs/websockets`) — chat & notification realtime
- **JWT + Passport** (`@nestjs/passport`) — xác thực (access + refresh token)
- **class-validator / class-transformer** — validate DTO
- **BullMQ** (Redis) — hàng đợi xử lý nền (gửi mail, xử lý ảnh, fan-out notification)
- **Swagger** (`@nestjs/swagger`) — tự sinh tài liệu API
- **S3 (AWS) / Cloudinary** — lưu & xử lý ảnh, video

### 🎯 Frontend Web — Next.js (ưu tiên, làm trước)
- **Next.js (App Router) + TypeScript** — SEO tốt, SSR/ISR, tải nhanh
- **TanStack Query** — data fetching, cache, invalidate sau mutation
- **Zustand** — state client nhẹ (hoặc Redux Toolkit nếu state phức tạp)
- **Tailwind CSS + shadcn/ui** — UI nhanh, đồng bộ
- **React Hook Form + Zod** — form & validate (Zod dùng chung schema với BE nếu muốn)
- **Axios** (interceptor gắn token, tự refresh) — gọi API
- **socket.io-client** — realtime chat/notification

### 📱 Frontend Mobile — Flutter (mở rộng SAU)
- **Flutter** — 1 codebase Android + iOS, cắm vào **cùng NestJS API** (không làm lại backend)
- **Riverpod (codegen)** — state; mutation dùng `runMutation`
- **go_router** — điều hướng | **dio** — gọi API | **cached_network_image** — cache ảnh
- **image_picker / file_picker** — chọn media | **web_socket_channel** — realtime

### Hạ tầng phụ trợ
- **CDN cho media:** Cloudinary / Cloudflare
- **Push Notification:** Web Push (web) + FCM (mobile sau)
- **Analytics:** PostHog / Google Analytics
- **CI/CD:** GitHub Actions
- **Hosting:**
  - Frontend web (Next.js): **Vercel**
  - Backend (NestJS): **Railway / Render / Fly.io** (hoặc VPS + Docker)
  - DB Postgres + Redis: **Supabase/Neon (Postgres) + Upstash (Redis)** hoặc self-host Docker
- **Local dev:** Docker Compose (Postgres + Redis + NestJS)

> **Vì sao NestJS + Next.js hợp với bạn ngay từ đầu:** tự chủ hoàn toàn backend
> (không bị khóa vào Supabase), cùng TypeScript nên tái dùng type, và khi làm mobile
> Flutter chỉ việc gọi API sẵn có — kiến trúc không phải đập đi làm lại.

---

## 3. Thiết kế Database (Postgres — cho Supabase hoặc Hướng B)

### Bảng chính

**users** — người dùng
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | uuid (PK) | |
| email | text (unique) | |
| username | text (unique) | |
| full_name | text | |
| avatar_url | text | |
| cover_url | text | |
| bio | text | |
| created_at | timestamptz | |

**posts** — bài đăng
| id | uuid (PK) |
| author_id | uuid (FK → users) |
| content | text |
| media_urls | text[] / jsonb | ảnh/video đính kèm |
| privacy | enum (public/friends/private) |
| created_at | timestamptz |

**comments** — bình luận
| id | uuid (PK) |
| post_id | uuid (FK → posts) |
| author_id | uuid (FK → users) |
| parent_id | uuid (FK → comments, null) | để trả lời lồng nhau |
| content | text |
| created_at | timestamptz |

**reactions** — like/thả cảm xúc
| id | uuid (PK) |
| user_id | uuid (FK → users) |
| target_type | enum (post/comment) |
| target_id | uuid |
| type | enum (like/love/haha/wow/sad/angry) |
| created_at | timestamptz |
| **UNIQUE(user_id, target_type, target_id)** | 1 người 1 reaction/target |

**friendships** — quan hệ bạn bè
| id | uuid (PK) |
| requester_id | uuid (FK → users) |
| addressee_id | uuid (FK → users) |
| status | enum (pending/accepted/blocked) |
| created_at | timestamptz |

**conversations** — cuộc trò chuyện (chat)
| id | uuid (PK) |
| is_group | bool |
| name | text (null nếu chat 1-1) |
| created_at | timestamptz |

**conversation_members** — thành viên cuộc trò chuyện
| conversation_id | uuid (FK) |
| user_id | uuid (FK) |
| last_read_at | timestamptz | để tính tin chưa đọc |

**messages** — tin nhắn
| id | uuid (PK) |
| conversation_id | uuid (FK) |
| sender_id | uuid (FK → users) |
| content | text |
| media_url | text (null) |
| created_at | timestamptz |

**notifications** — thông báo
| id | uuid (PK) |
| user_id | uuid (FK) | người nhận |
| actor_id | uuid (FK) | người gây ra hành động |
| type | enum (like/comment/friend_request/friend_accept/message/tag) |
| target_id | uuid | id bài/comment liên quan |
| is_read | bool |
| created_at | timestamptz |

**Index quan trọng:** `posts(author_id, created_at)`, `comments(post_id)`, `reactions(target_type, target_id)`, `messages(conversation_id, created_at)`, `notifications(user_id, is_read)`.

---

## 4. Danh sách Màn hình & Chức năng

### 🔐 Nhóm Auth
**1. Splash / Onboarding**
- Logo, kiểm tra đã đăng nhập chưa → điều hướng

**2. Đăng nhập (Login)**
- Nhập email/mật khẩu, đăng nhập bằng Google/Apple
- Link "Quên mật khẩu"

**3. Đăng ký (Register)**
- Nhập tên, email, mật khẩu, tạo username
- Xác thực email (OTP/link)

---

### 🏠 Nhóm chính (Web: sidebar/top-nav · Mobile: bottom nav)

**4. Trang chủ / News Feed**
- Danh sách bài đăng của bản thân + bạn bè (mới nhất / theo thuật toán)
- Mỗi bài: avatar, tên, thời gian, nội dung, ảnh/video
- Nút Like (giữ để chọn cảm xúc), Comment, Share
- Thanh "Bạn đang nghĩ gì?" ở đầu để tạo bài nhanh
- Pull-to-refresh, infinite scroll (phân trang)

**5. Tạo bài đăng (Create Post)**
- Ô nhập nội dung
- Đính kèm ảnh/video (nhiều ảnh)
- Chọn quyền riêng tư (Công khai / Bạn bè / Chỉ mình tôi)
- Gắn thẻ bạn bè, check-in vị trí (nâng cao)

**6. Chi tiết bài đăng (Post Detail)**
- Hiển thị đầy đủ bài + danh sách comment
- Comment lồng nhau (reply), like comment
- Ô nhập comment ở dưới

**7. Bạn bè (Friends)**
- Tab: Lời mời kết bạn / Gợi ý / Danh sách bạn bè
- Nút Chấp nhận / Từ chối / Kết bạn / Hủy
- Tìm kiếm người dùng

**8. Tin nhắn (Messages / Chat list)**
- Danh sách cuộc trò chuyện, hiển thị tin cuối + số tin chưa đọc
- Badge chưa đọc

**9. Màn hình Chat (Conversation)**
- Tin nhắn realtime (WebSocket/Supabase Realtime)
- Gửi text, ảnh
- Trạng thái "đang nhập...", đã xem, online/offline
- Cuộn tải tin cũ

**10. Thông báo (Notifications)**
- Danh sách: ai like/comment bài của bạn, lời mời kết bạn, tin nhắn...
- Đánh dấu đã đọc, bấm vào → điều hướng tới nội dung liên quan
- Realtime (push khi có thông báo mới)

---

### 👤 Nhóm cá nhân

**11. Trang cá nhân (Profile)**
- Ảnh bìa, avatar, tên, bio, số bạn bè
- Nút: Chỉnh sửa hồ sơ (nếu là mình) / Kết bạn - Nhắn tin (nếu là người khác)
- Danh sách bài đăng của người đó
- Tab: Bài viết / Ảnh / Bạn bè

**12. Chỉnh sửa hồ sơ (Edit Profile)**
- Đổi avatar, ảnh bìa, tên, bio, thông tin cá nhân

**13. Tìm kiếm (Search)**
- Tìm người dùng, bài đăng
- Lịch sử tìm kiếm

**14. Cài đặt (Settings)**
- Đổi mật khẩu, quyền riêng tư, thông báo
- Đăng xuất, xóa tài khoản
- Chế độ tối (Dark mode)

---

### ⭐ Tính năng nâng cao (làm sau khi MVP xong)
- **Story** (đăng ảnh/video 24h)
- **Reels / Video ngắn**
- **Nhóm (Groups)** và **Trang (Pages)**
- **Marketplace**
- **Gọi video/thoại** (WebRTC)
- **Feed ranking** bằng thuật toán (thay vì chỉ theo thời gian)

---

## 5. Lộ trình triển khai (WEB trước → MOBILE sau)

### 🔧 Giai đoạn 0 — Nền tảng (setup)
- Khởi tạo repo (khuyên dùng **monorepo**: `apps/api` NestJS + `apps/web` Next.js + `packages/shared` type dùng chung)
- Docker Compose (Postgres + Redis), Prisma schema + migration đầu tiên
- NestJS: cấu trúc module, config, kết nối DB; Next.js: layout, theme, axios client

### 🌐 Giai đoạn 1 — WEB MVP (NestJS + Next.js) — ✅ HOÀN TẤT
1. ✅ **Auth** — API đăng ký/đăng nhập (JWT access+refresh) + trang Login/Register
2. ✅ **Post + Feed** — API CRUD bài + trang Feed, tạo bài (cursor pagination)
3. ✅ **Like + Comment** — API reaction/comment + UI tương tác
4. ✅ **Profile** — trang cá nhân (cover, avatar, bio, số bạn/bài, nút kết bạn theo trạng thái) + chỉnh sửa hồ sơ; lọc bài theo privacy
5. ✅ **Kết bạn** — API friendship (gửi/chấp nhận/hủy, gợi ý, tìm kiếm) + trang bạn bè

> ✅ **Upload ảnh thật** — đã xong: bài đăng kèm ảnh + avatar/cover, qua lớp
> StorageProvider trừu tượng (driver `local` mặc định, đổi sang `cloudinary`/S3 = đổi env).
>
> **Còn nợ kỹ thuật (làm dần):** xác thực email, quên mật khẩu, đăng nhập Google.

### 🌐 Giai đoạn 2 — WEB Realtime — ✅ HOÀN TẤT
6. ✅ **Chat realtime** — 1-1 & nhóm, Socket.IO (auth JWT), tin realtime, typing, gửi ảnh, unread badge, **trạng thái online (chấm xanh)**, **"Đã xem"**
7. ✅ **Notification realtime** — like/comment/kết bạn → thông báo realtime, chuông + badge + dropdown + trang /notifications
8. ✅ **Web Push** — Service Worker + VAPID (tự sinh) + bảng push subscription; thông báo đẩy cả khi đóng tab

> ✨ **UI đã nâng cấp**: TopNav dùng chung (icon + active state + badge + chuông + avatar),
> đồng bộ toàn app; trang đăng nhập/đăng ký nền gradient; theme + shadow + skeleton +
> empty state; PostCard làm lại (lưới ảnh, reaction bar); trang cá nhân card nổi.
>
> ✨ **Tính năng thêm**: thả **6 loại cảm xúc** (👍❤️😆😮😢😡) có picker + đếm theo loại;
> **gửi ảnh trong chat** (hiển thị trong bong bóng + "📷 Hình ảnh" ở danh sách).

> Ghi chú: chat hiện chạy single-instance (in-memory rooms). Khi scale nhiều
> server mới cần Redis adapter cho Socket.IO (bật REDIS_ENABLED + thêm adapter).

### 🌐 Giai đoạn 3 — WEB hoàn thiện
9. ✅ **Search** · **Dark mode** · **Settings** · **Chat nhóm** (tạo nhóm, chi tiết thành viên, rời nhóm) · **Dialog/Toast custom** (thay confirm/alert/prompt native)
10. 🟡 **Story 24h** ✅ (thanh story viền gradient + trình xem toàn màn hình, tự hết hạn) — còn Reels/Groups
11. 🟡 **Vòng đời bài viết** ✅ (sửa bài, xóa bài, xóa bình luận, trang chi tiết /posts/[id], deep-link thông báo) — còn feed ranking/tối ưu

### 📱 Giai đoạn 4 — MOBILE (Flutter, cắm vào API có sẵn)
12. Flutter app dùng lại toàn bộ NestJS API — làm lại lớp UI + state (Riverpod)
13. Push notification FCM cho mobile
14. Phát hành App Store / Google Play

> **Nguyên tắc:** mỗi tính năng làm **API (NestJS) trước → UI (Next.js) sau**.
> Khi API đã ổn định, mobile chỉ là thêm một client mới, không đụng backend.

---

## 6. Cấu trúc thư mục đề xuất (Monorepo)

Dùng monorepo (pnpm workspaces / Turborepo) để chia sẻ type giữa backend & web:

```
social-app/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # controller, service, dto, guard, strategy
│   │   │   │   ├── users/
│   │   │   │   ├── posts/
│   │   │   │   ├── comments/
│   │   │   │   ├── reactions/
│   │   │   │   ├── friendships/
│   │   │   │   ├── chat/        # gateway (websocket) + service
│   │   │   │   └── notifications/
│   │   │   ├── common/          # filter, interceptor, decorator, guard chung
│   │   │   ├── config/
│   │   │   └── main.ts
│   │   └── prisma/schema.prisma
│   │
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/            # App Router: routes (login, feed, profile...)
│           ├── features/       # auth, feed, post, friends, chat... (component + hook + api)
│           ├── components/ui/  # shadcn/ui
│           ├── lib/            # axios client, socket, utils
│           └── store/          # zustand
│
├── packages/
│   └── shared/                 # type/DTO/enum dùng chung API ↔ Web
│
├── docker-compose.yml          # postgres + redis
└── package.json
```

**Mobile (thêm ở Giai đoạn 4):** một repo/thư mục Flutter riêng, cấu trúc feature-first
(`core/`, `features/<feature>/{data,domain,presentation}`, `shared/`), state Riverpod codegen,
mutation dùng `runMutation` — gọi vào cùng NestJS API.

> **Module NestJS ↔ Feature Next.js ↔ Feature Flutter** đặt tên trùng nhau (auth, posts,
> chat...) để dễ đối chiếu 3 lớp.

---

## 7. Ước lượng thời gian (làm 1 mình, part-time)

| Giai đoạn | Thời gian ước tính |
|-----------|-------------------|
| GĐ 0 — Setup nền tảng | 1 tuần |
| GĐ 1 — Web MVP (NestJS + Next.js) | 5–7 tuần |
| GĐ 2 — Web Realtime | 3–4 tuần |
| GĐ 3 — Web hoàn thiện | 4+ tuần |
| GĐ 4 — Mobile Flutter | 5–7 tuần |

> Con số mang tính tham khảo, phụ thuộc thời gian bạn bỏ ra mỗi ngày.
> Vì backend đã xong ở GĐ 1–3, GĐ 4 (mobile) chủ yếu là dựng lại UI.

---

## 8. Rủi ro & lưu ý
- **Thiết kế API cho cả web lẫn mobile ngay từ đầu** — response gọn, phân trang bằng
  cursor, versioning (`/api/v1`) để mobile sau này không phải sửa nhiều.
- **Đừng làm feed ranking phức tạp ngay** — MVP chỉ cần sắp theo thời gian (cursor pagination).
- **Upload media** dễ ngốn chi phí storage/băng thông → nén/resize phía client, dùng
  presigned URL upload thẳng lên S3/Cloudinary (không đẩy file qua NestJS).
- **Realtime chat** là phần khó nhất → dùng **Socket.IO Gateway** của NestJS, Redis adapter
  để scale nhiều instance; cân nhắc lưu tin nhắn async qua BullMQ.
- **Bảo mật:** kiểm tra quyền (authorization) ở MỌI endpoint (Guard NestJS), validate DTO,
  rate limit, hash mật khẩu (argon2/bcrypt), refresh token an toàn.
- **Kiểm duyệt nội dung** (report bài, chặn user) nên tính từ đầu ở mức cơ bản.
