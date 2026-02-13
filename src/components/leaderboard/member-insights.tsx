'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LeaderboardEntry } from './types';

interface MemberInsightsProps {
  leaderboard: LeaderboardEntry[];
}

export function MemberInsights({ leaderboard }: MemberInsightsProps) {
  const zeroSolvers = leaderboard.filter((m) => m.totalSolved === 0);
  const inactiveMembers = leaderboard.filter(
    (m) =>
      !m.lastUpdated ||
      new Date().getTime() - new Date(m.lastUpdated).getTime() > 7 * 24 * 60 * 60 * 1000
  );

  if (zeroSolvers.length === 0 && (inactiveMembers.length === 0 || !leaderboard.some((m) => m.lastUpdated))) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {zeroSolvers.length > 0 && (
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-white text-sm">⚠️ Zero Problems Solved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {zeroSolvers.map((m) => (
                <span
                  key={m.username}
                  className="px-2 py-1 bg-neutral-800 rounded text-neutral-400 text-sm font-mono"
                >
                  {m.username}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {inactiveMembers.length > 0 && leaderboard.some((m) => m.lastUpdated) && (
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-white text-sm">💤 No Data in 7+ Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {inactiveMembers.map((m) => (
                <span
                  key={m.username}
                  className="px-2 py-1 bg-neutral-800 rounded text-neutral-400 text-sm font-mono"
                >
                  {m.username}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
