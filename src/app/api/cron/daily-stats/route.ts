import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchLeetCodeStats } from '@/app/actions/leaderboard';

// Helper to process items with concurrency limit
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Small delay between batches to avoid rate limiting
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Validate secret header
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    );
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[CRON] Unauthorized access attempt');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('[CRON] Daily stats job started');
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fetch all LeetCode profiles
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
    
    console.log(`[CRON] Found ${profiles.length} profiles to process`);
    
    // Filter profiles that don't have stats for today
    const profilesToUpdate = profiles.filter(p => p.stats.length === 0);
    
    console.log(`[CRON] ${profilesToUpdate.length} profiles need updates`);
    
    if (profilesToUpdate.length === 0) {
      console.log('[CRON] All profiles already updated for today');
      return NextResponse.json({
        success: true,
        message: 'All profiles already updated',
        stats: {
          total: profiles.length,
          updated: 0,
          skipped: profiles.length,
          failed: 0,
        },
        duration: Date.now() - startTime,
      });
    }
    
    // Process profiles with concurrency limit
    const results = await processBatch(
      profilesToUpdate,
      async (profile) => {
        try {
          const stats = await fetchLeetCodeStats(profile.username);
          
          if (!stats) {
            return {
              username: profile.username,
              status: 'failed' as const,
              error: 'Failed to fetch stats',
            };
          }
          
          // Calculate ranking points
          const rankingPoints = Math.max(0, 
            stats.totalSolved * 10 + 
            stats.easySolved * 1 + 
            stats.mediumSolved * 3 + 
            stats.hardSolved * 5 +
            Math.max(0, 5000000 - stats.ranking) / 1000
          );
          
          // Upsert daily stat
          await prisma.dailyStat.upsert({
            where: {
              leetcodeProfileId_date: {
                leetcodeProfileId: profile.id,
                date: today,
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
              date: today,
              totalSolved: stats.totalSolved,
              easySolved: stats.easySolved,
              mediumSolved: stats.mediumSolved,
              hardSolved: stats.hardSolved,
              ranking: stats.ranking,
              contestRating: stats.contestRating,
              rankingPoints: Math.round(rankingPoints),
            },
          });
          
          return {
            username: profile.username,
            status: 'success' as const,
            totalSolved: stats.totalSolved,
          };
        } catch (error) {
          console.error(`[CRON] Error processing ${profile.username}:`, error);
          return {
            username: profile.username,
            status: 'failed' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
      5 // Concurrency limit
    );
    
    // Count results
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    
    console.log(`[CRON] Stats update completed: ${successCount} success, ${failedCount} failed`);
    
    // Now save leaderboard snapshots for all groups with 5+ members
    console.log('[CRON] Starting leaderboard snapshot generation');
    
    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
    
    console.log(`[CRON] Found ${groups.length} groups`);
    
    const eligibleGroups = groups.filter(g => g._count.members >= 5);
    console.log(`[CRON] ${eligibleGroups.length} groups eligible for snapshots`);
    
    const snapshotResults = await processBatch(
      eligibleGroups,
      async (group) => {
        try {
          // Get group members with latest stats
          const groupWithMembers = await prisma.group.findUnique({
            where: { id: group.id },
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
          
          if (!groupWithMembers) {
            return { groupId: group.id, status: 'failed' as const, error: 'Group not found' };
          }
          
          // Build leaderboard data
          const leaderboard = groupWithMembers.members.map(member => {
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
            };
          });
          
          // Sort by ranking (lower is better)
          leaderboard.sort((a, b) => a.ranking - b.ranking);
          
          // Calculate top gainers (7 days)
          const pastDate = new Date(today);
          pastDate.setDate(pastDate.getDate() - 7);
          
          const membersWithHistory = await prisma.groupMember.findMany({
            where: { groupId: group.id },
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
              if (stats.length < 2) {
                return null;
              }
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
          
          // Upsert snapshot (idempotent)
          await prisma.leaderboardSnapshot.upsert({
            where: {
              groupId_date: {
                groupId: group.id,
                date: today,
              },
            },
            update: {
              snapshotData: JSON.parse(JSON.stringify(leaderboard)),
              topGainers: JSON.parse(JSON.stringify(gainers)),
            },
            create: {
              groupId: group.id,
              date: today,
              snapshotData: JSON.parse(JSON.stringify(leaderboard)),
              topGainers: JSON.parse(JSON.stringify(gainers)),
            },
          });
          
          return {
            groupId: group.id,
            status: 'success' as const,
            memberCount: groupWithMembers.members.length,
          };
        } catch (error) {
          console.error(`[CRON] Error creating snapshot for group ${group.id}:`, error);
          return {
            groupId: group.id,
            status: 'failed' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
      3 // Lower concurrency for snapshot generation
    );
    
    const snapshotSuccessCount = snapshotResults.filter(r => r.status === 'success').length;
    const snapshotFailedCount = snapshotResults.filter(r => r.status === 'failed').length;
    
    console.log(`[CRON] Snapshot generation completed: ${snapshotSuccessCount} success, ${snapshotFailedCount} failed`);
    
    const duration = Date.now() - startTime;
    console.log(`[CRON] Job completed in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Daily stats and snapshots updated successfully',
      stats: {
        profiles: {
          total: profiles.length,
          updated: successCount,
          skipped: profiles.length - profilesToUpdate.length,
          failed: failedCount,
        },
        snapshots: {
          total: groups.length,
          eligible: eligibleGroups.length,
          created: snapshotSuccessCount,
          failed: snapshotFailedCount,
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
