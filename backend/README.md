# Quiz Bot Backend

NestJS API for the quiz platform.

## Local setup

```bash
npm install
npm run start:dev
```

Default API URL: `http://localhost:4000`

## First endpoints

- `POST /auth/register-admin`
- `POST /auth/register-student`
- `POST /auth/login`
- `GET /auth/google/admin`
- `GET /auth/google/admin/callback`
- `GET /questions`
- `POST /questions` admin only
- `POST /questions/import` admin only
- `POST /attempts/start`
- `POST /attempts/:id/submit`
- `POST /feedback`
- `GET /admin/analytics` admin only

This first version uses in-memory storage so the frontend can connect immediately. The next backend step is adding PostgreSQL with Prisma.

## Google admin login

Create an OAuth client in Google Cloud and add this redirect URI:

```bash
http://localhost:4000/auth/google/admin/callback
```

Then start the backend with:

```bash
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_ADMIN_EMAILS="admin@example.com"
API_BASE_URL="http://localhost:4000"
FRONTEND_ORIGIN="http://localhost:3000"
npm run start:dev
```

Use `GOOGLE_ADMIN_DOMAINS="example.com"` instead of `GOOGLE_ADMIN_EMAILS` only when every account in that domain should have admin access.
