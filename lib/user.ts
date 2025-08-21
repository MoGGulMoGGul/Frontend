/* ==================== Imports ==================== */
import { apiRequest } from "@/lib/apiClient";
import { authHeader } from "@/lib/authHeader";

/* ==================== 상수/설정 ==================== */
const isMock = process.env.NEXT_PUBLIC_API_MOCK === "true";

/* ==================== 공개 타입 ==================== */
// 프로필 업데이트 응답
export type UpdateProfileResponse = {
  message: string;
  profileImageUrl?: string;
};

// 프로필 업데이트 요청 페이로드
export type UpdateProfilePayload = {
  nickname?: string;
  image?: File | null;
};

// 사용자 프로필
export type UserProfile = {
  userNo: number;
  loginId: string;
  nickname: string;
  profileImageUrl: string;
  followerCount: number;
  followingCount: number;
  totalBookmarkCount: number;
  isFollowing: boolean;
};

// 팔로우 사용자 항목
export type FollowUserItem = {
  userNo: number;
  nickname: string;
  profileImageUrl: string;
  isFollow: boolean;
};

/* ==================== 내부(raw) 타입 ==================== */
// json-server /signup 행(raw)
type MockSignupRow = {
  id: string;
  nickname?: string;
  userNo?: number;
  no?: number;
};

/* ==================== 매퍼/유틸 ==================== */
// /signup raw → FollowUserItem 기본값 포함 매핑
const toFollowUserItem = (u: MockSignupRow, index: number): FollowUserItem => ({
  userNo: u.userNo ?? (u.no as number),
  nickname: u.nickname ?? `사용자${index + 1}`,
  profileImageUrl: "/img/1bee.png",
  isFollow: false,
});

/* ==================== API 함수 ==================== */
/* ----- Profile (Update) ----- */
// 프로필 업데이트 (닉네임/이미지)
export const updateProfile = async ({
  nickname,
  image,
}: UpdateProfilePayload): Promise<UpdateProfileResponse> => {
  const form = new FormData();
  if (nickname?.trim()) form.append("nickname", nickname.trim());
  if (image) form.append("image", image);

  if (!form.has("nickname") && !form.has("image")) {
    throw new Error("변경할 항목이 없습니다. (nickname 또는 image 필요)");
  }

  return apiRequest<UpdateProfileResponse>(
    "PUT",
    isMock ? "/__noop" : "/api/profile", // mock에선 형식상 성공만 필요하면 /__noop
    { headers: isMock ? {} : authHeader(), data: form }
  );
};

/* ----- Profile (Read) ----- */
// 프로필 조회
export const getUserProfile = async (userNo: number): Promise<UserProfile> => {
  if (isMock) {
    // json-server의 /signup에서 해당 유저를 찾아 표준 타입으로 가공
    const all = await apiRequest<MockSignupRow[]>("GET", "/signup");
    const u =
      all.find((r) => (r.userNo ?? r.no) === userNo) ??
      all.find((r) => String(r.userNo ?? r.no) === String(userNo));

    return {
      userNo,
      loginId: u?.id ?? `user${userNo}`,
      nickname: u?.nickname ?? "사용자",
      profileImageUrl: "/img/1bee.png",
      followerCount: 0,
      followingCount: 0,
      totalBookmarkCount: 0,
      isFollowing: true,
    };
  }

  return apiRequest<UserProfile>("GET", `/api/profile/${userNo}`, {
    headers: authHeader(),
  });
};

/* ----- Follow (Update) ----- */
// 팔로우
export const followUser = async (
  followeeId: string
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(
    "PATCH",
    isMock ? "/__noop" : "/api/follow",
    { headers: isMock ? {} : authHeader(), data: { followeeId } }
  );
};

// 언팔로우
export const unfollowUser = async (
  followeeId: string
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(
    "DELETE",
    isMock ? "/__noop" : "/api/follow",
    { headers: isMock ? {} : authHeader(), data: { followeeId } }
  );
};

/* ----- Follow (Read) ----- */
// 팔로워 목록
export const getFollowers = async (
  userNo: number
): Promise<FollowUserItem[]> => {
  if (isMock) {
    // json-server에서는 쿼리로 필터
    return apiRequest<FollowUserItem[]>("GET", "/followers", {
      params: { userNo },
    });
  }

  return apiRequest<FollowUserItem[]>(
    "GET",
    `/api/follow/${userNo}/followers`,
    { headers: authHeader() }
  );
};

// 팔로잉 목록
export const getFollowings = async (
  userNo: number
): Promise<FollowUserItem[]> => {
  if (isMock) {
    return apiRequest<FollowUserItem[]>("GET", "/followings", {
      params: { userNo },
    });
  }

  return apiRequest<FollowUserItem[]>(
    "GET",
    `/api/follow/${userNo}/followings`,
    { headers: authHeader() }
  );
};

// 사용자 전체 목록
export const getAllUsers = async (): Promise<FollowUserItem[]> => {
  if (isMock) {
    const all = await apiRequest<MockSignupRow[]>("GET", "/signup");
    return all.map(toFollowUserItem);
  }

  return apiRequest<FollowUserItem[]>("GET", "/api/users/all", {
    headers: authHeader(),
  });
};
