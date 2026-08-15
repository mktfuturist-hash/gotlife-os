import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, reviews } from "@/db";
import { updateReview, deleteReview } from "@/lib/actions";
import { fmtDate } from "@/lib/dates";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

const SCOPE_LABEL = { daily: "일간", weekly: "주간", monthly: "월간" } as const;

export default async function ReviewDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();

  const [r] = await db.select().from(reviews).where(eq(reviews.id, id));
  if (!r) notFound();

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link href="/reviews" className="text-neutral-400 hover:text-neutral-600">← 계획·회고 목록</Link>
      </div>

      <header>
        <h1 className="text-2xl font-bold">
          {fmtDate(r.date)} <span className="text-lg text-neutral-400">{SCOPE_LABEL[r.scope]}</span>
        </h1>
      </header>

      <form action={updateReview.bind(null, r.id)}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-blue-600">📋 계획</h2>
            <textarea
              name="planMd"
              defaultValue={r.planMd ?? ""}
              rows={18}
              className="w-full font-mono text-sm leading-relaxed"
            />
          </Card>
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-emerald-600">🪞 회고</h2>
            <textarea
              name="retroMd"
              defaultValue={r.retroMd ?? ""}
              rows={18}
              className="w-full font-mono text-sm leading-relaxed"
            />
          </Card>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="submit">저장</button>
          <button
            formAction={deleteReview.bind(null, r.id)}
            className="ml-auto text-xs text-neutral-400 hover:text-red-500"
          >
            삭제
          </button>
        </div>
      </form>
    </div>
  );
}
