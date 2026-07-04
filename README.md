# Zip Router — MERN Edition

A full MERN-stack version of the Zip-style path tracing puzzle: trace one
continuous line through every cell of the grid, hitting numbered "ports" in
order, without crossing blocked edges. This version adds accounts, a fixed
15-level progression stored in MongoDB, stars, best times, and server-side
solution validation (so completions can't be faked from the browser console).

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth via httpOnly cookie
- **Frontend:** React (Vite), React Router, Tailwind CSS, lucide-react

## Project layout

```
zip-router-mern/
  backend/     Express API + Mongoose models + level generator/seed script
  frontend/    Vite + React client
```

## 1. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI to your MongoDB Atlas connection string,
# and a long random JWT_SECRET
npm install
npm run seed     # generates and stores the 15-level progression (run once)
npm run dev       # starts the API on http://localhost:5000
```

Levels are **pre-generated once and stored permanently** — re-running `npm run
seed` wipes and regenerates all levels (existing players' progress rows stay,
but will point at a different puzzle if you rely on `level._id` — safe to run
before you have real players, otherwise treat it as a one-time setup step).

## 2. Frontend setup

```bash
cd frontend
cp .env.example .env
# edit .env if your API isn't on localhost:5000
npm install
npm run dev       # starts the client on http://localhost:5173
```

Open http://localhost:5173, register an account, and play.

## How the game logic works

- **Puzzle generation** (`backend/utils/generatePuzzle.js`): a randomized
  depth-first search (Warnsdorff-ordered, with a boustrophedon fallback)
  produces a Hamiltonian path that visits every cell of an `n x n` grid
  exactly once. A handful of cells along that path are marked as numbered
  checkpoints; a handful of *non-path* adjacent edges are marked as walls.
- **Levels are deterministic**: each level's puzzle is generated once by
  `npm run seed` and stored in the `levels` collection, so every player on
  level 7 sees the exact same board.
- **Server-side validation** (`backend/utils/validatePath.js`): when a
  player finishes, the client sends the *entire path it drew*, not just a
  "we did it" flag. The server independently re-checks that the path covers
  every cell exactly once, only moves between adjacent cells, never crosses
  a wall, and hits every checkpoint in order — before it accepts the
  completion and awards stars. This closes the obvious "just POST a fast
  time" cheat.
- **Stars**: awarded from the completion time vs. two thresholds
  (`parTimeMs`, `goodTimeMs`) computed per level at seed time.
- **Progression/locking**: level `N` is locked until level `N-1` has a
  `completed: true` Progress document for that user. Computed on the fly in
  `levelController.listLevels` / `getLevel`, not stored redundantly.

## API reference

All endpoints are prefixed with `/api`. Auth uses an httpOnly cookie
(`zr_token`), so the frontend axios instance is configured with
`withCredentials: true` and the backend CORS config allows credentials from
`FRONTEND_URL`.

| Method | Route                          | Auth | Description |
|--------|--------------------------------|------|--------------|
| POST   | `/auth/register`               | —    | Create account, sets auth cookie |
| POST   | `/auth/login`                   | —    | Sign in, sets auth cookie |
| POST   | `/auth/logout`                  | —    | Clears auth cookie |
| GET    | `/auth/me`                      | ✓    | Current user |
| GET    | `/levels`                        | ✓    | List all levels with per-user lock/star/time state |
| GET    | `/levels/:levelNumber`           | ✓    | Full puzzle definition for one level (403 if locked) |
| POST   | `/progress/:levelNumber/complete`| ✓    | Submit a solved path; validated server-side, returns stars + next level |
| GET    | `/progress/summary`             | ✓    | Aggregate stats for the profile page |

## Extending it

- **More levels:** add entries to `LEVEL_CONFIGS` in
  `backend/seed/seedLevels.js` and re-run `npm run seed`.
- **Daily challenge / leaderboard:** the `Progress` model already has
  `bestTimeMs` per user per level — a leaderboard is just a sorted query on
  that collection.
- **Deploying:** same pattern as your other MERN apps — PM2 for the backend,
  nginx + Certbot in front of both subdomains, `FRONTEND_URL`/`VITE_API_URL`
  set to the real domains, and `COOKIE_SAMESITE=none` + `secure: true`
  if frontend and backend live on different subdomains.
