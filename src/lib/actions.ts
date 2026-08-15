"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gte, lt } from "drizzle-orm";
import {
  db, areas, goals, milestones, tasks, projects, kpis, routines, routineLogs,
  moneyAccounts, moneySnapshots, moneyTxns, notes, reviews,
} from "@/db";
import { monthStr, todayStr } from "@/lib/dates";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}
function num(fd: FormData, key: string): number | null {
  const s = str(fd, key);
  if (s == null) return null;
  const n = Number(s.replaceAll(",", ""));
  return Number.isFinite(n) ? n : null;
}

function refresh() {
  revalidatePath("/", "layout");
}

// ── 영역 ──
export async function createArea(fd: FormData) {
  const name = str(fd, "name");
  if (!name) return;
  await db.insert(areas).values({
    name,
    icon: str(fd, "icon"),
    pillar: (str(fd, "pillar") ?? "life") as "work" | "life" | "money",
    guideline: str(fd, "guideline"),
  });
  refresh();
}

export async function updateArea(id: number, fd: FormData) {
  const name = str(fd, "name");
  if (!name) return;
  await db
    .update(areas)
    .set({
      name,
      icon: str(fd, "icon"),
      pillar: (str(fd, "pillar") ?? "life") as "work" | "life" | "money",
      guideline: str(fd, "guideline"),
    })
    .where(eq(areas.id, id));
  refresh();
}

export async function toggleAreaArchived(id: number, archived: boolean) {
  await db.update(areas).set({ archived }).where(eq(areas.id, id));
  refresh();
}

// ── 목표 ──
export async function createGoal(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  const [g] = await db
    .insert(goals)
    .values({
      title,
      areaId: num(fd, "areaId"),
      dueDate: str(fd, "dueDate"),
      description: str(fd, "description"),
      metricType: (str(fd, "metricType") ?? "milestone") as
        | "manual" | "milestone" | "routine_count" | "task_rate" | "money",
      metricTarget: num(fd, "metricTarget"),
      metricCurrent: num(fd, "metricCurrent"),
      metricUnit: str(fd, "metricUnit"),
      moneyAccountId: num(fd, "moneyAccountId"),
    })
    .returning({ id: goals.id });
  refresh();
  redirect(`/goals/${g.id}`);
}

export async function updateGoal(id: number, fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db
    .update(goals)
    .set({
      title,
      areaId: num(fd, "areaId"),
      dueDate: str(fd, "dueDate"),
      description: str(fd, "description"),
      status: (str(fd, "status") ?? "active") as "active" | "done" | "hold",
      metricType: (str(fd, "metricType") ?? "milestone") as
        | "manual" | "milestone" | "routine_count" | "task_rate" | "money",
      metricTarget: num(fd, "metricTarget"),
      metricCurrent: num(fd, "metricCurrent"),
      metricUnit: str(fd, "metricUnit"),
      moneyAccountId: num(fd, "moneyAccountId"),
    })
    .where(eq(goals.id, id));
  refresh();
}

export async function setGoalStatus(id: number, status: "active" | "done" | "hold") {
  await db.update(goals).set({ status }).where(eq(goals.id, id));
  refresh();
}

export async function deleteGoal(id: number) {
  await db.delete(milestones).where(eq(milestones.goalId, id));
  await db.delete(goals).where(eq(goals.id, id));
  refresh();
  redirect("/goals");
}

// ── 마일스톤 ──
export async function addMilestone(goalId: number, fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db.insert(milestones).values({ goalId, title, dueDate: str(fd, "dueDate") });
  refresh();
}

export async function toggleMilestone(id: number, done: boolean) {
  await db
    .update(milestones)
    .set({ done, doneAt: done ? new Date() : null })
    .where(eq(milestones.id, id));
  refresh();
}

export async function deleteMilestone(id: number) {
  await db.delete(milestones).where(eq(milestones.id, id));
  refresh();
}

// ── 할 일 ──
export async function createTask(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db.insert(tasks).values({
    title,
    projectId: num(fd, "projectId"),
    areaId: num(fd, "areaId"),
    dueDate: str(fd, "dueDate"), // 없고 프로젝트도 없으면 자동으로 인박스
  });
  refresh();
}

export async function toggleTask(id: number, done: boolean) {
  await db
    .update(tasks)
    .set({ done, doneAt: done ? new Date() : null })
    .where(eq(tasks.id, id));
  refresh();
}

export async function setTaskDue(id: number, dueDate: string | null) {
  await db.update(tasks).set({ dueDate }).where(eq(tasks.id, id));
  refresh();
}

export async function setTaskDueToday(id: number) {
  await setTaskDue(id, todayStr());
}

export async function updateTask(id: number, fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db
    .update(tasks)
    .set({
      title,
      dueDate: str(fd, "dueDate"),
      projectId: num(fd, "projectId"),
      areaId: num(fd, "areaId"),
    })
    .where(eq(tasks.id, id));
  refresh();
}

export async function deleteTask(id: number) {
  await db.delete(tasks).where(eq(tasks.id, id));
  refresh();
}

// ── 프로젝트 ──
export async function createProject(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  const [p] = await db
    .insert(projects)
    .values({
      title,
      areaId: num(fd, "areaId"),
      goalId: num(fd, "goalId"),
      purpose: str(fd, "purpose"),
      startDate: str(fd, "startDate"),
      endDate: str(fd, "endDate"),
    })
    .returning({ id: projects.id });
  refresh();
  redirect(`/projects/${p.id}`);
}

export async function updateProject(id: number, fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db
    .update(projects)
    .set({
      title,
      areaId: num(fd, "areaId"),
      goalId: num(fd, "goalId"),
      purpose: str(fd, "purpose"),
      startDate: str(fd, "startDate"),
      endDate: str(fd, "endDate"),
      status: (str(fd, "status") ?? "active") as "planned" | "active" | "done" | "hold",
      guideline: str(fd, "guideline"),
      retro: str(fd, "retro"),
    })
    .where(eq(projects.id, id));
  refresh();
}

export async function deleteProject(id: number) {
  await db.update(tasks).set({ projectId: null }).where(eq(tasks.projectId, id));
  await db.delete(kpis).where(eq(kpis.projectId, id));
  await db.delete(projects).where(eq(projects.id, id));
  refresh();
  redirect("/projects");
}

// ── KPI ──
export async function addKpi(projectId: number, fd: FormData) {
  const name = str(fd, "name");
  if (!name) return;
  await db.insert(kpis).values({
    projectId,
    name,
    target: num(fd, "target"),
    actual: num(fd, "actual"),
    unit: str(fd, "unit"),
  });
  refresh();
}

export async function updateKpi(id: number, fd: FormData) {
  await db
    .update(kpis)
    .set({ target: num(fd, "target"), actual: num(fd, "actual") })
    .where(eq(kpis.id, id));
  refresh();
}

export async function deleteKpi(id: number) {
  await db.delete(kpis).where(eq(kpis.id, id));
  refresh();
}

// ── 루틴 ──
export async function createRoutine(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db.insert(routines).values({
    title,
    goalId: num(fd, "goalId"),
    areaId: num(fd, "areaId"),
    targetFreqWeekly: num(fd, "targetFreqWeekly"),
  });
  refresh();
}

export async function setRoutineStatus(id: number, status: "active" | "stopped") {
  await db.update(routines).set({ status }).where(eq(routines.id, id));
  refresh();
}

export async function deleteRoutine(id: number) {
  await db.delete(routines).where(eq(routines.id, id));
  refresh();
}

/** 원터치 루틴 기록 — 클릭 시각 자동 저장 (갓생 OS '루틴 기록' 버튼) */
export async function logRoutine(id: number) {
  await db.insert(routineLogs).values({ routineId: id });
  refresh();
}

// ── 노트 ──
export async function createNote(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  const [n] = await db
    .insert(notes)
    .values({
      title,
      type: (str(fd, "type") ?? "note") as "note" | "file" | "link" | "reference",
      importance: num(fd, "importance") ?? 1,
      areaId: num(fd, "areaId"),
      goalId: num(fd, "goalId"),
      projectId: num(fd, "projectId"),
      url: str(fd, "url"),
      bodyMd: str(fd, "bodyMd"),
    })
    .returning({ id: notes.id });
  refresh();
  redirect(`/notes/${n.id}`);
}

export async function updateNote(id: number, fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db
    .update(notes)
    .set({
      title,
      type: (str(fd, "type") ?? "note") as "note" | "file" | "link" | "reference",
      importance: num(fd, "importance") ?? 1,
      status: (str(fd, "status") ?? "active") as "active" | "archived",
      areaId: num(fd, "areaId"),
      goalId: num(fd, "goalId"),
      projectId: num(fd, "projectId"),
      url: str(fd, "url"),
      bodyMd: str(fd, "bodyMd"),
    })
    .where(eq(notes.id, id));
  refresh();
}

export async function deleteNote(id: number) {
  await db.delete(notes).where(eq(notes.id, id));
  refresh();
  redirect("/notes");
}

// ── 계획·회고 ──
const PLAN_TEMPLATES: Record<string, { plan: string; retro: string }> = {
  daily: {
    plan: "## 오늘의 최우선 3가지\n1. \n2. \n3. \n\n## 오늘의 다짐\n",
    retro: "## 잘한 것\n- \n\n## 아쉬운 것\n- \n\n## 내일 다르게 할 것\n- \n\n## 오늘의 한 줄\n",
  },
  weekly: {
    plan: "## 이번 주 목표\n- \n\n## 요일별 핵심 일정\n- 월: \n- 화: \n- 수: \n- 목: \n- 금: \n- 주말: \n",
    retro: "## 이번 주 성과\n- \n\n## 진척이 없었던 것과 이유\n- \n\n## 다음 주에 집중할 것\n- \n",
  },
  monthly: {
    plan: "## 이번 달 목표 (영역별)\n- 일: \n- 삶: \n- 돈: \n\n## 이번 달의 테마\n",
    retro: "## 목표 대비 결과\n- \n\n## 이번 달 배운 것\n- \n\n## 다음 달 조정할 것\n- \n",
  },
};

/** 오늘 날짜 기준으로 해당 스코프의 계획·회고 생성 (있으면 그 페이지로 이동) */
export async function createReview(scope: "daily" | "weekly" | "monthly") {
  const today = todayStr();
  let date = today;
  if (scope === "weekly") {
    // 이번 주 월요일
    const d = new Date(today + "T00:00:00+09:00");
    const diff = (d.getDay() + 6) % 7;
    date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
      new Date(d.getTime() - diff * 86400000)
    );
  } else if (scope === "monthly") {
    date = today.slice(0, 7) + "-01";
  }
  const existing = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.scope, scope), eq(reviews.date, date)));
  if (existing.length) {
    redirect(`/reviews/${existing[0].id}`);
  }
  const tpl = PLAN_TEMPLATES[scope];
  const [r] = await db
    .insert(reviews)
    .values({ scope, date, planMd: tpl.plan, retroMd: tpl.retro })
    .returning({ id: reviews.id });
  refresh();
  redirect(`/reviews/${r.id}`);
}

export async function updateReview(id: number, fd: FormData) {
  await db
    .update(reviews)
    .set({ planMd: str(fd, "planMd"), retroMd: str(fd, "retroMd") })
    .where(eq(reviews.id, id));
  refresh();
}

export async function deleteReview(id: number) {
  await db.delete(reviews).where(eq(reviews.id, id));
  refresh();
  redirect("/reviews");
}

// ── 돈: 계좌 ──
type AccountType = "savings" | "invest" | "realestate" | "loan" | "pension";

async function snapshotAccount(accountId: number, balance: number) {
  const month = monthStr();
  const existing = await db
    .select()
    .from(moneySnapshots)
    .where(and(eq(moneySnapshots.accountId, accountId), eq(moneySnapshots.month, month)));
  if (existing.length) {
    await db
      .update(moneySnapshots)
      .set({ balance })
      .where(eq(moneySnapshots.id, existing[0].id));
  } else {
    await db.insert(moneySnapshots).values({ accountId, month, balance });
  }
}

export async function createAccount(fd: FormData) {
  const name = str(fd, "name");
  if (!name) return;
  const balance = num(fd, "balance") ?? 0;
  const [a] = await db
    .insert(moneyAccounts)
    .values({ name, type: (str(fd, "type") ?? "savings") as AccountType, balance })
    .returning({ id: moneyAccounts.id });
  await snapshotAccount(a.id, balance);
  refresh();
}

/** 잔액 수기 갱신 — 이번 달 스냅샷도 함께 기록 (순자산 추이의 원천) */
export async function updateAccountBalance(id: number, fd: FormData) {
  const balance = num(fd, "balance");
  if (balance == null) return;
  await db
    .update(moneyAccounts)
    .set({ balance, updatedAt: new Date() })
    .where(eq(moneyAccounts.id, id));
  await snapshotAccount(id, balance);
  refresh();
}

export async function deleteAccount(id: number) {
  await db.update(moneyTxns).set({ accountId: null }).where(eq(moneyTxns.accountId, id));
  await db.delete(moneyAccounts).where(eq(moneyAccounts.id, id));
  refresh();
}

// ── 돈: 일일가계부 ──
export async function addTxn(fd: FormData) {
  const amount = num(fd, "amount");
  const category = str(fd, "category");
  if (!amount || !category) return;
  await db.insert(moneyTxns).values({
    date: str(fd, "date") ?? todayStr(),
    amount: Math.abs(amount),
    direction: (str(fd, "direction") ?? "expense") as "income" | "expense",
    category,
    accountId: num(fd, "accountId"),
    memo: str(fd, "memo"),
  });
  refresh();
}

export async function deleteTxn(id: number) {
  await db.delete(moneyTxns).where(eq(moneyTxns.id, id));
  refresh();
}

/** 오늘 기록 취소 (실수 클릭 복구) */
export async function unlogRoutineToday(id: number) {
  const today = todayStr();
  const start = new Date(today + "T00:00:00+09:00");
  const end = new Date(start.getTime() + 86400000);
  await db
    .delete(routineLogs)
    .where(
      and(
        eq(routineLogs.routineId, id),
        gte(routineLogs.loggedAt, start),
        lt(routineLogs.loggedAt, end)
      )
    );
  refresh();
}
