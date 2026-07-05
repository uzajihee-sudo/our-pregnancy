# 우리 임신 타임라인

부부가 함께 쓰는 임신 일정, 체크리스트, 지역 혜택 정리 앱입니다.

## Live

- Production: https://our-pregnancy-two.vercel.app
- GitHub: https://github.com/uzajihee-sudo/our-pregnancy

## Fixed Baseline

- 마지막 생리 시작일: `2026-05-23`
- 출산예정일: `2027-02-26`
- 거주지역: `경기도 고양시 덕양구`

## What It Does

- 현재 주차와 D-day를 자동 계산합니다.
- 주차별 체크리스트를 현재/예정/완료 상태로 나눠 보여줍니다.
- `지역 혜택` 패널에서 보건소, 지자체, 지역 확인 항목을 묶어서 보여줍니다.
- `업데이트 확인` 패널에서 새로 추가된 혜택을 따로 보여줍니다.
- 체크 상태는 두 기기에서 공유됩니다.

## Data Model

- 기준 정보는 앱에 고정되어 있습니다.
- 체크 상태는 `Vercel Blob`의 private store에 저장합니다.
- 각 브라우저는 `localStorage`에 공유 코드, 대기 중 변경, UI 상태를 캐시합니다.
- 공유 코드가 없거나 틀리면 동기화가 막힙니다.

## Shared Sync

- 공유 체크 API: `/api/shared-checklist`
- 인증 방식: 요청 헤더 `x-shared-code`
- 서버 비밀값: `SHARED_CHECKLIST_CODE`

같은 공유 코드를 두 브라우저에 모두 넣어야 체크 상태가 동기화됩니다.

## Local Development

```sh
vercel pull --yes --environment preview
vercel dev
```

`vercel pull` 로 내려온 `.env.local` 에 Blob 관련 환경변수가 들어갑니다. 공유 동기화를 쓰려면 `SHARED_CHECKLIST_CODE` 도 같은 값으로 맞춰야 합니다.

## Deployment

- Deploy guide: [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)
- Current Vercel project: linked to GitHub `main`
- Deployment is automatic on push

## Source Notes

- 메인 변경 내역은 [SESSION_NOTES.md](./SESSION_NOTES.md)에 남겨두었습니다.
