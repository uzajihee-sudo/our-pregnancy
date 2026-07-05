# Vercel Deployment

이 프로젝트는 GitHub 연동 Vercel 배포로 운영합니다.

## Current Setup

- GitHub repo: `uzajihee-sudo/our-pregnancy`
- Production URL: `https://our-pregnancy-two.vercel.app`
- Auto deploy: `main` 브랜치 push 시 실행
- 공유 체크 저장소: private Vercel Blob
- 공유 코드 환경변수: `SHARED_CHECKLIST_CODE`

## First-Time Setup

1. GitHub 저장소를 만든 뒤 이 프로젝트 파일을 올립니다.
2. `https://vercel.com/new` 에서 저장소를 연결합니다.
3. Framework Preset은 `Other`로 둡니다.
4. Build Command와 Output Directory는 비워 둡니다.
5. Vercel 프로젝트 환경변수에 `SHARED_CHECKLIST_CODE` 를 추가합니다.
6. 공유 체크를 쓸 각 브라우저에서 같은 공유 코드를 입력합니다.

## Shared Sync

- 체크리스트 완료 상태는 브라우저끼리 공유됩니다.
- `공유 코드`가 맞지 않으면 동기화가 거부됩니다.
- 공유 코드는 브라우저 `localStorage`에만 저장됩니다.
- 서버에는 완료 상태만 저장하고, 프로필 기준값은 앱에 고정돼 있습니다.

## Update Flow

- 새 혜택은 `업데이트 확인` 섹션에서 따로 표시합니다.
- 최신 배포 반영은 Vercel의 자동 배포로 처리합니다.
