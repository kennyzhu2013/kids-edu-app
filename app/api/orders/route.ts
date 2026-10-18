import { dispatch } from "@/lib/api/dispatch";

export function GET(request: Request) {
  return dispatch(request, "GET", "/orders", {});
}

export function POST(request: Request) {
  return dispatch(request, "POST", "/orders", {});
}
