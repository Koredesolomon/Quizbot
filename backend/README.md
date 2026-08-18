# Quiz Bot Backend

NestJS API for the quiz platform.

## Local setup

```bash
npm install
cp .env.example .env
npm run start:dev
```

Default API URL: `http://localhost:4000`

## MongoDB

Set `MONGODB_URI` in `.env`.

Local MongoDB:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/quiz-bot
```

MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/quiz-bot
```

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

Questions, users, attempts, answers, and feedback are persisted in MongoDB.

## Uploading questions

1. Register or login as an admin.
2. Copy the returned `accessToken`.
3. Upload a question:

```bash
curl -X POST http://localhost:4000/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "objective",
    "topic": "Physical quantities and units",
    "prompt": "Which of the following is a base physical quantity?",
    "options": ["Force", "Length", "Speed", "Acceleration"],
    "answer": "Length",
    "explanation": "Length is one of the SI base quantities.",
    "marks": 2
  }'
```

Bulk import:

```bash
curl -X POST http://localhost:4000/questions/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "questions": [
      {
        "type": "objective",
        "topic": "Physical quantities and units",
        "prompt": "Which of the following is a base physical quantity?",
        "options": ["Force", "Length", "Speed", "Acceleration"],
        "answer": "Length",
        "explanation": "Length is one of the SI base quantities.",
        "marks": 2
      }
    ]
  }'
```

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
