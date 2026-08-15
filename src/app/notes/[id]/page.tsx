import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, notes, areas, goals, projects } from "@/db";
import { updateNote, deleteNote } from "@/lib/actions";
import { Card, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

// 갓생 OS의 노트 필기 양식 4종을 마크다운 템플릿으로
const NOTE_TEMPLATES = [
  { name: "생각 정리", body: "## 상황\n\n## 내 생각\n\n## 결론 / 다음 행동\n" },
  { name: "아이디어", body: "## 아이디어 한 줄\n\n## 왜 필요한가\n\n## 최소 실험 방법\n" },
  { name: "책·아티클 요약", body: "## 출처\n\n## 핵심 요약 3줄\n1. \n2. \n3. \n\n## 내 삶에 적용할 것\n" },
  { name: "레퍼런스 모음", body: "## 주제\n\n| 자료 | 링크 | 메모 |\n|---|---|---|\n|  |  |  |\n" },
];

export default async function NoteDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();

  const [n] = await db.select().from(notes).where(eq(notes.id, id));
  if (!n) notFound();

  const [areaList, goalList, prjList] = await Promise.all([
    db.select().from(areas),
    db.select().from(goals),
    db.select().from(projects),
  ]);

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link href="/notes" className="text-neutral-400 hover:text-neutral-600">← 노트 목록</Link>
      </div>

      <Card>
        <form action={updateNote.bind(null, n.id)} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input name="title" defaultValue={n.title} required className="min-w-52 flex-1 text-base font-semibold" />
            <select name="type" defaultValue={n.type}>
              <option value="note">📝 노트</option>
              <option value="file">📎 파일</option>
              <option value="link">🔗 링크</option>
              <option value="reference">📚 레퍼런스</option>
            </select>
            <select name="importance" defaultValue={n.importance}>
              <option value="1">★</option>
              <option value="2">★★</option>
              <option value="3">★★★</option>
            </select>
            <select name="status" defaultValue={n.status}>
              <option value="active">활성</option>
              <option value="archived">보관</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <select name="areaId" defaultValue={n.areaId ?? ""}>
              <option value="">영역 없음</option>
              {areaList.filter((a) => !a.archived).map((a) => (
                <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
              ))}
            </select>
            <select name="goalId" defaultValue={n.goalId ?? ""}>
              <option value="">목표 없음</option>
              {goalList.map((g) => (
                <option key={g.id} value={g.id}>🎯 {g.title}</option>
              ))}
            </select>
            <select name="projectId" defaultValue={n.projectId ?? ""}>
              <option value="">프로젝트 없음</option>
              {prjList.map((p) => (
                <option key={p.id} value={p.id}>📁 {p.title}</option>
              ))}
            </select>
            <input name="url" defaultValue={n.url ?? ""} placeholder="관련 링크 (선택)" className="min-w-48 flex-1" />
          </div>
          <textarea
            name="bodyMd"
            defaultValue={n.bodyMd ?? ""}
            rows={16}
            placeholder="마크다운으로 자유롭게 작성하세요"
            className="w-full font-mono text-sm leading-relaxed"
          />
          <div className="flex items-center gap-2">
            <button type="submit">저장</button>
            {n.url && (
              <a href={n.url} target="_blank" rel="noreferrer" className="btn-ghost text-xs">
                링크 열기 ↗
              </a>
            )}
            <button
              formAction={deleteNote.bind(null, n.id)}
              className="ml-auto text-xs text-neutral-400 hover:text-red-500"
            >
              삭제
            </button>
          </div>
        </form>
      </Card>

      {!n.bodyMd && (
        <Card>
          <SectionTitle>필기 양식에서 시작하기</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {NOTE_TEMPLATES.map((t) => (
              <form key={t.name} action={updateNote.bind(null, n.id)}>
                <input type="hidden" name="title" value={n.title} />
                <input type="hidden" name="type" value={n.type} />
                <input type="hidden" name="importance" value={n.importance} />
                <input type="hidden" name="status" value={n.status} />
                <input type="hidden" name="areaId" value={n.areaId ?? ""} />
                <input type="hidden" name="goalId" value={n.goalId ?? ""} />
                <input type="hidden" name="projectId" value={n.projectId ?? ""} />
                <input type="hidden" name="url" value={n.url ?? ""} />
                <input type="hidden" name="bodyMd" value={t.body} />
                <button className="btn-ghost text-sm">{t.name}</button>
              </form>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
