"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function createGroup(name: string) {
  const session = await auth();

  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { success: false, error: "Group name must be at least 2 characters." };
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
    });

    revalidatePath("/dashboard");
    return { success: true, group };
  } catch (error) {
    console.error("Error creating group:", error);
    return { success: false, error: "Failed to create group" };
  }
}

export async function deleteGroup(groupId: number) {
  const session = await auth();

  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if the user owns the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return { success: false, error: "Group not found" };
    }

    if (group.ownerId !== user.id) {
      return { success: false, error: "You don't have permission to delete this group" };
    }

    // Delete the group (this will cascade delete GroupMembers due to foreign key)
    await prisma.group.delete({
      where: { id: groupId },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting group:", error);
    return { success: false, error: "Failed to delete group" };
  }
}
