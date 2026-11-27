import { dispatch } from "@/lib/api/dispatch";

export async function GET(request: Request, ctx: { params: Promise<{ code: string }> }) {
  const params = await ctx.params;
  return dispatch(request, "GET", "/curriculum/points/:code", params);
}
