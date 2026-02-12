import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getGroupDetails } from '@/app/actions/groups';
import { prisma } from '@/lib/prisma';
import LeaderboardHistoryClient from './history-client';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function HistoryContent({ groupIdentifier }: { groupIdentifier: string }) {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Check if identifier is a number (internal id) or a cuid (publicId)
  let groupId: number;
  
  if (/^\d+$/.test(groupIdentifier)) {
    groupId = parseInt(groupIdentifier, 10);
  } else {
    const group = await prisma.group.findUnique({
      where: { publicId: groupIdentifier },
      select: { id: true },
    });
    
    if (!group) {
      notFound();
    }
    
    groupId = group.id;
  }

  const result = await getGroupDetails(groupId);

  if (!result.success || !result.data) {
    notFound();
  }

  // Only the group owner can view history
  if (!result.currentUserId || result.data.ownerId !== result.currentUserId) {
    redirect(`/dashboard/groups/${groupIdentifier}/leaderboard`);
  }

  return <LeaderboardHistoryClient group={result.data} />;
}

function HistorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 bg-neutral-800" />
        <Skeleton className="h-8 w-64 bg-neutral-800" />
      </div>
      <Skeleton className="h-96 w-full bg-neutral-800" />
    </div>
  );
}

export default async function LeaderboardHistoryPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense fallback={<HistorySkeleton />}>
          <HistoryContent groupIdentifier={id} />
        </Suspense>
      </div>
    </div>
  );
}
