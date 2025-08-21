interface LabeledInputProps {
  label?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function LabeledInput({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}: LabeledInputProps) {
  return (
    <div className="flex flex-col mb-3">
      <div className="text-sm mb-1 font-medium">{label}</div>
      <div>
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="border border-[#d9d9d9] w-full rounded-md h-[40px] outline-none ring-0 focus:border-[#D9D9D9] px-3"
        />
      </div>
    </div>
  );
}
