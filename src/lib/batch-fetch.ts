// src/lib/batch-fetch.ts

export interface LeetCodeStats {
  username: string;
  realName: string | null;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
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

export interface BatchFetchResult {
  successful: Map<string, LeetCodeStats>;
  failed: Map<string, string>; // username -> error message
  totalProcessed: number;
  duration: number;
}

/**
 * Batch fetch LeetCode stats with proper error handling and rate limiting
 * 
 * @param usernames - Array of LeetCode usernames to fetch
 * @param concurrency - Number of concurrent requests (default: 5)
 * @param delayMs - Delay between batches in milliseconds (default: 1000)
 * @returns Object containing successful fetches, failures, and metadata
 */
export async function batchFetchStats(
  usernames: string[],
  concurrency = 5,
  delayMs = 1000
): Promise<BatchFetchResult> {
  const startTime = Date.now();
  const successful = new Map<string, LeetCodeStats>();
  const failed = new Map<string, string>();

  // Filter out invalid usernames upfront
  const validUsernames = usernames.filter(u => u && u.trim().length > 0);
  const invalidCount = usernames.length - validUsernames.length;
  
  if (invalidCount > 0) {
    console.warn(`[BATCH_FETCH] Filtered out ${invalidCount} invalid usernames`);
  }

  console.log(`[BATCH_FETCH] Starting batch fetch for ${validUsernames.length} profiles`);
  console.log(`[BATCH_FETCH] Concurrency: ${concurrency}, Delay: ${delayMs}ms`);

  for (let i = 0; i < validUsernames.length; i += concurrency) {
    const batch = validUsernames.slice(i, i + concurrency);
    const batchNumber = Math.floor(i / concurrency) + 1;
    const totalBatches = Math.ceil(validUsernames.length / concurrency);
    
    console.log(`[BATCH_FETCH] Processing batch ${batchNumber}/${totalBatches} (${batch.length} profiles)`);

    // Use allSettled to handle individual failures gracefully
    const settled = await Promise.allSettled(
      batch.map(username => fetchLeetCodeStats(username))
    );

    // Process results
    settled.forEach((result, idx) => {
      const username = batch[idx];
      
      if (result.status === 'fulfilled' && result.value) {
        successful.set(username, result.value);
      } else if (result.status === 'fulfilled' && !result.value) {
        failed.set(username, 'Stats returned null');
      } else if (result.status === 'rejected') {
        // result.status === 'rejected'
        const error = result.reason instanceof Error 
          ? result.reason.message 
          : 'Unknown error';
        failed.set(username, error);
        console.error(`[BATCH_FETCH] Failed to fetch ${username}:`, error);
      }
    });

    // Rate limiting: delay between batches (except after the last batch)
    if (i + concurrency < validUsernames.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  const duration = Date.now() - startTime;
  
  console.log(`[BATCH_FETCH] Completed in ${duration}ms`);
  console.log(`[BATCH_FETCH] Success: ${successful.size}, Failed: ${failed.size}`);

  return {
    successful,
    failed,
    totalProcessed: validUsernames.length,
    duration,
  };
}

const FETCH_TIMEOUT_MS = 5000;

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: LEETCODE_STATS_QUERY,
        variables: { username },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[FETCH] Failed for ${username}: HTTP ${response.status}`);
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
  } catch (error: any) {
    clearTimeout(timeout);
    const reason = error.name === 'AbortError' ? 'timeout' : error.message;
    console.error(`[FETCH] Error for ${username}: ${reason}`);
    return null;
  }
}