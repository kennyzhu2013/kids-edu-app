import { dispatch } from "@/lib/api/dispatch";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  return dispatch(request, "GET", "/curriculum/subjects/:id", params);
}
