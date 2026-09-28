# GameLearn AI — Smart Adaptive Learning Adventure

GameLearn AI is a full-stack, adaptive gamified learning platform where the **GAME ITSELF** is the core learning mechanism.

The system continuously observes learner behavior and dynamically adapts:
- Difficulty levels (D1 – D4)
- Game mechanics & modalities (Quiz, Flashcards, Puzzle, Scenario Mission, Match & Sort, Sequence / Build, Exploration, Speed Run, Boss Battle)
- Recovery activities for struggle signals & misconceptions
- Sequential world progression gates
- Learner DNA profiling (Mastery, Accuracy, Average Response Time, Misconceptions, Struggle Risk)

---

## Core Intelligence Loop

```
Learner DNA
  ↓
Skill & Behavioral Signal Analysis
  ↓
Misconception & Struggle Detection
  ↓
Adaptive Decision Engine (Rule-based & Explainable)
  ↓
Game/Quest Selection & Generation
  ↓
Learner Gameplay Attempt
  ↓
Result Analysis & Signal Extraction
  ↓
Update Learner DNA & World Mastery
  ↓
Next Adaptive Activity Recommendation
```

---

## Tech Stack

### Backend
- **Node.js** & **Express.js** (REST API)
- **MongoDB** & **Mongoose** (Database & Schemas)
- **JWT** (JSON Web Tokens) & **bcryptjs** (Authentication & Security)
- **CORS**, **dotenv**, **express-validator**

### Frontend
- **React 18** & **Vite**
- Custom CSS / Responsive Layouts
- Local state & localStorage fallback resilience

---

## Architecture Overview

```
GameLearn-AI-MVP-V2/
│
├── server/
│   ├── server.js                      ← Main Express entry point & health checks
│   ├── config/
│   │   └── db.js                      ← MongoDB Mongoose connection
│   ├── models/                        ← MongoDB Schemas
│   │   ├── User.js
│   │   ├── LearningSpace.js
│   │   ├── Syllabus.js
│   │   ├── World.js
│   │   ├── Resource.js
│   │   ├── LearnerProfile.js
│   │   ├── GameSession.js
│   │   ├── GameAttempt.js
│   │   └── Progress.js
│   ├── routes/                        ← Express REST Endpoints
│   │   ├── auth.routes.js
│   │   ├── learningSpace.routes.js
│   │   ├── syllabus.routes.js
│   │   ├── world.routes.js
│   │   ├── game.routes.js
│   │   ├── learner.routes.js
│   │   ├── analytics.routes.js
│   │   └── resource.routes.js
│   ├── controllers/                   ← Request controllers
│   ├── services/                      ← Business logic & Adaptive Services
│   │   ├── adaptive.service.js        ← Rule-based adaptive engine
│   │   ├── learnerDNA.service.js       ← Learner DNA calculation
│   │   ├── misconception.service.js   ← Misconception detector
│   │   ├── struggle.service.js        ← Struggle risk calculation
│   │   ├── progression.service.js     ← Sequential world unlock gates
│   │   └── ai.service.js              ← Optional Gemini mentor service
│   ├── middleware/
│   │   ├── auth.middleware.js         ← JWT auth & guest fallback
│   │   └── error.middleware.js        ← Centralized error handling
│   └── utils/
│       └── seed.js                    ← Database seed script
│
├── src/                               ← React Frontend
│   ├── services/
│   │   ├── api.js                     ← Backend API client with offline fallback
│   │   └── v2storage.js               ← Local storage backup
│   ├── adaptive/                      ← Frontend adaptive engine & state
│   ├── data/                          ← Syllabus content & game banks
│   ├── App.jsx                        ← Main React app component
│   └── index.css                      ← Global styling
│
├── .env.example
└── package.json
```

---

## Environment Variables

Copy `.env.example` to `.env`:

```env
# Server Configuration
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gamelearn
# REQUIRED — generate a strong secret; the server refuses to start without one:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
JWT_SECRET=
GEMINI_API_KEY=your_gemini_api_key_here
# Optional: comma-separated allowed browser origins (production defaults to
# same-origin only when unset)
CORS_ORIGIN=

# Client Configuration
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=
```

---

## Getting Started

### 1. Installation

Install all backend and frontend dependencies:

```bash
npm install
```

### 2. Seed Database (Optional)

Populate MongoDB with the default Programming demo syllabus and initial space:

```bash
npm run seed
```

### 3. Run Development Environment (Full Stack)

Start both the Express backend server (`localhost:5000`) and the Vite React frontend (`localhost:5173`) concurrently:

```bash
npm run dev
```

### 4. Running Components Individually

- **Backend Server only**:
  ```bash
  npm run server
  ```

- **Frontend Client only**:
  ```bash
  npm run client
  ```

- **Production Build**:
  ```bash
  npm run build
  ```

---

## API Summary

- `GET /api/health` — API status health check
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User authentication & JWT generation
- `GET /api/spaces` — Retrieve all learning spaces for user
- `POST /api/spaces` — Create a new learning space
- `POST /api/spaces/:id/syllabus` — Save & render syllabus into worlds
- `GET /api/spaces/:id/worlds` — Fetch worlds with unlock progression state
- `POST /api/worlds/:id/game/start` — Start an adaptive game session
- `POST /api/games/attempt` — Submit game attempt & trigger Learner DNA update
- `GET /api/spaces/:id/learner/dna` — Fetch real-time Learner DNA state
- `GET /api/spaces/:id/analytics` — Fetch evidence of learning & game accuracy
- `POST /api/nova/ask` — Query contextual Nova AI mentor

---

## License

MIT
