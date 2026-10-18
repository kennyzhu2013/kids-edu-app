import { dispatch } from "@/lib/api/dispatch";

export function POST(request: Request) {
  return dispatch(request, "POST", "/auth/sms/login", {});
}
