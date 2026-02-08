
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateGroupDialog from './create-group-dialog';
import GroupCard from './group-card';

interface Group {
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
    };
  }>;
  _count: {
    members: number;
  };
}

interface DashboardClientProps {
  groups: Group[];
  userId: number | null;
}

export default function DashboardClient({ groups, userId }: DashboardClientProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
            LeetCode Groups
          </h1>
          <p className="text-slate-400 text-lg">
            Track your team's progress and compete together
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/50 transition-all duration-300 hover:shadow-cyan-500/70 hover:scale-105"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-6 shadow-xl">
            <Plus className="w-12 h-12 text-slate-500" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-300 mb-2">
            No groups yet
          </h2>
          <p className="text-slate-500 mb-6 max-w-md">
            Create your first group to start tracking LeetCode progress with your team
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Group
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} userId={userId} />
          ))}
        </div>
      )}

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}