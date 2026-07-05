const DAY = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "our-pregnancy-profile";
const FIXED_LMP_DATE = "2026-05-23";
const FIXED_REGION = "경기도 고양시 덕양구";
const DONE_KEY = "our-pregnancy-done";
const PENDING_KEY = "our-pregnancy-sync-pending";
const SHARE_CODE_KEY = "our-pregnancy-share-code";
const UPDATE_KEY = "our-pregnancy-update-state";
const DEVICE_KEY = "our-pregnancy-device-id";
const SHARED_SYNC_ENDPOINT = "/api/shared-checklist";
const SHARED_CODE_HEADER = "x-shared-code";
const SHARED_SYNC_POLL_MS = 30000;
const { tasks, verifiedDate, verificationLabels } = window.PREGNANCY_DATA;

const categoryLabels = {
  official: "공식 지원",
  hospital: "병원/건강",
  booking: "예약",
  finance: "보험/비용",
  personal: "개인 준비",
};

const phaseLabels = {
  first_week: "임신 확인 직후",
  before_12: "12주 전 챙길 일",
  before_22: "22주 전 확인",
  mid_term: "중기 점검",
  late_prep: "출산 전 예약/준비",
  birth_window: "출산 40일 전후",
  anytime: "상시 확인",
};

const phaseOrder = Object.keys(phaseLabels);

const fixedLmpText = document.querySelector("#fixedLmpText");
const fixedDueText = document.querySelector("#fixedDueText");
const fixedRegionText = document.querySelector("#fixedRegionText");
const resetButton = document.querySelector("#resetButton");
const categoryFilter = document.querySelector("#categoryFilter");
const statusFilter = document.querySelector("#statusFilter");
const verificationFilter = document.querySelector("#verificationFilter");
const timingFilter = document.querySelector("#timingFilter");
const timeline = document.querySelector("#timeline");

const todayText = document.querySelector("#todayText");
const weekText = document.querySelector("#weekText");
const ddayText = document.querySelector("#ddayText");
const focusText = document.querySelector("#focusText");
const currentCount = document.querySelector("#currentCount");
const upcomingCount = document.querySelector("#upcomingCount");
const needsCheckCount = document.querySelector("#needsCheckCount");
const syncStatusText = document.querySelector("#syncStatusText");
const syncPendingCount = document.querySelector("#syncPendingCount");
const syncMetaText = document.querySelector("#syncMetaText");
const syncNowButton = document.querySelector("#syncNowButton");
const shareCodeInput = document.querySelector("#shareCodeInput");
const shareCodeSaveButton = document.querySelector("#shareCodeSaveButton");
const shareCodeClearButton = document.querySelector("#shareCodeClearButton");
const shareCodeStatusText = document.querySelector("#shareCodeStatusText");
const updateDateText = document.querySelector("#updateDateText");
const newBenefitsCount = document.querySelector("#newBenefitsCount");
const updateStatusText = document.querySelector("#updateStatusText");
const updateRefreshButton = document.querySelector("#updateRefreshButton");
const newBenefitsList = document.querySelector("#newBenefitsList");
const localBenefitsTitle = document.querySelector("#localBenefitsTitle");
const localBenefitsSummary = document.querySelector("#localBenefitsSummary");
const localBenefitsDetail = document.querySelector("#localBenefitsDetail");
const localBenefitsList = document.querySelector("#localBenefitsList");
const localFocusButton = document.querySelector("#localFocusButton");
const currentSpotlightTitle = document.querySelector("#currentSpotlightTitle");
const currentSpotlightDetail = document.querySelector("#currentSpotlightDetail");
const currentSpotlightList = document.querySelector("#currentSpotlightList");
const focusCurrentButton = document.querySelector("#focusCurrentButton");

let profile = createFixedProfile();
let done = normalizeDoneIds(loadJson(DONE_KEY, []));
let pendingOps = normalizePendingOperations(loadJson(PENDING_KEY, []));
let updateState = loadJson(UPDATE_KEY, {});
let sharedCode = loadString(SHARE_CODE_KEY).trim();
let showLocalOnly = false;
let syncJob = Promise.resolve();
let syncIntervalId = null;
const deviceId = getOrCreateDeviceId();
const sharedSync = {
  mode: "connecting",
  isBusy: false,
  lastSyncedAt: null,
  lastRemoteUpdatedAt: null,
  etag: "",
  error: "",
};

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors and keep the in-memory state usable.
  }
}

function loadString(key, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveString(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors and keep the in-memory state usable.
  }
}

function normalizeDoneIds(value) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item) => typeof item === "string"))]
    : [];
}

function normalizePendingOperations(value) {
  if (!Array.isArray(value)) return [];

  const fallbackDeviceId = getOrCreateDeviceId();

  return value
    .filter((item) => item && typeof item === "object")
    .filter(
      (item) =>
        item.type === "reset" ||
        (item.type === "set" && typeof item.taskId === "string" && typeof item.checked === "boolean"),
    )
    .map((item) => ({
      ...item,
      deviceId:
        typeof item.deviceId === "string" && item.deviceId.trim()
          ? item.deviceId
          : fallbackDeviceId,
      queuedAt:
        typeof item.queuedAt === "string" && item.queuedAt.trim()
          ? item.queuedAt
          : new Date().toISOString(),
    }));
}

function createFixedProfile() {
  const lmp = parseISODate(FIXED_LMP_DATE);
  return {
    lmpDate: FIXED_LMP_DATE,
    dueDate: formatISODate(addDays(lmp, 280)),
    region: FIXED_REGION,
  };
}

function saveUpdateState() {
  saveJson(UPDATE_KEY, updateState);
}

function saveDoneCache() {
  saveJson(DONE_KEY, done);
}

function savePendingOps() {
  saveJson(PENDING_KEY, pendingOps);
}

function saveSharedCode(value) {
  sharedCode = value.trim();
  if (sharedCode) {
    saveString(SHARE_CODE_KEY, sharedCode);
    return;
  }

  try {
    localStorage.removeItem(SHARE_CODE_KEY);
  } catch {
    // Ignore storage errors and keep the in-memory code cleared.
  }
}

function getOrCreateDeviceId() {
  const existing = loadString(DEVICE_KEY);
  if (existing) return existing;
  const created =
    globalThis.crypto?.randomUUID?.() ??
    `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  saveString(DEVICE_KEY, created);
  return created;
}

function clearLegacyProfileStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage access issues and keep the fixed profile active in memory.
  }
}

function setDone(nextDone) {
  done = normalizeDoneIds(nextDone);
  saveDoneCache();
}

function enqueuePendingOperation(operation) {
  pendingOps = [
    ...pendingOps,
    {
      ...operation,
      queuedAt: new Date().toISOString(),
      deviceId,
    },
  ];
  savePendingOps();
}

function consumePendingOperation() {
  pendingOps = pendingOps.slice(1);
  savePendingOps();
}

function getPregnancyWeek(dueDate) {
  if (!dueDate) return null;
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(`${dueDate}T00:00:00`));
  const daysUntilDue = Math.round((due - today) / DAY);
  const daysPregnant = 280 - daysUntilDue;
  return {
    week: Math.max(0, Math.floor(daysPregnant / 7)),
    day: Math.max(0, daysPregnant % 7),
    daysUntilDue,
  };
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const copy = startOfDay(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(value) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatShortDate(value) {
  const parsed = parseISODate(value);
  if (!parsed) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

function formatDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function isNewBenefit(task) {
  return task.introducedAt === verifiedDate;
}

function getNewBenefits() {
  return sortByPriority(tasks.filter(isNewBenefit));
}

function getLocalBenefits() {
  return tasks.filter((task) => task.local);
}

function renderProfileSummary() {
  fixedLmpText.textContent = formatShortDate(profile.lmpDate);
  fixedDueText.textContent = formatShortDate(profile.dueDate);
  fixedRegionText.textContent = profile.region;
}

function renderSharedSync() {
  syncPendingCount.textContent = pendingOps.length ? `${pendingOps.length}건` : "0건";
  syncNowButton.disabled = sharedSync.isBusy;
  syncNowButton.textContent =
    pendingOps.length > 0 ? "지금 업로드" : sharedSync.isBusy ? "동기화 중" : "지금 동기화";

  if (sharedSync.isBusy) {
    syncStatusText.textContent = pendingOps.length > 0 ? "업로드 중" : "동기화 중";
  } else if (sharedSync.mode === "ready") {
    syncStatusText.textContent = "공유 사용 중";
  } else if (sharedSync.mode === "not_configured") {
    syncStatusText.textContent = "공유 미설정";
  } else if (sharedSync.mode === "auth_required") {
    syncStatusText.textContent = "공유 코드 필요";
  } else if (sharedSync.mode === "retry") {
    syncStatusText.textContent = "재시도 필요";
  } else if (sharedSync.mode === "local_only") {
    syncStatusText.textContent = "브라우저 임시 저장";
  } else {
    syncStatusText.textContent = "연결 중";
  }

  const parts = [];
  if (pendingOps.length > 0) {
    parts.push(`${pendingOps.length}건 변경이 아직 서버 반영 전입니다.`);
  } else if (sharedSync.lastRemoteUpdatedAt) {
    parts.push(`마지막 반영 ${formatDateTime(sharedSync.lastRemoteUpdatedAt)}`);
  } else if (sharedSync.lastSyncedAt) {
    parts.push(`마지막 확인 ${formatDateTime(sharedSync.lastSyncedAt)}`);
  } else {
    parts.push("두 분이 같은 체크 상태를 보도록 서버와 연결합니다.");
  }

  if (sharedSync.mode === "not_configured") {
    parts.push("공유 저장소가 아직 연결되지 않아 현재는 이 브라우저에만 저장됩니다.");
  } else if (sharedSync.mode === "auth_required") {
    parts.push("공유 코드를 입력해야 동기화를 읽고 쓸 수 있습니다.");
  } else if (sharedSync.mode === "local_only") {
    parts.push("연결이 복구되면 다시 동기화할 수 있습니다.");
  } else if (sharedSync.mode === "retry") {
    parts.push("버튼을 눌러 대기 중 변경을 다시 올리세요.");
  }

  if (sharedSync.error) {
    parts.push(sharedSync.error);
  }

  syncMetaText.textContent = parts.join(" ");
  shareCodeInput.value = sharedCode;
  shareCodeStatusText.textContent = sharedCode
    ? "공유 코드가 저장되어 있습니다."
    : "공유 코드를 입력해야 서로 같은 체크 상태를 씁니다.";
}

function renderUpdates() {
  const newBenefits = getNewBenefits();
  const hasSeenCurrentVersion = updateState.lastCheckedVersion === verifiedDate;

  updateDateText.textContent = formatShortDate(verifiedDate);
  newBenefitsCount.textContent = getCountLabel(newBenefits.length);

  if (newBenefits.length === 0) {
    updateStatusText.textContent = "현재 버전에서 새로 추가된 혜택은 없습니다.";
  } else if (hasSeenCurrentVersion) {
    updateStatusText.textContent = `이번 업데이트의 신규 혜택 ${newBenefits.length}개를 이미 확인했습니다.`;
  } else {
    updateStatusText.textContent = `이번 업데이트에서 신규 혜택 ${newBenefits.length}개가 추가됐습니다.`;
  }

  newBenefitsList.innerHTML =
    newBenefits.length > 0
      ? newBenefits.map(renderNewBenefitItem).join("")
      : '<div class="empty-state compact">이번 업데이트에서 새로 추가된 혜택이 없습니다.</div>';
}

function applyRemoteChecklistState(payload) {
  setDone(Array.isArray(payload.doneIds) ? payload.doneIds : []);
  sharedSync.lastRemoteUpdatedAt = payload.updatedAt ?? null;
  sharedSync.lastSyncedAt = new Date().toISOString();
  sharedSync.etag = payload.etag ?? sharedSync.etag;
  sharedSync.error = "";
  sharedSync.mode = "ready";
}

async function parseSyncResponse(response) {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (response.ok) {
    return payload;
  }

  const message = payload.message ?? payload.error ?? "공유 체크 동기화에 실패했습니다.";
  const error = new Error(message);
  error.status = response.status;
  error.code = payload.error ?? "";
  throw error;
}

async function fetchRemoteChecklist() {
  const headers = {
    "cache-control": "no-store",
  };
  if (sharedCode) {
    headers[SHARED_CODE_HEADER] = sharedCode;
  }
  if (sharedSync.etag) {
    headers["if-none-match"] = sharedSync.etag;
  }

  const response = await fetch(SHARED_SYNC_ENDPOINT, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (response.status === 304) {
    sharedSync.lastSyncedAt = new Date().toISOString();
    sharedSync.error = "";
    sharedSync.mode = "ready";
    return;
  }

  const payload = await parseSyncResponse(response);
  sharedSync.etag = response.headers.get("etag") ?? payload.etag ?? sharedSync.etag;
  applyRemoteChecklistState(payload);
}

async function sendChecklistOperation(operation, options = {}) {
  const headers = {
    "content-type": "application/json",
    "cache-control": "no-store",
  };
  if (sharedCode) {
    headers[SHARED_CODE_HEADER] = sharedCode;
  }

  const response = await fetch(SHARED_SYNC_ENDPOINT, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(operation),
  });

  const payload = await parseSyncResponse(response);
  sharedSync.etag = response.headers.get("etag") ?? payload.etag ?? sharedSync.etag;
  if (options.applyState !== false) {
    applyRemoteChecklistState(payload);
  } else {
    sharedSync.lastRemoteUpdatedAt = payload.updatedAt ?? sharedSync.lastRemoteUpdatedAt;
    sharedSync.lastSyncedAt = new Date().toISOString();
    sharedSync.error = "";
    sharedSync.mode = "ready";
  }

  return payload;
}

async function flushPendingOperations() {
  while (pendingOps.length > 0) {
    const [nextOperation] = pendingOps;
    await sendChecklistOperation(nextOperation, {
      applyState: false,
    });
    consumePendingOperation();
  }
}

async function performSharedSync() {
  sharedSync.isBusy = true;
  renderSharedSync();

  try {
    if (pendingOps.length > 0) {
      await flushPendingOperations();
    } else {
      await fetchRemoteChecklist();
    }
  } catch (error) {
    sharedSync.error = error.message;
    sharedSync.mode =
      error.code === "sync_not_configured"
        ? "not_configured"
        : error.code === "sync_unauthorized"
          ? "auth_required"
          : pendingOps.length > 0
            ? "retry"
            : "local_only";
  } finally {
    sharedSync.isBusy = false;
    render();
  }
}

function queueSharedSync() {
  syncJob = syncJob
    .catch(() => {})
    .then(() => performSharedSync());
  return syncJob;
}

function startSharedSyncLoop() {
  if (syncIntervalId) return;
  syncIntervalId = window.setInterval(() => {
    void queueSharedSync();
  }, SHARED_SYNC_POLL_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void queueSharedSync();
    }
  });
}

function renderLocalBenefits() {
  const pregnancy = getPregnancyWeek(profile.dueDate);
  const localTasks = getLocalBenefits().sort((a, b) => {
    const aDone = done.includes(a.id);
    const bDone = done.includes(b.id);
    if (aDone !== bDone) return aDone ? 1 : -1;

    const aCurrent = isCurrentTask(a, pregnancy);
    const bCurrent = isCurrentTask(b, pregnancy);
    if (aCurrent !== bCurrent) return aCurrent ? -1 : 1;

    const verificationDelta = getVerificationRank(a) - getVerificationRank(b);
    if (verificationDelta !== 0) return verificationDelta;
    return a.from - b.from;
  });
  const currentLocalCount = pregnancy
    ? localTasks.filter((task) => isCurrentTask(task, pregnancy) && !done.includes(task.id)).length
    : 0;
  const upcomingLocalCount = pregnancy
    ? localTasks.filter((task) => pregnancy.week < task.from && !done.includes(task.id)).length
    : 0;

  localBenefitsTitle.textContent = `${profile.region} 기준 지역 혜택`;
  localBenefitsSummary.textContent = `${localTasks.length}개 지역 항목을 따로 모았습니다.`;
  localBenefitsDetail.textContent =
    currentLocalCount > 0
      ? `지금 확인할 항목 ${currentLocalCount}개, 앞으로 확인할 항목 ${upcomingLocalCount}개입니다. 보건소와 지자체 페이지를 우선 확인하세요.`
      : "현재 주차에 바로 해당하는 지역 항목은 없고, 다음 단계 혜택만 미리 확인하면 됩니다.";
  localFocusButton.textContent = showLocalOnly ? "전체 항목 보기" : "지역 항목만 보기";
  localBenefitsList.innerHTML =
    localTasks.length > 0
      ? localTasks.map((task) => renderLocalBenefitItem(task, pregnancy)).join("")
      : '<div class="empty-state compact">묶어서 보여줄 지역 항목이 없습니다.</div>';
}

function renderSummary() {
  const pregnancy = getPregnancyWeek(profile.dueDate);
  todayText.textContent = formatDate(new Date());
  currentCount.textContent = getCountLabel(countTasks(pregnancy, "current"));
  upcomingCount.textContent = getCountLabel(countTasks(pregnancy, "upcoming"));
  needsCheckCount.textContent = getCountLabel(
    tasks.filter((task) => task.verification === "needs_check").length,
  );

  if (!pregnancy) {
    weekText.textContent = "예정일 입력 필요";
    ddayText.textContent = "-";
    focusText.textContent = "프로필을 저장하세요";
    currentSpotlightTitle.textContent = "예정일을 입력하면 지금 해야 할 일을 보여줍니다.";
    currentSpotlightDetail.textContent = "현재 주차에 맞는 항목을 위로 끌어올려 바로 확인할 수 있습니다.";
    currentSpotlightList.innerHTML = '<div class="empty-state compact">예정일을 입력하면 현재 항목이 표시됩니다.</div>';
    return;
  }

  weekText.textContent = `${pregnancy.week}주 ${pregnancy.day}일`;
  ddayText.textContent =
    pregnancy.daysUntilDue >= 0
      ? `D-${pregnancy.daysUntilDue}`
      : `출산예정일 +${Math.abs(pregnancy.daysUntilDue)}일`;

  const currentTasks = tasks.filter(
    (task) => pregnancy.week >= task.from && pregnancy.week <= task.to && !done.includes(task.id),
  );
  const priorityTasks = sortByPriority(currentTasks);
  focusText.textContent = currentTasks[0]?.title ?? "이번 주 신규 항목 없음";
  currentSpotlightTitle.textContent =
    priorityTasks.length > 0
      ? `${priorityTasks.length}개의 현재 항목이 있습니다`
      : "이번 주 신규 항목이 없습니다";
  currentSpotlightDetail.textContent =
    priorityTasks.length > 0
      ? "공식 확인 항목부터 순서대로 처리하세요."
      : "지금 주차에서는 새로 시작할 항목이 없고, 다음 단계만 준비하면 됩니다.";

  currentSpotlightList.innerHTML =
    priorityTasks.length > 0
      ? priorityTasks.slice(0, 4).map((task, index) => renderCurrentSpotlightItem(task, index + 1)).join("")
      : '<div class="empty-state compact">현재 주차에 해당하는 체크리스트가 없습니다.</div>';
}

function renderNewBenefitItem(task) {
  const verification = task.verification ?? "video";
  const verificationLabel = verificationLabels[verification] ?? "상태 미정";
  const categoryLabel = categoryLabels[task.category] ?? "기타";
  return `
    <article class="current-spotlight-item new-benefit-item">
      <div class="current-spotlight-item__rank">NEW</div>
      <div class="current-spotlight-item__title">${task.title}</div>
      <p class="new-benefit-item__body">${task.body}</p>
      <div class="current-spotlight-item__meta">
        <span class="pill ${task.category === "official" ? "official" : ""}">${categoryLabel}</span>
        <span class="pill verify ${verification}">${verificationLabel}</span>
        <span class="pill">검증일: ${verifiedDate}</span>
      </div>
    </article>
  `;
}

function renderCurrentSpotlightItem(task, rank) {
  const verification = task.verification ?? "video";
  const verificationLabel = verificationLabels[verification] ?? "상태 미정";
  const categoryLabel = categoryLabels[task.category] ?? "기타";
  return `
    <article class="current-spotlight-item">
      <div class="current-spotlight-item__rank">${rank}순위</div>
      <div class="current-spotlight-item__title">${task.title}</div>
      <div class="current-spotlight-item__meta">
        <span class="pill">${task.from}-${task.to}주</span>
        <span class="pill ${task.category === "official" ? "official" : ""}">${categoryLabel}</span>
        <span class="pill verify ${verification}">${verificationLabel}</span>
      </div>
    </article>
  `;
}

function renderLocalBenefitItem(task, pregnancy) {
  const verification = task.verification ?? "video";
  const verificationLabel = verificationLabels[verification] ?? "상태 미정";
  const categoryLabel = categoryLabels[task.category] ?? "기타";
  const statusLabel = getTaskStatusLabel(task, pregnancy);
  const isDone = done.includes(task.id);
  return `
    <article class="current-spotlight-item local-benefit-item${isDone ? " is-done" : ""}">
      <div class="current-spotlight-item__rank">지역 혜택</div>
      <div class="current-spotlight-item__title">${task.title}</div>
      <p class="new-benefit-item__body">${task.body}</p>
      <div class="current-spotlight-item__meta">
        <span class="pill">${task.from}-${task.to}주</span>
        <span class="pill local">${profile.region}</span>
        <span class="pill ${task.category === "official" ? "official" : ""}">${categoryLabel}</span>
        <span class="pill verify ${verification}">${verificationLabel}</span>
        <span class="pill state ${statusLabel.className}">${statusLabel.text}</span>
        ${isDone ? '<span class="pill done">체크 완료</span>' : ""}
      </div>
      ${task.href ? `<a class="task-link local-benefit-link" href="${task.href}" target="_blank" rel="noreferrer">바로 확인</a>` : ""}
    </article>
  `;
}

function getTaskStatusLabel(task, pregnancy) {
  if (!pregnancy) {
    return { text: "시점 계산 대기", className: "upcoming" };
  }
  if (pregnancy.week >= task.from && pregnancy.week <= task.to) {
    return { text: "지금 확인", className: "current" };
  }
  if (pregnancy.week < task.from) {
    return { text: "곧 확인", className: "upcoming" };
  }
  return { text: "기한 지남", className: "past" };
}

function isCurrentTask(task, pregnancy) {
  return Boolean(pregnancy && pregnancy.week >= task.from && pregnancy.week <= task.to);
}

function countTasks(pregnancy, mode) {
  if (!pregnancy) return 0;
  if (mode === "current") {
    return tasks.filter((task) => pregnancy.week >= task.from && pregnancy.week <= task.to).length;
  }
  if (mode === "upcoming") {
    return tasks.filter((task) => pregnancy.week < task.from).length;
  }
  return 0;
}

function getCountLabel(count) {
  return count ? `${count}개` : "0개";
}

function sortByPriority(items) {
  return [...items].sort((a, b) => {
    const verificationDelta = getVerificationRank(a) - getVerificationRank(b);
    if (verificationDelta !== 0) return verificationDelta;
    return a.from - b.from;
  });
}

function getVerificationRank(task) {
  const verificationRank = {
    official: 0,
    partial: 1,
    video: 2,
    needs_check: 3,
    general: 4,
  };
  return verificationRank[task.verification ?? "video"] ?? 9;
}

function renderTimeline() {
  const pregnancy = getPregnancyWeek(profile.dueDate);
  const selectedCategory = categoryFilter.value;
  const selectedStatus = statusFilter.value;
  const selectedVerification = verificationFilter.value;
  const selectedTiming = timingFilter.value;

  const visibleTasks = tasks
    .filter((task) => !showLocalOnly || task.local)
    .filter((task) => selectedCategory === "all" || task.category === selectedCategory)
    .filter(
      (task) => selectedVerification === "all" || task.verification === selectedVerification,
    )
    .filter((task) => matchesTiming(task, pregnancy, selectedTiming))
    .filter((task) => {
      const isDone = done.includes(task.id);
      if (selectedStatus === "done") return isDone;
      if (selectedStatus === "open") return !isDone;
      return true;
    })
    .sort((a, b) => {
      const phaseDelta = phaseOrder.indexOf(getTaskPhase(a)) - phaseOrder.indexOf(getTaskPhase(b));
      if (phaseDelta !== 0) return phaseDelta;
      return a.from - b.from;
    });

  timeline.innerHTML = "";

  if (visibleTasks.length === 0) {
    timeline.innerHTML = '<div class="empty-state">조건에 맞는 체크리스트가 없습니다.</div>';
    return;
  }

  let currentPhase = "";

  visibleTasks.forEach((task) => {
    const phase = getTaskPhase(task);
    if (phase !== currentPhase) {
      currentPhase = phase;
      const heading = document.createElement("div");
      heading.className = "phase-heading";
      heading.textContent = phaseLabels[phase];
      timeline.appendChild(heading);
    }

    const isDone = done.includes(task.id);
    const isCurrent = pregnancy && pregnancy.week >= task.from && pregnancy.week <= task.to;
    const verification = task.verification ?? "video";
    const verificationLabel = verificationLabels[verification] ?? "상태 미정";
    const item = document.createElement("article");
    item.className = `task${isDone ? " is-done" : ""}${isCurrent ? " is-current" : ""}`;
    item.innerHTML = `
      <input type="checkbox" ${isDone ? "checked" : ""} aria-label="${task.title} 완료" />
      <div>
        <h3>${task.title}</h3>
        <p>${task.body}</p>
        <div class="meta-row">
          <span class="pill">${task.from}-${task.to}주</span>
          ${task.local ? '<span class="pill local">지역 혜택</span>' : ""}
          <span class="pill ${task.category === "official" ? "official" : ""}">${categoryLabels[task.category]}</span>
          <span class="pill verify ${verification}">${verificationLabel}</span>
          ${isNewBenefit(task) ? '<span class="pill new">새 혜택</span>' : ""}
          <span class="pill">출처: ${task.source}</span>
          <span class="pill">검증일: ${verifiedDate}</span>
          ${task.warning ? `<span class="pill warning">${task.warning}</span>` : ""}
        </div>
      </div>
      ${task.href ? `<a class="task-link" href="${task.href}" target="_blank" rel="noreferrer">확인하기</a>` : "<span></span>"}
    `;

    item.querySelector("input").addEventListener("change", (event) => {
      setDone(
        event.target.checked
        ? [...new Set([...done, task.id])]
        : done.filter((id) => id !== task.id),
      );
      enqueuePendingOperation({
        type: "set",
        taskId: task.id,
        checked: event.target.checked,
      });
      render();
      void queueSharedSync();
    });

    timeline.appendChild(item);
  });
}

function getTaskPhase(task) {
  if (task.from <= 4 && task.to >= 40) return "anytime";
  if (task.to <= 8) return "first_week";
  if (task.to <= 12) return "before_12";
  if (task.to <= 22) return "before_22";
  if (task.from < 28) return "mid_term";
  if (task.from < 33) return "late_prep";
  return "birth_window";
}

function matchesTiming(task, pregnancy, selectedTiming) {
  if (selectedTiming === "all") return true;
  if (!pregnancy) return false;
  if (selectedTiming === "current") {
    return pregnancy.week >= task.from && pregnancy.week <= task.to;
  }
  if (selectedTiming === "upcoming") {
    return pregnancy.week < task.from;
  }
  if (selectedTiming === "past") {
    return pregnancy.week > task.to;
  }
  return true;
}

function render() {
  profile = createFixedProfile();
  renderProfileSummary();
  renderSharedSync();
  renderUpdates();
  renderLocalBenefits();
  renderSummary();
  renderTimeline();
}

resetButton.addEventListener("click", () => {
  const shouldReset = window.confirm("공유 체크 상태를 모두 초기화할까요? 다른 기기에도 같이 반영됩니다.");
  if (!shouldReset) return;

  setDone([]);
  enqueuePendingOperation({
    type: "reset",
  });
  render();
  void queueSharedSync();
});

categoryFilter.addEventListener("change", renderTimeline);
statusFilter.addEventListener("change", renderTimeline);
verificationFilter.addEventListener("change", renderTimeline);
timingFilter.addEventListener("change", renderTimeline);
syncNowButton.addEventListener("click", () => {
  void queueSharedSync();
});
shareCodeSaveButton.addEventListener("click", () => {
  saveSharedCode(shareCodeInput.value);
  renderSharedSync();
  void queueSharedSync();
});
shareCodeClearButton.addEventListener("click", () => {
  saveSharedCode("");
  renderSharedSync();
});
shareCodeInput.addEventListener("change", () => {
  saveSharedCode(shareCodeInput.value);
  renderSharedSync();
});
localFocusButton.addEventListener("click", () => {
  showLocalOnly = !showLocalOnly;
  renderLocalBenefits();
  renderTimeline();
});
focusCurrentButton.addEventListener("click", () => {
  showLocalOnly = false;
  renderLocalBenefits();
  timingFilter.value = "current";
  renderTimeline();
});
updateRefreshButton.addEventListener("click", () => {
  updateState = {
    ...updateState,
    lastCheckedVersion: verifiedDate,
    checkedAt: new Date().toISOString(),
  };
  saveUpdateState();
  window.location.reload();
});

clearLegacyProfileStorage();
render();
startSharedSyncLoop();
void queueSharedSync();
