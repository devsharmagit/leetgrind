# 🚀 LeetCode Group Tracker

A web application to **track, rank, and analyze LeetCode progress of a group**.  
The app automatically collects daily stats, stores historical snapshots, and generates insights like leaderboards, inactive users, and biggest gainers.

---

## ✨ Features

- 📊 **Leaderboard** (rank & problems solved)
- 😥 **Zero-Solved Detection**
- 💤 **Inactive Members** (last N days)
- 🚀 **Biggest Gainers** (rank & problems solved)
- 🏆 **Most Impressive Profile**
- 📅 **Historical Tracking via Snapshots**
- 🔄 **Automated Daily Updates** (Vercel Cron)
- 📤 **Export-ready summaries** (WhatsApp / CSV / Screenshot)
- 👥 **Group Management** (minimum 5 members for leaderboards)
- 🔐 **Authentication** (Google OAuth via NextAuth)

---

## 🤖 Automated Stats Collection

The app uses **Vercel Cron Jobs** to automatically fetch and update LeetCode stats daily.

- **Schedule:** Every day at 00:00 UTC
- **Endpoint:** `/api/cron/daily-stats`
- **Features:**
  - Batch processing with concurrency control
  - Rate limiting protection
  - Automatic snapshot generation
  - Idempotent operations

📖 **[Full Cron Setup Guide →](./CRON_SETUP.md)**

---

## 🧠 Core Concept

Instead of storing only the current LeetCode stats, this app stores **daily immutable snapshots** for each user.

> 📌 Snapshots are never updated — a new snapshot is created every day.

This enables:
- Progress comparison over time
- Rank improvement tracking
- Activity / inactivity detection
- Time-range analytics

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes |
| Database | PostgreSQL |
| ORM | Prisma |
| Package Manager | **Bun** |
| Cron Jobs | GitHub Actions / Vercel Cron |
| Hosting | Vercel |
| DB Hosting | Supabase / Neon |

---

## 📂 Project Structure

```
leetcode-group-tracker/
├── app/
│   ├── page.tsx                # Dashboard
│   ├── leaderboard/
│   ├── inactive/
│   ├── gainers/
│   └── api/
│       ├── users/
│       ├── snapshots/
│       ├── leaderboard/
│       ├── inactive/
│       └── gainers/
├── lib/
│   ├── leetcode.ts             # LeetCode fetch logic
│   ├── scoring.ts              # Impressive profile scoring
│   └── date.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   └── collectSnapshots.ts     # Daily snapshot collector
├── README.md
└── .env
```

---

## 🧩 Database Models

### User

```ts
User {
  id
  name
  leetcodeUsername
  createdAt
}
```

### UserSnapshot

```ts
UserSnapshot {
  id
  userId
  rank
  problemsSolved
  easySolved
  mediumSolved
  hardSolved
  snapshotDate
  createdAt
}
```

---

## 🔄 Data Collection Flow

1. Admin adds users (name + LeetCode username)
2. Daily cron job runs
3. For each user:
   - Fetch LeetCode profile data
   - Extract rank and problem stats
   - Insert a new snapshot
4. APIs compute analytics from snapshots

---

## 📌 Business Logic Overview

### 🏆 Leaderboard

- Fetch latest snapshot per user
- Sort by rank (ascending)

### 😥 Zero Solved Users

```ts
latestSnapshot.problemsSolved === 0
```

### 💤 Inactive Users

A user is considered inactive if there is no increase in solved problems in the last N days.

```ts
maxSolved(lastNDays) - minSolved(lastNDays) === 0
```

### 🚀 Biggest Gainers

```ts
solvedDelta = solved(today) - solved(fromDate)
rankDelta   = rank(fromDate) - rank(today)
```

Sorted by:
- `solvedDelta` (descending)
- `rankDelta` (descending)

### 🏆 Most Impressive Profile

Example scoring formula:

```ts
score =
  (1_000_000 / rank) * 0.5 +
  problemsSolved * 1 +
  hardSolved * 3
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Ranked leaderboard |
| GET | `/api/inactive?days=30` | Inactive users |
| GET | `/api/zero-solved` | Users with zero solved |
| GET | `/api/gainers?from=YYYY-MM-DD` | Biggest gainers |
| POST | `/api/users` | Add a new user |

---

## ⏰ Automated Daily Updates

The app uses **Vercel Cron Jobs** for automated stats collection:

**🎉 On Vercel: Set `CRON_SECRET` and deploy!**

The cron job runs daily at 00:00 UTC. Vercel authenticates via the `x-vercel-cron` header. `CRON_SECRET` must be set as an environment variable in all environments.

**For Local Testing:**

```bash
# 1. Generate a cron secret (required)
openssl rand -base64 32

# 2. Add to .env.local
CRON_SECRET="your-generated-secret"

# 3. Test manually (POST request)
curl -X POST http://localhost:3000/api/cron/daily-stats \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Schedule:** Every day at 00:00 UTC (configured in `vercel.json`)

The cron job automatically:
- ✅ Fetches latest LeetCode stats for all profiles
- ✅ Updates daily statistics
- ✅ Generates leaderboard snapshots (for groups with 5+ members)
- ✅ Calculates top gainers

**📖 [Complete Cron Setup Guide →](./CRON_SETUP.md)**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cron/daily-stats` | Daily stats cron (Vercel Cron only, `x-vercel-cron` header) |
| POST | `/api/cron/daily-stats` | Daily stats cron (Bearer token auth) |

---

## 🛠️ Setup Instructions

### Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup.sh
```

This will:
- Start PostgreSQL in Docker
- Generate Prisma client
- Run database migrations

Then follow the prompts to configure your Google OAuth credentials.

### Manual Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/leetcode-group-tracker
cd leetcode-group-tracker
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Start PostgreSQL Database

Using Docker Compose:

```bash
docker-compose up -d
```

Or see [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed instructions.

### 4️⃣ Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/leetgrind?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Required: Secures the cron endpoint
CRON_SECRET="your-cron-secret-here"
```

**Generate secrets:**
```bash
# For NEXTAUTH_SECRET (required)
openssl rand -base64 32

# For CRON_SECRET (required)
openssl rand -base64 32
```

**Get Google OAuth credentials:** See [AUTH_SETUP.md](AUTH_SETUP.md) for detailed instructions.

> **Note:** `CRON_SECRET` is **required** in all environments (including Vercel). On Vercel, the cron job authenticates automatically via the `x-vercel-cron` header, but the secret must still be set as an environment variable. Manual invocations use `POST` with a `Bearer` token.

### 5️⃣ Setup Database

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 6️⃣ Run Locally

```bash
npm run dev
```

Visit:
- **App**: http://localhost:3000
- **Signup**: http://localhost:3000/signup
- **Login**: http://localhost:3000/login


---

## 🧪 TODO / Task List

### Backend

- [ ] Prisma schema & migrations
- [ ] LeetCode data fetcher
- [ ] Snapshot collection cron job
- [ ] Analytics APIs
- [ ] Error handling & logging

### Frontend

- [ ] Dashboard layout
- [ ] Leaderboard table
- [ ] Gainers & inactive views
- [ ] Sorting & filtering
- [ ] Export utilities

### Infrastructure

- [ ] Cron setup
- [ ] Production database
- [ ] Rate-limit protection

---

## 🚧 Known Challenges

- LeetCode does not provide an official public API
- Rate limiting & scraping protection
- Username changes
- Timezone consistency for daily snapshots

---

## 🌱 Future Enhancements

- Multiple groups / cohorts
- WhatsApp / Discord bot integration
- Weekly automated summaries
- Streak tracking
- Difficulty-wise analytics
- Public shareable leaderboards

---

## 🤝 Contributing

Pull requests are welcome.  
Please open an issue before making major changes.

---

## ⭐ Why This Project Matters

This project demonstrates:

- Time-series data modeling
- Backend analytics & cron jobs
- Clean Next.js API design
- Modern tooling with Bun
- Real-world product thinking

---

## 📄 License

MIT

---

**Built with ❤️ and Bun**