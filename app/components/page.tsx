"use client";

import CommonModal from "./modal/CommonModal";
import ModalDetailContent from "./modal/ModalDetailContent";
import { useParams, useRouter } from "next/navigation";

export default function DetailTip() {
  const params = useParams();
  const router = useRouter();

  const idParam = params?.id;
  if (typeof idParam !== "string") return null;

  const id = parseInt(idParam, 10);

  const handleClose = () => {
    router.back();
  };
  return (
    <CommonModal>
      <ModalDetailContent id={id} onClose={handleClose} />
    </CommonModal>
  );
}
