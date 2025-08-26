"use client";

import LabeledInput from "../components/form/LabeledInput";
import YellowLBtn from "../components/common/YellowLBtn";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CommonModal from "../components/modal/CommonModal";
import ModalCancelBtn from "../components/modal/ModalCancelBtn";
import { signup, checkIdDuplicate, checkNicknameDuplicate } from "@/lib/auth";

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

  const handleSubmit = async () => {
    const { id, password, nickname } = form;

    try {
      await signup(id, nickname, password);
      console.log("회원가입 성공!");
      setShowModal(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error("회원가입 실패", error);
    }
  };

  const handleCheckIdDuplicate = async () => {
    if (!form.id) {
      setCheckModal("아이디를 입력해주세요");
      return;
    }

    try {
      const exists = await checkIdDuplicate(form.id);
      if (exists) {
        setCheckModal("이미 사용 중인 아이디입니다. ❌");
      } else {
        setCheckModal("사용 가능한 아이디입니다! ✅");
      }
    } catch (error) {
      console.error("아이디 중복검사 실패", error);
    }
  };

  const handleCheckNicknameDuplicate = async () => {
    if (!form.nickname) {
      setCheckModal("닉네임을 입력해주세요");
      return;
    }

    try {
      const exists = await checkNicknameDuplicate(form.nickname);
      if (exists) {
        setCheckModal("이미 사용 중인 닉네임입니다. ❌");
      } else {
        setCheckModal("사용 가능한 닉네임입니다! ✅");
      }
    } catch (error) {
      console.error("닉네임 중복검사 실패", error);
    }
  };

  return (
    <div className="flex items-center justify-center flex-col h-screen">
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
          <LabeledInput
            label="비밀번호 확인"
            name="passwordCheck"
            type="password"
            value={form.passwordCheck}
            onChange={handleChange}
            placeholder="비밀번호 재입력"
            autoComplete="new-password"
          />
          {form.passwordCheck.length > 0 && (
            <div
              className={`text-sm mb-5 ${
                form.password === form.passwordCheck
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {form.password === form.passwordCheck
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
  );
}
