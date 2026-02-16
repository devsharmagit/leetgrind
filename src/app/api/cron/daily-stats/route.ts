import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { batchFetchStats, LeetCodeStats } from '@/lib/batch-fetch';
import { calculateRankingPoints } from '@/lib/scoring';
import { sortLeaderboard } from '@/lib/leaderboard-sort';
import { snapshotDataSchema, topGainersSchema } from '@/lib/schema/leaderboard';
import { Prisma } from '@/generated/prisma/client';
import { z } from 'zod';

// ============================================================================
// AUTHENTICATION HANDLERS
// ============================================================================
// for vercel
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET environment variable is required but not set');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Verify request is from Vercel Cron or authorized source
  const authHeader = request.headers.get('authorization');
  
  // Check if request is from Vercel Cron (production)
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  
  // Check if request has valid authorization header (for manual testing)
  const hasValidAuth = authHeader === `Bearer ${cronSecret}`;
  
  if (!isVercelCron && !hasValidAuth) {
    console.warn('[CRON] Unauthorized GET attempt', {
      hasVercelCronHeader: !!request.headers.get('x-vercel-cron'),
      hasAuthHeader: !!authHeader,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[CRON] Request authenticated:', {
    source: isVercelCron ? 'Vercel Cron' : 'Manual (with secret)',
  });
  
  return handleDailyStats();
}
// for manual testing
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET environment variable is required but not set');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  
  // Check if request is from Vercel Cron (production)
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  
  // Check if request has valid authorization header (for manual testing)
  const hasValidAuth = authHeader === `Bearer ${cronSecret}`;
  
  if (!isVercelCron && !hasValidAuth) {
    console.warn('[CRON] Unauthorized POST attempt', {
      hasVercelCronHeader: !!request.headers.get('x-vercel-cron'),
      hasAuthHeader: !!authHeader,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[CRON] Request authenticated:', {
    source: isVercelCron ? 'Vercel Cron' : 'Manual (with secret)',
  });
  
  return handleDailyStats();
}

// ============================================================================
// MAIN CRON JOB HANDLER
// ============================================================================

async function handleDailyStats() {
  const startTime = Date.now();

  try {
    console.log('[CRON] Daily stats job started');
    
    // Get today's date (normalized to midnight UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    // ========================================================================
    // STEP 1: Identify profiles that need updating
    // ========================================================================
    const profiles = await prisma.leetcodeProfile.findMany({
      select: {
        id: true,
        username: true,
        stats: {
          where: { date: today },
          select: { id: true },
        },
      },
    });
    
    console.log(`[CRON] Found ${profiles.length} total profiles`);
    
    // Filter profiles that don't have stats for today
    const profilesToUpdate = profiles.filter(p => p.stats.length === 0);
    
    console.log(`[CRON] ${profilesToUpdate.length} profiles need updates`);
    console.log(`[CRON] ${profiles.length - profilesToUpdate.length} profiles already updated`);
    
    if (profilesToUpdate.length === 0) {
      console.log('[CRON] All profiles already updated for today');
      return NextResponse.json({
        success: true,
        message: 'All profiles already updated',
        stats: {
          profiles: {
            total: profiles.length,
            updated: 0,
            skipped: profiles.length,
            failed: 0,
          },
          snapshots: { total: 0, created: 0, failed: 0 },
        },
        duration: Date.now() - startTime,
      });
    }
    
    // ========================================================================
    // STEP 2: Batch fetch LeetCode stats (IMPROVED VERSION)
    // ========================================================================
    const usernames = profilesToUpdate.map(p => p.username);
    
    // Use the improved batch fetch function
    const fetchResult = await batchFetchStats(usernames, 5, 1000);
    
    console.log(`[CRON] Fetch completed: ${fetchResult.successful.size} success, ${fetchResult.failed.size} failed`);
    
    // ========================================================================
    // STEP 3: Save stats to database
    // ========================================================================
    const saveResults = await saveStatsToDatabase(
      profilesToUpdate,
      fetchResult.successful,
      today
    );
    
    console.log(`[CRON] Database save: ${saveResults.saved} saved, ${saveResults.failed} failed`);
    
    // ========================================================================
    // STEP 4: Generate leaderboard snapshots
    // ========================================================================
    const snapshotResults = await generateLeaderboardSnapshots(today);
    
    console.log(`[CRON] Snapshots: ${snapshotResults.created} created, ${snapshotResults.failed} failed`);
    
    // ========================================================================
    // STEP 5: Return comprehensive results
    // ========================================================================
    const duration = Date.now() - startTime;
    console.log(`[CRON] Job completed in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Daily stats and snapshots updated successfully',
      stats: {
        profiles: {
          total: profiles.length,
          updated: saveResults.saved,
          skipped: profiles.length - profilesToUpdate.length,
          failed: saveResults.failed + fetchResult.failed.size,
          fetchFailed: Array.from(fetchResult.failed.entries()).map(([username, error]) => ({
            username,
            error,
          })),
        },
        snapshots: {
          total: snapshotResults.total,
          eligible: snapshotResults.eligible,
          created: snapshotResults.created,
          failed: snapshotResults.failed,
        },
      },
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Job failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to update daily stats',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface SaveStatsResult {
  saved: number;
  failed: number;
}

async function saveStatsToDatabase(
  profiles: Array<{ id: number; username: string }>,
  statsMap: Map<string, LeetCodeStats>,
  date: Date
): Promise<SaveStatsResult> {
  let saved = 0;
  let failed = 0;

  // Create a map for quick profile lookup
  const profileMap = new Map(profiles.map(p => [p.username, p]));

  // Process each successful fetch
  for (const [username, stats] of Array.from(statsMap.entries())) {
    const profile = profileMap.get(username);
    if (!profile) {
      console.warn(`[CRON] Profile not found for username: ${username}`);
      failed++;
      continue;
    }

    try {
      // Calculate ranking points
      const rankingPoints = calculateRankingPoints(stats)
      
      // Upsert daily stat (idempotent operation)
      await prisma.dailyStat.upsert({
        where: {
          leetcodeProfileId_date: {
            leetcodeProfileId: profile.id,
            date,
          },
        },
        update: {
          totalSolved: stats.totalSolved,
          easySolved: stats.easySolved,
          mediumSolved: stats.mediumSolved,
          hardSolved: stats.hardSolved,
          ranking: stats.ranking,
          contestRating: stats.contestRating,
          rankingPoints: Math.round(rankingPoints),
        },
        create: {
          leetcodeProfileId: profile.id,
          date,
          totalSolved: stats.totalSolved,
          easySolved: stats.easySolved,
          mediumSolved: stats.mediumSolved,
          hardSolved: stats.hardSolved,
          ranking: stats.ranking,
          contestRating: stats.contestRating,
          rankingPoints: Math.round(rankingPoints),
        },
      });
      
      saved++;
    } catch (error) {
      console.error(`[CRON] Failed to save stats for ${username}:`, error);
      failed++;
    }
  }

  return { saved, failed };
}

interface SnapshotResult {
  total: number;
  eligible: number;
  created: number;
  failed: number;
}

async function generateLeaderboardSnapshots(date: Date): Promise<SnapshotResult> {
  console.log('[CRON] Starting leaderboard snapshot generation');
  
  // Get all groups with member counts
  const groups = await prisma.group.findMany({
    include: {
      _count: {
        select: { members: true },
      },
    },
  });
  
  console.log(`[CRON] Found ${groups.length} total groups`);
  
  // Filter groups with 5+ members
  const eligibleGroups = groups.filter(g => g._count.members >= 5);
  console.log(`[CRON] ${eligibleGroups.length} groups eligible for snapshots`);
  
  let created = 0;
  let failed = 0;

  // Process groups sequentially (safer for database operations)
  for (const group of eligibleGroups) {
    try {
      await createGroupSnapshot(group.id, date);
      created++;
    } catch (error) {
      console.error(`[CRON] Failed to create snapshot for group ${group.id}:`, error);
      failed++;
    }
  }

  return {
    total: groups.length,
    eligible: eligibleGroups.length,
    created,
    failed,
  };
}

async function createGroupSnapshot(groupId: number, date: Date): Promise<void> {
  // Get group members with latest stats
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          leetcodeProfile: {
            include: {
              stats: {
                orderBy: { date: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
  
  if (!group) {
    throw new Error(`Group ${groupId} not found`);
  }
  
  // Build leaderboard data
  const leaderboard = group.members.map(member => {
    const latestStat = member.leetcodeProfile.stats[0];
    return {
      username: member.leetcodeProfile.username,
      ranking: latestStat?.ranking ?? 5000000,
      totalSolved: latestStat?.totalSolved ?? 0,
      easySolved: latestStat?.easySolved ?? 0,
      mediumSolved: latestStat?.mediumSolved ?? 0,
      hardSolved: latestStat?.hardSolved ?? 0,
      contestRating: latestStat?.contestRating ?? 0,
      rankingPoints: latestStat?.rankingPoints ?? 0,
      lastUpdated: latestStat?.date ?? null,
    };
  });
  
 sortLeaderboard(leaderboard)
  
  // Calculate top gainers (7 days)
  const pastDate = new Date(date);
  pastDate.setDate(pastDate.getDate() - 7);
  
  const membersWithHistory = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      leetcodeProfile: {
        include: {
          stats: {
            where: { date: { gte: pastDate } },
            orderBy: { date: 'asc' },
          },
        },
      },
    },
  });
  
  const gainers = membersWithHistory
    .map(member => {
      const stats = member.leetcodeProfile.stats;
      if (stats.length < 2) return null;
      
      const oldest = stats[0];
      const latest = stats[stats.length - 1];
      const gained = latest.totalSolved - oldest.totalSolved;
      
      if (gained <= 0) return null;
      
      return {
        username: member.leetcodeProfile.username,
        problemsGained: gained,
        rankImproved: oldest.ranking - latest.ranking,
        currentSolved: latest.totalSolved,
        currentRank: latest.ranking,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => b.problemsGained - a.problemsGained);
  

  try {
    const validatedSnapshot = snapshotDataSchema.parse(leaderboard);
    const validatedGainers = topGainersSchema.parse(
      gainers.length > 0 ? gainers : null
    );
    
    // Upsert snapshot with validated data (idempotent)
    await prisma.leaderboardSnapshot.upsert({
      where: {
        groupId_date: {
          groupId,
          date,
        },
      },
      update: {
        snapshotData: validatedSnapshot,
        topGainers: validatedGainers === null ? Prisma.JsonNull : validatedGainers,
      },
      create: {
        groupId,
        date,
        snapshotData: validatedSnapshot,
        topGainers: validatedGainers === null ? Prisma.JsonNull : validatedGainers,
      },
    });
    
    console.log(`[CRON] Snapshot created for group ${groupId} with ${leaderboard.length} members`);
  } catch (error) {
    // Provide detailed error information for debugging
    console.error(`[CRON] Validation failed for group ${groupId}:`, error);
    if (error instanceof z.ZodError) {
      console.error('[CRON] Validation errors:', error.message);
    }
    throw new Error(
      `Snapshot validation failed for group ${groupId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}