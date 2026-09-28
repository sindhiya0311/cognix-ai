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
| Phase 0.5 | Commit & runtime-verify the inherited uncommitted security work | ⬜ Not started |
| Phase 1 | Security + authorization hardening | ⬜ Not started |
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
