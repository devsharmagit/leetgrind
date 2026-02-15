// src/app/actions/groups/members.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkActionRateLimit } from "@/lib/rate-limit";
import { normalizeUsername, validateUsernameFormat, validateLeetCodeUsername } from "./validation";
import { ActionResult } from "@/lib/types/action-result";

export interface AddMemberInput {
  groupId: number;
  leetcodeUsername: string;
}

export async function addMemberToGroup(input: AddMemberInput): Promise<ActionResult> {
  const rateLimited = await checkActionRateLimit("addMember");
  if (rateLimited) return rateLimited;

  const session = await auth();
  if (!session?.user?.email)
    return { success: false, error: "Unauthorized." };

  try {
    const username = normalizeUsername(input.leetcodeUsername);
    const fmt = validateUsernameFormat(username);
    if (!fmt.valid) return { success: false, error: fmt.error || 'Invalid format' };

    const validation = await validateLeetCodeUsername(username);
    if (!validation.valid)
      return { success: false, error: validation.error || 'Validation failed' };

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return { success: false, error: "User not found" };

    const group = await prisma.group.findUnique({
      where: { id: input.groupId },
    });
    if (!group) return { success: false, error: "Group not found" };
    if (group.ownerId !== user.id)
      return { success: false, error: "Unauthorized" };

    let profile = await prisma.leetcodeProfile.findUnique({
      where: { username },
    });

    if (!profile) {
      profile = await prisma.leetcodeProfile.create({
        data: { username },
      });
    }

    await prisma.groupMember.create({
      data: {
        groupId: input.groupId,
        leetcodeProfileId: profile.id,
      },
    });

    revalidatePath(`/dashboard/groups/${input.groupId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding member:", error);
    return { success: false, error: "Failed to add member" };
  }
}

export async function removeMemberFromGroup(
  groupId: number,
  leetcodeProfileId: number
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email)
    return { success: false, error: "Unauthorized." };

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return { success: false, error: "User not found" };

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) return { success: false, error: "Group not found" };
    if (group.ownerId !== user.id)
      return { success: false, error: "You can only remove members from groups you own." };

    await prisma.groupMember.delete({
      where: {
        groupId_leetcodeProfileId: {
          groupId,
          leetcodeProfileId,
        },
      },
    });

    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error("Error removing member:", error);
    return { success: false, error: "Failed to remove member" };
  }
}

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

export async function addMembersToGroup(groupId: number, usernames: string[]): Promise<ActionResult<any>> {
  const rateLimited = await checkActionRateLimit('addMembers');
  if (rateLimited) return rateLimited;

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

