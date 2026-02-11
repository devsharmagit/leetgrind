"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface AddMemberInput {
  groupId: number;
  leetcodeUsername: string;
}

// Validate LeetCode username format
// LeetCode usernames: 3-30 chars, letters, numbers, underscore only
function validateUsernameFormat(username: string): { valid: boolean; error?: string } {
  if (!username || username.length === 0) {
    return { valid: false, error: 'Username cannot be empty' };
  }
  
  if (username.length < 3) {
    return { valid: false, error: 'Username too short (min 3 characters)' };
  }
  
  if (username.length > 30) {
    return { valid: false, error: 'Username too long (max 30 characters)' };
  }
  
  // LeetCode usernames: letters, numbers, underscore only (no hyphens or special chars)
  const validPattern = /^[a-zA-Z0-9_]+$/;
  if (!validPattern.test(username)) {
    return { valid: false, error: 'Username contains invalid characters (only letters, numbers, _ allowed)' };
  }
  
  return { valid: true };
}

// Normalize username: trim and lowercase
function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
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
    // Validate and normalize username
    const normalizedUsername = normalizeUsername(input.leetcodeUsername);
    const formatValidation = validateUsernameFormat(normalizedUsername);
    
    if (!formatValidation.valid) {
      return { success: false, error: formatValidation.error };
    }

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

    // First, find or create the LeetCode profile with normalized username
    let leetcodeProfile = await prisma.leetcodeProfile.findUnique({
      where: { username: normalizedUsername },
    });

    if (!leetcodeProfile) {
      leetcodeProfile = await prisma.leetcodeProfile.create({
        data: {
          username: normalizedUsername,
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
// Single member add for progressive bulk operations
export async function addSingleMemberToGroup(
  groupId: number,
  rawUsername: string,
  existingUsernames: string[]
) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { 
      success: false, 
      username: rawUsername,
      status: 'error' as const,
      message: 'Unauthorized'
    };
  }

  try {
    const username = normalizeUsername(rawUsername);
    
    if (!username) {
      return {
        success: false,
        username: rawUsername,
        status: 'error' as const,
        message: 'Invalid username'
      };
    }

    // Validate username format
    const formatValidation = validateUsernameFormat(username);
    if (!formatValidation.valid) {
      return {
        success: false,
        username: rawUsername,
        status: 'error' as const,
        message: formatValidation.error || 'Invalid format'
      };
    }

    // Check if already in group
    if (existingUsernames.map(u => u.toLowerCase()).includes(username)) {
      return {
        success: true,
        username,
        status: 'skipped' as const,
        message: 'Already in group'
      };
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return {
        success: false,
        username,
        status: 'error' as const,
        message: 'User not found'
      };
    }

    // Check if user owns the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return {
        success: false,
        username,
        status: 'error' as const,
        message: 'Group not found'
      };
    }

    if (group.ownerId !== user.id) {
      return {
        success: false,
        username,
        status: 'error' as const,
        message: 'Unauthorized'
      };
    }

    // Validate LeetCode username exists
    const validation = await validateLeetCodeUsername(username);
    
    if (!validation.valid) {
      return {
        success: false,
        username,
        status: 'error' as const,
        message: validation.error || 'Not found on LeetCode'
      };
    }

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

    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath('/dashboard');
    
    return {
      success: true,
      username,
      status: 'success' as const,
      message: 'Added successfully'
    };
  } catch (error) {
    console.error('Error adding member:', error);
    return {
      success: false,
      username: rawUsername,
      status: 'error' as const,
      message: 'Failed to add'
    };
  }
}

export async function updateGroupSettings(
  groupId: number,
  settings: { name?: string; visibility?: 'UNLISTED' | 'PRIVATE' }
) {
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
    });

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    if (group.ownerId !== user.id) {
      return { success: false, error: 'You can only update groups you own.' };
    }

    const updateData: { name?: string; visibility?: 'UNLISTED' | 'PRIVATE' } = {};
    if (settings.name !== undefined) {
      const trimmed = settings.name.trim();
      if (trimmed.length < 2) {
        return { success: false, error: 'Group name must be at least 2 characters.' };
      }
      updateData.name = trimmed;
    }
    if (settings.visibility !== undefined) {
      updateData.visibility = settings.visibility;
    }

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: updateData,
    });

    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath('/dashboard');

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating group settings:', error);
    return { success: false, error: 'Failed to update group settings' };
  }
}

export async function addMembersToGroup(groupId: number, usernames: string[]) {
  // --- 1. Auth + ownership check (ONCE) ---
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized. Please log in.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return { success: false, error: 'User not found' };

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { leetcodeProfile: { select: { username: true } } } },
      },
    });
    if (!group) return { success: false, error: 'Group not found' };
    if (group.ownerId !== user.id) {
      return { success: false, error: 'You can only add members to groups you own.' };
    }

    // --- 2. Build existing set + dedupe/validate locally (instant, no DB) ---
    const existingSet = new Set(
      group.members.map((m) => m.leetcodeProfile.username.toLowerCase())
    );

    type Result = { username: string; status: 'success' | 'error' | 'skipped'; message: string };
    const results: Result[] = [];
    const toValidate: string[] = [];
    const indexMap = new Map<string, number>(); // username -> index in results

    for (const raw of usernames) {
      const username = normalizeUsername(raw);
      if (!username) continue;

      const fmt = validateUsernameFormat(username);
      if (!fmt.valid) {
        results.push({ username: raw, status: 'error', message: fmt.error || 'Invalid format' });
        continue;
      }
      if (existingSet.has(username)) {
        results.push({ username, status: 'skipped', message: 'Already in group' });
        continue;
      }
      // Prevent processing duplicate entries within the same batch
      if (indexMap.has(username)) {
        results.push({ username, status: 'skipped', message: 'Duplicate in batch' });
        continue;
      }

      indexMap.set(username, results.length);
      results.push({ username, status: 'error', message: 'Pending' }); // placeholder
      toValidate.push(username);
    }

    // --- 3. Validate LeetCode usernames in parallel batches of 5 ---
    const BATCH_SIZE = 5;
    const validUsernames: string[] = [];

    for (let i = 0; i < toValidate.length; i += BATCH_SIZE) {
      const batch = toValidate.slice(i, i + BATCH_SIZE);
      const validations = await Promise.all(
        batch.map(async (username) => {
          try {
            const v = await validateLeetCodeUsername(username);
            return { username, valid: v.valid, error: v.error };
          } catch {
            return { username, valid: false, error: 'Validation failed' };
          }
        })
      );

      for (const v of validations) {
        const idx = indexMap.get(v.username)!;
        if (v.valid) {
          validUsernames.push(v.username);
        } else {
          results[idx] = { username: v.username, status: 'error', message: v.error || 'Not found on LeetCode' };
        }
      }

      // Small delay between batches to avoid LeetCode rate limiting
      if (i + BATCH_SIZE < toValidate.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // --- 4. Batch DB: find existing profiles in one query ---
    if (validUsernames.length > 0) {
      const existingProfiles = await prisma.leetcodeProfile.findMany({
        where: { username: { in: validUsernames } },
        select: { id: true, username: true },
      });
      const profileMap = new Map(existingProfiles.map(p => [p.username, p.id]));

      // Create missing profiles
      const missingUsernames = validUsernames.filter(u => !profileMap.has(u));
      if (missingUsernames.length > 0) {
        await prisma.leetcodeProfile.createMany({
          data: missingUsernames.map(u => ({ username: u })),
          skipDuplicates: true,
        });
        // Re-fetch to get their IDs
        const newProfiles = await prisma.leetcodeProfile.findMany({
          where: { username: { in: missingUsernames } },
          select: { id: true, username: true },
        });
        for (const p of newProfiles) {
          profileMap.set(p.username, p.id);
        }
      }

      // --- 5. Batch DB: add all group members at once ---
      const memberData = validUsernames
        .filter(u => profileMap.has(u))
        .map(u => ({ groupId, leetcodeProfileId: profileMap.get(u)! }));

      if (memberData.length > 0) {
        await prisma.groupMember.createMany({
          data: memberData,
          skipDuplicates: true,
        });
      }

      // Mark all valid usernames as success
      for (const username of validUsernames) {
        const idx = indexMap.get(username);
        if (idx !== undefined && profileMap.has(username)) {
          results[idx] = { username, status: 'success', message: 'Added successfully' };
        }
      }
    }

    // --- 6. Revalidate once ---
    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath('/dashboard');

    return { success: true, results };
  } catch (error) {
    console.error('Error adding members:', error);
    return { success: false, error: 'Failed to add members' };
  }
}
