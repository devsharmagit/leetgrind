import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getGroupDetails } from '@/app/actions/groups';
import GroupDetailsClient from './group-details-client';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function GroupDetailsContent({ groupId }: { groupId: number }) {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const result = await getGroupDetails(groupId);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <GroupDetailsClient 
      group={result.data} 
      isOwner={result.currentUserId !== null && result.data.ownerId === result.currentUserId}
    />
  );
}

function GroupDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 bg-neutral-800" />
        <Skeleton className="h-8 w-64 bg-neutral-800" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-48 w-full bg-neutral-800" />
          <Skeleton className="h-96 w-full bg-neutral-800" />
        </div>
        <div>
          <Skeleton className="h-64 w-full bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

export default async function GroupDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const groupId = parseInt(id, 10);
  
  if (isNaN(groupId)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense fallback={<GroupDetailsSkeleton />}>
          <GroupDetailsContent groupId={groupId} />
        </Suspense>
      </div>
    </div>
  );
}
