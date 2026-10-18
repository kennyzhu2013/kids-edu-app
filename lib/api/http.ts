export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonOk(data: Record<string, unknown>, status = 200) {
  return Response.json({ stub: true, ...data }, { status });
}

export function jsonError(error: HttpError) {
  return Response.json(
    {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
    { status: error.status },
  );
}

export async function readJson(request: Request) {
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    const data: unknown = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new HttpError(400, "BAD_JSON", "请求体需要是 JSON 对象");
    }
    return data as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "BAD_JSON", "JSON 无法解析");
  }
}

export function bearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

export function pageOf<T>(items: T[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20) || 20));
  const start = (page - 1) * pageSize;
  return {
    page,
    pageSize,
    total: items.length,
    items: items.slice(start, start + pageSize),
  };
}

export function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value);
}
