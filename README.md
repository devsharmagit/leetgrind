<div align="center">

# 🎯 LeetGrind

**Competitive LeetCode Progress Tracking for Teams**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

[Features](#features) • [Architecture](#architecture) • [Tech Stack](#tech-stack) • [Setup](#setup) • [Deployment](#deployment)

---

## What is LeetGrind?

```mermaid
flowchart TD
    A[Vercel Cron<br/>00:00 UTC] -->|Trigger| B[API Route]
    B --> C{Find Profiles<br/>Missing Stats}
    C --> D[Batch Fetch<br/>LeetCode API]
    D -->|5 concurrent<br/>1s delay| E[GraphQL Queries]
    E --> F[Calculate<br/>Ranking Points]
    F --> G[(PostgreSQL<br/>DailyStat)]
    G --> H[Generate<br/>Snapshots]
    H --> I[(JSON Blobs<br/>LeaderboardSnapshot)]
```

### Data Model

Immutable append-only architecture:

```
User (1:N) Group (1:N) GroupMember (N:1) LeetcodeProfile (1:N) DailyStat
                                         Group (1:N) LeaderboardSnapshot
```

**DailyStat** (never updated): Daily record per profile with problems solved, global rank, contest rating, computed points  
**LeaderboardSnapshot** (JSON): Daily group standings when size ≥ 5

### Key Components

| Component | Implementation |
|-----------|----------------|
| **Auth** | NextAuth v5 (Google OAuth) |
| **Cron Auth** | `x-vercel-cron` header (prod) / `Bearer ${CRON_SECRET}` (test) |
| **Rate Limiting** | Upstash Redis sliding window (optional, disabled by default) |
| **Batch Processing** | 5 concurrent requests, 1s inter-batch delay, 5s timeout |
| **Scoring** | `(total×10) + (easy×1) + (med×3) + (hard×5) + max(0, 5M-rank)/1000` |

Upstash Redis-backed sliding window rate limits:
- Page routes: 60 req/60s
- API routes: 30 req/60s
- Server actions: 20 req/60s
- Auth endpoints: 10 req/60s

Disabled by default (`ENABLE_RATE_LIMIT=false`).

### Scoring Algorithm

```typescript
rankingPoints = (totalSolved * 10) 
              + (easySolved * 1) 
              + (mediumSolved * 3) 
              + (hardSolved * 5) 
              + max(0, 5000000 - globalRank) / 1000
```

Leaderboard sorted by:
1. Ranking points (descending)
2. Global rank (ascending, tiebreaker)
3. Username (alphabetical, stability)

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js via Bun |
| Framework | Next.js 16 (App Router), React 19 |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 (generated to `src/generated/prisma`) |
| Auth | NextAuth v5 (Google OAuth) |
| Styling | Tailwind CSS 4, shadcn/ui |
| Charts | Recharts 2 |
| Validation | Zod 4 |
| Rate Limiting | Upstash Redis + @upstash/ratelimit |
| Cron | Vercel Cron Jobs |
| Testing | Jest 30, React Testing Library |
| Deployment | Vercel |

## Setup

### Prerequisites

- Bun 1.x or Node.js 20+
- PostgreSQL 16
- Docker (optional)
- Google OAuth credentials

### Frontend
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Backend
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Zod](https://img.shields.io/badge/Zod_4-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

### Infrastructure
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

### Quick Start

1. **Clone and install**

```bash
git clone <repository-url> && cd leetgrind && bun install
```

2. **Start PostgreSQL**:

```sh
docker-compose up -d  # Wait for "healthy" status
```

Wait for health check to pass:

```bash
docker-compose ps
# postgres should show "healthy"
```

3. **Configure environment** (`cp .env.example .env`):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/leetgrind"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
GOOGLE_CLIENT_ID="<from Google Cloud Console>"
GOOGLE_CLIENT_SECRET="<from Google Cloud Console>"
CRON_SECRET="<openssl rand -base64 32>"
```

4. **Setup database**:

```sh
bunx prisma generate && bunx prisma migrate deploy
```

5. **Run**:

```sh
bun run dev  # → http://localhost:3000
```

### Production Deployment (Vercel)

1. Push repository to GitHub/GitLab/Bitbucket
2. Import project to Vercel
3. Configure environment variables in Vercel dashboard (same as `.env`)
4. Ensure `CRON_SECRET` is set (required even though Vercel uses `x-vercel-cron` header)
5. Deploy (Vercel automatically detects `vercel.json` cron configuration)

Cron jobs authenticate automatically via `x-vercel-cron: 1` header in production.

## Testing

```bash
# All tests (unit + API integration, excludes database tests)
bun test

# Unit tests only
bun run test:unit

# Database integration tests (requires DATABASE_URL)
bun run test:db

# Watch mode
bun run test:watch
```

### OAuth Setup

Google Cloud Console → Create OAuth 2.0 credentials → Add redirect URI: `http://localhost:3000/api/auth/callback/google`

### Test Cron Locally

```sh
curl -X POST http://localhost:3000/api/cron/daily-stats \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

## Architecture Decisions

| Decision | Rationale | Tradeoff |
|----------|-----------|----------|
| **Immutable Snapshots** | Never update `DailyStat` records; preserves historical accuracy, simplifies concurrency | ~1KB/profile/day storage (365MB/year for 1K profiles) |
| **Batch Processing** | 5 concurrent + 1s delay avoids LeetCode IP bans | Processes 100 profiles in ~25 seconds |
| **Server Actions** | Type-safe, auto-deduplication, less boilerplate | Less flexible for external API consumers |
| **JSON Snapshots** | Single-row queries instead of complex joins | Requires Zod validation at app layer |
| **Optional Rate Limiting** | Free tier friendly (Upstash 10K req/day) | Enable for >500 users or public deployments |

## Known Limitations

- **No Official LeetCode API**: Relies on undocumented GraphQL endpoint
- **Username Changes**: Break historical tracking (no UUID identity)
- **UTC Normalization**: Snapshots at midnight UTC (timezone-dependent)
- **Daily Updates Only**: No realtime stats (24h refresh cycle)

## Scalability

| Metric | Bottleneck | Mitigation |
|--------|------------|------------|
| DB Connections | ~50 concurrent | Add `?connection_limit=20` |
| Cron Timeout | 10 min (Vercel) | Shard by profile ID range |
| Storage | Multi-TB limit | Archive old snapshots (>90d) to S3 |

## Roadmap

- [ ] Multi-provider auth (GitHub, Discord)
- [ ] Webhook notifications (Slack/Discord)
- [ ] Streak tracking
- [ ] Difficulty-specific leaderboards
- [ ] Public embeddable leaderboard

---

**[⭐ Star on GitHub](https://github.com/yourusername/leetgrind)** • **[📖 Documentation](./TESTING.md)** • **[🐛 Report Bug](https://github.com/yourusername/leetgrind/issues)**

MIT License • Built with Bun & Next.js
