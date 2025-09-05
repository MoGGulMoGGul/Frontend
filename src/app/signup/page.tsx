"use client";

import Image from "next/image";
import LabeledInput from "../components/form/LabeledInput";
import YellowLBtn from "../components/common/YellowLBtn";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CommonModal from "../components/modal/CommonModal";
import ModalCancelBtn from "../components/modal/ModalCancelBtn";
import { signup, checkIdDuplicate, checkNicknameDuplicate } from "@/lib/auth";
import { validatePassword } from "@/lib/validatePassword"; // ★ 비밀번호 유효성 유틸 추가

export default function SignUp() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [checkModal, setCheckModal] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    password: "",
    passwordCheck: "",
    nickname: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ★ 비밀번호 유효성 계산 (UI 용)
  const pwResult = useMemo(
    () => validatePassword(form.password, form.id, form.nickname),
    [form.password, form.id, form.nickname]
  );
  const pwMatch =
    form.password.length > 0 && form.password === form.passwordCheck;

  const handleSubmit = async () => {
    const { id, password, nickname } = form;

    if (!id.trim() || !nickname.trim()) {
      setCheckModal("아이디와 닉네임을 입력해주세요");
      return;
    }
    if (!pwResult.passed) {
      setCheckModal("비밀번호 규칙을 확인해주세요 ❌");
      return;
    }
    if (!pwMatch) {
      setCheckModal("비밀번호가 서로 일치하지 않습니다 ❌");
      return;
    }

    try {
      await signup(id, nickname, password);
      setShowModal(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {}
  };

  const handleCheckIdDuplicate = async () => {
    if (!form.id) {
      setCheckModal("아이디를 입력해주세요");
      return;
    }

    try {
      const exists = await checkIdDuplicate(form.id);
      setCheckModal(
        exists
          ? "이미 사용 중인 아이디입니다. ❌"
          : "사용 가능한 아이디입니다! ✅"
      );
    } catch {}
  };

  const handleCheckNicknameDuplicate = async () => {
    if (!form.nickname) {
      setCheckModal("닉네임을 입력해주세요");
      return;
    }

    try {
      const exists = await checkNicknameDuplicate(form.nickname);
      setCheckModal(
        exists
          ? "이미 사용 중인 닉네임입니다. ❌"
          : "사용 가능한 닉네임입니다! ✅"
      );
    } catch {}
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* 로고 + 폼 묶음 */}
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/img/logo.png"
          alt="모꿀모꿀"
          width={180}
          height={100}
          sizes="180px"
          priority
          fetchPriority="high"
        />

        {/* 회원가입 폼 */}
        <div className="w-[500px] border border-[#d9d9d9] rounded-xl p-6">
          <div className="mb-18">
            <div className="flex flex-col mb-3">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium">아이디</div>
                <button
                  onClick={handleCheckIdDuplicate}
                  className="bg-[#FFF3B0]/70 border-[#FFEF96] text-sm px-3 py-1 rounded-md hover:bg-[#FFEF96] cursor-pointer"
                >
                  중복검사
                </button>
              </div>
              <LabeledInput
                name="id"
                value={form.id}
                onChange={handleChange}
                placeholder="아이디를 입력하세요"
                autoComplete="off"
              />
            </div>

            <LabeledInput
              label="비밀번호"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호 입력"
              autoComplete="new-password"
            />

            {/* ★ 강도 표시 바 */}
            {form.password.length > 0 && (
              <div className="mb-2">
                <div className="h-2 rounded bg-gray-200 overflow-hidden">
                  <div
                    className={`h-2 ${
                      pwResult.strength < 0.4
                        ? "bg-red-400"
                        : pwResult.strength < 0.7
                        ? "bg-yellow-400"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.round(pwResult.strength * 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {Math.round(pwResult.strength * 100)}% 안전도
                </div>
              </div>
            )}

            {/* ★ 유효성 실패 메시지 & 일치 여부 */}
            {form.password.length > 0 && (
              <ul className="text-xs mb-4 space-y-1">
                {pwResult.failedRules.length === 0 ? (
                  <li className="text-green-600">
                    비밀번호 규칙을 모두 충족했습니다 ✅
                  </li>
                ) : (
                  pwResult.failedRules.map((m) => (
                    <li key={m} className="text-red-500">
                      • {m}
                    </li>
                  ))
                )}
              </ul>
            )}

            <LabeledInput
              label="비밀번호 확인"
              name="passwordCheck"
              type="password"
              value={form.passwordCheck}
              onChange={handleChange}
              placeholder="비밀번호 재입력"
              autoComplete="new-password"
            />

            {/* ★ 비밀번호 일치 여부 */}
            {form.passwordCheck.length > 0 && (
              <div
                className={`text-sm mb-5 ${
                  pwMatch ? "text-green-600" : "text-red-500"
                }`}
              >
                {pwMatch
                  ? "비밀번호가 일치합니다 ✅"
                  : "비밀번호가 일치하지 않습니다 ❌"}
              </div>
            )}

            <div className="flex flex-col mb-3">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium">닉네임</div>
                <button
                  onClick={handleCheckNicknameDuplicate}
                  className="bg-[#FFF3B0]/70 border-[#FFEF96] text-sm px-3 py-1 rounded-md hover:bg-[#FFEF96] cursor-pointer"
                >
                  중복검사
                </button>
              </div>
              <LabeledInput
                name="nickname"
                value={form.nickname}
                onChange={handleChange}
                placeholder="닉네임을 입력하세요"
              />
            </div>
          </div>
          <YellowLBtn label="회원가입하기" onClick={handleSubmit} />
        </div>
      </div>

      {/* 모달 영역 */}
      {checkModal && (
        <CommonModal>
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">알림</h2>
            <p className="text-gray-600">{checkModal}</p>
            <div className="mt-10 flex justify-center">
              <ModalCancelBtn
                label="닫기"
                onClose={() => setCheckModal(null)}
              />
            </div>
          </div>
        </CommonModal>
      )}
      {showModal && (
        <CommonModal>
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">🎉 회원가입 완료! 🎉</h2>
            <p className="text-sm text-gray-600">
              로그인 페이지로 이동 합니다...
            </p>
          </div>
        </CommonModal>
      )}
    </div>
  );
}
