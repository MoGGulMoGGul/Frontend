"use client";

import { useRouter } from "next/navigation";
import ModalDetailContent from "../../components/modal/ModalDetailContent";

export default function ModalPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <ModalDetailContent
          id={parseInt(params.id)}
          onClose={() => router.back()}
        />
      </div>
    </div>
  );
}
