# Cognix Production Transformation Log

> **THIS FILE IS THE PERMANENT COGNIX DEVELOPMENT LOG.**
> Every future coding session must READ this file before making changes and UPDATE it after completing verified work.
> Never mark work complete without verification. Never mark future work as completed.
> The ONLY rules that override this file are the live code itself — when they disagree, the code is the truth and this file must be corrected.

---

## Phase 0 — Original Prototype Baseline

- **Date:** 2026-09-28
- **Auditor:** Lead architect (Phase 0 audit — code inspection only, no modifications)
- **Repository:** `https://github.com/sindhiya0311/cognix-ai`
- **Repository state:**
  - Branch: `vish` (created from `main`), single commit `f6ff39d` "Initial Cognix full-stack implementation"
  - **Working tree contains UNCOMMITTED changes** inherited from a previous session: ownership checks added across controllers, `protect` + rate limit + validation added to NOVA, new `server/middleware/security.middleware.js`, new `src/shared/domain/adaptive.js` (shared adaptive engine), deletion of the V1 dead-code cluster (`src/adaptive/*`, 11 V1 components, 4 V1 services), rewritten `aiGameContent.service.js`, and `COGNIX_PRODUCTION_CHANGELOG.md` (untracked).
  - A prior session's changelog (`COGNIX_PRODUCTION_CHANGELOG.md`) claims "Phase 1 Implemented + Verified — Remaining work: None." **This audit contradicts that claim**: the security work is real in the working tree but is *uncommitted*, and significant security gaps remain open (§10, §16 below).
  - No `.github/` (no CI), no test framework (`server/utils/test_e2e.js` is a manual script, not wired to `npm`), no linter/formatter config, no TypeScript (plain JS/JSX).
  - `node_modules` present. All 47 server/src JS files pass `node --check` (syntax clean).
- **Technology stack:**
  - Frontend: React 18 + Vite 5, plain JavaScript, custom CSS, `localStorage` persistence
  - Backend: Node.js + Express 5 (ESM), MongoDB + Mongoose 9
  - Auth: JWT (30-day expiry) + bcryptjs
  - AI: OpenRouter gateway (Gemini 2.0 Flash primary, GPT-4o-mini fallback) + legacy direct Gemini fallback
  - Declared-but-unused deps: `express-validator` (never imported), `pdf-parse` (only reachable through an unrouted controller)
- **Architecture summary:** SPA with state-based routing and a monolithic `App.jsx` (~1,160 lines) over an Express REST API with clean route→controller→service→model layering. MongoDB is optional at runtime (server starts in degraded "standalone mode" if DB is unreachable). All AI calls degrade to keyword/template fallbacks if keys are missing.
- **Existing product capabilities:** register/login; Learning Spaces; syllabus→world generation (AI parser + heuristic + demo); 8 playable game modalities (quiz, flashcards, puzzle, scenario, match, sequence, explore, speed) + boss modal; deterministic adaptive recommendation engine; per-world mastery with sequential gates; Learner DNA (mastery/accuracy/avgTime/attempts/errors/struggle/misconceptions); XP/level/streak; notes/resources; contextual AI mentor NOVA; analytics computed client-side.
- **Existing strengths:** real end-to-end adaptive loop (not mock); deterministic explainable rules; shared adaptive domain module between client and server (working tree); ownership checks on every data controller (working tree); graceful degradation everywhere (DB-less, AI-less, offline); World.history bounded (last 30); centralized error middleware with env-aware stack masking; health endpoint; `.env` gitignored; seed script; evidence records capture responseTime/hints/difficulty.
- **Existing weaknesses:** client-authoritative learning results; no RAG despite UI claims; monolithic App.jsx; state-based routing only; no tests/CI; silent error swallowing in the API client; dual learner-state computation with divergent algorithms; boss progress never persisted; dead endpoints and dead code; broken string encoding (mojibake) in several UI files.
- **Security findings:** see §10 (full P0–P3 classification). Highlights: no auth rate limiting; mass assignment on `PUT /api/spaces/:id`; client-supplied attempt results; `localStorage` cross-user leakage; default JWT secret documented in `.env.example`/README; no security headers/CSP; in-memory-only rate limiter.
- **Data model findings:** see §11. Nine Mongoose models; `Progress` model is entirely unused; attempt data duplicated between `World.history` and `GameAttempt`; only two unique indexes; no indexes on hot query paths (`World.learningSpaceId`, `GameAttempt.learningSpaceId`).
- **AI findings:** see §9. NOVA is a state-aware **chatbot**, not an orchestrator — it has no tools and takes no actions. Server AI content generation exists but the UI never calls it; actual gameplay content comes from hardcoded client-side banks. AI outputs are not schema-validated.
- **Adaptive-learning findings:** see §5–§8. The core loop is genuinely implemented and deterministic, but the `space` argument to `decideNextActivity` is unused, the REGRESSION→REVIEW rule does not exist, hint usage does not influence adaptation, and progression thresholds are inconsistent (0.7 vs 0.72) across three implementations.
- **Known technical debt:** monolithic `App.jsx`; 34KB single CSS file; duplicated syllabus-parsing logic (client `parseSyllabus` vs server `parseSyllabusHeuristic`); duplicated NOVA fallback logic (server `ai.service.js` vs client `askNova`); N+1 queries in `getLearningSpaces`; orphaned exports (`WORLD_DEFS`, `content.js`, `apiNova.ask`); unrouted `parseSyllabusFile`; dead `GameSession` flow; mojibake strings.
- **Known production blockers:** (1) learning evidence is forgeable from the client; (2) no tests/CI; (3) auth endpoints unrate-limited + secret management; (4) cross-user localStorage leak; (5) silent API failure handling hides auth/sync errors; (6) boss/offline progress loss on reload; (7) UI makes false claims ("indexed for AI", PDF support) that erode product trust.

---

## Transformation Roadmap

> Future phases. NOT started. NOT completed. Status will be updated only after verified work.

| Phase | Scope | Status |
|---|---|---|
| Phase 0 | Production baseline + deep repository audit | ✅ Complete (this document) |
| Phase 0.5 | Commit & runtime-verify the inherited uncommitted security work | ✅ Complete (`a68b41b`, `ebf6633`) |
| Phase 1 | Security + authorization hardening + minimal test foundation | ✅ Complete (`e277d34`) |
| Phase 2 | Server-authoritative state | ⬜ Not started |
| Phase 3 | Adaptive engine consolidation | ⬜ Not started |
| Phase 4 | Learning evidence | ⬜ Not started |
| Phase 5 | RAG / knowledge grounding | ⬜ Not started |
| Phase 6 | Quiz reliability | ⬜ Not started |
| Phase 7 | NOVA orchestration | ⬜ Not started |
| Phase 8 | Quest + prerequisite system | ⬜ Not started |
| Phase 9 | Routing + architecture cleanup | ⬜ Not started |
| Phase 10 | Offline synchronization | ⬜ Not started |
| Phase 11 | Observability + rate limiting | ⬜ Not started |
| Phase 12 | Testing | ⬜ Not started |
| Phase 13 | Performance + accessibility | ⬜ Not started |
| Phase 14 | Production verification | ⬜ Not started |

(Detailed phase definitions and ordering rationale: §18.)

---

# COGNIX PRODUCTION BASELINE

## 1. Current Stack

| Layer | Technology | Evidence |
|---|---|---|
| Frontend | React 18.3, Vite 5.4, plain JS/JSX, custom CSS (34KB `index.css`) | `package.json`, `vite.config.js` |
| Routing | None — `useState("page")` state machine inside `App.jsx` | `src/App.jsx:45` |
| Backend | Express 5.2 (ESM modules), port 5000 | `server/server.js` |
| Database | MongoDB via Mongoose 9.10; **degrades to no-DB mode on failure** | `server/config/db.js` |
| Auth | JWT `jsonwebtoken` 9, 30-day expiry; bcryptjs hashing (salt 10) | `server/middleware/auth.middleware.js`, `auth.controller.js`, `models/User.js` |
| AI | OpenRouter `/chat/completions` (Gemini 2.0 Flash → GPT-4o-mini → legacy Gemini → keyword fallback) | `server/services/ai/openrouter.service.js` |
| File parsing | `pdf-parse` — **effectively unreachable** (only called from unrouted `parseSyllabusFile`) | `syllabusAI.service.js`, `syllabus.routes.js` |
| Validation | `express-validator` declared but **never imported anywhere** | `package.json` vs grep |
| Persistence (client) | `localStorage`: `cognix_v2` (spaces mirror), `cognix_token` (JWT) | `v2storage.js`, `api.js` |
| Tooling | `concurrently` dev script; **no tests, no CI, no lint, no TS** | `package.json`, no `.github/` |

## 2. Current Architecture

```
┌─ FRONTEND (src/) ─────────────────────────────────────────────┐
│  main.jsx → App.jsx (1,160-line monolith, state routing)      │
│  ├─ components/  AuthScreen, GameWorldMap, ui/* (5 files)      │
│  ├─ services/    api.js (fetch wrapper + silent fallback)      │
│  │               v2storage.js (localStorage mirror)           │
│  ├─ shared/      domain/adaptive.js ← SINGLE adaptive engine   │
│  └─ data/        v2data.js (demo syllabus + question banks)    │
│                  content.js (V1 — ORPHANED, 249 lines)         │
└──────────────┬─────────────────────────────────────────────────┘
               │ fetch, Bearer JWT (or silent localStorage fallback)
┌──────────────▼─────────────────────────────────────────────────┐
│  server/server.js  · CORS(*) · express.json · NOVA route       │
│  ├─ middleware/  auth(protect) · error · security(rate,valid)  │
│  ├─ routes/      8 routers (auth, spaces, syllabus, world,     │
│  │               game, learner, analytics, resource)           │
│  ├─ controllers/ 9 files — all with ownership checks           │
│  ├─ services/    adaptive(re-export→shared) · learnerDNA ·     │
│  │               struggle · misconception · progression ·      │
│  │               aiGameContent · syllabusAI · ai(NOVA) ·       │
│  │               worldGeneration · ai/openrouter               │
│  ├─ models/      9 schemas (Progress = UNUSED)                 │
│  └─ utils/       seed.js · test_e2e.js (manual script)         │
└──────────────┬─────────────────────────────────────────────────┘
               │ Mongoose
        ┌──────▼───────┐        ┌──────────────────┐
        │   MongoDB     │       │ OpenRouter / Gemini│
        │  (optional)   │       │   (optional)       │
        └──────────────┘        └──────────────────┘
```

Component → files: Frontend `src/**`; Backend `server/**`; Database `server/models/*`, `server/config/db.js`; AI `server/services/ai/*`, `ai.service.js`, `aiGameContent.service.js`, `syllabusAI.service.js`; Storage `src/services/v2storage.js` + Mongo; Authentication `auth.middleware.js`, `auth.controller.js`, `auth.routes.js`; Adaptive Engine `src/shared/domain/adaptive.js` (consumed by `server/services/adaptive.service.js` + `App.jsx`); Learning Evidence `World.history` + `GameAttempt` model + `game.controller.js`; NOVA `server.js:38` → `ai.service.js` → `openrouter.service.js`; **RAG: does not exist** (only `Resource` model); Synchronization: none — one-shot fetch + per-attempt POST.

## 3. Current Product Flow (traced through actual files)

**What is the application?** A gamified adaptive learning platform: a learner creates a Learning Space, turns a syllabus into a sequence of "worlds" (topics), plays game activities inside worlds, and a deterministic engine picks the next activity from their behavior. The game itself is the assessment instrument.

**What does a user do?** `AuthScreen.jsx` → register/login (`api.js` `apiAuth`) → lands on `Spaces` page → creates space (`createSpace` → `POST /api/spaces`, which server-side parses a syllabus and generates worlds) → `GameWorldMap` shows winding path of worlds → opens `WorldDetail` → "NEXT BEST ACTION" recommendation or free choice → `GameScreen`/`GameRunner` plays one of 8 modalities → `finishGame` records result.

**When a learner starts learning:** first world auto-unlocked (`makeWorlds` sets `unlocked: ui===0 && ti===0`); `decideNextActivity` sees `attempts===0` → recommends `world.games[0]` ("Start with a baseline check") → content comes from `worldGames()` **client-side bank** (the server `game/start` endpoint is never called by the UI).

**Answer correctly:** `GameRunner.finish(true, 0.95)` → `finishGame` (`App.jsx:186`) → local `applyGameResult` (mastery +0.18×difficulty×confidence, history append, XP +20×difficulty, streak++) → POST `/api/games/attempt` → server re-runs `applyGameResult` on its copy, writes `GameAttempt`, upserts `LearnerProfile` via `calculateLearnerDNA`, computes `nextDecision`, saves `space.lastAction` → response merged back into client state.

**Answer incorrectly:** mastery −0.04, difficulty −1 (min 1), streak reset, history records the miss → next `decideNextActivity` hits the recovery branch when `accuracy<0.5 || errors≥2` (mode `recovery`, difficulty lowered, modality changed) or the guided branch after a single miss (modality rotation).

**Data captured:** per attempt: `game, correct, confidence, seconds, difficulty, hintUsed` → stored in `World.history` (capped 30) AND `GameAttempt` rows; aggregates in `LearnerProfile` + `LearningSpace` (xp/level/streak/gamesCompleted/lastAction); raw notes in `Resource`.

**Where stored:** MongoDB (primary). If DB unreachable → everything silently falls back to `localStorage` (`cognix_v2`).

**How learner state changes:** `LearnerProfile` recomputed from *all* worlds' histories after every attempt (`calculateLearnerDNA`); client independently recomputes `space.learner` in `finishGame`, then overwrites it with the server's DNA when the response arrives.

**How the next activity changes:** `decideNextActivity(space, world)` → `{game, difficulty, mode, reason, bossReady}` → shown as recommendation in `WorldDetail`/`Progress`; **advisory only** — the learner can click any game. Server difficulty (stored on World) feeds the next decision.

**How progression works:** `checkProgression` unlocks world *i* only when world *i−1* mastery ≥ 0.72 (server) / client map uses 0.7; boss gate at 0.72 mastery; boss completion is **client-side only** (`completeBoss` never calls the server).

**How NOVA works:** floating panel → `askNova` builds context from React state + `window.__currentTaskContext` → `POST /api/nova/ask` (protect + 20 req/min + input validation) → prompt includes expected answer, learner stats → OpenRouter → keyword fallback → reply rendered. NOVA never touches the database and can take no actions.

**Dashboard data:** `Analytics` and `Progress` pages compute **entirely from client state** (`space.worlds` histories). The server endpoints `/api/spaces/:id/analytics`, `/learner`, `/learner/dna` exist and are ownership-checked but are **never called by the UI**.

## 4. Existing Strengths

1. **The adaptive loop is real.** Signals → evidence → state → decision → next activity is fully wired with deterministic, explainable rules (`reason` strings are human-readable).
2. **Single adaptive engine source** (`src/shared/domain/adaptive.js`) consumed by both client and server — the previous client/server engine duplication was already consolidated in the working tree.
3. **Defense-in-depth degradation:** DB-less mode, AI-fallback chain, structural quiz fallback, localStorage mirror — the UI never hard-breaks.
4. **Object-level authorization present on every data controller** (working tree): space ownership verified before read/write/delete across 9 controllers.
5. **NOVA endpoint protected** with auth + rate limit + input validation (working tree).
6. **Bounded data growth** on the hot path: `World.history` capped at 30 attempts.
7. **Clean backend layering** (routes/controllers/services/models), centralized error handler, health check, gitignored secrets, seed script.
8. **Evidence-rich attempt records:** response time, hints, difficulty, misconception, expected vs selected answer fields exist in the schema.

## 5. Existing Adaptive Learning Implementation

**Core loop audit** (`THE LEARNING PATH LEARNS THE LEARNER`):

| Stage | Status | Files | Functions | Data | Runtime flow | Problems |
|---|---|---|---|---|---|---|
| LEARNER ACTION | ✅ REAL | `App.jsx` GameRunner → `api.js` | `finish()` → `finishGame()` → `submitAttempt` | result `{game,correct,confidence,seconds,difficulty,hintUsed}` | UI click → `POST /api/games/attempt` | Correctness decided **in the browser** |
| LEARNING SIGNALS | ✅ REAL | `src/shared/domain/adaptive.js` | `signalsForWorld` | attempts, accuracy, avgTime, errors, wrongStreak | computed from `world.history` | hint usage captured but never read by signals |
| LEARNING EVIDENCE | ⚠️ PARTIAL | `World.history`, `models/GameAttempt.js` | `applyGameResult` appends | 30-cap attempt records + `GameAttempt` rows | written server-side on submit | two parallel evidence stores; no semantic "evidence" model; `hintUsed`/`confidence` not in DNA |
| LEARNER STATE | ⚠️ PARTIAL | `LearnerProfile`, `learnerDNA.service.js`, `App.jsx:191-200` | `calculateLearnerDNA` + client inline recompute | mastery, accuracy, avgTime, attempts, errors, struggleRisk, misconceptions | server upsert per attempt; client mirrors | **divergent client/server struggle algorithms**; server `hints` stays 0 forever; client `hintUsed` increments lost on server overwrite |
| ADAPTIVE DECISION | ✅ REAL | `src/shared/domain/adaptive.js` | `decideNextActivity` | game, difficulty, mode, reason, bossReady | called by server (start/submit) and client (recommendation UI) | **`space` parameter is unused** — decision sees only world history; REGRESSION→REVIEW rule missing; `bossReady` computed but unused by UI |
| NEXT EXPERIENCE | ⚠️ PARTIAL | `App.jsx` `playGame`, `game.controller.js` | `playGame` → client bank; server `startGameSession` **never called by UI** | client-side question banks | recommendation → click → content from `v2data.js` | server AI content generation orphaned from UI; recommendation is advisory (user can ignore it) |
| NEW EVIDENCE | ✅ REAL | loop closes | — | — | attempt → history → next signals | correct, but inherits client-authoritative flaw |

**Deterministic rule inventory** (all in `src/shared/domain/adaptive.js`):

| Rule | Exists? | Location | Inputs → Output | Deterministic? | Affects next activity? |
|---|---|---|---|---|---|
| LOW MASTERY + REPEATED ERRORS → RECOVERY | ✅ | line 22-27 | accuracy<0.5 \|\| errors≥2 → modality change + difficulty−1 + mode `recovery` | ✅ | ✅ recommendation + stored difficulty |
| HIGH ACCURACY + FAST RESPONSE → CHALLENGE | ✅ | line 33-37 | accuracy≥0.8 && 0<avgTime<12s → difficulty+1, game `speed`/`puzzle`, mode `challenge` | ✅ | ✅ |
| STRUGGLE → LOWER DIFFICULTY | ✅ | line 25 | same recovery branch | ✅ | ✅ |
| STRUGGLE → DIFFERENT MODALITY | ✅ | line 24, 29 | recovery picks alternate; single miss → rotation map | ✅ | ✅ |
| MASTERY → NEW REGION | ⚠️ elsewhere | `progression.service.js` + `GameWorldMap.jsx:67` + `world.controller.js unlockWorld` | prev world mastery ≥ 0.72 (server) / 0.7 (client) → unlock | ⚠️ **3 implementations, 2 thresholds** | ✅ but server `unlockWorld` endpoint is never called by UI |
| MASTERY + PREREQUISITES → BOSS | ⚠️ partial | line 46 `bossReady`; `App.jsx:624` | mastery≥0.72 && accuracy≥0.65 && attempts≥4 | ✅ engine / ❌ UI ignores bossReady (UI gates on mastery only); **boss completion never persisted** | ⚠️ |
| REGRESSION → REVIEW | ❌ **MISSING** | — | no review mode, no regression detection | — | — |

## 6. Existing Learner Model

Per-value SOURCE → CALCULATION → STORAGE → CONSUMER:

| State value | Source | Calculation | Storage | Consumer | Hardcoded elements |
|---|---|---|---|---|---|
| Overall mastery | world masteries | mean of `world.mastery` | `LearnerProfile.mastery` + client | Progress page, NOVA prompt | — |
| Concept mastery | attempt results | `applyGameResult`: +0.18×diff×(0.75+0.25·conf) / −0.04; flashcards weight 0.12 | `World.mastery` | progression gates, recommendations | weights 0.18/0.12, penalty 0.04, cap 1.0 |
| Accuracy | history | correct/attempts | `LearnerProfile.accuracy` | decision branches, bossReady | — |
| Response time | `seconds` per attempt | mean of history | `LearnerProfile.avgTime` | challenge rule (<12s), struggle (>20s) | thresholds 12s/20s |
| Attempts | history length | count | `LearnerProfile.attempts` | bossReady (≥4) | — |
| Errors | history misses | count | `LearnerProfile.errors` | recovery rule (≥2) | — |
| Hints | `hintUsed` flag | client increments `space.learner.hints` | **client only** — `LearnerProfile.hints` never updated server-side | Progress display only | **does NOT influence adaptation** |
| Difficulty | attempt difficulty | `applyGameResult` raises/lowers `world.difficulty` | `World.difficulty` | decision, XP multiplier, content generation | range 1–4, raise at mastery≥0.7 |
| Struggle | errors + recency + time | `struggle.service.js` scoring (≥4 HIGH, ≥2 MEDIUM) | `LearnerProfile.struggleRisk` | DNA display, NOVA prompt | **3 divergent implementations** (server service / `App.jsx:199` / `WorldDetail:619`) |
| Misconceptions | ≥2 wrong in a world | game-type→generic label | `LearnerProfile.misconceptions` | Progress display, NOVA prompt | labels are generic strings; **never fed to content generation** (callers pass `misconception=null`) |
| Learning trends | — | — | — | — | **MISSING** |
| Current concept | `selectedWorld` | React state | not persisted | UI navigation | lost on refresh |
| Review state | — | — | — | — | **MISSING** (no review concept) |
| Progression readiness | `bossReady` | engine line 46 | response-only | **unused by UI** | — |

## 7. Existing Quest / Game System

**No quest entity exists.** There is no Quest model, no persisted quest record. "Quests" are *labels on recommendations* (`mode`) plus one client-side modal.

| Concept | How created | Trigger | Persisted? | UI | Depends on learner state? | Completing changes state? |
|---|---|---|---|---|---|---|
| Main Quest | implicit — world progression | map navigation | ❌ (derived) | `GameWorldMap`, `WorldDetail` "NEXT BEST ACTION" | ✅ | ✅ via attempts |
| Practice | free choice of any game | user click | ❌ | `WorldDetail` "Choose an experience" | ❌ (bypasses engine) | ✅ |
| Recovery Quest | `mode:"recovery"` from `decideNextActivity` | **genuine struggle signals** (accuracy<0.5 or errors≥2) | ❌ label only | shown as knowledge state + reason text | ✅ **genuinely triggered by struggle — NOT merely a visual mode** | ✅ (normal attempt flow) |
| Review | — | — | — | — | — | **DOES NOT EXIST** |
| Challenge | `mode:"challenge"` | accuracy≥0.8 + fast | ❌ label only | recommendation tile | ✅ | ✅ |
| Boss | `BossModal` client component | UI gate: mastery≥0.72 (engine's stricter `bossReady` ignored) | ❌ **client-only — `completeBoss` never calls the server; progress lost on reload** | modal + map node (**map boss button has no `onClick` — dead**) | ⚠️ partial | ❌ **no server-side effect** |

## 8. Existing NOVA System

- **Invocation:** `App.jsx askNova` → `apiNova.askContextual` → `POST /api/nova/ask` (protect + rate limit 20/min + query validation ≤1000 chars) → `askNovaMentor(context, query)`.
- **Context (all client-built, never fetched server-side):** learning space name/subject, world name/unit, game type/difficulty, current task prompt/options/**expected answer**/learner answer (via `window.__currentTaskContext`), learner mastery/accuracy/struggle/misconceptions.
- **What NOVA knows:** space ✅ · world ✅ · syllabus ❌ · current concept ✅ · learner state ⚠️ (client copy only) · evidence ❌ · memory/resources ❌ · current activity ✅ · current quest ❌ · next best action ⚠️ (can explain the engine's choice; no independent recommendation field; `apiNova.ask` 4-arg variant with `decision` is **orphaned** — UI never calls it).
- **Verdict: CHATBOT, not orchestrator.** Can: explain ✅, hint ✅, describe progress ✅, post-hoc justify the engine's pick ✅. Cannot: generate quiz ❌, generate flashcards ❌, create practice ❌, create recovery ❌, recommend next action ❌, trigger any activity ❌. **Zero tools, zero DB access, zero side effects.**
- **Fallback:** if OpenRouter fails → server keyword fallback (`ai.service.js`) → if HTTP fails entirely → *second, duplicated* keyword fallback client-side (`App.jsx askNova`). Two fallback implementations can disagree.
- **Grounding:** NO — prompt contains only client state; uploaded resources are never included.

## 9. Existing Knowledge / RAG System

**Pipeline trace: `UPLOAD → STORAGE → EXTRACTION → CHUNKING → EMBEDDING → RETRIEVAL → AI CONTEXT → GENERATED CONTENT`**

| Stage | Status | Evidence |
|---|---|---|
| UPLOAD | ⚠️ PARTIAL | Notes: text via `EditorCard` (unbounded). Files: `FileReader.readAsText` truncated to 5,000 chars (`App.jsx:948`) — **PDFs stored as raw binary text** |
| STORAGE | ✅ | `Resource` model, ownership-checked CRUD |
| EXTRACTION | ❌ | `extractTextFromBuffer`/`pdf-parse` reachable only from `parseSyllabusFile` — **not mounted in any router**; client syllabus "PDF" path parses the **file name** (`parseSyllabus(f.name)`) → falls back to canned units |
| CHUNKING | ❌ | does not exist |
| EMBEDDING | ❌ | no vector DB, no embeddings, no dependencies for either |
| RETRIEVAL | ❌ | does not exist |
| AI CONTEXT | ❌ | no code path ever sends `Resource.text` to NOVA or content generation (grep-verified) |
| GENERATED CONTENT | ❌ | quizzes come from hardcoded banks/templates — **not grounded in uploaded material** |

- **User isolation of resources:** ✅ (space ownership checks on create/read/delete; note: `deleteResource` skips the check if the space record is gone — P3).
- **UI claims are false:** "automatically indexed for Nova & AI questions", "indexed into space memory", "Uploaded and processed for AI syllabus analysis and RAG context" (`ResourceCard.jsx`) — nothing is indexed.
- **Syllabus path note:** client always sends parsed `units`, so the server AI parser `analyzeSyllabusAI` is unreachable from the UI (only via direct API `rawText`, e.g. `test_e2e.js`).

## 10. Existing Security Model (SECURITY AUDIT — report only, nothing modified)

**Improvements verified present in the (uncommitted) working tree:** `protect` on NOVA; rate limits on NOVA (20/min) and game API (30/min); NOVA input validation; ownership checks on every space-scoped controller; error handler masks stack traces in production; JWT requires `JWT_SECRET` (fails closed if unset); `.env` gitignored.

**Open findings:**

### P0 CRITICAL
*None open in the current working tree — but see P1 conditional criticals. Note: at commit `f6ff39d` (HEAD), NOVA was unauthenticated and controllers had no ownership checks; **that code is still what a fresh clone gets until the working tree is committed** (Phase 0.5).*

### P1 HIGH
1. **Forgeable learning evidence.** `POST /api/games/attempt` trusts client-supplied `correct`, `difficulty`, `confidence` (`game.controller.js:88-110`). Mastery, XP, DNA — the product's core evidence — can be fabricated by any authenticated user with curl. *Client decides correctness at `App.jsx:689`.*
2. **No rate limiting / lockout on `/api/auth/*`.** Login and register are unprotected → brute force / credential stuffing (`auth.routes.js`).
3. **Documented default JWT secret** (`JWT_SECRET=gamelearn_secret_key_mvp_2026` in `.env.example` **and** README). If deployed as documented → universal token forgery. *Conditional P0 at deployment.*
4. **Mass assignment.** `updateLearningSpace` passes `req.body` directly to `findByIdAndUpdate` (`learningSpace.controller.js`) — client can overwrite `xp`, `level`, `syllabusId`, `learnerProfileId`, `userId` (ownership is checked *before* the update, but arbitrary fields are writable).
5. **Cross-user `localStorage` leak.** `cognix_v2` is not user-namespaced; `fetchRemoteSpaces` only replaces local state when the server returns ≥1 space (`App.jsx:76-88`) — a fresh account on a shared browser **inherits the previous user's spaces**, then persists them.
6. **Silent auth-failure swallowing.** `request()` in `api.js` catches *all* errors including 401/403/4xx and returns `null` with only a console warning → expired/revoked sessions and authorization failures degrade invisibly to stale local data.
7. **NOVA context is fully client-supplied** — the server never validates context against the database (integrity of guidance; also means `expectedAnswer` is routinely shipped to the client by design of `__currentTaskContext`).

### P2 MEDIUM
8. **No security headers / CSP / helmet**; `cors()` allows **all origins**.
9. **Weak password policy** — only presence-checked at registration (`auth.controller.js`); `express-validator` declared but unused across the API (no body validation on spaces/syllabus/resources/attempts).
10. **In-memory rate limiter only** (`security.middleware.js`) — resets on restart, ineffective multi-instance; per-call `setInterval` never cleared.
11. **30-day JWT with no revocation/refresh**; token stored in `localStorage` (XSS-exfiltratable).
12. **Unbounded payloads on `Resource.text` and syllabus bodies** (storage-flood vector; only Express's default 100KB JSON cap protects).
13. **Divergent learner-state authority** (client vs server DNA) — integrity risk for anything built on the evidence later.

### P3 LOW
14. **Fail-open ownership pattern:** `if (space.userId && …)` / `if (world.learningSpaceId && world.learningSpaceId.userId && …)` — a deleted/absent parent **skips the check** (orphaned world readable/unlockable by any authenticated user).
15. Error middleware returns stack traces whenever `NODE_ENV !== 'production'` (default unset → stacks exposed).
16. Broken encoding (mojibake `�`) in user-visible strings across `AuthScreen`, `GameWorldMap`, `ResourceCard`, `world.controller` message.
17. `GameAttempt.userId`/`GameSession.userId` not `required`; `Resource` delete when space missing proceeds without check.

## 11. Existing Data Model

**Conceptual ERD:**

```
User 1────N LearningSpace 1────1 Syllabus        (units→topics subdocs)
                 │ 1────1 LearnerProfile          (unique learningSpaceId)
                 │ 1────N World                   (history[≤30] subdocs, mastery, difficulty)
                 │ 1────N GameAttempt             (evidence rows)
                 │ 1────N GameSession             (⚠️ never created by real UI flow)
                 │ 1────N Resource                (raw text, no chunks)
                 │ 1────1 Progress                (⚠️ ENTIRELY UNUSED — no imports anywhere)
```

| Model | Purpose | Ownership | Indexes | Growth / duplication risks |
|---|---|---|---|---|
| `User` | accounts | — | `email` unique ✅ | — |
| `LearningSpace` | container + xp/level/streak | `userId required` ✅ | **none** (scan on `userId` — hot path) | `lastAction` Mixed grows small |
| `Syllabus` | units/topics | via `learningSpaceId` | **none** (`findOne` per request) | full replace on re-render |
| `World` | topic state + evidence | via `learningSpaceId` | **none** (hot path) | `history` capped 30 ✅; **duplicates GameAttempt data** |
| `LearnerProfile` | DNA aggregate | `userId` + unique space | unique `learningSpaceId` ✅ | `hints`/`strengths`/`weaknesses`/`currentWorldId` never written |
| `GameAttempt` | evidence rows | `userId` **not required** | **none** (`find({learningSpaceId})` scans; unbounded growth) | duplicates `World.history` |
| `GameSession` | session lifecycle | `userId` not required | none | **dead in practice** — UI never calls `game/start` |
| `Resource` | notes/files | via `learningSpaceId` | none | raw text unbounded; PDF binary garbage |
| `Progress` | — | — | unique | **orphaned model — nothing imports it** |

Missing constraints: no `required` on `GameAttempt.userId`; no schema-level validation of attempt payloads; no TTL/archival strategy for `GameAttempt`; `Syllabus` allows multiple docs per space only by convention (`findOne` logic, not a unique index).

## 12. Existing Offline / Sync System

- **Backend unavailable:** `request()` returns `null` → callers use localStorage silently. **No queue, no retry, no user-visible offline indicator.**
- **Learner actions offline:** applied locally in `finishGame` (mastery/XP/DNA update in localStorage) — **never re-synced**; the attempt is permanently server-absent.
- **Stale overwrite (documented data loss):** on next login with server data present, `fetchRemoteSpaces` **replaces** all local spaces (`setSpaces(formatted)`) — offline attempts collected since the last sync are silently discarded.
- **Duplicate attempts:** not possible automatically (single POST per finish, no retry loop), but also **no idempotency key** — adding retries later without one will duplicate evidence.
- **Account switching on one browser:** see P1#5 — `cognix_v2` is global, not per-user; fresh accounts inherit prior user's data; logout resets to `seedSpace()` but only *after* logout (crash/expire leaves data behind).
- **Who wins conflicts:** server, bluntly (full replace) — no merge, no versioning, no last-write-wins timestamps.

## 13. Existing Routing

- **Real URL routing: NO.** No `react-router` dependency. Navigation = `page` state (`"spaces" | "setup" | "world" | "worldDetail" | "game" | "notes" | "progress" | "analytics"`).
- **Browser history: NO** — no `pushState`/`popstate` handling. Browser Back leaves the app or does nothing; refresh always returns to the auth check then the `spaces` page.
- **Deep linking: impossible** — Learning Space / Session / Concept / Progress cannot be addressed by URL.
- Documented current behavior: navigation state is ephemeral and unrecoverable; `selectedWorld` lost on refresh.

## 14. Existing UI → Backend Connections

| Visible feature | UI | Data source | Service | Backend | Verdict |
|---|---|---|---|---|---|
| Login/Register | `AuthScreen` | form | `apiAuth` | `/auth/*` ✅ | REAL |
| Space list/create/delete | `Spaces`, `Select` | server (or localStorage if empty!) | `apiSpaces` | `/spaces` ✅ | REAL (with silent-fallback caveat) |
| Syllabus upload | `Setup`, `DropZone` | client parses file | `apiSyllabus.renderSyllabus` | `POST /spaces/:id/syllabus` | ⚠️ **PDF path is fake** (parses filename); `rawContent` arg silently dropped by `api.js` signature |
| World map + gates | `GameWorldMap` | client state | — | (server worlds only at space fetch) | ⚠️ thresholds 0.7 vs server 0.72; unlock is client-side |
| Recommendations | `WorldDetail`, `Progress` | `decideNext` client | shared engine | — | REAL (dual-computed) |
| **Game content** | `GameScreen` | **hardcoded `v2data.js` banks** | `worldGames` | server `game/start`+`challenge` **never called** | ⚠️ server AI path dead to UI; fallback answers fixed at `options[0]` |
| Attempt recording | `finishGame` | client | `apiGame` | `/games/attempt` ✅ | REAL but client-authoritative |
| Learner DNA page | `Progress` | client recompute | — | `/learner/dna` **never called** | ⚠️ server endpoint orphaned |
| **Analytics page** | `Analytics` | client histories | — | `/analytics` **never called** | ⚠️ server endpoint orphaned |
| NOVA panel | `Nova` | client context | `apiNova` | `/nova/ask` ✅ | REAL (chatbot only) |
| Notes add | `Notes` | form/file | `apiResources.addResource` | `POST /resources` ✅ | REAL (≤5KB, PDF garbage) |
| **Notes delete** | `ResourceCard` | local filter only | **none** | `DELETE /resources/:id` **never called** | ❌ **deletion never reaches server — notes resurrect on reload** |
| **Boss battle** | `BossModal` | client rounds | **none** | no endpoint | ❌ **fake persistence** (mastery=1, unlock, +200 XP are local-only) |
| Map "FINAL BOSS" node | `GameWorldMap` | — | — | — | ❌ **dead button (no onClick)** |
| "View Details" (resources) | `ResourceCard` | — | — | — | ❌ **dead button** |
| "Indexed for AI" claims | `Notes`, `ResourceCard` | — | — | — | ❌ **false claim** |
| Space settings edit | — | — | — | `PUT /spaces/:id` **no UI** | backend feature with no UI |
| World unlock endpoint | — | — | — | `POST /worlds/:id/unlock` **no UI** | backend feature with no UI |
| Session endpoints | — | — | — | `game/start` **no UI** | backend feature with no UI |

Hardcoded numbers that masquerade as computed: XP curve (150/level), score (20×diff correct / 5 wrong — wrong answers still award XP), mastery weights (0.18/0.12/−0.04), gates (0.72 / 0.7), struggle thresholds, `preferredGame` default `'quiz'`.

## 15. Technical Debt

1. **Monolithic `App.jsx`** — ~1,160 lines / 52KB holding 20+ components and all app state.
2. **Triple struggle-risk implementations** (server service / `App.jsx:199` / `WorldDetail:619`) with different formulas.
3. **Triple progression implementations** (index-based server, index-based client @0.7, order-based `unlockWorld` @0.72).
4. **Duplicated syllabus parsing/heuristics** (client `parseSyllabus`+fallbacks vs server `parseSyllabusHeuristic`+fallbacks — same canned WT/AIML content in two files).
5. **Duplicated NOVA keyword fallbacks** (server `ai.service.js` vs client `askNova`).
6. **Two evidence stores** (`World.history` vs `GameAttempt`) that can disagree.
7. **Dead/orphaned code:** `src/data/content.js` (249 lines), `Progress` model, `WORLD_DEFS` export, `apiNova.ask`, `parseSyllabusFile`, `extractTextFromBuffer`/`pdf-parse`, `GameSession` flow, 6+ unrouted-or-unread endpoints, `WT.txt` fixture committed at root (used only by manual test).
8. **`request()` swallows all errors** — the single worst debugging obstacle; masks401/403/offline uniformly.
9. **N+1 queries** in `getLearningSpaces` (4 queries per space, no pagination).
10. **Mojibake encoding corruption** in multiple source files.
11. **Global mutable `window.__currentTaskContext`.**
12. **README/env drift:** README describes `GEMINI_API_KEY`/V1 folder layout (`src/adaptive/`), product named "GameLearn" in code/README vs "Cognix" in UI; `package.json` name `gamelearn-ai-mvp`.
13. **No test/lint/CI infrastructure at all.**

## 16. Security Vulnerabilities

*Full classification in §10. Summary counts: **P0: 0 open** (inherited HEAD vulnerabilities exist until Phase 0.5 commits the fix) · **P1: 7** (forgeable evidence, unprotected auth endpoints, default JWT secret, mass assignment, cross-user localStorage, silent auth-failure swallowing, client-trusted NOVA context) · **P2: 6** (no security headers/CORS\*, no input validation, in-memory rate limits, 30-day non-revocable JWT in localStorage, unbounded payloads, split state authority) · **P3: 4** (fail-open ownership patterns, stack traces by default, mojibake, weak model constraints).*

## 17. Production Blockers

1. Learning evidence forgeable from the client (undermines the product's core claim).
2. No automated tests, no CI — regressions undetectable.
3. Auth brute-force exposure + secret management (default secret documented).
4. Cross-user localStorage leakage on shared browsers.
5. Silent API-error handling hides failures from users and operators.
6. Boss progress and offline attempts silently lost (data integrity).
7. UI makes false capability claims (RAG indexing, PDF processing, boss persistence) — must be built or the claims removed.
8. No structured logging/observability (console only) — production incidents invisible.

## 18. Recommended Transformation Phases

Order below is the repo's *actual dependency order*; deviations from the suggested list are marked with rationale.

- **PHASE 0.5 — Commit & runtime-verify inherited work.** *Added: not in the original list, but mandatory first.* The uncommitted security work must be committed on `vish` and verified at runtime (server boot, auth flow, ownership 403s) — otherwise Phase 1 builds on an unreproducible baseline.
- **PHASE 1 — Security + authorization.** Auth rate limiting/lockout, real secret handling, mass-assignment protection (whitelist fields), per-user localStorage namespacing, `request()` error taxonomy (surface 4xx instead of swallowing), input validation with `express-validator`, helmet/CORS policy, fail-open → fail-closed ownership checks. *Why first: every later phase stores evidence; evidence must not be writable by attackers.*
- **PHASE 2 — Server-authoritative state.** Server owns correctness (submit answer, server validates), boss persistence endpoint, notes delete wired, attempt idempotency keys. *Why before adaptive work: engine consolidation is meaningless if inputs are forgeable.*
- **PHASE 3 — Adaptive engine consolidation.** Unify the three struggle algorithms and three progression thresholds; use the `space` argument (cross-world context); wire `hints` into signals; implement REGRESSION→REVIEW; make recommendation enforceable (or explicitly advisory). *Preserves the core loop — consolidation, not replacement.*
- **PHASE 4 — Learning evidence.** Dedicated evidence model (or canonical `GameAttempt` with `World.history` as derived cache), trends/review-state fields, misconception quality.
- **PHASE 5 — RAG / knowledge grounding.** Chunking + embeddings + retrieval (needs Phase 2 trust first), then attach resources to NOVA and content generation; remove false UI claims or make them true.
- **PHASE 6 — Quiz reliability.** Server-side schema validation of AI output (exactly-4 options, unique options, exactly-1 correct, topic relevance); move content generation into the live UI path (kill hardcoded-bank dependence); fix fallback answer predictability (`options[0]`).
- **PHASE 7 — NOVA orchestration.** Server-built canonical context from DB (not client), tools (generate quiz / flashcards / practice / recovery / next-action), authorized actions. *Depends on Phases 2, 4, 5 for trustworthy inputs.*
- **PHASE 8 — Quest + prerequisite system.** Real persisted quests (main/recovery/challenge/boss/review), prerequisite graph, boss gate using `bossReady`, progression endpoint as single source of truth.
- **PHASE 9 — Routing + architecture cleanup.** `react-router`, split `App.jsx`, delete dead code (`content.js`, `Progress`, orphaned endpoints), encoding fixes, README/package naming alignment. *After behavior stabilizes to avoid churn.*
- **PHASE 10 — Offline synchronization.** Outbox queue, per-user storage, merge with server, idempotency (needs Phases 2–3 authorities decided). *Later than suggested? No — but it must follow Phase 1's error taxonomy and Phase 2's server authority, hence this slot.*
- **PHASE 11 — Observability + rate limiting.** Structured logging, request IDs, metrics, Redis-backed rate limiting. *Rate limiting for auth lands in Phase 1; this phase generalizes it.*
- **PHASE 12 — Testing.** ⚠️ **Adjustment:** a minimal verification harness (test runner + smoke tests for auth/ownership/attempt flow) must be introduced *during Phase 1* — security claims cannot be "verified" by code reading alone (this audit already disproved one prior "Verified" claim). Full coverage lands here: unit tests for adaptive rules, integration for API, E2E for the loop.
- **PHASE 13 — Performance + accessibility.** Indexes, pagination (kill N+1), a11y audit, CSS architecture.
- **PHASE 14 — Production verification.** Full pass against the Production Readiness Checklist (inherited from `COGNIX_PRODUCTION_CHANGELOG.md`), load test, security re-scan, deployment config review.

**Rationale for overall order:** security → state authority → engine → evidence → grounding → content reliability → orchestration → quests → structure → sync → observability → tests → polish → verification. Each phase consumes only what previous phases guarantee: no RAG without trusted uploads, no orchestration without canonical state, no quests without a consolidated engine, no sync without error taxonomy.

## 19. Files That Should Be Preserved

- `src/shared/domain/adaptive.js` — **the** adaptive engine (core product IP)
- `server/services/` — `learnerDNA`, `struggle`, `misconception`, `progression`, `worldGeneration` (business logic, needs consolidation not replacement)
- `server/models/` — all except `Progress.js` (schema capture of domain thinking; `GameAttempt` fields are the evidence foundation)
- `server/controllers/*` + `middleware/*` — ownership/auth/error/security scaffolding
- `src/components/GameWorldMap.jsx`, `AuthScreen.jsx`, `ui/*` — working, styled UI
- `src/data/v2data.js` — demo syllabus + fallback banks (temporary value until Phase 6)
- `src/services/api.js`, `v2storage.js` — infrastructure (needs rework of error handling, not removal)
- `server/services/ai/openrouter.service.js` — solid gateway with timeout + fallback chain
- `server/utils/test_e2e.js`, `WT.txt` — useful fixtures for Phase 12
- `COGNIX_PRODUCTION_CHANGELOG.md` — superseded by this file but preserved as historical record *(this audit's findings override its "Remaining work: None" claim)*

## 20. Files That May Need Refactoring

- `src/App.jsx` (monolith — split), `src/index.css` (34KB single file)
- `src/services/api.js` (error swallowing must go)
- `server/controllers/game.controller.js` (trust boundary), `learningSpace.controller.js` (mass assignment)
- `server/services/aiGameContent.service.js`, `syllabusAI.service.js` (validation, dedup with client parsers)
- `server/services/ai.service.js` (context building, fallback dedup)
- `server/server.js` (route hygiene, security headers)
- `server/models/GameAttempt.js`, `World.js` (evidence consolidation, indexes, required fields)
- `src/data/v2data.js` (bank removal after Phase 6), `GameWorldMap.jsx` (threshold + dead boss button)

## 21. Files That Appear Obsolete

| File / code | Evidence | Action |
|---|---|---|
| `src/data/content.js` (249 lines) | V1 content bank; all importers deleted in working tree | delete in Phase 9 |
| `server/models/Progress.js` | zero imports anywhere | delete in Phase 9 |
| `src/data/v2data.js` `WORLD_DEFS` | exported, never imported | remove export |
| `apiNova.ask` (4-arg) | never called by UI | remove or wire |
| `parseSyllabusFile` controller | not mounted in `syllabus.routes.js` | wire (PDF support) or delete |
| `pdf-parse` dependency | reachable only via the above | same decision |
| `express-validator` dependency | never imported | use it (Phase 1) or remove |
| `GameSession` + `game/start` flow | UI never calls it | wire into Phase 2 or delete |
| `/analytics`, `/learner`, `/learner/dna`, `GET/POST resources(unlisted)`, `PUT /spaces/:id`, `world unlock` endpoints | unreachable from UI | wire (Phase 9) or delete |
| `COGNIX_PRODUCTION_CHANGELOG.md` | superseded by `vish.md` | keep as history; all future updates go to `vish.md` |

## 22. Unknowns Requiring Verification

1. **Runtime behavior not executed** — this audit is code-level (syntax-checked only). Server boot, MongoDB availability, and OpenRouter keys are unverified (no `.env` present).
2. **Inherited uncommitted changes** — never runtime-tested here; prior session's "Verified" claim is unproven and partially false (remaining P1s above).
3. Whether `sindhiya0311` repo has other branches/PRs (only `main` visible from this clone).
4. Whether production deployment target (VPS/Render/Vercel+Atlas) exists anywhere — no deployment config found.
5. Intent behind `WT.txt` at repo root (test fixture vs accidental commit).
6. Whether the demo seed account (`demo@gamelearn.ai` / `demopassword123`) is used in any shared environment.
7. Mobile/touch behavior of drag-drop game interactions (untestable statically).

---

# PHASE 0 FINAL REPORT — ANSWERS

**1. What this repository currently is:**
A single-page gamified adaptive-learning app ("Cognix", still named "GameLearn" in code/README) with a React client and an Express/MongoDB backend. A learner creates Learning Spaces, renders syllabi into sequential worlds, and plays 8 modalities of short game activities; a deterministic rule engine observes per-world attempt history and recommends the next activity and difficulty. Auth, persistence, AI-assisted content/syllabus/NOVA (via OpenRouter with graceful fallbacks), notes, XP/level/streak all function. The frontend drives navigation, content selection, correctness judgment, and analytics; the backend records attempts, recomputes learner DNA, and serves recommendations.

**2. What it already does exceptionally well:**
The genuine, deterministic, explainable adaptive loop — real signals, real evidence, real state, real decisions, with human-readable reasons; graceful degradation at every boundary (DB/AI/network); a now-shared adaptive engine between client and server; ownership-checked controllers and a protected NOVA endpoint (inherited work, uncommitted); bounded history growth; clean backend layering.

**3. What is genuinely missing:**
RAG/chunking/embeddings/retrieval (entirely); review/regression mode; trends and review-state in the learner model; URL routing/deep links; server-side content generation in the live UI path; server-side canonical NOVA context and any NOVA tools; persisted quests and boss outcomes; hint usage as an adaptive signal; tests/CI/lint; structured logging; offline queue/merge; input validation; index coverage.

**4. What is fake/static:**
PDF syllabus upload (parses file name); "indexed for AI/RAG context" claims (nothing is indexed); boss persistence (local-only); map FINAL BOSS button and "View Details" button (no handlers); notes deletion (never reaches server); hardcoded client question banks presented as game content; the server's AI challenge endpoints (dead to the UI); `GameSession`, `Progress` model, and 6+ endpoints (unreachable); `LearnerProfile.hints/strengths/weaknesses/currentWorldId` (never written); `bossReady` (computed, unused).

**5. What is duplicated:**
Struggle-risk ×3; progression gates ×3 (with 0.7 vs 0.72 divergence); learner-state computation client+server with divergent formulas; syllabus parsing client+server (same canned fallbacks in two files); NOVA keyword fallbacks client+server; evidence stores ×2 (`World.history` vs `GameAttempt`); XP bookkeeping on `LearningSpace` vs dead `Progress`.

**6. What is insecure:**
P1×7 — forgeable attempt results, unrate-limited auth, documented default JWT secret, mass assignment on `PUT /spaces/:id`, cross-user `localStorage` leak, silent swallowing of 401/403, client-trusted NOVA context. P2×6 — no helmet/CSP, CORS `*`, no input validation (unused `express-validator`), in-memory rate limits, 30-day non-revocable JWT in `localStorage`, unbounded payloads. P3×4 — fail-open ownership checks, default stack-trace exposure, mojibake, weak model constraints. (Report-only; nothing modified.)

**7. What must be preserved:**
`src/shared/domain/adaptive.js` (core IP); the struggle/misconception/progression/learnerDNA/worldGeneration services; all models except `Progress`; the ownership/auth/error/security middleware scaffolding; the styled UI components (`GameWorldMap`, `AuthScreen`, `ui/*`); `openrouter.service.js`; localStorage resilience *as a cache*; demo banks as temporary fallback; the attempt-record field set (responseTime/hints/difficulty/misconception) as the evidence foundation; Hackwell Track 02 principle — systems that continuously learn, adapt, and personalize from user interactions.

**8. What must eventually change:**
Client-authoritative results → server-authoritative (Phase 2); silent error swallowing → explicit error taxonomy; three struggle algorithms → one; three progression thresholds → one; hardcoded banks → validated server AI generation; chatbot NOVA → orchestrator with canonical server context; state routing → URL routing; no-RAG → real retrieval; fake claims → true features (or removed); boss/offline data loss → persisted + queued; no-tests → full harness; monolith → modular components.

**9. Recommended implementation order:**
Phase 0.5 commit+runtime-verify → 1 Security (+ minimal test harness) → 2 Server-authoritative state → 3 Adaptive consolidation → 4 Learning evidence → 5 RAG → 6 Quiz reliability → 7 NOVA orchestration → 8 Quests/prerequisites → 9 Routing/cleanup → 10 Offline sync → 11 Observability → 12 Testing (full) → 13 Performance/a11y → 14 Production verification. (Dependency rationale in §18.)

**10. Blockers preventing Phase 1:**
**None.** No technical blocker exists. Two cautions: (a) Phase 0.5 should commit and runtime-verify the inherited uncommitted security work first so Phase 1 starts from a reproducible baseline; (b) runtime verification requires a `.env` (Mongo URI + `OPENROUTER_API_KEY` + rotated `JWT_SECRET`) — none present in the repo today. The next development phase may begin after Phase 0.5.

---

*Baseline complete. Understood first. Changed nothing. The good is preserved on record; the rest awaits Phase 1.*

---

# PHASE 0.5 — COMMIT + RUNTIME VERIFICATION

**Date:** 2026-09-28 · **Branch:** `vish` · **Status:** COMPLETE (all checklist items PASS)

## Scope
Read `vish.md` first (Rule 1 ✓). Inspected git state without discarding anything. Set up runtime environment, boot-verified backend and frontend, and exercised the inherited uncommitted security/architecture work over real HTTP: auth, ownership, NOVA, rate limits, adaptive engine, and the full learner flow. **No Phase 1 features implemented** (no helmet/CSP/CORS hardening, no mass-assignment fix, no server-authoritative correctness, no RAG, no NOVA tools, no quest persistence, no routing, no offline queue, no DB redesign, no package changes, no application-code changes). Nothing discarded; no secrets committed; the documented default JWT secret was not used anywhere.

## Git Baseline
- **Base:** `f6ff39d` "Initial Cognix full-stack implementation" (HEAD before this phase).
- **Working tree at start (all inherited from the prior session):** 15 modified files (8 controllers, 2 middleware, `server.js`, 3 services, `src/App.jsx`), 18 deleted V1 files (`src/adaptive/*`, 11 components, 4 services), 4 untracked (`COGNIX_PRODUCTION_CHANGELOG.md`, `server/middleware/security.middleware.js`, `src/shared/`, `vish.md`).
- **Classification:** every changed file is part of the prior session's coherent security/architecture work; only `vish.md` was created by this assistant (Phase 0). No unrelated or accidental changes found.
- **Secrets scan:** diff + untracked files scanned for API keys/URIs/credentials — clean. `gamelearn_secret_key_mvp_2026` appears only (a) as a **removal** in `auth.middleware.js` (fallback deleted, now requires env var) and (b) as audit documentation in this file. `.env` is gitignored and was **not** committed.
- **Critical discovery:** HEAD ≠ running behavior. The pre-existing dev server (started 10:26:18, before working-tree files were modified up to 11:52:48) served **pre-change code** — it answered `200` to unauthenticated `POST /api/nova/ask` and `GET /api/spaces`. A stale process was masking the inherited work; verification required restarting from the current tree.
- **Commit:** `a68b41b06acb6dfee00a295c0478a6e16282eda2` — `chore: establish verified Cognix production baseline` — 37 files changed, +997 / −1440. A fresh clone now receives the ownership checks, protected NOVA, rate limiters, and required-JWT-secret behavior.

## Runtime Environment
- Windows, Node **v22.19.0**, npm **10.9.3**; lockfile v3; all dependencies resolvable (express, mongoose, jsonwebtoken, bcryptjs, cors, dotenv, pdf-parse, express-validator, vite, react) — **no install/upgrade performed**.
- MongoDB **mongod listening on 27017** (present in environment).
- **`.env` created (gitignored, 10 vars):** `PORT=5000`; `MONGODB_URI=mongodb://localhost:27017/cognix_phase05_verify` (isolated scratch DB so verification never touches any existing data); `JWT_SECRET=` a **48-char random value — explicitly NOT** the documented default; `OPENROUTER_API_KEY`/`GEMINI_API_KEY` empty (AI runs keyword-fallback = degraded mode, as designed); `VITE_API_URL=http://localhost:5000/api`.
- **Stale processes** (backend PID 7000, Vite PID 8644, concurrently PID 13836 — all started 10:26:18, serving pre-change code) were stopped and the backend/frontend restarted from the current working tree.
- **Backend boot:** `injected env (10) from .env` → `MongoDB Connected: localhost` → `listening on port 5000`; health `GET /api/health` → **200**. One pre-existing Mongoose warning: `errors` is a reserved schema pathname (`LearnerProfile`) — non-blocking, documented.
- **Frontend boot:** `npm run client` → Vite v5.4.21 ready in 1952 ms, **HTTP 200**; UI loads with no runtime exceptions. A second Vite bound to `127.0.0.1:5175` (separate origin = isolated localStorage) was used for the UI flow test so the user's live `localhost:5173` session was never touched; it was stopped and removed afterwards.
- **Degraded mode documented:** no AI keys → NOVA and AI content answer via keyword fallback (still authenticated, validated, rate-limited).

## Tests Performed
1. Git inspection (status/diff/classification/secrets scan). 2. Env + dependency verification. 3. Server boot + health. 4. Frontend boot + page load (browser). 5. Auth flow with test users A and B. 6. Ownership matrix (GET/PUT/DELETE + child resources) with actual HTTP codes. 7. NOVA security (auth, validation, rate limit, cross-user leak probe). 8. Game API rate limit (forgeable correctness deliberately **not** touched). 9. Adaptive engine rules (recovery/challenge/guided/boss) as unit checks against `src/shared/domain/adaptive.js`. 10. Full basic user flow — API suite (50 checks) + complete UI walk-through. 11. Regression sweep (registration, login, spaces, world map, world detail, gameplay, attempt, learner state, recommendations, NOVA, notes, analytics). Test scripts live outside the repo (`C:\Users\SRIVI\AppData\Local\Temp\opencode\`).

## Results

### PASS — API suite: 50/50 (after correcting 2 wrong test expectations; see Issues #3, and note below)
| Area | Actual HTTP results |
|---|---|
| Health | `GET /api/health` → **200** |
| Register A / B | **201** + token each; Login A/B → **200**; wrong password → **401**; `/auth/me` with token → **200**, no token → **401**, garbage token → **401** |
| Fresh-server unauthenticated probes | NOVA → **401**, spaces → **401**, game challenge → **401**, analytics → **401**, learner → **401** (stale server had returned 200 — proof the inherited work works once actually run) |
| Ownership space | B GET → **403** "Not authorized to access this learning space"; B PUT → **403**; B DELETE → **403**; anon → **401**; B's list excludes A's space |
| Child resources (B on A's space) | worlds collection → **403**, world by id → **403**, unlock → **403**, game challenge → **403**, syllabus → **403**, analytics → **403**, learner → **403**, learner/dna → **403**, resources GET → **403**, resource DELETE → **403**; all A-side equivalents **200/201** (worlds generated on create: 3) |
| Game attempts | A submit → **200** "Mastery updated cleanly" (200 by design); B into A's space → **403**; response includes `learnerDNA` + `nextDecision` |
| NOVA | authenticated → **200** reply; 1500-char query → **400**; missing query → **400**; 429 within 25 rapid requests; B's reply contains **no leak** of A's server-side data |
| Rate limits | fixed-URL burst → **429** (NOVA 20/min, game 30/min) |

### PASS — Adaptive engine: 19/19
Low accuracy + repeated errors → `mode: recovery` with difficulty lowered (3→2) and modality changed (quiz→match); high accuracy + fast → `challenge` (2→3, quiz→speed); recent miss → `guided` (modality rotation); no attempts → `normal` baseline "Start with a baseline check."; mastery 0.9 + 6 correct attempts → `bossReady: true`, mastery 0.4 → `false`; `applyGameResult` raises/lowers mastery correctly; history capped at 30; misconception detected after 2 errors; identical inputs → identical decisions (deterministic).

### PASS — Full user flow (UI walk-through, isolated origin)
Register → **Create Your DNA Account** submitted, logged in as "P05 UI Flow" → create space "Web Technologies" → **14 worlds + 5 syllabus units persisted server-side** → world map "Web Technologies Adventure Path" (Level 1, 0 XP, current quest HTML5 & Control Elements 0%, later worlds locked) → world detail **NEXT BEST ACTION: Quiz — "Start with a baseline check"** (Knowledge state NORMAL) → **game started** (quiz rendered, 4 options, Submit disabled until selection) → **answer submitted** → server persisted: `gamesCompleted 1`, `xp 20`, `streak 1`, world mastery `0 → 0.17775`, history entry recorded, `LearnerProfile` created (`accuracy 1, attempts 1, LOW`), `GET /learner` → **200** → UI state shows **mastery 18%** and **recommendation changed to ◇ Flashcards** ("Stable performance rotates the modality…", tagged "Adaptive next") → **NOVA asked and answered with context:** "For HTML5 & Control Elements, the adaptive engine selected quiz to reinforce your concept recall and accuracy." → **Notes page** renders (scoped to space) → **Analytics page** renders real data (Quiz: 1 attempt, 100% accuracy) → boss gate visible ("Reach 72% mastery… 🔒 Boss locked"). **Only console error in the whole session: the expected initial `/auth/me` 401 (no token yet).**

### Regression — PASS
Registration ✓ · login ✓ · spaces CRUD + ownership ✓ · world map ✓ · world detail ✓ · gameplay ✓ · attempt submission ✓ · learner state ✓ · recommendations ✓ · NOVA ✓ · notes/resources ✓ (API create/list/delete + UI page) · analytics ✓.

### FAIL
**None.** Two initial "failures" were wrong test expectations, not defects: (a) `submitGameAttempt` returns **200** (`res.json`) — my test wrongly expected 201; (b) the rate limiter's key is `` `${userId}:${req.originalUrl}` `` so *distinct* URLs get distinct buckets (see Issue 3); the same-URL probe correctly returned **429**.

## Issues Discovered (documented, deliberately not fixed)
1. **Stale dev processes served pre-change code** — an environment issue, not a code defect; resolved by restarting from the working tree. Lesson recorded: HEAD and running behavior diverged, so runtime verification must start its own processes.
2. **Mongoose reserved-key warning:** `LearnerProfile.errors` schema path (pre-existing, non-blocking).
3. **Rate limiter is per-URL keyed** (`` `${userId}:${originalUrl}` ``) — an attacker bypasses the cap by varying the path; additionally the limiter is mounted at `app.use('/api', ...)` so many non-game endpoints share the 30/min bucket. Inherited design; works as implemented (429 proven), redesign deferred to Phase 1.
4. **NOVA context staleness:** the reply cited "quiz" while the current decision had rotated to flashcards — the known P1 *client-trusted context* (server echoes client-supplied decision). Deferred to Phase 7 (canonical context), flagged earlier in Phase 0.
5. **Fresh accounts get the local seed space** ("Programming", localStorage) alongside/instead of server spaces when the server list is empty — the documented §12/§14 local-fallback behavior, observed live on a new account.
6. **No `.env` existed** for the prior session's server (Phase 0 §10 blocker (b)) — now created (gitignored).
7. **Prior changelog contradiction confirmed:** `COGNIX_PRODUCTION_CHANGELOG.md` claims "Phase 1 Implemented + Verified — Remaining work: None", yet HEAD shipped unauthenticated NOVA and no ownership checks; only the uncommitted tree had them. Changelog preserved as historical record; this file supersedes it.

## Fixes Made (baseline-enablement only)
1. Created `.env` (gitignored) — isolated scratch DB + **random** JWT secret (never the documented default) + empty AI keys for documented degraded mode.
2. Stopped stale pre-change dev processes; booted backend and frontend from the current working tree.
3. Spun up and tore down an isolated Vite instance (`127.0.0.1:5175`) for interference-free UI testing.
- **No application code changed. No packages added/upgraded/removed. No Phase 1 features.**

## Deferred To Phase 1
helmet/CSP · CORS restriction · auth-endpoint rate limiting · production JWT secret rotation procedure (the documented default must be replaced everywhere) · mass-assignment fix on `PUT /spaces/:id` · `api.js` explicit 401/403 handling (stop swallowing) · rate-limiter key redesign (global per-user/IP bucket instead of per-URL) · express-validator wiring for input validation · error taxonomy / stack-trace exposure · structured logging · minimal test harness (inside Phase 1 per §18). **Phase 2:** server-authoritative attempt correctness (forgeable `correct` flag untouched, as instructed).

## Completion Checklist
- [x] Read `vish.md` before any change (Rule 1)
- [x] Git state inspected; nothing discarded or reverted
- [x] `.env` created with safe local values; documented default JWT secret **not** used
- [x] No secrets in the commit (diff + untracked scanned; `.env` gitignored)
- [x] Dependencies verified; no installs/upgrades
- [x] Server boots; health endpoint **200**
- [x] Frontend boots; UI loads without runtime exceptions
- [x] Auth flow verified with two test users (201/200/401 as specified)
- [x] Ownership GET/PUT/DELETE + child resources verified with actual status codes
- [x] NOVA auth + rate limit verified
- [x] Game API rate limit verified; forgeable correctness **not** modified
- [x] Adaptive engine rules verified (recovery/challenge/boss)
- [x] Full basic user flow executed end-to-end (API + UI)
- [x] Regression check passed
- [x] Baseline committed: `a68b41b06acb6dfee00a295c0478a6e16282eda2`
- [x] This `vish.md` section added
- [x] Degraded modes documented (no AI keys → fallback replies; MongoDB present → no degradation)
- [!] *Blocked items: none.*

## Commit
- **Baseline:** `a68b41b06acb6dfee00a295c0478a6e16282eda2` — `chore: establish verified Cognix production baseline` (37 files, +997/−1440)
- **This log update:** committed separately immediately after (hash recorded in the Phase 0.5 final report).

*Phase 0.5 complete. Verified over real HTTP, committed, logged. Phase 1 may begin only when its prompt is provided.*

---

# PHASE 1 — SECURITY HARDENING + MINIMAL TEST FOUNDATION

**Status:** ✅ Complete — implemented, verified over real HTTP + a real browser, committed.
**Code commit:** `e277d34` — `security: harden authentication and learning boundaries` (25 files, +1696/−99)
**Log commit:** committed separately immediately after this section was written.
**Scope:** exactly the 10 areas of the Phase 1 prompt. Nothing else was implemented (server-authoritative redesign remains Phase 2).

## Security contract (CLIENT-IS-UNTRUSTED)

The browser is an untrusted display terminal. The server owns identity, ownership, correctness, mastery, XP, progression, unlocks and learner state **wherever those values are already server-computable**. Client input is admitted only through explicit allowlists with hard bounds; anything else is rejected with 400/401/403. Identity always comes from the verified JWT — never from a request body, a localStorage key, or a client-decoded id. The client-side JWT decode (`userIdFromToken`) is a **cache-namespace hint only** and is never used for authorization.

## Assumptions (recorded before implementation)

- All 8 game modalities score **client-side** (content lives in client banks), so `correct` stays client-asserted in Phase 1 — the prompt explicitly allows this, with server-authoritative grading as Phase 2 work.
- The attempt allowlist is exactly: `spaceId, worldId, game, correct, confidence, seconds, difficulty, hintUsed, id, timestamp`; bounds: `difficulty 1..4`, `confidence 0..1`, `seconds 0..3600`.
- The space PUT allowlist is exactly: `name, subject, description` (no UI calls this endpoint, so strict 400 on unknown keys breaks nothing).
- `express-validator` v7.3.2 is already installed → used as the validation layer (zero new dependencies).
- Tests use Node 22's built-in `node --test` (zero new dependencies), one server process + port per file (5101–5104), dedicated DB `cognix_phase1_test`, dedicated test JWT secret. No test touches the dev server, dev DB, or any real credential.
- The legacy `cognix_v2` localStorage key is **dropped, never migrated**: its ownership cannot be proven, and migrating it would recreate the cross-user leak.

## Vulnerabilities found (each confirmed by reading committed code before fixing)

1. `submitGameAttempt` passed `const result = req.body` wholesale into the adaptive engine and XP/streak counters → forged `mastery`/`xp`/`difficulty` were accepted (`server/controllers/game.controller.js`).
2. No rate limiting on `POST /auth/login|register` → unlimited password guessing and bulk account creation.
3. JWT secret checked only at token-issuance time → server booted fine with the documented default secret (`gamelearn_secret_key_mvp_2026` present in `.env.example:4` and `README.md:118`).
4. `updateLearningSpace` = `findByIdAndUpdate(req.params.id, req.body)` → mass assignment (owner change, XP/counter injection).
5. Global localStorage key `cognix_v2` shared by every account on the device → cross-user data leakage (B saw A's spaces after login).
6. `api.js` `request()` caught **all** errors → `null`; 401/403 were silently swallowed and callers fell back to local cache as if authorized.
7. NOVA endpoint trusted `req.body.context` as-is → no space/world ownership check, identity fields accepted from the client, server-owned space name/subject not enforced; `LearningContextService` (canonical context) does not exist yet (deferred).
8. `cors()` fully permissive, no security headers, default body limit, error stacks returned whenever `NODE_ENV !== 'production'` (i.e. by default in dev).
9. No input validation on login/register/space-update/attempt/NOVA (only a minimal pre-existing NOVA query check).
10. No tests and no test runner → none of the above had a regression guard.

## What changed (files)

**Server**
- `server/config/security.config.js` **(new)** — single source of truth: rate limits, space/attempt allowlists + bounds, game-type list, body/context limits, CORS policy, and the pure `findJwtSecretDefect()` policy (missing / forbidden default / <32 chars / placeholder).
- `server/middleware/security.middleware.js` — shared in-memory store with one `unref`'d sweeper; `Retry-After` header on every 429; `loginRateLimit()` (per-IP 30/15min **and** per-email 10/15min, keys contain **no URL** so path-varying cannot bypass; account bucket counts identically whether or not the account exists); `registerRateLimit()` (per-IP 30/h); `verifyNovaContext()` NOVA trust boundary (strips `userId/ownerId/accountId/user` from body and context, verifies space/world ownership fail-closed 403 / 404 when not found, overrides space `name`/`subject` from DB, drops ids of non-ObjectId local/seed references so they stay display-only).
- `server/middleware/validation.middleware.js` **(new)** — tiny reusable `validate(chains)` pipeline: runs express-validator chains, rejects with 400 + a safe client-facing message.
- `server/routes/auth.routes.js` — login/register validation (register: name 1–100, valid email, password 8–128 (bcrypt DoS bound); login: presence/type only so every existing account keeps working) + both limiters, rate limit **before** validation.
- `server/routes/learningSpace.routes.js` — PUT allowlist validator: unknown keys → 400 `Field not allowed: <key>`; name/subject/description string + length checks with `.trim()`.
- `server/routes/game.routes.js` — attempt validator on both attempt routes: allowlist reject, `game` ∈ 8 modalities, `correct`/`hintUsed` strict booleans, numeric bounds, `.toFloat()/.toInt()` normalization.
- `server/controllers/game.controller.js` — attempt result rebuilt explicitly from validated fields only (defense in depth).
- `server/controllers/learningSpace.controller.js` — explicit allowlist extraction + `runValidators: true` (never spreads `req.body`).
- `server/controllers/auth.controller.js` — anti-enumeration: when no user matches, a bcrypt compare of equal cost still runs (timing parity); identical 401 body for wrong-password and missing-account.
- `server/middleware/error.middleware.js` — stacks/details only when `NODE_ENV === 'development'`; 500 messages masked otherwise; stack still logged server-side.
- `server/server.js` — **fail-fast** `findJwtSecretDefect()` before anything else (prints generation hint, `exit(1)`); security headers (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `X-Permitted-Cross-Domain-Policies: none`, HSTS in production only); CORS via optional `CORS_ORIGIN` (dev permissive, production fail-closed to same-origin when unset); explicit `express.json({ limit: '100kb' })`; NOVA route = `protect → novaLimiter → validate(novaRules) → verifyNovaContext → handler`.

**Client**
- `src/services/api.js` — error taxonomy: network failure → `null` (offline fallback preserved); **401 → clears token + fires the registered unauthorized handler + throws `ApiError(status)`**; **403 → throws with session preserved**; all other non-OK → throws with the server's safe message. `setUnauthorizedHandler()` exported.
- `src/services/v2storage.js` — per-user keys `cognix_v2:<userId>` (anon: `cognix_v2:anon`); pure `spacesKey`, `userIdFromToken` (base64url decode, corrupt input → null), `setActiveUser`, `dropLegacyGlobalSpaces`. Logout/401 **detach** the namespace (owner's cache survives under their key; nothing is erased, nothing is inherited).
- `src/App.jsx` — module-scope namespace seeded from stored token before first paint; legacy key dropped at boot; unauthorized handler registered before the boot `getMe` (clears user + detaches namespace + resets to anon seed, no protected UI rendered); `setActiveUser` wired into boot/login/logout; every previously-swallowing catch now surfaces 403 (and non-401 errors) via `notify()` while offline still falls back locally.
- `.env.example` + `README.md` — default secret removed everywhere; `JWT_SECRET=` empty placeholder + generation command (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`); `CORS_ORIGIN` documented.

**Tests (new foundation, `package.json` → `"test": "node --test --test-concurrency=1 \"tests/*.test.mjs\""`)**
- `tests/helpers/server.mjs` — spawn/stop a real server (own port, test DB, test secret), `runServerToExit()` (scratch cwd so no `.env` can mask a missing secret), fetch/register/create helpers.
- `tests/security.config.test.mjs` — JWT policy matrix + allowlist/limit invariants (10 tests).
- `tests/auth.test.mjs` — boot fails with missing/whitespace/default secret (exit≠0 + message), boot OK with strong secret, 401/403, login 429 + `Retry-After` ≤11 attempts, registration 400s, identical responses for wrong-password vs unknown-account (9 tests).
- `tests/spaces.test.mjs` — owner allowlist update works; owner/userId change → 400 + unchanged; xp/level/streak/counters → 400 + unchanged; cross-user → 403; anonymous → 401; oversized/malformed → 400 (6 tests).
- `tests/attempt.test.mjs` — forged `{correct, mastery, xp}` → 400 + XP/mastery unchanged; privilege-shaped fields → 400; out-of-range difficulty/confidence/seconds → 400; unknown game/non-boolean correct → 400; valid attempt records server-computed learnerDNA/decision/XP ≤ bound; cross-user → 403; anonymous → 401 (7 tests).
- `tests/nova.test.mjs` — 401; cross-user space/world → 403; unknown space → 404; 6 malformed-shape 400s (incl. >1000-char query, non-object context, 21KB context); own-space → 200 reply; injected `userId/ownerId` in body+context cannot replace the JWT identity; 429 + `Retry-After` (8 tests).
- `tests/storage.test.mjs` — key namespacing, anon fallback, A≠B isolation, anon inherits nothing, logout detach leaves owner cache intact, JWT decode edge cases (incl. corrupt input), legacy key dropped + never migrated, corrupt JSON → null (7 tests).
- `tests/adaptive.test.mjs` — port of the verified Phase 0.5 adaptive script (10 tests / 19 checks) so the engine is guarded by `npm test` permanently.

## Verification results (§12 — every item, actually run)

| Check | Result |
|---|---|
| lint/typecheck | **N/A** — repo has neither; nothing to run (documented, not skipped silently) |
| New automated tests (`npm test`) | **58/58 PASS** (run twice, final run after all edits) |
| Existing adaptive tests | **19/19 PASS** (Phase 0.5 script) — also ported into `tests/adaptive.test.mjs` |
| Existing API tests vs hardened server | **50/50 PASS** (`phase05_tests.mjs` against restarted dev backend; NOVA cross-user expectation deliberately strengthened from “no leak” to **403**) |
| Production build (`npm run build`) | ✅ clean, no errors/warnings |
| Boot WITH secure JWT | ✅ health 200 on `:5000` (dev server restarted onto new code) + test server boots |
| Boot WITHOUT valid JWT | ✅ `exit 1` in 3 variants (missing, whitespace, documented default) — asserted by tests |
| Cross-user / authz tests | ✅ GET/PUT/DELETE space, attempts, NOVA space+world, worlds → 401/403/404 as specified |
| Auth rate limit | ✅ login → 429 + `Retry-After` within 11 attempts; register limiter wired |
| NOVA authz + rate limit | ✅ 401/403/404/400 + 429 with `Retry-After` |
| Forged attempt | ✅ 400, XP/mastery unchanged, bounds enforced |
| Mass assignment | ✅ 400 + value unchanged; cross-user write 403 |
| localStorage isolation | ✅ unit tests + full browser cycle (below) |
| Basic E2E flow | ✅ browser run on isolated origin `127.0.0.1:5175` (your `localhost:5173` session untouched) |
| Manual git diff review | ✅ default secret appears only as **removals** (and as the `JWT_SECRET_FORBIDDEN` rejection entry); `.env` not tracked; no dependency changes (only the `test` script); no debug bypasses/backdoors; untracked additions are exactly the intended 3 paths |

**Browser E2E details (isolated origin, fresh accounts):**
1. Planted a fake legacy `cognix_v2` key → reload → **dropped**, session restored.
2. Logged out existing session → token cleared, `cognix_v2:anon` = seed only, owner’s `cognix_v2:<id>` intact.
3. Registered user B → B’s namespace seeded; B saw **only** seed/server data (A’s “Web Technologies” never appeared — the original leak scenario, now closed).
4. Created “IsoB Space” as B → stored **only** under B’s key.
5. Played a quiz → attempt reached the server: **XP 20, streak 1, world mastery 0.17775** (server formula), 1 validated history record, adaptive rotation to Flashcards returned by the server.
6. NOVA “How am I doing?” → 200 reply with server-verified space context.
7. Logout → B’s cache survived detach; re-login as B → same namespace restored; A’s key still had only its own space at every step.
8. Corrupted the token → reload → 401 handler cleared the token, safe auth screen, no protected UI, no crash.

## Commands used

```bash
npm test                # node --test, 8 files, 58 checks — PASS
node <temp>/phase05_tests.mjs     # 50/50 PASS vs hardened server
node <temp>/phase05_adaptive.mjs  # 19/19 PASS
npm run build           # clean
node server/server.js   # with secure JWT → boots; without → exit 1 (tested)
git diff / status / log # manual review before commit
```

## Remaining limitations (deliberate, with reasons)

- **`correct` is still client-asserted** — all modalities score in the browser (content lives client-side). The boundary is now a strict allowlist + hard bounds + privilege-payload rejection; server-side grading lands with the Phase 2 server-authoritative redesign. XP/mastery are computed **server-side** from validated inputs, never read from the client.
- **NOVA learner stats remain client-advisory** — identity/ownership/authorization are now server-enforced (JWT + space/world ownership + server-owned name/subject). Canonical server-derived context (mastery/progression derivation) is the Phase 7 `LearningContextService`; building it now would violate the Phase 1 “no premature architecture” instruction.
- **Rate limits are in-memory, single process** (documented since Phase 0.5; Redis-backed limits later). The generic game/content limiter still keys per-user/IP **+ URL** (path-varying can evade that one bucket) — unchanged deliberately per “do not rewrite the entire limiter”; the **auth** limiters are URL-independent and cannot be bypassed that way.
- **CSP deferred** — a strict CSP breaks Vite dev (HMR websocket, inline styles); low-risk headers shipped instead. CSP revisit when a production frontend build strategy exists.
- **Legacy `cognix_v2` cache is dropped without migration** — its owner is unknowable; migrating would recreate the leak. Users see server data (server is authoritative) after login.
- **Register still returns “user already exists”** (pre-existing UX contract) — login-side enumeration is closed (identical response + timing parity); the rate limiters themselves never depend on account existence.
- **JWT rotation procedure** not implemented — only generation + startup enforcement (prompt scope). Error stacks now require explicit `NODE_ENV=development`.
- Still deferred from Phase 0.5’s list and not in Phase 1 scope: structured logging, helmet/CSP (see above), offline sync, quest persistence, routing/App refactor, DB redesign.

## Completion checklist

- [x] Read `vish.md` before any change (Rule 1)
- [x] Git state inspected before editing (`ebf6633`, clean, synced with origin)
- [x] All 10 prompt areas implemented; nothing outside scope
- [x] `npm test` foundation added — **58/58 PASS**
- [x] Existing adaptive (19/19) + API (50/50) regression suites rerun against hardened code
- [x] Production build clean
- [x] Boot success (secure JWT) and boot failure (missing/weak/default JWT) both runtime-proven
- [x] Cross-user, rate-limit, NOVA, forged-attempt, mass-assignment, localStorage tests all pass
- [x] Basic E2E learning flow executed in a real browser on an isolated origin
- [x] Manual git diff inspection: no secrets committed, `.env` untracked, no unrelated package changes, no debug bypasses
- [x] Default secret absent from `.env.example`/`README`; generation instructions present; forbidden value rejected at startup
- [x] Committed: `e277d34` — `security: harden authentication and learning boundaries`
- [x] This `vish.md` section added; stale Phase 0.5 roadmap row fixed
- [!] *Blocked items: none.*

## Commit

- **Code:** `e277d34` — `security: harden authentication and learning boundaries` (25 files, +1696/−99)
- **This log update:** committed separately immediately after (hash recorded in the Phase 1 final report).

*Phase 1 complete. All 10 areas implemented and proven by tests + runtime verification. Phase 2 (server-authoritative adaptive redesign) starts only when its prompt is provided.*
