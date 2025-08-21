import TagList from "../common/TagList";

interface BoldLabeledField {
  label?: string;
  type?: "text" | "textarea" | "radio" | "tag";
  placeholder?: string;
  value?: string | string[];
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  rows?: number;
  options?: string[];
}

export default function BoldLabeledField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  rows = 4,
  options,
}: BoldLabeledField) {
  const isRadioType = type === "radio" && Array.isArray(options);
  const isTextAreaType = type === "textarea";
  const isTagType = type === "tag" && Array.isArray(value);

  return (
    <div className="flex flex-col mb-3">
      <div className="text-xl mb-1 font-semibold">{label}</div>
      {isTextAreaType ? (
        <textarea
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="h-[140px] pt-2 border border-[#d9d9d9] w-full rounded-md outline-none ring-0 focus:border-[#D9D9D9] px-3 resize-none"
        />
      ) : isTagType ? (
        <TagList tags={value} />
      ) : isRadioType ? (
        <div className="flex gap-4">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name={label}
                value={option}
                checked={value === option}
                onChange={onChange}
                className="accent-[var(--color-honey)] w-5 h-5"
              />
              <span className="text-base">{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="border border-[#d9d9d9] w-full rounded-md h-[40px] outline-none ring-0 focus:border-[#D9D9D9] px-3"
        />
      )}
    </div>
  );
}
