/* ==================== Imports ==================== */
import { apiRequest } from "@/lib/apiClient";
import { authHeader } from "@/lib/authHeader";

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

/* ==================== API: Storage ==================== */

/** 보관함 생성 */
export const createStorage = async (
  data: CreateStorageRequest
): Promise<CreateStorageResponse> => {
  const headers = authHeader();
  const created = await apiRequest<BackendCreateStorageResponse>(
    "POST",
    "/api/storage",
    {
      headers,
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
    `/api/query/storage/group/${groupNo}`,
    { params: { cb: Date.now().toString() } }
  );
  return res.map((item) => ({ storageNo: item.storageNo, name: item.name }));
};

/** 내 개인 보관함 목록 조회 */
export const getUserStorageList = async (
  userNo: number
): Promise<UserStorageItem[]> => {
  const res = await apiRequest<BackendUserStorageListItem[]>(
    "GET",
    `/api/query/storage/${userNo}`,
    { params: { cb: Date.now().toString() } }
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
    `/api/query/storage/${storageNo}`,
    { params: { cb: Date.now().toString() } }
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
  const headers = authHeader();
  return await apiRequest<{ storageNo: number; name: string }>(
    "PUT",
    `/api/storage/${storageNo}`,
    {
      headers,
      data: { name }, // JSON 객체로 전송
    }
  );
};

/** 보관함 삭제 */
export const deleteStorage = async (
  storageNo: number
): Promise<{ message: string }> => {
  const headers = authHeader();
  return await apiRequest<{ message: string }>(
    "DELETE",
    `/api/storage/${storageNo}`,
    { headers }
  );
};
