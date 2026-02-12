'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addMemberToGroup } from '@/app/actions/groups';
import { toast } from 'sonner';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  groupName: string;
}

export default function AddMemberDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
}: AddMemberDialogProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error('Please enter a LeetCode username');
      return;
    }

    setIsSubmitting(true);

    const result = await addMemberToGroup({
      groupId,
      leetcodeUsername: username.trim(),
    });

    if (result.success) {
      toast.success(`${username} added to ${groupName}!`);
      setUsername('');
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to add member');
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-800 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">
              Add Member
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Add a member to <span className="text-yellow-500 font-medium">{groupName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-neutral-300">
                LeetCode Username
              </Label>
              <Input
                id="username"
                placeholder="e.g., john_doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:ring-neutral-600"
                autoFocus
              />
              <p className="text-xs text-neutral-500">
                Valid format: letters, numbers, underscore (_), hyphen (-), max 15 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !username.trim()}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
            >
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}