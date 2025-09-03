/* ==================== Imports ==================== */
import { apiRequest } from "@/lib/apiClient";

/* ==================== 타입 ==================== */
// Tip 생성 관련
export type CreateTipDraftRequest = {
  url: string;
  title?: string;
  tags?: string[];
};

export type TipDraftResponse = {
  title: string | null;
  summary: string;
  tags: string[];
  thumbnailImageUrl: string | null;
};

// Tip 등록 관련 (명세의 7개 필드만 사용)
export type RegisterTipRequest = {
  url?: string;
  title?: string;
  summary?: string;
  thumbnailImageUrl?: string;
  tags?: string[];
  storageNo: number;
  isPublic: boolean;
};

export type TipRegisteredResponse = {
  tipNo: number;
  storageNo: number;
  isPublic: boolean;
  summary?: string;
  url: string;
  userNo: number;
  nickname: string;
  thumbnailImageUrl: string | null;
  title: string;
  tags: string[];
};

// 내 꿀팁
export type MyTipItem = {
  no: number;
  title: string;
  contentSummary: string;
  url: string;
  userNo: number;
  nickname: string;
  thumbnailUrl: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

// Tip 저장
export type SaveTipRequest = {
  tipNo: number;
  storageNo: number;
};

export type SaveTipResponse = {
  message: string;
};

// 공개 꿀팁
export type PublicTipItem = {
  no: number;
  title: string;
  contentSummary: string;
  url: string;
  userNo: number;
  nickname: string;
  thumbnailUrl: string | null; // data:image/... 또는 http(s)://
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

// Tip 상세
export type TipDetail = {
  no: number;
  title: string;
  contentSummary: string;
  url: string;
  userNo: number;
  nickname: string;
  thumbnailUrl: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

// Tip 수정
export type UpdateTipRequest = {
  title?: string | null;
  contentSummary?: string | null;
  isPublic?: boolean | null;
  tags?: string[] | null;
};

// 내 보관함 저장
export type SaveTipToMyStorageRequest = {
  tipId: number;
  storageId: number;
};

export type SaveTipToMyStorageSuccess = {
  message: string; // "꿀팁을 즐겨찾기하고 보관함에 저장했습니다."
};

export type SaveTipToMyStorageError = {
  status: number; // 403 | 404 등
  message: string;
  error?: string; // "AccessDeniedException" | "IllegalArgumentException" ...
};

// 주간 즐겨찾기 랭킹
export type WeeklyBookmarkRankingItem = {
  tipNo: number;
  title: string;
  thumbnailUrl: string | null;
  nickname: string;
  tags: string[];
  weeklyBookmarkCount: number;
};

export type AutoCreateTipRequest = {
  url: string;
  storageNo: number;
};

export type AutoCreateTipResponse = {
  no: number;
  title: string;
  contentSummary: string;
  url: string;
  nickname: string;
  thumbnailUrl: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

/* ==================== API 함수 ==================== */
/* ----- Create ----- */
// 꿀팁 초안 생성 (퍼블릭 + 60초)
export async function createTipDraft(
  data: CreateTipDraftRequest
): Promise<TipDraftResponse> {
  const res = await apiRequest<TipDraftResponse>("POST", "/api/tips/generate", {
    data,
    timeout: 60_000, // apiRequest에서 timeout 지원하도록 구현되어 있어야 함
  });
  return res;
}

// 꿀팁 등록 (명세 7개 필드만)
export async function registerTip(
  data: RegisterTipRequest
): Promise<TipRegisteredResponse> {
  return apiRequest<TipRegisteredResponse>("POST", "/api/tips/register", {
    data,
  });
}

// 보관함에 꿀팁 저장 (현재 미사용 시 유지)
export async function saveTipToMyStorage(
  data: SaveTipRequest
): Promise<SaveTipResponse> {
  return apiRequest<SaveTipResponse>("POST", "/api/tips/register", {
    data,
  });
}

/* ----- Read ----- */
// 내 꿀팁 목록
export async function getMyTips(): Promise<MyTipItem[]> {
  return apiRequest<MyTipItem[]>("GET", "/api/query/tips/my");
}

// 전체 꿀팁 목록
export async function getPublicTips(): Promise<PublicTipItem[]> {
  return apiRequest<PublicTipItem[]>("GET", "/api/query/tips/all", {
    auth: false,
  });
}

// 꿀팁 상세
export async function getTipDetail(tipNo: number): Promise<TipDetail> {
  return apiRequest<TipDetail>("GET", `/api/query/tips/${tipNo}`);
}

// 특정 유저 꿀팁 목록
export async function getUserTips(userNo: number): Promise<MyTipItem[]> {
  return apiRequest<MyTipItem[]>("GET", `/api/query/tips/user/${userNo}`);
}

// 주간 즐겨찾기 랭킹
export async function getWeeklyBookmarkRanking(): Promise<
  WeeklyBookmarkRankingItem[]
> {
  return apiRequest<WeeklyBookmarkRankingItem[]>(
    "GET",
    "/api/bookmark/ranking/weekly"
  );
}

/* ----- Update ----- */
// 꿀팁 수정
export async function updateTip(
  tipId: number,
  body: UpdateTipRequest
): Promise<TipDetail> {
  return apiRequest<TipDetail>("PUT", `/api/tips/${tipId}`, {
    data: body,
  });
}

/* ----- Delete ----- */
// 꿀팁 삭제
export async function deleteTip(tipId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("DELETE", `/api/tips/${tipId}`);
}

/* ----- Bookmark ----- */
// 꿀팁 즐겨찾기
export async function saveBookMarkTip(
  data: SaveTipRequest
): Promise<SaveTipResponse> {
  return apiRequest<SaveTipResponse>("POST", "/api/bookmark", {
    data,
  });
}

// 꿀팁 자동생성
export async function createTipAutoAsync(
  payload: AutoCreateTipRequest
): Promise<AutoCreateTipResponse> {
  return await apiRequest<AutoCreateTipResponse>(
    "POST",
    "/api/tips/auto-create-async",
    {
      data: payload,
    }
  );
}
