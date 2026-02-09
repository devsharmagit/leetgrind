import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getGroupDetailsByPublicId } from '@/app/actions/groups';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Crown, Lock } from 'lucide-react';

interface PageProps {
  params: Promise<{ publicId: string }>;
}

async function PublicGroupContent({ publicId }: { publicId: string }) {
  const result = await getGroupDetailsByPublicId(publicId);

  if (!result.success || !result.data) {
    if (result.error === 'This group is private') {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Card className="bg-neutral-900 border-neutral-800 max-w-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Private Group
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400">
                This group is private and cannot be accessed publicly.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    notFound();
  }

  const { data: group } = result;
  const memberCount = group._count.members;
  const hasMinimumMembers = memberCount >= 5;

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-2xl text-white">{group.name}</CardTitle>
              <div className="flex items-center gap-2 text-neutral-400">
                <Crown className="w-4 h-4" />
                <span>{group.owner.name}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-neutral-400" />
                <span className="text-neutral-300">
                  {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                </span>
              </div>

              {/* Minimum Members Warning */}
              {!hasMinimumMembers && (
                <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-yellow-500 font-semibold mb-1">
                        Leaderboard Locked
                      </h3>
                      <p className="text-neutral-300 text-sm">
                        This group needs at least <strong>5 members</strong> to display the public leaderboard.
                        Currently has {memberCount} {memberCount === 1 ? 'member' : 'members'}.
                        {memberCount < 5 && (
                          <span className="block mt-1 text-yellow-400">
                            {5 - memberCount} more {5 - memberCount === 1 ? 'member' : 'members'} needed.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {group.members.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                    Members
                  </h3>
                  <div className="grid gap-2">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-300">
                            {member.leetcodeProfile.username}
                          </span>
                          {member.leetcodeProfile.stats[0] && (
                            <span className="text-sm text-neutral-500">
                              {member.leetcodeProfile.stats[0].totalSolved} solved
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PublicGroupSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

export default async function PublicGroupPage({ params }: PageProps) {
  const { publicId } = await params;

  return (
    <Suspense fallback={<PublicGroupSkeleton />}>
      <PublicGroupContent publicId={publicId} />
    </Suspense>
  );
}
