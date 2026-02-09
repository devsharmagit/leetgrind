-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "topGainers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_groupId_idx" ON "LeaderboardSnapshot"("groupId");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_date_idx" ON "LeaderboardSnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardSnapshot_groupId_date_key" ON "LeaderboardSnapshot"("groupId", "date");

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
