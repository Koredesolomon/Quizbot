This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

For the full local app with MongoDB, backend API, and frontend:

```bash
npm run dev:all
```

This starts MongoDB through Docker Compose, then starts the Nest API and Next.js app.

Frontend: [http://localhost:3000](http://localhost:3000)
Backend: [http://localhost:4000](http://localhost:4000)

To run only the frontend:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin Question Uploads

1. Start the full app with `npm run dev:all`.
2. Open the admin dashboard in the app.
3. Register or sign in as an admin.
4. Use the question form for a single question, or the JSON upload/import control for bulk questions.

Admin question saves require a backend admin session. Successful form and import actions are persisted to MongoDB through the Nest API.

Question uploads can include AI engine metadata:

```json
{
  "type": "theory",
  "topic": "Dimensional analysis",
  "prompt": "State two uses of dimensional analysis in Physics.",
  "answer": "It checks equations and helps derive relationships.",
  "explanation": "A strong answer mentions dimensional consistency and deriving relations.",
  "marks": 5,
  "difficulty": "medium",
  "learningObjective": "Use dimensions to validate equations and reason about physical relationships.",
  "rubricPoints": ["Mentions checking equations", "Mentions deriving relationships", "Uses correct Physics language"],
  "commonMistakes": ["Only defines dimensions", "Gives examples without explaining uses"],
  "keywords": ["check", "equations", "derive", "relationships"]
}
```

## Student Attempts

Students must register or sign in before starting any test. When questions are loaded from the backend, their attempts,
answers, scores, and feedback are persisted through the backend and become visible in the admin dashboard.

## Hostinger VPS Development

On a VPS, Docker and MongoDB run on the server, not on a student's or admin's device. The browser only opens the
frontend URL.

Basic VPS flow:

```bash
git clone YOUR_REPO_URL
cd "Quiz bot"
npm install
npm install --prefix backend
npm run dev:all
```

`npm run dev:all` starts MongoDB through Docker Compose, then starts the Nest backend and Next frontend. MongoDB is bound
to `127.0.0.1:27017` so it is reachable by the backend on the VPS but not exposed publicly.

For a longer-running VPS dev session, run the command inside `tmux` or `screen` so it keeps running after your SSH window
closes.

Production should use process management and HTTPS rather than Next/Nest watch-mode dev servers.

## LaTeX in Questions and Answers

Admin question entry and JSON imports support LaTeX inside normal text fields. Use `$...$` for inline math and `$$...$$` for display equations.

```json
{
  "questions": [
    {
      "id": 1,
      "type": "objective",
      "topic": "Algebra",
      "prompt": "Solve for $x$: $$2x + 3 = 11$$",
      "options": ["$x = 2$", "$x = 4$", "$x = 7$", "$x = 11$"],
      "answer": "$x = 4$",
      "explanation": "Subtract 3 from both sides, then divide by 2: $x = \\frac{8}{2} = 4$.",
      "marks": 2
    }
  ]
}
```

## Webinar Google Analytics

The live webinar page supports Google Analytics 4 tracking. Create a GA4 web data stream, then set the frontend
environment variable before building or deploying:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-R5XF1VD9VF
```

The tracking script is mounted only on `/webinar`, because that is the public live page.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
