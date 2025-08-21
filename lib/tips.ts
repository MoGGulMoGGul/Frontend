/* ==================== Imports ==================== */
import { apiRequest } from "@/lib/apiClient";
import { authHeader } from "@/lib/authHeader";

/* ==================== 타입 ==================== */
// Tip 생성 관련
export type CreateTipDraftRequest = {
  url: string;
  title?: string;
  tags?: string[];
};

export type TipDraftResponse = {
  no: number;
  title: string | null;
  contentSummary: string; // "요약 생성 중...(taskId: ...)" 가능
  url: string;
  nickname: string;
  thumbnailUrl?: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userNo: number;
};

// Tip 등록 관련
export type RegisterTipRequest = {
  tipNo: number; // draft id
  isPublic: boolean;
  storageNo: number;
};

export type TipRegisteredResponse = {
  no: number;
  title: string;
  contentSummary: string;
  url: string;
  nickname: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userNo: number;
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
  tipId: number;
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
// 꿀팁 초안 생성
export async function createTipDraft(
  data: CreateTipDraftRequest
): Promise<TipDraftResponse> {
  return apiRequest<TipDraftResponse>("POST", "/api/tips/generate", {
    headers: authHeader(),
    data,
  });
}

// 꿀팁 등록
export async function registerTip(
  data: RegisterTipRequest
): Promise<TipRegisteredResponse> {
  return apiRequest<TipRegisteredResponse>("POST", "/api/tips/register", {
    headers: authHeader(),
    data,
  });
}

// 보관함에 꿀팁 저장
export async function saveTipToMyStorage(
  data: SaveTipRequest
): Promise<SaveTipResponse> {
  return apiRequest<SaveTipResponse>("POST", "/api/tips/register", {
    headers: authHeader(),
    data,
  });
}

/* ----- Read ----- */
// 내 꿀팁 목록 조회
export async function getMyTips(): Promise<MyTipItem[]> {
  return apiRequest<MyTipItem[]>("GET", "/api/query/tips/my", {
    headers: authHeader(),
  });
}

// 전체 꿀팁 목록
export async function getPublicTips(): Promise<PublicTipItem[]> {
  return apiRequest<PublicTipItem[]>("GET", "/api/query/tips/all", {});
}

// 꿀팁 상세
export async function getTipDetail(tipNo: number): Promise<TipDetail> {
  return apiRequest<TipDetail>("GET", `/api/query/tips/${tipNo}`, {});
}

// 특정 유저 꿀팁 목록
export async function getUserTips(userNo: number): Promise<MyTipItem[]> {
  return apiRequest<MyTipItem[]>("GET", `/api/query/tips/user/${userNo}`, {});
}

// 주간 즐겨찾기 랭킹
export async function getWeeklyBookmarkRanking(): Promise<
  WeeklyBookmarkRankingItem[]
> {
  return apiRequest<WeeklyBookmarkRankingItem[]>(
    "GET",
    "/api/bookmark/ranking/weekly",
    {}
  );
}

/* ----- Update ----- */
// 꿀팁 수정
export async function updateTip(
  tipId: number,
  body: UpdateTipRequest
): Promise<TipDetail> {
  return apiRequest<TipDetail>("PUT", `/api/tips/${tipId}`, {
    headers: authHeader(),
    data: body,
  });
}

/* ----- Delete ----- */
// 꿀팁 삭제
export async function deleteTip(tipId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("DELETE", `/api/tips/${tipId}`, {
    headers: authHeader(),
  });
}

/* ----- Bookmark ----- */
// 꿀팁 즐겨찾기
export async function saveBookMarkTip(
  data: SaveTipRequest
): Promise<SaveTipResponse> {
  return apiRequest<SaveTipResponse>("POST", "/api/bookmark", {
    headers: authHeader(),
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
      headers: authHeader(),
      data: payload,
    }
  );
}
