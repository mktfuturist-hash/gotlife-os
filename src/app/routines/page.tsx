import { asc, inArray } from "drizzle-orm";
import { db, routines, routineLogs, goals, areas } from "@/db";
import {
  createRoutine, logRoutine, unlogRoutineToday, setRoutineStatus, deleteRoutine,
} from "@/lib/actions";
import { computeRoutineStats } from "@/lib/routine-stats";
import { Card, Empty, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
  const [rts, goalList, areaList] = await Promise.all([
    db.select().from(routines).orderBy(asc(routines.id)),
    db.select().from(goals),
    db.select().from(areas),
  ]);
  const logs = rts.length
    ? await db
        .select()
        .from(routineLogs)
        .where(inArray(routineLogs.routineId, rts.map((r) => r.id)))
    : [];

  const active = rts.filter((r) => r.status === "active");
  const stopped = rts.filter((r) => r.status === "stopped");
  const statsOf = (id: number) =>
    computeRoutineStats(logs.filter((l) => l.routineId === id).map((l) => l.loggedAt));

  const totalThisMonth = active.reduce((s, r) => s + statsOf(r.id).monthCount, 0);
  const totalAll = logs.length;

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">루틴</h1>
          <p className="mt-1 text-sm text-neutral-500">
            꾸준히 반복하는 것들 — 버튼 한 번으로 기록됩니다.
          </p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="text-xl font-bold tabular-nums">{totalThisMonth}</div>
            <div className="text-xs text-neutral-400">이번 달</div>
          </div>
          <div>
            <div className="text-xl font-bold tabular-nums">{totalAll}</div>
            <div className="text-xs text-neutral-400">전체</div>
          </div>
        </div>
      </header>

      <Card>
        <SectionTitle>새 루틴</SectionTitle>
        <form action={createRoutine} className="flex flex-wrap items-end gap-2">
          <input name="title" placeholder="루틴 (예: 매일 아침 독서 30분)" required className="min-w-56 flex-1" />
          <select name="goalId" defaultValue="">
            <option value="">연결 목표 없음</option>
            {goalList.filter((g) => g.status === "active").map((g) => (
              <option key={g.id} value={g.id}>🎯 {g.title}</option>
            ))}
          </select>
          <select name="areaId" defaultValue="">
            <option value="">영역 없음</option>
            {areaList.filter((a) => !a.archived).map((a) => (
              <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
            ))}
          </select>
          <button type="submit">추가</button>
        </form>
      </Card>

      <section>
        <SectionTitle>진행 중 ({active.length})</SectionTitle>
        {active.length === 0 ? (
          <Empty>루틴이 없습니다. 목표 달성을 위해 꾸준히 할 것을 추가해 보세요.</Empty>
        ) : (
          <div className="space-y-3">
            {active.map((r) => {
              const st = statsOf(r.id);
              const goal = goalList.find((g) => g.id === r.goalId);
              return (
                <Card key={r.id}>
                  <div className="flex items-center gap-3">
                    {st.doneToday ? (
                      <form action={unlogRoutineToday.bind(null, r.id)}>
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-lg text-white shadow-sm"
                          title="오늘 기록 취소"
                        >
                          ✓
                        </button>
                      </form>
                    ) : (
                      <form action={logRoutine.bind(null, r.id)}>
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 text-lg text-neutral-300 hover:border-emerald-400 hover:text-emerald-400"
                          title="루틴 기록"
                        >
                          ✓
                        </button>
                      </form>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{r.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
                        {goal && <span>🎯 {goal.title}</span>}
                        <span>이번 달 {st.monthCount}회</span>
                        <span>· 전체 {st.totalCount}회</span>
                        {st.streak > 0 && (
                          <span className="font-semibold text-orange-500">🔥 {st.streak}일 연속</span>
                        )}
                      </div>
                    </div>
                    {/* 최근 28일 히트맵 */}
                    <div className="hidden grid-cols-14 gap-0.5 sm:grid" style={{ gridTemplateColumns: "repeat(14, 8px)" }}>
                      {st.last28.map((on, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-[2px] ${on ? "bg-emerald-400" : "bg-neutral-150 bg-neutral-200/70"}`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <form action={setRoutineStatus.bind(null, r.id, "stopped")}>
                        <button className="text-xs text-neutral-300 hover:text-neutral-500">중단</button>
                      </form>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {stopped.length > 0 && (
        <section>
          <SectionTitle>중단됨 ({stopped.length})</SectionTitle>
          <div className="space-y-2">
            {stopped.map((r) => (
              <div key={r.id} className="flex items-center gap-3 text-sm text-neutral-400">
                <span>⏸️ {r.title}</span>
                <form action={setRoutineStatus.bind(null, r.id, "active")}>
                  <button className="text-xs underline hover:text-neutral-600">재개</button>
                </form>
                <form action={deleteRoutine.bind(null, r.id)}>
                  <button className="text-xs text-neutral-300 hover:text-red-500">삭제</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
