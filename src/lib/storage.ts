/* ==================== Imports ==================== */
import { apiRequest } from "@/lib/apiClient";

/* ==================== 타입 ==================== */
export type CreateStorageRequest = { name: string; groupNo?: number | null };
export type CreateStorageResponse = { message: string; storageNo: number };
export type GroupStorageItem = { storageNo: number; name: string };
export type UserStorageItem = { storageNo: number; name: string };
export type StorageDetail = {
  storageNo: number;
  name: string;
  groupNo?: number | null;
};

type BackendCreateStorageResponse = { message: string; storageNo: number };
type BackendGroupStorageListItem = {
  storageNo: number;
  name: string;
  userNo: number;
};
type BackendUserStorageListItem = { storageNo: number; name: string };
type BackendStorageDetail = {
  storageNo: number;
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

export type TipSearchItem = {
  id: number;
  title: string;
  contentSummary: string;
  url: string;
  nickname: string;
  createdAt: string;
};

export type AllGroupStorageItem = {
  storageNo: number;
  name: string;
  userNo: number;
};
/* ==================== API: Storage ==================== */

/** 보관함 생성 */
export const createStorage = async (
  data: CreateStorageRequest
): Promise<CreateStorageResponse> => {
  const created = await apiRequest<BackendCreateStorageResponse>(
    "POST",
    "/api/storage",
    {
      data: { name: data.name, groupNo: data.groupNo ?? null },
    }
  );
  return { message: created.message, storageNo: created.storageNo };
};

/** 그룹 보관함 목록 조회 */
export const getStoragesByGroup = async (
  groupNo: number
): Promise<GroupStorageItem[]> => {
  const res = await apiRequest<BackendGroupStorageListItem[]>(
    "GET",
    `/api/query/storage/group/${groupNo}`
  );
  return res.map((item) => ({ storageNo: item.storageNo, name: item.name }));
};

/** 내 개인 보관함 목록 조회 */
export const getUserStorageList = async (
  userNo: number
): Promise<UserStorageItem[]> => {
  const res = await apiRequest<BackendUserStorageListItem[]>(
    "GET",
    `/api/query/storage/${userNo}`
  );
  return res.map((item) => ({ storageNo: item.storageNo, name: item.name }));
};

/** 보관함 상세 조회 */
export const getStorageDetail = async (
  storageNo: number
): Promise<StorageDetail> => {
  const res = await apiRequest<BackendStorageDetail>(
    "GET",
    `/api/storage/${storageNo}`
  );
  return res;
};

/** 보관함 내 꿀팁 목록 조회 */
export const getStorageTips = async (
  storageNo: number
): Promise<TipSearchItem[]> => {
  const rows = await apiRequest<StorageTipRow[]>(
    "GET",
    `/api/query/tips/storage/${storageNo}`
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

/** 보관함 이름 수정 */
export const updateStorageName = async (
  storageNo: number,
  name: string
): Promise<{ storageNo: number; name: string }> => {
  return await apiRequest<{ storageNo: number; name: string }>(
    "PUT",
    `/api/storage/${storageNo}`,
    {
      data: { name },
    }
  );
};

/** 보관함 삭제 */
export const deleteStorage = async (
  storageNo: number
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>("DELETE", `/api/storage/${storageNo}`);
};

/** 전체 그룹 보관함 조회 */
export const getAllGroupStorages = async (): Promise<AllGroupStorageItem[]> => {
  return apiRequest<AllGroupStorageItem[]>(
    "GET",
    "/api/query/storage/group-all"
  );
};
