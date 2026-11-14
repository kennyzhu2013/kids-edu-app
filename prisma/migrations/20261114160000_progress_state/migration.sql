-- CreateTable
CREATE TABLE "TodayPlan" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "ageBand" TEXT NOT NULL,
    "levelIds" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TodayPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameQuota" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TodayPlan_childId_idx" ON "TodayPlan"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "TodayPlan_childId_day_key" ON "TodayPlan"("childId", "day");

-- CreateIndex
CREATE INDEX "GameQuota_childId_day_idx" ON "GameQuota"("childId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "GameQuota_childId_gameId_day_key" ON "GameQuota"("childId", "gameId", "day");

-- AddForeignKey
ALTER TABLE "TodayPlan" ADD CONSTRAINT "TodayPlan_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameQuota" ADD CONSTRAINT "GameQuota_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
