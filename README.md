# PublishHub — Content publishing platform

PublishHub is a content publishing platform for authors, readers, and admins.
Stack: React + Vite (frontend); Node.js + Express + Sequelize + PostgreSQL (backend).

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [Running the Project](#running-the-project)
- [Architecture Overview](#architecture-overview)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment & Live URL](#deployment--live-url)
- [Demo Video](#demo-video)
- [Where to Look in the Repo](#where-to-look-in-the-repo)

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+ (for local DB)

### Backend (install & DB)

```bash
cd backend
npm install
cp .env.example .env # edit .env: set DATABASE_URL, JWT_SECRET, PORT
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### Frontend (install)

```bash
cd frontend
npm install
```

Optional: use Docker to bring up all services (see section 6).

## Running the Project

### Backend (Development)

```bash
cd backend
npm run dev   # or `npm start`
```

### Backend (Production Example)

```bash
NODE_ENV=production PORT=80 pm2 start ./bin/www --name publish-backend
```

Protected API requests require the `Authorization: Bearer <token>` header where `<token>` is obtained from `/api/users/login`.

### Frontend (Development)

```bash
cd frontend
npm run dev
# open http://localhost:5173
```

### Frontend (Production)

```bash
cd frontend
npm run build
npm run preview
```

#### Environment override example

```bash
VITE_API_BASE_URL=http://localhost:3000/api npm run dev
```

## Architecture Overview

- Frontend: React + Vite (`frontend/src`) — UI, routing, API calls.
- Backend: Express (`backend/app.js`, `backend/bin/www`) — REST API, auth, business logic.
- Database: PostgreSQL via Sequelize (`backend/models`, `backend/migrations`).
- Logging: Winston (`backend/utils/logger.js`) and monitoring hooks (`backend/middleware/monitoringHooks.js`).

Data flow: User → Frontend → Backend `/api` → PostgreSQL → Backend returns JSON.

## API Documentation

All endpoints are prefixed with `/api`.

### Users

- **POST** `/api/users/register`
  - Public. Body: `{ name, email, password }`.
  - Success: 201 Created with user object (no password).
  - Errors: 400 validation, 409 email already exists.

- **POST** `/api/users/login`
  - Public. Body: `{ email, password }`.
  - Success: 200 OK with `{ token, user }`.
  - Errors: 400 validation, 401 invalid credentials.

- **GET** `/api/users/authors` – Protected, returns list of authors.
- **GET** `/api/users/author/:id` – Protected, returns author profile or 404.

### Articles (Public)

- **GET** `/api/articles/public` – Query `page`, `limit`; paginated published articles.
- **GET** `/api/articles/public/:id` – Single published article.
- **POST** `/api/articles/public/:articleId/like` – Toggle like for session/IP; returns `{ liked, likesCount }`.
- **GET** `/api/articles/public/:articleId/like/status` – Returns `{ liked }`.
- **GET** `/api/articles/public/:articleId/like/count` – Returns `{ likesCount }`.
- **POST** `/api/articles/public/:articleId/comments` – Body `{ name, comment }`; returns 201 comment.
- **GET** `/api/articles/public/:articleId/comments` – Paginated comments.

### Articles (Protected – Authors)

- **POST** `/api/articles/create` – Auth required. Create article.
- **GET** `/api/articles/` – Auth required. User's articles.
- **GET** `/api/articles/:id` – Auth required. Article detail (ownership check).
- **PUT** `/api/articles/:id` – Auth required. Update article.
- **DELETE** `/api/articles/:id` – Auth required. Delete article.
- **PATCH** `/api/articles/:id/publish` – Auth required. Toggle publish status.

### Admin (role=admin required)

- Stats: `/api/admin/stats/articles`, `/authors`, `/likes`, `/comments`, `/tags`.
- Authors: `/api/admin/authors/top`, `/api/admin/authors`.
- Activity & tags: `/api/admin/activity/recent`, `/api/admin/tags/popular`, `/api/admin/charts/daily`.

### Logs (admin)

- **GET** `/api/logs` – fetch logs with optional filters.
- **GET** `/api/logs/stats` – aggregated log stats.
- **DELETE** `/api/logs/clear` – clear logs.

Error handling: standard HTTP status codes with JSON body `{ error: "..." }`.

## Database Schema

- **Users**: `id`, `name`, `email` (unique), `password` (hashed), `role` (`author`|`admin`), timestamps.
- **Articles**: `id`, `title`, `body`, `tags`, `authorId` (FK→Users.id), `published_status` (0|1), `likesCount`, `commentsCount`, timestamps.
- **Comments**: `id`, `articleId` (FK→Articles.id), `name`, `comment`, `sessionId`, `ipAddress`, timestamps.
- **Likes**: `id`, `articleId` (FK→Articles.id), `sessionId`, `ipAddress`, timestamps; unique index on (`articleId`, `sessionId`).


## Deployment & Live URL

- Live frontend: https://publishhub-e9nn.onrender.com/

Backend must run with PostgreSQL and environment variables:

```
NODE_ENV=production
PORT=80
DB_HOST=<PROD_DB_HOST>
DB_PORT=5432
DB_NAME=contentpub
DB_USER=<PROD_DB_USER>
DB_PASS=<PROD_DB_PASS>
JWT_SECRET=<SECURE_JWT_SECRET>
```

## Demo Video

- Demo video: 

## Where to Look in the Repo

- Backend entry: `backend/bin/www`, `backend/app.js`
- Backend routes: `backend/routes/`
- Backend controllers: `backend/controllers/`
- Models & migrations: `backend/models/`, `backend/migrations/`
- Frontend entry: `frontend/index.html`, `frontend/src/main.jsx`
