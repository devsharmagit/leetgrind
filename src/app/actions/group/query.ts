"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ActionResult } from "@/lib/types/action-result";
import type { Group, User, GroupMember, LeetcodeProfile, DailyStat } from "@/generated/prisma/client";

// Complex group type with all relations for getGroups
type GroupWithRelationsAndCount = Group & {
  owner: User;
  members: (GroupMember & {
    leetcodeProfile: LeetcodeProfile;
  })[];
  _count: {
    members: number;
  };
};

// Group with member stats for getGroupDetails  
type GroupWithStats = Group & {
  owner: User;
  members: (GroupMember & {
    leetcodeProfile: LeetcodeProfile & {
      stats: DailyStat[];
    };
  })[];
  _count: {
    members: number;
  };
};

// Public group data (no internal IDs)
type PublicGroupData = {
  publicId: string;
  name: string;
  visibility: string;
  owner: {
    name: string;
  };
  members: {
    leetcodeProfile: {
      username: string;
      stats: DailyStat[];
    };
  }[];
  _count: {
    members: number;
  };
  createdAt: Date;
};

export async function getGroups(): Promise<ActionResult<GroupWithRelationsAndCount[], { currentUserId: number | null }>> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      // User not in database yet, return empty array
      return { success: true, data: [], currentUserId: null };
    }

    const groups = await prisma.group.findMany({
      where: {
        ownerId: user.id,
      },
      include: {
        owner: true,
        members: {
          include: {
            leetcodeProfile: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    return { success: true, data: groups, currentUserId: user.id };
  } catch (error) {
    console.error('Error fetching groups:', error);
    return { success: false, error: 'Failed to fetch groups' };
  }
}

export async function getGroupDetails(groupId: number): Promise<ActionResult<GroupWithStats, { currentUserId: number }>> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: true,
        members: {
          include: {
            leetcodeProfile: {
              include: {
                stats: {
                  orderBy: { date: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    // OWNERSHIP CHECK: Only allow access if user is the owner
    if (group.ownerId !== user.id) {
      return { success: false, error: 'Access denied. You can only view groups you own.' };
    }

    return { success: true, data: group, currentUserId: user.id };
  } catch (error) {
    console.error('Error fetching group details:', error);
    return { success: false, error: 'Failed to fetch group details' };
  }
}

export async function getGroupDetailsByPublicId(publicId: string): Promise<ActionResult<PublicGroupData>> {
  try {
    const group = await prisma.group.findUnique({
      where: { publicId },
      include: {
        owner: true,
        members: {
          include: {
            leetcodeProfile: {
              include: {
                stats: {
                  orderBy: { date: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    // Enforce visibility logic
    if (group.visibility === 'PRIVATE') {
      return { success: false, error: 'This group is private' };
    }

    // Return public-safe data (internal DB IDs removed)
    return { 
      success: true, 
      data: {
        publicId: group.publicId,
        name: group.name,
        visibility: group.visibility,
        owner: {
          name: group.owner.name,
        },
        members: group.members.map(member => ({
          // Remove internal DB IDs, only expose usernames
          leetcodeProfile: {
            username: member.leetcodeProfile.username,
            stats: member.leetcodeProfile.stats,
          },
        })),
        _count: group._count,
        createdAt: group.createdAt,
      } 
    };
  } catch (error) {
    console.error('Error fetching group details by publicId:', error);
    return { success: false, error: 'Failed to fetch group details' };
  }
}