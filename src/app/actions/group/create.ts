// src/app/actions/groups/create.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkActionRateLimit } from "@/lib/rate-limit";
import { ActionResult } from "@/lib/types/action-result";

export async function createGroup(name: string): Promise<ActionResult<any>> {
  const rateLimited = await checkActionRateLimit("createGroup");
  if (rateLimited) return rateLimited;

  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { success: false, error: "Group name must be at least 2 characters." };
  }

  try {
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

    revalidatePath("/dashboard");
    return { success: true, data: group };
  } catch (error) {
    console.error("Error creating group:", error);
    return { success: false, error: "Failed to create group" };
  }
}

export async function deleteGroup(groupId: number): Promise<ActionResult> {
  const rateLimited = await checkActionRateLimit("deleteGroup");
  if (rateLimited) return rateLimited;

  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized." };
  }

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
      return { success: false, error: "You can only delete groups you own." };

    await prisma.groupMember.deleteMany({ where: { groupId } });
    await prisma.group.delete({ where: { id: groupId } });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting group:", error);
    return { success: false, error: "Failed to delete group" };
  }
}
