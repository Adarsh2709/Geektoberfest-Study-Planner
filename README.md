# StudyFlow 📚⚡

A modern, full-stack study planning application built with Next.js, React, Tailwind CSS, and MongoDB. StudyFlow helps students organize subjects, plan daily study sessions, track focus time with timers, monitor progress with visual analytics, and get optional AI-assisted syllabus breakdowns.

---

## ✨ Features

- **🔐 User Authentication**: Secure registration and session management powered by JWTs and Jose.
- **📚 Subjects & Topics**: Organize study material into structured subjects with topics and priority levels.
- **📅 Weekly Planner**: Calendar-based study planner using UTC dates to assign and manage upcoming study sessions.
- **⏱️ Study Timers & Focus Tracking**: Built-in stopwatch/timer to log focus hours directly against planned topics.
- **📊 Progress & Analytics**: Rich progress summaries and interactive charts built with Recharts.
- **🤖 AI Syllabus Suggestions (Optional)**: Generate syllabus topics and learning roadmap recommendations using OpenAI-compatible APIs.
- **🎨 Modern Responsive UI**: Sleek, responsive interface built with Tailwind CSS and Lucide icons.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server & Client Components)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Backend / Database**: Next.js Route Handlers, [Mongoose](https://mongoosejs.com/), MongoDB
- **Authentication**: JWT handling via [jose](https://github.com/panva/jose) and password hashing with [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Validation**: [Zod](https://zod.dev/)

---

## 📋 Requirements

- **Node.js**: `20.9.0` or newer
- **npm**: `10.x` or newer
- **MongoDB**: A running local MongoDB instance or MongoDB Atlas cluster URI

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sai-kore/studyflow-nextjs.git
cd studyflow-nextjs
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/studyflow
AUTH_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

# Optional: AI Topic Suggestions (OpenAI-compatible)
AI_API_KEY=your_ai_api_key
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: You can generate a secure `AUTH_SECRET` using:
> ```bash
> openssl rand -base64 32
> ```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to get started.

---

## 📦 Production Build

To build and start the application for production:

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```text
studyflow-nextjs/
├── app/
│   ├── (auth)/             # Login and registration routes
│   ├── (dashboard)/        # Main app features (Dashboard, Planner, Today, Progress, Subjects, Settings)
│   ├── api/                # Backend API endpoints (Auth, Subjects, Planner, AI, etc.)
│   ├── onboarding/         # First-time user onboarding
│   ├── layout.js           # Root layout
│   └── page.js             # Landing page
├── components/             # Reusable UI components & layouts
├── hooks/                  # Custom React hooks
├── lib/                    # Database connection, auth helpers, utility functions
├── models/                 # Mongoose schemas & models (User, Subject, Plan, etc.)
├── public/                 # Static assets
├── .env.example            # Sample environment variables
└── CONTRIBUTION.md         # Contribution guidelines
```

---

## 🌍 Time Zones

StudyFlow stores every timestamp in **UTC** and treats the user's time zone as a
display/bucketing concern applied when deriving calendar days.

- Each user has an IANA time zone in `preferences.timeZone` (default `UTC`),
  editable on the **Settings** page.
- `dayKey(date, timeZone)` / `todayKey(timeZone)` / `startOfToday(timeZone)` in
  [`lib/utils.js`](lib/utils.js) resolve the calendar day in that zone (via
  `Intl`); omitting the zone falls back to UTC. "Today", daily sessions, streaks,
  weekly planning and progress all pivot on the user's local day.
- Day-level arithmetic uses canonical UTC-midnight **anchors** that are exactly
  24h apart, so it stays correct across daylight-saving transitions.
- **Exam dates** are stored and read as plain `YYYY-MM-DD` calendar dates, so
  they never shift a day when the zone changes.
- Changing the zone requires no data migration — days are derived at read time
  and the default (`UTC`) reproduces the previous behaviour.

Run the date/zone unit tests with `npm test`.

---

## 🤝 Contributing

Contributions are welcome! Please check out our [CONTRIBUTION.md](file:///home/sai/Developement/Geektober-Projects/studyflow-nextjs/CONTRIBUTION.md) for details on our code of conduct, development setup, and pull request workflow.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
