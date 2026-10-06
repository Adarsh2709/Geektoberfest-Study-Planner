# StudyFlow

StudyFlow is a Next.js study planner with account registration, subjects and topics, a weekly planner, study timers, progress summaries, and optional AI syllabus suggestions.

## Requirements

- Node.js 20.9 or newer
- npm
- A MongoDB database (local or hosted)

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI` to your MongoDB connection string.
3. Set `AUTH_SECRET` to a long random secret (at least 32 characters).
4. Optionally set `AI_API_KEY`, `AI_MODEL`, and `AI_BASE_URL` for an OpenAI-compatible chat completions endpoint. AI topic suggestions are optional; the rest of the app works without them.
5. Run `npm install`, then `npm run dev`.
6. Open `http://localhost:3000` and create an account.

For a production build, run `npm run build` and then `npm start`.

The app uses UTC calendar dates for planning. A database connection is required for registration and authenticated app features. Do not commit `.env.local` or share production secrets.
