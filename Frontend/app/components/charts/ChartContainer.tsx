import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

interface Props {
  children: ReactElement;
  height?: number;
}

export default function ChartContainer({ children, height = 240 }: Props) {
  return (
    <div className="w-full min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" debounce={100}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
