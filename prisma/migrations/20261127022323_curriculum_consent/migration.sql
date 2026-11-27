-- AlterTable
ALTER TABLE "User" ADD COLUMN     "guardianConsentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CurriculumSubject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "CurriculumSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumCourse" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "CurriculumCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePoint" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sort" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "ageTargets" JSONB NOT NULL,

    CONSTRAINT "KnowledgePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDependency" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,

    CONSTRAINT "KnowledgeDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelKnowledgePoint" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "knowledgePointId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "LevelKnowledgePoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CurriculumCourse_subjectId_idx" ON "CurriculumCourse"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePoint_code_key" ON "KnowledgePoint"("code");

-- CreateIndex
CREATE INDEX "KnowledgePoint_courseId_idx" ON "KnowledgePoint"("courseId");

-- CreateIndex
CREATE INDEX "KnowledgeDependency_toId_idx" ON "KnowledgeDependency"("toId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeDependency_fromId_toId_relation_key" ON "KnowledgeDependency"("fromId", "toId", "relation");

-- CreateIndex
CREATE INDEX "LevelKnowledgePoint_knowledgePointId_idx" ON "LevelKnowledgePoint"("knowledgePointId");

-- CreateIndex
CREATE UNIQUE INDEX "LevelKnowledgePoint_levelId_knowledgePointId_stepId_key" ON "LevelKnowledgePoint"("levelId", "knowledgePointId", "stepId");

-- AddForeignKey
ALTER TABLE "CurriculumCourse" ADD CONSTRAINT "CurriculumCourse_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "CurriculumSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePoint" ADD CONSTRAINT "KnowledgePoint_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CurriculumCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDependency" ADD CONSTRAINT "KnowledgeDependency_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "KnowledgePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDependency" ADD CONSTRAINT "KnowledgeDependency_toId_fkey" FOREIGN KEY ("toId") REFERENCES "KnowledgePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelKnowledgePoint" ADD CONSTRAINT "LevelKnowledgePoint_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelKnowledgePoint" ADD CONSTRAINT "LevelKnowledgePoint_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "KnowledgePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
