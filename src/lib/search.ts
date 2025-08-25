/* ==================== Imports ==================== */
import { apiRequest } from "@/lib/apiClient";
import { authHeader } from "@/lib/authHeader";

/* ==================== 타입 ==================== */
// 공개 타입
export type SearchMode = "AND" | "OR";

export interface TipSearchRequest {
  keyword: string;
  mode: SearchMode;
  page?: number;
  size?: number;
}

export interface TipSearchItem {
  id: number;
  title: string;
  contentSummary: string;
  url: string;
  nickname: string;
  createdAt: string;
  thumbnailUrl?: string | null;
  tags?: string[];
  userNo?: number;
}

export type UserSearchItem = {
  userNo: number;
  nickname: string;
  profileImageUrl: string | null;
  isFollowing: boolean | null;
};

/* ==================== 유틸 ==================== */
// 검색 파라미터 기본값/정규화
const normalize = (req: TipSearchRequest): Required<TipSearchRequest> => ({
  keyword: (req.keyword ?? "").trim() || " ",
  mode: req.mode,
  page: req.page ?? 0,
  size: req.size ?? 20,
});

// 공통 검색 호출기
const searchTips = (
  endpoint: string,
  query: TipSearchRequest,
  needsAuth: boolean
) =>
  apiRequest<TipSearchItem[]>("GET", endpoint, {
    params: normalize(query),
    headers: needsAuth ? authHeader() : {},
  });

/* ==================== API: Search ==================== */
/* ----- Users ----- */
export async function searchUsersById(
  idPart: string
): Promise<UserSearchItem[]> {
  return apiRequest<UserSearchItem[]>("GET", "/api/users/search", {
    params: { id: idPart },
    headers: authHeader(),
  });
}

/* ----- Tips (scoped) ----- */
export const searchPublicTips = (req: TipSearchRequest) =>
  searchTips("/api/search/tips/public", req, false);

export const searchMyTips = (req: TipSearchRequest) =>
  searchTips("/api/search/tips/my", req, true);

export const searchGroupTips = (groupNo: number, req: TipSearchRequest) =>
  searchTips(`/api/search/tips/group/${groupNo}`, req, true);

export const searchStorageTips = (storageNo: number, req: TipSearchRequest) =>
  searchTips(`/api/search/tips/storage/${storageNo}`, req, true);

// 특정 사용자 꿀팁 검색
export const searchUserTips = (userNo: number, req: TipSearchRequest) =>
  searchTips(`/api/search/tips/user/${userNo}`, req, false);

/* ==================== Handler ==================== */
/** ===== Handler 타입 ===== */
// 각 스코프별로 필요한 파라미터를 컴파일 타임에 강제
type BaseOpts = {
  mode?: SearchMode;
  page?: number;
  size?: number;
  onResult?: (rows: TipSearchItem[]) => void;
  onError?: (err: unknown) => void;
};

type PublicOpts = BaseOpts & { scope: "public" };
type MyOpts = BaseOpts & { scope: "my" };
type GroupOpts = BaseOpts & { scope: "group"; groupId: number };
type StorageOpts = BaseOpts & { scope: "storage"; storageId: number };
type UserOpts = BaseOpts & { scope: "user"; userNo: number };

export type CreateSearchHandlerOptions =
  | PublicOpts
  | MyOpts
  | GroupOpts
  | StorageOpts
  | UserOpts;

/** ===== Handler 구현 ===== */
export const createSearchHandler = (opts: CreateSearchHandlerOptions) => {
  const { mode = "OR", page = 0, size = 20, onResult, onError } = opts;

  return async (query: string) => {
    try {
      let rows: TipSearchItem[] = [];

      switch (opts.scope) {
        case "public":
          rows = await searchPublicTips({ keyword: query, mode, page, size });
          break;
        case "my":
          rows = await searchMyTips({ keyword: query, mode, page, size });
          break;
        case "group":
          rows = await searchGroupTips(opts.groupId, {
            keyword: query,
            mode,
            page,
            size,
          });
          break;
        case "storage":
          rows = await searchStorageTips(opts.storageId, {
            keyword: query,
            mode,
            page,
            size,
          });
          break;
        case "user":
          rows = await searchUserTips(opts.userNo, {
            keyword: query,
            mode,
            page,
            size,
          });
          break;
      }

      onResult?.(rows);
      return rows;
    } catch (e) {
      onError?.(e);
      throw e;
    }
  };
};
