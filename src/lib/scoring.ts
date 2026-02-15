// src/lib/scoring.ts
export function calculateRankingPoints(stats: {
  totalSolved: number; easySolved: number;
  mediumSolved: number; hardSolved: number; ranking: number;
}): number {
  return Math.round(Math.max(0,
    stats.totalSolved * 10 + stats.easySolved * 1 +
    stats.mediumSolved * 3 + stats.hardSolved * 5 +
    Math.max(0, 5000000 - stats.ranking) / 1000
  ));
}
