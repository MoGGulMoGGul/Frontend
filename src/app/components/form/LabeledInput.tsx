import { useId } from "react";

interface LabeledInputProps {
  label?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  id?: string;
  right?: React.ReactNode;
}

export default function LabeledInput({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  id,
  right,
}: LabeledInputProps) {
  const reactGenId = useId();
  const inputId = id ?? (name ? `input-${name}` : `input-${reactGenId}`);

  return (
    <div className="flex flex-col mb-3">
      {label ? (
        <label
          htmlFor={inputId}
          className="text-sm mb-1 font-medium flex items-center justify-between"
        >
          <span>{label}</span>
          {right ? <span className="ml-3">{right}</span> : null}
        </label>
      ) : null}
      <div>
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="border border-[#d9d9d9] w-full rounded-md h-[40px] outline-none ring-0 focus:border-[#D9D9D9] px-3"
        />
      </div>
    </div>
  );
}
