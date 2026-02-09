'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, ChevronDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getLeaderboardHistory } from '@/app/actions/leaderboard';
import { toast } from 'sonner';

interface LeaderboardEntry {
  username: string;
  ranking: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating: number;
  rankingPoints: number;
}

interface Snapshot {
  id: number;
  groupId: number;
  date: Date;
  snapshotData: LeaderboardEntry[];
  topGainers: Array<{
    username: string;
    problemsGained: number;
    rankImproved: number;
  }> | null;
}

interface GainerFromSnapshot {
  username: string;
  problemsGained: number;
  currentSolved: number;
  previousSolved: number;
}

interface LeaderboardHistoryClientProps {
  group: {
    id: number;
    name: string;
  };
}

export default function LeaderboardHistoryClient({ group }: LeaderboardHistoryClientProps) {
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const result = await getLeaderboardHistory(group.id, 90);
        if (result.success && result.data) {
          setSnapshots(result.data as unknown as Snapshot[]);
          if (result.data.length > 0) {
            const firstDate = new Date(result.data[0].date).toISOString().split('T')[0];
            setExpandedDates(new Set([firstDate]));
          }
        }
      } catch {
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [group.id]);

  // Calculate gainers by comparing with the previous snapshot
  const snapshotGainers = useMemo(() => {
    const gainersMap = new Map<number, GainerFromSnapshot[]>();
    
    // Snapshots are ordered desc by date, so previous snapshot is at index + 1
    for (let i = 0; i < snapshots.length - 1; i++) {
      const current = snapshots[i];
      const previous = snapshots[i + 1];
      
      const currentData = current.snapshotData as LeaderboardEntry[];
      const previousData = previous.snapshotData as LeaderboardEntry[];
      
      // Create a map of previous stats
      const previousMap = new Map<string, number>();
      for (const entry of previousData) {
        previousMap.set(entry.username, entry.totalSolved);
      }
      
      // Calculate gainers
      const gainers: GainerFromSnapshot[] = [];
      for (const entry of currentData) {
        const prevSolved = previousMap.get(entry.username) ?? 0;
        const gained = entry.totalSolved - prevSolved;
        if (gained > 0) {
          gainers.push({
            username: entry.username,
            problemsGained: gained,
            currentSolved: entry.totalSolved,
            previousSolved: prevSolved,
          });
        }
      }
      
      // Sort by problems gained descending
      gainers.sort((a, b) => b.problemsGained - a.problemsGained);
      gainersMap.set(current.id, gainers);
    }
    
    return gainersMap;
  }, [snapshots]);

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatRank(rank: number): string {
    if (rank >= 5000000) return '~5000000';
    return rank.toLocaleString();
  }

  function toggleDate(dateStr: string) {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateStr)) {
      newExpanded.delete(dateStr);
    } else {
      newExpanded.add(dateStr);
    }
    setExpandedDates(newExpanded);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/groups/${group.id}/leaderboard`)}
          className="text-neutral-400 hover:text-white hover:bg-neutral-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-7 w-7 text-blue-500" />
            Leaderboard History
          </h1>
          <p className="text-neutral-400 text-sm mt-1">{group.name}</p>
        </div>
      </div>

      {snapshots.length === 0 ? (
        <Card className="border-neutral-800 bg-neutral-900">
          <CardContent className="py-16 text-center">
            <Calendar className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 text-lg">No history available yet</p>
            <p className="text-neutral-500 text-sm mt-2">
              Refresh the leaderboard to start tracking history
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {snapshots.map((snapshot) => {
            const dateStr = new Date(snapshot.date).toISOString().split('T')[0];
            const isExpanded = expandedDates.has(dateStr);
            const data = snapshot.snapshotData as LeaderboardEntry[];

            return (
              <Card key={snapshot.id} className="border-neutral-800 bg-neutral-900">
                <CardHeader
                  className="cursor-pointer hover:bg-neutral-800/50 transition-colors"
                  onClick={() => toggleDate(dateStr)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">
                      {formatDate(snapshot.date)}
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <span className="text-neutral-400 text-sm">
                        {data.length} members
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-neutral-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-neutral-800 hover:bg-transparent">
                          <TableHead className="text-neutral-400">#</TableHead>
                          <TableHead className="text-neutral-400">Username</TableHead>
                          <TableHead className="text-neutral-400 text-right">Rank</TableHead>
                          <TableHead className="text-neutral-400 text-right">Total</TableHead>
                          <TableHead className="text-neutral-400 text-right">
                            <span className="text-green-500">E</span>
                          </TableHead>
                          <TableHead className="text-neutral-400 text-right">
                            <span className="text-yellow-500">M</span>
                          </TableHead>
                          <TableHead className="text-neutral-400 text-right">
                            <span className="text-red-500">H</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((entry, index) => (
                          <TableRow
                            key={entry.username}
                            className="border-neutral-800 hover:bg-neutral-800/50"
                          >
                            <TableCell className="text-white font-medium">
                              {index === 0 && '🥇'}
                              {index === 1 && '🥈'}
                              {index === 2 && '🥉'}
                              {index > 2 && index + 1}
                            </TableCell>
                            <TableCell className="text-white font-mono">
                              {entry.username}
                            </TableCell>
                            <TableCell className="text-neutral-300 text-right">
                              {formatRank(entry.ranking)}
                            </TableCell>
                            <TableCell className="text-white font-semibold text-right">
                              {entry.totalSolved}
                            </TableCell>
                            <TableCell className="text-green-500 text-right">
                              {entry.easySolved}
                            </TableCell>
                            <TableCell className="text-yellow-500 text-right">
                              {entry.mediumSolved}
                            </TableCell>
                            <TableCell className="text-red-500 text-right">
                              {entry.hardSolved}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Zero Solvers */}
                    {(() => {
                      const zeroSolvers = data.filter(e => e.totalSolved === 0);
                      if (zeroSolvers.length === 0) return null;
                      return (
                        <div className="mt-6 pt-4 border-t border-neutral-800">
                          <h4 className="text-white font-medium mb-3">⚠️ Zero Problems Solved</h4>
                          <div className="flex flex-wrap gap-2">
                            {zeroSolvers.map((member) => (
                              <span
                                key={member.username}
                                className="px-3 py-1 bg-neutral-800 rounded text-neutral-400 text-sm font-mono"
                              >
                                {member.username}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Top Gainers from previous snapshot */}
                    {(() => {
                      const gainers = snapshotGainers.get(snapshot.id);
                      if (!gainers || gainers.length === 0) return null;
                      return (
                        <div className="mt-6 pt-4 border-t border-neutral-800">
                          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            Top Gainers (vs Previous Snapshot)
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {gainers.slice(0, 10).map((gainer) => (
                              <span
                                key={gainer.username}
                                className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm"
                              >
                                {gainer.username}: +{gainer.problemsGained} ({gainer.previousSolved} → {gainer.currentSolved})
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
