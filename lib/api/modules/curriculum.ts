import { z } from "zod";
import { HttpError, jsonOk } from "@/lib/api/http";
import { db } from "@/lib/api/memory";

const subjectIdSchema = z.string().regex(/^[A-Z]{2}$/);
const courseIdSchema = z.string().regex(/^[A-Z]{2}\d{2}$/);
const pointCodeSchema = z.string().regex(/^[A-Z]{2}\d{2}-\d{3}$/);
const levelIdSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

function parseId<T extends z.ZodType>(schema: T, value: string, message: string) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new HttpError(400, "BAD_ID", message);
  return parsed.data as z.infer<T>;
}

export function listCurriculumSubjects() {
  const subjects = [...db().curriculumSubjects].sort((a, b) => a.sort - b.sort);
  return jsonOk({ subjects });
}

export function getCurriculumSubject(id: string) {
  const subjectId = parseId(subjectIdSchema, id, "学科码需要是两个大写字母");
  const subject = db().curriculumSubjects.find((item) => item.id === subjectId);
  if (!subject) throw new HttpError(404, "NOT_FOUND", "找不到这个规划学科");
  const courses = db()
    .curriculumCourses.filter((item) => item.subjectId === subjectId)
    .sort((a, b) => a.sort - b.sort);
  return jsonOk({ subject, courses });
}

export function getCurriculumCourse(id: string) {
  const courseId = parseId(courseIdSchema, id, "专题码形如 MA09");
  const course = db().curriculumCourses.find((item) => item.id === courseId);
  if (!course) throw new HttpError(404, "NOT_FOUND", "找不到这个专题");
  const points = db()
    .knowledgePoints.filter((item) => item.courseId === courseId)
    .sort((a, b) => a.sort - b.sort);
  return jsonOk({ course, points });
}

export function getKnowledgePoint(code: string) {
  const pointCode = parseId(pointCodeSchema, code, "知识点码形如 MA01-001");
  const point = db().knowledgePoints.find((item) => item.code === pointCode);
  if (!point) throw new HttpError(404, "NOT_FOUND", "找不到这个知识点");
  const dependencies = db().knowledgeDependencies.filter((item) => item.fromId === point.id || item.toId === point.id);
  const levelIds = new Set<string>();
  const steps: Array<{ levelId: string; stepId: string }> = [];
  for (const level of Object.values(db().playableLevels)) {
    const onLevel = level.knowledgePointIds.includes(point.code);
    const stepHits = level.steps.filter((step) => step.knowledgePointIds.includes(point.code));
    if (onLevel || stepHits.length > 0) levelIds.add(level.id);
    for (const step of stepHits) steps.push({ levelId: level.id, stepId: step.id });
  }
  const games = Object.values(db().gameConfigs)
    .filter((game) => game.knowledgePointIds.includes(point.code))
    .map((game) => ({ gameId: game.gameId, knowledgeTags: game.knowledgeTags }));
  return jsonOk({
    point,
    dependencies,
    levelIds: [...levelIds].sort(),
    steps,
    games,
  });
}

export function getLevelKnowledge(levelId: string) {
  const id = parseId(levelIdSchema, levelId, "关卡 id 不正确");
  const outline = db().levels.find((item) => item.id === id);
  const level = db().playableLevels[id];
  if (!outline && !level) throw new HttpError(404, "NOT_FOUND", "找不到这一关");
  return jsonOk({
    levelId: id,
    knowledgePointIds: level?.knowledgePointIds ?? [],
    steps: (level?.steps ?? []).map((step) => ({
      id: step.id,
      type: step.type,
      knowledgePointIds: step.knowledgePointIds,
    })),
  });
}
