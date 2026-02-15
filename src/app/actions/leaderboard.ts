"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkActionRateLimit } from "@/lib/rate-limit";
import { snapshotDataSchema, topGainersSchema } from "@/lib/schema/leaderboard"
import { Prisma } from "@/generated/prisma/client";
import { ActionResult } from "@/lib/types/action-result";
import { fetchLeetCodeStats, type LeetCodeStats } from "@/lib/batch-fetch";
import { calculateRankingPoints } from "@/lib/scoring";
import { sortLeaderboard } from "@/lib/leaderboard-sort";
import type { LeaderboardSnapshot, LeetcodeProfile, DailyStat } from "@/generated/prisma/client";

export { fetchLeetCodeStats, type LeetCodeStats };

// Return types for leaderboard functions
export type LeaderboardEntry = {
  username: string;
  ranking: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating: number;
  rankingPoints: number;
  lastUpdated: Date | null;
};

export type GainerEntry = {
  username: string;
  problemsGained: number;
  rankImproved: number;
  currentSolved: number;
  currentRank: number;
};

export type RefreshStatsResult = {
  username: string;
  status: 'success' | 'error';
  message: string;
};

type ProfileWithStats = LeetcodeProfile & {
  stats: DailyStat[];
};

type PublicLeaderboardMeta = {
  groupName: string;
  ownerName: string;
  memberCount: number;
  lastSnapshotDate: Date | null;
};

export async function refreshGroupStats(groupId: number): Promise<ActionResult<RefreshStatsResult[], { message: string }>> {
  const session = await auth();
  const rateLimited = await checkActionRateLimit('refreshStats', session);
  if (rateLimited) return rateLimited;
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Get all members of the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            leetcodeProfile: true,
          },
        },
      },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    // OWNERSHIP CHECK: Only allow access if user is the owner
    if (group.ownerId !== user.id) {
      return { success: false, error: 'Access denied. You can only refresh stats for groups you own.' };
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const results: Array<{
      username: string;
      status: 'success' | 'error';
      message: string;
    }> = [];

    // Fetch stats for each member
    for (const member of group.members) {
      const username = member.leetcodeProfile.username;
      
      try {
        const stats = await fetchLeetCodeStats(username);
        
        if (!stats) {
          results.push({
            username,
            status: 'error',
            message: 'Failed to fetch stats',
          });
          continue;
        }

        // Calculate ranking points (custom scoring)
        // Higher solved = more points, lower rank = more points
        const rankingPoints = calculateRankingPoints(stats)

        // Upsert daily stat
        await prisma.dailyStat.upsert({
          where: {
            leetcodeProfileId_date: {
              leetcodeProfileId: member.leetcodeProfile.id,
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
            leetcodeProfileId: member.leetcodeProfile.id,
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

        results.push({
          username,
          status: 'success',
          message: `Rank: ${stats.ranking.toLocaleString()}, Solved: ${stats.totalSolved}`,
        });
      } catch (error) {
        console.error(`Error processing ${username}:`, error);
        results.push({
          username,
          status: 'error',
          message: 'Processing error',
        });
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    revalidatePath(`/dashboard/groups/${groupId}`);
    
    const successCount = results.filter(r => r.status === 'success').length;
    
    return { 
      success: true, 
      data: results,
      message: `Updated ${successCount} of ${group.members.length} members`,
    };
  } catch (error) {
    console.error('Error refreshing group stats:', error);
    return { success: false, error: 'Failed to refresh stats' };
  }
}

export async function getGroupLeaderboard(groupId: number): Promise<ActionResult<LeaderboardEntry[], { lastSnapshotDate: Date | null }>> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get group with members and their latest stats - optimized query
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        ownerId: true,
        members: {
          select: {
            leetcodeProfile: {
              select: {
                username: true,
                stats: {
                  orderBy: { date: 'desc' },
                  take: 1,
                  select: {
                    date: true,
                    ranking: true,
                    totalSolved: true,
                    easySolved: true,
                    mediumSolved: true,
                    hardSolved: true,
                    contestRating: true,
                    rankingPoints: true,
                  },
                },
              },
            },
          },
        },
        leaderboardSnapshots: {
          orderBy: { date: 'desc' },
          take: 1,
          select: {
            date: true,
          },
        },
      },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    // OWNERSHIP CHECK: Only allow access if user is the owner
    if (group.ownerId !== user.id) {
      return { success: false, error: 'Access denied. You can only view groups you own.' };
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

    sortLeaderboard(leaderboard);

    return { 
      success: true, 
      data: leaderboard,
      lastSnapshotDate: group.leaderboardSnapshots[0]?.date ?? null,
    };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return { success: false, error: 'Failed to get leaderboard' };
  }
}

export async function getGroupGainers(groupId: number, days: number = 7): Promise<ActionResult<GainerEntry[], { allMembers: GainerEntry[] }>> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - days);

    // Get group with members - optimized query with only necessary fields
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        ownerId: true,
        members: {
          select: {
            leetcodeProfile: {
              select: {
                username: true,
                stats: {
                  where: {
                    date: {
                      gte: pastDate,
                      lte: today,
                    },
                  },
                  orderBy: { date: 'asc' },
                  select: {
                    date: true,
                    totalSolved: true,
                    ranking: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    // OWNERSHIP CHECK: Only allow access if user is the owner
    if (group.ownerId !== user.id) {
      return { success: false, error: 'Access denied. You can only view groups you own.' };
    }

    // Calculate gains for each member with improved fallback logic
    const gainers = group.members.map(member => {
      const stats = member.leetcodeProfile.stats;
      const username = member.leetcodeProfile.username;
      
      // No stats available
      if (stats.length === 0) {
        return {
          username,
          problemsGained: 0,
          rankImproved: 0,
          currentSolved: 0,
          currentRank: 5000000,
        };
      }

      // Only one stat - no comparison possible
      if (stats.length === 1) {
        return {
          username,
          problemsGained: 0,
          rankImproved: 0,
          currentSolved: stats[0].totalSolved,
          currentRank: stats[0].ranking,
        };
      }

      // Multiple stats - calculate gains
      const oldest = stats[0];
      const latest = stats[stats.length - 1];

      // Ensure we have valid data for calculations
      const oldSolved = oldest?.totalSolved ?? 0;
      const newSolved = latest?.totalSolved ?? 0;
      const oldRank = oldest?.ranking ?? 5000000;
      const newRank = latest?.ranking ?? 5000000;

      // Calculate gains (ensure non-negative for problems)
      const problemsGained = Math.max(0, newSolved - oldSolved);
      
      // Rank improvement: positive means rank number decreased (improved)
      // Handle edge case where rank is default 5000000
      let rankImproved = 0;
      if (oldRank < 5000000 && newRank < 5000000) {
        rankImproved = oldRank - newRank;
      }

      return {
        username,
        problemsGained,
        rankImproved,
        currentSolved: newSolved,
        currentRank: newRank,
      };
    });

    // Sort by problems gained (descending), then by rank improvement
    gainers.sort((a, b) => {
      if (b.problemsGained !== a.problemsGained) {
        return b.problemsGained - a.problemsGained;
      }
      return b.rankImproved - a.rankImproved;
    });

    // Filter to only those who gained
    const activeGainers = gainers.filter(g => g.problemsGained > 0);

    return { 
      success: true, 
      data: activeGainers,
      allMembers: gainers,
    };
  } catch (error) {
    console.error('Error getting gainers:', error);
    return { success: false, error: 'Failed to get gainers' };
  }
}


export async function saveLeaderboardSnapshot(groupId: number): Promise<ActionResult> {
  const session = await auth();
  const rateLimited = await checkActionRateLimit("saveSnapshot", session);
  if (rateLimited) return rateLimited;

  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get group + member count
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      return { success: false, error: "Group not found" };
    }

    // Ownership check
    if (group.ownerId !== user.id) {
      return {
        success: false,
        error: "Access denied. You can only save snapshots for groups you own.",
      };
    }

    // Require minimum members
    if (group._count.members < 5) {
      return {
        success: false,
        error:
          "Cannot save snapshot: Group must have at least 5 members to create leaderboard snapshots",
      };
    }

    // Get current leaderboard + gainers
    const leaderboardResult = await getGroupLeaderboard(groupId);
    const gainersResult = await getGroupGainers(groupId, 7);

    if (!leaderboardResult.success || !leaderboardResult.data) {
      return { success: false, error: "Failed to get leaderboard data" };
    }

    // ──────────────────────────────────────────────
    // ZOD VALIDATION (CRITICAL HARDENING)
    // ──────────────────────────────────────────────

    const validatedSnapshot = snapshotDataSchema.parse(
      leaderboardResult.data
    );

    const validatedGainers = topGainersSchema.parse(
      gainersResult.success ? gainersResult.data : null
    );

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Save snapshot (upsert)
    await prisma.leaderboardSnapshot.upsert({
      where: {
        groupId_date: {
          groupId,
          date: today,
        },
      },
      update: {
        snapshotData: validatedSnapshot,
        topGainers:
  validatedGainers === null
    ? Prisma.JsonNull
    : validatedGainers,
      },
      create: {
        groupId,
        date: today,
        snapshotData: validatedSnapshot,
         topGainers:
  validatedGainers === null
    ? Prisma.JsonNull
    : validatedGainers,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving leaderboard snapshot:", error);

    return {
      success: false,
      error: "Failed to save snapshot",
    };
  }
}

export async function getLeaderboardHistory(groupId: number, days: number = 30): Promise<ActionResult<LeaderboardSnapshot[]>> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check ownership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    // OWNERSHIP CHECK: Only allow access if user is the owner
    if (group.ownerId !== user.id) {
      return { success: false, error: 'Access denied. You can only view history for groups you own.' };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const snapshots = await prisma.leaderboardSnapshot.findMany({
      where: {
        groupId,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    return { success: true, data: snapshots };
  } catch (error) {
    console.error('Error getting leaderboard history:', error);
    return { success: false, error: 'Failed to get history' };
  }
}

export async function getProfileHistory(username: string, days: number = 30): Promise<ActionResult<ProfileWithStats>> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if profile exists and user has access in one query
    const profile = await prisma.leetcodeProfile.findFirst({
      where: {
        username,
        groups: {
          some: {
            group: {
              ownerId: user.id,
            },
          },
        },
      },
      include: {
        stats: {
          orderBy: { date: 'desc' },
          take: days,
        },
      },
    });

    if (!profile) {
      return { 
        success: false, 
        error: 'Profile not found or you do not have access to it.' 
      };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error getting profile history:', error);
    return { success: false, error: 'Failed to get profile history' };
  }
}

// ──────────────────────────────────────────────
// Public (no-auth) leaderboard actions
// ──────────────────────────────────────────────

export async function getPublicLeaderboard(publicId: string): Promise<ActionResult<LeaderboardEntry[], PublicLeaderboardMeta>> {
  try {
    const group = await prisma.group.findUnique({
      where: { publicId },
      select: {
        id: true,
        name: true,
        publicId: true,
        visibility: true,
        owner: { select: { name: true } },
        members: {
          select: {
            leetcodeProfile: {
              select: {
                username: true,
                stats: {
                  orderBy: { date: 'desc' as const },
                  take: 1,
                  select: {
                    date: true,
                    ranking: true,
                    totalSolved: true,
                    easySolved: true,
                    mediumSolved: true,
                    hardSolved: true,
                    contestRating: true,
                    rankingPoints: true,
                  },
                },
              },
            },
          },
        },
        _count: { select: { members: true } },
        leaderboardSnapshots: {
          orderBy: { date: 'desc' as const },
          take: 1,
          select: { date: true },
        },
      },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    if (group.visibility === 'PRIVATE') {
      return { success: false, error: 'This group is private' };
    }

    if (group._count.members < 5) {
      return {
        success: false,
        error: 'Leaderboard requires at least 5 members',
        groupName: group.name,
        ownerName: group.owner.name,
        memberCount: group._count.members,
      };
    }

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

    leaderboard.sort((a, b) => {
      if (b.rankingPoints !== a.rankingPoints) return b.rankingPoints - a.rankingPoints;
      if (a.ranking !== b.ranking) return a.ranking - b.ranking;
      return a.username.localeCompare(b.username);
    });

    return {
      success: true,
      data: leaderboard,
      groupName: group.name,
      ownerName: group.owner.name,
      memberCount: group._count.members,
      lastSnapshotDate: group.leaderboardSnapshots[0]?.date ?? null,
    };
  } catch (error) {
    console.error('Error getting public leaderboard:', error);
    return { success: false, error: 'Failed to get leaderboard' };
  }
}

export async function getPublicGainers(publicId: string, days: number = 7): Promise<ActionResult<GainerEntry[]>> {
  try {
    const group = await prisma.group.findUnique({
      where: { publicId },
      select: {
        id: true,
        visibility: true,
        _count: { select: { members: true } },
        members: {
          select: {
            leetcodeProfile: {
              select: {
                username: true,
                stats: {
                  where: {
                    date: {
                      gte: (() => { const d = new Date(); d.setUTCHours(0,0,0,0); d.setDate(d.getDate() - days); return d; })(),
                      lte: (() => { const d = new Date(); d.setUTCHours(0,0,0,0); return d; })(),
                    },
                  },
                  orderBy: { date: 'asc' as const },
                  select: { date: true, totalSolved: true, ranking: true },
                },
              },
            },
          },
        },
      },
    });

    if (!group) return { success: false, error: 'Group not found' };
    if (group.visibility === 'PRIVATE') return { success: false, error: 'This group is private' };
    if (group._count.members < 5) return { success: false, error: 'Not enough members' };

    const gainers = group.members.map(member => {
      const stats = member.leetcodeProfile.stats;
      const username = member.leetcodeProfile.username;
      if (stats.length <= 1) {
        return { username, problemsGained: 0, rankImproved: 0, currentSolved: stats[0]?.totalSolved ?? 0, currentRank: stats[0]?.ranking ?? 5000000 };
      }
      const oldest = stats[0];
      const latest = stats[stats.length - 1];
      const problemsGained = Math.max(0, (latest?.totalSolved ?? 0) - (oldest?.totalSolved ?? 0));
      let rankImproved = 0;
      if ((oldest?.ranking ?? 5000000) < 5000000 && (latest?.ranking ?? 5000000) < 5000000) {
        rankImproved = (oldest?.ranking ?? 0) - (latest?.ranking ?? 0);
      }
      return { username, problemsGained, rankImproved, currentSolved: latest?.totalSolved ?? 0, currentRank: latest?.ranking ?? 5000000 };
    });

    gainers.sort((a, b) => b.problemsGained !== a.problemsGained ? b.problemsGained - a.problemsGained : b.rankImproved - a.rankImproved);

    return { success: true, data: gainers.filter(g => g.problemsGained > 0) };
  } catch (error) {
    console.error('Error getting public gainers:', error);
    return { success: false, error: 'Failed to get gainers' };
  }
}