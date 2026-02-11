'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, ChevronDown, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

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
    publicId: string;
    name: string;
    members: Array<{
      id: number;
    }>;
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

  // Prepare chart data for progress over time (last 30 days)
  const chartData = useMemo(() => {
    if (snapshots.length === 0) return [];
    
    // Get unique usernames from all snapshots
    const allUsernames = new Set<string>();
    snapshots.forEach(snapshot => {
      (snapshot.snapshotData as LeaderboardEntry[]).forEach(entry => {
        allUsernames.add(entry.username);
      });
    });

    // Get top 5 users by most recent total solved
    const recentSnapshot = snapshots[0].snapshotData as LeaderboardEntry[];
    const topUsers = recentSnapshot
      .sort((a, b) => b.totalSolved - a.totalSolved)
      .slice(0, 5)
      .map(e => e.username);

    // Reverse snapshots for chronological order
    const chronologicalSnapshots = [...snapshots].reverse().slice(-30);

    return chronologicalSnapshots.map(snapshot => {
      const data = snapshot.snapshotData as LeaderboardEntry[];
      const dataMap = new Map(data.map(e => [e.username, e]));
      
      const point: Record<string, string | number> = {
        date: new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
      
      topUsers.forEach(username => {
        const entry = dataMap.get(username);
        point[username] = entry?.totalSolved ?? 0;
      });
      
      return point;
    });
  }, [snapshots]);

  // Get distinct colors for users
  const userColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

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

  // Check if group has minimum 5 members
  const hasMinimumMembers = group.members.length >= 5;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!hasMinimumMembers) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/groups/${group.publicId}/leaderboard`)}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-7 w-7 text-yellow-500" />
            Leaderboard History
          </h1>
        </div>

        {/* Minimum Members Required Card */}
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="py-12">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                <Calendar className="h-10 w-10 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  History Locked
                </h2>
                <p className="text-neutral-300 text-lg">
                  Your group needs at least <strong className="text-yellow-500">5 members</strong> to track leaderboard history.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex-1 max-w-xs bg-neutral-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-yellow-500 h-full transition-all duration-300"
                      style={{ width: `${(group.members.length / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-yellow-500 font-bold text-lg">
                    {group.members.length} / 5
                  </span>
                </div>
                <p className="text-yellow-400 font-medium">
                  Add {5 - group.members.length} more {5 - group.members.length === 1 ? 'member' : 'members'} to unlock!
                </p>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => router.push(`/dashboard/groups/${group.publicId}`)}
                  className="bg-white text-black hover:bg-neutral-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Group
                </Button>
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <p className="text-neutral-400 text-sm mb-3">Historical tracking includes:</p>
                <div className="grid grid-cols-2 gap-3 text-sm text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-yellow-500" />
                    <span>Daily Snapshots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                    <span>Progress Charts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                    <span>Gain Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-yellow-500" />
                    <span>90-Day History</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
          onClick={() => router.push(`/dashboard/groups/${group.publicId}/leaderboard`)}
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
        <>
          {/* Progress Chart - Top 5 Users */}
          {chartData.length > 1 && (
            <Card className="border-neutral-800 bg-neutral-900">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Progress Trend (Top 5 Users - Last 30 Days)
                </CardTitle>
                <CardDescription className="text-neutral-500">
                  Track solved problems over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{} satisfies ChartConfig} className="h-80 w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#737373"
                        tick={{ fill: '#737373', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#737373"
                        tick={{ fill: '#737373', fontSize: 12 }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        cursor={{ stroke: '#525252' }}
                      />
                      {snapshots.length > 0 && 
                        (snapshots[0].snapshotData as LeaderboardEntry[])
                          .sort((a, b) => b.totalSolved - a.totalSolved)
                          .slice(0, 5)
                          .map((entry, index) => (
                            <Line
                              key={entry.username}
                              type="monotone"
                              dataKey={entry.username}
                              stroke={userColors[index % userColors.length]}
                              strokeWidth={2}
                              dot={{ fill: userColors[index % userColors.length], r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          ))
                      }
                    </LineChart>
                </ChartContainer>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 justify-center">
                  {snapshots.length > 0 && 
                    (snapshots[0].snapshotData as LeaderboardEntry[])
                      .sort((a, b) => b.totalSolved - a.totalSolved)
                      .slice(0, 5)
                      .map((entry, index) => (
                        <div key={entry.username} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: userColors[index % userColors.length] }}
                          />
                          <span className="text-sm text-neutral-300 font-mono">
                            {entry.username}
                          </span>
                        </div>
                      ))
                  }
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rank Movement Analysis */}
          {snapshots.length >= 2 && (
            <Card className="border-neutral-800 bg-neutral-900">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Rank Movement (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const recent = snapshots[0].snapshotData as LeaderboardEntry[];
                  const previous = snapshots.find((s, i) => {
                    const daysDiff = Math.abs(
                      (new Date(snapshots[0].date).getTime() - new Date(s.date).getTime()) / 
                      (1000 * 60 * 60 * 24)
                    );
                    return i > 0 && daysDiff >= 6 && daysDiff <= 8;
                  })?.snapshotData as LeaderboardEntry[] | undefined;

                  if (!previous) {
                    return <p className="text-neutral-500 text-sm">Need at least 7 days of data to show rank movement</p>;
                  }

                  // Create rank maps
                  const previousRanks = new Map(previous.map((e, i) => [e.username, i + 1]));

                  // Calculate movements
                  const movements = recent.map((entry, index) => {
                    const currentRank = index + 1;
                    const prevRank = previousRanks.get(entry.username);
                    const movement = prevRank ? prevRank - currentRank : null;
                    return { ...entry, currentRank, prevRank, movement };
                  }).filter(e => e.movement !== null).sort((a, b) => (b.movement! - a.movement!));

                  const movers = movements.slice(0, 10);

                  return (
                    <div className="grid gap-2">
                      {movers.map((entry) => (
                        <div 
                          key={entry.username}
                          className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-white font-semibold">#{entry.currentRank}</div>
                            <span className="text-white font-mono">{entry.username}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-400 text-sm">
                              {entry.totalSolved} solved
                            </span>
                            {entry.movement! > 0 && (
                              <span className="text-green-500 font-medium flex items-center gap-1">
                                ↑ {entry.movement}
                              </span>
                            )}
                            {entry.movement! < 0 && (
                              <span className="text-red-500 font-medium flex items-center gap-1">
                                ↓ {Math.abs(entry.movement!)}
                              </span>
                            )}
                            {entry.movement === 0 && (
                              <span className="text-neutral-500 font-medium">→ 0</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Historical Snapshots */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Historical Snapshots
            </h2>
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
        </>
      )}
    </div>
  );
}
