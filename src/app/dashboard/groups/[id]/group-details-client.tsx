'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Crown, Trash2, X, UserPlus, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteGroup, removeMemberFromGroup } from '@/app/actions/groups';
import { toast } from 'sonner';
import BulkAddMembers from './bulk-add-members';

interface GroupDetailsClientProps {
  group: {
    id: number;
    name: string;
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
    _count: {
      members: number;
    };
  };
  isOwner: boolean;
}

export default function GroupDetailsClient({ group, isOwner }: GroupDetailsClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteGroup(group.id);

    if (result.success) {
      toast.success('Group deleted successfully');
      router.push('/dashboard');
    } else {
      toast.error(result.error || 'Failed to delete group');
      setIsDeleting(false);
    }
  };

  const handleRemoveMember = async (leetcodeProfileId: number) => {
    setRemovingMemberId(leetcodeProfileId);
    const result = await removeMemberFromGroup(group.id, leetcodeProfileId);

    if (result.success) {
      toast.success('Member removed');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to remove member');
    }
    setRemovingMemberId(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{group.name}</h1>
            <div className="flex items-center gap-2 text-neutral-400 mt-1">
              <Crown className="w-4 h-4 text-neutral-300" />
              <span className="text-sm">{group.owner.name}</span>
              <span className="text-neutral-600">•</span>
              <span className="text-sm">{group._count.members} members</span>
            </div>
          </div>
        </div>
        {isOwner && (
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="border-neutral-700 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Group
          </Button>
        )}
      </div>

      {/* Leaderboard Link Section */}
      <Card className="border-neutral-800 bg-neutral-900">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Leaderboard</h3>
                <p className="text-neutral-400 text-sm">View rankings, stats, and track progress over time</p>
              </div>
            </div>
            <Link href={`/dashboard/groups/${group.id}/leaderboard`}>
              <Button className="bg-white text-black hover:bg-neutral-200">
                View Leaderboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Members List */}
        <div className="lg:col-span-2">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-neutral-400" />
                  Members ({group.members.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {group.members.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-neutral-500" />
                  </div>
                  <p className="text-neutral-400 mb-2">No members yet</p>
                  <p className="text-neutral-500 text-sm">
                    Add LeetCode usernames to start tracking
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800 max-h-96 overflow-y-auto">
                  {group.members.map((member) => {
                    const latestStats = member.leetcodeProfile.stats[0];
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {member.leetcodeProfile.username[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <a
                              href={`https://leetcode.com/u/${member.leetcodeProfile.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-white hover:underline"
                            >
                              {member.leetcodeProfile.username}
                            </a>
                            {latestStats && (
                              <p className="text-xs text-neutral-500">
                                {latestStats.totalSolved} solved • {latestStats.rankingPoints} pts
                              </p>
                            )}
                          </div>
                        </div>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(member.leetcodeProfile.id)}
                            disabled={removingMemberId === member.leetcodeProfile.id}
                            className="h-8 w-8 text-neutral-500 hover:text-red-400 hover:bg-red-400/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Members Panel */}
        {isOwner && (
          <div className="lg:col-span-1">
            <BulkAddMembers groupId={group.id} existingUsernames={group.members.map(m => m.leetcodeProfile.username)} />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Group</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Are you sure you want to delete "{group.name}"? This action cannot be
              undone and will remove all members from the group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
