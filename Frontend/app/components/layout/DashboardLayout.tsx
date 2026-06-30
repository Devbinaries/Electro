import { type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: Props) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Navbar />

        <main className="flex-1 p-6 max-h-[calc(100vh-64px)] overflow-y-auto [scrollbar-width:none]">
          {children}
        </main>
      </div>
    </div>
  );
}