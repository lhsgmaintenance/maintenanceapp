const storeKey = "lhMaintenanceData";
const legacyStoreKey = "maintenanceDeskData";
const pushConfig = {
  publicVapidKey: "",
  subscribeEndpoint: ""
};
const defaultWorkspace = {
  name: "LHSG Maintenance",
  databaseOwnerEmail: "lhsgmaintenance@gmail.com",
  adminEmails: ["lhsgmaintenance@gmail.com"],
  apiUrl: "",
  sheetId: "",
  driveFolderId: "",
  firebaseProjectId: "",
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
    role: "user",
    workspace: cloneData(defaultWorkspace),
    pushSubscription: null
  }
};

let data = loadData();
let activeView = "dashboard";
let deferredInstallPrompt = null;

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
  resetWorkspaceBtn: document.querySelector("#resetWorkspaceBtn")
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
  loaded.settings.workspace = normalizeWorkspace(loaded.settings.workspace);
  loaded.settings.role = getRoleForEmail(loaded.settings.userEmail);
  loaded.settings.pushSubscription = loaded.settings.pushSubscription || null;
  loaded.orders.forEach(order => {
    order.taskType = order.taskType || (String(order.id || "").indexOf("WO-1003") === 0 ? "Routine Maintenance" : "Breakdown");
    order.startedAt = order.startedAt || "";
    order.endedAt = order.endedAt || "";
    order.completedAt = order.completedAt || "";
    order.checklist = order.checklist || [];
    order.checklist = order.checklist.map(item => ({
      text: typeof item === "string" ? item : item.text,
      status: item.status || (item.checked ? "ok" : "")
    }));
    order.updates = order.updates || [];
    order.assigneeEmail = order.assigneeEmail || "";
    order.adminEmail = order.adminEmail || "";
    order.attachment = order.attachment || null;
  });
  loaded.routines.forEach(routine => {
    routine.taskType = routine.taskType || "Routine Maintenance";
    routine.checklist = routine.checklist || (routine.details
      ? routine.details.split(",").map(item => item.trim()).filter(Boolean)
      : []);
  });
  return loaded;
}

function saveData() {
  localStorage.setItem(storeKey, JSON.stringify(data));
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
  renderTeam();
  renderAssets();
  renderReports();
}

function setView(view) {
  if (!canUseView(view)) view = "orders";
  activeView = view;
  els.viewTitle.textContent = viewLabels[view];
  els.navButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  els.views.forEach(viewEl => viewEl.classList.toggle("active", viewEl.id === `${view}View`));
}

const viewLabels = {
  dashboard: "Dashboard",
  orders: "Work Orders",
  routines: "Routine Tasks",
  notifications: "Notifications",
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
    ? schedule.map(o => `<div class="timeline-item"><strong>${escapeHtml(o.due)}</strong><br>${escapeHtml(o.title)} - ${escapeHtml(o.assignee)}</div>`).join("")
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

function renderNotifications() {
  const notifications = [...data.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
  document.querySelector("#teamGrid").innerHTML = names.length
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
  const canStart = editable && order.status !== "Completed" && !order.startedAt;
  const canEnd = editable && order.status !== "Completed" && order.startedAt && !order.endedAt;
  const canSubmit = editable && order.status !== "Completed" && order.startedAt && order.endedAt;
  const checklistHtml = order.checklist.length
    ? `<div class="checklist">
        ${order.checklist.map((item, index) => `<div class="check-row">
          <span>${escapeHtml(item.text)}</span>
          <label><input type="radio" class="checklist-status" name="${escapeHtml(order.id)}-${index}" data-order-id="${escapeHtml(order.id)}" data-index="${index}" value="ok" ${item.status === "ok" ? "checked" : ""} ${order.status === "Completed" ? "disabled" : ""}> Ok</label>
          <label><input type="radio" class="checklist-status" name="${escapeHtml(order.id)}-${index}" data-order-id="${escapeHtml(order.id)}" data-index="${index}" value="not_ok" ${item.status === "not_ok" ? "checked" : ""} ${order.status === "Completed" ? "disabled" : ""}> Not ok</label>
        </div>`).join("")}
      </div>`
    : "";
  return `<article class="order-card ${manageable ? "" : "readonly-card"}" data-order-id="${escapeHtml(order.id)}">
    <header>
      <div>
        <h4>${escapeHtml(order.id)} - ${escapeHtml(order.title)}</h4>
        <div class="meta">${escapeHtml(order.asset)} | ${escapeHtml(order.area)} | ${escapeHtml(order.assignee)} | ${escapeHtml(order.taskType || "Breakdown")}</div>
        ${emailMeta ? `<div class="meta">${escapeHtml(emailMeta)}</div>` : ""}
      </div>
      <span class="pill ${escapeHtml(order.priority)}">${escapeHtml(order.priority)}</span>
    </header>
    <p>${escapeHtml(latest)}</p>
    ${attachmentHtml}
    ${checklistHtml}
    <div class="meta">${escapeHtml(timing)}</div>
    <label class="completion-note">Latest Update Before Submit
      <textarea class="completion-update" data-order-id="${escapeHtml(order.id)}" rows="2" placeholder="Write what happened, or type N/A">N/A</textarea>
    </label>
    <div class="work-actions">
      <label class="secondary attachment-control">
        ${escapeHtml(attachmentLabel)}
        <input class="work-attachment-input" data-order-id="${escapeHtml(order.id)}" type="file" ${editable && order.status !== "Completed" ? "" : "disabled"}>
      </label>
      <button class="secondary order-action" data-action="start" data-order-id="${escapeHtml(order.id)}" ${canStart ? "" : "disabled"}>Start</button>
      <button class="secondary order-action" data-action="end" data-order-id="${escapeHtml(order.id)}" ${canEnd ? "" : "disabled"}>End</button>
      <button class="primary order-action" data-action="submit" data-order-id="${escapeHtml(order.id)}" ${canSubmit ? "" : "disabled"}>Submit Done</button>
      <button class="secondary order-action" data-action="pdf" data-order-id="${escapeHtml(order.id)}" ${order.status === "Completed" ? "" : "disabled"}>PDF Report</button>
    </div>
    <div class="card-foot">
      <span>${escapeHtml(order.status)}</span>
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
  const update = document.querySelector("#updateInput").value.trim();
  const order = {
    id,
    title: document.querySelector("#titleInput").value.trim(),
    asset: document.querySelector("#assetInput").value.trim(),
    area: document.querySelector("#areaInput").value.trim(),
    assignee: document.querySelector("#assigneeInput").value.trim(),
    assigneeEmail: document.querySelector("#assigneeEmailInput").value.trim(),
    adminEmail: document.querySelector("#adminEmailInput").value.trim(),
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
}

function deleteCurrentOrder() {
  if (!canManageData()) return;
  const id = document.querySelector("#orderId").value;
  data.orders = data.orders.filter(order => order.id !== id);
  saveData();
  closeDialog(els.orderDialog);
  render();
}

function saveAsset(event) {
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
}

function openRoutineDialog(routine = null) {
  if (!canManageData()) return;
  document.querySelector("#routineDialogTitle").textContent = routine ? "Edit Routine" : "New Routine";
  document.querySelector("#routineId").value = routine ? routine.id || "" : "";
  document.querySelector("#routineTitleInput").value = routine ? routine.title || "" : "";
  document.querySelector("#routineAssetInput").value = routine ? routine.asset || "" : "";
  document.querySelector("#routineAreaInput").value = routine ? routine.area || "" : "";
  document.querySelector("#routineAssigneeInput").value = routine ? routine.assignee || "" : "";
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

function saveRoutine(event) {
  event.preventDefault();
  if (!canManageData()) return;
  const id = document.querySelector("#routineId").value || nextRoutineId();
  const existing = data.routines.find(routine => routine.id === id);
  const routine = {
    id,
    title: document.querySelector("#routineTitleInput").value.trim(),
    asset: document.querySelector("#routineAssetInput").value.trim(),
    area: document.querySelector("#routineAreaInput").value.trim(),
    assignee: document.querySelector("#routineAssigneeInput").value.trim(),
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
}

function deleteCurrentRoutine() {
  if (!canManageData()) return;
  const id = document.querySelector("#routineId").value;
  data.routines = data.routines.filter(routine => routine.id !== id);
  saveData();
  closeDialog(els.routineDialog);
  render();
}

function generateOrderFromRoutine(id) {
  if (!canManageData()) return;
  const routine = data.routines.find(item => item.id === id);
  if (!routine) return;
  const order = {
    id: nextOrderId(),
    title: routine.title,
    asset: routine.asset,
    area: routine.area,
    assignee: routine.assignee,
    assigneeEmail: "",
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
  routine.nextDue = addDays(routine.nextDue, routine.frequencyDays);
  createAssignmentNotification(order);
  saveData();
  setView("orders");
  render();
}

function handleOrderAction(action, id) {
  const order = data.orders.find(item => item.id === id);
  if (!order) return;
  if (action !== "pdf" && !canEditOrder(order)) return;
  const now = new Date().toISOString();
  if (action === "start") {
    order.startedAt = now;
    order.status = "In Progress";
    order.updates.push(`Work started at ${formatDateTime(now)}.`);
  }
  if (action === "end") {
    order.endedAt = now;
    order.updates.push(`Work ended at ${formatDateTime(now)}.`);
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
    order.updates.push(`Work completed and submitted at ${formatDateTime(now)}.`);
    if (order.adminEmail) {
      order.updates.push(`Live version email target: ${order.adminEmail}.`);
    }
    saveData();
    render();
    openCompletionReport(order);
    return;
  }
  if (action === "pdf") {
    openCompletionReport(order);
    return;
  }
  saveData();
  render();
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
    assignee: order.assignee,
    orderId: order.id,
    title: `Assigned: ${order.title}`,
    message: `${order.id} has been assigned to ${order.assignee}. Due date: ${order.due}.${order.assigneeEmail ? ` Email: ${order.assigneeEmail}.` : ""}`,
    createdAt: new Date().toISOString(),
    read: false
  };
  data.notifications.unshift(notification);
  showBrowserNotification(notification);
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
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (!pushConfig.publicVapidKey || !pushConfig.subscribeEndpoint) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(pushConfig.publicVapidKey)
  });
  data.settings.pushSubscription = subscription.toJSON();
  saveData();

  await fetch(pushConfig.subscribeEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data.settings.userEmail,
      subscription: data.settings.pushSubscription
    })
  });
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
  document.querySelector("#newWorkspaceAdminInput").checked = false;
  document.querySelector("#roleInfo").textContent = profileRoleText(data.settings.userEmail);
  openDialog(els.profileDialog);
}

function saveProfile(event) {
  event.preventDefault();
  const email = normalizeEmail(document.querySelector("#userEmailInput").value);
  const createWorkspace = document.querySelector("#newWorkspaceAdminInput").checked;
  data.settings.userEmail = email;
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

function importData(event) {
  if (!canManageData()) return;
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    data = normalizeData(JSON.parse(reader.result));
    saveData();
    render();
  };
  reader.readAsText(file);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getRoleForEmail(email) {
  const workspace = data && data.settings ? data.settings.workspace : null;
  const admins = workspace && workspace.adminEmails ? workspace.adminEmails : [];
  return admins.indexOf(normalizeEmail(email)) >= 0 ? "admin" : "user";
}

function canManageData() {
  return data.settings.role === "admin";
}

function canUseView(view) {
  return canManageData() || !["team", "assets", "reports", "live", "routines"].includes(view);
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
  return data.orders.filter(order => normalizeEmail(order.assigneeEmail) === currentEmail);
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
}

function profileRoleText(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return `Enter your registered email. Admin access is reserved for: ${data.settings.workspace.adminEmails.join(", ")}.`;
  return getRoleForEmail(normalized) === "admin"
    ? "Role: Admin. This email can create, assign, edit, and manage all records."
    : "Role: User. This email can view and update only work orders assigned to it.";
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
  merged.firebaseProjectId = String(merged.firebaseProjectId || "").trim();
  merged.vapidPublicKey = String(merged.vapidPublicKey || "").trim();
  return merged;
}

function parseEmailList(value) {
  const text = Array.isArray(value) ? value.join("\n") : String(value || "");
  return [...new Set(text.split(/[\s,;]+/).map(normalizeEmail).filter(Boolean))];
}

function applyWorkspacePushConfig() {
  pushConfig.publicVapidKey = data.settings.workspace.vapidPublicKey;
  pushConfig.subscribeEndpoint = data.settings.workspace.apiUrl;
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
    firebaseProjectIdInput: workspace.firebaseProjectId,
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
    firebaseProjectId: document.querySelector("#firebaseProjectIdInput").value,
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
els.exportBtn.addEventListener("click", exportData);
els.importFile.addEventListener("change", importData);
els.printBtn.addEventListener("click", () => window.print());
els.enableNotifyBtn.addEventListener("click", async () => {
  await enableNotifications();
});
els.installAppBtn.addEventListener("click", installApp);
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
    handleOrderAction(orderAction.dataset.action, orderAction.dataset.orderId);
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
      setView("orders");
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

setView(activeView);
render();
initPwa();
