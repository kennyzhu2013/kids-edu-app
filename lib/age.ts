export const AGE_OPTIONS = [
  { code: "A", label: "3–4岁" },
  { code: "B", label: "4–5岁" },
  { code: "C", label: "5–6岁" },
] as const;

export type AgeBand = (typeof AGE_OPTIONS)[number]["code"];

export function ageLabel(code: string) {
  return AGE_OPTIONS.find((item) => item.code === code)?.label ?? "3–6岁";
}
