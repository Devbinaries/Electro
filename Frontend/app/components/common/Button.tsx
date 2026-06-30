import type { ButtonHTMLAttributes } from "react";

interface Props
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function Button({
  children,
  loading,
  className = "",
  ...props
}: Props) {
  return (
    <button
      disabled={loading}
      className={`
        rounded-xl
        bg-blue-600
        px-5
        py-3
        font-medium
        text-white
        transition
        cursor-pointer
        hover:bg-blue-700
        disabled:opacity-50
        ${className}
      `}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}