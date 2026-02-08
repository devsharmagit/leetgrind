'use client';

import { useState } from 'react';
import { Users, Crown, Trash2, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface GroupCardProps {
  group: {
    id: number;
    name: string;
    ownerId: number;
    owner: {
      name: string;
    };
    members: Array<{
      id: number;
      leetcodeProfile: {
        id: number;
        username: string;
      };
    }>;
    _count: {
      members: number;
    };
  };
  userId: number | null;
}

export default function GroupCard({ group, userId }: GroupCardProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = userId !== null && group.ownerId === userId;

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteGroup(group.id);

    if (result.success) {
      toast.success('Group deleted successfully');
      setDeleteDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete group');
    }
    setIsDeleting(false);
  };

  const handleRemoveMember = async (leetcodeProfileId: number) => {
    const result = await removeMemberFromGroup(group.id, leetcodeProfileId);

    if (result.success) {
      toast.success('Member removed successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to remove member');
    }
  };

  return (
    <>
      <Card className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-all duration-300 overflow-hidden group">
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-white mb-1">
                {group.name}
              </CardTitle>
              <CardDescription className="text-neutral-400 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-neutral-300" />
                {group.owner.name}
              </CardDescription>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-neutral-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Users className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {group._count.members}
              </p>
              <p className="text-xs text-neutral-500">
                {group._count.members === 1 ? 'Member' : 'Members'}
              </p>
            </div>
          </div>

          {group.members.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Members
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {group.members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                  >
                    <span className="text-sm text-neutral-300">
                      {member.leetcodeProfile.username}
                    </span>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-neutral-600 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => handleRemoveMember(member.leetcodeProfile.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {group.members.length > 5 && (
                  <p className="text-xs text-neutral-500 text-center py-1">
                    +{group.members.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="relative">
          <Button
            variant="outline"
            className="w-full border-neutral-700 bg-transparent hover:border-neutral-600 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all"
            onClick={() => router.push(`/dashboard/groups/${group.id}`)}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Group
            </AlertDialogTitle>
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(23, 23, 23, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(115, 115, 115, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(163, 163, 163, 0.7);
        }
      `}</style>
    </>
  );
}