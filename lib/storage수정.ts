// lib/storage.ts
import { apiRequest } from "@/lib/apiClient";
import { authHeader } from "@/lib/authHeader";

/* =========================
   공통 타입 & 유틸 (any 금지)
   ========================= */

// 공통 에러 응답
export type ErrorResponse = {
  status: number;
  message: string;
  error: string;
};

type MaybeErrorShape = {
  status?: number;
  message?: string;
  error?: string;
  response?: { status?: number; data?: { message?: string; error?: string } };
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const toErrorResponse = (e: unknown): ErrorResponse => {
  // axios 계열 에러(response.data 포함) 우선 처리
  if (isObject(e)) {
    const m = e as MaybeErrorShape;

    const respStatus = m.response?.status;
    const respMsg = m.response?.data?.message;
    const respErr = m.response?.data?.error;

    if (
      respStatus !== undefined ||
      respMsg !== undefined ||
      respErr !== undefined
    ) {
      return {
        status: respStatus ?? 500,
        message: respMsg ?? "Unknown error",
        error: respErr ?? "RequestFailed",
      };
    }

    // 평범한 shape(status/message/error)
    if (
      m.status !== undefined ||
      m.message !== undefined ||
      m.error !== undefined
    ) {
      return {
        status: m.status ?? 500,
        message: m.message ?? "Unknown error",
        error: m.error ?? "RequestFailed",
      };
    }
  }

  // 기타 예외(문자열/표준 Error 등)
  return {
    status: 500,
    message: e instanceof Error ? e.message : "Unknown error",
    error: "RequestFailed",
  };
};

/* =========================
   명세 기반 타입 선언
   ========================= */

/** 1) 보관함 생성: POST /api/storage */
export type CreateStorageRequest = { name: string; groupNo?: number | null };
export type CreateStorageSuccess = { message: string; storageNo: number };

/** 2) 보관함 수정: PUT /api/storage/{storageNo} */
export type UpdateStorageNameRequest = { name: string };
export type UpdateStorageNameSuccess = { storageNo: number; name: string };

/** 3) 보관함 삭제: DELETE /api/storage/{storageNo} */
export type DeleteStorageSuccess = { message: string };

/** 4) 보관함 꿀팁 목록: GET /api/query/storage/{storageNo} */
export type StorageTipRow = {
  no: number;
  title: string;
  contentSummary: string;
  url: string;
  userNo: number;
  nickname: string;
  thumbnailUrl?: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

/** 5) 보관함 '목록' 조회(개인): GET /api/query/storage/{userNo} */
export type UserStorageListItem = {
  storageNo: number;
  name: string;
  userNo: number;
};

/** 6) 보관함 '목록' 조회(그룹): GET /api/query/storage/group/{groupId} */
export type GroupStorageListItem = {
  storageNo: number;
  name: string;
  userNo: number;
};

/** (선택) 상세 조회 */
export type StorageDetail = {
  storageNo: number;
  name: string;
  groupNo?: number | null;
};

/* =========================
   API 함수
   ========================= */

// 보관함 생성
export async function createStorage(
  body: CreateStorageRequest
): Promise<CreateStorageSuccess | ErrorResponse> {
  try {
    return await apiRequest<CreateStorageSuccess>("POST", "/api/storage", {
      headers: authHeader(),
      data: { name: body.name, groupNo: body.groupNo ?? null },
    });
  } catch (e: unknown) {
    return toErrorResponse(e);
  }
}

// 2) 보관함 이름 수정
export async function updateStorageName(
  storageNo: number,
  name: string
): Promise<UpdateStorageNameSuccess | ErrorResponse> {
  try {
    return await apiRequest<UpdateStorageNameSuccess>(
      "PUT",
      `/api/storage/${storageNo}`,
      { headers: authHeader(), data: { name } }
    );
  } catch (e: unknown) {
    return toErrorResponse(e);
  }
}

// 보관함 삭제
export async function deleteStorage(
  storageNo: number
): Promise<DeleteStorageSuccess | ErrorResponse> {
  try {
    return await apiRequest<DeleteStorageSuccess>(
      "DELETE",
      `/api/storage/${storageNo}`,
      { headers: authHeader() }
    );
  } catch (e: unknown) {
    return toErrorResponse(e);
  }
}

// 특정 보관함의 꿀팁 목록
export async function getStorageTips(
  storageNo: number
): Promise<StorageTipRow[] | ErrorResponse> {
  try {
    return await apiRequest<StorageTipRow[]>(
      "GET",
      `/api/query/storage/${storageNo}`,
      { headers: authHeader() }
    );
  } catch (e: unknown) {
    return toErrorResponse(e);
  }
}

// 내 보관함 목록
export async function getUserStorageList(
  userNo: number
): Promise<UserStorageListItem[] | ErrorResponse> {
  try {
    return await apiRequest<UserStorageListItem[]>(
      "GET",
      `/api/query/storage/${userNo}`,
      { headers: authHeader() }
    );
  } catch (e: unknown) {
    return toErrorResponse(e);
  }
}

// 그룹 보관함 목록
export async function getStoragesByGroup(
  groupId: number
): Promise<GroupStorageListItem[] | ErrorResponse> {
  try {
    return await apiRequest<GroupStorageListItem[]>(
      "GET",
      `/api/query/storage/group/${groupId}`,
      { headers: authHeader() }
    );
  } catch (e: unknown) {
    return toErrorResponse(e);
  }
}
