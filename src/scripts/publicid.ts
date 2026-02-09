// scripts/backfillPublicId.ts

import { prisma } from "@/lib/prisma";
import cuid  from "cuid";

async function main() {
  const groups = await prisma.group.findMany({
    where: { publicId: null }
  });

  for (const group of groups) {
    await prisma.group.update({
      where: { id: group.id },
      data: { publicId: cuid() }
    });
  }

  console.log("Backfill complete");
}

main();