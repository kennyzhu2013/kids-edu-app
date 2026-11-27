import { dispatch } from "@/lib/api/dispatch";

export async function GET(request: Request, ctx: { params: Promise<{ levelId: string }> }) {
  const params = await ctx.params;
  return dispatch(request, "GET", "/curriculum/levels/:levelId", params);
}
