# CLAUDE.md

Guidance for Claude Code sessions working in this repository.

## Project overview

**CodeZone** is a self-hosted coding-competition platform. Competitors solve
Python problems in their browser; submissions are uploaded as `.py` files and
graded server-side by running them under `python3 -I` against stored test
cases. Organizers manage problems and users via a separate terminal admin tool.

- **Roles:** `competitor` and `organizer` (`User.organizer: Boolean` in Prisma).
- **Teams:** users belong to one of two teams via `User.team: Int` —
  `0 = Beginner`, `1 = Advanced` (used for the leaderboard split).
- **Grading pipeline:** uploaded file is executed once per test case with
  inputs piped to stdin; stdout is compared against expected outputs by type
  (`int` / `float` / `str`). Float comparison uses an epsilon of `8.38e-8`.
- **Scoring:** first successful submission awards `Problem.points` to the user
  and connects the problem to their `solved_problems` relation. Re-submitting
  a solved problem does not award additional points.

## Architecture

This is effectively a two-package monorepo with no workspace tooling:

```
/                   Next.js 13 web app (TypeScript, Pages Router)
  pages/            Routes + API routes
  pages/api/        Server-side endpoints (auth, signup, upload, userHasCompleted)
  components/       Shared React components (button, header, table, submit, difficulty_badge)
  prisma/           schema.prisma + seed.js + clean.js
  src/              Server singletons (db.js — Prisma client + pino logger)
  styles/           Tailwind CSS
  public/           Static assets (favicon)
  cypress/          E2E tests
  uploads/          Runtime-only: multer destination for submission files
                    (created on demand; not committed)

cli/                Standalone CommonJS Node TUI for admins
  index.js          Main TUI (~1400 lines, blessed-based)
  header.js         Parser for `#** ... #**` problem-file headers
  utils.js          runWithInputs / inferType / difficultyLabel / difficultyColor
  package.json      Separate package; only depends on `blessed`
```

The CLI does **not** share `node_modules` with the root app. It uses its own
Prisma client and reads `MONGO_URL` from the environment.

## Stack

- **Web:** Next.js `13.2` (Pages Router), React `18.2`, TypeScript `target: es5`,
  Tailwind CSS `^3.3`.
- **Auth:** `next-auth` `4.17` with `CredentialsProvider`, JWT session strategy.
- **DB:** MongoDB via Prisma `4.11` (`provider = "mongodb"`).
- **Uploads:** `multer` `1.4` writing to `./uploads/`, 10 KB file size limit,
  filename filter `\.(py|txt)$`. Body parser is disabled on the upload route.
- **Logging:** `pino` `8.6` (dev script pipes through `pino-pretty`).
- **Glue:** `next-connect` `^0.13.0` for composing API middleware.
- **CLI:** `blessed` `^0.1.81`, plain CommonJS, no TypeScript.
- **E2E:** Cypress `10.0.0` (Electron browser).

## Key files & entry points

| Path | Purpose |
|------|---------|
| `pages/api/auth/[...nextauth].tsx` | NextAuth config. Credentials provider compares passwords with `==` against the plaintext `User.password` column. **Security debt — see Known issues.** |
| `pages/api/signup.tsx` | Signup endpoint. Validates against `code-comp.json`, then `prisma.user.create`. **Has validation bugs — see Known issues.** |
| `pages/api/upload.tsx` | Submission grading. `checkCase()` runs `python3 -I <path>` per case (500 ms timeout, 5 MB stdout cap, optional drop to `secure-uid` when running as root). `completeProblem()` increments points and connects the problem only if not already solved. Auth-gated via `unstable_getServerSession`. |
| `pages/api/userHasCompleted.tsx` | `GET ?u=<name>&p=<pid>` → `{ completed: boolean }`. |
| `pages/index.tsx`, `pages/dashboard.tsx`, `pages/leaderboard.tsx`, `pages/signin.tsx`, `pages/signup.tsx` | Top-level pages. |
| `pages/problem/[pid].tsx`, `pages/profile/[u].tsx` | Dynamic routes. |
| `prisma/schema.prisma` | Two models: `User` (name unique, password, organizer, points, team, solved_problems M:N) and `Problem` (name unique, description, difficulty Float, points, `example_cases` Json, `test_cases` Json, accounts M:N). |
| `prisma/seed.js`, `prisma/clean.js` | Seeding and reset utilities (also reachable from the CLI). |
| `src/db.js` | Prisma client + pino singleton. Pattern guards against multiple clients in dev via `global.prisma`. **Note:** file is `src/db.js`, not `src/db.ts` — TS files import it as `"../../src/db"` and rely on `allowJs: true` from `tsconfig.json`. |
| `cli/index.js` | TUI entry. Sub-screens: Problems (Add from File / Directory / Manual / List), Users (Add / List), Tools (Test Case Generator / Create Case Set), Database (Seed / Clean), Config. |
| `cli/header.js` | Parses the `#** ... #**` block from problem `.py` files. Required keys: `name`, `desc`, `points`, `difficulty`, `examples`, `tests`. Cases are comma-separated, inputs pipe-separated, with `\,` escape. |
| `cli/utils.js` | `runWithInputs(file, inputs)` (5 s timeout) and `inferType(output)` returning `"int" | "float" | "str"`. |
| `code-comp.json` | Runtime config: signup toggle, username/password length bounds, difficulty thresholds, `secure-uid` (default `65533`, used to drop privileges when grading as root). |
| `cypress.config.ts` | E2E config. Loads `./cypress/plugins/index.js`. |
| `dockerfile`, `dockerusage.md` | Production container reference. |

## Common commands

```bash
# Web app
npm i                       # install deps
npm run dev                 # next dev | pino-pretty (default)
npm run dev-raw             # next dev (raw logs)
npm run build               # next build
npm run start               # next start (prod)
npm run lint                # next lint
npm run start-db            # prisma db push  (sync schema to MongoDB)
npx prisma generate         # regenerate the Prisma client (run if MONGO_URL changes too)
npm run test                # next dev | cypress run --browser electron  (see caveats)

# CLI (separate package)
cd cli && npm i             # one-time
cd cli && node index.js     # launch the TUI
```

Required env (`.env`): `MONGO_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`,
`JWT_SECRET`. See `README.md` for an example.

## Testing

Current coverage is sparse:

- `cypress/e2e/dashboard.cy.js`
- `cypress/e2e/leaderboard.cy.js`
- `cypress/e2e/problem.cy.js`

These are smoke specs only. There are **no unit tests** and **no CI** wired
up. A vitest-based unit-test setup is being introduced — when adding tests,
prefer vitest for pure functions (e.g. `cli/utils.js`, `cli/header.js`,
`pages/api/upload.tsx` helpers like `checkCase`/`completeProblem` once they
are extracted) and reserve Cypress for full-stack flows.

The `npm test` script is fragile: it pipes `next dev` into `cypress run`, so
the dev server is killed as soon as Cypress exits, and Cypress starts before
the dev server is ready. Prefer running `npm run dev` and `npx cypress run`
in separate shells while iterating.

## Known issues / tech debt

- **Plaintext password compare.** `pages/api/auth/[...nextauth].tsx:26`
  does `user.password == credentials?.password`. Passwords are stored in
  the clear in MongoDB. Any rework should introduce hashing
  (bcrypt/argon2) and migrate existing rows.
- **Signup validation bugs in `pages/api/signup.tsx`:**
  - Line 32: `sanitizedPass < config["password-len-min"]` compares the
    string to a number instead of `sanitizedPass.length`.
  - Line 33: error message references `username-len-min`, not the
    password bound.
  - Line 34: `sanitizedName > config["password-len-max"]` should be
    `sanitizedPass.length`.
  - Line 36: re-checks `sanitizedName` for the password-charset rule
    instead of `sanitizedPass`.
- **No CI pipeline** — no GitHub Actions / equivalent.
- **`npm test` script is brittle** (see Testing).
- **Per-submission Python process.** `upload.tsx` spawns one process per
  test case; the TODO at line 162 notes the speed/safety trade-off of a
  shared interpreter.
- **`uploads/` is unmanaged** — files persist on disk after grading; no
  cleanup job exists.

## Conventions

- **Web app:** TypeScript (`strict: true`, `target: es5`, `allowJs: true`).
  React function components, Tailwind for styling, Next.js Pages Router for
  routing and API. Prefer `next-connect` for API routes that need middleware.
- **CLI:** plain CommonJS (`require` / `module.exports`), no TypeScript, no
  build step. Keep new CLI helpers as small modules in `cli/` and export via
  `module.exports`.
- **Prisma client singleton:** always import from `src/db.js`
  (`import { prisma, log } from "../../src/db"`). Do not instantiate
  `new PrismaClient()` ad hoc in API routes — the dev `global.prisma`
  guard exists to avoid the "10 Prisma clients running" warning.
- **Logging:** use the exported `log` (pino) rather than `console.*` in
  server code so dev output is pretty-printed.
- **Config:** runtime tunables live in `code-comp.json`, not env vars.
  Add new tunables there with sensible defaults.

## Don'ts

- **Don't run `flutter analyze` or `flutter test`.** This is **not** a
  Flutter project — it's Next.js + a Node CLI. The harness sometimes
  defaults to Flutter commands; ignore those suggestions here.
- Don't commit anything from `uploads/` or `.env`.
- Don't add a top-level Prisma client instantiation outside `src/db.js`.
- Don't introduce TypeScript into `cli/` without first adding a build
  step — the CLI is launched directly with `node index.js`.
- Don't bypass auth in `pages/api/upload.tsx`; the
  `unstable_getServerSession` guard is the only thing keeping anonymous
  users from running arbitrary Python on the server.
