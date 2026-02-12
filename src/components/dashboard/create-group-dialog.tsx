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
import { createGroup } from '@/app/actions/groups';
import { toast } from 'sonner';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateGroupDialog({
  open,
  onOpenChange,
}: CreateGroupDialogProps) {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    setIsSubmitting(true);

    const result = await createGroup(groupName.trim());

    if (result.success) {
      toast.success('Group created successfully!');
      setGroupName('');
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to create group');
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-800 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">
              Create New Group
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Create a group to track LeetCode progress with your team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-neutral-300">
                Group Name
              </Label>
              <Input
                id="groupName"
                placeholder="e.g., Weekend Warriors, FAANG Prep Team"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:ring-neutral-600"
                autoFocus
              />
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
              disabled={isSubmitting || !groupName.trim()}
              className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}