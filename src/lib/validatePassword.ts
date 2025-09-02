export type PasswordRuleResult = {
  ok: boolean;
  msg: string;
};

export type PasswordValidationResult = {
  passed: boolean;
  failedRules: string[];
  strength: number; // 0 ~ 1
};

/**
 * 비밀번호 유효성 검사
 * - 길이 8~32
 * - 대문자/소문자/숫자/특수문자 포함
 * - 공백 없음
 * - 아이디/닉네임 포함 금지
 */
export function validatePassword(
  password: string,
  id?: string,
  nickname?: string
): PasswordValidationResult {
  const rules = [
    {
      test: (s: string) => s.length >= 8 && s.length <= 32,
      msg: "8~32자여야 합니다",
    },
    { test: (s: string) => /[A-Z]/.test(s), msg: "대문자 1자 이상 포함" },
    { test: (s: string) => /[a-z]/.test(s), msg: "소문자 1자 이상 포함" },
    { test: (s: string) => /\d/.test(s), msg: "숫자 1자 이상 포함" },
    {
      test: (s: string) => /[^A-Za-z0-9\s]/.test(s),
      msg: "특수문자 1자 이상 포함",
    },
    {
      test: (s: string) => !/\s/.test(s),
      msg: "공백 문자는 사용할 수 없습니다",
    },
    {
      test: (s: string) => {
        const lowered = s.toLowerCase();
        return (
          (id ? !lowered.includes(id.toLowerCase()) : true) &&
          (nickname ? !lowered.includes(nickname.toLowerCase()) : true)
        );
      },
      msg: "아이디/닉네임을 비밀번호에 포함하지 마세요",
    },
  ];

  const failedRules = rules.filter((r) => !r.test(password)).map((r) => r.msg);
  const strength = rules.filter((r) => r.test(password)).length / rules.length;

  return {
    passed: failedRules.length === 0,
    failedRules,
    strength,
  };
}
