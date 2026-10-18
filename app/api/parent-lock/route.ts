import { dispatch } from "@/lib/api/dispatch";

export function PATCH(request: Request) {
  return dispatch(request, "PATCH", "/parent-lock", {});
}
