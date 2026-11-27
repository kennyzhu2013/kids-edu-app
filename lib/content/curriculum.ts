import { z } from "zod";
import { curriculumDocument } from "@/lib/content/curriculum-data";

const ageTargetsSchema = z
  .object({
    A: z.string().optional(),
    B: z.string().optional(),
    C: z.string().optional(),
  })
  .strict();

export const curriculumSchema = z
  .object({
    subjects: z
      .array(
        z.object({
          id: z.string().regex(/^[A-Z]{2}$/),
          name: z.string().min(1),
          sort: z.number().int(),
          status: z.literal("active"),
        }),
      )
      .min(1),
    courses: z
      .array(
        z.object({
          id: z.string().regex(/^[A-Z]{2}\d{2}$/),
          subjectId: z.string().regex(/^[A-Z]{2}$/),
          title: z.string().min(1),
          sort: z.number().int(),
          status: z.literal("active"),
        }),
      )
      .min(1),
    points: z.array(
      z.object({
        id: z.string(),
        code: z.string().regex(/^[A-Z]{2}\d{2}-\d{3}$/),
        courseId: z.string().regex(/^[A-Z]{2}\d{2}$/),
        title: z.string().min(1),
        difficulty: z.number().int().min(1).max(5),
        status: z.literal("active"),
        sort: z.number().int(),
        version: z.number().int().min(1),
        ageTargets: ageTargetsSchema,
      }),
    ),
    dependencies: z.array(
      z.object({
        fromId: z.string(),
        toId: z.string(),
        relation: z.enum(["prerequisite", "related", "extension"]),
      }),
    ),
  })
  .strict();

export type Curriculum = z.infer<typeof curriculumSchema>;
export type CurriculumSubjectRecord = Curriculum["subjects"][number];
export type CurriculumCourseRecord = Curriculum["courses"][number];
export type KnowledgePointRecord = Curriculum["points"][number];
export type KnowledgeDependencyRecord = Curriculum["dependencies"][number];

export function loadCurriculum(): Curriculum {
  const parsed = curriculumSchema.safeParse(curriculumDocument);
  if (!parsed.success) {
    throw new Error(`课程目录校验失败：${JSON.stringify(parsed.error.issues)}`);
  }
  assertCurriculumRules(parsed.data);
  return parsed.data;
}

function assertCurriculumRules(data: Curriculum) {
  const subjectIds = new Set(data.subjects.map((item) => item.id));
  const courseIds = new Set<string>();
  for (const course of data.courses) {
    if (!subjectIds.has(course.subjectId)) throw new Error(`${course.id} 的学科不存在`);
    if (course.id.slice(0, 2) !== course.subjectId) throw new Error(`${course.id} 的学科码不一致`);
    if (courseIds.has(course.id)) throw new Error(`专题重复：${course.id}`);
    courseIds.add(course.id);
    if (course.title.includes("时间与生活")) throw new Error("时间认知和生活数学不能并成一个专题");
  }
  const mathCourses = data.courses.filter((course) => course.subjectId === "MA").map((course) => course.id);
  if (!mathCourses.includes("MA08") || !mathCourses.includes("MA09")) {
    throw new Error("数学专题必须同时有 MA08 和 MA09");
  }
  const ma08 = data.courses.find((course) => course.id === "MA08");
  const ma09 = data.courses.find((course) => course.id === "MA09");
  if (ma08?.title !== "时间认知" || ma09?.title !== "生活数学") {
    throw new Error("MA08 是时间认知，MA09 是生活数学");
  }
  const pointIds = new Set<string>();
  for (const point of data.points) {
    if (point.id !== point.code) throw new Error(`${point.code} 的 id 需要和 code 相同`);
    if (!courseIds.has(point.courseId)) throw new Error(`${point.code} 的专题不存在`);
    if (!point.code.startsWith(`${point.courseId}-`)) throw new Error(`${point.code} 不属于 ${point.courseId}`);
    if (pointIds.has(point.code)) throw new Error(`知识点重复：${point.code}`);
    pointIds.add(point.code);
  }
  const seen = new Set<string>();
  for (const link of data.dependencies) {
    if (link.fromId === link.toId) throw new Error("知识点不能依赖自己");
    if (!pointIds.has(link.fromId) || !pointIds.has(link.toId)) {
      throw new Error(`依赖指向了不存在的知识点：${link.fromId} → ${link.toId}`);
    }
    const key = `${link.fromId}:${link.toId}:${link.relation}`;
    if (seen.has(key)) throw new Error(`依赖重复：${key}`);
    seen.add(key);
  }
  for (const code of ["ZH02-001", "MA03-001"]) {
    const point = data.points.find((item) => item.code === code);
    if (!point) throw new Error(`目录骨架缺少 ${code}`);
    if (!point.ageTargets.A?.includes("不作为目标")) {
      throw new Error(`${code} 的年龄段 A 不能写成必修`);
    }
  }
}
