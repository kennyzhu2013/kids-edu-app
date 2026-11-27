import { z } from "zod";
import { HttpError, jsonOk } from "@/lib/api/http";
import { db } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";
import { persistGuardianConsent } from "@/lib/api/persist";

const consentBodySchema = z.object({ accepted: z.literal(true) }).strict();

export async function acceptGuardianConsent(request: Request, body: Record<string, unknown>) {
  requireUser(request);
  const parsed = consentBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "CONSENT_REQUIRED", "需要监护人确认同意");
  }
  const user = db().user;
  if (!user.guardianConsentAt) {
    user.guardianConsentAt = new Date().toISOString();
    await persistGuardianConsent(user.guardianConsentAt);
  }
  return jsonOk({ guardianConsentAt: user.guardianConsentAt });
}
