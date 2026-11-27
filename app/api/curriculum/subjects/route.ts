import { dispatch } from "@/lib/api/dispatch";

export function GET(request: Request) {
  return dispatch(request, "GET", "/curriculum/subjects", {});
}
