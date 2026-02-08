'use client';

import { useState } from 'react';
import { Users, Crown, Trash2, UserPlus, X } from 'lucide-react';
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
import AddMemberDialog from './add-member-dialog';

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
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
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
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 backdrop-blur-sm overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-slate-100 mb-1">
                {group.name}
              </CardTitle>
              <CardDescription className="text-slate-400 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                {group.owner.name}
              </CardDescription>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">
                {group._count.members}
              </p>
              <p className="text-xs text-slate-400">
                {group._count.members === 1 ? 'Member' : 'Members'}
              </p>
            </div>
          </div>

          {group.members.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Members
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-sm text-slate-300">
                      {member.leetcodeProfile.username}
                    </span>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => handleRemoveMember(member.leetcodeProfile.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="relative flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-400 transition-all"
            onClick={() => router.push(`/dashboard/groups/${group.id}`)}
          >
            View Details
          </Button>
          {isOwner && (
            <Button
              variant="outline"
              size="icon"
              className="border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 transition-all"
              onClick={() => setAddMemberDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">
              Delete Group
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete "{group.name}"? This action cannot be
              undone and will remove all members from the group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddMemberDialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        groupId={group.id}
        groupName={group.name}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }
      `}</style>
    </>
  );
}