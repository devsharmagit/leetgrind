"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteGroup } from "@/actions/groups";

interface Group {
  id: number;
  name: string;
  _count: {
    users: number;
  };
}

interface GroupListProps {
  groups: Group[];
}

export default function GroupList({ groups }: GroupListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (groupId: number) => {
    setError(null);
    setDeletingId(groupId);

    startTransition(async () => {
      const result = await deleteGroup(groupId);

      if (!result.success) {
        setError(result.error ?? "Failed to delete group");
        setDeletingId(null);
        return;
      }

      setDeletingId(null);
      router.refresh();
    });
  };

  if (groups.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        No groups yet. Create your first group above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 p-2 bg-red-50 rounded border border-red-200">
          {error}
        </p>
      )}
      {groups.map(group => (
        <div
          key={group.id}
          className="flex items-center justify-between rounded-md border border-black/10 px-4 py-3"
        >
          <div>
            <p className="text-black font-medium">{group.name}</p>
            <p className="text-xs text-gray-500">
              Members: {group._count.users}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(group.id)}
            disabled={isPending && deletingId === group.id}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isPending && deletingId === group.id ? (
              <span className="text-xs">Deleting...</span>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
