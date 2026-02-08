"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  refreshGroupStats, 
  getGroupLeaderboard, 
  getGroupGainers 
} from "@/app/actions/leaderboard";
import { toast } from "sonner";

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

interface LeaderboardProps {
  groupId: number;
}

export function Leaderboard({ groupId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gainers, setGainers] = useState<GainerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const [leaderboardResult, gainersResult] = await Promise.all([
        getGroupLeaderboard(groupId),
        getGroupGainers(groupId, 7),
      ]);

      if (leaderboardResult.success && leaderboardResult.data) {
        setLeaderboard(leaderboardResult.data);
      }

      if (gainersResult.success && gainersResult.data) {
        setGainers(gainersResult.data);
      }
    } catch {
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const result = await refreshGroupStats(groupId);
      
      if (result.success) {
        toast.success(result.message || "Stats refreshed");
        await loadLeaderboard();
      } else {
        toast.error(result.error || "Failed to refresh stats");
      }
    } catch {
      toast.error("Failed to refresh stats");
    } finally {
      setRefreshing(false);
    }
  }

  function formatRank(rank: number): string {
    if (rank >= 5000000) return "N/A";
    return rank.toLocaleString();
  }

  if (loading) {
    return (
      <Card className="border-neutral-800 bg-neutral-900">
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6" />
        </CardContent>
      </Card>
    );
  }

  const zeroSolvers = leaderboard.filter(m => m.totalSolved === 0);
  const inactiveMembers = leaderboard.filter(
    m => !m.lastUpdated || 
    (new Date().getTime() - new Date(m.lastUpdated).getTime()) > 7 * 24 * 60 * 60 * 1000
  );

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Leaderboard</h2>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800"
        >
          {refreshing ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Refreshing...
            </>
          ) : (
            "🔄 Refresh Stats"
          )}
        </Button>
      </div>

      {/* Main Leaderboard */}
      <Card className="border-neutral-800 bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-white">Rankings by LeetCode Rank</CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-neutral-400 text-center py-4">
              No stats yet. Click &quot;Refresh Stats&quot; to fetch data.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 hover:bg-transparent">
                  <TableHead className="text-neutral-400">#</TableHead>
                  <TableHead className="text-neutral-400">Username</TableHead>
                  <TableHead className="text-neutral-400 text-right">LeetCode Rank</TableHead>
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
                  <TableHead className="text-neutral-400 text-right">Contest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry, index) => (
                  <TableRow 
                    key={entry.username}
                    className="border-neutral-800 hover:bg-neutral-800/50"
                  >
                    <TableCell className="text-white font-medium">
                      {index === 0 && "🥇"}
                      {index === 1 && "🥈"}
                      {index === 2 && "🥉"}
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
                    <TableCell className="text-neutral-300 text-right">
                      {entry.contestRating || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Gainers (7 days) */}
      {gainers.length > 0 && (
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-white">🔥 Top Gainers (Last 7 Days)</CardTitle>
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
                {gainers.slice(0, 5).map((entry, index) => (
                  <TableRow 
                    key={entry.username}
                    className="border-neutral-800 hover:bg-neutral-800/50"
                  >
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

      {/* Zero Solvers & Inactive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Zero Solvers */}
        {zeroSolvers.length > 0 && (
          <Card className="border-neutral-800 bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-white text-sm">⚠️ Zero Problems Solved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {zeroSolvers.map(m => (
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

        {/* Inactive Members */}
        {inactiveMembers.length > 0 && leaderboard.some(m => m.lastUpdated) && (
          <Card className="border-neutral-800 bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-white text-sm">💤 No Data in 7+ Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {inactiveMembers.map(m => (
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
    </div>
  );
}
