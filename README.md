# 갓생 OS

일 · 삶 · 돈 세 기둥으로 목표를 정리하고, 달성 여부와 진척을 한눈에 보는 1인용 인생 관리 웹앱.

저스트그로우 「갓생 노션 OS」의 관계형 엔진(영역 → 목표·마일스톤 → 프로젝트·할일 → 루틴 → 노트 → 계획/회고)에
공여사들 「노션 템플릿 30종」의 WORK/LIFE/MONEY 3분할과 머니보드를 결합한 구조. 설계 문서: [docs/superpowers/specs](docs/superpowers/specs/2026-08-15-gotlife-os-design.md)

## 노션 대비 차별점

- **자동 진척률 엔진** — 목표마다 측정 방식을 선택: 마일스톤 체크 / 수치 입력 / 루틴 실행 횟수 / 프로젝트 할일 완료율 / **계좌 잔액** ("3년 안 1억"이 저절로 추적됨)
- **머니보드** — 계좌 잔액 갱신 → 월별 스냅샷 → 순자산 추이. 가계부 → 월 지출 구조·저축률
- **원터치 루틴** — 클릭 한 번으로 기록, 스트릭·28일 히트맵

## 로컬 실행

```bash
npm install
npm run db:push   # 로컬 내장 Postgres(.data/pglite)에 테이블 생성
npm run dev
```

환경변수 없이 바로 동작합니다 (DB: PGlite, 인증: 바이패스).

## Vercel 배포

1. Supabase 프로젝트 생성 → `DATABASE_URL` 확보
2. `DATABASE_URL=... npm run db:push` 로 테이블 생성
3. Google OAuth 클라이언트 생성 (리디렉션 URI: `https://<도메인>/api/auth/callback/google`)
4. Vercel에 저장소 연결, `.env.example`의 4개 변수 설정
5. 배포 후 휴대폰 브라우저에서 "홈 화면에 추가" → PWA로 사용

## 구조

```
src/db/schema.ts       13개 테이블 (areas, goals, milestones, projects, tasks, kpis,
                       routines, routine_logs, notes, reviews, money_accounts,
                       money_snapshots, money_txns)
src/lib/progress.ts    목표 진척률 엔진
src/lib/actions.ts     서버 액션 전부
src/app/               페이지 (/ 올인원, /goals, /projects, /tasks, /routines,
                       /notes, /reviews, /money, /areas)
```
