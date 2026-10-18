import { dispatch } from "@/lib/api/dispatch";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ levelId: string }> },
) {
  const params = await ctx.params;
  return dispatch(request, "POST", "/progress/levels/:levelId/complete", params);
}
