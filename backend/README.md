# CareerBridge Backend Application (Enterprise Platform)

This repository contains the backend systems powering the CareerBridge professional networking platform. Built using Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

---

## 1. Prerequisites

Before setting up the project, make sure your machine has:
- **Node.js**: LTS version (v20+ recommended)
- **PostgreSQL**: Standard local instance (running on port 5432)

---

## 2. Environment Configurations

Create a `.env` file in the `/backend` directory root based on this scheme:

```env
PORT=5000
NODE_ENV=development

# Database Mappings
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/careerbridge?schema=public"

# JSON Web Tokens Settings
JWT_ACCESS_SECRET="your-super-secret-access-key-here-change-this"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here-change-this"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Security Configurations
CORS_ORIGIN="http://localhost:5173"
```

---

## 3. Database Initial Setup

To configure the PostgreSQL schema and migrate metadata structure:

```bash
# Verify schema datamodels structure
npx prisma validate

# Run dev migrations to create database tables
npx prisma migrate dev --name init

# Generate Prisma Client models
npx prisma generate
```

---

## 4. Run Development & Production Build

```bash
# Run backend server in hot-reload mode
npm run dev

# Compile TypeScript production package
npm run build

# Start compiled JavaScript package
npm start
```

---

## 5. Security & Session Management Lifecycle

- **JWT Session Tokens**: Login endpoints return an `accessToken` (short-lived, 15m) in the JSON body payload, and a `refreshToken` (7d) within a secure HttpOnly cookie.
- **Grant Token Renewals**: Calling `/api/v1/auth/refresh` parsing the `refreshToken` HttpOnly cookie grants a fresh access token without exposing secrets to localStorage.
- **Granular Endpoint Rate Limiters**:
  - `POST /api/v1/auth/login`: 5 requests per 15 minutes.
  - `POST /api/v1/auth/register`: 10 requests per hour.
  - `POST /api/v1/auth/forgot-password`: 3 requests per hour.
  - `GET /api/v1/auth/verify-email`: 5 requests per hour.

---

## 6. Endpoints Documentation Directory

Expose interactive Swagger specifications by booting the backend and navigating to:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

### Core API Groups:
- **Auth**: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/change-password`, `/auth/verify-email`, `/auth/check`, `/auth/me`
- **Dashboard**: `/dashboard`
- **Student Profile**: `/student/profile` (personal details, education history, work experience, projects, skills, certifications)
- **Jobs**: `/jobs` (listing, search index, filter scopes, saved toggles)
- **Applications**: `/applications` (timeline stage tracking)
- **Notifications**: `/notifications` (read-all status)
- **Messages**: `/messages` (conversation REST threads)
- **Resumes**: `/resume` (PDF/DOCX uploads up to 5MB, unique name gen, traversal filter sanitization)
- **Career**: `/career/insights`, `/career/mock-interviews`
