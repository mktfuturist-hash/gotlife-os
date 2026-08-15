# 갓생 OS — 설계 문서

날짜: 2026-08-15 · 상태: 승인됨 (구현하며 수정 예정)

## 목적

일 / 삶 / 돈 세 기둥(pillar)으로 목표를 정리하고, 달성 여부와 진척 내용을 한눈에 보는 1인용 인생 관리 웹앱.

구조 출처:
- 저스트그로우 「갓생 노션 OS」의 관계형 엔진 — 영역 → 목표(마일스톤) → 프로젝트(할일·KPI) → 루틴 → 노트 → 계획/회고 + 올인원 대시보드 (사용 설명서 영상 자막 전문 분석 기반)
- 공여사들 「노션 템플릿 30종」의 WORK / LIFE / MONEY 3분할과 머니보드 개념

## 결정 사항

| 항목 | 결정 |
|---|---|
| 구현 방식 | Vercel 웹앱 (노션 아님) |
| 돈 범위 | 자산 스냅샷 + 일일가계부 둘 다 |
| 인증 | Google OAuth, mktfuturist@gmail.com 단일 계정 화이트리스트 |
| 노트/회고 에디터 | 노션식 블록 편집 재현하지 않음 — 마크다운 + 템플릿 프리필 |
| 로컬 개발 | DATABASE_URL 없으면 PGlite(내장 Postgres) 자동 폴백, AUTH 미설정 시 로그인 바이패스 |

## 스택

Next.js 15 (App Router) · Drizzle ORM (Postgres 스키마) · Supabase Postgres(프로덕션) / PGlite(로컬) · Auth.js Google · Tailwind + shadcn/ui · Recharts · PWA

## 데이터 모델 (12 + 스냅샷 = 13 테이블)

```
areas           id, name, icon, pillar(work|life|money), guideline, sort, archived
goals           id, area_id, title, desc, due_date, status,
                metric_type(manual|milestone|routine_count|task_rate|money),
                metric_target, metric_current, metric_unit, money_account_id?
milestones      id, goal_id, title, due_date, done, done_at
projects        id, area_id, goal_id?, title, purpose, start_date, end_date, status, guideline, retro
tasks           id, project_id?, area_id?, title, due_date?, done, done_at, priority
kpis            id, project_id, name, target, actual, unit
routines        id, goal_id?, area_id?, title, status(active|stopped), target_freq_weekly
routine_logs    id, routine_id, logged_at
notes           id, area_id?, goal_id?, project_id?, title, type(note|file|link|reference),
                importance(1|2|3), status(active|archived), body_md, url
reviews         id, scope(daily|weekly|monthly), date, plan_md, retro_md
money_accounts  id, type(예적금|투자|부동산|대출|보험연금), name, balance, updated_at
money_snapshots id, account_id, month, balance
money_txns      id, date, amount, direction(income|expense), category, account_id?, memo
```

핵심 규칙 (갓생 OS 이식):
- 상위 컨텍스트 자동 상속: 영역 페이지에서 목표 생성 시 area_id 자동 연결 (프로젝트·노트 동일)
- 다음 마일스톤 = 미완료 중 기한이 현재와 가장 가까운 1건
- 인박스 = project_id IS NULL AND due_date IS NULL 인 할일
- D-day = due_date 기준 자동 계산, 완료 시 "완료" 표시
- 루틴 기록 = 원터치 버튼, 클릭 시각 자동 저장

진척률 엔진 (goals.metric_type):
- milestone: 완료 마일스톤 수 / 전체
- routine_count: 연결 루틴 실행 횟수 / metric_target
- task_rate: 연결 프로젝트들의 할일 완료율
- money: 연결 계좌 잔액 / metric_target
- manual: metric_current / metric_target

## 화면 (9)

`/` 올인원(일│삶│돈 3열: 목표 진척바+D-day, 오늘 할일, 루틴 체크) ·
`/areas` · `/goals(/[id])` · `/projects(/[id])` 타임라인+리스트 ·
`/tasks` 오늘/예정/완료/인박스 + 빠른 입력 · `/routines` 체크+스트릭+히트맵 ·
`/notes` · `/reviews` 일/주/월 프리필 · `/money` 머니보드+가계부+계좌

모바일(PWA): 하단 탭바(홈·할일·루틴·가계부), 인박스 던지기·루틴 체크·지출 입력은 2탭 이내.

## 구현 순서

1. 뼈대: 셋업, 인증, areas/goals/milestones/tasks, 인박스
2. 실행 루프: projects+KPI, routines+로그, 올인원 v1
3. 돈: 계좌/스냅샷/가계부, 머니보드, money 진척 연동
4. 기록: 노트, 계획/회고, 차트·PWA 마감

## 범위 제외

노션식 자유 블록 편집 · 은행 API 자동연동(잔액 수기 갱신) · 다중 사용자/공유/푸시 알림
