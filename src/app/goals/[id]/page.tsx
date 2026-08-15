import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db, goals, milestones, areas, moneyAccounts } from "@/db";
import {
  updateGoal, deleteGoal, addMilestone, toggleMilestone, deleteMilestone, setGoalStatus,
} from "@/lib/actions";
import { getGoalsWithProgress } from "@/lib/progress";
import { ddayLabel, fmtDate } from "@/lib/dates";
import { Card, DdayBadge, Empty, ProgressBar, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function GoalDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();

  const [g] = await db.select().from(goals).where(eq(goals.id, id));
  if (!g) notFound();

  const [ms, areaList, accts, withProgress] = await Promise.all([
    db.select().from(milestones).where(eq(milestones.goalId, id)).orderBy(asc(milestones.dueDate), asc(milestones.id)),
    db.select().from(areas).orderBy(asc(areas.sort), asc(areas.id)),
    db.select().from(moneyAccounts),
    getGoalsWithProgress(),
  ]);
  const gp = withProgress.find((x) => x.id === id);
  const area = areaList.find((a) => a.id === g.areaId);
  const next = gp?.nextMilestone ?? null;

  return (
    <div className="space-y-8">
      <div className="text-sm">
        <Link href="/goals" className="text-neutral-400 hover:text-neutral-600">← 목표 목록</Link>
      </div>

      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">
            {area && <span className="mr-1.5">{area.icon}</span>}
            {g.title}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <DdayBadge label={ddayLabel(g.dueDate, g.status === "done")} />
            {g.status !== "done" ? (
              <form action={setGoalStatus.bind(null, g.id, "done")}>
                <button className="btn-ghost text-xs">달성 처리</button>
              </form>
            ) : (
              <form action={setGoalStatus.bind(null, g.id, "active")}>
                <button className="btn-ghost text-xs">다시 진행</button>
              </form>
            )}
          </div>
        </div>
        <ProgressBar value={gp?.progress ?? null} pillar={area?.pillar ?? "life"} />
        {next && (
          <p className="text-sm text-neutral-500">
            🚩 다음 마일스톤: <b>{next.title}</b>
            {next.dueDate && ` — ${fmtDate(next.dueDate)} (${ddayLabel(next.dueDate)})`}
          </p>
        )}
      </header>

      <Card>
        <SectionTitle>마일스톤 ({gp?.milestoneDone ?? 0}/{gp?.milestoneTotal ?? 0})</SectionTitle>
        {ms.length === 0 ? (
          <Empty>목표까지의 중간 체크포인트를 추가해 보세요</Empty>
        ) : (
          <ul className="space-y-1.5">
            {ms.map((m) => (
              <li key={m.id} className="group flex items-center gap-2.5">
                <form action={toggleMilestone.bind(null, m.id, !m.done)}>
                  <button
                    className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs ${
                      m.done
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 bg-white text-transparent hover:border-neutral-500"
                    }`}
                    aria-label="완료 토글"
                  >
                    ✓
                  </button>
                </form>
                <span className={`flex-1 text-sm ${m.done ? "text-neutral-400 line-through" : ""}`}>
                  {m.title}
                </span>
                {m.dueDate && (
                  <span className="text-xs tabular-nums text-neutral-400">{fmtDate(m.dueDate)}</span>
                )}
                <form action={deleteMilestone.bind(null, m.id)}>
                  <button className="invisible text-xs text-neutral-300 hover:text-red-500 group-hover:visible">
                    삭제
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addMilestone.bind(null, g.id)} className="mt-3 flex gap-2 border-t border-neutral-100 pt-3">
          <input name="title" placeholder="새 마일스톤" required className="flex-1" />
          <input type="date" name="dueDate" />
          <button type="submit">추가</button>
        </form>
      </Card>

      <Card>
        <SectionTitle>목표 설정</SectionTitle>
        <form action={updateGoal.bind(null, g.id)} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-neutral-500">제목</span>
            <input name="title" defaultValue={g.title} required className="w-full" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-neutral-500">영역</span>
            <select name="areaId" defaultValue={g.areaId ?? ""} className="w-full">
              <option value="">없음</option>
              {areaList.filter((a) => !a.archived).map((a) => (
                <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-neutral-500">기한</span>
            <input type="date" name="dueDate" defaultValue={g.dueDate ?? ""} className="w-full" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-neutral-500">상태</span>
            <select name="status" defaultValue={g.status} className="w-full">
              <option value="active">진행 중</option>
              <option value="hold">보류</option>
              <option value="done">달성</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-xs text-neutral-500">설명</span>
            <input name="description" defaultValue={g.description ?? ""} className="w-full" placeholder="이 목표에 대한 간단한 설명" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-neutral-500">진척 측정 방식</span>
            <select name="metricType" defaultValue={g.metricType} className="w-full">
              <option value="milestone">마일스톤 체크</option>
              <option value="manual">수치 직접 입력</option>
              <option value="routine_count">루틴 실행 횟수</option>
              <option value="task_rate">프로젝트 할일 완료율</option>
              <option value="money">계좌 잔액</option>
            </select>
          </label>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <label>
              <span className="mb-1 block text-xs text-neutral-500">현재값</span>
              <input name="metricCurrent" defaultValue={g.metricCurrent ?? ""} className="w-full" inputMode="decimal" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-neutral-500">목표값</span>
              <input name="metricTarget" defaultValue={g.metricTarget ?? ""} className="w-full" inputMode="decimal" />
            </label>
            <label>
              <span className="mb-1 block text-xs text-neutral-500">단위</span>
              <input name="metricUnit" defaultValue={g.metricUnit ?? ""} className="w-full" placeholder="kg, 회, 원…" />
            </label>
          </div>
          {g.metricType === "money" && (
            <label className="text-sm">
              <span className="mb-1 block text-xs text-neutral-500">연결 계좌</span>
              <select name="moneyAccountId" defaultValue={g.moneyAccountId ?? ""} className="w-full">
                <option value="">없음</option>
                {accts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
          )}
          <div className="flex items-end gap-2 sm:col-span-2">
            <button type="submit">저장</button>
          </div>
        </form>
        <form action={deleteGoal.bind(null, g.id)} className="mt-3 border-t border-neutral-100 pt-3">
          <button className="text-xs text-neutral-400 hover:text-red-500">이 목표 삭제</button>
        </form>
      </Card>
    </div>
  );
}
