const DAY = 24 * 60 * 60 * 1000;
const DEFAULT_LMP_DATE = "2026-05-23";
const STORAGE_KEY = "pregnancy-dday-settings-v1";
const PAGE = document.body.dataset.page ?? "calendar";
const { milestones, reviewedAt } = window.PREGNANCY_DATA;

const lmpInput = document.querySelector("#lmpInput");
const dueInput = document.querySelector("#dueInput");
const saveSettingsButton = document.querySelector("#saveSettingsButton");
const resetSettingsButton = document.querySelector("#resetSettingsButton");
const settingsStatusText = document.querySelector("#settingsStatusText");
const settingsReviewedAt = document.querySelector("#settingsReviewedAt");

const heroWeekText = document.querySelector("#heroWeekText");
const heroDdayText = document.querySelector("#heroDdayText");
const heroFocusText = document.querySelector("#heroFocusText");

const calendarMonthText = document.querySelector("#calendarMonthText");
const calendarRangeText = document.querySelector("#calendarRangeText");
const calendarPrevButton = document.querySelector("#calendarPrevButton");
const calendarNextButton = document.querySelector("#calendarNextButton");
const calendarTodayButton = document.querySelector("#calendarTodayButton");
const calendarGrid = document.querySelector("#calendarGrid");
const selectedDateText = document.querySelector("#selectedDateText");
const selectedDateMetaText = document.querySelector("#selectedDateMetaText");
const selectedDateList = document.querySelector("#selectedDateList");
const nextMilestoneList = document.querySelector("#nextMilestoneList");

let settings = loadSettings();
let selectedDate = startOfDay(new Date());
let calendarMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return normalizeSettings(parsed);
  } catch {
    return normalizeSettings({});
  }
}

function saveSettings(nextSettings) {
  settings = normalizeSettings(nextSettings);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  return settings;
}

function normalizeSettings(value) {
  if (parseISODate(value.lmpDate) && parseISODate(value.dueDate)) {
    return {
      lmpDate: value.lmpDate,
      dueDate: value.dueDate,
    };
  }

  if (parseISODate(value.lmpDate)) {
    return {
      lmpDate: value.lmpDate,
      dueDate: formatISODate(addDays(parseISODate(value.lmpDate), 280)),
    };
  }

  if (parseISODate(value.dueDate)) {
    return {
      lmpDate: formatISODate(addDays(parseISODate(value.dueDate), -280)),
      dueDate: value.dueDate,
    };
  }

  const lmpDate = DEFAULT_LMP_DATE;
  const dueDate = formatISODate(addDays(parseISODate(DEFAULT_LMP_DATE), 280));
  return { lmpDate, dueDate };
}

function parseISODate(value) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function getPregnancyProgress(date = new Date()) {
  const lmp = parseISODate(settings.lmpDate);
  const due = parseISODate(settings.dueDate);
  const target = startOfDay(date);
  const daysPregnant = Math.max(0, Math.round((target - lmp) / DAY));
  const daysUntilDue = Math.round((due - target) / DAY);

  return {
    week: Math.floor(daysPregnant / 7),
    day: daysPregnant % 7,
    daysPregnant,
    daysUntilDue,
  };
}

function getMilestoneDate(item) {
  const lmp = parseISODate(settings.lmpDate);
  const due = parseISODate(settings.dueDate);

  if (item.type === "pregnancy_week") {
    return addDays(lmp, item.week * 7);
  }

  if (item.type === "due_days_before") {
    return addDays(due, -item.days);
  }

  return lmp;
}

function getMilestonesWithDates() {
  return milestones
    .map((item) => ({
      ...item,
      date: getMilestoneDate(item),
    }))
    .sort((a, b) => a.date - b.date);
}

function getMilestonesForDate(date) {
  const targetKey = formatISODate(startOfDay(date));
  return getMilestonesWithDates().filter((item) => formatISODate(item.date) === targetKey);
}

function getUpcomingMilestones(limit = 4) {
  const today = startOfDay(new Date());
  return getMilestonesWithDates().filter((item) => item.date >= today).slice(0, limit);
}

function getMonthBounds(date) {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
  };
}

function getCalendarDays(date) {
  const { start, end } = getMonthBounds(date);
  const gridStart = addDays(start, -start.getDay());
  const gridEnd = addDays(end, 6 - end.getDay());
  const days = [];

  for (let cursor = startOfDay(gridStart); cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    days.push(cursor);
  }

  return days;
}

function isSameDate(a, b) {
  return formatISODate(a) === formatISODate(b);
}

function renderHero() {
  if (!heroWeekText || !heroDdayText || !heroFocusText) return;

  const progress = getPregnancyProgress();
  const next = getUpcomingMilestones(1)[0];

  heroWeekText.textContent = `${progress.week}주 ${progress.day}일`;
  heroDdayText.textContent =
    progress.daysUntilDue >= 0 ? `D-${progress.daysUntilDue}` : `예정일 +${Math.abs(progress.daysUntilDue)}일`;
  heroFocusText.textContent = next ? next.shortTitle : "예정된 신청 포인트 없음";
}

function renderCalendar() {
  if (!calendarMonthText || !calendarRangeText || !calendarGrid) return;

  const monthDays = getCalendarDays(calendarMonthDate);
  const { start, end } = getMonthBounds(calendarMonthDate);
  const today = startOfDay(new Date());

  calendarMonthText.textContent = formatMonth(start);
  calendarRangeText.textContent = `${formatDate(start)} - ${formatDate(end)}`;
  calendarGrid.innerHTML = "";

  monthDays.forEach((date) => {
    const items = getMilestonesForDate(date);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `calendar-day${date.getMonth() !== start.getMonth() ? " is-outside" : ""}${isSameDate(date, today) ? " is-today" : ""}${isSameDate(date, selectedDate) ? " is-selected" : ""}`;
    cell.innerHTML = `
      <div class="calendar-day-top">
        <span class="calendar-day-number">${date.getDate()}</span>
        <span class="calendar-day-week">${getPregnancyProgress(date).week}주</span>
      </div>
      <div class="calendar-day-points">
        ${items.slice(0, 2).map((item) => `<span class="calendar-point">${item.shortTitle}</span>`).join("")}
        ${items.length > 2 ? `<span class="calendar-point calendar-point--more">+${items.length - 2}</span>` : ""}
      </div>
    `;
    cell.addEventListener("click", () => {
      selectedDate = startOfDay(date);
      renderCalendar();
      renderSelectedDate();
    });
    calendarGrid.appendChild(cell);
  });
}

function renderSelectedDate() {
  if (!selectedDateText || !selectedDateMetaText || !selectedDateList) return;

  const items = getMilestonesForDate(selectedDate);
  const progress = getPregnancyProgress(selectedDate);

  selectedDateText.textContent = formatDate(selectedDate);
  selectedDateMetaText.textContent = `${progress.week}주 ${progress.day}일 기준 신청 포인트 ${items.length}건`;

  if (items.length === 0) {
    selectedDateList.innerHTML = '<div class="empty-state">이 날짜에 배치된 신청 포인트가 없습니다.</div>';
    return;
  }

  selectedDateList.innerHTML = items
    .map(
      (item) => `
        <article class="detail-card">
          <div class="detail-card__head">
            <span class="detail-card__category">${item.category === "work" ? "근로" : "지원"}</span>
            <strong>${item.title}</strong>
          </div>
          <p class="detail-card__summary">${item.summary}</p>
          <p class="detail-card__body">${item.details}</p>
          <div class="detail-card__meta">
            <span class="pill">${item.official ? "공식 출처" : "참고"}</span>
            ${item.audience ? `<span class="pill">${item.audience}</span>` : ""}
            <span class="pill">${item.why}</span>
          </div>
          <a class="detail-card__link" href="${item.href}" target="_blank" rel="noreferrer">${item.sourceLabel}</a>
        </article>
      `,
    )
    .join("");
}

function renderUpcomingMilestones() {
  if (!nextMilestoneList) return;

  const items = getUpcomingMilestones();
  if (items.length === 0) {
    nextMilestoneList.innerHTML = '<div class="empty-state compact">예정된 신청 포인트가 없습니다.</div>';
    return;
  }

  nextMilestoneList.innerHTML = items
    .map(
      (item) => `
        <article class="upcoming-item">
          <span class="upcoming-item__date">${formatDate(item.date)}</span>
          <strong>${item.shortTitle}</strong>
          <p>${item.summary}</p>
        </article>
      `,
    )
    .join("");
}

function renderSettings() {
  if (!lmpInput || !dueInput) return;
  lmpInput.value = settings.lmpDate;
  dueInput.value = settings.dueDate;
  if (settingsReviewedAt) {
    settingsReviewedAt.textContent = `자료 검토일 ${reviewedAt}`;
  }
}

function initSettingsEvents() {
  if (lmpInput && dueInput) {
    lmpInput.addEventListener("change", () => {
      const lmp = parseISODate(lmpInput.value);
      if (!lmp) return;
      dueInput.value = formatISODate(addDays(lmp, 280));
    });

    dueInput.addEventListener("change", () => {
      const due = parseISODate(dueInput.value);
      if (!due) return;
      lmpInput.value = formatISODate(addDays(due, -280));
    });
  }

  if (saveSettingsButton && lmpInput && dueInput) {
    saveSettingsButton.addEventListener("click", () => {
      const next = saveSettings({
        lmpDate: lmpInput.value,
        dueDate: dueInput.value,
      });
      if (settingsStatusText) {
        settingsStatusText.textContent = `저장됨: 마지막 생리 시작일 ${next.lmpDate}, 출산예정일 ${next.dueDate}`;
      }
    });
  }

  if (resetSettingsButton && lmpInput && dueInput) {
    resetSettingsButton.addEventListener("click", () => {
      const next = saveSettings({
        lmpDate: DEFAULT_LMP_DATE,
        dueDate: formatISODate(addDays(parseISODate(DEFAULT_LMP_DATE), 280)),
      });
      lmpInput.value = next.lmpDate;
      dueInput.value = next.dueDate;
      if (settingsStatusText) {
        settingsStatusText.textContent = "기본 기준일로 되돌렸습니다.";
      }
    });
  }
}

function initCalendarEvents() {
  if (calendarPrevButton) {
    calendarPrevButton.addEventListener("click", () => {
      calendarMonthDate = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() - 1, 1);
      renderCalendar();
    });
  }

  if (calendarNextButton) {
    calendarNextButton.addEventListener("click", () => {
      calendarMonthDate = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 1);
      renderCalendar();
    });
  }

  if (calendarTodayButton) {
    calendarTodayButton.addEventListener("click", () => {
      selectedDate = startOfDay(new Date());
      calendarMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      renderCalendar();
      renderSelectedDate();
    });
  }
}

function render() {
  if (PAGE === "settings") {
    renderSettings();
    return;
  }

  renderHero();
  renderCalendar();
  renderSelectedDate();
  renderUpcomingMilestones();
}

initSettingsEvents();
initCalendarEvents();
render();
