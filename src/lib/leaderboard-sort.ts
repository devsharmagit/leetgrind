export interface LeaderboardEntry {
  username: string;
  rankingPoints: number;
  ranking: number;
}

/**
 * Standard leaderboard sorting logic used across the application
 * 1. Primary: rankingPoints (descending - higher is better)
 * 2. Tie-breaker 1: ranking (ascending - lower is better)
 * 3. Tie-breaker 2: username (alphabetical for stability)
 */
export function sortLeaderboard<T extends LeaderboardEntry>(leaderboard: T[]): T[] {
  return leaderboard.sort((a, b) => {
    // Primary: rankingPoints (descending)
    if (b.rankingPoints !== a.rankingPoints) {
      return b.rankingPoints - a.rankingPoints;
    }
    // Tie-breaker 1: ranking (ascending)
    if (a.ranking !== b.ranking) {
      return a.ranking - b.ranking;
    }
    // Tie-breaker 2: username (alphabetical)
    return a.username.localeCompare(b.username);
  });
}
