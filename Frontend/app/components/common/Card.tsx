import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function Card({
  children,
}: Props) {
  return (
    <div
      className="
        w-max
        rounded-2xl
        bg-white
        p-6
        shadow
      " 
    >
      {children}
    </div>
  );
}
