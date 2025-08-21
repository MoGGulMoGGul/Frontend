/* ==================== Imports ==================== */
import { apiRequest } from "@/lib/apiClient";
import { authHeader } from "@/lib/authHeader";

/* ==================== 타입 ==================== */
// 공개 타입
export type CreateGroupRequest = { name: string };
export type CreateGroupResponse = { message: string; groupNo: number };

export type GroupMember = { userNo: number; nickname: string };

export type GroupListItem = {
  groupNo: number;
  name: string;
  memberCount: number;
};

export type InviteGroupMemberRequest = { userLoginIds: string[] };
type InviteAPIResponse = string[] | { message?: string | null }; // 방어적
export type InviteGroupInviteResponse = string[];

/* ==================== 내부(raw) 타입 ==================== */
type RawGroup = { id: number; name: string; memberCount: number };
type RawGroupMember = { userNo: number; nickname: string };

/* ==================== API: Groups ==================== */
/* ----- Create(그룹 생성) ----- */
export const createGroup = async (
  data: CreateGroupRequest
): Promise<CreateGroupResponse> => {
  const created = await apiRequest<{ id: number; name: string }>(
    "POST",
    "/api/groups",
    { headers: authHeader(), data }
  );
  return { message: "그룹 생성 완료!", groupNo: created.id };
};

/* ----- Read (그룹 목록 조회) ----- */
export const getMyGroups = async (): Promise<GroupListItem[]> => {
  const raw = await apiRequest<RawGroup[]>("GET", "/api/groups/check", {
    headers: authHeader(),
  });
  return raw.map((g) => ({
    groupNo: g.id,
    name: g.name,
    memberCount: g.memberCount,
  }));
};

/* ----- Read (그룹 멤버 조회) ----- */
export const getGroupMembers = async (
  groupNo: number
): Promise<GroupMember[]> => {
  const raw = await apiRequest<RawGroupMember[]>(
    "GET",
    `/api/groups/${groupNo}/members`,
    { headers: authHeader() }
  );
  return raw.map((m) => ({ userNo: m.userNo, nickname: m.nickname }));
};

/* ----- Update(그룹명 수정) ----- */
export const updateGroupName = async (
  groupNo: number,
  data: { name: string }
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>("PUT", `/api/groups/${groupNo}/name`, {
    headers: authHeader(),
    data,
  });
};

/* ----- Delete(그룹 나가기) ----- */
export const deleteGroup = async (
  groupId: number
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(
    "DELETE",
    `/api/groups/${groupId}/leave`,
    {
      headers: authHeader(),
    }
  );
};

/* ----- Action ----- */
/* 그룹 멤버 초대: 항상 string[] 반환 */
/* 그룹 초대하기*/
export const inviteGroupMember = async (
  groupNo: number,
  data: InviteGroupMemberRequest
): Promise<InviteGroupInviteResponse> => {
  const res = await apiRequest<InviteAPIResponse>(
    "POST",
    `/api/groups/${groupNo}/invite`,
    { headers: authHeader(), data } // { userLoginIds: string[] }
  );

  const arr = Array.isArray(res) ? res : [res.message ?? ""];
  // 값이 비정상일 수 있으므로 문자열만 남기고 빈 문자열은 제거
  return arr.filter((m): m is string => typeof m === "string" && m.length > 0);
};

/* Delete(그룹 나가기) */
export const leaveGroup = async (
  groupNo: number
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(
    "DELETE",
    `/api/groups/${groupNo}/leave`,
    { headers: authHeader() }
  );
};
