import { dispatch } from "@/lib/api/dispatch";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const params = await ctx.params;
  return dispatch(request, "PATCH", "/admin/packs/:id", params);
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const params = await ctx.params;
  return dispatch(request, "DELETE", "/admin/packs/:id", params);
}
