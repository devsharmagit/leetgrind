# Code Review — Daily LeetGrind

> Reviewed: 13 February 2026  
> Target scale: ~1,000 users

---

## 1. Security Issues 🔴

### Exposed Generated Prisma Types in `src/app/generated/`

Generated Prisma client lives inside `src/app/`, which means it could accidentally be bundled into client-side code. The `prismaNamespaceBrowser.ts` file is explicitly designed for browser use, exposing your full schema shape to the client.

**Fix:** Move generated output outside `src/app/` (e.g., to `src/generated/` or the default `node_modules/.prisma`), and update `prisma.config.ts`:

```ts
// prisma.config.ts
// Change the output path to be outside the app directory
output: '../src/generated/prisma',
```

### No Input Sanitization Beyond Username Format

In `src/app/actions/groups.ts`, `validateLeetCodeUsername` does a GraphQL call to LeetCode but has no rate-limiting on *your* side. At 1,000 users, someone could abuse `addMembersToGroup` / `addSingleMemberToGroup` to hammer LeetCode's API from your server, getting your IP blocked.

**Fix:** Add per-user rate limiting to server actions:

```ts
// src/lib/rate-limit.ts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}
```

---

## 2. Database / Prisma Issues 🟠

### Missing Prisma Client Singleton Guard

Make sure you're using the singleton pattern to avoid exhausting connections in dev mode (Next.js hot-reloads):

```ts
// src/lib/prisma.ts
import { PrismaClient } from '@/app/generated/prisma';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### JSON Columns Without Validation

`LeaderboardSnapshot` uses `snapshotData` (Json) and `topGainers` (Json?). At 1,000 users, unvalidated JSON payloads can silently corrupt your data.

**Fix:** Add Zod schemas for your JSON fields:

```ts
// src/lib/schemas/leaderboard.ts
import { z } from 'zod';

export const snapshotDataSchema = z.array(z.object({
  username: z.string(),
  totalSolved: z.number(),
  easySolved: z.number(),
  mediumSolved: z.number(),
  hardSolved: z.number(),
  ranking: z.number().optional(),
  contestRating: z.number().optional(),
}));

export const topGainersSchema = z.array(z.object({
  username: z.string(),
  gained: z.number(),
})).nullable();
```

---

## 3. Architecture Issues 🟡

### Server Actions Doing Too Much

`src/app/actions/groups.ts` is a monolith — it handles group CRUD, LeetCode validation, member management, and settings updates all in one file. At ~500+ lines, this becomes hard to test and maintain.

**Fix:** Split into domain-specific modules:

```
src/app/actions/
  groups/
    create.ts
    members.ts
    settings.ts
    validation.ts
```

### No Error Typing

Actions return `{ success: boolean; error?: string }` — this is fragile. Use discriminated unions:

```ts
// src/lib/types/action-result.ts
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### LeetCode API Call Has No Timeout or Retry

```ts
// src/app/actions/groups.ts
export async function validateLeetCodeUsername(username: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) { username }
        }
      `,
      variables: { username },
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);
  // ...
}
```

---

## 4. Build & Config Issues 🟡

### `.next/` Directory Artifacts

Confirm `.gitignore` includes `.next/`. Build artifacts should never be tracked.

### Docker Compose Without Health Checks

Add health checks so your app doesn't start before the DB is ready:

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

---

## 5. Performance Considerations (for 1,000 users)

| Concern | Status | Recommendation |
|---------|--------|----------------|
| DB connection pooling | ⚠️ Unknown | Use `connection_limit` in DATABASE_URL (e.g., `?connection_limit=5`) |
| Cron job concurrency | ⚠️ | `/api/cron/daily-stats` should batch LeetCode API calls (5-10 concurrent, not all 1,000 at once) |
| Leaderboard snapshot size | ✅ OK | JSON snapshots at 1K users are fine (~50KB each) |
| ISR/Caching | ⚠️ | Add `revalidate` to leaderboard pages — no need to recompute on every request |

### Batch Your Cron Fetches

```ts
// src/lib/leetcode/batch-fetch.ts
export async function batchFetchStats(usernames: string[], concurrency = 5) {
  const results: Map<string, LeetCodeStats> = new Map();

  for (let i = 0; i < usernames.length; i += concurrency) {
    const batch = usernames.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(u => fetchLeetCodeStats(u))
    );

    settled.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.set(batch[idx], result.value);
      }
    });

    // Respect LeetCode rate limits
    if (i + concurrency < usernames.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return results;
}
```

---

## 6. Missing Essentials

| What | Why |
|------|-----|
| **No tests** | No `__tests__/`, `*.test.ts`, or test config visible. Add at least integration tests for server actions. |
| **No middleware** | No `middleware.ts` for auth guards on `/dashboard/*` routes. |
| **No error boundary** | Add `error.tsx` and `not-found.tsx` in your app routes. |
| **No logging** | `console.error` scattered in actions — use a structured logger (e.g., `pino`). |
| **No env validation** | Validate `.env` at startup with Zod or `@t3-oss/env-nextjs`. |

---

## Summary

For 1,000 users, the app will **work** but has a few sharp edges. Critical items:

1. **Move Prisma generated code out of `src/app/`** — security risk
2. **Add rate limiting to server actions** — abuse prevention
3. **Batch LeetCode API calls in cron** — you'll get IP-blocked otherwise
4. **Add env validation and basic tests** — essential for reliability
5. **Split `groups.ts` actions file** — maintainability

Everything else is polish. The core architecture (Next.js + Prisma + server actions + cron) is a solid choice for this scale.
