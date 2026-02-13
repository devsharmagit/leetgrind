'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, TrendingUp, Trophy, Settings, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { TableCell, TableHead } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getGroupLeaderboard,
  getGroupGainers,
} from '@/app/actions/leaderboard';
import { updateGroupSettings } from '@/app/actions/groups';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LeaderboardTable,
  TopGainerCard,
  GainersTable,
  MemberInsights,
} from '@/components/leaderboard';
import type { LeaderboardEntry, GainerEntry } from '@/components/leaderboard';

interface LeaderboardPageClientProps {
  group: {
    id: number;
    publicId: string;
    name: string;
    visibility: 'UNLISTED' | 'PRIVATE';
    ownerId: number;
    owner: {
      id: number;
      name: string;
      email: string;
    };
    members: Array<{
      id: number;
      leetcodeProfile: {
        id: number;
        username: string;
        stats: Array<{
          id: number;
          totalSolved: number;
          rankingPoints: number;
          date: Date;
        }>;
      };
    }>;
  };
  isOwner: boolean;
}

export default function LeaderboardPageClient({ group, isOwner }: LeaderboardPageClientProps) {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gainers, setGainers] = useState<GainerEntry[]>([]);
  const [lastSnapshotDate, setLastSnapshotDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState(group.name);
  const [settingsVisibility, setSettingsVisibility] = useState<'UNLISTED' | 'PRIVATE'>(group.visibility);
  const [savingSettings, setSavingSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const [leaderboardResult, gainersResult] = await Promise.all([
        getGroupLeaderboard(group.id),
        getGroupGainers(group.id, 7),
      ]);

      if (leaderboardResult.success && leaderboardResult.data) {
        setLeaderboard(leaderboardResult.data);
        if (leaderboardResult.lastSnapshotDate) {
          setLastSnapshotDate(leaderboardResult.lastSnapshotDate);
        }
      }

      if (gainersResult.success && gainersResult.data) {
        setGainers(gainersResult.data);
      }
    } catch {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [group.id]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      const result = await updateGroupSettings(group.id, {
        name: settingsName,
        visibility: settingsVisibility,
      });
      if (result.success) {
        toast.success('Group settings updated');
        setSettingsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update settings');
      }
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  }

  function handleShare() {
    const publicUrl = `${window.location.origin}/group/${group.publicId}/leaderboard`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      toast.success('Public leaderboard link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-neutral-800 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-64 bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-neutral-800 rounded animate-pulse" />
            <div className="h-10 w-32 bg-neutral-800 rounded animate-pulse" />
          </div>
        </div>
        {/* Table Skeleton */}
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <div className="h-6 w-48 bg-neutral-800 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-neutral-800 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if group has minimum 5 members
  const hasMinimumMembers = group.members.length >= 5;

  if (!hasMinimumMembers) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/groups/${group.publicId}`)}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-7 w-7 text-yellow-500" />
            {group.name} Leaderboard
          </h1>
        </div>

        {/* Minimum Members Required Card */}
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="py-12">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                <Trophy className="h-10 w-10 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Leaderboard Locked
                </h2>
                <p className="text-neutral-300 text-lg">
                  Your group needs at least <strong className="text-yellow-500">5 members</strong> to access the leaderboard.
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
                  className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Group
                </Button>
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <p className="text-neutral-400 text-sm mb-3">With 5+ members, you'll unlock:</p>
                <div className="grid grid-cols-2 gap-3 text-sm text-neutral-300">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                    <span>Live Rankings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-yellow-500" />
                    <span>Historical Data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>Top Gainers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                    <span>Performance Tracking</span>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/groups/${group.publicId}`)}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-7 w-7 text-yellow-500" />
              {group.name} Leaderboard
            </h1>
            <p className="text-neutral-400 text-sm mt-1">{group.members.length} members</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800 hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent  className="bg-neutral-800 text-white border-neutral-700">
                {copied ? 'Link copied!' : 'Share public leaderboard link'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isOwner && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/dashboard/groups/${group.publicId}/leaderboard/history`}>
                    <Button
                      variant="outline"
                      className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800 hover:text-white"
                    >
                      <History className="h-4 w-4 mr-2" />
                      View History
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-800 text-white border-neutral-700">
                  View leaderboard history and trends
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isOwner && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSettingsOpen(true)}
                      className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800 hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-neutral-800 text-white border-neutral-700">
                    Group Settings
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* <Button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
                    >
                      {refreshing ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Refreshing...
                        </>
                      ) : (
                        '🔄 Refresh Stats'
                      )}
                    </Button> */}
                  </TooltipTrigger>
                  <TooltipContent className="bg-neutral-800 text-white border-neutral-700">
                    Fetch latest stats from LeetCode
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>

      {/* Main Leaderboard */}
      <LeaderboardTable
        leaderboard={leaderboard}
        lastSnapshotDate={lastSnapshotDate}
        emptyMessage={
          isOwner
            ? 'No stats yet. Click "Refresh Stats" to fetch data.'
            : 'No stats available yet. Ask the group owner to refresh stats.'
        }
        extraHeaders={
          isOwner ? (
            <TableHead className="text-neutral-400 text-right">Actions</TableHead>
          ) : undefined
        }
        extraCells={
          isOwner
            ? (entry) => (
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/dashboard/groups/${group.publicId}/profile/${entry.username}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-neutral-400 h-8 w-8 p-0"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent className="bg-neutral-800 text-white border-neutral-700">
                        View profile history
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              )
            : undefined
        }
      />

      <TopGainerCard gainers={gainers} />

      <GainersTable gainers={gainers} />

      <MemberInsights leaderboard={leaderboard} />

      {/* Group Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">Group Settings</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Update your group name and visibility settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="group-name" className="text-neutral-300">Group Name</Label>
              <Input
                id="group-name"
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="Group name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-300">Visibility</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsVisibility('UNLISTED')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    settingsVisibility === 'UNLISTED'
                      ? 'border-yellow-500 bg-yellow-500/10 text-white'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                  }`}
                >
                  <div className="font-medium text-sm">Unlisted</div>
                  <p className="text-xs mt-1 opacity-70">Anyone with the link can view</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsVisibility('PRIVATE')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    settingsVisibility === 'PRIVATE'
                      ? 'border-yellow-500 bg-yellow-500/10 text-white'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                  }`}
                >
                  <div className="font-medium text-sm">Private</div>
                  <p className="text-xs mt-1 opacity-70">Only you can view this group</p>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              className="border-neutral-700 bg-transparent text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings || !settingsName.trim()}
              className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
            >
              {savingSettings ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
