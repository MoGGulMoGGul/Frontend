export default function SocialBtn({ label }: { label: string }) {
  return (
    <button className="w-80 bg-[#FFF3B0]/70 border border-[#FFEF96] h-[32px] rounded-md mb-2 hover:bg-[#FFEF96] cursor-pointer">
      {label}
    </button>
  );
}
