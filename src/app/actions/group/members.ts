// src/app/actions/groups/members.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkActionRateLimit } from "@/lib/rate-limit";
import {
  normalizeUsername,
  validateUsernameFormat,
  validateLeetCodeUsername,
} from "./validation";

export interface AddMemberInput {
  groupId: number;
  leetcodeUsername: string;
}

export async function addMemberToGroup(input: AddMemberInput) {
  const rateLimited = await checkActionRateLimit("addMember");
  if (rateLimited) return rateLimited;

  const session = await auth();
  if (!session?.user?.email)
    return { success: false, error: "Unauthorized." };

  try {
    const username = normalizeUsername(input.leetcodeUsername);
    const fmt = validateUsernameFormat(username);
    if (!fmt.valid) return { success: false, error: fmt.error };

    const validation = await validateLeetCodeUsername(username);
    if (!validation.valid)
      return { success: false, error: validation.error };

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
) {
  const session = await auth();
  if (!session?.user?.email)
    return { success: false, error: "Unauthorized." };

  try {
    await prisma.groupMember.delete({
      where: {
        groupId_leetcodeProfileId: {
          groupId,
          leetcodeProfileId,
        },
      },
    });

    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing member:", error);
    return { success: false, error: "Failed to remove member" };
  }
}

