// 서버가 어느 타임존에 있든(Vercel=UTC) 한국 기준 날짜로 계산한다.
const KST = "Asia/Seoul";

export function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KST }).format(new Date());
}

export function monthStr(): string {
  return todayStr().slice(0, 7); // YYYY-MM
}

/** D-day. 양수=남음, 0=오늘, 음수=지남 */
export function dday(dueDate: string): number {
  const ms = new Date(dueDate + "T00:00:00+09:00").getTime() -
    new Date(todayStr() + "T00:00:00+09:00").getTime();
  return Math.round(ms / 86400000);
}

export function ddayLabel(dueDate: string | null, done = false): string {
  if (done) return "완료";
  if (!dueDate) return "";
  const d = dday(dueDate);
  if (d === 0) return "D-day";
  return d > 0 ? `D-${d}` : `D+${-d}`;
}

export function fmtDate(d: string | null): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${y}.${m}.${day}`;
}

export function fmtKrw(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}
