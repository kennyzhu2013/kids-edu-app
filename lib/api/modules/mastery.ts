import { jsonOk } from "@/lib/api/http";
import { db } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";
import { requireOwnedChild } from "@/lib/api/modules/events";
import { parseDayKey, utcDayKey } from "@/lib/learning/dates";
import { assessmentLabel, parentMasteryLabel, speakReference, type MasteryInputEvent } from "@/lib/learning/mastery";

export function listMastery(request: Request, url: URL) {
  const user = requireUser(request);
  const child = requireOwnedChild(user.id, url.searchParams.get("childId") ?? "");
  const rows = db()
    .knowledgeMastery.filter((row) => row.childId === child.id)
    .sort((a, b) => a.knowledgePointId.localeCompare(b.knowledgePointId))
    .map((row) => {
      const point = db().knowledgePoints.find((item) => item.id === row.knowledgePointId);
      const speak = speakReference(eventsFor(child.id), row.knowledgePointId);
      return {
        knowledgePointId: row.knowledgePointId,
        title: point?.title ?? row.knowledgePointId,
        score: row.score,
        status: row.status,
        label: parentMasteryLabel(row.status),
        assessment: assessmentLabel(row.status),
        speak,
        updatedAt: row.updatedAt,
      };
    });
  return jsonOk({ childId: child.id, mastery: rows });
}

export function listReviews(request: Request, url: URL) {
  const user = requireUser(request);
  const child = requireOwnedChild(user.id, url.searchParams.get("childId") ?? "");
  const requested = url.searchParams.get("day");
  const day = requested ? parseDayKey(requested) : utcDayKey();
  if (requested && !day) return jsonOk({ childId: child.id, day: requested, reviews: [] });
  const reviews = db()
    .reviewPlans.filter((plan) => plan.childId === child.id && (day ? plan.dueOn === day || (plan.status === "pending" && plan.dueOn <= day) : true))
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.knowledgePointId.localeCompare(b.knowledgePointId));
  return jsonOk({ childId: child.id, day, reviews });
}

function eventsFor(childId: string): MasteryInputEvent[] {
  return db()
    .learningEvents.filter((event) => event.childId === childId)
    .map((event) => {
      const level = event.levelId ? db().playableLevels[event.levelId] : undefined;
      const step = level?.steps.find((item) => item.id === event.stepId);
      return { ...event, stepType: step?.type ?? null };
    });
}
