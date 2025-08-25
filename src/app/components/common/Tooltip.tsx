type TooltipProps = {
  id: string;
  text: string;
};

export default function Tooltip({ id, text }: TooltipProps) {
  return (
    <div
      id={id}
      role="tooltip"
      className="absolute bottom-full left-1/2 -translate-x-1/2 px-2 py-1 mb-2 text-xs font-semibold bg-[#FFC43E] rounded opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 
        after:-translate-x-1/2 after:border-[6px] after:border-transparent 
        after:border-t-[#FFC43E]"
    >
      {text}
    </div>
  );
}
