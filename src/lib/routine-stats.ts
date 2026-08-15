import { todayStr } from "@/lib/dates";

/** loggedAt 타임스탬프를 KST 날짜 문자열(YYYY-MM-DD)로 */
export function toKstDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);
}

export type RoutineStats = {
  monthCount: number;
  totalCount: number;
  doneToday: boolean;
  /** 오늘(또는 어제)로 끝나는 연속 일수 */
  streak: number;
  /** 최근 28일, 과거→오늘 순. true = 실행함 */
  last28: boolean[];
};

export function computeRoutineStats(logDates: Date[]): RoutineStats {
  const today = todayStr();
  const month = today.slice(0, 7);
  const days = new Set(logDates.map(toKstDate));

  const dayMs = 86400000;
  const t0 = new Date(today + "T00:00:00+09:00").getTime();

  const last28: boolean[] = [];
  for (let i = 27; i >= 0; i--) {
    last28.push(days.has(toKstDate(new Date(t0 - i * dayMs))));
  }

  let streak = 0;
  // 오늘 안 했어도 어제까지의 연속은 유지되도록 시작점을 조정
  let cursor = days.has(today) ? t0 : t0 - dayMs;
  while (days.has(toKstDate(new Date(cursor)))) {
    streak++;
    cursor -= dayMs;
  }

  return {
    monthCount: logDates.filter((d) => toKstDate(d).startsWith(month)).length,
    totalCount: logDates.length,
    doneToday: days.has(today),
    streak,
    last28,
  };
}
