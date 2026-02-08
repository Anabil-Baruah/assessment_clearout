# Persistent API Rate Limiter (Node.js + Express + MongoDB)

## Overview
- Per-user fixed 1-minute window rate limit
- Limit: 5 requests per minute per user
- Persistent state in MongoDB; survives service restarts
- Concurrency-safe without third-party rate limiting libraries

## How It Works
- Windowing: Requests are grouped by minute boundary. The window start is the current time truncated to minutes (seconds and milliseconds set to 0).
- Storage: Each `(userId, windowStart)` pair has one document: `{ userId, windowStart, count }`.
- Enforcement:
  - Increment count atomically when `count < limit` using `findOneAndUpdate`.
  - If no matching document exists, insert `{ count: 1 }`.
  - A unique index on `{ userId, windowStart }` prevents duplicates under concurrent inserts.
  - If insert races and hits duplicate key, retry the conditional increment.
  - If the document exists with `count >= limit`, return HTTP 429.

## Concurrency Handling
- Unique index: `{ userId: 1, windowStart: 1 }` with `unique: true`.
- Atomic update path:
  1. `findOneAndUpdate({ userId, windowStart, count: { $lt: 5 } }, { $inc: { count: 1 } })`
  2. If no match:
     - Check if doc exists and `count >= 5` → 429
     - Else, `insertOne({ count: 1 })`
     - On duplicate key (`11000`), retry step 1; if still no match → 429
- This ensures correctness under concurrent requests without transactions.

## Restart Behavior
- State is in MongoDB; service can restart with no loss of counters in the current minute.
- On startup, the service ensures the unique index exists.

## API
- POST `/api/hit`
  - Body: `{ "userId": "user_1" }`
  - Success: `200` → `{ userId, minute, count, limit, status: "ok" }`
  - Rate limited: `429` → `{ error: "Rate limit exceeded", limit }`
- GET `/api/usage/:userId`
  - Returns current minute usage:
    - `{ userId, minute, count, limit }`

## Run Locally
1. Ensure MongoDB is running and accessible.
2. Set environment as needed:
   - `MONGODB_URI` (default: `mongodb://127.0.0.1:27017/rate_limiter`)
   - `PORT` (default: `3000`)
3. Install and start:
   ```bash
   npm install
   npm start
   ```
4. Test via Postman or curl:
   ```bash
   curl -X POST http://localhost:3000/api/hit \
     -H 'Content-Type: application/json' \
     -d '{"userId":"user_1"}'
   curl http://localhost:3000/api/usage/user_1
   ```

## Design Tradeoffs
- Accuracy over performance:
  - Extra reads/writes to ensure strict correctness under races.
  - Avoids probabilistic counters or approximate windows.
- Simplicity:
  - No transactions required; operations rely on unique keys and atomic updates.
  - Fixed 1-minute windows; no sliding window logic.
- Storage cleanup:
  - Documents accumulate per minute; for long-term operation, add a TTL index (e.g., expire after a few hours) to control size.
  - TTL is not required for correctness.

## Scaling Considerations
- Higher concurrency:
  - Add shard key on `userId` with `{ userId, windowStart }` unique across shards if sharding.
  - Increase connection pool size.
- Higher limits or dynamic limits:
  - Store per-user limit config in another collection; read into a cache.
  - Consider memoizing limits for the minute to reduce reads.
- Sliding window:
  - Replace fixed-minute documents with bucketing or rolling window computation with multiple buckets.
  - This would increase complexity and CPU cost.

## Project Structure
```
.
├── package.json
├── README.md
└── src
    └── index.js
```
