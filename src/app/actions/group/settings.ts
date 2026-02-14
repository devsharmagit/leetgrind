// src/app/actions/groups/settings.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkActionRateLimit } from "@/lib/rate-limit";

export async function updateGroupSettings(
  groupId: number,
  settings: { name?: string; visibility?: "UNLISTED" | "PRIVATE" }
) {
  const rateLimited = await checkActionRateLimit("updateGroup");
  if (rateLimited) return rateLimited;

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
      return { success: false, error: "Unauthorized" };

    const updateData: any = {};

    if (settings.name !== undefined) {
      const trimmed = settings.name.trim();
      if (trimmed.length < 2)
        return { success: false, error: "Name too short" };
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
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating group settings:", error);
    return { success: false, error: "Failed to update group settings" };
  }
}

