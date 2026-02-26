PublishHub — Content Publishing Platform

PublishHub is a content publishing platform that lets authors create and publish articles, readers comment and like posts, and admins view metrics and logs.

Tech Stack: React + Vite (frontend), Express + Sequelize + PostgreSQL (backend), JWT authentication, Winston logging.

Table of Contents

Setup Instructions

Running the Project

Architecture Overview

API Documentation

Database Schema

Deployment & Live URL

Demo Video

Where to Look in the Repo

Setup Instructions
Prerequisites

Node.js 18+

npm 9+

PostgreSQL 14+ (for local DB)

Backend
cd backend
npm install
cp .env.example .env   # edit .env with DATABASE_URL, JWT_SECRET, etc.
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
Frontend
cd frontend
npm install
Optional

Use Docker to bring up all services (see Deployment section).

Running the Project
Backend (Development)
cd backend
npm run dev   # or `npm start`

Default port is configured in .env (usually 3000).

Protected API requests require the header:

Authorization: Bearer <token>

<token> is obtained via /api/users/login.

Backend (Production Example)
NODE_ENV=production PORT=80 pm2 start ./bin/www --name publish-backend
Frontend (Development)
cd frontend
npm run dev
# open http://localhost:5173
Frontend (Production)
cd frontend
npm run build
npm run preview   # serve built files locally
Environment Override Example
VITE_API_BASE_URL=http://localhost:3000/api npm run dev
Architecture Overview

Frontend: React + Vite (frontend/src) — UI, routing, API calls

Backend: Express (backend/app.js, backend/bin/www) — REST API, auth, business logic

Database: PostgreSQL via Sequelize (backend/models, backend/migrations)

Logging: Winston (backend/utils/logger.js) and monitoring hooks (backend/middleware/monitoringHooks.js)

Data Flow:
User → Frontend → Backend /api → PostgreSQL
Backend logs and exposes admin stats.

API Documentation

All endpoints are prefixed with /api.

Users

POST /api/users/register

Body:

{ "name": "Alice", "email": "a@a.com", "password": "secret" }

Success: 201 Created (user object without password)

Errors: 400 validation, 409 email already exists

POST /api/users/login

Body:

{ "email": "a@a.com", "password": "secret" }

Success: 200 OK: { "token": "<jwt>", "user": { ... } }

Errors: 400 validation, 401 invalid credentials

GET /api/users/authors – Auth required, returns list of authors

GET /api/users/author/:id – Auth required, returns author profile or 404

Articles (Public)

GET /api/articles/public – Paginated list (page, limit)

GET /api/articles/public/:id – Fetch single article

POST /api/articles/public/:articleId/like – Toggle like per session/IP

GET /api/articles/public/:articleId/like/status – Like status

GET /api/articles/public/:articleId/like/count – Like count

POST /api/articles/public/:articleId/comments – Post comment

GET /api/articles/public/:articleId/comments – Paginated comments

Articles (Protected – Authors)

POST /api/articles/create – Create article

GET /api/articles/ – List authenticated user's articles

GET /api/articles/:id – Get article if owned

PUT /api/articles/:id – Update article

DELETE /api/articles/:id – Delete article

PATCH /api/articles/:id/publish – Toggle publish status

Admin

Auth + role === 'admin' required

Stats: /api/admin/stats/articles, /authors, /likes, /comments, /tags

Authors: /api/admin/authors/top, /api/admin/authors

Activity & Tags: /api/admin/activity/recent, /api/admin/tags/popular, /api/admin/charts/daily

Logs: /api/logs (list), /api/logs/stats, /api/logs/clear

Error Handling: Standard HTTP status codes with JSON { error: "...", message: "..." }.

Database Schema

Users: id, name, email (unique), password (hashed), role (author/admin), timestamps

Articles: id, title, body, tags, authorId → Users, published_status (0|1), likesCount, commentsCount, timestamps

Comments: id, articleId → Articles, name, comment, sessionId, ipAddress, timestamps

Likes: id, articleId → Articles, sessionId, ipAddress, timestamps; unique index (articleId, sessionId)

Denormalized counters in Articles track likes and comments for performance.

Deployment & Live URL

Live Frontend: https://publishhub-e9nn.onrender.com/

Backend: host with PostgreSQL and set environment variables:

NODE_ENV=production
PORT=80
DB_HOST=<PROD_DB_HOST>
DB_PORT=5432
DB_NAME=contentpub
DB_USER=<PROD_DB_USER>
DB_PASS=<PROD_DB_PASS>
JWT_SECRET=<SECURE_JWT_SECRET>

Dockerized deployment: Build frontend, serve dist via nginx, backend in production mode.

docker compose -f docker-compose.prod.yml up --build
Demo Video

Demo video (replace placeholder): https://youtu.be/REPLACE_WITH_YOUR_VIDEO

Where to Look in the Repo

Backend entry: backend/bin/www, backend/app.js

Backend routes: backend/routes/

Backend controllers: backend/controllers/

Models & Migrations: backend/models/, backend/migrations/

Frontend entry: frontend/index.html, frontend/src/main.jsx