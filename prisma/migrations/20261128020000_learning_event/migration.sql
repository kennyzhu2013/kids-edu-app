-- Sprint 2 迁移 B。不改已有迁移。sessionId 只是字符串，不建 LearningSession。

-- CreateTable
CREATE TABLE "LearningEvent" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "knowledgePointId" TEXT,
    "levelId" TEXT,
    "gameId" TEXT,
    "stepId" TEXT,
    "correct" BOOLEAN,
    "durationMs" INTEGER NOT NULL,
    "errorCause" TEXT,
    "source" TEXT NOT NULL,
    "clientEventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameQuotaCharge" (
    "id" TEXT NOT NULL,
    "clientEventId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameQuotaCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningEvent_clientEventId_key" ON "LearningEvent"("clientEventId");

-- CreateIndex
CREATE INDEX "LearningEvent_childId_createdAt_idx" ON "LearningEvent"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "LearningEvent_childId_type_idx" ON "LearningEvent"("childId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "GameQuotaCharge_clientEventId_key" ON "GameQuotaCharge"("clientEventId");

-- CreateIndex
CREATE INDEX "GameQuotaCharge_childId_day_idx" ON "GameQuotaCharge"("childId", "day");

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameQuotaCharge" ADD CONSTRAINT "GameQuotaCharge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
