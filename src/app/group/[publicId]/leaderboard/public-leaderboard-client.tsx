'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getPublicLeaderboard, getPublicGainers } from '@/app/actions/leaderboard';
import {
  LeaderboardTable,
  TopGainerCard,
  GainersTable,
} from '@/components/leaderboard';
import type { LeaderboardEntry, GainerEntry } from '@/components/leaderboard';

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

          <TopGainerCard gainers={gainers} />

          <LeaderboardTable
            leaderboard={leaderboard}
            lastSnapshotDate={lastSnapshotDate}
          />

          <GainersTable gainers={gainers} />

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
