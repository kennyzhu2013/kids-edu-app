"use client";

import { ApiError, api } from "@/lib/client/api";
import { readChild, saveChild, type LocalChild } from "@/lib/client/store";

type RemoteChild = {
  id: string;
  nickname: string;
  ageBand: LocalChild["ageBand"];
};

function toLocal(child: RemoteChild): LocalChild {
  return { id: child.id, nickname: child.nickname, ageBand: child.ageBand };
}

/**
 * 让本机选中的孩子和内存会话里的当前孩子一致。
 * 登录后、打开「我的」时各对一次。服务重启后旧 id 会 404，那时改用服务端当前孩子。
 */
export async function alignChildSession() {
  const me = await api<{ currentChild: RemoteChild | null }>("/api/me");
  const local = readChild();
  if (local) {
    if (me.currentChild?.id === local.id) return local;
    try {
      await api(`/api/children/${local.id}/switch`, { method: "POST" });
      return local;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && me.currentChild) {
        const next = toLocal(me.currentChild);
        saveChild(next);
        return next;
      }
      throw error;
    }
  }
  if (!me.currentChild) return null;
  const next = toLocal(me.currentChild);
  saveChild(next);
  return next;
}
