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

export async function getGroupDetails(groupId: number) {
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

    return { success: true, data: group, currentUserId: user?.id ?? null };
  } catch (error) {
    console.error('Error fetching group details:', error);
    return { success: false, error: 'Failed to fetch group details' };
  }
}

export async function getGroupDetailsByPublicId(publicId: string) {
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

    // Return public-safe data (internal id removed from response)
    return { 
      success: true, 
      data: {
        publicId: group.publicId,
        name: group.name,
        visibility: group.visibility,
        owner: {
          name: group.owner.name,
        },
        members: group.members,
        _count: group._count,
        createdAt: group.createdAt,
      } 
    };
  } catch (error) {
    console.error('Error fetching group details by publicId:', error);
    return { success: false, error: 'Failed to fetch group details' };
  }
}

// Validate if a LeetCode username exists
export async function validateLeetCodeUsername(username: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(`https://leetcode.com/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query userPublicProfile($username: String!) {
            matchedUser(username: $username) {
              username
            }
          }
        `,
        variables: { username },
      }),
    });

    if (!response.ok) {
      return { valid: false, error: 'Failed to verify username' };
    }

    const data = await response.json();
    
    if (data.data?.matchedUser?.username) {
      return { valid: true };
    }
    
    return { valid: false, error: `Username "${username}" not found on LeetCode` };
  } catch (error) {
    console.error('Error validating LeetCode username:', error);
    return { valid: false, error: 'Failed to verify username' };
  }
}

// Add multiple members to a group with validation
export async function addMembersToGroup(groupId: number, usernames: string[]) {
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
      include: {
        members: {
          include: {
            leetcodeProfile: true,
          },
        },
      },
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    if (group.ownerId !== user.id) {
      return { success: false, error: 'You can only add members to groups you own.' };
    }

    // Get existing usernames in the group
    const existingUsernames = new Set(
      group.members.map((m) => m.leetcodeProfile.username.toLowerCase())
    );

    const results: Array<{
      username: string;
      status: 'success' | 'error' | 'skipped';
      message: string;
    }> = [];

    // Process each username
    for (const rawUsername of usernames) {
      const username = rawUsername.trim();
      
      if (!username) continue;

      // Check if already in group
      if (existingUsernames.has(username.toLowerCase())) {
        results.push({
          username,
          status: 'skipped',
          message: 'Already in group',
        });
        continue;
      }

      // Validate LeetCode username
      const validation = await validateLeetCodeUsername(username);
      
      if (!validation.valid) {
        results.push({
          username,
          status: 'error',
          message: validation.error || 'Invalid username',
        });
        continue;
      }

      try {
        // Find or create the LeetCode profile
        let leetcodeProfile = await prisma.leetcodeProfile.findUnique({
          where: { username },
        });

        if (!leetcodeProfile) {
          leetcodeProfile = await prisma.leetcodeProfile.create({
            data: { username },
          });
        }

        // Add member to group
        await prisma.groupMember.create({
          data: {
            groupId,
            leetcodeProfileId: leetcodeProfile.id,
          },
        });

        existingUsernames.add(username.toLowerCase());
        
        results.push({
          username,
          status: 'success',
          message: 'Added successfully',
        });
      } catch {
        results.push({
          username,
          status: 'error',
          message: 'Failed to add',
        });
      }
    }

    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath('/dashboard');
    
    return { success: true, results };
  } catch (error) {
    console.error('Error adding members:', error);
    return { success: false, error: 'Failed to add members' };
  }
}
