'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, TrendingUp, Flame } from 'lucide-react';
import { NoGainerData } from '@/components/no-gainer-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPublicLeaderboard, getPublicGainers } from '@/app/actions/leaderboard';

interface LeaderboardEntry {
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

interface GainerEntry {
  username: string;
  problemsGained: number;
  rankImproved: number;
  currentSolved: number;
  currentRank: number;
}

interface PublicLeaderboardClientProps {
  publicId: string;
}

export default function PublicLeaderboardClient({ publicId }: PublicLeaderboardClientProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gainers, setGainers] = useState<GainerEntry[]>([]);
  const [groupName, setGroupName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [lastSnapshotDate, setLastSnapshotDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leaderboardResult, gainersResult] = await Promise.all([
        getPublicLeaderboard(publicId),
        getPublicGainers(publicId, 7),
      ]);

      if (!leaderboardResult.success) {
        setError(leaderboardResult.error || 'Failed to load leaderboard');
        if (leaderboardResult.groupName) setGroupName(leaderboardResult.groupName);
        if (leaderboardResult.ownerName) setOwnerName(leaderboardResult.ownerName);
        if (leaderboardResult.memberCount) setMemberCount(leaderboardResult.memberCount);
        return;
      }

      if (leaderboardResult.data) setLeaderboard(leaderboardResult.data);
      if (leaderboardResult.groupName) setGroupName(leaderboardResult.groupName);
      if (leaderboardResult.ownerName) setOwnerName(leaderboardResult.ownerName);
      if (leaderboardResult.memberCount) setMemberCount(leaderboardResult.memberCount);
      if (leaderboardResult.lastSnapshotDate) setLastSnapshotDate(leaderboardResult.lastSnapshotDate);

      if (gainersResult.success && gainersResult.data) {
        setGainers(gainersResult.data);
      }
    } catch {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [publicId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function formatRank(rank: number): string {
    if (rank >= 5000000) return '~5M';
    return rank.toLocaleString();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-neutral-800 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-64 bg-neutral-800 rounded animate-pulse" />
                <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" />
              </div>
            </div>
            <Card className="border-neutral-800 bg-neutral-900">
              <CardContent className="py-6">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-neutral-800 rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6">
            {groupName && (
              <div>
                <h1 className="text-2xl font-bold text-white">{groupName}</h1>
                <p className="text-neutral-400 text-sm">by {ownerName}</p>
              </div>
            )}
            <Card className="border-neutral-800 bg-neutral-900">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto">
                    <Trophy className="h-8 w-8 text-neutral-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Leaderboard Unavailable</h2>
                  <p className="text-neutral-400 max-w-md mx-auto">{error}</p>
                  {memberCount > 0 && memberCount < 5 && (
                    <p className="text-yellow-400 text-sm">
                      This group has {memberCount}/5 members needed to unlock the leaderboard.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-7 w-7 text-yellow-500" />
              {groupName}
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              by {ownerName} &middot; {memberCount} members
            </p>
          </div>

          {/* Top Gainer Highlight */}
          <Card className="border-neutral-800 bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Top Gainer (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gainers.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`https://leetcode.com/${gainers[0].username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl font-bold text-white hover:underline font-mono"
                    >
                      {gainers[0].username}
                    </a>
                    <div className="flex items-center gap-4 mt-1 text-sm">
                      <span className="text-green-400 font-semibold">+{gainers[0].problemsGained} problems solved</span>
                      {gainers[0].rankImproved > 0 && (
                        <span className="text-green-400">↑ {gainers[0].rankImproved.toLocaleString()} rank</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <NoGainerData />
              )}
            </CardContent>
          </Card>

          {/* Main Leaderboard Table */}
          <Card className="border-neutral-800 bg-neutral-900">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Rankings
                </CardTitle>
                {lastSnapshotDate && (
                  <p className="text-xs text-neutral-500">
                    Last updated: {new Date(lastSnapshotDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {leaderboard.length === 0 ? (
                <p className="text-neutral-400 text-center py-4">
                  No stats available yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800 hover:bg-transparent">
                      <TableHead className="text-neutral-400 w-12">#</TableHead>
                      <TableHead className="text-neutral-400">Username</TableHead>
                      <TableHead className="text-neutral-400 text-right hidden md:table-cell">LeetCode Rank</TableHead>
                      <TableHead className="text-neutral-400 text-right">Total</TableHead>
                      <TableHead className="text-neutral-400 text-right hidden sm:table-cell">
                        <span className="text-green-500">E</span>
                      </TableHead>
                      <TableHead className="text-neutral-400 text-right hidden sm:table-cell">
                        <span className="text-yellow-500">M</span>
                      </TableHead>
                      <TableHead className="text-neutral-400 text-right hidden sm:table-cell">
                        <span className="text-red-500">H</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, index) => {
                      const rankBgColor = index === 0 ? 'bg-yellow-500/10' : index === 1 ? 'bg-gray-400/10' : index === 2 ? 'bg-orange-600/10' : '';
                      return (
                        <TableRow
                          key={entry.username}
                          className={`border-neutral-800 hover:bg-neutral-800/50 ${rankBgColor}`}
                        >
                          <TableCell className="text-white font-medium">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && index + 1}
                          </TableCell>
                          <TableCell className="text-white font-mono">
                            <a
                              href={`https://leetcode.com/${entry.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {entry.username}
                            </a>
                          </TableCell>
                          <TableCell className="text-neutral-300 text-right hidden md:table-cell">
                            {formatRank(entry.ranking)}
                          </TableCell>
                          <TableCell className="text-white font-semibold text-right">
                            {entry.totalSolved}
                          </TableCell>
                          <TableCell className="text-green-500 text-right hidden sm:table-cell">{entry.easySolved}</TableCell>
                          <TableCell className="text-yellow-500 text-right hidden sm:table-cell">{entry.mediumSolved}</TableCell>
                          <TableCell className="text-red-500 text-right hidden sm:table-cell">{entry.hardSolved}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Gainers Table */}
          {gainers.length > 1 && (
            <Card className="border-neutral-800 bg-neutral-900">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  All Gainers (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800 hover:bg-transparent">
                      <TableHead className="text-neutral-400">#</TableHead>
                      <TableHead className="text-neutral-400">Username</TableHead>
                      <TableHead className="text-neutral-400 text-right">Problems Solved</TableHead>
                      <TableHead className="text-neutral-400 text-right">Rank Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gainers.slice(0, 10).map((entry, index) => (
                      <TableRow key={entry.username} className="border-neutral-800 hover:bg-neutral-800/50">
                        <TableCell className="text-white font-medium">{index + 1}</TableCell>
                        <TableCell className="text-white font-mono">{entry.username}</TableCell>
                        <TableCell className="text-green-500 text-right font-semibold">
                          +{entry.problemsGained}
                        </TableCell>
                        <TableCell className={`text-right ${entry.rankImproved > 0 ? 'text-green-500' : 'text-neutral-400'}`}>
                          {entry.rankImproved > 0 ? `↑ ${entry.rankImproved.toLocaleString()}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center py-4">
            <p className="text-neutral-500 text-sm">
              Powered by <span className="text-white font-semibold">Leet <span className='text-yellow-500'> Grind </span> </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
