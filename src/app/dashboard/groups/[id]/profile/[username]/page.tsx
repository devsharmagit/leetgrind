import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getGroupDetails } from '@/app/actions/groups';
import { getProfileHistory } from '@/app/actions/leaderboard';
import { prisma } from '@/lib/prisma';
import ProfileHistoryClient from './profile-history-client';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ id: string; username: string }>;
}

async function ProfileHistoryContent({ groupIdentifier, username }: { groupIdentifier: string; username: string }) {
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

  const [groupResult, profileResult] = await Promise.all([
    getGroupDetails(groupId),
    getProfileHistory(username, 90),
  ]);

  if (!groupResult.success || !groupResult.data) {
    notFound();
  }

  if (!profileResult.success || !profileResult.data) {
    notFound();
  }

  return (
    <ProfileHistoryClient 
      group={groupResult.data} 
      profile={profileResult.data}
    />
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 bg-neutral-800" />
        <Skeleton className="h-8 w-64 bg-neutral-800" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Skeleton className="h-24 w-full bg-neutral-800" />
        <Skeleton className="h-24 w-full bg-neutral-800" />
        <Skeleton className="h-24 w-full bg-neutral-800" />
        <Skeleton className="h-24 w-full bg-neutral-800" />
      </div>
      <Skeleton className="h-96 w-full bg-neutral-800" />
    </div>
  );
}

export default async function ProfileHistoryPage({ params }: PageProps) {
  const { id, username } = await params;

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileHistoryContent groupIdentifier={id} username={decodeURIComponent(username)} />
        </Suspense>
      </div>
    </div>
  );
}
