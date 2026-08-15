import type { ReactNode } from "react";

export const PILLARS = {
  work: { label: "Work", icon: "💼", color: "text-blue-600", bar: "bg-blue-500", chip: "bg-blue-50 text-blue-700 border-blue-200" },
  life: { label: "Life", icon: "🌱", color: "text-emerald-600", bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  money: { label: "Money", icon: "💰", color: "text-amber-600", bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200" },
} as const;

export type Pillar = keyof typeof PILLARS;

export function PillarChip({ pillar }: { pillar: Pillar }) {
  const p = PILLARS[pillar];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${p.chip}`}>
      {p.icon} {p.label}
    </span>
  );
}

export function ProgressBar({
  value,
  pillar = "life",
}: {
  value: number | null;
  pillar?: Pillar;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
        {value != null && (
          <div
            className={`h-full rounded-full ${PILLARS[pillar].bar} transition-all`}
            style={{ width: `${Math.round(value * 100)}%` }}
          />
        )}
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-neutral-500">
        {value != null ? `${Math.round(value * 100)}%` : "—"}
      </span>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold text-neutral-500">{children}</h2>;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
      {children}
    </p>
  );
}

export function DdayBadge({ label }: { label: string }) {
  if (!label) return null;
  const urgent = label === "D-day" || label.startsWith("D+");
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
        label === "완료"
          ? "bg-neutral-100 text-neutral-500"
          : urgent
            ? "bg-red-50 text-red-600"
            : "bg-neutral-100 text-neutral-600"
      }`}
    >
      {label}
    </span>
  );
}
