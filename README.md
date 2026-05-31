# NEET PG Prep Platform — Complete Codebase

Full-stack CBT test platform for NEET PG / INI-CET with student portal, admin panel, and AI tutor.

---

## 📁 Project Structure

```
neet_pg_platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                  MongoDB connection
│   │   │   └── dataset.js             JSON dataset loader + sampling
│   │   ├── models/
│   │   │   ├── User.js                Auth + cumulative stats (subjectAccuracy map)
│   │   │   └── TestSession.js         Session + per-question responses + analysis
│   │   ├── controllers/
│   │   │   ├── authController.js      Register / Login / Me / UpdateMe
│   │   │   ├── testController.js      Start / Save / Submit / History / Analysis
│   │   │   ├── dashboardController.js Student dashboard aggregation
│   │   │   ├── adminController.js     Full admin CRUD (students/tests/papers/questions)
│   │   │   └── aiTutorController.js   Explain / Verify / Generate / Chat
│   │   ├── services/
│   │   │   ├── analysisEngine.js      Subject·topic·difficulty breakdown + focus engine
│   │   │   ├── testService.js         Session lifecycle management
│   │   │   └── aiTutorService.js      Anthropic Claude integration (4 features)
│   │   ├── routes/
│   │   │   ├── authRoutes.js          /api/auth/*
│   │   │   ├── testRoutes.js          /api/tests/*
│   │   │   ├── dashboardRoutes.js     /api/dashboard
│   │   │   ├── adminRoutes.js         /api/admin/*  (adminOnly guard)
│   │   │   └── aiTutorRoutes.js       /api/ai/*
│   │   ├── middleware/
│   │   │   └── auth.js                JWT protect + adminOnly
│   │   └── utils/
│   │       └── seedAdmin.js           One-time admin account seeder
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx          Score trend + subject radar + weak/strong areas
│   │   │   ├── TestSelectionPage.jsx      3-tab: Full / Subject / Topic picker
│   │   │   ├── ActiveTestPage.jsx         CBT mode: timer + palette + reason box
│   │   │   ├── AnalysisPage.jsx           5-tab: Overview/Subjects/Topics/Questions/Focus
│   │   │   ├── OverallAnalysisPage.jsx    Cumulative analytics across all tests
│   │   │   ├── HistoryPage.jsx            Paginated test history
│   │   │   ├── ProfilePage.jsx            Settings + account stats
│   │   │   ├── AiTutorPage.jsx            Chat + Generate Test + Generate MCQs
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx     KPIs + trend charts + popular papers
│   │   │       ├── AdminStudents.jsx      Student list, search, view, edit, delete
│   │   │       ├── AdminTests.jsx         All test sessions, filter by type, delete
│   │   │       ├── AdminPapers.jsx        Browse papers, edit/add/delete questions
│   │   │       └── AdminSettings.jsx      Create admin accounts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.jsx          Student sidebar (shows Admin Panel link for admins)
│   │   │   │   └── AdminLayout.jsx        Admin sidebar (amber accent)
│   │   │   └── ui/
│   │   │       └── index.jsx              Btn, Card, Badge, Spinner, ProgressBar, Alert, etc.
│   │   ├── store/
│   │   │   ├── authStore.js               Zustand: user, token, login/register/logout
│   │   │   └── testStore.js               Zustand: active session, answers, timer, submit
│   │   ├── services/
│   │   │   └── api.js                     Axios + authAPI + testAPI + dashboardAPI + adminAPI
│   │   ├── utils/
│   │   │   ├── helpers.js                 formatTime, accuracyColor, difficultyColor, etc.
│   │   │   └── examData.js                NEET PG weightage constants
│   │   ├── styles/
│   │   │   └── globals.css                Design tokens (dark theme)
│   │   ├── App.jsx                        Router + ProtectedRoute + AdminRoute guards
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## ⚡ Quick Start

### 1. Place the dataset
```bash
cp -r neet_pg_dataset/  backend/data/
# backend/data/neet_pg_dataset/_master_index.json must exist
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — fill MONGODB_URI and JWT_SECRET at minimum
npm run seed:admin        # creates admin@neetpg.local / Admin@1234
npm run dev               # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

---

## 🔑 Environment Variables (`backend/.env`)

| Variable             | Required     | Description                                 |
|----------------------|--------------|---------------------------------------------|
| `MONGODB_URI`        | ✅ Required  | MongoDB Atlas or local URI                  |
| `JWT_SECRET`         | ✅ Required  | Long random string                          |
| `JWT_EXPIRES_IN`     | ✅ Required  | e.g. `7d`                                   |
| `ANTHROPIC_API_KEY`  | Phase 3 only | For AI Tutor (chat, explain, generate)      |
| `DATASET_PATH`       | Optional     | Absolute path override for dataset folder   |
| `FRONTEND_URL`       | Optional     | CORS origin (default: `http://localhost:5173`) |
| `PORT`               | Optional     | API port (default: `5000`)                  |

---

## 👤 Roles

| Role      | Access                                                       |
|-----------|--------------------------------------------------------------|
| `student` | Dashboard, tests, analysis, AI tutor, profile               |
| `admin`   | Everything above + full Admin Panel at `/admin`              |

**First admin:** `npm run seed:admin` → `admin@neetpg.local` / `Admin@1234`  
**Additional admins:** Admin Panel → Settings → Create Admin Account

---

## 📡 API Reference

### Auth — `/api/auth`
| Method | Path         | Auth | Description          |
|--------|--------------|------|----------------------|
| POST   | `/register`  | –    | Register student     |
| POST   | `/login`     | –    | Login → JWT token    |
| GET    | `/me`        | JWT  | Current user         |
| PATCH  | `/me`        | JWT  | Update name/target   |

### Tests — `/api/tests`
| Method | Path                   | Description                          |
|--------|------------------------|--------------------------------------|
| GET    | `/papers`              | List all full/subject/topic papers   |
| POST   | `/start`               | Create session, returns questions    |
| GET    | `/history`             | Paginated user test history          |
| GET    | `/:id`                 | Full session detail                  |
| GET    | `/:id/analysis`        | Computed analysis for a session      |
| PATCH  | `/:id/response`        | Auto-save single question answer     |
| POST   | `/:id/submit`          | Submit test + run full analysis      |

### Dashboard — `/api/dashboard`
| Method | Path  | Description                             |
|--------|-------|-----------------------------------------|
| GET    | `/`   | Score trend, subject breakdown, recents |

### AI Tutor — `/api/ai`
| Method | Path                     | Description                              |
|--------|--------------------------|------------------------------------------|
| POST   | `/explain`               | Deep clinical explanation of a question  |
| POST   | `/verify-reasoning`      | AI checks student's reasoning vs. guess  |
| POST   | `/generate`              | Generate N MCQs (preview only)           |
| POST   | `/start-generated-test`  | Generate + launch as live test session   |
| POST   | `/chat`                  | Multi-turn AI tutor conversation         |

### Admin — `/api/admin` (admin role required)
| Method | Path                                  | Description                      |
|--------|---------------------------------------|----------------------------------|
| GET    | `/stats`                              | Platform KPIs + trends + charts  |
| GET    | `/students`                           | Paginated student list + search  |
| GET    | `/students/:id`                       | Student detail + recent tests    |
| PATCH  | `/students/:id`                       | Edit name/email/role/targetExam  |
| DELETE | `/students/:id`                       | Delete student + all test data   |
| GET    | `/tests`                              | All test sessions (filterable)   |
| DELETE | `/tests/:id`                          | Delete a test session            |
| GET    | `/papers?type=full\|subject\|topic`   | List paper index                 |
| GET    | `/papers/:type/:id`                   | Full paper with all questions    |
| PATCH  | `/papers/:type/:id/question`          | Edit a question                  |
| POST   | `/papers/:type/:id/question`          | Add a new question               |
| DELETE | `/papers/:type/:id/question/:qid`     | Delete a question                |
| POST   | `/create-admin`                       | Create new admin account         |

---

## 🎯 Feature Summary

### Student Portal
- **CBT Mode** — Exact NEET PG pattern, countdown timer, question palette, mark for review
- **Reasoning Box** — Per-question "why did you choose this?" input (AI-verifiable)
- **Test Analysis** — Subject accuracy, topic ranking, difficulty breakdown, focus plan
- **Overall Analytics** — Cumulative performance across all tests with score trend charts
- **AI Tutor** — Multi-turn chat, deep explanations, reasoning verification, test generation

### Admin Panel (`/admin`)
- **Dashboard** — Total students, tests today, active sessions, avg platform accuracy, trend charts
- **Students** — Full CRUD: search, view detail, edit role/name/email, delete with cascade
- **Tests** — Browse all sessions, filter by type, delete individual sessions
- **Papers** — Browse all 176 dataset files; add/edit/delete individual questions in-place
- **Settings** — Create additional admin accounts; seed script for first admin

### AI Tutor (Phase 3)
- **Chat** — Contextual multi-turn clinical Q&A with subject/topic focus
- **Explain** — Deep explanation: why correct + why each distractor is wrong + exam tip
- **Verify Reasoning** — Classifies student answer reasoning: `strong_knowledge | partial_knowledge | guess | wrong_reasoning`
- **Generate Test** — AI creates 5–50 unique MCQs → launches as live CBT session
- **Generate MCQs** — Preview MCQs with answers and explanations without starting a session

---

## 🚀 Deploy

**Frontend → Vercel**
```bash
cd frontend && npm run build
# Upload dist/ to Vercel
```

**Backend → Render / Railway**
```bash
# Build command: npm install
# Start command: node src/server.js
# Set all env vars in dashboard
```

---

## 🛠 Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | React 18, Vite, Zustand, Recharts, React Router v6 |
| Backend     | Node.js 18, Express 4, MongoDB, Mongoose 7 |
| Auth        | JWT (jsonwebtoken) + bcryptjs           |
| AI          | Anthropic Claude claude-sonnet-4        |
| Dataset     | 15,063 MCQs · 176 JSON files            |
