/**
 * Lịch Nhà - Vietnamese Lunar Calendar Dashboard
 * Main Application Module
 */

import {
  convertSolar2Lunar, convertLunar2Solar, getCanChi, getDayCanChi,
  getMonthCanChi, getAnimal, getNextSolarDate, getDaysUntil,
  formatSolarDate, DAY_OF_WEEK_VN, MONTH_VN, getTodayVN, getLunarToday
} from './lib/lunarCalendar.js';

// ===================================================
// STATE MANAGEMENT
// ===================================================

const STORAGE_KEY = 'lichNha_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

// Default data
const DEFAULT_REMINDERS = [
  {
    id: 'def-tet', name: 'Tết Nguyên Đán', category: 'tet',
    lunarDay: 1, lunarMonth: 1, lunarLeap: false, solarDay: null, solarMonth: null,
    calendarType: 'lunar', repeat: true, note: 'Năm mới âm lịch 🎊', isDefault: true
  },
  {
    id: 'def-rang', name: 'Rằm tháng Giêng', category: 'rang',
    lunarDay: 15, lunarMonth: 1, lunarLeap: false, solarDay: null, solarMonth: null,
    calendarType: 'lunar', repeat: true, note: 'Rằm đầu năm 🌕', isDefault: true
  },
  {
    id: 'def-doan-ngo', name: 'Tết Đoan Ngọ', category: 'doan-ngo',
    lunarDay: 5, lunarMonth: 5, lunarLeap: false, solarDay: null, solarMonth: null,
    calendarType: 'lunar', repeat: true, note: 'Giết sâu bọ 🍑', isDefault: true
  },
  {
    id: 'def-vu-lan', name: 'Lễ Vu Lan', category: 'vu-lan',
    lunarDay: 15, lunarMonth: 7, lunarLeap: false, solarDay: null, solarMonth: null,
    calendarType: 'lunar', repeat: true, note: 'Mùa báo hiếu 🌸', isDefault: true
  },
  {
    id: 'def-trung-thu', name: 'Tết Trung Thu', category: 'trung-thu',
    lunarDay: 15, lunarMonth: 8, lunarLeap: false, solarDay: null, solarMonth: null,
    calendarType: 'lunar', repeat: true, note: 'Trăng rằm tháng 8 🥮', isDefault: true
  },
  {
    id: 'def-thanh-minh', name: 'Tiết Thanh Minh', category: 'thanh-minh',
    lunarDay: 3, lunarMonth: 3, lunarLeap: false, solarDay: null, solarMonth: null,
    calendarType: 'lunar', repeat: true, note: 'Tảo mộ tổ tiên 🌿', isDefault: true
  },
  {
    id: 'def-than-tai', name: 'Vía Thần Tài', category: 'rang',
    lunarDay: 10, lunarMonth: 1, lunarLeap: false, solarDay: null, solarMonth: null,
    calendarType: 'lunar', repeat: true, note: 'Cúng Thần Tài đầu năm 🪙', isDefault: true
  },
  {
    id: 'def-mung1', name: 'Mùng 1 hàng tháng', category: 'mung',
    lunarDay: 1, lunarMonth: null, lunarLeap: false, solarDay: null, solarMonth: null,
    calendarType: 'lunar', repeat: true, note: 'Mùng 1 âm lịch 🕯️', isDefault: true, everyMonth: true
  },
  {
    id: 'def-rang-monthly', name: 'Rằm hàng tháng', category: 'rang',
    lunarDay: 15, lunarMonth: null, lunarLeap: false, solarDay: null, solarMonth: null,
    calendarType: 'lunar', repeat: true, note: 'Rằm âm lịch 🌕', isDefault: true, everyMonth: true
  },
];

function getDefaultState() {
  return {
    reminders: [...DEFAULT_REMINDERS],
    settings: {
      theme: 'light',
      showCanChi: true,
      showDefaultHolidays: true,
      dashboardEventCount: 7,
      weekStart: 'mon'
    }
  };
}

let appState = loadState() || getDefaultState();

// Make sure default reminders exist in state
DEFAULT_REMINDERS.forEach(def => {
  if (!appState.reminders.find(r => r.id === def.id)) {
    appState.reminders.unshift(def);
  }
});

// ===================================================
// CATEGORY CONFIG
// ===================================================

const CATEGORIES = {
  'gio': { label: 'Giỗ', icon: '🪔', cssClass: 'cat-gio', tagClass: 'tag-gio' },
  'rang': { label: 'Rằm / Lễ', icon: '🌕', cssClass: 'cat-rang', tagClass: 'tag-rang' },
  'mung': { label: 'Mùng 1', icon: '🌑', cssClass: 'cat-mung', tagClass: 'tag-mung' },
  'tet': { label: 'Tết', icon: '🎊', cssClass: 'cat-tet', tagClass: 'tag-tet' },
  'trung-thu': { label: 'Trung Thu', icon: '🥮', cssClass: 'cat-trung-thu', tagClass: 'tag-trung-thu' },
  'vu-lan': { label: 'Vu Lan', icon: '🌸', cssClass: 'cat-vu-lan', tagClass: 'tag-vu-lan' },
  'thanh-minh': { label: 'Thanh Minh', icon: '🌿', cssClass: 'cat-thanh-minh', tagClass: 'tag-thanh-minh' },
  'doan-ngo': { label: 'Đoan Ngọ', icon: '🍑', cssClass: 'cat-doan-ngo', tagClass: 'tag-doan-ngo' },
  'giadinh': { label: 'Gia đình', icon: '👨‍👩‍👧‍👦', cssClass: 'cat-giadinh', tagClass: 'tag-giadinh' },
  'khac': { label: 'Khác', icon: '📌', cssClass: 'cat-khac', tagClass: 'tag-khac' },
};

// ===================================================
// COMPUTED EVENTS (with next solar date)
// ===================================================

function computeNextDate(reminder) {
  if (reminder.everyMonth) {
    // Find the next occurrence this month or next month
    const today = getTodayVN();
    const curYear = today.getUTCFullYear();
    const curMonth = today.getUTCMonth() + 1;
    const curDay = today.getUTCDate();

    // Try current lunar month and next ones
    const lunarToday = convertSolar2Lunar(curDay, curMonth, curYear);

    for (let offset = 0; offset <= 13; offset++) {
      let tryLunarMonth = lunarToday.month + offset;
      let tryLunarYear = lunarToday.year;
      while (tryLunarMonth > 12) { tryLunarMonth -= 12; tryLunarYear++; }
      const solar = convertLunar2Solar(reminder.lunarDay, tryLunarMonth, tryLunarYear, false);
      if (solar[0] === 0) continue;
      const solarDate = new Date(Date.UTC(solar[2], solar[1] - 1, solar[0]));
      if (solarDate >= today) return solarDate;
    }
    return null;
  }

  if (reminder.calendarType === 'lunar') {
    return getNextSolarDate(reminder.lunarDay, reminder.lunarMonth, reminder.lunarLeap);
  } else {
    // Solar date
    const today = getTodayVN();
    const curYear = today.getUTCFullYear();
    for (let yo = 0; yo <= 1; yo++) {
      const d = new Date(Date.UTC(curYear + yo, reminder.solarMonth - 1, reminder.solarDay));
      if (d >= today) return d;
    }
    return new Date(Date.UTC(curYear + 1, reminder.solarMonth - 1, reminder.solarDay));
  }
}

function getEnrichedReminders() {
  return appState.reminders.map(r => {
    const nextDate = computeNextDate(r);
    const daysUntil = nextDate ? getDaysUntil(nextDate) : 999;
    let nextLunar = null;
    if (nextDate) {
      nextLunar = convertSolar2Lunar(nextDate.getUTCDate(), nextDate.getUTCMonth() + 1, nextDate.getUTCFullYear());
    }
    return { ...r, nextDate, daysUntil, nextLunar };
  }).sort((a, b) => a.daysUntil - b.daysUntil);
}

// ===================================================
// UI STATE
// ===================================================

let currentTab = 'dashboard';
let currentFilter = 'all';
let searchQuery = '';
let editingId = null;
let calendarViewDate = new Date(getTodayVN());
let selectedCalDate = null;

// ===================================================
// TOAST
// ===================================================

function showToast(msg, duration = 2500) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ===================================================
// THEME
// ===================================================

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    html.setAttribute('data-theme', theme);
  }
  // Update theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// ===================================================
// RENDER HELPERS
// ===================================================

function renderCategoryTag(category) {
  const cat = CATEGORIES[category] || CATEGORIES['khac'];
  return `<span class="reminder-tag ${cat.tagClass}">${cat.icon} ${cat.label}</span>`;
}

function renderEventCard(event, index) {
  const cat = CATEGORIES[event.category] || CATEGORIES['khac'];
  const days = event.daysUntil;
  const isToday = days === 0;
  const nextDate = event.nextDate;
  const nextLunar = event.nextLunar;

  const solarStr = nextDate ? formatSolarDate(nextDate) : '—';
  const lunarStr = nextLunar ? `${nextLunar.day}/${nextLunar.month}${nextLunar.leap ? ' nhuận' : ''}` : '—';

  return `
    <div class="event-card ${cat.cssClass}" onclick="showEventDetail('${event.id}')" style="animation-delay:${index * 0.05}s">
      <div class="event-dot">${cat.icon}</div>
      <div class="event-info">
        <div class="event-name">${event.name}</div>
        <div class="event-dates">☀️ ${solarStr} &nbsp;🌙 ${lunarStr}</div>
      </div>
      <div class="event-countdown">
        ${isToday
          ? `<div class="event-today">Hôm nay!</div>`
          : `<div class="event-days">${days < 0 ? '—' : days}</div><div class="event-days-label">ngày</div>`
        }
      </div>
    </div>
  `;
}

function renderReminderCard(reminder, index) {
  const cat = CATEGORIES[reminder.category] || CATEGORIES['khac'];
  const enriched = getEnrichedReminders().find(r => r.id === reminder.id) || reminder;
  const nextDate = enriched.nextDate;
  const days = enriched.daysUntil;

  const lunarStr = reminder.everyMonth
    ? `Mùng ${reminder.lunarDay} hàng tháng`
    : reminder.calendarType === 'lunar' && reminder.lunarMonth
      ? `${reminder.lunarDay}/${reminder.lunarMonth}${reminder.lunarLeap ? ' nhuận' : ''} âm lịch`
      : `${reminder.solarDay}/${reminder.solarMonth} dương lịch`;

  const nextSolarStr = nextDate ? formatSolarDate(nextDate) : '—';
  const daysLabel = days === 0 ? 'Hôm nay!' : days > 0 ? `Còn ${days} ngày` : 'Đã qua';

  return `
    <div class="reminder-card ${cat.cssClass}" style="animation-delay:${index * 0.04}s">
      <div class="reminder-header">
        <div>
          <div class="reminder-name">${cat.icon} ${reminder.name}</div>
          <div class="reminder-meta">
            ${renderCategoryTag(reminder.category)}
            ${reminder.repeat ? '<span class="reminder-repeat">🔄 Hàng năm</span>' : ''}
            ${reminder.isDefault ? '<span class="reminder-tag tag-khac">📌 Mặc định</span>' : ''}
          </div>
        </div>
        <div class="reminder-actions">
          ${!reminder.isDefault ? `<button class="btn-action" onclick="openEditModal('${reminder.id}'); event.stopPropagation();" title="Sửa">✏️</button>` : ''}
          ${!reminder.isDefault ? `<button class="btn-action delete" onclick="deleteReminder('${reminder.id}'); event.stopPropagation();" title="Xóa">🗑️</button>` : ''}
        </div>
      </div>
      <div class="reminder-date-row">🌙 ${lunarStr} &nbsp;|&nbsp; ☀️ Kế tiếp: ${nextSolarStr} &nbsp;|&nbsp; <strong>${daysLabel}</strong></div>
      ${reminder.note ? `<div class="reminder-note">${reminder.note}</div>` : ''}
    </div>
  `;
}

// ===================================================
// MINI CALENDAR
// ===================================================

function buildMiniCalendar() {
  const viewYear = calendarViewDate.getUTCFullYear();
  const viewMonth = calendarViewDate.getUTCMonth(); // 0-indexed
  const today = getTodayVN();

  // Get event dates for the month to highlight them
  const enriched = getEnrichedReminders();
  const eventDates = new Set();
  enriched.forEach(e => {
    if (e.nextDate) {
      const ey = e.nextDate.getUTCFullYear();
      const em = e.nextDate.getUTCMonth();
      if (ey === viewYear && em === viewMonth) {
        eventDates.add(e.nextDate.getUTCDate());
      }
    }
  });

  const firstDay = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay(); // 0=Sun
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();

  const weekStart = appState.settings.weekStart === 'sun' ? 0 : 1;
  const dows = weekStart === 1
    ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  let dowsHtml = dows.map(d => `<div class="mini-cal-dow">${d}</div>`).join('');

  // Adjust firstDay offset based on weekStart
  let startOffset = (firstDay - weekStart + 7) % 7;

  let cells = [];
  // Previous month days
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const pm = viewMonth === 0 ? 12 : viewMonth;
    const py = viewMonth === 0 ? viewYear - 1 : viewYear;
    const lunar = convertSolar2Lunar(d, pm, py);
    cells.push({ day: d, month: viewMonth - 1, year: viewYear, otherMonth: true, lunarDay: lunar.day, lunarMonth: lunar.month });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const lunar = convertSolar2Lunar(d, viewMonth + 1, viewYear);
    cells.push({ day: d, month: viewMonth, year: viewYear, otherMonth: false, lunarDay: lunar.day, lunarMonth: lunar.month });
  }
  // Fill remaining
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nm = viewMonth === 11 ? 1 : viewMonth + 2;
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
    const lunar = convertSolar2Lunar(d, nm, ny);
    cells.push({ day: d, month: viewMonth + 1, year: viewYear, otherMonth: true, lunarDay: lunar.day, lunarMonth: lunar.month });
  }

  let cellsHtml = cells.map(c => {
    const isToday = !c.otherMonth
      && c.day === today.getUTCDate()
      && viewMonth === today.getUTCMonth()
      && viewYear === today.getUTCFullYear();
    const hasEvent = !c.otherMonth && eventDates.has(c.day);
    const isSelected = selectedCalDate
      && c.day === selectedCalDate.getUTCDate()
      && c.month === selectedCalDate.getUTCMonth()
      && c.year === selectedCalDate.getUTCFullYear();
    const dowIndex = cells.indexOf(c) % 7;
    const actualDow = (weekStart + dowIndex) % 7;
    const isSun = actualDow === 0;
    const isSat = actualDow === 6;

    return `<div class="mini-cal-day${c.otherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}${isSelected && !isToday ? ' selected' : ''}${hasEvent ? ' has-event' : ''}${isSun ? ' sunday' : ''}${isSat ? ' saturday' : ''}"
      onclick="selectCalDate(${c.year}, ${c.month}, ${c.day})">
      <div class="solar">${c.day}</div>
      <div class="lunar-tiny">${c.lunarDay === 1 ? `${c.lunarDay}/${c.lunarMonth}` : c.lunarDay}</div>
    </div>`;
  }).join('');

  return `
    <div class="mini-calendar">
      <div class="mini-cal-header">
        <div class="mini-cal-title">${MONTH_VN[viewMonth]} ${viewYear}</div>
        <div class="mini-cal-nav">
          <button onclick="changeCalMonth(-1)">‹</button>
          <button onclick="changeCalMonth(1)">›</button>
        </div>
      </div>
      <div class="mini-cal-grid">
        ${dowsHtml}
        ${cellsHtml}
      </div>
    </div>
  `;
}

// ===================================================
// RENDER TABS
// ===================================================

function renderDashboard() {
  const today = getTodayVN();
  const lunarToday = getLunarToday();
  const dayOfWeek = today.getUTCDay();
  const dayNum = today.getUTCDate();
  const month = today.getUTCMonth();
  const year = today.getUTCFullYear();

  const yearCanChi = getCanChi(lunarToday.year);
  const dayCanChi = getDayCanChi(lunarToday.jd);
  const animal = getAnimal(lunarToday.year);

  // Special day badges
  const badges = [];
  if (lunarToday.day === 1) badges.push({ text: 'Mùng 1 âm lịch', special: false });
  if (lunarToday.day === 15) badges.push({ text: 'Rằm âm lịch', special: true });
  if (lunarToday.day === 14) badges.push({ text: 'Hôm nay rằm', special: false });

  const enriched = getEnrichedReminders();
  const count = appState.settings.dashboardEventCount || 7;
  const upcomingEvents = enriched.filter(e => e.daysUntil >= 0).slice(0, count);

  const calHtml = buildMiniCalendar();

  return `
    <div class="today-hero">
      <div class="today-dow">${DAY_OF_WEEK_VN[dayOfWeek]}</div>
      <div class="today-day">${dayNum}</div>
      <div class="today-month">${MONTH_VN[month]}, ${year}</div>
      <div class="today-divider"></div>
      <div class="today-lunar">🌙 Âm lịch: ${lunarToday.day} tháng ${lunarToday.month}${lunarToday.leap ? ' nhuận' : ''} năm ${yearCanChi}</div>
      ${appState.settings.showCanChi ? `<div class="today-canchhi">🐉 Con giáp: ${animal} &nbsp;|&nbsp; Ngày: ${dayCanChi}</div>` : ''}
      ${badges.length > 0 ? `<div class="today-badges">${badges.map(b => `<span class="today-badge${b.special ? ' special' : ''}">${b.text}</span>`).join('')}</div>` : ''}
    </div>

    ${calHtml}

    <div class="section-header">
      <div class="section-title"><span class="section-title-icon">🔔</span> Sắp tới</div>
      <div class="section-link" onclick="switchTab('reminders')">Xem tất cả →</div>
    </div>
    <div class="events-list">
      ${upcomingEvents.length > 0
        ? upcomingEvents.map((e, i) => renderEventCard(e, i)).join('')
        : `<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-title">Không có sự kiện</div><div class="empty-state-desc">Thêm nhắc nhở để xem tại đây</div></div>`
      }
    </div>
    <div style="height: 80px;"></div>
  `;
}

function renderReminders() {
  const enriched = getEnrichedReminders();
  let filtered = enriched;

  if (currentFilter !== 'all') {
    filtered = filtered.filter(r => r.category === currentFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || (r.note || '').toLowerCase().includes(q));
  }

  const filters = [
    { id: 'all', label: 'Tất cả' },
    ...Object.entries(CATEGORIES).map(([id, cat]) => ({ id, label: cat.label }))
  ];

  return `
    <div class="reminders-search">
      <input type="search" class="search-input" placeholder="🔍  Tìm kiếm nhắc nhở..." value="${searchQuery}" oninput="handleSearch(this.value)" />
    </div>
    <div class="filter-row">
      ${filters.map(f => `<button class="filter-chip${currentFilter === f.id ? ' active' : ''}" onclick="setFilter('${f.id}')">${f.label}</button>`).join('')}
    </div>
    <div id="reminders-list">
      ${filtered.length > 0
        ? filtered.map((r, i) => renderReminderCard(r, i)).join('')
        : `<div class="empty-state"><div class="empty-state-icon">🗒️</div><div class="empty-state-title">${searchQuery ? 'Không tìm thấy' : 'Chưa có nhắc nhở'}</div><div class="empty-state-desc">${searchQuery ? `Không có kết quả cho "${searchQuery}"` : 'Nhấn + để thêm ngày quan trọng cho gia đình'}</div></div>`
      }
    </div>
    <div style="height: 80px;"></div>
  `;
}

function renderConfig() {
  const s = appState.settings;
  const shareUrl = window.location.href;

  return `
    <div class="config-section">
      <div class="config-section-title">Giao diện</div>
      <div class="config-card">
        <div class="config-item">
          <div class="config-item-left">
            <div class="config-item-label">🎨 Chủ đề</div>
            <div class="config-item-desc">Chọn màu sắc giao diện</div>
          </div>
          <div class="theme-selector">
            <button class="theme-btn${s.theme === 'light' ? ' active' : ''}" data-theme="light" onclick="setTheme('light')">☀️ Sáng</button>
            <button class="theme-btn${s.theme === 'dark' ? ' active' : ''}" data-theme="dark" onclick="setTheme('dark')">🌙 Tối</button>
            <button class="theme-btn${s.theme === 'system' ? ' active' : ''}" data-theme="system" onclick="setTheme('system')">⚙️ Hệ thống</button>
          </div>
        </div>
      </div>
    </div>

    <div class="config-section">
      <div class="config-section-title">Hiển thị</div>
      <div class="config-card">
        <div class="config-item">
          <div class="config-item-left">
            <div class="config-item-label">🐉 Hiện Can Chi / Địa Chi</div>
            <div class="config-item-desc">Hiển thị thông tin Can Chi trên dashboard</div>
          </div>
          <div class="toggle-switch${s.showCanChi ? ' on' : ''}" onclick="toggleSetting('showCanChi')"></div>
        </div>
        <div class="config-item">
          <div class="config-item-left">
            <div class="config-item-label">🎉 Hiện lễ mặc định</div>
            <div class="config-item-desc">Tết, Rằm, Mùng 1, lễ truyền thống Việt Nam</div>
          </div>
          <div class="toggle-switch${s.showDefaultHolidays ? ' on' : ''}" onclick="toggleSetting('showDefaultHolidays')"></div>
        </div>
        <div class="config-item">
          <div class="config-item-left">
            <div class="config-item-label">📅 Số sự kiện trên Dashboard</div>
            <div class="config-item-desc">Số lượng sự kiện sắp tới hiển thị</div>
          </div>
          <select class="config-select" onchange="setSetting('dashboardEventCount', parseInt(this.value))">
            ${[3,5,7,10,15].map(n => `<option value="${n}"${s.dashboardEventCount === n ? ' selected' : ''}>${n} sự kiện</option>`).join('')}
          </select>
        </div>
        <div class="config-item">
          <div class="config-item-left">
            <div class="config-item-label">📅 Ngày bắt đầu tuần</div>
          </div>
          <div class="select-group">
            <button class="select-opt${s.weekStart === 'mon' ? ' active' : ''}" onclick="setSetting('weekStart','mon'); renderApp()">Thứ 2</button>
            <button class="select-opt${s.weekStart === 'sun' ? ' active' : ''}" onclick="setSetting('weekStart','sun'); renderApp()">CN</button>
          </div>
        </div>
      </div>
    </div>

    <div class="config-section">
      <div class="config-section-title">Chia sẻ</div>
      <div class="share-section">
        <div class="share-title">🔗 Chia sẻ Lịch Nhà</div>
        <div class="share-desc">Chia sẻ ứng dụng để người thân cùng tra cứu lịch âm dương. Dữ liệu cá nhân (nhắc nhở riêng) không được chia sẻ.</div>
        <div class="share-url" id="share-url">${shareUrl}</div>
        <div class="share-buttons">
          <button class="btn btn-secondary btn-sm" onclick="copyShareLink()">📋 Copy link</button>
          <button class="btn btn-gold btn-sm" onclick="nativeShare()" id="native-share-btn" style="display:none">📤 Chia sẻ</button>
        </div>
      </div>
    </div>

    <div class="config-section">
      <div class="config-section-title">Dữ liệu</div>
      <div class="config-card">
        <div class="config-item">
          <div class="config-item-left">
            <div class="config-item-label">🗑️ Xóa tất cả nhắc nhở cá nhân</div>
            <div class="config-item-desc">Khôi phục về nhắc nhở mặc định</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="resetReminders()">Xóa</button>
        </div>
        <div class="config-item">
          <div class="config-item-left">
            <div class="config-item-label">📦 Phiên bản</div>
            <div class="config-item-desc">Lịch Nhà v1.0 – Lịch Âm Việt Nam</div>
          </div>
        </div>
      </div>
    </div>
    <div style="height: 24px;"></div>
  `;
}

// ===================================================
// MODAL: ADD/EDIT REMINDER
// ===================================================

function renderFormModal(reminder = null) {
  const isEdit = !!reminder;
  const r = reminder || {};

  const catOptions = Object.entries(CATEGORIES).map(([id, cat]) =>
    `<option value="${id}"${r.category === id ? ' selected' : ''}>${cat.icon} ${cat.label}</option>`
  ).join('');

  const dayOptions = Array.from({length: 30}, (_, i) => i + 1)
    .map(d => `<option value="${d}"${r.lunarDay === d ? ' selected' : ''}>${d}</option>`).join('');

  const monthOptions = Array.from({length: 12}, (_, i) => i + 1)
    .map(m => `<option value="${m}"${r.lunarMonth === m ? ' selected' : ''}>Tháng ${m}</option>`).join('');

  const isLunar = !r.calendarType || r.calendarType === 'lunar';

  return `
    <div class="modal-backdrop" id="form-modal" onclick="handleModalBackdropClick(event)">
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <div class="modal-title">${isEdit ? '✏️ Sửa nhắc nhở' : '➕ Thêm nhắc nhở'}</div>
          <button class="modal-close" onclick="closeModal('form-modal')">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Tên sự kiện *</label>
            <input type="text" class="form-input" id="f-name" placeholder="Ví dụ: Giỗ Nội, Giỗ Ngoại..." value="${r.name || ''}" />
          </div>

          <div class="form-group">
            <label class="form-label">Phân loại</label>
            <select class="form-select" id="f-category">${catOptions}</select>
          </div>

          <div class="form-group">
            <label class="form-label">Loại lịch</label>
            <div class="select-group">
              <button class="select-opt${isLunar ? ' active' : ''}" onclick="switchCalType('lunar')" id="cal-lunar-btn">🌙 Âm lịch</button>
              <button class="select-opt${!isLunar ? ' active' : ''}" onclick="switchCalType('solar')" id="cal-solar-btn">☀️ Dương lịch</button>
            </div>
            <input type="hidden" id="f-cal-type" value="${r.calendarType || 'lunar'}" />
          </div>

          <div id="lunar-fields">
            <div class="form-group">
              <label class="form-label">Ngày âm lịch *</label>
              <div class="num-select-row">
                <select class="form-select" id="f-lunar-day" onchange="updateConvertedDate()">
                  <option value="">Ngày</option>
                  ${dayOptions}
                </select>
                <select class="form-select" id="f-lunar-month" onchange="updateConvertedDate()">
                  <option value="">Tháng</option>
                  ${monthOptions}
                </select>
              </div>
            </div>
            <div class="form-group">
              <div class="form-toggle" onclick="toggleLeap()">
                <span class="form-toggle-label">Tháng nhuận</span>
                <div class="toggle-switch${r.lunarLeap ? ' on' : ''}" id="leap-toggle"></div>
              </div>
              <input type="hidden" id="f-lunar-leap" value="${r.lunarLeap ? 'true' : 'false'}" />
            </div>
            <div class="form-converted" id="converted-date"></div>
          </div>

          <div id="solar-fields" style="display:none">
            <div class="form-group">
              <label class="form-label">Ngày dương lịch *</label>
              <div class="num-select-row">
                <select class="form-select" id="f-solar-day">
                  <option value="">Ngày</option>
                  ${Array.from({length:31},(_, i)=>i+1).map(d => `<option value="${d}"${r.solarDay === d ? ' selected' : ''}>${d}</option>`).join('')}
                </select>
                <select class="form-select" id="f-solar-month">
                  <option value="">Tháng</option>
                  ${Array.from({length:12},(_, i)=>i+1).map(m => `<option value="${m}"${r.solarMonth === m ? ' selected' : ''}>Tháng ${m}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Năm cụ thể (nếu không lặp lại)</label>
            <input type="number" class="form-input" id="f-year" placeholder="Bỏ trống = lặp lại hàng năm" value="${r.specificYear || ''}" min="1900" max="2100" />
            <div class="form-hint">Để trống nếu muốn nhắc hàng năm</div>
          </div>

          <div class="form-group">
            <div class="form-toggle" onclick="toggleRepeat()">
              <span class="form-toggle-label">🔄 Lặp lại hàng năm</span>
              <div class="toggle-switch${r.repeat !== false ? ' on' : ''}" id="repeat-toggle"></div>
            </div>
            <input type="hidden" id="f-repeat" value="${r.repeat !== false ? 'true' : 'false'}" />
          </div>

          <div class="form-group">
            <label class="form-label">Ghi chú</label>
            <textarea class="form-textarea" id="f-note" placeholder="Thêm ghi chú...">${r.note || ''}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('form-modal')">Hủy</button>
          <button class="btn btn-primary" onclick="saveReminder('${r.id || ''}')">💾 Lưu</button>
        </div>
      </div>
    </div>
  `;
}

// ===================================================
// MODAL: EVENT DETAIL
// ===================================================

function renderDetailModal(event) {
  const cat = CATEGORIES[event.category] || CATEGORIES['khac'];
  const days = event.daysUntil;
  const isToday = days === 0;
  const nextDate = event.nextDate;
  const nextLunar = event.nextLunar;

  const lunarStr = event.everyMonth
    ? `Mùng ${event.lunarDay} hàng tháng`
    : event.calendarType === 'lunar' && event.lunarMonth
      ? `${event.lunarDay} tháng ${event.lunarMonth}${event.lunarLeap ? ' nhuận' : ''} âm lịch`
      : `${event.solarDay}/${event.solarMonth} dương lịch`;

  const nextSolarStr = nextDate ? formatSolarDate(nextDate) : '—';
  const nextLunarStr = nextLunar ? `${nextLunar.day} tháng ${nextLunar.month}${nextLunar.leap ? ' nhuận' : ''} năm ${getCanChi(nextLunar.year)}` : '—';
  const dow = nextDate ? DAY_OF_WEEK_VN[nextDate.getUTCDay()] : '';
  const nextDayCanChi = nextLunar ? getDayCanChi(nextLunar.jd) : '';

  return `
    <div class="modal-backdrop" id="detail-modal" onclick="handleModalBackdropClick(event)">
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <div class="modal-title">${cat.icon} ${event.name}</div>
          <button class="modal-close" onclick="closeModal('detail-modal')">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-date-card">
            <div class="detail-countdown">${isToday ? '🎉' : days < 0 ? '—' : days}</div>
            <div class="detail-countdown-label">${isToday ? 'Hôm nay là ngày này!' : days > 0 ? `ngày nữa${days === 1 ? ' (ngày mai)' : ''}` : 'Đã qua'}</div>
            <div class="detail-dates">
              <div class="detail-date">
                <div class="detail-date-label">☀️ Dương lịch</div>
                <div class="detail-date-value">${nextSolarStr}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${dow}</div>
              </div>
              <div class="detail-date">
                <div class="detail-date-label">🌙 Âm lịch</div>
                <div class="detail-date-value">${nextLunarStr}</div>
                ${appState.settings.showCanChi ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">Ngày ${nextDayCanChi}</div>` : ''}
              </div>
            </div>
          </div>

          <div class="detail-tags">
            ${renderCategoryTag(event.category)}
            ${event.repeat ? '<span class="reminder-tag tag-khac">🔄 Hàng năm</span>' : ''}
            ${event.isDefault ? '<span class="reminder-tag tag-khac">📌 Mặc định</span>' : ''}
          </div>

          <div class="detail-section-label">Ngày lặp lại</div>
          <div class="detail-note" style="margin-bottom:12px">${lunarStr}</div>

          ${event.note ? `<div class="detail-section-label">Ghi chú</div><div class="detail-note">${event.note}</div>` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('detail-modal')">Đóng</button>
          ${!event.isDefault ? `<button class="btn btn-primary" onclick="closeModal('detail-modal'); openEditModal('${event.id}')">✏️ Sửa</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ===================================================
// APP STRUCTURE
// ===================================================

function renderApp() {
  const app = document.getElementById('app');

  const enriched = getEnrichedReminders();

  app.innerHTML = `
    <div class="app-container">
      <header class="app-header">
        <a class="app-logo" href="#">
          <span>🏮</span> Lịch Nhà
        </a>
        <div class="header-actions">
          <button class="btn-icon" onclick="quickToggleTheme()" title="Chuyển chủ đề">
            ${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <nav class="tab-bar">
        <button class="tab-btn${currentTab === 'dashboard' ? ' active' : ''}" onclick="switchTab('dashboard')">
          <span class="tab-icon">🏠</span> Dashboard
        </button>
        <button class="tab-btn${currentTab === 'reminders' ? ' active' : ''}" onclick="switchTab('reminders')">
          <span class="tab-icon">🔔</span> Nhắc nhở
          ${enriched.filter(e => e.daysUntil === 0).length > 0 ? `<span style="background:var(--accent);color:white;border-radius:999px;padding:1px 6px;font-size:10px">${enriched.filter(e => e.daysUntil === 0).length}</span>` : ''}
        </button>
        <button class="tab-btn${currentTab === 'config' ? ' active' : ''}" onclick="switchTab('config')">
          <span class="tab-icon">⚙️</span> Cấu hình
        </button>
      </nav>

      <main>
        <div id="tab-dashboard" class="tab-content${currentTab === 'dashboard' ? ' active' : ''}">
          ${renderDashboard()}
        </div>
        <div id="tab-reminders" class="tab-content${currentTab === 'reminders' ? ' active' : ''}">
          ${renderReminders()}
        </div>
        <div id="tab-config" class="tab-content${currentTab === 'config' ? ' active' : ''}">
          ${renderConfig()}
        </div>
      </main>

      <button class="fab" onclick="openAddModal()" title="Thêm nhắc nhở">+</button>
    </div>
    <div class="toast" id="toast"></div>
  `;

  // Show native share if available
  if (navigator.share) {
    const btn = document.getElementById('native-share-btn');
    if (btn) btn.style.display = 'flex';
  }
}

// ===================================================
// GLOBAL ACTIONS (bound to window for onclick handlers)
// ===================================================

window.switchTab = function(tab) {
  currentTab = tab;
  renderApp();
  window.scrollTo(0, 0);
};

window.openAddModal = function() {
  editingId = null;
  closeAllModals();
  document.body.insertAdjacentHTML('beforeend', renderFormModal());
  setTimeout(() => document.getElementById('form-modal')?.classList.add('open'), 10);
  document.getElementById('f-name')?.focus();
  updateConvertedDate();
};

window.openEditModal = function(id) {
  const r = appState.reminders.find(r => r.id === id);
  if (!r) return;
  editingId = id;
  closeAllModals();
  document.body.insertAdjacentHTML('beforeend', renderFormModal(r));
  setTimeout(() => document.getElementById('form-modal')?.classList.add('open'), 10);
  updateConvertedDate();
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 400);
  }
};

window.handleModalBackdropClick = function(e) {
  if (e.target.classList.contains('modal-backdrop')) {
    const modal = e.target;
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 400);
  }
};

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => {
    m.classList.remove('open');
    setTimeout(() => m.remove(), 400);
  });
}

window.showEventDetail = function(id) {
  const enriched = getEnrichedReminders();
  const event = enriched.find(e => e.id === id);
  if (!event) return;
  closeAllModals();
  document.body.insertAdjacentHTML('beforeend', renderDetailModal(event));
  setTimeout(() => document.getElementById('detail-modal')?.classList.add('open'), 10);
};

window.switchCalType = function(type) {
  document.getElementById('f-cal-type').value = type;
  const lunarFields = document.getElementById('lunar-fields');
  const solarFields = document.getElementById('solar-fields');
  const lunarBtn = document.getElementById('cal-lunar-btn');
  const solarBtn = document.getElementById('cal-solar-btn');
  if (type === 'lunar') {
    lunarFields.style.display = '';
    solarFields.style.display = 'none';
    lunarBtn.classList.add('active');
    solarBtn.classList.remove('active');
  } else {
    lunarFields.style.display = 'none';
    solarFields.style.display = '';
    lunarBtn.classList.remove('active');
    solarBtn.classList.add('active');
  }
};

window.toggleLeap = function() {
  const input = document.getElementById('f-lunar-leap');
  const toggle = document.getElementById('leap-toggle');
  const current = input.value === 'true';
  input.value = (!current).toString();
  toggle.classList.toggle('on', !current);
  updateConvertedDate();
};

window.toggleRepeat = function() {
  const input = document.getElementById('f-repeat');
  const toggle = document.getElementById('repeat-toggle');
  const current = input.value === 'true';
  input.value = (!current).toString();
  toggle.classList.toggle('on', !current);
};

window.updateConvertedDate = function() {
  const day = parseInt(document.getElementById('f-lunar-day')?.value);
  const month = parseInt(document.getElementById('f-lunar-month')?.value);
  const leap = document.getElementById('f-lunar-leap')?.value === 'true';
  const converted = document.getElementById('converted-date');
  if (!converted) return;

  if (day && month) {
    const today = getTodayVN();
    const year = today.getUTCFullYear();
    const solar = convertLunar2Solar(day, month, year, leap);
    if (solar[0] !== 0) {
      converted.textContent = `☀️ Năm ${year}: ${solar[0]}/${solar[1]}/${solar[2]} dương lịch`;
      converted.classList.add('show');
    } else {
      converted.textContent = 'Không có tháng nhuận trong năm này.';
      converted.classList.add('show');
    }
  } else {
    converted.classList.remove('show');
  }
};

window.saveReminder = function(existingId) {
  const name = document.getElementById('f-name')?.value.trim();
  const category = document.getElementById('f-category')?.value;
  const calType = document.getElementById('f-cal-type')?.value;
  const note = document.getElementById('f-note')?.value.trim();
  const repeat = document.getElementById('f-repeat')?.value === 'true';
  const specificYear = document.getElementById('f-year')?.value;

  if (!name) { showToast('⚠️ Vui lòng nhập tên sự kiện'); return; }

  let reminder = {
    id: existingId || `user-${Date.now()}`,
    name, category: category || 'khac', calendarType: calType || 'lunar',
    note, repeat, isDefault: false,
    specificYear: specificYear ? parseInt(specificYear) : null,
  };

  if (calType === 'lunar') {
    const day = parseInt(document.getElementById('f-lunar-day')?.value);
    const month = parseInt(document.getElementById('f-lunar-month')?.value);
    const leap = document.getElementById('f-lunar-leap')?.value === 'true';
    if (!day || !month) { showToast('⚠️ Vui lòng chọn ngày và tháng âm lịch'); return; }
    reminder.lunarDay = day;
    reminder.lunarMonth = month;
    reminder.lunarLeap = leap;
  } else {
    const day = parseInt(document.getElementById('f-solar-day')?.value);
    const month = parseInt(document.getElementById('f-solar-month')?.value);
    if (!day || !month) { showToast('⚠️ Vui lòng chọn ngày và tháng dương lịch'); return; }
    reminder.solarDay = day;
    reminder.solarMonth = month;
  }

  if (existingId) {
    const idx = appState.reminders.findIndex(r => r.id === existingId);
    if (idx !== -1) appState.reminders[idx] = reminder;
  } else {
    appState.reminders.push(reminder);
  }

  saveState(appState);
  closeAllModals();
  renderApp();
  showToast(existingId ? '✅ Đã cập nhật nhắc nhở' : '✅ Đã thêm nhắc nhở mới');
};

window.deleteReminder = function(id) {
  if (!confirm('Xóa nhắc nhở này?')) return;
  appState.reminders = appState.reminders.filter(r => r.id !== id);
  saveState(appState);
  renderApp();
  showToast('🗑️ Đã xóa nhắc nhở');
};

window.handleSearch = function(val) {
  searchQuery = val;
  const list = document.getElementById('reminders-list');
  if (list) {
    // Re-render just the list
    const enriched = getEnrichedReminders();
    let filtered = enriched;
    if (currentFilter !== 'all') filtered = filtered.filter(r => r.category === currentFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || (r.note || '').toLowerCase().includes(q));
    }
    list.innerHTML = filtered.length > 0
      ? filtered.map((r, i) => renderReminderCard(r, i)).join('')
      : `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Không tìm thấy</div><div class="empty-state-desc">Không có kết quả cho "${val}"</div></div>`;
  }
};

window.setFilter = function(filter) {
  currentFilter = filter;
  // Update chips
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.filter-chip').forEach(c => {
    if (c.textContent.trim() === (filter === 'all' ? 'Tất cả' : CATEGORIES[filter]?.label)) {
      c.classList.add('active');
    }
  });
  // Re-render list
  handleSearch(searchQuery);
};

window.setTheme = function(theme) {
  appState.settings.theme = theme;
  saveState(appState);
  applyTheme(theme);
  // Update buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  // Update header icon
  const headerBtn = document.querySelector('.app-header .btn-icon');
  if (headerBtn) {
    headerBtn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  }
};

window.quickToggleTheme = function() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  appState.settings.theme = next;
  saveState(appState);
  applyTheme(next);
  renderApp();
};

window.toggleSetting = function(key) {
  appState.settings[key] = !appState.settings[key];
  saveState(appState);
  const toggle = document.querySelector(`[onclick="toggleSetting('${key}')"] .toggle-switch`);
  if (toggle) toggle.classList.toggle('on', appState.settings[key]);
  if (key === 'showDefaultHolidays') {
    // Re-render dashboard with updated setting
    const dashTab = document.getElementById('tab-dashboard');
    if (dashTab && dashTab.classList.contains('active')) {
      dashTab.innerHTML = renderDashboard();
    }
  }
};

window.setSetting = function(key, value) {
  appState.settings[key] = value;
  saveState(appState);
};

window.changeCalMonth = function(dir) {
  calendarViewDate = new Date(Date.UTC(
    calendarViewDate.getUTCFullYear(),
    calendarViewDate.getUTCMonth() + dir,
    1
  ));
  // Re-render calendar
  const dashTab = document.getElementById('tab-dashboard');
  if (dashTab) {
    const miniCal = dashTab.querySelector('.mini-calendar');
    if (miniCal) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = buildMiniCalendar();
      miniCal.replaceWith(wrapper.firstChild);
    }
  }
};

window.selectCalDate = function(year, month, day) {
  selectedCalDate = new Date(Date.UTC(year, month, day));
  const lunar = convertSolar2Lunar(day, month + 1, year);
  const canChi = appState.settings.showCanChi ? `Ngày ${getDayCanChi(lunar.jd)}, ` : '';
  showToast(`${day}/${month+1}/${year} — 🌙 ${lunar.day}/${lunar.month}${lunar.leap ? ' nhuận' : ''} năm ${getCanChi(lunar.year)}`);

  // Re-render calendar
  const dashTab = document.getElementById('tab-dashboard');
  if (dashTab) {
    const miniCal = dashTab.querySelector('.mini-calendar');
    if (miniCal) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = buildMiniCalendar();
      miniCal.replaceWith(wrapper.firstChild);
    }
  }
};

window.copyShareLink = function() {
  const url = window.location.href;
  navigator.clipboard?.writeText(url).then(() => {
    showToast('✅ Đã copy link chia sẻ!');
  }).catch(() => {
    // Fallback
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('✅ Đã copy link chia sẻ!');
  });
};

window.nativeShare = async function() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Lịch Nhà – Lịch Âm Việt Nam',
        text: 'Tra cứu lịch âm dương và ngày lễ Việt Nam',
        url: window.location.href,
      });
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Không thể chia sẻ');
    }
  }
};

window.resetReminders = function() {
  if (!confirm('Xóa tất cả nhắc nhở cá nhân và khôi phục về mặc định?')) return;
  appState.reminders = [...DEFAULT_REMINDERS];
  saveState(appState);
  renderApp();
  showToast('✅ Đã khôi phục nhắc nhở mặc định');
};

// ===================================================
// INIT
// ===================================================

function init() {
  // Apply saved theme
  applyTheme(appState.settings.theme);

  // Filter default events based on settings
  if (!appState.settings.showDefaultHolidays) {
    // Keep user reminders but filter for display is done at render time
  }

  // Render app
  renderApp();

  // Update daily at midnight
  const now = new Date();
  const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  setTimeout(() => {
    renderApp();
    setInterval(renderApp, 24 * 60 * 60 * 1000);
  }, msToMidnight);
}

// Start
init();
