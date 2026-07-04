# Our Pregnancy Web App - Session Notes

Date: 2026-07-04

## Goal

Build a pregnancy D-day / timeline web app. The direction shifted toward using YouTube content as source material for planning, especially videos about Korean pregnancy benefits and what to do after pregnancy confirmation.

## YouTube Video Checked

URL: https://youtu.be/J5pZH99xzAE?si=yjBH-kXXXyOoVWNz

Confirmed metadata:

- Title: 임산부 혜택 ‘이 순서’ 아니면 200만 원 날립니다 | 2026 최신버전 (임산부 필수시청)
- Channel: 맘생가이드
- Length: about 15:56
- Publish date: 2026-04-10

Relevant topics from the video description and chapters:

- Pregnancy confirmation: what to do first
- First-week early pregnancy checklist
- Pregnancy/childbirth medical expense support and 국민행복카드
- Public health center vs hospital flow
- Essential early pregnancy supplement timing
- Preparations to finish before 10 weeks
- Postpartum care center and 산후도우미 reservation timing
- Money-saving pregnancy benefits
- Fetal insurance timing
- Hidden pregnancy-only benefits
- Important correction: multiple pregnancy support amount needs latest official verification before being encoded in the app

## Browser / YouTube Attempts

What worked:

- Opened the video in the user's regular Google Chrome.
- Confirmed the regular Chrome tab title via AppleScript.
- Opened a separate debug Chrome instance with DevTools on port `9222`.
- Captured YouTube page screenshots from the debug Chrome.
- Started playback in the debug Chrome briefly.
- Opened YouTube's "스크립트" panel UI, but it did not load usable transcript text.

What did not work:

- `yt-dlp` is not installed.
- Direct timedtext API requests returned 0-byte responses, even though caption tracks were listed in the page metadata.
- In debug/headless Chrome, YouTube eventually showed: `문제가 발생했습니다. 새로고침하거나 나중에 다시 시도해 보세요.`
- YouTube player showed the subtitle button as `자막 사용 불가`; settings menu did not show a captions item.
- macOS screen capture failed with `could not create image from display`.
- AppleScript JavaScript execution in regular Chrome failed because Chrome setting is disabled:
  `보기 > 개발자 > Apple Events의 자바스크립트 허용`
- System Events key input to regular Chrome failed:
  `osascript에서 키스트로크를 보내도록 허용되지 않습니다.`

## Permissions / Setup To Check Before Continuing

After restarting terminal, check macOS permissions:

- System Settings > Privacy & Security > Accessibility
  - allow the terminal app being used by Codex
  - allow any helper app if prompted
- System Settings > Privacy & Security > Screen & System Audio Recording
  - allow the terminal app if screen capture is needed
- Chrome menu:
  - View > Developer > Allow JavaScript from Apple Events

Useful commands to retry:

```sh
open -a 'Google Chrome' 'https://youtu.be/J5pZH99xzAE?si=yjBH-kXXXyOoVWNz'
osascript -e 'tell application "Google Chrome" to get title of active tab of front window'
screencapture -x /private/tmp/youtube-screen.png
```

If Chrome JavaScript from Apple Events is enabled, try:

```sh
osascript -e 'tell application "Google Chrome" to execute active tab of front window javascript "document.title"'
```

If Accessibility permission is enabled, try sending playback/subtitle keys:

```sh
osascript -e 'tell application "Google Chrome" to activate' \
  -e 'tell application "System Events" to key code 49' \
  -e 'delay 0.5' \
  -e 'tell application "System Events" to keystroke "c"'
```

## Next Work Plan

1. Re-open this file and verify the permissions above.
2. Retry direct Chrome interaction:
   - open video
   - start playback
   - turn captions on with `c`
   - capture screen or execute page JS if enabled
3. If YouTube captions still do not render, use the video description and chapters as the primary source, and verify benefits against official Korean government/insurance sources.
4. Draft the web app plan:
   - D-day calculator by due date or pregnancy confirmation date
   - timeline grouped by pregnancy week
   - benefits checklist with due dates and status
   - reminders for 국민행복카드, 보건소, supplements, 조리원, 산후도우미, 태아보험
   - source/verification field per benefit

## Current Product Direction

The app should not just be a countdown. It should be a pregnancy timeline assistant:

- Shows "what to do now" based on current pregnancy week.
- Separates official support, hospital tasks, insurance/finance tasks, and personal preparation.
- Treats benefits as time-sensitive checklist items.
- Avoids hardcoding unstable support amounts without an official source and last-verified date.

## Implementation Added In This Session

Created a static web app:

- `index.html`: main UI for profile input, summary cards, filters, and checklist timeline
- `styles.css`: responsive layout and visual design
- `app.js`: due-date based pregnancy week / D-day calculation, localStorage persistence, checklist filtering, completion state
- `app.js`: last menstrual period and due date reciprocal sync, live dashboard refresh on input

Current behavior:

- User enters due date, confirmation date, and region.
- App calculates current pregnancy week and D-day from the due date.
- Checklist items are grouped by week ranges and categories:
  - official support
  - hospital / health
  - booking
  - insurance / finance
  - personal preparation
- Completed checklist state persists locally in the browser.
- Government24 맘편한 임신 is linked as the official source for supported items verified from the page.
- Unstable support amounts are intentionally not hardcoded; they are marked as requiring latest official verification.

Verification done:

- `node --check app.js` passed.
- Browser verification on local Chrome:
  - entering `2026-01-01` for last menstrual period auto-filled due date `2026-10-08`
  - entering `2026-12-31` for due date auto-filled last menstrual period `2026-03-26`
  - dashboard updated immediately with week and D-day text
- Update panel verification on local Chrome:
  - current version displayed as `2026년 7월 4일`
  - current release showed `5개` new benefits
  - clicking `업데이트 확인` stored `lastCheckedVersion: 2026-07-04`
  - status text changed to "이번 업데이트의 신규 혜택 5개를 이미 확인했습니다."
- Playwright visual check was attempted via `npx --yes playwright --version`, but it hung and was interrupted. Likely network/tool setup related.

## Deployment Prep Added

- Added `vercel.json` with no-cache headers so fresh deployments are picked up when the in-app update button reloads the page.
- Added `DEPLOY_VERCEL.md` with a minimal GitHub-to-Vercel deploy flow for a non-technical user.

## Video Content Reflected After User Re-sent Link

The user re-sent the same YouTube link on 2026-07-04. Direct full watching/transcript extraction was retried:

- `yt-dlp` is still not installed.
- Chrome AppleScript control failed because there was no active Chrome window available.
- YouTube HTML could be fetched with `curl`, but structured transcript/chapter extraction was not stable in this environment.

Updated `app.js` to better reflect the video's planning flow using the already-confirmed title, description, and chapter topics:

- pregnancy confirmation document and due date first
- first-week application order
- 국민행복카드 / 임신·출산 진료비 support first
- 맘편한 임신 / 보건소 grouped support
- early supplements timing
- items to finish before 10 weeks
- fetal insurance timing before key tests
- postpartum care center tour and reservation timing
- local hidden pregnancy-only benefits
- workplace pregnancy protection benefits to verify
- 산후도우미 provider comparison before official application window
- 산모·신생아 건강관리 support application window from Government24

## Direct Chrome Viewing Notes

After the user opened Chrome, the video was opened and inspected through Chrome screenshots and keyboard seeking. Chrome JavaScript execution is still disabled, so the video was reviewed visually from captions and on-screen slides rather than DOM extraction.

Observed and reflected in the app:

- Part 1 임신 직후 해야 할 일:
  - 임산부 배지 / 증빙은 대중교통 이용 시 지참 추천
  - Government24 맘편한 임신 page showed KTX, SRT, 임신출산 진료비 지원 항목
  - 맘편한 KTX details visible: special seat benefit, 신청일부터 출산예정일+1년까지, 이용 2-3일 전 신청 필요, 명절 기간 제외 warning
- Part 2 10주 전에 해야 할 일:
  - 회사가 거부할 수 있는 상황 mentioned in relation to workplace pregnancy benefits
  - 사회서비스 전자바우처 mentioned for provider / vendor reservation flow
  - 우체국 대한민국 엄마보험 / 무료 공익보험 shown with 22주 이내 가입
- Part 4 추가로 챙기면 좋을 혜택:
  - 임산부 의료비 본인부담금 감면 shown as 건강보험 적용 병원, 외래 진료시, 본인부담금 20% 감소

Code changes from direct viewing:

- Added pregnancy badge / proof item.
- Expanded KTX/SRT benefit item with visible conditions and caveat.
- Added 우체국 무료 공익보험 item through 22 weeks.
- Expanded workplace-rights item with company-refusal caveat.
- Added outpatient medical cost reduction item.
- Expanded 산후도우미 provider comparison item with 사회서비스 전자바우처 note.

## Full Transcript Access After Chrome Setting Enabled

The user enabled Chrome > View > Developer Info > Allow JavaScript from Apple Events. Verification command succeeded:

```sh
osascript -e 'tell application "Google Chrome" to execute active tab of front window javascript "document.title"'
```

Then the YouTube transcript panel was opened via page JavaScript and the full Korean transcript was read from `document.body.innerText`.

Additional app updates from the transcript:

- 임신확인서 should be received as 2-3 copies and saved as a photo.
- 국민행복카드 item now notes that card application and 진료비 지원 application are separate; video-mentioned amounts are marked with official verification warning.
- 보건소 / 맘편한 임신 item now includes KTX/SRT, 소득요건형 혜택, 지자체 임신축하 혜택.
- 엽산 and vitamin D timing clarified.
- Added 임신기 근로시간 단축: 12주 이내 and 32주 이후.
- Added 자동차보험 임산부 할인 특약.
- Added 필수 앱 setup: 마미톡, 베이비빌리, 맘가이드.
- Added 출산 병원 and emergency transfer route check.
- Added 예방접종 item: flu, B형간염 status, 27-36주 백일해.
- Added airport benefits: 인천공항 패스트트랙, 김포공항 포티케어.
- Added private discounts memo: 성심당 and selected restaurants/buffets.
- Expanded 산후도우미 comparison with 복지로 estimated support and socialservice provider details.

## Official Verification Pass 1

Verified and reflected in `app.js` on 2026-07-04:

- Government24 건강보험 임신·출산 진료비 지원
  - URL: `https://www.gov.kr/portal/service/serviceInfo/SD0000007672`
  - Confirmed: 100만원 per pregnancy, 140만원 basic amount for multiple pregnancy, additional support so multiple pregnancy becomes 100만원 per fetus, 20만원 extra for medically underserved childbirth areas, valid until 2 years from expected delivery / birth / miscarriage / stillbirth date.
- Government24 맘편한 임신
  - URL: `https://www.gov.kr/portal/onestopSvc/fertility`
  - Confirmed: 엽산제, 철분제, 표준모자보건수첩, 맘편한 KTX, SRT 임산부 할인, 건강보험 임신출산 진료비 지원, 산모·신생아 건강관리, 에너지 바우처 등 are listed.
- Government24 맘편한 코레일
  - URL: `https://www.gov.kr/portal/service/serviceInfo/B55145700016`
  - Confirmed: 임산부 + 동행 보호자 1명, 출산예정일+1년까지, KTX 특/우등실 요금 면제, KTX 일반실 40%, 일반열차 40%, 명절 특별수송기간 제외.
- Government24 SRT 임산부 할인
  - URL: `https://www.gov.kr/portal/service/serviceInfo/B55391200001`
  - Confirmed: 임산부 + 보호자 1명, 출산예정일+1년까지, 지정 좌석 운임 30%, 명절 특별수송기간 제외, 조건은 SR 정책에 따라 변경 가능.
- Government24 산모·신생아 건강관리 지원
  - URL: `https://www.gov.kr/portal/service/serviceInfo/PTR000050390`
  - Confirmed: 출산예정일 40일 전부터 출산일로부터 30일까지, 서비스기간 5-40일, 정부지원금은 태아유형·출산순위·소득구간·서비스기간에 따라 차등.
- 찾기쉬운 생활법령정보 모성보호 육아지원
  - URL: `https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=5&cnpClsNo=1&csmSeq=735&popMenu=ov`
  - Confirmed: 임신 후 12주 이내 또는 32주 이후 1일 2시간 근로시간 단축 신청 가능, 임금 삭감 금지, 개시 3일 전 문서와 진단서 제출.

Still needs official verification:

- 우체국 대한민국 엄마보험 / 무료 공익보험 current product details
- 임산부 외래 진료 본인부담금 20% 감면 current legal / NHIS basis
- 자동차보험 임산부 할인 특약, because insurer-specific terms vary
- 인천공항 패스트트랙 / 김포공항 포티케어 current airport policy
- 민간 discounts such as 성심당 and restaurants

## Official Verification Pass 2

Verified and reflected in `app.js`:

- 질병관리청 예방접종도우미 인플루엔자 국가예방접종사업
  - URL: `https://nip.kdca.go.kr/irhp/infm/goVcntInfo.do?menuCd=134&menuLv=1`
  - Confirmed: 임신부는 임신 주수와 관계없이, 주소지 관계없이 전국 위탁의료기관 및 보건소에서 무료 인플루엔자 예방접종 가능. 2025-2026 절기 임신부 지원기간은 2025-09-29 to 2026-04-30.

Could not verify from stable official pages in this environment, so `app.js` now marks these clearly as not officially verified:

- 우체국 대한민국 엄마보험 / 무료 공익보험
  - Current app warning: official product page not verified; check 우체국보험 app/customer center.
- 임산부 외래 진료 본인부담금 20% 감면
  - Current app warning: official basis not verified; check hospital billing desk / NHIS before relying on it.
- 자동차보험 임산부 할인 특약
  - Current app warning: insurer-specific; no common official standard.
- 인천공항 패스트트랙 / 김포공항 포티케어
  - Current app warning: official page not verified; check departure airport policy.
- 민간 discounts such as 성심당/restaurants
  - Kept as private discount memo only; terms can change by store.

## Official Search Results For Remaining Checks

Performed targeted official-site searches and found no stable page text for the following:

- 우체국 대한민국 엄마보험 / 무료 공익보험
  - `site:epostlife.go.kr "대한민국 엄마보험"`
  - `site:epostlife.go.kr "엄마보험"`
  - `site:epostlife.go.kr "임산부" "우체국온라인어린이보험"`
  - Result: no official search hit that exposed a stable product page for the exact wording used in the video.
- 임산부 외래 진료 본인부담금 20% 감면
  - `site:nhis.or.kr 임산부 외래 진료 본인부담금 20% 감면`
  - `site:easylaw.go.kr 임산부 본인부담금 20% 감면`
  - Result: no stable official page text found for that exact benefit wording.
- 인천공항 패스트트랙 / 김포공항 포티케어
  - `site:airport.kr 임산부 패스트트랙`
  - `site:airport.kr 포티케어`
  - `site:airport.kr 임산부 교통약자`
  - Result: no stable official page text found for those exact service names in the accessible airport site content.

## Data Structure Refactor

Implemented after official verification work:

- Added `data.js`
  - Defines `window.PREGNANCY_DATA`
  - Contains `sources`, `tasks`, `verificationLabels`, and `verifiedDate`
  - Each task now has a `verification` status:
    - `official`
    - `partial`
    - `video`
    - `needs_check`
    - `general`
- Updated `app.js`
  - Removed embedded task data.
  - Reads `tasks`, `verifiedDate`, and `verificationLabels` from `window.PREGNANCY_DATA`.
  - Renders verification status pills on each checklist card.
- Updated `index.html`
  - Loads `data.js` before `app.js`.
  - Updated source memo copy to explain verification states.
- Updated `styles.css`
  - Added distinct pill styles for verification states.

Verification:

- `node --check data.js` passed.
- `node --check app.js` passed.
- Opened `index.html` in Chrome.
- Browser JS check confirmed:
  - title: `우리 임신 타임라인`
  - task cards rendered: 25
  - verification pill text present

## Verification Filter

Added a checklist filter for verification status:

- all
- official
- partial
- video
- needs_check
- general

Files changed:

- `index.html`: added `#verificationFilter`
- `app.js`: filters rendered tasks by `task.verification`

Verification:

- `node --check app.js` passed.
- `node --check data.js` passed.
- Browser JS test set `#verificationFilter` to `needs_check`; rendered task cards dropped to 6.

## Timeline Phase Grouping

Added automatic phase headings in `app.js` based on each task's week range:

- 임신 확인 직후
- 12주 전 챙길 일
- 22주 전 확인
- 중기 점검
- 출산 전 예약/준비
- 출산 40일 전후
- 상시 확인

Files changed:

- `app.js`: added `phaseLabels`, `phaseOrder`, `getTaskPhase()`, grouped rendering.
- `styles.css`: added `.phase-heading`.

Verification:

- `node --check app.js` passed.
- Browser JS check confirmed 25 task cards and 7 phase headings.

## Timing Filter

Added pregnancy-week based timing filter:

- all
- current
- upcoming
- past

Files changed:

- `index.html`: added `#timingFilter`
- `app.js`: added `matchesTiming()` and connected the filter to `renderTimeline()`

Verification:

- `node --check app.js` passed.
- Browser JS test set a due date that produced `8주 0일`.
- With `#timingFilter=current`, rendered task cards were filtered to current-range items.

## Summary Strip

Added a small count summary above the checklist:

- `지금 해당`
- `앞으로 할 일`
- `확인 필요`

Implementation notes:

- `app.js` now computes current/upcoming/needs-check counts from `tasks`.
- `index.html` contains `#currentCount`, `#upcomingCount`, `#needsCheckCount`.
- `styles.css` includes `.summary-strip`.

Verification:

- With an 8-week due date, browser JS returned:
  - current: `18개`
  - upcoming: `5개`
  - needs check: `6개`

## Current Spotlight

Added a dedicated `지금 해야 할 일` section above the checklist.

Behavior:

- Shows the count of current tasks for the active pregnancy week.
- Displays up to 4 current tasks as compact cards.
- Includes a `현재 항목만 보기` button that switches the timing filter to `current`.

Files changed:

- `index.html`: added `#currentSpotlightTitle`, `#currentSpotlightDetail`, `#currentSpotlightList`, `#focusCurrentButton`
- `app.js`: added `renderCurrentSpotlightItem()` and spotlight rendering in `renderSummary()`
- `styles.css`: added spotlight styles and compact empty state

Verification:

- Browser JS with an 8-week due date returned:
  - spotlight title: `18개의 현재 항목이 있습니다`
  - spotlight items: `4`
  - current count: `18개`

## Spotlight Priority

Refined the current-task spotlight ordering so the first cards are prioritized by verification state:

- `official`
- `partial`
- `video`
- `needs_check`
- `general`

Implementation:

- Added `sortByPriority()` in `app.js`.
- The spotlight now slices the top 4 items after priority sorting.

Verification:

- With an 8-week due date, the first spotlight item became:
  - `국민행복카드와 진료비 지원 먼저 처리`
  - `공식 지원`
  - `공식 확인`

## Stronger Unverified Copy

Updated the remaining unverified items so the UI says `개별 확인 필요` instead of a softer `확인 필요`.

Also updated the spotlight cards to show explicit ranks:

- `1순위`
- `2순위`
- `3순위`
- `4순위`

Verification:

- Browser JS with an 8-week due date returned the first spotlight item with `1순위`.
- `needsCheckCount` remained `6개`, but the label text is now stronger for those items.

## Needs-Check Reduction

Reclassified items that are not really shared official benefits into `general`:

- `local-benefits`
- `car-insurance`
- `private-discounts`

Result:

- `needsCheckCount` dropped from `6개` to `3개`.
- Remaining `needs_check` items are now:
  - 우체국 무료 공익보험 확인
  - 임산부 외래 진료 본인부담금 감면 확인
  - 공항 교통약자 혜택 확인

Verification:

- Browser JS with an 8-week due date returned:
  - `current`: `18개`
  - `upcoming`: `5개`
  - `needs`: `3개`

Open locally:

```sh
open /Users/jiheepark/project/our-pregnancy/index.html
```

Useful next steps:

1. Verify the page visually in Chrome on desktop and mobile width.
2. Add more official links for 국민건강보험, 복지로, 보건소/local government pages.
3. Add export or calendar reminder features if this is going beyond a prototype.
