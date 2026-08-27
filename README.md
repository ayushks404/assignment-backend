# Water Intake Tracker — Backend

REST API for a water intake tracker app. Users can register, log their daily
water consumption, and track progress against a daily hydration goal. Admins
can view all users, inspect any user's intake history, update a user's daily
goal, delete a specific day's logs, and remove user accounts.

## Features

- JWT-based authentication (access token) with bcrypt password hashing
- Role-based access control — `user` and `admin` roles, enforced via middleware
- Users can log intake, view today's total vs. goal, view individual today's entries, view history, and delete their own entries
- Admins can list all users, view any user's history, update a user's daily goal, delete a specific day's logs for a user, and delete a user (with a self-delete guard)
- Input validation with meaningful error messages on every write endpoint
- Centralized edge-case handling (invalid IDs, invalid dates, ownership checks, negative amounts, etc.)

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- bcrypt

## Setup & Installation

1. Clone the repo and install dependencies:
   ```bash
   git clone <repo-url>
   cd backend
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in real values:
   ```bash
   cp .env.example .env
   ```

3. Make sure MongoDB is running and reachable at the `MONGO_URI` you set
   (a local install, Docker container, or a free MongoDB Atlas cluster all work).

4. Seed an admin account (there is no public admin-signup route by design —
   this script is the only way to create an admin):
   ```bash
   node src/utils/seedAdmin.js
   ```
   Uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`. Safe to re-run — it
   skips seeding if an admin with that email already exists.

5. Start the server:
   ```bash
   npm run dev     # nodemon, auto-restart on changes
   # or
   npm start       # plain node
   ```

   Server boots on `PORT` (default `5000`). Health check: `GET /health`.

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/water-tracker` |
| `JWT_SECRET` | Secret used to sign/verify JWTs | `some_long_random_string` |
| `JWT_EXPIRES_IN` | JWT expiry duration | `7d` |
| `ADMIN_EMAIL` | Email used by `seedAdmin.js` to create the admin account | `admin@example.com` |
| `ADMIN_PASSWORD` | Password used by `seedAdmin.js` to create the admin account | `changeme123` |

See `.env.example` for a ready-to-copy template. `.env` itself is git-ignored
and must never be committed.

**Note on "today" / date grouping:** all date boundaries (today's total,
history grouping, day-of-logs deletion) use **UTC**, not local server time.

## API Endpoints

### Auth — `/api/auth` (public)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | none | `{ name, email, password }` | `201` `{ token, user: { id, name, email, role } }` |
| POST | `/api/auth/login` | none | `{ email, password }` | `200` `{ token, user: { id, name, email, role } }` |

- Registration always creates a `role: 'user'` account — there is no way to
  self-register as admin.
- Duplicate email on register → `409` `{ message: "Email already registered" }`
- Invalid credentials on login → `401` `{ message: "Invalid credentials" }`
  (generic message, doesn't reveal which field was wrong)
- Validation failures → `400` `{ message: "Validation failed", errors: [{ field, msg }] }`

### Intake — `/api/intake` (requires `Authorization: Bearer <token>`, any authenticated user)

| Method | Path | Auth | Role | Body / Query | Response |
|---|---|---|---|---|---|
| POST | `/api/intake` | required | user | `{ amountMl }` | `201` created log |
| GET | `/api/intake/today` | required | user | — | `200` `{ totalMl, goalMl, remainingMl, percent, logs: [...] }` |
| GET | `/api/intake/history` | required | user | `?from=&to=` (ISO dates, optional, defaults to last 7 days) | `200` `[{ date, totalMl, goalMl }]` (descending) |
| DELETE | `/api/intake/:id` | required | user (owner only) | — | `200` `{ message }` |

- `amountMl` must be a positive number — `0` or negative → `400` `{ message: "amountMl must be a positive number" }`
- `GET /api/intake/today`'s `logs` array contains that user's individual intake entries for the current UTC day, most recent first — this is the real source of truth for any UI needing per-entry data, not a client-side cache.
- Deleting a log that isn't yours → `403` `{ message: "You cannot delete another user's entry" }`
- Deleting a log that doesn't exist → `404`
- Invalid `:id` format → `400`

### Admin — `/api/admin` (requires `Authorization: Bearer <token>` + `role: admin`)

| Method | Path | Auth | Role | Body | Response |
|---|---|---|---|---|---|
| GET | `/api/admin/users` | required | admin | — | `200` list of users (password excluded) |
| GET | `/api/admin/users/:id/history` | required | admin | `?from=&to=` (optional) | `200` `[{ date, totalMl, goalMl }]` for that user |
| PATCH | `/api/admin/users/:id/goal` | required | admin | `{ dailyGoalMl }` | `200` updated user |
| DELETE | `/api/admin/users/:id` | required | admin | — | `200` `{ message }` — also cascade-deletes that user's intake logs |
| DELETE | `/api/admin/users/:id/history/:date` | required | admin | — (`:date` as `YYYY-MM-DD`) | `200` `{ message, deletedCount }` — permanently removes that user's logs for the given UTC day |

- Any of the above hit with a `user`-role token → `403` `{ message: "Access denied, admin role required" }`
- Admin attempting to delete their own account → `400` `{ message: "Admin cannot delete their own account" }`
- Non-existent `:id` → `404`; malformed `:id` → `400`
- `:date` not matching `YYYY-MM-DD` → `400` `{ message: "Invalid date format, expected YYYY-MM-DD" }`
- `deletedCount` in the day-delete response reflects how many logs actually matched — `0` if that day had no logs for the user, without falsely implying something was removed

### Misc

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | Basic health check, returns `{ status: "ok", message: "Water Intake Tracker API" }` |

## Project Structure

```
src/
  app.js              # Express app setup (middleware, route mounting)
  server.js            # Entry point — connects DB, starts the server
  config/db.js          # Mongoose connection
  models/               # User, IntakeLog schemas
  controllers/           # auth, intake, admin business logic
  routes/                # auth, intake, admin route definitions
  middleware/
    authMiddleware.js      # protect (JWT auth)
    roles.js               # requireRole (RBAC)
  utils/
    jwt.js                # sign/verify helpers
    seedAdmin.js           # one-time admin creation script
```

## Notes

- No refresh tokens — only a single access token, per the assignment scope.
- No rate limiting / brute-force lockout on login — out of scope for this assignment.
- Admin accounts can only be created via `node src/utils/seedAdmin.js`, never via a public route.