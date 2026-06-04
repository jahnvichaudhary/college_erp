# CampusCompass

A college discovery and decision-making platform for Indian students. Search and
filter colleges, open rich detail pages, compare institutions side by side,
predict admission chances from an entrance rank, and ask/answer questions in a
community Q&A. 
to open on vercel pls follow link : https://campuscompass-zeta.vercel.app/

## Problem — what real problem does this solve

Choosing a college in India is overwhelming. Information is scattered across
brochures, forums and marketing pages, and it is hard to answer simple
questions: *Can I get in with my rank? Is the fee worth the placements? How does
College A really compare to College B?*

CampusCompass brings the essentials into one focused workflow:

1. **Discover** — search and filter by stream, state, type, exam, fee and rating.
2. **Evaluate** — detail pages with overview, courses, placement trends and reviews.
3. **Compare** — a side-by-side table that highlights the best value per metric.
4. **Predict** — convert an exam + rank into realistic admission probabilities.
5. **Discuss** — a Q&A space where students ask and answer real questions.

All data is served from the database through REST APIs — nothing is hardcoded in
the UI.

---

## Design decisions — why this approach over alternatives

- **Next.js Route Handlers instead of a separate Express/Nest server.**
  One TypeScript codebase, one process, one port (3000). Simpler to run, review
  and demo, while still giving clean, versioned REST endpoints under `/api`.
- **SQLite via `better-sqlite3` instead of Postgres/Mongo.**
  Zero setup — the database file is created and seeded automatically on first
  request. Synchronous queries keep handler code readable. The schema is
  relational and migrates trivially to Postgres later.
- **Zod for validation at every endpoint.**
  Query params and request bodies are parsed and validated, returning `400`/`422`
  with structured error details rather than crashing or trusting client input.
- **Server-driven filters.**
  The filter options (streams, states, exams, fee range) come from
  `/api/filters`, so the UI never hardcodes dropdown values — they always match
  the data.
- **Hand-written CSS design system (custom tokens).**
  A deliberate editorial palette and component styling rather than a generic UI
  kit, so the product has its own identity and reads as a real product.
- **Client-side Compare tray with `localStorage`.**
  Selections persist across pages without a login, and the comparison itself is
  computed by the backend `/api/compare` endpoint.

---

## API surface

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| GET | `/api/colleges` | List with search, filters, sort, pagination |
| GET | `/api/colleges/:id` | College detail + reviews |
| GET | `/api/compare?ids=1,2,3` | Fetch 2–3 colleges for comparison |
| GET | `/api/filters` | Distinct filter values + fee range |
| POST | `/api/predictor` | `{ exam, rank }` → ranked admission chances |
| GET / POST | `/api/questions` | List/search questions · create a question |
| GET / POST | `/api/questions/:id/answers` | Thread answers · post an answer |

Example:

```bash
curl "http://localhost:3000/api/colleges?stream=Engineering&maxFee=200000&sort=rating&page=1"
curl -X POST http://localhost:3000/api/predictor \
  -H "Content-Type: application/json" \
  -d '{"exam":"JEE Main","rank":4500}'
```

---

## What I'd do differently at scale

- **Postgres + a query layer (Prisma/Drizzle)** with read replicas; move
  full-text search to **Postgres `tsvector`** or **OpenSearch/Elasticsearch** for
  typo tolerance and relevance ranking.
- **Caching** with Redis/CDN for hot list and filter queries, plus cursor-based
  pagination for large result sets instead of offset paging.
- **Auth & moderation** — real user accounts (NextAuth), rate limiting on writes,
  spam/abuse filtering and review verification.
- **The predictor as a data product** — replace the heuristic with a model
  trained on historical cutoff data per exam/category/year, with confidence
  intervals.
- **Observability** — structured logging, request tracing, error monitoring, and
  API contract tests in CI.
- **Content pipeline** — ingestion jobs to keep fees, placements and rankings
  fresh from verified sources.

---

## Known limitations

- The dataset is **generated/illustrative**, not official institutional data.
- The admission predictor is a **transparent heuristic**, not a trained model.
- No authentication — anyone can post questions/answers (fine for an MVP demo).
- SQLite is single-node; great for local/demo, not for high-concurrency writes.
- Upvotes are stored but not yet user-attributable (no per-user vote tracking).

---

## How to run

**Requirements:** Node.js 18.18+ (Node 20 recommended).

```bash
# 1. install dependencies
npm install

# 2. start the dev server (http://localhost:3000)
npm run dev
```

The SQLite database (`college.db`) is created and seeded automatically the first
time an API route is hit — no migration or seed command needed.

**Production build:**

```bash
npm run build
npm run start   # serves on http://localhost:3000
```

To reset the data, stop the server and delete `college.db` (and `college.db-wal`,
`college.db-shm`); it will be re-seeded on the next request.
