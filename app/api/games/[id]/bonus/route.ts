import { dispatch } from "@/lib/api/dispatch";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  return dispatch(request, "POST", "/games/:id/bonus", params);
}