'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DailyStat {
  id: number;
  date: Date;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  contestRating: number;
  rankingPoints: number;
}

interface ProfileHistoryClientProps {
  group: {
    id: number;
    publicId: string;
    name: string;
  };
  profile: {
    id: number;
    username: string;
    stats: DailyStat[];
  };
}

export default function ProfileHistoryClient({ group, profile }: ProfileHistoryClientProps) {
  const router = useRouter();

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatRank(rank: number): string {
    if (rank >= 5000000) return '~5000000';
    return rank.toLocaleString();
  }

  function getChange(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'same' } {
    const diff = current - previous;
    if (diff > 0) return { value: diff, direction: 'up' };
    if (diff < 0) return { value: Math.abs(diff), direction: 'down' };
    return { value: 0, direction: 'same' };
  }

  function getRankChange(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'same' } {
    // For rank, lower is better, so we invert the logic
    const diff = previous - current;
    if (diff > 0) return { value: diff, direction: 'up' };
    if (diff < 0) return { value: Math.abs(diff), direction: 'down' };
    return { value: 0, direction: 'same' };
  }

  const stats = profile.stats.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestStat = stats[0];

  // Calculate total progress
  const oldestStat = stats[stats.length - 1];
  const totalProgress = latestStat && oldestStat ? {
    totalSolved: latestStat.totalSolved - oldestStat.totalSolved,
    rankImproved: oldestStat.ranking - latestStat.ranking,
    daysTracked: stats.length,
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/groups/${group.publicId}/leaderboard`)}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
            <p className="text-neutral-400 text-sm mt-1">Profile History • {group.name}</p>
          </div>
        </div>
        <a
          href={`https://leetcode.com/u/${profile.username}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="outline"
            className="border-neutral-700 bg-transparent text-white hover:text-white hover:bg-neutral-800"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on LeetCode
          </Button>
        </a>
      </div>

      {/* Stats Summary */}
      {latestStat && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-neutral-800 bg-neutral-900">
            <CardContent className="pt-6">
              <p className="text-neutral-400 text-sm">Total Solved</p>
              <p className="text-3xl font-bold text-white mt-1">{latestStat.totalSolved}</p>
              {totalProgress && totalProgress.totalSolved > 0 && (
                <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{totalProgress.totalSolved} total
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-neutral-900">
            <CardContent className="pt-6">
              <p className="text-neutral-400 text-sm">LeetCode Rank</p>
              <p className="text-3xl font-bold text-white mt-1">{formatRank(latestStat.ranking)}</p>
              {totalProgress && totalProgress.rankImproved > 0 && (
                <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  ↑ {totalProgress.rankImproved.toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-neutral-900">
            <CardContent className="pt-6">
              <p className="text-neutral-400 text-sm">Contest Rating</p>
              <p className="text-3xl font-bold text-white mt-1">
                {latestStat.contestRating || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-neutral-900">
            <CardContent className="pt-6">
              <p className="text-neutral-400 text-sm">Days Tracked</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Problem Distribution */}
      {latestStat && (
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-white">Problem Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-green-500 text-4xl font-bold">{latestStat.easySolved}</p>
                <p className="text-neutral-400 text-sm mt-1">Easy</p>
              </div>
              <div>
                <p className="text-yellow-500 text-4xl font-bold">{latestStat.mediumSolved}</p>
                <p className="text-neutral-400 text-sm mt-1">Medium</p>
              </div>
              <div>
                <p className="text-red-500 text-4xl font-bold">{latestStat.hardSolved}</p>
                <p className="text-neutral-400 text-sm mt-1">Hard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card className="border-neutral-800 bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-white">Daily History</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="text-neutral-400 text-center py-8">
              No history available. Refresh the leaderboard to start tracking.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 hover:bg-transparent">
                  <TableHead className="text-neutral-400">Date</TableHead>
                  <TableHead className="text-neutral-400 text-right">Rank</TableHead>
                  <TableHead className="text-neutral-400 text-right">Total</TableHead>
                  <TableHead className="text-neutral-400 text-right">Change</TableHead>
                  <TableHead className="text-neutral-400 text-right">
                    <span className="text-green-500">E</span>
                  </TableHead>
                  <TableHead className="text-neutral-400 text-right">
                    <span className="text-yellow-500">M</span>
                  </TableHead>
                  <TableHead className="text-neutral-400 text-right">
                    <span className="text-red-500">H</span>
                  </TableHead>
                  <TableHead className="text-neutral-400 text-right">Contest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat, index) => {
                  const prevStat = stats[index + 1];
                  const solvedChange = prevStat ? getChange(stat.totalSolved, prevStat.totalSolved) : null;
                  const rankChange = prevStat ? getRankChange(stat.ranking, prevStat.ranking) : null;

                  return (
                    <TableRow
                      key={stat.id}
                      className="border-neutral-800 hover:bg-neutral-800/50"
                    >
                      <TableCell className="text-white">{formatDate(stat.date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-neutral-300">{formatRank(stat.ranking)}</span>
                          {rankChange && rankChange.direction !== 'same' && (
                            <span
                              className={`text-xs ${
                                rankChange.direction === 'up' ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              {rankChange.direction === 'up' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-semibold text-right">
                        {stat.totalSolved}
                      </TableCell>
                      <TableCell className="text-right">
                        {solvedChange ? (
                          solvedChange.direction === 'same' ? (
                            <span className="text-neutral-500 flex items-center justify-end gap-1">
                              <Minus className="h-3 w-3" />
                              0
                            </span>
                          ) : solvedChange.direction === 'up' ? (
                            <span className="text-green-500 flex items-center justify-end gap-1">
                              <TrendingUp className="h-3 w-3" />
                              +{solvedChange.value}
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center justify-end gap-1">
                              <TrendingDown className="h-3 w-3" />
                              -{solvedChange.value}
                            </span>
                          )
                        ) : (
                          <span className="text-neutral-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-green-500 text-right">{stat.easySolved}</TableCell>
                      <TableCell className="text-yellow-500 text-right">{stat.mediumSolved}</TableCell>
                      <TableCell className="text-red-500 text-right">{stat.hardSolved}</TableCell>
                      <TableCell className="text-neutral-300 text-right">
                        {stat.contestRating || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
