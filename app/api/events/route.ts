import { dispatch } from "@/lib/api/dispatch";

export function GET(request: Request) {
  return dispatch(request, "GET", "/events", {});
}

export function POST(request: Request) {
  return dispatch(request, "POST", "/events", {});
}
