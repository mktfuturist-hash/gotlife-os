import Link from "next/link";
import { db, areas } from "@/db";
import { asc } from "drizzle-orm";
import { getGoalsWithProgress } from "@/lib/progress";
import { createGoal } from "@/lib/actions";
import { ddayLabel, fmtDate } from "@/lib/dates";
import {
  Card, DdayBadge, Empty, ProgressBar, SectionTitle,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const METRIC_LABEL: Record<string, string> = {
  milestone: "마일스톤 체크",
  manual: "수치 직접 입력",
  routine_count: "루틴 실행 횟수",
  task_rate: "프로젝트 할일 완료율",
  money: "계좌 잔액",
};

export default async function GoalsPage() {
  const [gs, areaList] = await Promise.all([
    getGoalsWithProgress(),
    db.select().from(areas).orderBy(asc(areas.sort), asc(areas.id)),
  ]);
  const activeAreas = areaList.filter((a) => !a.archived);
  const active = gs.filter((g) => g.status === "active");
  const done = gs.filter((g) => g.status === "done");
  const hold = gs.filter((g) => g.status === "hold");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">목표</h1>
        <p className="mt-1 text-sm text-neutral-500">
          기한과 측정 방식을 정하면 진척률이 자동으로 계산됩니다.
        </p>
      </header>

      <Card>
        <SectionTitle>새 목표</SectionTitle>
        <form action={createGoal} className="flex flex-wrap items-end gap-2">
          <input name="title" placeholder="목표 (예: 72kg까지 감량)" required className="min-w-56 flex-1" />
          <select name="areaId" defaultValue="">
            <option value="">영역 없음</option>
            {activeAreas.map((a) => (
              <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
            ))}
          </select>
          <input type="date" name="dueDate" />
          <select name="metricType" defaultValue="milestone">
            {Object.entries(METRIC_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button type="submit">추가</button>
        </form>
      </Card>

      <section>
        <SectionTitle>진행 중 ({active.length})</SectionTitle>
        {active.length === 0 ? (
          <Empty>진행 중인 목표가 없습니다. 위에서 첫 목표를 추가해 보세요.</Empty>
        ) : (
          <div className="space-y-3">
            {active.map((g) => {
              const area = areaList.find((a) => a.id === g.areaId);
              return (
                <Link key={g.id} href={`/goals/${g.id}`} className="block">
                  <Card className="transition hover:border-neutral-400">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {area && <span>{area.icon}</span>}
                        <span className="truncate font-semibold">{g.title}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs text-neutral-500">
                        {g.dueDate && <span>{fmtDate(g.dueDate)}</span>}
                        <DdayBadge label={ddayLabel(g.dueDate, false)} />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <ProgressBar value={g.progress} pillar={area?.pillar ?? "life"} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-400">
                      <span>{METRIC_LABEL[g.metricType]}</span>
                      {g.nextMilestone && (
                        <span>
                          다음: {g.nextMilestone.title}
                          {g.nextMilestone.dueDate && ` (${fmtDate(g.nextMilestone.dueDate)})`}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {hold.length > 0 && (
        <section>
          <SectionTitle>보류 ({hold.length})</SectionTitle>
          <div className="space-y-2">
            {hold.map((g) => (
              <Link key={g.id} href={`/goals/${g.id}`} className="block text-sm text-neutral-500 hover:underline">
                ⏸️ {g.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <SectionTitle>달성 🎉 ({done.length})</SectionTitle>
          <div className="space-y-2">
            {done.map((g) => (
              <Link key={g.id} href={`/goals/${g.id}`} className="block text-sm text-neutral-400 line-through hover:underline">
                {g.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
