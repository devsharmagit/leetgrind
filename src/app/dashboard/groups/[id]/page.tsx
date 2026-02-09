import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getGroupDetails } from '@/app/actions/groups';
import { prisma } from '@/lib/prisma';
import GroupDetailsClient from './group-details-client';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function GroupDetailsContent({ groupIdentifier }: { groupIdentifier: string }) {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Check if identifier is a number (internal id) or a cuid (publicId)
  let groupId: number;
  
  if (/^\d+$/.test(groupIdentifier)) {
    // It's a numeric id
    groupId = parseInt(groupIdentifier, 10);
  } else {
    // It's a publicId, look up the internal id
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

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense fallback={<GroupDetailsSkeleton />}>
          <GroupDetailsContent groupIdentifier={id} />
        </Suspense>
      </div>
    </div>
  );
}
