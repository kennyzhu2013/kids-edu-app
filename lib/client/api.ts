"use client";

import { readToken } from "@/lib/client/store";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) headers.set("Content-Type", "application/json");
  if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${readToken()}`);
  const response = await fetch(path, { ...init, headers });
  const data = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
  if (!response.ok) {
    throw new ApiError(response.status, data.code ?? "ERROR", data.message ?? "请求失败");
  }
  return data as T;
}
