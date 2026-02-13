export interface LeaderboardEntry {
  username: string;
  ranking: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating: number;
  rankingPoints: number;
  lastUpdated: Date | null;
}

export interface GainerEntry {
  username: string;
  problemsGained: number;
  rankImproved: number;
  currentSolved: number;
  currentRank: number;
}

export function formatRank(rank: number): string {
  if (rank >= 5000000) return '~5M';
  return rank.toLocaleString();
}
