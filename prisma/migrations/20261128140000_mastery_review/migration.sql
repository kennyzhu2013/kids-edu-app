-- Sprint 3 迁移 C。不改已有迁移。间隔 1/3/7/14 在代码里，不在表里。

-- AlterTable
ALTER TABLE "TodayPlan" ADD COLUMN "tasks" JSONB;

-- CreateTable
CREATE TABLE "KnowledgeMastery" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "knowledgePointId" TEXT NOT NULL,
    "score" INTEGER,
    "status" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewPlan" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "knowledgePointId" TEXT NOT NULL,
    "dueOn" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeMastery_childId_knowledgePointId_key" ON "KnowledgeMastery"("childId", "knowledgePointId");

-- CreateIndex
CREATE INDEX "KnowledgeMastery_childId_idx" ON "KnowledgeMastery"("childId");

-- CreateIndex
CREATE INDEX "ReviewPlan_childId_dueOn_idx" ON "ReviewPlan"("childId", "dueOn");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewPlan_childId_knowledgePointId_dueOn_key" ON "ReviewPlan"("childId", "knowledgePointId", "dueOn");

-- AddForeignKey
ALTER TABLE "KnowledgeMastery" ADD CONSTRAINT "KnowledgeMastery_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewPlan" ADD CONSTRAINT "ReviewPlan_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
