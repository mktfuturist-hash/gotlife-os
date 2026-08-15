import { db, areas } from "@/db";
import { asc } from "drizzle-orm";
import { createArea, toggleAreaArchived } from "@/lib/actions";
import { Card, Empty, PILLARS, PillarChip, SectionTitle, type Pillar } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AreasPage() {
  const all = await db.select().from(areas).orderBy(asc(areas.sort), asc(areas.id));
  const active = all.filter((a) => !a.archived);
  const archived = all.filter((a) => a.archived);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">영역</h1>
        <p className="mt-1 text-sm text-neutral-500">
          인생을 구성하는 최상위 카테고리. 영역에서 목표·프로젝트·노트가 뻗어나갑니다.
        </p>
      </header>

      <Card>
        <SectionTitle>새 영역 추가</SectionTitle>
        <form action={createArea} className="flex flex-wrap items-end gap-2">
          <input name="icon" placeholder="🏃" className="w-16 text-center" maxLength={4} />
          <input name="name" placeholder="영역 이름 (예: 건강)" required className="w-44" />
          <select name="pillar" defaultValue="life">
            <option value="work">일</option>
            <option value="life">삶</option>
            <option value="money">돈</option>
          </select>
          <input name="guideline" placeholder="이 영역에서 나는 어떤 사람이 되고 싶은가?" className="min-w-60 flex-1" />
          <button type="submit">추가</button>
        </form>
      </Card>

      {(["work", "life", "money"] as Pillar[]).map((pillar) => {
        const list = active.filter((a) => a.pillar === pillar);
        return (
          <section key={pillar}>
            <SectionTitle>
              {PILLARS[pillar].icon} {PILLARS[pillar].label}
            </SectionTitle>
            {list.length === 0 ? (
              <Empty>아직 영역이 없습니다</Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {list.map((a) => (
                  <Card key={a.id} className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{a.icon}</span>
                        <span className="font-semibold">{a.name}</span>
                        <PillarChip pillar={a.pillar} />
                      </div>
                      {a.guideline && (
                        <p className="mt-1.5 text-sm text-neutral-500">{a.guideline}</p>
                      )}
                    </div>
                    <form action={toggleAreaArchived.bind(null, a.id, true)}>
                      <button className="text-xs text-neutral-400 hover:text-neutral-600">
                        보관
                      </button>
                    </form>
                  </Card>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {archived.length > 0 && (
        <section>
          <SectionTitle>보관됨</SectionTitle>
          <div className="space-y-2">
            {archived.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm text-neutral-400">
                <span>{a.icon} {a.name}</span>
                <form action={toggleAreaArchived.bind(null, a.id, false)}>
                  <button className="text-xs underline hover:text-neutral-600">복원</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
