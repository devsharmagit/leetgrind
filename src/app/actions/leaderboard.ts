"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface LeetCodeStats {
  username: string;
  realName: string | null;
  ranking: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating: number;
}

// GraphQL query to fetch user stats from LeetCode
const LEETCODE_STATS_QUERY = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        realName
        ranking
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
    userContestRanking(username: $username) {
      rating
    }
  }
`;

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: LEETCODE_STATS_QUERY,
        variables: { username },
      }),
      next: { revalidate: 0 }, // Don't cache
    });

    if (!response.ok) {
      console.error(`Failed to fetch stats for ${username}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.data?.matchedUser) {
      return null;
    }

    const user = data.data.matchedUser;
    const submissions = user.submitStatsGlobal?.acSubmissionNum || [];
    
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;
    let totalSolved = 0;

    for (const sub of submissions) {
      if (sub.difficulty === 'Easy') easySolved = sub.count;
      else if (sub.difficulty === 'Medium') mediumSolved = sub.count;
      else if (sub.difficulty === 'Hard') hardSolved = sub.count;
      else if (sub.difficulty === 'All') totalSolved = sub.count;
    }

    return {
      username: user.username,
      realName: user.profile?.realName || null,
      ranking: user.profile?.ranking || 5000000,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      contestRating: Math.round(data.data.userContestRanking?.rating || 0),
    };
  } catch (error) {
    console.error(`Error fetching stats for ${username}:`, error);
    return null;
  }
}

export async function refreshGroupStats(groupId: number) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      results,
      message: `Updated ${successCount} of ${group.members.length} members`,
    };
  } catch (error) {
    console.error('Error refreshing group stats:', error);
    return { success: false, error: 'Failed to refresh stats' };
  }
}

export async function getGroupLeaderboard(groupId: number) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get group with members and their latest stats
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
      return { success: false, error: 'Group not found' };
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

    // Sort by ranking (lower is better)
    leaderboard.sort((a, b) => a.ranking - b.ranking);

    return { success: true, data: leaderboard };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return { success: false, error: 'Failed to get leaderboard' };
  }
}

export async function getGroupGainers(groupId: number, days: number = 7) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - days);

    // Get group with members
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            leetcodeProfile: {
              include: {
                stats: {
                  where: {
                    date: {
                      gte: pastDate,
                    },
                  },
                  orderBy: { date: 'asc' },
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

    // Calculate gains for each member
    const gainers = group.members.map(member => {
      const stats = member.leetcodeProfile.stats;
      
      if (stats.length < 2) {
        return {
          username: member.leetcodeProfile.username,
          problemsGained: 0,
          rankImproved: 0,
          currentSolved: stats[0]?.totalSolved ?? 0,
          currentRank: stats[0]?.ranking ?? 5000000,
        };
      }

      const oldest = stats[0];
      const latest = stats[stats.length - 1];

      return {
        username: member.leetcodeProfile.username,
        problemsGained: latest.totalSolved - oldest.totalSolved,
        rankImproved: oldest.ranking - latest.ranking, // Positive = improved
        currentSolved: latest.totalSolved,
        currentRank: latest.ranking,
      };
    });

    // Sort by problems gained (descending)
    gainers.sort((a, b) => b.problemsGained - a.problemsGained);

    // Filter to only those who gained
    const activeGainers = gainers.filter(g => g.problemsGained > 0);

    return { success: true, data: activeGainers, allMembers: gainers };
  } catch (error) {
    console.error('Error getting gainers:', error);
    return { success: false, error: 'Failed to get gainers' };
  }
}
