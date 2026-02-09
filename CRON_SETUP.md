# 🔄 Cron Job Setup Guide

This guide explains how to set up and use the automated daily stats cron job.

---

## 📋 Overview

The cron job (`/api/cron/daily-stats`) runs automatically every day at **00:00 UTC** and performs:

1. ✅ Fetches latest LeetCode stats for all profiles
2. ✅ Creates/updates `DailyStat` records for today
3. ✅ Generates leaderboard snapshots for groups with 5+ members
4. ✅ Calculates top gainers (7-day window)

**Key Features:**
- **Idempotent**: Safe to run multiple times per day
- **Concurrent**: Processes 5 profiles simultaneously
- **Rate-limited**: Built-in delays to respect LeetCode API
- **Secure**: Requires secret token authorization

---

## 🔐 Environment Setup

### 1. Generate a Cron Secret

```bash
# Generate a secure random secret
openssl rand -base64 32
```

### 2. Add to Environment Variables

**Local Development (`.env.local`):**
```env
CRON_SECRET="your-generated-secret-here"
```

**Vercel Deployment:**
1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add `CRON_SECRET` with your generated value
4. Set it for **Production**, **Preview**, and **Development** environments

---

## 📅 Vercel Cron Configuration

The `vercel.json` file configures the cron schedule:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-stats",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule Format:** `minute hour day month dayOfWeek`
- `0 0 * * *` = Every day at 00:00 UTC (midnight UTC)

### Common Schedules

| Time | Cron Expression | Description |
|------|----------------|-------------|
| Midnight UTC | `0 0 * * *` | Default (current) |
| 6 AM UTC | `0 6 * * *` | Morning in Europe |
| 12 AM PST | `0 8 * * *` | Midnight US West Coast |
| Every 6 hours | `0 */6 * * *` | 4 times per day |

---

## 🧪 Testing the Cron Job

### Local Testing

```bash
# Start your development server
bun dev

# In another terminal, test the cron endpoint
curl -X GET http://localhost:3000/api/cron/daily-stats \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Daily stats and snapshots updated successfully",
  "stats": {
    "profiles": {
      "total": 25,
      "updated": 20,
      "skipped": 5,
      "failed": 0
    },
    "snapshots": {
      "total": 5,
      "eligible": 3,
      "created": 3,
      "failed": 0
    }
  },
  "duration": 45230,
  "timestamp": "2026-02-09T00:00:00.000Z"
}
```

### Production Testing

```bash
# Test on Vercel (replace with your domain)
curl -X GET https://your-domain.vercel.app/api/cron/daily-stats \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📊 Monitoring

### Check Vercel Logs

1. Go to your project in **Vercel Dashboard**
2. Navigate to **Deployments** → Select latest deployment
3. Click on **Functions** → Find `/api/cron/daily-stats`
4. View execution logs and runtime stats

### Log Format

The cron job outputs structured logs:

```
[CRON] Daily stats job started
[CRON] Found 25 profiles to process
[CRON] 20 profiles need updates
[CRON] Stats update completed: 20 success, 0 failed
[CRON] Starting leaderboard snapshot generation
[CRON] Found 5 groups
[CRON] 3 groups eligible for snapshots
[CRON] Snapshot generation completed: 3 success, 0 failed
[CRON] Job completed in 45230ms
```

---

## ⚙️ How It Works

### 1. Stats Fetching (Batch Processing)

```typescript
// Fetches all profiles
const profiles = await prisma.leetcodeProfile.findMany();

// Filters profiles without today's stats
const profilesToUpdate = profiles.filter(p => p.stats.length === 0);

// Processes 5 at a time with 1s delay between batches
await processBatch(profilesToUpdate, fetchAndSave, 5);
```

### 2. Snapshot Generation

```typescript
// Gets groups with 5+ members
const eligibleGroups = groups.filter(g => g._count.members >= 5);

// For each group:
// - Builds leaderboard from latest stats
// - Calculates 7-day gainers
// - Upserts snapshot (idempotent)
await prisma.leaderboardSnapshot.upsert({
  where: { groupId_date: { groupId, date: today } },
  // ...
});
```

### 3. Idempotency

- Uses `upsert` operations (not `create`)
- Checks for existing stats before fetching
- Safe to run multiple times per day
- Updates existing records if called again

---

## 🚨 Error Handling

### Common Issues

**401 Unauthorized**
- ❌ CRON_SECRET not set or incorrect
- ✅ Check environment variables in Vercel

**500 Internal Server Error**
- ❌ Database connection issues
- ❌ Missing DATABASE_URL
- ✅ Check Vercel logs for details

**Rate Limiting**
- ❌ Too many profiles processed too quickly
- ✅ Increase delay between batches
- ✅ Reduce concurrency limit

### Debugging

```typescript
// Check individual profile
const stats = await fetchLeetCodeStats('username');
console.log(stats);

// Check today's stats in DB
const stat = await prisma.dailyStat.findUnique({
  where: {
    leetcodeProfileId_date: {
      leetcodeProfileId: profileId,
      date: today
    }
  }
});
```

---

## 🔧 Manual Refresh vs Cron

### Manual Refresh (via UI)
- ➕ Immediate results
- ➕ User-initiated
- ➖ Requires user action
- ➖ Can hit rate limits

### Automated Cron
- ➕ Runs daily automatically
- ➕ Consistent timing
- ➕ No user interaction needed
- ➕ Batch processing with rate limiting
- ➖ Only updates once per day

**Recommendation:** Use cron as primary engine, keep manual refresh for immediate needs.

---

## 📈 Performance

**Typical Execution Time:**
- 50 profiles: ~30-60 seconds
- 100 profiles: ~60-120 seconds
- 500 profiles: ~5-10 minutes

**Factors:**
- LeetCode API response time
- Concurrency settings
- Database write speed
- Network latency

---

## 🔒 Security Best Practices

1. ✅ **Never commit** `CRON_SECRET` to git
2. ✅ Use strong random secrets (32+ characters)
3. ✅ Rotate secrets periodically
4. ✅ Monitor for unauthorized access attempts
5. ✅ Check Vercel logs regularly

---

## 📝 Future Enhancements

- [ ] Add retry logic for failed profiles
- [ ] Send notification summaries (email/Discord)
- [ ] Add metrics dashboard (success rate, duration)
- [ ] Support multiple runs per day
- [ ] Add profile priority/frequency settings

---

## 🆘 Support

If you encounter issues:
1. Check environment variables are set correctly
2. Review Vercel function logs
3. Test locally using curl
4. Verify database connectivity
5. Check LeetCode API availability

---

**Last Updated:** February 2026
