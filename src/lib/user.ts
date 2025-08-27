/* ==================== Imports ==================== */
import { apiRequest } from "@/lib/apiClient";

/* ==================== 공개 타입 ==================== */
export type UpdateProfileResponse = {
  message: string;
  profileImageUrl?: string;
};

export type UpdateProfilePayload = {
  nickname?: string;
  image?: File | null;
};

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

export type FollowUserItem = {
  userNo: number;
  nickname: string;
  profileImageUrl: string;
  isFollow: boolean;
  loginId: string;
};

/* ==================== API 함수 ==================== */
/* ----- Profile (Update) ----- */
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

  return apiRequest<UpdateProfileResponse>("PUT", "/api/profile", {
    data: form,
  });
};

/* ----- Profile (Read) ----- */
export const getUserProfile = async (userNo: number): Promise<UserProfile> => {
  return apiRequest<UserProfile>("GET", `/api/profile/${userNo}`, {});
};

/* ----- Follow (Update) ----- */
export const followUser = async (
  followeeLoginId: string
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>("POST", "/api/follow", {
    data: { followeeId: followeeLoginId },
  });
};

export const unfollowUser = async (
  followeeLoginId: string
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>("DELETE", "/api/follow", {
    data: { followeeId: followeeLoginId },
  });
};
/* ----- Follow (Read) ----- */
export const getFollowers = async (
  userNo: number
): Promise<FollowUserItem[]> => {
  return apiRequest<FollowUserItem[]>("GET", `/api/follow/${userNo}/followers`);
};

export const getFollowings = async (
  userNo: number
): Promise<FollowUserItem[]> => {
  return apiRequest<FollowUserItem[]>(
    "GET",
    `/api/follow/${userNo}/followings`
  );
};

export const getAllUsers = async (): Promise<FollowUserItem[]> => {
  return apiRequest<FollowUserItem[]>("GET", "/api/users/all");
};
