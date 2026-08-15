"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/goals", label: "목표", icon: "🎯" },
  { href: "/projects", label: "프로젝트", icon: "📁" },
  { href: "/tasks", label: "할 일", icon: "✅" },
  { href: "/routines", label: "루틴", icon: "🔁" },
  { href: "/notes", label: "노트", icon: "📝" },
  { href: "/reviews", label: "계획·회고", icon: "🪞" },
  { href: "/money", label: "머니", icon: "💰" },
  { href: "/areas", label: "영역", icon: "🗂️" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside className="hidden w-52 shrink-0 border-r border-neutral-200 bg-white md:block">
        <div className="sticky top-0 p-4">
          <Link href="/" className="mb-6 block px-2 text-lg font-bold tracking-tight">
            갓생 OS
          </Link>
          <nav className="space-y-0.5">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm ${
                    active
                      ? "bg-neutral-900 font-medium text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* 모바일 하단 탭바: 홈·할일·루틴·가계부 */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden">
        {[NAV[0], NAV[3], NAV[4], NAV[7]].map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                active ? "font-semibold text-neutral-900" : "text-neutral-400"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
