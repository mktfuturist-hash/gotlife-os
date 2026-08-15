"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, areas, goals, milestones, tasks } from "@/db";
import { todayStr } from "@/lib/dates";

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
