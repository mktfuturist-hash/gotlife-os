import Link from "next/link";
import { asc, inArray, sql } from "drizzle-orm";
import { db, projects, tasks, areas, goals } from "@/db";
import { createProject } from "@/lib/actions";
import { ddayLabel, fmtDate, todayStr } from "@/lib/dates";
import { Card, DdayBadge, Empty, ProgressBar, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  planned: "예정",
  active: "진행 중",
  done: "완료",
  hold: "보류",
};

export default async function ProjectsPage() {
  const [prjs, areaList, goalList] = await Promise.all([
    db.select().from(projects).orderBy(asc(projects.startDate), asc(projects.id)),
    db.select().from(areas),
    db.select().from(goals),
  ]);
  const taskStats: { projectId: number | null; total: number; done: number }[] =
    prjs.length
      ? await db
          .select({
            projectId: tasks.projectId,
            total: sql<number>`count(*)::int`,
            done: sql<number>`count(*) filter (where ${tasks.done})::int`,
          })
          .from(tasks)
          .where(inArray(tasks.projectId, prjs.map((p) => p.id)))
          .groupBy(tasks.projectId)
      : [];

  const statOf = (id: number) =>
    taskStats.find((t) => t.projectId === id) ?? { total: 0, done: 0 };

  // ── 타임라인 범위: 프로젝트 기간 전체를 감싸는 구간 ──
  const dated = prjs.filter((p) => p.startDate && p.endDate && p.status !== "done");
  const minD = dated.length ? dated.reduce((m, p) => (p.startDate! < m ? p.startDate! : m), dated[0].startDate!) : null;
  const maxD = dated.length ? dated.reduce((m, p) => (p.endDate! > m ? p.endDate! : m), dated[0].endDate!) : null;
  const span =
    minD && maxD
      ? Math.max(1, (new Date(maxD).getTime() - new Date(minD).getTime()) / 86400000)
      : 1;
  const pct = (d: string) =>
    minD ? ((new Date(d).getTime() - new Date(minD).getTime()) / 86400000 / span) * 100 : 0;
  const today = todayStr();

  const grouped = (["active", "planned", "hold", "done"] as const).map((s) => ({
    status: s,
    list: prjs.filter((p) => p.status === s),
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">프로젝트</h1>
        <p className="mt-1 text-sm text-neutral-500">
          목표를 향한 구체적인 실행 단위 — 할 일을 붙여 계획하세요.
        </p>
      </header>

      <Card>
        <SectionTitle>새 프로젝트</SectionTitle>
        <form action={createProject} className="flex flex-wrap items-end gap-2">
          <input name="title" placeholder="프로젝트 (예: 해외 시장 진출)" required className="min-w-52 flex-1" />
          <select name="areaId" defaultValue="">
            <option value="">영역 없음</option>
            {areaList.filter((a) => !a.archived).map((a) => (
              <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
            ))}
          </select>
          <select name="goalId" defaultValue="">
            <option value="">연결 목표 없음</option>
            {goalList.filter((g) => g.status === "active").map((g) => (
              <option key={g.id} value={g.id}>🎯 {g.title}</option>
            ))}
          </select>
          <input type="date" name="startDate" title="시작일" />
          <span className="pb-2 text-neutral-300">~</span>
          <input type="date" name="endDate" title="종료일" />
          <button type="submit">추가</button>
        </form>
      </Card>

      {/* 타임라인 */}
      {dated.length > 0 && minD && maxD && (
        <Card>
          <SectionTitle>타임라인 ({fmtDate(minD)} ~ {fmtDate(maxD)})</SectionTitle>
          <div className="relative space-y-2 py-1">
            {/* 오늘 표시선 */}
            {today >= minD && today <= maxD && (
              <div
                className="absolute inset-y-0 z-10 w-px bg-red-400"
                style={{ left: `${pct(today)}%` }}
                title="오늘"
              />
            )}
            {dated.map((p) => {
              const st = statOf(p.id);
              const rate = st.total ? st.done / st.total : 0;
              const area = areaList.find((a) => a.id === p.areaId);
              return (
                <div key={p.id} className="relative h-8">
                  <Link
                    href={`/projects/${p.id}`}
                    className="absolute flex h-full items-center overflow-hidden rounded-lg bg-neutral-200 hover:ring-2 hover:ring-neutral-400"
                    style={{
                      left: `${pct(p.startDate!)}%`,
                      width: `${Math.max(4, pct(p.endDate!) - pct(p.startDate!))}%`,
                    }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-neutral-800"
                      style={{ width: `${rate * 100}%` }}
                    />
                    <span className="relative z-10 truncate px-2.5 text-xs font-medium text-white mix-blend-difference">
                      {area?.icon} {p.title} {st.total > 0 && `(${st.done}/${st.total})`}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {grouped.map(({ status, list }) =>
        list.length === 0 ? null : (
          <section key={status}>
            <SectionTitle>{STATUS_LABEL[status]} ({list.length})</SectionTitle>
            <div className="space-y-3">
              {list.map((p) => {
                const st = statOf(p.id);
                const area = areaList.find((a) => a.id === p.areaId);
                const goal = goalList.find((g) => g.id === p.goalId);
                return (
                  <Link key={p.id} href={`/projects/${p.id}`} className="block">
                    <Card className="transition hover:border-neutral-400">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          {area && <span>{area.icon}</span>}
                          <span className={`truncate font-semibold ${status === "done" ? "text-neutral-400 line-through" : ""}`}>
                            {p.title}
                          </span>
                          {goal && (
                            <span className="hidden truncate rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 sm:inline">
                              🎯 {goal.title}
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-xs text-neutral-500">
                          {p.startDate && p.endDate && (
                            <span>{fmtDate(p.startDate)} ~ {fmtDate(p.endDate)}</span>
                          )}
                          {status !== "done" && <DdayBadge label={ddayLabel(p.endDate)} />}
                        </div>
                      </div>
                      {st.total > 0 && (
                        <div className="mt-2.5">
                          <ProgressBar value={st.done / st.total} pillar={area?.pillar ?? "work"} />
                          <div className="mt-1 text-xs text-neutral-400">
                            할 일 {st.done}/{st.total} 완료 · {st.total - st.done}개 남음
                          </div>
                        </div>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )
      )}

      {prjs.length === 0 && <Empty>프로젝트가 없습니다. 위에서 추가해 보세요.</Empty>}
    </div>
  );
}
