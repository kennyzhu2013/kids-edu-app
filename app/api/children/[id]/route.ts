import { dispatch } from "@/lib/api/dispatch";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const params = await ctx.params;
  return dispatch(request, "PATCH", "/children/:id", params);
}
