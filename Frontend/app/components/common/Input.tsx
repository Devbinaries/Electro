import type {
  InputHTMLAttributes,
} from "react";

interface Props
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  ...props
}: Props) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="font-medium">
          {label}
        </label>
      )}

      <input
        {...props}
        className="
          w-full
          rounded-xl
          border
          p-3
          outline-none
          focus:border-none
          focus:ring-2
          focus:ring-blue-500
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
        "
      />

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}