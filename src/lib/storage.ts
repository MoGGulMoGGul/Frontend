/* ==================== Imports ==================== */
import { apiRequest } from "@/lib/apiClient";
import { authHeader } from "@/lib/authHeader";

/* ==================== 상수/설정 ==================== */
const isMock = process.env.NEXT_PUBLIC_API_MOCK === "true";

/* ==================== 타입 ==================== */
// 공개 타입
export type CreateStorageRequest = { name: string; groupNo?: number | null };
export type CreateStorageResponse = { message: string; storageNo: number };
export type GroupStorageItem = { storageNo: number; name: string };
export type UserStorageItem = { storageNo: number; name: string };
export type StorageDetail = {
  storageNo: number;
  name: string;
  groupNo?: number | null;
};

/** --- 응답 타입들 --- */
type BackendCreateStorageResponse = { message: string; storageNo: number };
type JsonServerCreateStorageResponse = {
  id: number;
  name: string;
  groupNo?: number | null;
};

type BackendGroupStorageListItem = { storageNo: number; name: string };
type JsonServerGroupStorageListItem = {
  id: number;
  name: string;
  groupNo: number;
};

type BackendUserStorageListItem = { storageNo: number; name: string };
type JsonServerUserStorageListItem = { id: number; name: string };

type BackendStorageDetail = {
  storageNo: number;
  name: string;
  groupNo?: number | null;
};
type JsonServerStorageDetail = {
  id: number;
  name: string;
  groupNo?: number | null;
};

export type StorageTipRow = {
  no: number;
  title: string;
  contentSummary: string;
  url: string;
  userNo: number;
  nickname: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

// TipSearchItem 형태로 리턴( no -> id 매핑 )
export type TipSearchItem = {
  id: number;
  title: string;
  contentSummary: string;
  url: string;
  nickname: string;
  createdAt: string;
};

/* ==================== API: Storage ==================== */
/* ----- Create ----- */
export const createStorage = async (
  data: CreateStorageRequest
): Promise<CreateStorageResponse> => {
  const headers = (() => {
    try {
      return isMock ? {} : authHeader();
    } catch {
      return {};
    }
  })();

  const created = await apiRequest<
    BackendCreateStorageResponse | JsonServerCreateStorageResponse
  >("POST", isMock ? "/storage" : "/api/storage", {
    headers,
    data: { name: data.name, groupNo: data.groupNo ?? null },
  });

  if ("storageNo" in created) {
    return { message: created.message, storageNo: created.storageNo };
  }
  return { message: "보관함 생성 완료!!", storageNo: created.id };
};

/* ----- Read ----- */
/** 그룹 보관함 목록 */
export const getStoragesByGroup = async (
  groupNo: number
): Promise<GroupStorageItem[]> => {
  const res = await apiRequest<
    Array<BackendGroupStorageListItem | JsonServerGroupStorageListItem>
  >("GET", `/api/query/storage/group/${groupNo}`, {
    headers: { ...(isMock ? {} : authHeader()), "Cache-Control": "no-cache" },
  });

  return res.map((item) =>
    "storageNo" in item
      ? { storageNo: item.storageNo, name: item.name }
      : { storageNo: item.id, name: item.name }
  );
};

// 내 보관함(개인) 목록 (/api/query/storage/{userNo} 추후 변경)
export const getUserStorageList = async (
  userNo: number
): Promise<UserStorageItem[]> => {
  if (isMock) {
    type Row = { id: number; name: string; groupNo?: number | null };
    const res = await apiRequest<Row[]>("GET", "/storage", {
      headers: { "Cache-Control": "no-cache" },
      params: { cb: Date.now().toString() },
    });
    return res
      .filter((r) => r.groupNo == null)
      .map((r) => ({ storageNo: r.id, name: r.name }));
  }

  // /api/query/storage/{userNo}
  const res = await apiRequest<
    Array<BackendUserStorageListItem | JsonServerUserStorageListItem>
  >("GET", `/api/query/storage/${userNo}`, {
    headers: { ...authHeader(), "Cache-Control": "no-cache" },
    params: { cb: Date.now().toString() },
  });

  return res.map((item) =>
    "storageNo" in item
      ? { storageNo: item.storageNo, name: item.name }
      : { storageNo: item.id, name: item.name }
  );
};

/** 상세 조회 */
export const getStorageDetail = async (
  storageNo: number
): Promise<StorageDetail> => {
  const res = await apiRequest<BackendStorageDetail | JsonServerStorageDetail>(
    "GET",
    `/api/storage/${storageNo}`,
    { headers: isMock ? {} : authHeader() }
  );

  if ("storageNo" in res) return res;
  return { storageNo: res.id, name: res.name, groupNo: res.groupNo ?? null };
};

// 보관함 꿀팁 목록 조회 (/api/query/storage/detail/{storageNo})
export const getStorageTips = async (
  storageNo: number
): Promise<TipSearchItem[]> => {
  const rows = await apiRequest<StorageTipRow[]>(
    "GET",
    `/api/query/storage/${storageNo}`,
    {
      headers: isMock ? {} : authHeader(),
      params: { cb: Date.now().toString() },
    }
  );

  return rows.map((r) => ({
    id: r.no,
    title: r.title,
    contentSummary: r.contentSummary,
    url: r.url,
    nickname: r.nickname,
    createdAt: r.createdAt,
  }));
};

/* ----- Update ----- */
/** 이름 수정 */
export const updateStorageName = async (
  storageNo: number,
  name: string
): Promise<{ storageNo: number; name: string }> => {
  return await apiRequest<{ storageNo: number; name: string }>(
    "PUT",
    `/api/storage/${storageNo}`,
    { headers: isMock ? {} : authHeader(), data: { name } }
  );
};

/* ----- Delete ----- */
/** 삭제 */
export const deleteStorage = async (
  storageNo: number
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    "DELETE",
    `/api/storage/${storageNo}`,
    {
      headers: isMock ? {} : authHeader(),
    }
  );
};
