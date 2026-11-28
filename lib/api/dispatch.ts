import { HttpError, jsonError, readJson } from "@/lib/api/http";
import { adminCreate, adminList, adminRemove, adminUpdate } from "@/lib/api/modules/admin";
import { getMe, loginSms, loginWechat, sendSms } from "@/lib/api/modules/auth";
import { createChild, listChildren, switchChild, updateChild } from "@/lib/api/modules/children";
import { getGame, getLevel, getPack, listGames, listPacks, listSubjects } from "@/lib/api/modules/content";
import {
  getCurriculumCourse,
  getCurriculumSubject,
  getKnowledgePoint,
  getLevelKnowledge,
  listCurriculumSubjects,
} from "@/lib/api/modules/curriculum";
import { confirmOrder, createOrder, listOrders } from "@/lib/api/modules/orders";
import { updateParentLock, verifyParentLock } from "@/lib/api/modules/parent-lock";
import { acceptGuardianConsent } from "@/lib/api/modules/privacy";
import { listEvents, postEvents } from "@/lib/api/modules/events";
import { listMastery, listReviews } from "@/lib/api/modules/mastery";
import { changeQuota, listQuota } from "@/lib/api/modules/quota";
import { completeLevel, getToday, progressSummary } from "@/lib/api/modules/progress";
import { listEntitlements, unlockWithAd } from "@/lib/api/modules/unlock";
import { ensureReady } from "@/lib/api/persist";
import { assertProductionDatabase, ProductionConfigError } from "@/lib/api/secrets";

export async function dispatch(
  request: Request,
  method: string,
  path: string,
  params: Record<string, string>,
) {
  try {
    assertProductionDatabase();
    await ensureReady();
    const url = new URL(request.url);
    const key = `${method} ${path}`;
    const body = method === "GET" || method === "DELETE" ? {} : await readJson(request);
    switch (key) {
      case "POST /auth/sms/send":
        return sendSms(body);
      case "POST /auth/sms/login":
        return await loginSms(body);
      case "POST /auth/wechat":
        return loginWechat(body);
      case "GET /me":
        return getMe(request);
      case "GET /children":
        return listChildren(request);
      case "POST /children":
        return await createChild(request, body);
      case "PATCH /children/:id":
        return await updateChild(request, params.id, body);
      case "POST /children/:id/switch":
        return await switchChild(request, params.id);
      case "GET /today":
        return await getToday(request, url);
      case "POST /progress/levels/:levelId/complete":
        return await completeLevel(request, params.levelId, body);
      case "GET /progress/summary":
        return progressSummary(request, url);
      case "GET /subjects":
        return listSubjects();
      case "GET /curriculum/subjects":
        return listCurriculumSubjects();
      case "GET /curriculum/subjects/:id":
        return getCurriculumSubject(params.id);
      case "GET /curriculum/courses/:id":
        return getCurriculumCourse(params.id);
      case "GET /curriculum/points/:code":
        return getKnowledgePoint(params.code);
      case "GET /curriculum/levels/:levelId":
        return getLevelKnowledge(params.levelId);
      case "PATCH /guardian-consent":
        return await acceptGuardianConsent(request, body);
      case "GET /packs":
        return listPacks(url);
      case "GET /packs/:id":
        return getPack(params.id, url);
      case "GET /levels/:id":
        return getLevel(params.id);
      case "GET /games":
        return listGames(url);
      case "POST /events":
        return await postEvents(request, body);
      case "GET /events":
        return listEvents(request, url);
      case "GET /mastery":
        return listMastery(request, url);
      case "GET /reviews":
        return listReviews(request, url);
      case "GET /games/quota":
        return listQuota(request, url);
      case "POST /games/:id/consume":
        return await changeQuota(request, params.id, body, "used");
      case "POST /games/:id/bonus":
        return await changeQuota(request, params.id, body, "bonus");
      case "GET /games/:id":
        return getGame(params.id);
      case "POST /unlock/ad":
        return unlockWithAd(request, body);
      case "GET /entitlements":
        return listEntitlements(request);
      case "POST /orders":
        return createOrder(request, body);
      case "GET /orders":
        return listOrders(request, url);
      case "POST /orders/:id/confirm":
        return confirmOrder(request, params.id, body);
      case "POST /parent-lock/verify":
        return await verifyParentLock(request, body);
      case "PATCH /parent-lock":
        return await updateParentLock(request, body);
      case "GET /admin/packs":
        return adminList(request, "packs", url);
      case "POST /admin/packs":
        return adminCreate(request, "packs", body);
      case "PATCH /admin/packs/:id":
        return adminUpdate(request, "packs", params.id, body);
      case "DELETE /admin/packs/:id":
        return adminRemove(request, "packs", params.id, url);
      case "GET /admin/levels":
        return adminList(request, "levels", url);
      case "POST /admin/levels":
        return adminCreate(request, "levels", body);
      case "PATCH /admin/levels/:id":
        return adminUpdate(request, "levels", params.id, body);
      case "DELETE /admin/levels/:id":
        return adminRemove(request, "levels", params.id, url);
      case "GET /admin/games":
        return adminList(request, "games", url);
      case "POST /admin/games":
        return adminCreate(request, "games", body);
      case "PATCH /admin/games/:id":
        return adminUpdate(request, "games", params.id, body);
      case "DELETE /admin/games/:id":
        return adminRemove(request, "games", params.id, url);
      case "GET /admin/assets":
        return adminList(request, "assets", url);
      case "POST /admin/assets":
        return adminCreate(request, "assets", body);
      case "PATCH /admin/assets/:id":
        return adminUpdate(request, "assets", params.id, body);
      case "DELETE /admin/assets/:id":
        return adminRemove(request, "assets", params.id, url);
      default:
        throw new HttpError(404, "NOT_FOUND", "没有这个接口");
    }
  } catch (error) {
    if (error instanceof ProductionConfigError) {
      return jsonError(new HttpError(503, "DATABASE_REQUIRED", error.message));
    }
    if (error instanceof HttpError) return jsonError(error);
    console.error(error);
    return jsonError(new HttpError(500, "INTERNAL", "服务暂时不可用"));
  }
}
