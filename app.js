const storeKey = "lhMaintenanceData";
const legacyStoreKey = "maintenanceDeskData";
const appVersion = "1.2.7";
const appBuild = "20260515r";
const defaultApiUrl = "https://script.google.com/macros/s/AKfycbzfsye5T03XaH5YVY27i6Hk7T9frOHYtJ4XRPezG5xLhfQonBdWvjrLaMK0we_5mj0/exec";
const pushConfig = {
  firebaseApiKey: "AIzaSyCbpeDorCWK50tBwbZ3EL8HtMqknyuPpes",
  firebaseAppId: "1:538805424236:web:8343ea16d3ae30232c4849",
  firebaseProjectId: "lh-maintenance",
  firebaseSenderId: "538805424236",
  publicVapidKey: "BOyXX127q2MAWVD_Wk2_5dpwX4mvL7YA_D29mAA9ziAWwGBxCk64rWtFidVvfXSl4veq9jderp5tVsSF5Yl1jts",
  subscribeEndpoint: ""
};
const remoteRefreshMs = 10000;
const defaultWorkspace = {
  name: "LHSG Maintenance",
  databaseOwnerEmail: "lhsgmaintenance@gmail.com",
  adminEmails: ["lhsgmaintenance@gmail.com"],
  apiUrl: defaultApiUrl,
  sheetId: "",
  driveFolderId: "",
  firebaseApiKey: "",
  firebaseAppId: "",
  firebaseProjectId: "",
  firebaseSenderId: "",
  vapidPublicKey: ""
};

const seedData = {
  orders: [
    {
      id: "WO-1001",
      title: "Hydraulic oil leak at press line",
      asset: "Press Machine 2",
      area: "Production",
      assignee: "Ahmad",
      taskType: "Breakdown",
      priority: "Critical",
      status: "In Progress",
      due: todayOffset(0),
      hours: 3,
      details: "Leak visible near pump outlet. Isolate before shift change.",
      checklist: [],
      startedAt: new Date().toISOString(),
      endedAt: "",
      completedAt: "",
      updates: ["Pump isolated. Seal kit required."],
      assigneeEmail: "",
      adminEmail: "",
      attachment: null
    },
    {
      id: "WO-1002",
      title: "Forklift horn intermittent",
      asset: "Forklift FL-03",
      area: "Warehouse",
      assignee: "Wei Chen",
      taskType: "Breakdown",
      priority: "High",
      status: "Open",
      due: todayOffset(1),
      hours: 1,
      details: "Operator reports horn fails after long use.",
      checklist: [],
      startedAt: "",
      endedAt: "",
      completedAt: "",
      updates: [],
      assigneeEmail: "",
      adminEmail: "",
      attachment: null
    },
    {
      id: "WO-1003",
      title: "Monthly compressor inspection",
      asset: "Air Compressor A",
      area: "Utility",
      assignee: "Ravi",
      taskType: "Routine Maintenance",
      priority: "Medium",
      status: "Completed",
      due: todayOffset(-1),
      hours: 2,
      details: "Routine PM inspection.",
      checklist: [
        { text: "Check oil level", status: "ok" },
        { text: "Inspect belt condition", status: "ok" },
        { text: "Drain moisture trap", status: "ok" }
      ],
      startedAt: todayOffset(-1) + "T09:00:00.000Z",
      endedAt: todayOffset(-1) + "T11:00:00.000Z",
      completedAt: todayOffset(-1) + "T11:00:00.000Z",
      updates: ["Completed. Belt condition acceptable."],
      assigneeEmail: "",
      adminEmail: "",
      attachment: null
    }
  ],
  assets: [
    { name: "Press Machine 2", area: "Production", type: "Machine", lastService: todayOffset(-35) },
    { name: "Forklift FL-03", area: "Warehouse", type: "Vehicle", lastService: todayOffset(-18) },
    { name: "Air Compressor A", area: "Utility", type: "Utility", lastService: todayOffset(-1) }
  ],
  routines: [
    {
      id: "RT-1001",
      title: "Monthly compressor inspection",
      asset: "Air Compressor A",
      area: "Utility",
      assignee: "Ravi",
      taskType: "Routine Maintenance",
      frequencyDays: 30,
      nextDue: todayOffset(30),
      priority: "Medium",
      hours: 2,
      checklist: ["Check oil level", "Inspect belt condition", "Check abnormal noise", "Drain moisture trap"],
      details: "Check oil level, belt condition, abnormal noise, drain moisture trap."
    }
  ],
  notifications: [
    {
      id: "NT-1001",
      assignee: "Ravi",
      orderId: "WO-1003",
      title: "Assigned: Monthly compressor inspection",
      message: "WO-1003 has been assigned to Ravi.",
      createdAt: new Date().toISOString(),
      read: false
    }
  ],
  settings: {
    userEmail: "",
    username: "",
    users: [],
    role: "user",
    workspace: cloneData(defaultWorkspace),
    pushSubscription: null
  }
};

let data = loadData();
let activeView = "dashboard";
let deferredInstallPrompt = null;
let remoteRefreshTimer = null;
let remoteRefreshInFlight = false;
let lastRemoteFingerprint = "";
let firebaseApp = null;
let firebaseMessaging = null;

const els = {
  viewTitle: document.querySelector("#viewTitle"),
  navButtons: document.querySelectorAll(".nav-btn"),
  views: document.querySelectorAll(".view"),
  newOrderBtn: document.querySelector("#newOrderBtn"),
  orderDialog: document.querySelector("#orderDialog"),
  orderForm: document.querySelector("#orderForm"),
  profileBtn: document.querySelector("#profileBtn"),
  profileDialog: document.querySelector("#profileDialog"),
  profileForm: document.querySelector("#profileForm"),
  closeProfileBtn: document.querySelector("#closeProfileBtn"),
  cancelProfileBtn: document.querySelector("#cancelProfileBtn"),
  closeDialogBtn: document.querySelector("#closeDialogBtn"),
  cancelBtn: document.querySelector("#cancelBtn"),
  deleteOrderBtn: document.querySelector("#deleteOrderBtn"),
  enableNotifyBtn: document.querySelector("#enableNotifyBtn"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  priorityFilter: document.querySelector("#priorityFilter"),
  exportBtn: document.querySelector("#exportBtn"),
  importFile: document.querySelector("#importFile"),
  printBtn: document.querySelector("#printBtn"),
  addAssetBtn: document.querySelector("#addAssetBtn"),
  assetDialog: document.querySelector("#assetDialog"),
  assetForm: document.querySelector("#assetForm"),
  closeAssetBtn: document.querySelector("#closeAssetBtn"),
  cancelAssetBtn: document.querySelector("#cancelAssetBtn"),
  newRoutineBtn: document.querySelector("#newRoutineBtn"),
  routineDialog: document.querySelector("#routineDialog"),
  routineForm: document.querySelector("#routineForm"),
  closeRoutineBtn: document.querySelector("#closeRoutineBtn"),
  cancelRoutineBtn: document.querySelector("#cancelRoutineBtn"),
  deleteRoutineBtn: document.querySelector("#deleteRoutineBtn"),
  clearNotificationsBtn: document.querySelector("#clearNotificationsBtn"),
  installAppBtn: document.querySelector("#installAppBtn"),
  roleStatus: document.querySelector("#roleStatus"),
  workspaceForm: document.querySelector("#workspaceForm"),
  resetWorkspaceBtn: document.querySelector("#resetWorkspaceBtn"),
  appVersion: document.querySelector("#appVersion"),
  updateBanner: document.querySelector("#updateBanner"),
  updateText: document.querySelector("#updateText"),
  updateAppBtn: document.querySelector("#updateAppBtn"),
  syncNowBtn: document.querySelector("#syncNowBtn"),
  syncStatus: document.querySelector("#syncStatus")
};

function todayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function loadData() {
  try {
    const stored = localStorage.getItem(storeKey) || localStorage.getItem(legacyStoreKey);
    const loaded = stored ? JSON.parse(stored) : cloneData(seedData);
    return normalizeData(loaded);
  } catch {
    return normalizeData(cloneData(seedData));
  }
}

function normalizeData(loaded) {
  loaded.orders = loaded.orders || [];
  loaded.assets = loaded.assets || [];
  loaded.routines = loaded.routines || [];
  loaded.notifications = loaded.notifications || [];
  loaded.settings = loaded.settings || {};
  loaded.settings.userEmail = loaded.settings.userEmail || "";
  loaded.settings.username = loaded.settings.username || "";
  loaded.settings.users = normalizeUsers(loaded.settings.users || []);
  loaded.settings.workspace = normalizeWorkspace(loaded.settings.workspace);
  loaded.settings.role = getRoleForEmail(loaded.settings.userEmail, loaded.settings.workspace);
  loaded.settings.pushSubscription = loaded.settings.pushSubscription || null;
  loaded.orders.forEach(order => {
    order.taskType = order.taskType || (String(order.id || "").indexOf("WO-1003") === 0 ? "Routine Maintenance" : "Breakdown");
    order.startedAt = order.startedAt || "";
    order.endedAt = order.endedAt || "";
    order.completedAt = order.completedAt || "";
    order.draftUpdate = order.draftUpdate || "";
    order.checklist = order.checklist || [];
    order.checklist = order.checklist.map(item => ({
      text: typeof item === "string" ? item : item.text,
      status: item.status || (item.checked ? "ok" : "")
    }));
    order.updates = order.updates || [];
    order.assigneeEmail = normalizeEmail(order.assigneeEmail);
    order.adminEmail = normalizeEmail(order.adminEmail);
    order.attachment = order.attachment || null;
  });
  loaded.notifications.forEach(note => {
    note.type = note.type || "assignment";
    note.assigneeEmail = normalizeEmail(note.assigneeEmail);
    note.adminEmail = normalizeEmail(note.adminEmail);
    note.recipients = Array.isArray(note.recipients) ? note.recipients.map(normalizeEmail).filter(Boolean) : [];
    if (!note.recipients.length) {
      note.recipients = [note.assigneeEmail, note.adminEmail, ...loaded.settings.workspace.adminEmails].map(normalizeEmail).filter(Boolean);
    }
    note.read = Boolean(note.read);
  });
  loaded.routines.forEach(routine => {
    routine.taskType = routine.taskType || "Routine Maintenance";
    routine.assigneeEmail = normalizeEmail(routine.assigneeEmail);
    routine.checklist = routine.checklist || (routine.details
      ? routine.details.split(",").map(item => item.trim()).filter(Boolean)
      : []);
  });
  return loaded;
}

function saveData() {
  localStorage.setItem(storeKey, JSON.stringify(data));
}

function backendUrl() {
  const workspace = data.settings && data.settings.workspace ? data.settings.workspace : {};
  return String(workspace.apiUrl || defaultApiUrl).trim();
}

async function loadRemoteData() {
  const url = backendUrl();
  if (!url || !data.settings.userEmail) return false;
  const before = remoteSnapshot();
  const response = await fetch(`${url}?action=load&email=${encodeURIComponent(data.settings.userEmail)}&t=${Date.now()}`);
  const payload = await response.json();
  if (!payload.ok) throw new Error(payload.error || "Backend load failed.");
  mergeRemoteData(payload.data || {});
  announceRemoteChanges(before, remoteSnapshot());
  saveData();
  updateSyncStatus("ok", `Synced ${formatTimeOnly(new Date())}: ${visibleOrders().length} visible task(s), ${data.orders.length} loaded.`);
  return true;
}

async function postRemote(action, body = {}) {
  const url = backendUrl();
  if (!url || !data.settings.userEmail) return null;
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      action,
      actorEmail: data.settings.userEmail,
      ...body
    })
  });
  const payload = await response.json();
  if (!payload.ok) throw new Error(payload.error || "Backend save failed.");
  if (payload.data) {
    mergeRemoteData(payload.data);
    saveData();
  }
  return payload;
}

function mergeRemoteData(remote) {
  const localSettings = data.settings || {};
  const localWorkspace = localSettings.workspace || {};
  const localUsers = normalizeUsers(localSettings.users || []);
  const localNotifications = data.notifications || [];
  data.orders = remote.orders || [];
  data.assets = remote.assets || [];
  data.routines = remote.routines || [];
  data.notifications = mergeNotifications(remote.notifications || [], localNotifications);
  data.settings = {
    ...localSettings,
    ...(remote.settings || {})
  };
  data.settings.workspace = normalizeWorkspace({
    ...localWorkspace,
    ...((remote.settings && remote.settings.workspace) || {}),
    apiUrl: localWorkspace.apiUrl || ((remote.settings && remote.settings.workspace && remote.settings.workspace.apiUrl) || defaultApiUrl)
  });
  data.settings.userEmail = normalizeEmail(data.settings.userEmail || localSettings.userEmail);
  data.settings.username = data.settings.username || localSettings.username || "";
  data.settings.users = mergeUsers(data.settings.users || [], localUsers);
  data.settings.role = getRoleForEmail(data.settings.userEmail, data.settings.workspace);
}

async function syncOrder(order, options = {}) {
  try {
    await postRemote("upsertOrder", { order });
    updateSyncStatus("ok", `Saved to Google ${formatTimeOnly(new Date())}.`);
  } catch (err) {
    updateSyncStatus("error", `Google sync pending: ${err.message}`);
    if (!options.silent) alert(`Could not sync task to Google database: ${err.message}`);
  }
}

async function syncAllAdmin(options = {}) {
  if (!canManageData()) return;
  try {
    await postRemote("saveAll", { data });
    updateSyncStatus("ok", `Saved to Google ${formatTimeOnly(new Date())}.`);
  } catch (err) {
    updateSyncStatus("error", `Google sync pending: ${err.message}`);
    if (!options.silent) alert(`Could not sync admin changes to Google database: ${err.message}`);
  }
}

function syncOrderInBackground(order) {
  syncOrder(cloneData(order), { silent: true });
}

function syncAllAdminInBackground() {
  syncAllAdmin({ silent: true });
}

async function refreshRemoteData({ announceErrors = false } = {}) {
  if (remoteRefreshInFlight || !backendUrl() || !data.settings.userEmail || document.hidden) return false;
  remoteRefreshInFlight = true;
  try {
    const loaded = await loadRemoteData();
    if (loaded) render();
    return loaded;
  } catch (err) {
    updateSyncStatus("error", `Sync failed: ${err.message}`);
    if (announceErrors) alert(`Could not refresh Google database: ${err.message}`);
    return false;
  } finally {
    remoteRefreshInFlight = false;
  }
}

function updateSyncStatus(state, message) {
  if (!els.syncStatus) return;
  els.syncStatus.textContent = message;
  els.syncStatus.classList.toggle("sync-ok", state === "ok");
  els.syncStatus.classList.toggle("sync-error", state === "error");
}

async function forceRefresh() {
  await updateApp();
}

async function syncNow() {
  updateSyncStatus("ok", "Syncing now...");
  const loaded = await refreshRemoteData({ announceErrors: true });
  if (!loaded) return;
  render();
}

function startRemoteRefresh() {
  if (remoteRefreshTimer) clearInterval(remoteRefreshTimer);
  if (!backendUrl() || !data.settings.userEmail) return;
  remoteRefreshTimer = setInterval(() => {
    refreshRemoteData();
  }, remoteRefreshMs);
}

function remoteSnapshot() {
  const orders = {};
  data.orders.forEach(order => {
    orders[order.id] = {
      title: order.title,
      status: order.status,
      assignee: order.assignee,
      assigneeEmail: normalizeEmail(order.assigneeEmail),
      adminEmail: normalizeEmail(order.adminEmail),
      updateCount: (order.updates || []).length,
      latestUpdate: (order.updates || []).slice(-1)[0] || ""
    };
  });
  return {
    fingerprint: JSON.stringify({
      orders,
      notifications: data.notifications.map(note => note.id).sort(),
      users: data.settings.users
    }),
    orders
  };
}

function announceRemoteChanges(before, after) {
  if (!before || !after || !lastRemoteFingerprint) {
    lastRemoteFingerprint = after ? after.fingerprint : "";
    return;
  }
  if (before.fingerprint === after.fingerprint) return;
  Object.entries(after.orders).forEach(([id, order]) => {
    const previous = before.orders[id];
    if (!previous && isOrderAssignedToEmail(order, data.settings.userEmail)) {
      addLocalNotification({
        type: "assignment",
        assignee: order.assignee,
        assigneeEmail: order.assigneeEmail,
        adminEmail: order.adminEmail,
        recipients: notificationRecipients(order),
        orderId: id,
        title: `New task: ${order.title}`,
        message: `${id} has been assigned to you.`
      });
      return;
    }
    if (!previous) return;
    const statusChanged = previous.status !== order.status;
    const updateAdded = Number(previous.updateCount || 0) < Number(order.updateCount || 0);
    if ((statusChanged || updateAdded) && shouldNotifyAboutOrder(order)) {
      addLocalNotification({
        type: "status",
        assignee: order.assignee,
        assigneeEmail: order.assigneeEmail,
        adminEmail: order.adminEmail,
        recipients: notificationRecipients(order),
        orderId: id,
        title: `Updated: ${order.title}`,
        message: statusChanged
          ? `${id} changed from ${previous.status} to ${order.status}.`
          : `${id} has a new update.`
      });
    }
  });
  lastRemoteFingerprint = after.fingerprint;
}

function addLocalNotification(details) {
  const notification = {
    id: details.id || nextNotificationId(),
    type: details.type || "status",
    assignee: details.assignee || "",
    assigneeEmail: normalizeEmail(details.assigneeEmail),
    adminEmail: normalizeEmail(details.adminEmail),
    recipients: Array.isArray(details.recipients) ? details.recipients.map(normalizeEmail).filter(Boolean) : [],
    orderId: details.orderId || "",
    title: details.title || "LH Maintenance update",
    message: details.message || "A maintenance task was updated.",
    createdAt: details.createdAt || new Date().toISOString(),
    read: Boolean(details.read)
  };
  const duplicate = data.notifications.some(note => note.orderId === notification.orderId
    && note.type === notification.type
    && note.message === notification.message);
  if (duplicate) return;
  data.notifications.unshift(notification);
  showBrowserNotification(notification);
}

function mergeNotifications(primaryNotifications, fallbackNotifications) {
  const byKey = {};
  [...(fallbackNotifications || []), ...(primaryNotifications || [])].forEach(note => {
    const key = note.id || `${note.orderId || ""}|${note.type || ""}|${note.message || ""}`;
    byKey[key] = note;
  });
  return Object.values(byKey).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function render() {
  data = normalizeData(data);
  data.settings.role = getRoleForEmail(data.settings.userEmail);
  applyWorkspacePushConfig();
  renderAccessControls();
  renderWorkspaceForm();
  renderDashboard();
  renderOrders();
  renderRoutines();
  renderNotifications();
  renderCalendar();
  renderTeam();
  renderAssets();
  renderReports();
  renderVersion();
}

function renderVersion() {
  if (els.appVersion) els.appVersion.textContent = `v${appVersion}`;
}

function setView(view) {
  if (!canUseView(view)) view = "orders";
  activeView = view;
  els.viewTitle.textContent = viewLabels[view];
  els.navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  els.views.forEach(viewEl => viewEl.classList.toggle("active", viewEl.id === `${view}View`));
  if (["dashboard", "orders", "notifications"].includes(view)) {
    refreshRemoteData();
  }
}

const viewLabels = {
  dashboard: "Dashboard",
  orders: "Work Orders",
  routines: "Routine Tasks",
  notifications: "Notifications",
  calendar: "Calendar",
  team: "Team",
  assets: "Assets",
  reports: "Reports",
  live: "Live Version"
};

function renderDashboard() {
  const orders = visibleOrders();
  const open = orders.filter(o => o.status === "Open").length;
  const progress = orders.filter(o => o.status === "In Progress").length;
  const overdue = orders.filter(o => isOverdue(o)).length;
  const done = orders.filter(o => o.status === "Completed").length;
  setText("statOpen", open);
  setText("statProgress", progress);
  setText("statOverdue", overdue);
  setText("statDone", done);

  const urgent = orders
    .filter(o => o.status !== "Completed" && ["Critical", "High"].includes(o.priority))
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);
  document.querySelector("#urgentList").innerHTML = urgent.length
    ? urgent.map(orderCard).join("")
    : empty("No urgent open jobs.");

  const schedule = orders
    .filter(o => o.status !== "Completed")
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 6);
  document.querySelector("#scheduleList").innerHTML = schedule.length
    ? schedule.map(o => `<button class="timeline-item order-shortcut" data-order-id="${escapeHtml(o.id)}"><strong>${escapeHtml(o.due)}</strong><br>${escapeHtml(o.title)} - ${escapeHtml(o.assignee)}</button>`).join("")
    : empty("No upcoming work.");
}

function renderOrders() {
  const query = els.searchInput.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  const priority = els.priorityFilter.value;
  const filtered = visibleOrders().filter(order => {
    const text = `${order.id} ${order.title} ${order.asset} ${order.area} ${order.assignee}`.toLowerCase();
    return (!query || text.includes(query))
      && (status === "all" || order.status === status)
      && (priority === "all" || order.priority === priority);
  });
  document.querySelector("#ordersList").innerHTML = filtered.length
    ? filtered.map(orderCard).join("")
    : empty("No work orders match the current filters.");
}

function renderRoutines() {
  document.querySelector("#routinesList").innerHTML = data.routines.length
    ? data.routines
      .sort((a, b) => a.nextDue.localeCompare(b.nextDue))
      .map(routineCard)
      .join("")
    : empty("No routine maintenance tasks have been created.");
}

function renderCalendar() {
  const current = new Date();
  const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  renderCalendarMonth("calendarCurrent", "calendarCurrentTitle", current);
  renderCalendarMonth("calendarNext", "calendarNextTitle", next);
}

function renderCalendarMonth(containerId, titleId, date) {
  const container = document.querySelector(`#${containerId}`);
  if (!container) return;
  const year = date.getFullYear();
  const month = date.getMonth();
  document.querySelector(`#${titleId}`).textContent = date.toLocaleString([], { month: "long", year: "numeric" });
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay();
  const tasksByDate = calendarItemsForMonth(year, month);
  const cells = [];
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(day => {
    cells.push(`<div class="calendar-head-cell">${day}</div>`);
  });
  for (let i = 0; i < leading; i += 1) cells.push(`<div class="calendar-day muted-day"></div>`);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    const items = tasksByDate[key] || [];
    cells.push(`<div class="calendar-day">
      <strong>${day}</strong>
      ${items.map(item => `<button class="calendar-item ${escapeHtml(item.kind)}" data-order-id="${escapeHtml(item.orderId || "")}">${escapeHtml(item.label)}</button>`).join("")}
    </div>`);
  }
  container.innerHTML = cells.join("");
}

function calendarItemsForMonth(year, month) {
  const items = {};
  data.orders.forEach(order => {
    if (!isDateInMonth(order.due, year, month)) return;
    items[order.due] = items[order.due] || [];
    items[order.due].push({ kind: "work", label: `${order.id} ${order.title}`, orderId: order.id });
  });
  data.routines.forEach(routine => {
    routineDatesForMonth(routine, year, month).forEach(date => {
      items[date] = items[date] || [];
      items[date].push({ kind: "routine", label: `Routine: ${routine.title}` });
    });
  });
  return items;
}

function routineDatesForMonth(routine, year, month) {
  if (!routine.nextDue) return [];
  const dates = [];
  let due = routine.nextDue;
  const monthStart = `${year}-${pad2(month + 1)}-01`;
  const monthEnd = `${year}-${pad2(month + 1)}-${pad2(new Date(year, month + 1, 0).getDate())}`;
  let guard = 0;
  while (due < monthStart && guard < 60) {
    due = nextRoutineDate(due, routine.frequencyDays);
    guard += 1;
  }
  while (due <= monthEnd && guard < 80) {
    if (isDateInMonth(due, year, month)) dates.push(due);
    due = nextRoutineDate(due, routine.frequencyDays);
    guard += 1;
  }
  return dates;
}

function renderNotifications() {
  const notifications = visibleNotifications().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  document.querySelector("#notificationsList").innerHTML = notifications.length
    ? notifications.map(note => `<article class="order-card notification-card ${note.read ? "" : "unread"}" data-notification-id="${escapeHtml(note.id)}">
        <header>
          <div>
            <h4>${escapeHtml(note.title)}</h4>
            <div class="meta">${escapeHtml(formatDateTime(note.createdAt))} | ${escapeHtml(note.assignee)}</div>
          </div>
          <span class="pill Medium">${note.read ? "Read" : "New"}</span>
        </header>
        <p>${escapeHtml(note.message)}</p>
      </article>`).join("")
    : empty("No assignment notifications yet.");
}

function renderTeam() {
  const team = groupBy(data.orders.filter(o => o.status !== "Completed"), "assignee");
  const names = Object.keys(team).sort();
  const activeAssignments = names.length
    ? names.map(name => {
      const jobs = team[name].sort((a, b) => a.due.localeCompare(b.due));
      const hours = jobs.reduce((sum, job) => sum + Number(job.hours || 0), 0);
      return `<article class="team-card">
        <h4>${escapeHtml(name)}</h4>
        <p class="meta">${jobs.length} open jobs, ${hours} estimated hours</p>
        <ul>${jobs.map(job => `<li>${escapeHtml(job.id)} - ${escapeHtml(job.title)}</li>`).join("")}</ul>
      </article>`;
    }).join("")
    : empty("No active team assignments.");
  const registeredUsers = data.settings.users.length
    ? `<div class="user-directory">${data.settings.users.map(user => {
      const jobs = data.orders.filter(order => normalizeEmail(order.assigneeEmail) === normalizeEmail(user.email) && order.status !== "Completed").length;
      return `<article class="team-card user-card">
        <h4>${escapeHtml(user.username)}</h4>
        <p class="meta">${escapeHtml(user.email)}</p>
        <span class="table-pill Medium">${jobs} active</span>
      </article>`;
    }).join("")}</div>`
    : empty("No registered users yet. Users are added when they save their profile.");
  document.querySelector("#teamGrid").innerHTML = `
    <div class="section-head team-subhead"><h3>Active Assignments</h3></div>
    <div class="team-grid-inner">${activeAssignments}</div>
    <div class="section-head team-subhead"><h3>Registered Users</h3></div>
    ${registeredUsers}`;
}

function renderAssets() {
  const rows = data.assets.map(asset => {
    const openJobs = data.orders.filter(o => o.asset === asset.name && o.status !== "Completed").length;
    return `<tr>
      <td>${escapeHtml(asset.name)}</td>
      <td>${escapeHtml(asset.area)}</td>
      <td>${escapeHtml(asset.type)}</td>
      <td>${escapeHtml(asset.lastService)}</td>
      <td>${openJobs}</td>
    </tr>`;
  }).join("");
  document.querySelector("#assetsTable").innerHTML = `<table>
    <thead><tr><th>Asset</th><th>Area</th><th>Type</th><th>Last Service</th><th>Open Jobs</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderReports() {
  renderAssetReport();
  renderBarReport("taskTypeReport", countBy(data.orders, "taskType"));
  renderBarReport("priorityReport", countBy(data.orders, "priority"));
}

function renderAssetReport() {
  const rows = data.orders.reduce((items, order) => {
    const key = `${order.asset}||${order.taskType || "Breakdown"}||${order.priority}`;
    if (!items[key]) {
      items[key] = {
        asset: order.asset,
        taskType: order.taskType || "Breakdown",
        priority: order.priority,
        open: 0,
        completed: 0,
        total: 0
      };
    }
    items[key].total += 1;
    if (order.status === "Completed") {
      items[key].completed += 1;
    } else {
      items[key].open += 1;
    }
    return items;
  }, {});

  const body = Object.values(rows)
    .sort((a, b) => a.asset.localeCompare(b.asset) || a.taskType.localeCompare(b.taskType) || a.priority.localeCompare(b.priority))
    .map(row => `<tr>
      <td>${escapeHtml(row.asset)}</td>
      <td>${escapeHtml(row.taskType)}</td>
      <td><span class="table-pill ${escapeHtml(row.priority)}">${escapeHtml(row.priority)}</span></td>
      <td>${row.open}</td>
      <td>${row.completed}</td>
      <td>${row.total}</td>
    </tr>`)
    .join("");

  document.querySelector("#assetReport").innerHTML = body
    ? `<table>
        <thead><tr><th>Asset</th><th>Task Type</th><th>Priority</th><th>Open</th><th>Completed</th><th>Total</th></tr></thead>
        <tbody>${body}</tbody>
      </table>`
    : empty("No asset task data yet.");
}

function renderBarReport(id, counts) {
  const max = Math.max(1, ...Object.values(counts));
  document.querySelector(`#${id}`).innerHTML = Object.keys(counts).sort().map(key => {
    const value = counts[key];
    return `<div class="bar-row">
      <span>${escapeHtml(key)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(value / max) * 100}%"></div></div>
      <strong>${value}</strong>
    </div>`;
  }).join("") || empty("No data yet.");
}

function orderCard(order) {
  const editable = canEditOrder(order);
  const manageable = canManageData();
  const completed = order.status === "Completed";
  const overdue = isOverdue(order) ? "Overdue" : order.due;
  const latest = order.updates.length ? order.updates[order.updates.length - 1] : order.details;
  const emailMeta = [order.assigneeEmail, order.adminEmail].filter(Boolean).join(" | ");
  const attachmentHtml = order.attachment
    ? `<a class="attachment-link" href="${escapeAttribute(order.attachment.dataUrl)}" download="${escapeAttribute(order.attachment.name)}">Attachment: ${escapeHtml(order.attachment.name)}</a>`
    : `<span class="hint">No attachment added.</span>`;
  const attachmentLabel = order.attachment ? "Replace Attachment" : "Add Attachment";
  const timing = order.startedAt
    ? `Started ${formatDateTime(order.startedAt)}${order.endedAt ? ` | Ended ${formatDateTime(order.endedAt)}` : ""}`
    : "Not started";
  const canStart = editable && !completed && !order.startedAt;
  const canEnd = editable && !completed && order.startedAt && !order.endedAt;
  const canSubmit = editable && !completed && order.startedAt && order.endedAt;
  const checklistHtml = order.checklist.length
    ? `<div class="checklist">
        ${order.checklist.map((item, index) => `<div class="check-row">
          <span>${escapeHtml(item.text)}</span>
          <label><input type="radio" class="checklist-status" name="${escapeHtml(order.id)}-${index}" data-order-id="${escapeHtml(order.id)}" data-index="${index}" value="ok" ${item.status === "ok" ? "checked" : ""} ${completed ? "disabled" : ""}> Ok</label>
          <label><input type="radio" class="checklist-status" name="${escapeHtml(order.id)}-${index}" data-order-id="${escapeHtml(order.id)}" data-index="${index}" value="not_ok" ${item.status === "not_ok" ? "checked" : ""} ${completed ? "disabled" : ""}> Not ok</label>
        </div>`).join("")}
      </div>`
    : "";
  const statusText = completed ? "Complete" : order.status;
  return `<article class="order-card ${manageable ? "" : "readonly-card"} ${completed ? "completed-card" : ""}" data-order-id="${escapeHtml(order.id)}">
    <header>
      <div>
        <h4>${escapeHtml(order.id)} - ${escapeHtml(order.title)}</h4>
        <div class="meta">${escapeHtml(order.asset)} | ${escapeHtml(order.area)} | ${escapeHtml(order.assignee)} | ${escapeHtml(order.taskType || "Breakdown")}</div>
        ${emailMeta ? `<div class="meta">${escapeHtml(emailMeta)}</div>` : ""}
      </div>
      <div class="card-badges">
        ${completed ? `<span class="complete-pill">Complete</span>` : ""}
        <span class="pill ${escapeHtml(order.priority)}">${escapeHtml(order.priority)}</span>
      </div>
    </header>
    <p>${escapeHtml(latest)}</p>
    ${attachmentHtml}
    ${checklistHtml}
    <div class="meta">${escapeHtml(timing)}</div>
    <label class="completion-note">Latest Update Before Submit
      <textarea class="completion-update" data-order-id="${escapeHtml(order.id)}" rows="2" placeholder="Write what happened, or type N/A">${escapeHtml(order.draftUpdate || "N/A")}</textarea>
    </label>
    <div class="work-actions">
      <label class="secondary attachment-control">
        ${escapeHtml(attachmentLabel)}
        <input class="work-attachment-input" data-order-id="${escapeHtml(order.id)}" type="file" ${editable && !completed ? "" : "disabled"}>
      </label>
      <button class="secondary order-action" data-action="start" data-order-id="${escapeHtml(order.id)}" ${canStart ? "" : "disabled"}>Start</button>
      <button class="secondary order-action" data-action="end" data-order-id="${escapeHtml(order.id)}" ${canEnd ? "" : "disabled"}>End</button>
      <button class="primary order-action" data-action="submit" data-order-id="${escapeHtml(order.id)}" ${canSubmit ? "" : "disabled"}>Submit Done</button>
      <button class="secondary order-action" data-action="pdf" data-order-id="${escapeHtml(order.id)}" ${completed ? "" : "disabled"}>PDF Report</button>
    </div>
    <div class="card-foot">
      <span>${escapeHtml(statusText)}</span>
      <span>${escapeHtml(overdue)}</span>
    </div>
  </article>`;
}

function routineCard(routine) {
  const checklist = routine.checklist && routine.checklist.length
    ? `<ul class="routine-checklist">${routine.checklist.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p>${escapeHtml(routine.details || "No checklist entered.")}</p>`;
  return `<article class="order-card routine-card" data-routine-id="${escapeHtml(routine.id)}">
    <header>
      <div>
        <h4>${escapeHtml(routine.id)} - ${escapeHtml(routine.title)}</h4>
        <div class="meta">${escapeHtml(routine.asset)} | ${escapeHtml(routine.area)} | ${escapeHtml(routine.assignee)} | ${escapeHtml(routine.taskType || "Routine Maintenance")}</div>
      </div>
      <span class="pill ${escapeHtml(routine.priority)}">${escapeHtml(routine.priority)}</span>
    </header>
    ${checklist}
    <div class="work-actions">
      <button class="secondary routine-action" data-action="generate" data-routine-id="${escapeHtml(routine.id)}">Create Today's Work Order</button>
    </div>
    <div class="card-foot">
      <span>Every ${escapeHtml(routine.frequencyDays)} days</span>
      <span>Next due ${escapeHtml(routine.nextDue)}</span>
    </div>
  </article>`;
}

function openOrderDialog(order = null) {
  if (!canManageData()) return;
  document.querySelector("#dialogTitle").textContent = order ? "Edit Work Order" : "New Work Order";
  document.querySelector("#orderId").value = order ? order.id || "" : "";
  document.querySelector("#titleInput").value = order ? order.title || "" : "";
  document.querySelector("#assetInput").value = order ? order.asset || "" : "";
  document.querySelector("#areaInput").value = order ? order.area || "" : "";
  document.querySelector("#assigneeInput").value = order ? order.assignee || "" : "";
  document.querySelector("#assigneeEmailInput").value = order ? order.assigneeEmail || "" : "";
  document.querySelector("#adminEmailInput").value = order ? order.adminEmail || data.settings.userEmail || "" : data.settings.userEmail || "";
  document.querySelector("#taskTypeInput").value = order ? order.taskType || "Breakdown" : "Breakdown";
  document.querySelector("#priorityInput").value = order ? order.priority || "Medium" : "Medium";
  document.querySelector("#statusInput").value = order ? order.status || "Open" : "Open";
  document.querySelector("#dueInput").value = order ? order.due || todayOffset(1) : todayOffset(1);
  document.querySelector("#hoursInput").value = order ? order.hours || 1 : 1;
  document.querySelector("#detailsInput").value = order ? order.details || "" : "";
  document.querySelector("#updateInput").value = "";
  els.deleteOrderBtn.style.visibility = order ? "visible" : "hidden";
  openDialog(els.orderDialog);
}

async function saveOrder(event) {
  event.preventDefault();
  if (!canManageData()) return;
  const id = document.querySelector("#orderId").value || nextOrderId();
  const existing = data.orders.find(order => order.id === id);
  const previousAssignee = existing ? existing.assignee || "" : "";
  applyAssigneeUserMatch();
  const update = document.querySelector("#updateInput").value.trim();
  const order = {
    id,
    title: document.querySelector("#titleInput").value.trim(),
    asset: document.querySelector("#assetInput").value.trim(),
    area: document.querySelector("#areaInput").value.trim(),
    assignee: document.querySelector("#assigneeInput").value.trim(),
    assigneeEmail: normalizeEmail(document.querySelector("#assigneeEmailInput").value),
    adminEmail: normalizeEmail(document.querySelector("#adminEmailInput").value),
    taskType: document.querySelector("#taskTypeInput").value,
    priority: document.querySelector("#priorityInput").value,
    status: document.querySelector("#statusInput").value,
    due: document.querySelector("#dueInput").value,
    hours: Number(document.querySelector("#hoursInput").value),
    details: document.querySelector("#detailsInput").value.trim(),
    checklist: existing ? existing.checklist || [] : [],
    startedAt: existing ? existing.startedAt || "" : "",
    endedAt: existing ? existing.endedAt || "" : "",
    completedAt: existing ? existing.completedAt || "" : "",
    draftUpdate: existing ? existing.draftUpdate || "" : "",
    updates: existing ? existing.updates || [] : [],
    attachment: existing ? existing.attachment || null : null
  };
  if (update) order.updates.push(update);
  if (existing) {
    Object.assign(existing, order);
  } else {
    data.orders.unshift(order);
  }
  if (!data.assets.some(asset => asset.name === order.asset)) {
    data.assets.push({ name: order.asset, area: order.area, type: "Equipment", lastService: todayOffset(0) });
  }
  if (!existing || previousAssignee !== order.assignee) {
    createAssignmentNotification(order);
  }
  saveData();
  closeDialog(els.orderDialog);
  render();
  updateSyncStatus("ok", "Saved locally. Syncing to Google...");
  syncOrderInBackground(order);
}

async function deleteCurrentOrder() {
  if (!canManageData()) return;
  const id = document.querySelector("#orderId").value;
  data.orders = data.orders.filter(order => order.id !== id);
  saveData();
  closeDialog(els.orderDialog);
  render();
  updateSyncStatus("ok", "Deleted locally. Syncing to Google...");
  syncAllAdminInBackground();
}

async function saveAsset(event) {
  event.preventDefault();
  if (!canManageData()) return;
  data.assets.push({
    name: document.querySelector("#assetNameInput").value.trim(),
    area: document.querySelector("#assetAreaInput").value.trim(),
    type: document.querySelector("#assetTypeInput").value.trim(),
    lastService: document.querySelector("#assetServiceInput").value
  });
  saveData();
  closeDialog(els.assetDialog);
  els.assetForm.reset();
  render();
  updateSyncStatus("ok", "Saved locally. Syncing to Google...");
  syncAllAdminInBackground();
}

function openRoutineDialog(routine = null) {
  if (!canManageData()) return;
  document.querySelector("#routineDialogTitle").textContent = routine ? "Edit Routine" : "New Routine";
  document.querySelector("#routineId").value = routine ? routine.id || "" : "";
  document.querySelector("#routineTitleInput").value = routine ? routine.title || "" : "";
  document.querySelector("#routineAssetInput").value = routine ? routine.asset || "" : "";
  document.querySelector("#routineAreaInput").value = routine ? routine.area || "" : "";
  document.querySelector("#routineAssigneeInput").value = routine ? routine.assignee || "" : "";
  document.querySelector("#routineAssigneeEmailInput").value = routine ? routine.assigneeEmail || "" : "";
  document.querySelector("#routineTaskTypeInput").value = routine ? routine.taskType || "Routine Maintenance" : "Routine Maintenance";
  document.querySelector("#routineFrequencyInput").value = String(routine ? routine.frequencyDays || 30 : 30);
  document.querySelector("#routineNextDueInput").value = routine ? routine.nextDue || todayOffset(1) : todayOffset(1);
  document.querySelector("#routinePriorityInput").value = routine ? routine.priority || "Medium" : "Medium";
  document.querySelector("#routineHoursInput").value = routine ? routine.hours || 1 : 1;
  document.querySelector("#routineChecklistInput").value = (routine && routine.checklist ? routine.checklist : []).join("\n");
  document.querySelector("#routineDetailsInput").value = routine ? routine.details || "" : "";
  els.deleteRoutineBtn.style.visibility = routine ? "visible" : "hidden";
  openDialog(els.routineDialog);
}

async function saveRoutine(event) {
  event.preventDefault();
  if (!canManageData()) return;
  const id = document.querySelector("#routineId").value || nextRoutineId();
  const existing = data.routines.find(routine => routine.id === id);
  applyRoutineAssigneeUserMatch();
  const routine = {
    id,
    title: document.querySelector("#routineTitleInput").value.trim(),
    asset: document.querySelector("#routineAssetInput").value.trim(),
    area: document.querySelector("#routineAreaInput").value.trim(),
    assignee: document.querySelector("#routineAssigneeInput").value.trim(),
    assigneeEmail: normalizeEmail(document.querySelector("#routineAssigneeEmailInput").value),
    taskType: document.querySelector("#routineTaskTypeInput").value,
    frequencyDays: Number(document.querySelector("#routineFrequencyInput").value),
    nextDue: document.querySelector("#routineNextDueInput").value,
    priority: document.querySelector("#routinePriorityInput").value,
    hours: Number(document.querySelector("#routineHoursInput").value),
    checklist: parseChecklist(document.querySelector("#routineChecklistInput").value),
    details: document.querySelector("#routineDetailsInput").value.trim()
  };
  if (existing) {
    Object.assign(existing, routine);
  } else {
    data.routines.push(routine);
  }
  saveData();
  closeDialog(els.routineDialog);
  render();
  updateSyncStatus("ok", "Saved locally. Syncing to Google...");
  syncAllAdminInBackground();
}

async function deleteCurrentRoutine() {
  if (!canManageData()) return;
  const id = document.querySelector("#routineId").value;
  data.routines = data.routines.filter(routine => routine.id !== id);
  saveData();
  closeDialog(els.routineDialog);
  render();
  updateSyncStatus("ok", "Deleted locally. Syncing to Google...");
  syncAllAdminInBackground();
}

async function generateOrderFromRoutine(id) {
  if (!canManageData()) return;
  const routine = data.routines.find(item => item.id === id);
  if (!routine) return;
  const order = {
    id: nextOrderId(),
    title: routine.title,
    asset: routine.asset,
    area: routine.area,
    assignee: routine.assignee,
    assigneeEmail: normalizeEmail(routine.assigneeEmail),
    adminEmail: data.settings.userEmail || "",
    taskType: routine.taskType || "Routine Maintenance",
    priority: routine.priority,
    status: "Open",
    due: routine.nextDue,
    hours: routine.hours,
    details: `Routine maintenance from ${routine.id}. ${routine.details || ""}`.trim(),
    checklist: routine.checklist.map(text => ({ text, status: "" })),
    startedAt: "",
    endedAt: "",
    completedAt: "",
    updates: [],
    attachment: null
  };
  data.orders.unshift(order);
  routine.nextDue = nextRoutineDate(routine.nextDue, routine.frequencyDays);
  createAssignmentNotification(order);
  saveData();
  setView("orders");
  render();
  updateSyncStatus("ok", "Created locally. Syncing to Google...");
  syncAllAdminInBackground();
}

async function handleOrderAction(action, id) {
  const order = data.orders.find(item => item.id === id);
  if (!order) return;
  if (action !== "pdf" && !canEditOrder(order)) return;
  const now = new Date().toISOString();
  saveDraftUpdateFromPage(order);
  if (action === "start") {
    order.startedAt = now;
    order.status = "In Progress";
    order.updates.push(`Work started at ${formatDateTime(now)}.`);
    createStatusNotification(order, `${order.id} was started by ${order.assignee}.`);
  }
  if (action === "end") {
    order.endedAt = now;
    order.updates.push(`Work ended at ${formatDateTime(now)}.`);
    createStatusNotification(order, `${order.id} work ended. Waiting for completion submission.`);
  }
  if (action === "submit") {
    if (order.checklist.length && !order.checklist.every(item => item.status)) {
      alert("Please mark every checklist item as Ok or Not ok before submitting.");
      return;
    }
    const noteField = document.querySelector(`.completion-update[data-order-id="${escapeSelectorValue(order.id)}"]`);
    const note = noteField ? noteField.value.trim() : "";
    if (!note) {
      alert("Please enter the latest update before submitting. Type N/A if there is no issue.");
      return;
    }
    order.completedAt = now;
    order.status = "Completed";
    order.updates.push(note);
    order.draftUpdate = "";
    order.updates.push(`Work completed and submitted at ${formatDateTime(now)}.`);
    if (order.adminEmail) {
      order.updates.push(`Live version email target: ${order.adminEmail}.`);
    }
    createStatusNotification(order, `${order.id} was completed by ${order.assignee}.`);
    saveData();
    render();
    updateSyncStatus("ok", "Completed locally. Syncing to Google...");
    syncOrderInBackground(order);
    openCompletionReport(order);
    return;
  }
  if (action === "pdf") {
    openCompletionReport(order);
    return;
  }
  saveData();
  render();
  updateSyncStatus("ok", "Updated locally. Syncing to Google...");
  syncOrderInBackground(order);
}

function setChecklistStatus(orderId, index, status) {
  const order = data.orders.find(item => item.id === orderId);
  if (!order || !order.checklist[index]) return;
  order.checklist[index].status = status;
  saveData();
}

async function saveWorkAttachment(input) {
  const order = data.orders.find(item => item.id === input.dataset.orderId);
  const file = input.files[0];
  if (!order || !file || !canEditOrder(order)) return;
  order.attachment = await readAttachment(file);
  order.updates.push(`Attachment added: ${file.name}.`);
  saveData();
  render();
  updateSyncStatus("ok", "Attachment saved locally. Syncing to Google...");
  syncOrderInBackground(order);
}

function openCompletionReport(order) {
  const report = window.open("", "_blank");
  if (!report) return;
  const checklistRows = order.checklist.length
    ? order.checklist.map(item => `<tr><td>${escapeHtml(item.text)}</td><td>${item.status === "ok" ? "Ok" : item.status === "not_ok" ? "Not ok" : "Not selected"}</td></tr>`).join("")
    : `<tr><td colspan="2">No checklist attached</td></tr>`;
  const attachmentRows = order.attachment
    ? `<tr><td><a href="${escapeAttribute(order.attachment.dataUrl)}" download="${escapeAttribute(order.attachment.name)}">${escapeHtml(order.attachment.name)}</a></td><td>${escapeHtml(formatBytes(order.attachment.size))}</td></tr>`
    : "<tr><td colspan=\"2\">No attachment</td></tr>";
  report.document.write(`<!doctype html>
    <html>
    <head>
      <title>${escapeHtml(order.id)} Completion Report</title>
      <style>
        body { font-family: Arial, sans-serif; color: #1d252b; margin: 32px; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        h2 { font-size: 16px; margin-top: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #cfd8de; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #eef3f5; }
        .meta { color: #586873; margin-bottom: 18px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <button onclick="window.print()">Save / Print PDF</button>
      <h1>LH Maintenance Completion Report</h1>
      <div class="meta">${escapeHtml(order.id)} | ${escapeHtml(order.status)}</div>
      <table>
        <tr><th>Task</th><td>${escapeHtml(order.title)}</td></tr>
        <tr><th>Asset</th><td>${escapeHtml(order.asset)}</td></tr>
        <tr><th>Area</th><td>${escapeHtml(order.area)}</td></tr>
        <tr><th>Task Type</th><td>${escapeHtml(order.taskType || "")}</td></tr>
        <tr><th>Assigned To</th><td>${escapeHtml(order.assignee)}</td></tr>
        <tr><th>Assignee Email</th><td>${escapeHtml(order.assigneeEmail || "")}</td></tr>
        <tr><th>Admin / Assigner Email</th><td>${escapeHtml(order.adminEmail || "")}</td></tr>
        <tr><th>Due Date</th><td>${escapeHtml(order.due)}</td></tr>
        <tr><th>Start Time</th><td>${escapeHtml(formatDateTime(order.startedAt))}</td></tr>
        <tr><th>End Time</th><td>${escapeHtml(formatDateTime(order.endedAt))}</td></tr>
        <tr><th>Submitted Time</th><td>${escapeHtml(formatDateTime(order.completedAt))}</td></tr>
      </table>
      <h2>Checklist</h2>
      <table><tr><th>Checkpoint</th><th>Status</th></tr>${checklistRows}</table>
      <h2>Attachment</h2>
      <table><tr><th>File</th><th>Size</th></tr>${attachmentRows}</table>
      <h2>Updates</h2>
      <table>${order.updates.map(update => `<tr><td>${escapeHtml(update)}</td></tr>`).join("") || "<tr><td>No updates</td></tr>"}</table>
    </body>
    </html>`);
  report.document.close();
}

function createAssignmentNotification(order) {
  const notification = {
    id: nextNotificationId(),
    type: "assignment",
    assignee: order.assignee,
    assigneeEmail: normalizeEmail(order.assigneeEmail),
    adminEmail: normalizeEmail(order.adminEmail),
    recipients: notificationRecipients(order),
    orderId: order.id,
    title: `Assigned: ${order.title}`,
    message: `${order.id} has been assigned to ${order.assignee}. Due date: ${order.due}.${order.assigneeEmail ? ` Email: ${order.assigneeEmail}.` : ""}`,
    createdAt: new Date().toISOString(),
    read: false
  };
  data.notifications.unshift(notification);
  showBrowserNotification(notification);
}

function createStatusNotification(order, message) {
  const notification = {
    id: nextNotificationId(),
    type: "status",
    assignee: order.assignee,
    assigneeEmail: normalizeEmail(order.assigneeEmail),
    adminEmail: normalizeEmail(order.adminEmail),
    recipients: notificationRecipients(order),
    orderId: order.id,
    title: `Updated: ${order.title}`,
    message,
    createdAt: new Date().toISOString(),
    read: false
  };
  data.notifications.unshift(notification);
  showBrowserNotification(notification);
}

function notificationRecipients(order) {
  return [...new Set([
    normalizeEmail(order.assigneeEmail),
    normalizeEmail(order.adminEmail),
    ...((data.settings.workspace && data.settings.workspace.adminEmails) || []).map(normalizeEmail)
  ].filter(Boolean))];
}

function visibleNotifications() {
  const currentEmail = normalizeEmail(data.settings.userEmail);
  if (canManageData()) return [...data.notifications];
  if (!currentEmail) return [];
  return data.notifications.filter(note => {
    const recipients = Array.isArray(note.recipients) ? note.recipients.map(normalizeEmail) : [];
    return recipients.includes(currentEmail)
      || normalizeEmail(note.assigneeEmail) === currentEmail
      || normalizeEmail(note.adminEmail) === currentEmail;
  });
}

function shouldNotifyAboutOrder(order) {
  const currentEmail = normalizeEmail(data.settings.userEmail);
  if (!currentEmail) return false;
  return canManageData()
    || normalizeEmail(order.assigneeEmail) === currentEmail
    || normalizeEmail(order.adminEmail) === currentEmail;
}

function showBrowserNotification(notification) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const options = {
    body: notification.message,
    tag: notification.orderId,
    data: { orderId: notification.orderId, url: `${location.origin}${location.pathname}#orders` },
    icon: "icons/lh-icon.svg",
    badge: "icons/lh-icon.svg"
  };
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then(registration => registration.showNotification(notification.title, options))
      .catch(() => new Notification(notification.title, options));
    return;
  }
  new Notification(notification.title, options);
}

async function initPwa() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("sw.js");
    } catch {
      // The app still works without the service worker on unsupported browsers.
    }
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installAppBtn.classList.remove("hidden");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    els.installAppBtn.classList.add("hidden");
  });

  checkForAppUpdate();
  await refreshRemoteData();
  startRemoteRefresh();
}

async function checkForAppUpdate() {
  try {
    const response = await fetch(`version.json?check=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const remote = await response.json();
    if (!remote.build || compareBuild(remote.build, appBuild) <= 0) return;
    els.updateText.textContent = `New version ${remote.version || ""} available.`;
    els.updateBanner.classList.remove("hidden");
  } catch {
    // Update checks are best-effort only.
  }
}

function compareBuild(left, right) {
  const a = parseBuild(left);
  const b = parseBuild(right);
  if (a.date !== b.date) return a.date > b.date ? 1 : -1;
  if (a.suffix !== b.suffix) return a.suffix > b.suffix ? 1 : -1;
  return 0;
}

function parseBuild(value) {
  const match = String(value || "").match(/^(\d+)([a-z]*)$/i);
  if (!match) return { date: String(value || ""), suffix: "" };
  return { date: match[1], suffix: match[2].toLowerCase() };
}

async function updateApp() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.update()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.indexOf("lh-maintenance-") === 0).map(key => caches.delete(key)));
  }
  location.reload();
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.installAppBtn.classList.add("hidden");
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    alert("This browser does not support notifications.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  await savePushSubscription();
  showBrowserNotification({
    orderId: "LH-MAINTENANCE",
    title: "LH Maintenance alerts enabled",
    message: "This device can receive maintenance alerts when push setup is connected."
  });
  renderNotifications();
}

async function savePushSubscription() {
  const firebaseSaved = await saveFirebaseMessagingToken();
  if (firebaseSaved) return;

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (!pushConfig.publicVapidKey || !pushConfig.subscribeEndpoint) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(pushConfig.publicVapidKey)
  });
  data.settings.pushSubscription = subscription.toJSON();
  saveData();

  await postRemote("savePushToken", { subscription: data.settings.pushSubscription });
}

async function saveFirebaseMessagingToken() {
  if (!firebaseConfigReady()) return false;
  if (!("serviceWorker" in navigator)) return false;
  await loadFirebaseSdk();
  if (!window.firebase || !window.firebase.messaging || !window.firebase.messaging.isSupported()) return false;

  const registration = await navigator.serviceWorker.ready;
  const messaging = firebaseMessaging || firebase.messaging();
  firebaseMessaging = messaging;
  if (!messaging._lhForegroundHandlerAttached) {
    messaging.onMessage(payload => {
      const notification = payload.notification || {};
      const dataPayload = payload.data || {};
      refreshRemoteData();
      showBrowserNotification({
        orderId: dataPayload.orderId || "LH-MAINTENANCE",
        title: notification.title || dataPayload.title || "LH Maintenance",
        message: notification.body || dataPayload.body || "You have a maintenance update."
      });
    });
    messaging._lhForegroundHandlerAttached = true;
  }
  const token = await messaging.getToken({
    vapidKey: pushConfig.publicVapidKey,
    serviceWorkerRegistration: registration
  });
  if (!token) return false;
  data.settings.pushSubscription = {
    provider: "firebase",
    token,
    savedAt: new Date().toISOString()
  };
  saveData();
  await postRemote("savePushToken", {
    provider: "firebase",
    token,
    subscription: data.settings.pushSubscription
  });
  return true;
}

async function loadFirebaseSdk() {
  if (window.firebase && window.firebase.messaging) {
    initFirebaseApp();
    return;
  }
  await loadScript("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
  await loadScript("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");
  initFirebaseApp();
}

function initFirebaseApp() {
  if (firebaseApp || !window.firebase || !firebaseConfigReady()) return;
  firebaseApp = firebase.initializeApp(firebaseConfig());
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

function firebaseConfigReady() {
  return Boolean(pushConfig.firebaseApiKey
    && pushConfig.firebaseAppId
    && pushConfig.firebaseProjectId
    && pushConfig.firebaseSenderId
    && pushConfig.publicVapidKey);
}

function firebaseConfig() {
  return {
    apiKey: pushConfig.firebaseApiKey,
    appId: pushConfig.firebaseAppId,
    projectId: pushConfig.firebaseProjectId,
    messagingSenderId: pushConfig.firebaseSenderId
  };
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = replaceAllText(replaceAllText(value + padding, "-", "+"), "_", "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
}

function nextOrderId() {
  const highest = data.orders
    .map(order => Number(order.id.replace(/\D/g, "")))
    .filter(Boolean)
    .reduce((max, value) => Math.max(max, value), 1000);
  return `WO-${highest + 1}`;
}

function nextRoutineId() {
  const highest = data.routines
    .map(routine => Number(routine.id.replace(/\D/g, "")))
    .filter(Boolean)
    .reduce((max, value) => Math.max(max, value), 1000);
  return `RT-${highest + 1}`;
}

function nextNotificationId() {
  const highest = data.notifications
    .map(note => Number(note.id.replace(/\D/g, "")))
    .filter(Boolean)
    .reduce((max, value) => Math.max(max, value), 1000);
  return `NT-${highest + 1}`;
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + Number(days));
  return date.toISOString().slice(0, 10);
}

function nextRoutineDate(dateText, frequencyDays) {
  if (Number(frequencyDays) === 30) return addMonths(dateText, 1);
  if (Number(frequencyDays) === 60) return addMonths(dateText, 2);
  if (Number(frequencyDays) === 90) return addMonths(dateText, 3);
  if (Number(frequencyDays) === 180) return addMonths(dateText, 6);
  if (Number(frequencyDays) === 365) return addMonths(dateText, 12);
  return addDays(dateText, frequencyDays);
}

function addMonths(dateText, months) {
  const parts = String(dateText).split("-").map(Number);
  const year = parts[0];
  const monthIndex = parts[1] - 1;
  const day = parts[2];
  const target = new Date(year, monthIndex + Number(months), 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return `${target.getFullYear()}-${pad2(target.getMonth() + 1)}-${pad2(target.getDate())}`;
}

function pad2(value) {
  const text = String(value);
  return text.length < 2 ? `0${text}` : text;
}

function isDateInMonth(dateText, year, month) {
  if (!dateText) return false;
  const parts = String(dateText).split("-");
  return Number(parts[0]) === year && Number(parts[1]) === month + 1;
}

function parseChecklist(value) {
  return value
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatTimeOnly(value) {
  return value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function isOverdue(order) {
  return order.status !== "Completed" && order.due < todayOffset(0);
}

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const group = item[key] || "Unassigned";
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "None";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function setText(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function empty(text) {
  return `<div class="empty">${escapeHtml(text)}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function escapeSelectorValue(value) {
  if (window.CSS && CSS.escape) return CSS.escape(value);
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function replaceAllText(value, search, replacement) {
  return String(value).split(search).join(replacement);
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function openDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }
  dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }
  dialog.removeAttribute("open");
}

function readAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      dataUrl: reader.result,
      addedAt: new Date().toISOString()
    });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatBytes(value) {
  if (!value) return "0 KB";
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function openProfileDialog() {
  document.querySelector("#userEmailInput").value = data.settings.userEmail || "";
  document.querySelector("#usernameInput").value = data.settings.username || "";
  document.querySelector("#newWorkspaceAdminInput").checked = false;
  document.querySelector("#roleInfo").textContent = profileRoleText(data.settings.userEmail);
  openDialog(els.profileDialog);
}

async function saveProfile(event) {
  event.preventDefault();
  const email = normalizeEmail(document.querySelector("#userEmailInput").value);
  const username = document.querySelector("#usernameInput").value.trim();
  const createWorkspace = document.querySelector("#newWorkspaceAdminInput").checked;
  data.settings.userEmail = email;
  data.settings.username = username;
  upsertUser(username, email);
  if (email && createWorkspace) {
    data.settings.workspace = normalizeWorkspace({
      ...data.settings.workspace,
      name: `${email.split("@")[0]} Maintenance`,
      databaseOwnerEmail: email,
      adminEmails: [email]
    });
  }
  data.settings.role = getRoleForEmail(data.settings.userEmail);
  saveData();
  closeDialog(els.profileDialog);
  if (!canUseView(activeView)) setView("orders");
  render();
  startRemoteRefresh();
  updateSyncStatus("ok", "Profile saved locally. Syncing to Google...");
  postRemote("saveProfile", {
      user: {
        email: data.settings.userEmail,
        username: data.settings.username
      }
    })
    .then(() => loadRemoteData())
    .then(() => {
      render();
      updateSyncStatus("ok", `Profile synced ${formatTimeOnly(new Date())}.`);
    })
    .catch(err => {
      updateSyncStatus("error", `Profile saved locally. Google sync pending: ${err.message}`);
    });
}

function exportData() {
  if (!canManageData()) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lh-maintenance-${todayOffset(0)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importData(event) {
  if (!canManageData()) return;
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    data = normalizeData(JSON.parse(reader.result));
    saveData();
    syncAllAdmin();
    render();
  };
  reader.readAsText(file);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getRoleForEmail(email, workspace = null) {
  workspace = workspace || (data && data.settings ? data.settings.workspace : null);
  const admins = workspace && workspace.adminEmails ? workspace.adminEmails : [];
  return admins.indexOf(normalizeEmail(email)) >= 0 ? "admin" : "user";
}

function canManageData() {
  return data.settings.role === "admin";
}

function canUseView(view) {
  return canManageData() || !["calendar", "team", "assets", "reports", "live", "routines"].includes(view);
}

function canEditOrder(order) {
  if (canManageData()) return true;
  const currentEmail = normalizeEmail(data.settings.userEmail);
  return Boolean(currentEmail && normalizeEmail(order.assigneeEmail) === currentEmail);
}

function visibleOrders() {
  if (canManageData()) return data.orders;
  const currentEmail = normalizeEmail(data.settings.userEmail);
  if (!currentEmail) return [];
  return data.orders.filter(order => isOrderAssignedToEmail(order, currentEmail));
}

function isOrderAssignedToEmail(order, email) {
  const currentEmail = normalizeEmail(email);
  return Boolean(currentEmail && normalizeEmail(order.assigneeEmail) === currentEmail);
}

function openAssignedOrder(orderId) {
  setView("orders");
  els.statusFilter.value = "all";
  els.priorityFilter.value = "all";
  els.searchInput.value = orderId || "";
  renderOrders();
}

function renderAccessControls() {
  const admin = canManageData();
  document.querySelectorAll("[data-admin-only]").forEach(el => {
    el.classList.toggle("hidden", !admin);
  });
  document.querySelectorAll(".file-label").forEach(label => {
    label.classList.toggle("hidden", !admin && label.querySelector("[data-admin-only]"));
  });
  els.profileBtn.textContent = data.settings.userEmail
    ? `${data.settings.role === "admin" ? "Admin" : "User"}: ${data.settings.userEmail}`
    : "User Email";
  els.roleStatus.textContent = data.settings.userEmail
    ? `${data.settings.role === "admin" ? "Admin" : "User"} mode`
    : "Not signed in";
  els.roleStatus.classList.toggle("admin", data.settings.role === "admin");
  els.roleStatus.classList.toggle("user", data.settings.role === "user" && Boolean(data.settings.userEmail));
  renderUserList();
}

function profileRoleText(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return `Enter your registered email. Admin access is reserved for: ${data.settings.workspace.adminEmails.join(", ")}.`;
  return getRoleForEmail(normalized) === "admin"
    ? "Role: Admin. This email can create, assign, edit, and manage all records."
    : "Role: User. This email can view and update only work orders assigned to it.";
}

function renderUserList() {
  const list = document.querySelector("#userList");
  if (!list) return;
  list.innerHTML = data.settings.users
    .map(user => `<option value="${escapeAttribute(user.username)}">${escapeHtml(user.email)}</option>`)
    .join("");
}

function normalizeUsers(users) {
  const byEmail = {};
  users.forEach(user => {
    const email = normalizeEmail(user.email);
    const username = String(user.username || "").trim();
    if (!email || !username) return;
    byEmail[email] = { username, email };
  });
  return Object.values(byEmail).sort((a, b) => a.username.localeCompare(b.username));
}

function mergeUsers(primaryUsers, fallbackUsers) {
  return normalizeUsers([...(fallbackUsers || []), ...(primaryUsers || [])]);
}

function upsertUser(username, email) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = String(username || "").trim();
  if (!normalizedEmail || !normalizedUsername) return;
  const existing = data.settings.users.find(user => normalizeEmail(user.email) === normalizedEmail);
  if (existing) {
    existing.username = normalizedUsername;
    existing.email = normalizedEmail;
  } else {
    data.settings.users.push({ username: normalizedUsername, email: normalizedEmail });
  }
  data.settings.users = normalizeUsers(data.settings.users);
}

function findUserByUsername(username) {
  const value = String(username || "").trim().toLowerCase();
  return data.settings.users.find(user => user.username.toLowerCase() === value);
}

function applyAssigneeUserMatch() {
  const nameField = document.querySelector("#assigneeInput");
  const emailField = document.querySelector("#assigneeEmailInput");
  if (!nameField || !emailField) return;
  const user = findUserByUsername(nameField.value);
  if (!user) return;
  nameField.value = user.username;
  emailField.value = user.email;
}

function applyRoutineAssigneeUserMatch() {
  const nameField = document.querySelector("#routineAssigneeInput");
  const emailField = document.querySelector("#routineAssigneeEmailInput");
  if (!nameField || !emailField) return;
  const user = findUserByUsername(nameField.value);
  if (!user) return;
  nameField.value = user.username;
  emailField.value = user.email;
}

function saveDraftUpdateFromPage(order) {
  const field = document.querySelector(`.completion-update[data-order-id="${escapeSelectorValue(order.id)}"]`);
  if (!field) return;
  order.draftUpdate = field.value.trim();
}

function normalizeWorkspace(workspace = {}) {
  const merged = { ...defaultWorkspace, ...workspace };
  merged.name = String(merged.name || defaultWorkspace.name).trim();
  merged.databaseOwnerEmail = normalizeEmail(merged.databaseOwnerEmail || defaultWorkspace.databaseOwnerEmail);
  merged.adminEmails = parseEmailList(merged.adminEmails && merged.adminEmails.length ? merged.adminEmails : merged.databaseOwnerEmail)
    .filter(Boolean);
  if (!merged.adminEmails.length) merged.adminEmails = [...defaultWorkspace.adminEmails];
  merged.apiUrl = String(merged.apiUrl || "").trim();
  merged.sheetId = String(merged.sheetId || "").trim();
  merged.driveFolderId = String(merged.driveFolderId || "").trim();
  merged.firebaseApiKey = String(merged.firebaseApiKey || "").trim();
  merged.firebaseAppId = String(merged.firebaseAppId || "").trim();
  merged.firebaseProjectId = String(merged.firebaseProjectId || "").trim();
  merged.firebaseSenderId = String(merged.firebaseSenderId || "").trim();
  merged.vapidPublicKey = String(merged.vapidPublicKey || "").trim();
  return merged;
}

function parseEmailList(value) {
  const text = Array.isArray(value) ? value.join("\n") : String(value || "");
  return [...new Set(text.split(/[\s,;]+/).map(normalizeEmail).filter(Boolean))];
}

function applyWorkspacePushConfig() {
  pushConfig.firebaseApiKey = data.settings.workspace.firebaseApiKey;
  pushConfig.firebaseAppId = data.settings.workspace.firebaseAppId;
  pushConfig.firebaseProjectId = data.settings.workspace.firebaseProjectId;
  pushConfig.firebaseSenderId = data.settings.workspace.firebaseSenderId;
  pushConfig.publicVapidKey = data.settings.workspace.vapidPublicKey;
  pushConfig.subscribeEndpoint = data.settings.workspace.apiUrl || defaultApiUrl;
}

function renderWorkspaceForm() {
  if (!els.workspaceForm) return;
  const workspace = data.settings.workspace;
  const fields = {
    workspaceNameInput: workspace.name,
    databaseOwnerInput: workspace.databaseOwnerEmail,
    adminEmailsInput: workspace.adminEmails.join("\n"),
    apiUrlInput: workspace.apiUrl,
    sheetIdInput: workspace.sheetId,
    driveFolderIdInput: workspace.driveFolderId,
    firebaseApiKeyInput: workspace.firebaseApiKey,
    firebaseAppIdInput: workspace.firebaseAppId,
    firebaseProjectIdInput: workspace.firebaseProjectId,
    firebaseSenderIdInput: workspace.firebaseSenderId,
    vapidKeyInput: workspace.vapidPublicKey
  };
  Object.entries(fields).forEach(([id, value]) => {
    const field = document.querySelector(`#${id}`);
    if (field) field.value = value;
  });
  const status = document.querySelector("#workspaceStatus");
  if (status) status.textContent = `Active workspace: ${workspace.name}`;
}

function saveWorkspace(event) {
  event.preventDefault();
  if (!canManageData()) return;
  data.settings.workspace = normalizeWorkspace({
    name: document.querySelector("#workspaceNameInput").value,
    databaseOwnerEmail: document.querySelector("#databaseOwnerInput").value,
    adminEmails: document.querySelector("#adminEmailsInput").value,
    apiUrl: document.querySelector("#apiUrlInput").value,
    sheetId: document.querySelector("#sheetIdInput").value,
    driveFolderId: document.querySelector("#driveFolderIdInput").value,
    firebaseApiKey: document.querySelector("#firebaseApiKeyInput").value,
    firebaseAppId: document.querySelector("#firebaseAppIdInput").value,
    firebaseProjectId: document.querySelector("#firebaseProjectIdInput").value,
    firebaseSenderId: document.querySelector("#firebaseSenderIdInput").value,
    vapidPublicKey: document.querySelector("#vapidKeyInput").value
  });
  data.settings.role = getRoleForEmail(data.settings.userEmail);
  saveData();
  render();
}

function resetWorkspace() {
  if (!canManageData()) return;
  data.settings.workspace = cloneData(defaultWorkspace);
  data.settings.role = getRoleForEmail(data.settings.userEmail);
  saveData();
  render();
}

els.navButtons.forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
els.newOrderBtn.addEventListener("click", () => openOrderDialog());
els.profileBtn.addEventListener("click", openProfileDialog);
els.closeProfileBtn.addEventListener("click", () => closeDialog(els.profileDialog));
els.cancelProfileBtn.addEventListener("click", () => closeDialog(els.profileDialog));
els.profileForm.addEventListener("submit", saveProfile);
els.closeDialogBtn.addEventListener("click", () => closeDialog(els.orderDialog));
els.cancelBtn.addEventListener("click", () => closeDialog(els.orderDialog));
els.orderForm.addEventListener("submit", saveOrder);
els.deleteOrderBtn.addEventListener("click", deleteCurrentOrder);
els.searchInput.addEventListener("input", renderOrders);
els.statusFilter.addEventListener("change", renderOrders);
els.priorityFilter.addEventListener("change", renderOrders);
document.querySelector("#assigneeInput").addEventListener("change", applyAssigneeUserMatch);
document.querySelector("#assigneeInput").addEventListener("blur", applyAssigneeUserMatch);
document.querySelector("#routineAssigneeInput").addEventListener("change", applyRoutineAssigneeUserMatch);
document.querySelector("#routineAssigneeInput").addEventListener("blur", applyRoutineAssigneeUserMatch);
els.exportBtn.addEventListener("click", exportData);
els.importFile.addEventListener("change", importData);
els.printBtn.addEventListener("click", () => window.print());
els.enableNotifyBtn.addEventListener("click", async () => {
  await enableNotifications();
});
els.installAppBtn.addEventListener("click", installApp);
els.updateAppBtn.addEventListener("click", updateApp);
els.syncNowBtn.addEventListener("click", syncNow);
if (els.workspaceForm) els.workspaceForm.addEventListener("submit", saveWorkspace);
if (els.resetWorkspaceBtn) els.resetWorkspaceBtn.addEventListener("click", resetWorkspace);
els.addAssetBtn.addEventListener("click", () => {
  document.querySelector("#assetServiceInput").value = todayOffset(0);
  openDialog(els.assetDialog);
});
els.closeAssetBtn.addEventListener("click", () => closeDialog(els.assetDialog));
els.cancelAssetBtn.addEventListener("click", () => closeDialog(els.assetDialog));
els.assetForm.addEventListener("submit", saveAsset);
els.newRoutineBtn.addEventListener("click", () => openRoutineDialog());
els.closeRoutineBtn.addEventListener("click", () => closeDialog(els.routineDialog));
els.cancelRoutineBtn.addEventListener("click", () => closeDialog(els.routineDialog));
els.routineForm.addEventListener("submit", saveRoutine);
els.deleteRoutineBtn.addEventListener("click", deleteCurrentRoutine);
els.clearNotificationsBtn.addEventListener("click", () => {
  data.notifications.forEach(note => note.read = true);
  saveData();
  renderNotifications();
});
document.body.addEventListener("click", event => {
  if (event.target.closest(".checklist, .completion-note, .attachment-link, .attachment-control")) {
    event.stopPropagation();
    return;
  }

  const orderAction = event.target.closest(".order-action");
  if (orderAction) {
    event.stopPropagation();
    if (orderAction.disabled) return;
    const originalText = orderAction.textContent;
    const action = orderAction.dataset.action;
    const orderId = orderAction.dataset.orderId;
    orderAction.disabled = true;
    if (action === "submit") orderAction.textContent = "Submitting...";
    Promise.resolve(handleOrderAction(action, orderId)).finally(() => {
      const order = data.orders.find(item => item.id === orderId);
      if (orderAction.isConnected && order && order.status !== "Completed") {
        orderAction.disabled = false;
        orderAction.textContent = originalText;
      }
    });
    return;
  }

  const orderShortcut = event.target.closest(".order-shortcut");
  if (orderShortcut) {
    event.stopPropagation();
    openAssignedOrder(orderShortcut.dataset.orderId);
    return;
  }

  const calendarItem = event.target.closest(".calendar-item");
  if (calendarItem && calendarItem.dataset.orderId) {
    event.stopPropagation();
    openAssignedOrder(calendarItem.dataset.orderId);
    return;
  }

  const routineAction = event.target.closest(".routine-action");
  if (routineAction) {
    event.stopPropagation();
    generateOrderFromRoutine(routineAction.dataset.routineId);
    return;
  }

  const routineCardEl = event.target.closest(".routine-card");
  if (routineCardEl) {
    if (!canManageData()) return;
    const routine = data.routines.find(item => item.id === routineCardEl.dataset.routineId);
    if (routine) openRoutineDialog(routine);
    return;
  }

  const notificationCard = event.target.closest(".notification-card");
  if (notificationCard) {
    const notification = data.notifications.find(item => item.id === notificationCard.dataset.notificationId);
    if (notification) {
      notification.read = true;
      saveData();
      renderNotifications();
      openAssignedOrder(notification.orderId);
    }
    return;
  }

  const card = event.target.closest(".order-card");
  if (!card) return;
  const order = data.orders.find(item => item.id === card.dataset.orderId);
  if (order && canManageData()) openOrderDialog(order);
});

document.body.addEventListener("change", event => {
  const attachmentInput = event.target.closest(".work-attachment-input");
  if (attachmentInput) {
    event.stopPropagation();
    saveWorkAttachment(attachmentInput);
    return;
  }

  const status = event.target.closest(".checklist-status");
  if (!status) return;
  event.stopPropagation();
  setChecklistStatus(status.dataset.orderId, Number(status.dataset.index), status.value);
});

document.body.addEventListener("input", event => {
  const updateField = event.target.closest(".completion-update");
  if (!updateField) return;
  const order = data.orders.find(item => item.id === updateField.dataset.orderId);
  if (!order) return;
  order.draftUpdate = updateField.value;
  saveData();
});

window.addEventListener("focus", () => {
  refreshRemoteData();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshRemoteData();
});

setView(activeView);
render();
initPwa();
