"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface AddMemberInput {
  groupId: number;
  leetcodeUsername: string;
}

export async function createGroup(name: string) {
  // Check if user is logged in
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in to create a group.' };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { success: false, error: 'Group name must be at least 2 characters.' };
  }

  try {
    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name ?? "User",
        },
      });
    }

    // Create the group
    const group = await prisma.group.create({
      data: {
        name: trimmedName,
        ownerId: user.id,
      },
      include: {
        owner: true,
        members: {
          include: {
            leetcodeProfile: true,
          },
        },
      },
    });

    revalidatePath('/dashboard');
    return { success: true, data: group };
  } catch (error) {
    console.error('Error creating group:', error);
    return { success: false, error: 'Failed to create group' };
  }
}

export async function deleteGroup(groupId: number) {
  // Check if user is logged in
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if the group exists and user owns it
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    if (group.ownerId !== user.id) {
      return { success: false, error: 'You can only delete groups you own.' };
    }

    // Delete all group members first
    await prisma.groupMember.deleteMany({
      where: { groupId },
    });

    // Then delete the group
    await prisma.group.delete({
      where: { id: groupId },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting group:', error);
    return { success: false, error: 'Failed to delete group' };
  }
}

export async function addMemberToGroup(input: AddMemberInput) {
  // Check if user is logged in
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if user owns the group
    const group = await prisma.group.findUnique({
      where: { id: input.groupId },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    if (group.ownerId !== user.id) {
      return { success: false, error: 'You can only add members to groups you own.' };
    }

    // First, find or create the LeetCode profile
    let leetcodeProfile = await prisma.leetcodeProfile.findUnique({
      where: { username: input.leetcodeUsername },
    });

    if (!leetcodeProfile) {
      leetcodeProfile = await prisma.leetcodeProfile.create({
        data: {
          username: input.leetcodeUsername,
        },
      });
    }

    // Check if member already exists in group
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_leetcodeProfileId: {
          groupId: input.groupId,
          leetcodeProfileId: leetcodeProfile.id,
        },
      },
    });

    if (existingMember) {
      return { success: false, error: 'Member already exists in this group' };
    }

    // Add member to group
    const member = await prisma.groupMember.create({
      data: {
        groupId: input.groupId,
        leetcodeProfileId: leetcodeProfile.id,
      },
      include: {
        leetcodeProfile: true,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, data: member };
  } catch (error) {
    console.error('Error adding member:', error);
    return { success: false, error: 'Failed to add member' };
  }
}

export async function removeMemberFromGroup(groupId: number, leetcodeProfileId: number) {
  // Check if user is logged in
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if user owns the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    if (group.ownerId !== user.id) {
      return { success: false, error: 'You can only remove members from groups you own.' };
    }

    await prisma.groupMember.delete({
      where: {
        groupId_leetcodeProfileId: {
          groupId,
          leetcodeProfileId,
        },
      },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error removing member:', error);
    return { success: false, error: 'Failed to remove member' };
  }
}

export async function getGroups() {
  // Check if user is logged in
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      // User not in database yet, return empty array
      return { success: true, data: [], currentUserId: null };
    }

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { users: { some: { id: user.id } } },
        ],
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

export async function getGroupDetails(groupId: number) {
  // Check if user is logged in
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
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
      },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    // Optional: Check if user has access to this group
    // For now, any logged-in user can view any group details

    return { success: true, data: group };
  } catch (error) {
    console.error('Error fetching group details:', error);
    return { success: false, error: 'Failed to fetch group details' };
  }
}
