import type { MasteryStatus } from "@/lib/learning/mastery";
import type { ReviewStatus } from "@/lib/learning/review";

export type KnowledgeMasteryRecord = {
  id: string;
  childId: string;
  knowledgePointId: string;
  score: number | null;
  status: MasteryStatus;
  updatedAt: string;
};

export type ReviewPlanRecord = {
  id: string;
  childId: string;
  knowledgePointId: string;
  dueOn: string;
  status: ReviewStatus;
  updatedAt: string;
};
