"use client";

import Image from "next/image";
import Link from "next/link";
import LabeledInput from "../components/form/LabeledInput";
import SocialBtn from "../components/common/SocialBtn";
import YellowLBtn from "../components/common/YellowLBtn";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAndStore, findId, resetPassword } from "@/lib/auth";
import CommonModal from "../components/modal/CommonModal";
import ModalCancelBtn from "../components/modal/ModalCancelBtn";
import OkBtn from "../components/common/OkBtn";
import { useAuthStore } from "@/stores/useAuthStore";

export default function Login() {
  const router = useRouter();

  const [form, setForm] = useState({ id: "", password: "" });

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"findId" | "resetPw" | null>(null);

  // 아이디 찾기 상태
  const [nickname, setNickname] = useState("");
  const [pwForIdFind, setPwForIdFind] = useState("");

  // 비번 재설정 상태
  const [resetId, setResetId] = useState("");
  const [resetNickname, setResetNickname] = useState("");
  const [newPw, setNewPw] = useState("");

  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const messageClass = isError ? "text-red-500" : "text-gray-500";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage("");
    setIsError(false);
    setNickname("");
    setPwForIdFind("");
    setResetId("");
    setResetNickname("");
    setNewPw("");
  };

  const handleLogin = async () => {
    try {
      const { id, password } = form;
      if (!id.trim() || !password) return;

      //  토큰저장 + 유저기본정보저장
      await loginAndStore(id, password);

      router.push("/");
    } catch {
      useAuthStore.getState().clearAuth();
      setIsError(true);
      setModalMessage("아이디 또는 비밀번호를 다시 확인해주세요.");
      setModalType(null);
      setShowModal(true);
    }
  };

  const handleFindId = async () => {
    try {
      const result = await findId(nickname, pwForIdFind);
      setModalMessage(`아이디는: ${result} 입니다`);
      setIsError(false);
    } catch {
      setModalMessage("입력한 정보와 일치하는 아이디가 없습니다. ❌");
      setIsError(true);
    }
  };

  const handleResetPw = async () => {
    try {
      await resetPassword(resetId, resetNickname, newPw);
      setModalMessage("비밀번호가 성공적으로 재설정되었습니다 ✅");
      setIsError(false);
    } catch {
      setModalMessage("재설정에 실패했습니다. ❌");
      setIsError(true);
    }
  };

  const openFindIdModal = () => {
    setModalType("findId");
    setShowModal(true);
  };

  const openResetPwModal = () => {
    setModalType("resetPw");
    setShowModal(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-6">
        <Image
          src={"/img/logo.png"}
          alt="모꿀모꿀"
          width={180}
          height={100}
          sizes="180px"
          priority
          fetchPriority="high"
        />
        <div className="flex items-center justify-center flex-col">
          <div className="w-[500px] border border-[#d9d9d9] rounded-xl p-6">
            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <div className="flex flex-col mb-6">
                <LabeledInput
                  id="loginId"
                  label="아이디 및 이메일"
                  name="id"
                  value={form.id}
                  onChange={handleChange}
                  autoComplete="off"
                />
                <LabeledInput
                  id="loginPassword"
                  label="비밀번호"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>
              {/* 버튼은 기존 그대로 (onClick 유지) */}
              <YellowLBtn
                label="로그인하기"
                onClick={handleLogin}
                id="loginButton"
              />
            </form>

            <div className="flex items-center justify-center text-sm font-medium hover:cursor-pointer mb-16">
              <Link href="/signup" className="hover:font-semibold">
                회원가입
              </Link>
              <div className="mx-1 font-semibold">|</div>
              <span className="hover:font-semibold" onClick={openResetPwModal}>
                비밀번호 찾기
              </span>
              <div className="mx-1 font-semibold">|</div>
              <span className="hover:font-semibold" onClick={openFindIdModal}>
                아이디 찾기
              </span>
            </div>

            <div className="flex flex-col items-center">
              <SocialBtn label="구글로 시작하기" />
              <SocialBtn label="네이버로 시작하기" />
              <SocialBtn label="카카오로 시작하기" />
            </div>
          </div>

          {/* 공통 모달 (그대로) */}
          {showModal && (
            <CommonModal>
              {modalType === "findId" && (
                <div className="flex flex-col gap-4 w-[300px]">
                  <h2 className="text-lg font-bold text-center">아이디 찾기</h2>
                  <LabeledInput
                    label="닉네임"
                    name="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                  <LabeledInput
                    label="비밀번호"
                    type="password"
                    name="pwForIdFind"
                    value={pwForIdFind}
                    onChange={(e) => setPwForIdFind(e.target.value)}
                  />
                  {modalMessage && (
                    <p className={`text-sm text-center ${messageClass}`}>
                      {modalMessage}
                    </p>
                  )}
                  <div className="mt-2 flex justify-end items-center gap-2 flex-nowrap">
                    <OkBtn label="아이디 찾기" onClick={handleFindId} />
                    <ModalCancelBtn label="닫기" onClose={closeModal} />
                  </div>
                </div>
              )}

              {modalType === "resetPw" && (
                <div className="flex flex-col gap-4 w-[300px]">
                  <h2 className="text-lg font-bold text-center">
                    비밀번호 재설정
                  </h2>
                  <LabeledInput
                    label="아이디"
                    name="resetId"
                    value={resetId}
                    onChange={(e) => setResetId(e.target.value)}
                  />
                  <LabeledInput
                    label="닉네임"
                    name="resetNickname"
                    value={resetNickname}
                    onChange={(e) => setResetNickname(e.target.value)}
                  />
                  <LabeledInput
                    label="새 비밀번호"
                    type="password"
                    name="newPw"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                  />
                  {modalMessage && (
                    <p className={`text-sm text-center ${messageClass}`}>
                      {modalMessage}
                    </p>
                  )}
                  <div className="mt-2 flex justify-end items-center gap-2 flex-nowrap">
                    <OkBtn label="재설정하기" onClick={handleResetPw} />
                    <ModalCancelBtn label="닫기" onClose={closeModal} />
                  </div>
                </div>
              )}

              {/* 에러 메시지만 보여줄 때 */}
              {!modalType && modalMessage && (
                <div className="flex flex-col gap-4 w-[300px]">
                  <h2 className="text-lg font-bold text-center">알림</h2>
                  <p className={`text-sm text-center ${messageClass}`}>
                    {modalMessage}
                  </p>
                  <div className="flex justify-center">
                    <ModalCancelBtn label="닫기" onClose={closeModal} />
                  </div>
                </div>
              )}
            </CommonModal>
          )}
        </div>
      </div>
    </div>
  );
}
