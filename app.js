const storageKey = "gestion-agro-v3";
const syncQueueKey = "gestion-agro-sync-queue-v1";
const syncConfigKey = "gestion-agro-sync-config-v1";
const defaultSyncApiUrl = "https://script.google.com/macros/s/AKfycbxCnXxTt91wEZF-rXzldO3zseFTuYBFKnMFzFi8DPtj3iVMGvamxS8uD0Jb2Ex1BTn_/exec";
const syncedBadgeVisibleMs = 6000;

const starterData = {
  lots: [
    { id: "lot-1", name: "Lote 1", farm: "La Esperanza", hectares: 86, campaign: "2025/26", crop: "Soja", previousCrop: "Maiz" },
    { id: "lot-2", name: "Lote 2", farm: "La Esperanza", hectares: 122, campaign: "2025/26", crop: "Maiz", previousCrop: "Trigo/Soja 2da" },
    { id: "lot-3", name: "Lote 3", farm: "El Ombu", hectares: 64, campaign: "2025/26", crop: "Trigo", previousCrop: "Soja" }
  ],
  products: [
    { id: "prod-1", name: "Glifosato", type: "Herbicida", unit: "lt", quantity: 540, unitCost: 3100, warehouse: "Depósito principal" },
    { id: "prod-2", name: "Urea", type: "Fertilizante", unit: "kg", quantity: 4200, unitCost: 780, warehouse: "Galpón fertilizantes" },
    { id: "prod-3", name: "Fungicida mezcla", type: "Fungicida", unit: "lt", quantity: 120, unitCost: 8200, warehouse: "Depósito principal" }
  ],
  orders: [
    { id: "ord-1", date: "2026-05-12", lotId: "lot-1", task: "Monitoreo de malezas", owner: "Juan", status: "Pendiente", notes: "" },
    { id: "ord-2", date: "2026-05-18", lotId: "lot-2", task: "Fertilización nitrogenada", owner: "Contratista", status: "En curso", notes: "" }
  ],
  monitors: [
    { id: "mon-1", date: "2026-05-01", lotId: "lot-1", cropStatus: "Bueno", weeds: "Baja presión", issues: "Sin plagas", recommendation: "Revisar en 7 días" }
  ],
  applications: [
    { id: "app-1", date: "2026-04-20", lotId: "lot-1", productId: "prod-1", dose: 2.2, hectares: 86, laborCostHa: 4200, productCost: 586520, totalCost: 947720 }
  ],
  closures: [
    { id: "clo-1", lotId: "lot-1", campaign: "2024/25", crop: "Maiz", hectares: 86, kgHarvested: 774000, priceTon: 185000, otherCosts: 8600000, applicationCosts: 0, income: 143190000, grossMargin: 134590000 },
    { id: "clo-2", lotId: "lot-3", campaign: "2024/25", crop: "Soja", hectares: 64, kgHarvested: 192000, priceTon: 295000, otherCosts: 5200000, applicationCosts: 0, income: 56640000, grossMargin: 51440000 }
  ],
  mapPolygons: [
    { id: "poly-1", name: "Lote 1", coordinates: [[-61.12, -33.21], [-61.08, -33.205], [-61.075, -33.235], [-61.115, -33.24], [-61.12, -33.21]] },
    { id: "poly-2", name: "Lote 2", coordinates: [[-61.07, -33.205], [-61.025, -33.202], [-61.02, -33.235], [-61.067, -33.238], [-61.07, -33.205]] },
    { id: "poly-3", name: "Lote 3", coordinates: [[-61.116, -33.245], [-61.07, -33.242], [-61.068, -33.275], [-61.11, -33.282], [-61.116, -33.245]] }
  ]
};

let data = loadData();
let syncQueue = loadSyncQueue();
let syncConfig = loadSyncConfig();
let syncRunning = false;
let selectedMonitorId = "";
let monitorPhotoDraft = [];
let mapLayer = "satellite";
let orderFilter = "Todas";
let orderProductTextFilter = "";
let orderProductFilter = "Todos";
let orderCropFilter = "Todos";
let orderLotFilter = "Todos";
let orderContractorFilter = "Todos";
let pendingCompletionOrderId = "";
let selectedOrderProductKey = "";
let highlightedApplicationId = "";
let applicationDraftOrderId = "";
let editingLotId = "";
let editingProductId = "";
let selectedProductId = "";
let selectedReceiptKey = "";
let editingReceiptLineKey = "";
let editingReceiptHeader = false;
let selectedCostLotId = "";
let selectedCostCategory = "";
let editingReceiptIndex = -1;
let editingOrderId = "";
let editingMonitorId = "";
let editingApplicationKey = "";
let selectedMapPolygonId = "";
let selectedOrderId = "";
let orderDetailBackView = "ordenes";
let orderDetailBackLotId = "";
let applicationBackView = "ordenes";
let applicationBackLotId = "";
let selectedHistoryCrop = "";
let selectedHistoryLotId = "";
let selectedCampaignLotId = "";
let selectedCampaign = "";
let editingCampaignClosureId = "";
let editingClosureFormId = "";
let closureReturnView = "";
let rotationShowAllCampaigns = false;
let closureCropFilter = "Todos";
let historyLotCropFilter = "Todos";
let historyLotCampaignFilter = "Todos";
const otherHistoryCrops = ["Lino", "Arveja", "Carinata", "Sorgo"];
const forageHistoryCrops = ["Alfalfa", "Avena", "Moha", "Verdeo", "Raigras", "Raigrás", "Agropiro", "Cebadilla", "Campo natural"];
let mapZoom = 2.2;
let mapPanX = 0;
let mapPanY = 0;

const titles = {
  dashboard: "Panel general",
  lotes: "Campos y lotes",
  mapa: "Mapa de lotes",
  ordenes: "Orden de trabajo",
  monitoreo: "Monitoreo",
  aplicaciones: "Detalle de aplicación",
  stock: "Depósito",
  "ficha-deposito": "Ficha del insumo",
  costos: "Costos por lote",
  contratistas: "Labores por contratista",
  "ficha-costos-lote": "Costos del lote",
  "ficha-costos-rubro": "Detalle de costos",
  rotacion: "Rotación de cultivos",
  historico: "Panel histórico",
  "ficha-historico-cultivo": "Histórico por cultivo",
  "ficha-historico-lote": "Histórico por lote",
  cierre: "Cierre de campaña",
  "ficha-campana": "Ficha de campaña",
  "ficha-lote": "Ficha del lote",
  "ficha-monitoreo": "Ficha de monitoreo",
  "ficha-orden": "Ficha de orden"
};

function loadData() {
  const saved = safeStorageGet(storageKey);
  const base = window.APP_DATA ? { ...structuredClone(starterData), ...structuredClone(window.APP_DATA) } : structuredClone(starterData);
  const loaded = saved ? { ...base, ...JSON.parse(saved) } : base;
  loaded.applications = uniqueApplicationRows(loaded.applications || []);
  loaded.vouchers = Array.isArray(loaded.vouchers) ? loaded.vouchers.map(parseVoucherRecord) : [];
  normalizeCampaignRecords(loaded);
  return loaded;
}

function saveData() {
  averageCostVersion += 1;
  safeStorageSet(storageKey, JSON.stringify(data));
}

function loadSyncQueue() {
  try {
    const queue = JSON.parse(safeStorageGet(syncQueueKey) || "[]");
    return Array.isArray(queue) ? queue.map(normalizeSyncQueueItem) : [];
  } catch {
    return [];
  }
}

function normalizeSyncQueueItem(item) {
  if (item && typeof item.attempts !== "number") item.attempts = 0;
  return item;
}

function syncItemKey(item) {
  return `${item?.table || ""}|${recordMergeKey(item?.table, item?.record || {})}`;
}

function saveSyncQueue() {
  safeStorageSet(syncQueueKey, JSON.stringify(syncQueue));
}

function loadSyncConfig() {
  try {
    const saved = JSON.parse(safeStorageGet(syncConfigKey) || "{}");
    return { apiUrl: saved.apiUrl || defaultSyncApiUrl, apiKey: saved.apiKey || "" };
  } catch {
    return { apiUrl: defaultSyncApiUrl, apiKey: "" };
  }
}

function saveSyncConfig() {
  safeStorageSet(syncConfigKey, JSON.stringify(syncConfig));
}

function safeStorageGet(key) {
  try {
    return window.localStorage?.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    showToast("No se pudo guardar en este dispositivo. No cierres la app: sincronizá antes de continuar.");
  }
}

// Cada cambio viaja con la fecha de la última versión que este celular vio en la planilla (baseUpdatedAt).
// Si en la planilla hay una versión más nueva (otro celular, una corrección a mano o un script), el Apps Script
// no la pisa: devuelve un conflicto y la app pregunta qué versión queda.
let syncInFlightId = "";
// Límites para que "Sincronizando..." nunca quede colgado: cada envío espera como máximo 45 s, y una sincronización
// completa corta a los 4 minutos (lo que falte sale en la próxima). La foto completa tiene 2 minutos.
// Google a veces "se cuelga" antes de ejecutar el Apps Script (medido: 4 a 5 de cada 10 pedidos), aunque cuando
// arranca termina en 1 a 4 s. Por eso: espera corta y varios intentos. Reenviar es seguro (el Apps Script descarta
// los repetidos por su syncId).
let syncItemTimeoutMs = 12000;
let syncItemAttempts = 3;
let readTimeoutMs = 20000;
let readAttempts = 3;
let syncTotalTimeoutMs = 240000;
let photoUploadTimeoutMs = 120000;
let syncProgress = { done: 0, total: 0 };

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function queueSync(table, record, action = "append", options = {}) {
  averageCostVersion += 1; // cualquier cambio invalida el caché de cálculos
  const updatedAt = new Date().toISOString();
  if (record) record.updatedAt = updatedAt;
  const syncRecord = enrichRecordForSync(record);
  delete syncRecord._remoteUpdatedAt;
  delete syncRecord._syncStatus;
  delete syncRecord._syncId;
  delete syncRecord._syncAction;
  delete syncRecord._syncedAt;
  syncRecord.baseUpdatedAt = String(record?._remoteUpdatedAt || "");
  syncRecord.updatedAt = updatedAt;
  const item = {
    syncId: uid("sync"),
    table,
    action,
    record: syncRecord,
    createdAt: new Date().toISOString(),
    attempts: 0,
    // auto: recálculo de costos que hace la app sola. Si choca con otra versión se descarta y se recalcula.
    auto: Boolean(options.auto)
  };
  // Si el mismo registro ya tenía un cambio esperando (y todavía no se está enviando), se reemplaza por el nuevo:
  // conserva la versión de base y la acción original (un alta sigue siendo alta). Nuevo syncId para que el
  // Apps Script no lo descarte como repetido.
  const key = syncItemKey(item);
  const previousIndex = action === "delete" ? -1 : syncQueue.findIndex((queued) =>
    queued.syncId !== syncInFlightId && !queued.conflict && queued.action !== "delete" && syncItemKey(queued) === key);
  if (previousIndex >= 0) {
    const previous = syncQueue[previousIndex];
    item.action = previous.action;
    if (previous.record && !Object.prototype.hasOwnProperty.call(previous.record, "baseUpdatedAt")) delete item.record.baseUpdatedAt;
    else item.record.baseUpdatedAt = previous.record?.baseUpdatedAt ?? item.record.baseUpdatedAt;
    item.createdAt = previous.createdAt;
    item.auto = item.auto && Boolean(previous.auto);
    syncQueue.splice(previousIndex, 1);
  }
  if (record) {
    record._syncStatus = action === "delete" ? "delete-pending" : "pending";
    record._syncId = item.syncId;
    record._syncAction = item.action;
  }
  syncQueue.push(item);
  saveSyncQueue();
  renderSyncStatus();
  if (syncConfig.apiUrl && navigator.onLine !== false) syncPending();
}

function enrichRecordForSync(record) {
  const enriched = { ...record };
  delete enriched.driveLinks; // los links de Drive los escribe solo el Apps Script al subir la foto
  // El nombre legible del lote se recalcula siempre (registros viejos traían el ID en la columna "lote").
  const lot = enriched.lotId ? findLot(enriched) : null;
  if (lot) {
    enriched.lotId = lot.id;
    enriched.lotName = displayLotName(lot);
  } else if (enriched.lotId && !enriched.lotName) {
    enriched.lotName = lotName(enriched.lotId);
  }
  if (enriched.productId && !enriched.productName) enriched.productName = productName(enriched.productId);
  return enriched;
}

function syncMessage() {
  const pending = syncQueue.length;
  const urlState = syncConfig.apiUrl ? (syncConfig.apiKey ? "URL y clave configuradas" : "URL configurada, falta la clave de acceso") : "falta pegar la URL de Apps Script";
  const connection = navigator.onLine === false ? "sin conexion" : "con conexion";
  if (!pending) return `Todo sincronizado (${urlState}, ${connection}).`;
  const problems = syncQueue.filter((item) => item.conflict || item.lastError).length;
  const problemText = problems ? ` ${problems} necesita${problems === 1 ? "" : "n"} que la revises.` : "";
  return `${pending} carga${pending === 1 ? "" : "s"} pendiente${pending === 1 ? "" : "s"} (${urlState}, ${connection}).${problemText}`;
}

function renderSyncStatus() {
  const input = document.querySelector("#syncApiUrl");
  const status = document.querySelector("#syncStatus");
  const syncNow = document.querySelector("#syncNow");
  const globalSyncNow = document.querySelector("#globalSyncNow");
  if (input && document.activeElement !== input) input.value = syncConfig.apiUrl || "";
  if (status) {
    const describe = (item) => {
      const label = item.record?.date ? `${dateShort(item.record.date)} · ` : "";
      return `${label}${syncTableLabel(item.table)} · ${escapeHtml(item.record?.task || item.record?.cropStatus || item.record?.name || item.record?.number || item.record?.productName || item.record?.id || "registro")}`;
    };
    const conflicts = syncQueue.filter((item) => item.conflict);
    const failing = syncQueue.filter((item) => !item.conflict && item.lastError);
    const waiting = syncQueue.filter((item) => !item.conflict && !item.lastError);
    const conflictDetail = conflicts.map((item) => `
      <div class="sync-line sync-conflict">
        <span><b>Cambiado en otro lado:</b> ${describe(item)}. En la planilla hay una versión más nueva que la que tenía este celular.</span>
        <span class="sync-line-actions">
          <button class="link-button" type="button" data-sync-keep="${escapeHtml(item.syncId)}">Guardar mi versión</button>
          <button class="link-button" type="button" data-sync-discard="${escapeHtml(item.syncId)}">Usar la de la planilla</button>
        </span>
      </div>`).join("");
    const failingDetail = failing.map((item) => `
      <div class="sync-line sync-error">
        <span><b>No se pudo guardar</b> (${item.attempts} intento${item.attempts === 1 ? "" : "s"}): ${describe(item)}<br><small>${escapeHtml(item.lastError)}</small></span>
        <span class="sync-line-actions"><button class="link-button" type="button" data-sync-discard="${escapeHtml(item.syncId)}">Descartar este cambio</button></span>
      </div>`).join("");
    const photoDetail = photoUploadsPending ? `<span class="sync-line">${photoUploadsPending} foto${photoUploadsPending === 1 ? "" : "s"} completa${photoUploadsPending === 1 ? "" : "s"} esperando subir a Drive (se suben al sincronizar con señal)</span>` : "";
    const pendingDetail = photoDetail + waiting.slice(0, 5).map((item) => `<span class="sync-line">${describe(item)}</span>`).join("")
      + (waiting.length > 5 ? `<span class="sync-line muted">y ${waiting.length - 5} más…</span>` : "");
    status.innerHTML = `
      <strong>${syncRunning ? (syncProgress.total ? `Sincronizando ${Math.min(syncProgress.done, syncProgress.total)} de ${syncProgress.total}...` : "Leyendo la planilla...") : syncMessage()}</strong>
      <span>Los datos quedan guardados en este navegador aunque no haya señal.</span>
      ${!syncRunning && syncLastResult && !syncLastResult.ok ? `<div class="sync-line sync-error sync-last-error"><span><b>No se pudo sincronizar</b> (${escapeHtml(new Date(syncLastResult.at).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }))}): ${escapeHtml(syncLastResult.message)}</span></div>` : ""}
      ${conflictDetail || failingDetail ? `<div class="sync-problem-list">${conflictDetail}${failingDetail}</div>` : ""}
      ${pendingDetail ? `<div class="sync-pending-list">${pendingDetail}</div>` : ""}
    `;
    status.querySelectorAll("[data-sync-keep]").forEach((button) => button.addEventListener("click", () => resolveSyncConflict(button.dataset.syncKeep, "keep")));
    status.querySelectorAll("[data-sync-discard]").forEach((button) => button.addEventListener("click", () => resolveSyncConflict(button.dataset.syncDiscard, "discard")));
  }
  if (syncNow) syncNow.disabled = syncRunning || !syncConfig.apiUrl;
  if (globalSyncNow) {
    globalSyncNow.disabled = syncRunning || !syncConfig.apiUrl;
    globalSyncNow.classList.toggle("syncing", syncRunning);
    globalSyncNow.classList.toggle("has-problems", syncQueue.some((item) => item.conflict || item.lastError));
  }
}

function syncTableLabel(table) {
  const labels = {
    lots: "Lote",
    products: "Depósito",
    orders: "Orden",
    monitors: "Monitoreo",
    applications: "Aplicación",
    closures: "Cierre",
    vouchers: "Comprobante"
  };
  return labels[table] || table;
}

function syncCollection(table) {
  const collectionByTable = {
    lots: data.lots,
    products: data.products,
    orders: data.orders,
    monitors: data.monitors,
    applications: data.applications,
    closures: data.closures,
    vouchers: data.vouchers || []
  };
  return collectionByTable[table] || [];
}

function localRecordForSyncItem(queueItem) {
  const collection = syncCollection(queueItem.table);
  const key = recordMergeKey(queueItem.table, queueItem.record || {});
  return collection.find((item) => item._syncId === queueItem.syncId)
    || collection.find((item) => recordMergeKey(queueItem.table, item) === key);
}

// El Apps Script ya tiene esta versión: se registra como la nueva base para próximos cambios del mismo registro.
function markSynced(syncId) {
  const queueItem = syncQueue.find((item) => item.syncId === syncId);
  if (!queueItem) return;
  const sentUpdatedAt = queueItem.record?.updatedAt || "";
  const key = syncItemKey(queueItem);
  syncQueue.forEach((other) => {
    if (other.syncId !== syncId && syncItemKey(other) === key && other.record) other.record.baseUpdatedAt = sentUpdatedAt;
  });
  const record = localRecordForSyncItem(queueItem);
  if (record && queueItem.action !== "delete") {
    record._remoteUpdatedAt = sentUpdatedAt;
    if (record._syncId === syncId) {
      record._syncStatus = "synced";
      record._syncedAt = new Date().toISOString();
    }
    scheduleBadgeRefresh();
  }
}

// Un solo redibujado para sacar los carteles "Sincronizado", aunque se hayan sincronizado muchos registros.
let badgeRefreshTimer = 0;
function scheduleBadgeRefresh() {
  window.clearTimeout(badgeRefreshTimer);
  badgeRefreshTimer = window.setTimeout(renderAll, syncedBadgeVisibleMs + 250);
}

function syncBadge(record) {
  if (!record?._syncStatus) return "";
  if (record._syncStatus === "synced") {
    const syncedAt = record._syncedAt ? new Date(record._syncedAt).getTime() : 0;
    if (syncedAt && Date.now() - syncedAt > syncedBadgeVisibleMs) return "";
    return `<span class="sync-badge synced">Sincronizado</span>`;
  }
  const queued = syncQueue.find((item) => item.syncId === record._syncId);
  if (queued?.conflict) return `<span class="sync-badge conflict">Conflicto: revisar en Sincronización</span>`;
  if (queued?.lastError) return `<span class="sync-badge conflict">No se pudo guardar: ver Sincronización</span>`;
  if (record._syncStatus === "delete-pending") return `<span class="sync-badge pending">Eliminación pendiente</span>`;
  return `<span class="sync-badge pending">Pendiente de sincronizar</span>`;
}

function removeFromSyncQueue(syncId) {
  syncQueue = syncQueue.filter((item) => item.syncId !== syncId);
  saveSyncQueue();
}

// Conflicto o error: "keep" reenvía la versión del celular pisando la de la planilla;
// "discard" tira el cambio del celular y vuelve a leer la planilla.
async function resolveSyncConflict(syncId, mode) {
  const item = syncQueue.find((queued) => queued.syncId === syncId);
  if (!item) return;
  if (mode === "keep") {
    if (!window.confirm("Se va a guardar la versión de este celular y se pierde la que está en la planilla. ¿Seguir?")) return;
    delete item.record.baseUpdatedAt; // sin base: el Apps Script guarda esta versión sin comparar
    item.conflict = false;
    item.lastError = "";
    item.syncId = uid("sync");
    const record = localRecordForSyncItem({ ...item, syncId });
    if (record) record._syncId = item.syncId;
    saveSyncQueue();
    saveData();
    syncPending();
    return;
  }
  const message = item.conflict
    ? "Se descarta el cambio hecho en este celular y queda la versión de la planilla. ¿Seguir?"
    : item.action === "append"
      ? "Este registro nuevo no se va a guardar en la planilla y se borra de este celular. ¿Seguir?"
      : "Se descarta este cambio: no se va a guardar en la planilla y queda la versión de la planilla. ¿Seguir?";
  if (!window.confirm(message)) return;
  const record = localRecordForSyncItem(item);
  if (record) {
    record._syncStatus = undefined;
    record._syncId = undefined;
    record._syncAction = undefined;
    record._remoteUpdatedAt = "";
  }
  removeFromSyncQueue(syncId);
  saveData();
  renderAll();
  syncPending();
}

function syncFailureIsGlobal(message) {
  return /clave de acceso/i.test(String(message || ""));
}

async function syncPending() {
  if (syncRunning) {
    renderSyncStatus();
    return;
  }
  if (!syncConfig.apiUrl) {
    renderSyncStatus();
    showToast("Falta pegar la URL de Apps Script");
    return;
  }

  syncRunning = true;
  renderSyncStatus();

  // Se envía de a un registro. Si uno falla, se sigue con los demás (antes uno trabado frenaba toda la cola);
  // solo se saltean los cambios posteriores del MISMO registro, para no aplicarlos fuera de orden.
  const batch = syncQueue.filter((item) => !item.conflict);
  const blockedKeys = new Set(syncQueue.filter((item) => item.conflict).map(syncItemKey));
  let syncedCount = 0;
  let problemCount = 0;
  let stopMessage = "";
  const startedAt = Date.now();
  let consecutiveTransport = 0;
  syncProgress = { done: 0, total: batch.length };
  renderSyncStatus();
  try {
    for (const item of batch) {
      if (Date.now() - startedAt > syncTotalTimeoutMs) {
        stopMessage = "la sincronización tardó demasiado; lo que falta sale en la próxima";
        break;
      }
      syncProgress.done += 1;
      renderSyncStatus();
      if (!syncQueue.includes(item)) continue;
      const key = syncItemKey(item);
      if (blockedKeys.has(key)) continue;
      syncInFlightId = item.syncId;
      const outcome = await syncOneItem(item);
      syncInFlightId = "";
      if (outcome.status === "ok") {
        consecutiveTransport = 0;
        markSynced(item.syncId);
        removeFromSyncQueue(item.syncId);
        syncedCount += 1;
        continue;
      }
      if (outcome.status === "auth") {
        stopMessage = outcome.message;
        break;
      }
      if (outcome.status === "transport") {
        consecutiveTransport += 1;
        blockedKeys.add(key);
        if (consecutiveTransport >= 2) {
          stopMessage = outcome.message;
          break;
        }
        continue;
      }
      consecutiveTransport = 0;
      if (outcome.status === "conflict" && item.auto) {
        const record = localRecordForSyncItem(item);
        if (record && record._syncId === item.syncId) record._syncStatus = undefined;
        removeFromSyncQueue(item.syncId);
        continue;
      }
      item.attempts = (item.attempts || 0) + 1;
      item.lastError = outcome.message || "Error desconocido";
      if (outcome.status === "conflict") item.conflict = true;
      blockedKeys.add(key);
      problemCount += 1;
      saveSyncQueue();
    }
    if (!stopMessage) await pullRemoteData();
    saveSyncQueue();
    saveData();
    if (stopMessage) {
      setSyncLastResult(false, stopMessage);
      showToast(`No se pudo sincronizar: ${stopMessage}`);
    } else if (problemCount) {
      setSyncLastResult(true, "");
      showToast(`${problemCount} carga${problemCount === 1 ? "" : "s"} con problemas: revisá Sincronización`);
    } else {
      setSyncLastResult(true, "");
      showToast(syncedCount ? "Sincronizacion completa" : "Datos actualizados desde Sheets");
    }
  } catch (error) {
    setSyncLastResult(false, error?.message || "error desconocido");
    showToast(`No se pudo sincronizar: ${error.message || "queda pendiente"}`);
  } finally {
    syncInFlightId = "";
    syncRunning = false;
    syncProgress = { done: 0, total: 0 };
    renderSyncStatus();
    renderAll();
  }
  if (!stopMessage) processPhotoUploads();
  // Lo que se cargó mientras se sincronizaba sale en una vuelta más (con tope, por si algo se vuelve a encolar solo).
  const leftover = syncQueue.some((item) => !item.conflict && !item.lastError);
  if (!stopMessage && leftover && navigator.onLine !== false) {
    syncFollowUps += 1;
    if (syncFollowUps <= 3) window.setTimeout(syncPending, 400);
  } else {
    syncFollowUps = 0;
  }
}
let syncFollowUps = 0;

// Devuelve { status: "ok" | "conflict" | "error" | "transport" | "auth", message }.
function interpretSyncResult(item, result) {
  if (!result) return { status: "transport", message: "Respuesta vacía de Apps Script" };
  if (result.ok === false) {
    const message = result.error || "No se pudo sincronizar";
    if (syncFailureIsGlobal(message)) return { status: "auth", message };
    if (/modificado desde otro dispositivo/i.test(message)) return { status: "conflict", message };
    return { status: "error", message };
  }
  const conflict = (result.conflicts || []).find((entry) => entry.syncId === item.syncId);
  if (conflict) return { status: "conflict", message: conflict.error || "Modificado en la planilla" };
  const failed = (result.failed || []).find((entry) => entry.syncId === item.syncId);
  if (failed) return { status: "error", message: failed.error || "No se pudo guardar" };
  return { status: "ok" };
}

async function syncOneItem(item) {
  const body = JSON.stringify({ source: "gestion-agro", key: syncConfig.apiKey || "", items: [item] });
  let result;
  try {
    let lastError = null;
    for (let attempt = 1; attempt <= syncItemAttempts && !result; attempt += 1) {
      try {
        const response = await fetchWithTimeout(syncConfig.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body
        }, syncItemTimeoutMs);
        result = await response.json();
      } catch (error) {
        lastError = error;
        if (error?.name !== "AbortError") break; // otro error (no un cuelgue): se maneja abajo
      }
    }
    if (!result) throw lastError || new Error("Sin respuesta");
  } catch (error) {
    // Google no respondió a tiempo. Muchas veces el registro igual se guardó (el Apps Script tarda 2 a 4 s) y lo que
    // se perdió es la respuesta: se confirma leyendo la planilla y, si está, se sigue con el resto.
    if (error?.name === "AbortError") {
      const confirmed = await confirmItemByReading(item);
      if (confirmed === true) return { status: "ok" };
      if (confirmed === false) return { status: "transport", message: "Google no respondió al enviar y el registro todavía no figura en la planilla. Queda pendiente." };
      return { status: "transport", message: "Google no respondió ni al enviar ni al leer la planilla. Tocá 'Probar conexión' para ver qué falla." };
    }
    // No se pudo leer la respuesta. Un registro grande no entra en la dirección web del método alternativo:
    // se verifica leyendo la planilla si llegó igual.
    if (isLargeSyncItem(item)) {
      try {
        await wait(1800);
        const read = await pullRemoteData();
        if (remoteContainsSyncItem(read.data || {}, item)) return { status: "ok" };
      } catch (error) {
        return { status: "transport", message: error.message || "Sin conexión con Apps Script" };
      }
      return { status: "transport", message: "No se pudo confirmar el envío de un registro grande. Queda pendiente." };
    }
    try {
      result = await syncOneItemJsonp(item);
    } catch (error) {
      return { status: "transport", message: error.message || "Sin conexión con Apps Script" };
    }
  }
  return interpretSyncResult(item, result);
}

// true = el registro está en la planilla (o, si era un borrado, ya no está); false = no está; null = no se pudo leer.
async function confirmItemByReading(item) {
  try {
    await wait(1500);
    const read = await pullRemoteData();
    const rows = Array.isArray(read?.data?.[item.table]) ? read.data[item.table] : [];
    if (item.action === "delete") {
      const key = recordMergeKey(item.table, item.record);
      return !rows.some((row) => recordMergeKey(item.table, row) === key);
    }
    return remoteContainsSyncItem(read.data || {}, item);
  } catch {
    return null;
  }
}

// ===== Probar conexión =====
// Mide por separado las tres formas en que la app habla con Google, para saber cuál falla sin herramientas técnicas.
let connectionTestRunning = false;

async function runConnectionTest() {
  const box = document.querySelector("#syncDiagnostics");
  if (!box || connectionTestRunning) return;
  if (!syncConfig.apiUrl) { showToast("Falta la URL de Apps Script"); return; }
  connectionTestRunning = true;
  const testButton = document.querySelector("#syncTest");
  if (testButton) { testButton.disabled = true; testButton.textContent = "Probando…"; }
  const lines = [];
  const paint = (running = true) => {
    box.innerHTML = `<strong>Prueba de conexión</strong>${lines.map((line) => `<div class="diag-line ${line.ok ? "ok" : line.ok === false ? "bad" : ""}">${line.ok ? "✓" : line.ok === false ? "✗" : /de 3/.test(line.text) ? "⚠" : "•"} ${escapeHtml(line.text)}</div>`).join("")}${running ? '<div class="diag-line">Probando…</div>' : ""}`;
  };
  const describe = (error) => error?.name === "AbortError" ? "sin respuesta (se cortó por tiempo)" : `${error?.name || "Error"}: ${error?.message || error}`;
  // Cada paso se prueba 3 veces: la falla de Google es intermitente y un solo intento no alcanza para verla.
  const timed = async (label, fn) => {
    const results = [];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const started = performance.now();
      try {
        const detail = await fn();
        results.push({ ok: true, ms: Math.round(performance.now() - started), detail });
      } catch (error) {
        results.push({ ok: false, ms: Math.round(performance.now() - started), error: describe(error) });
      }
    }
    const good = results.filter((item) => item.ok);
    const times = results.map((item) => item.ok ? `${(item.ms / 1000).toFixed(1)} s` : "colgado").join(", ");
    const detail = good[0]?.detail ? ` · ${good[0].detail}` : "";
    const error = results.find((item) => !item.ok)?.error;
    lines.push({ ok: good.length === 3 ? true : good.length ? null : false, text: `${label}: ${good.length} de 3 respondieron (${times})${detail}${!good.length && error ? ` · ${error}` : ""}` });
    paint();
  };
  paint();
  box.scrollIntoView({ behavior: "smooth", block: "center" });
  lines.push({ ok: null, text: `Conexión del equipo: ${navigator.onLine === false ? "sin conexión" : "con conexión"} · versión de la app ${document.querySelector('script[src^="app.js"]')?.getAttribute("src")?.split("v=")[1] || "-"}` });
  paint();
  await timed("1. Aviso simple a Google", async () => {
    const response = await fetchWithTimeout(syncConfig.apiUrl, { method: "GET" }, 12000);
    const result = await response.json();
    if (!result?.ok) throw new Error(result?.error || "respuesta inesperada");
    return "responde";
  });
  await timed("2. Envío vacío (como al sincronizar)", async () => {
    const response = await fetchWithTimeout(syncConfig.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ source: "gestion-agro", key: syncConfig.apiKey || "", items: [] })
    }, 12000);
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { throw new Error(`respuesta que no es de la app (${text.slice(0, 60).replace(/\s+/g, " ")}…)`); }
    if (result?.ok === false) throw new Error(result.error || "rechazado");
    return "aceptado";
  });
  await timed("3. Lectura de la planilla", async () => {
    const result = await pullRemoteDataOnce(readTimeoutMs);
    const data = result?.data || {};
    return `${(data.lots || []).length} lotes, ${(data.orders || []).length} órdenes, ${(data.products || []).length} insumos`;
  });
  connectionTestRunning = false;
  if (testButton) { testButton.disabled = false; testButton.textContent = "Probar conexión"; }
  const flaky = lines.some((line) => line.ok === null && /de 3/.test(line.text)) || lines.some((line) => line.ok === false);
  if (flaky) lines.push({ ok: null, text: "Si algunos intentos quedan \"colgado\", Google está respondiendo de forma intermitente: la app reintenta sola y lo que no llegue sale en la próxima sincronización." });
  saveData();
  paint(false);
  renderAll();
}

function isLargeSyncItem(item) {
  return JSON.stringify(item?.record || {}).length > 6000;
}

function remoteContainsSyncItem(remote, item) {
  const rows = Array.isArray(remote?.[item.table]) ? remote[item.table] : [];
  const key = recordMergeKey(item.table, item.record);
  return rows.some((row) => recordMergeKey(item.table, row) === key && (!item.record?.updatedAt || row.updatedAt === item.record.updatedAt));
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function syncOneItemJsonp(item) {
  return new Promise((resolve, reject) => {
    const callbackName = `gestionAgroSync_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const payload = encodeURIComponent(JSON.stringify({ source: "gestion-agro", key: syncConfig.apiKey || "", items: [item] }));
    const separator = syncConfig.apiUrl.includes("?") ? "&" : "?";
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tiempo de sincronizacion agotado"));
    }, 15000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (result) => {
      cleanup();
      resolve(result);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("No se pudo conectar con Apps Script"));
    };
    script.src = `${syncConfig.apiUrl}${separator}callback=${callbackName}&payload=${payload}`;
    document.body.appendChild(script);
  });
}

async function pullRemoteData() {
  let lastError = null;
  for (let attempt = 1; attempt <= readAttempts; attempt += 1) {
    try {
      return await pullRemoteDataOnce(readTimeoutMs);
    } catch (error) {
      lastError = error;
      // Clave equivocada o respuesta del Apps Script con error: no tiene sentido reintentar.
      if (!error?.retryable) throw error;
    }
  }
  throw lastError;
}

function pullRemoteDataOnce(timeoutMs) {
  return new Promise((resolve, reject) => {
    const callbackName = `gestionAgroRead_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const separator = syncConfig.apiUrl.includes("?") ? "&" : "?";
    const script = document.createElement("script");
    const retryable = (message) => Object.assign(new Error(message), { retryable: true });
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(retryable("Google no mandó la planilla (se probó 3 veces). Probá de nuevo en un rato."));
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timeout);
      // Si la respuesta llega tarde, que no dé error en la consola.
      window[callbackName] = () => {};
      script.remove();
    }

    window[callbackName] = (result) => {
      cleanup();
      if (!result || result.ok === false) {
        reject(new Error(result?.error || "No se pudo leer Google Sheets"));
        return;
      }
      if (!result.data) {
        reject(new Error("Apps Script necesita actualizarse para leer datos"));
        return;
      }
      mergeRemoteData(result.data || {}, result.missing || []);
      resolve(result);
    };

    script.onerror = () => {
      cleanup();
      reject(retryable("No se pudo conectar con Apps Script"));
    };
    script.src = `${syncConfig.apiUrl}${separator}action=read&key=${encodeURIComponent(syncConfig.apiKey || "")}&callback=${callbackName}&ts=${Date.now()}`;
    document.body.appendChild(script);
  });
}

// Trae la planilla al celular. Protecciones: si una tabla no vino (pestaña renombrada o borrada) o vino vacía
// mientras el celular tiene registros ya sincronizados, NO se borra nada local y se avisa.
function mergeRemoteData(remote, missingTables = []) {
  averageCostVersion += 1;
  const tables = ["lots", "products", "orders", "monitors", "applications", "closures", "vouchers"];
  const skipped = [];
  tables.forEach((table) => {
    if (!Array.isArray(remote[table])) {
      if (table !== "vouchers") skipped.push(table);
      return;
    }
    const rows = remote[table].filter((row) => row && row.id);
    const current = Array.isArray(data[table]) ? data[table] : [];
    const isPending = (item) => item?._syncStatus === "pending" || item?._syncStatus === "delete-pending";
    const syncedLocal = current.filter((item) => item?.id && !isPending(item)).length;
    if (missingTables.includes(table) || (!rows.length && syncedLocal >= 3)) {
      if (table !== "vouchers") skipped.push(table);
      return;
    }
    const remoteKeys = new Set(rows.map((row) => recordMergeKey(table, row)));
    const indexByKey = new Map(current.map((item, index) => [recordMergeKey(table, item), index]));
    rows.forEach((row) => {
      const key = recordMergeKey(table, row);
      const index = indexByKey.has(key) ? indexByKey.get(key) : -1;
      const cleanRow = { ...row, _remoteUpdatedAt: String(row.updatedAt || "") };
      if (index >= 0) {
        if (isPending(current[index])) return;
        current[index] = { ...current[index], ...cleanRow, _syncStatus: undefined, _syncId: undefined, _syncAction: undefined };
      } else {
        indexByKey.set(key, current.length);
        current.push(cleanRow);
      }
    });
    const filtered = current.filter((item) => {
      if (!item?.id) return false;
      if (isPending(item)) return true;
      return remoteKeys.has(recordMergeKey(table, item));
    });
    data[table] = table === "applications" ? uniqueApplicationRows(filtered) : table === "vouchers" ? filtered.map(parseVoucherRecord) : filtered;
  });
  normalizeCampaignRecords(data);
  data.products.forEach(recalculateApplicationsForProduct);
  syncLotsWithRotation();
  if (skipped.length) {
    const names = skipped.map(syncTableLabel).join(", ");
    window.setTimeout(() => showToast(`La planilla no devolvió: ${names}. No se borró nada de este celular; revisá las pestañas.`), 2000);
  }
}

function recordMergeKey(table, row) {
  if (table === "applications") return applicationKey(row);
  return String(row?.id || "");
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseDecimal(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  let text = String(value ?? "").trim().replace(/\s/g, "");
  if (!text) return fallback;
  const comma = text.lastIndexOf(",");
  const dot = text.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimalSeparator = comma > dot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    text = text.replaceAll(thousandsSeparator, "").replace(decimalSeparator, ".");
  } else {
    text = text.replace(",", ".");
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value) {
  return `u$s ${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function moneyOptional(value) {
  return value === "" || value === null || value === undefined ? "-" : money(value);
}

function number(value, digits = 0) {
  return Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function numberOptional(value, digits = 0) {
  return value === "" || value === null || value === undefined ? "-" : number(value, digits);
}

function closureYield(closure) {
  const kgHarvested = Number(closure?.kgHarvested);
  const hectares = Number(closure?.hectares);
  return kgHarvested && hectares ? kgHarvested / hectares : "";
}

function dateShort(value) {
  if (!value) return "-";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year.slice(-2)}`;
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function receiptText(product) {
  return String(product?.receiptNumbers || product?.receiptNumber || "").trim();
}

function productLogicalKey(product) {
  return [
    normalizeName(product?.name),
    normalizeUnitKey(product?.unit),
    normalizeWarehouseKey(product?.warehouse)
  ].join("|");
}

function productStockKey(product) {
  return [
    normalizeName(product?.name),
    normalizeUnitKey(product?.unit)
  ].join("|");
}

function normalizeUnitKey(unit) {
  const normalized = normalizeName(unit).replace(/\s+/g, "");
  if (["l", "lt", "lts", "litro", "litros"].includes(normalized)) return "lt";
  if (["kg", "kgs", "kilo", "kilos"].includes(normalized)) return "kg";
  if (["un", "und", "unidad", "unidades"].includes(normalized)) return "un";
  return normalized;
}

function normalizeWarehouseKey(warehouse) {
  return normalizeName(warehouse)
    .replace(/\bdeposito\b/g, "")
    .replace(/\bprincipal\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ===== Caché de cálculos derivados =====
// Stock, grupos de productos y remitos se recalculaban miles de veces por pantalla (renderAll tardaba ~8 s con
// los datos reales). Se calculan una vez por versión de los datos: la versión cambia al guardar, al leer la planilla
// y al empezar cada renderAll, así que nunca se muestra un valor viejo.
let derivedCache = null;
function derivedData() {
  const key = averageCostCacheKey();
  if (derivedCache && derivedCache.key === key) return derivedCache;
  const groups = new Map();
  const productsById = new Map();
  data.products.forEach((item) => {
    productsById.set(item.id, item);
    const groupKey = productStockKey(item);
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(item);
  });
  derivedCache = { key, groups, productsById, groupMeta: new Map(), stock: new Map(), uniqueApplications: null, applicationsByGroup: new Map() };
  return derivedCache;
}

function productGroupProducts(product) {
  const key = productStockKey(product);
  if (!key) return product ? [product] : [];
  return derivedData().groups.get(key) || [];
}

function productGroupMeta(product) {
  const cache = derivedData();
  const key = productStockKey(product);
  if (!cache.groupMeta.has(key)) {
    const group = productGroupProducts(product);
    cache.groupMeta.set(key, {
      ids: new Set(group.map((item) => item.id)),
      names: new Set(group.map((item) => normalizeName(item.name)).filter(Boolean))
    });
  }
  return cache.groupMeta.get(key);
}

function cachedUniqueApplications() {
  const cache = derivedData();
  if (!cache.uniqueApplications) cache.uniqueApplications = uniqueApplicationRows(data.applications);
  return cache.uniqueApplications;
}

function applicationsForProductGroup(product) {
  const cache = derivedData();
  const key = productStockKey(product) || product?.id || "";
  if (!cache.applicationsByGroup.has(key)) {
    cache.applicationsByGroup.set(key, cachedUniqueApplications().filter((application) => productMatchesApplication(product, application)));
  }
  return cache.applicationsByGroup.get(key);
}

const receiptParseCache = new Map();

function parseReceiptEntries(product) {
  return String(receiptText(product) || "").split(/\r?\n/).flatMap((line) => {
    const value = line.trim();
    if (!value) return [];
    if (value.includes("|")) {
      const [number, date, quantity, unitCost, supplier, voucherId] = value.split("|");
      return [{ number, date, quantity, unitCost, supplier: supplier || product?.supplier || "", voucherId: voucherId || "", detailed: true }];
    }
    return value.split(",").map((number) => ({ number: number.trim(), supplier: product?.supplier || "", detailed: false })).filter((entry) => entry.number);
  });
}

function receiptEntriesForProduct(product) {
  const text = String(receiptText(product) || "");
  if (!text) return [];
  const cacheKey = `${text}${product?.supplier || ""}`;
  let entries = receiptParseCache.get(cacheKey);
  if (!entries) {
    if (receiptParseCache.size > 2000) receiptParseCache.clear();
    entries = parseReceiptEntries(product);
    receiptParseCache.set(cacheKey, entries);
  }
  return entries.map((entry) => ({ ...entry }));
}

function receiptEntries(product) {
  return productGroupProducts(product).flatMap((item) =>
    receiptEntriesForProduct(item).map((entry, index) => ({
      ...entry,
      sourceProductId: item.id,
      sourceProductName: item.name,
      sourceWarehouse: item.warehouse,
      sourceUnit: item.unit,
      sourceIndex: index
    }))
  );
}

function allReceiptRows() {
  return data.products.flatMap((product) =>
    receiptEntriesForProduct(product).map((entry, index) => ({
      ...entry,
      product,
      sourceProductId: product.id,
      sourceProductName: product.name,
      sourceWarehouse: product.warehouse,
      sourceUnit: product.unit,
      sourceIndex: index,
      supplier: entry.supplier || product.supplier || ""
    }))
  );
}

function receiptGroupKey(entry) {
  return [
    entry.number || "Sin remito",
    entry.date || "",
    entry.supplier || "",
    entry.sourceWarehouse || entry.product?.warehouse || ""
  ].map((value) => encodeURIComponent(String(value || ""))).join("|");
}

function receiptLineKey(entry) {
  return [entry.sourceProductId, entry.sourceIndex].map((value) => encodeURIComponent(String(value ?? ""))).join("|");
}

function receiptRowsByKey(key) {
  return allReceiptRows().filter((entry) => receiptGroupKey(entry) === key);
}

function receiptGroupFromRows(rows) {
  const first = rows[0] || {};
  return {
    number: first.number || "Sin remito",
    date: first.date || "",
    supplier: first.supplier || "",
    warehouse: first.sourceWarehouse || first.product?.warehouse || "",
    rows,
    total: rows.reduce((sum, entry) => sum + parseDecimal(entry.quantity) * parseDecimal(entry.unitCost), 0)
  };
}

function datedReceiptEntries(product) {
  return receiptEntries(product)
    .filter((entry) => entry.detailed && entry.date)
    .map((entry) => ({ ...entry, parsedUnitCost: parseDecimal(entry.unitCost) }))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

// Precio promedio ponderado móvil: cada compra se promedia con lo que queda en stock (todas las compras del
// producto, en todos los depósitos); los consumos (órdenes finalizadas) no cambian el promedio.
// Reemplaza al "precio de la última compra", que valuaba todo lo aplicado al último precio aunque se usara stock viejo.
let averageCostCache = { key: "", map: new Map() };
function averageCostCacheKey() {
  return `${data.products.length}|${data.applications.length}|${data.orders.length}|${averageCostVersion}`;
}
let averageCostVersion = 0;

function weightedAverageCost(product, date) {
  const cacheKey = averageCostCacheKey();
  if (averageCostCache.key !== cacheKey) averageCostCache = { key: cacheKey, map: new Map() };
  const memoKey = `${productStockKey(product)}|${date || ""}`;
  if (averageCostCache.map.has(memoKey)) return averageCostCache.map.get(memoKey);
  const group = productGroupProducts(product);
  const receipts = group.flatMap((item) => {
    const entries = receiptEntriesForProduct(item).filter((entry) => entry.detailed && entry.date);
    const initial = initialStock(item);
    const openingEvent = initial > 0 ? [{ type: "in", date: "", quantity: initial, cost: parseDecimal(item.unitCost) }] : [];
    if (entries.length) return [...openingEvent, ...entries.map((entry) => ({ type: "in", date: entry.date, quantity: parseDecimal(entry.quantity), cost: parseDecimal(entry.unitCost) }))];
    if (openingEvent.length) return openingEvent;
    const opening = parseDecimal(item.quantity);
    return opening > 0 ? [{ type: "in", date: "", quantity: opening, cost: parseDecimal(item.unitCost) }] : [];
  });
  let result = null;
  if (receipts.length) {
    const consumptions = applicationsForProductGroup(product)
      .filter((application) => {
        const order = orderById(application.orderId);
        return order ? order.status === "Finalizada" : !!application.id;
      })
      .map((application) => ({ type: "out", date: applicationPricingDate(application), quantity: applicationQuantity(application) }));
    const events = [...receipts, ...consumptions].sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.type === "in" ? -1 : 1) - (b.type === "in" ? -1 : 1));
    let onHand = 0;
    let average = null;
    for (const event of events) {
      if (date && event.date > date) break;
      if (event.type === "out") { onHand -= event.quantity; continue; }
      average = average == null || onHand <= 0 ? event.cost : (onHand * average + event.quantity * event.cost) / (onHand + event.quantity);
      onHand += event.quantity;
    }
    result = average;
  }
  averageCostCache.map.set(memoKey, result);
  return result;
}

function unitCostForProductDate(product, date, fallbackCost = "") {
  if (!product) return parseDecimal(fallbackCost);
  const weighted = weightedAverageCost(product, date);
  if (weighted != null) return weighted;
  const dated = datedReceiptEntries(product);
  const eligible = dated.filter((entry) => !date || entry.date <= date);
  if (eligible.length) return eligible[eligible.length - 1].parsedUnitCost;
  if (fallbackCost !== "" && fallbackCost != null) return parseDecimal(fallbackCost);
  if (dated.length) return dated[0].parsedUnitCost;
  return parseDecimal(product.unitCost);
}

function refreshProductCurrentUnitCost(product) {
  const latest = datedReceiptEntries(product).at(-1);
  if (latest) product.unitCost = latest.parsedUnitCost;
}

function applicationPricingDate(application) {
  return orderById(application.orderId)?.date || application.date || "";
}

function applicationProduct(application) {
  return data.products.find((product) => productMatchesApplication(product, application));
}

function applicationUnitCost(application) {
  return unitCostForProductDate(applicationProduct(application), applicationPricingDate(application), application.unitCost);
}

function applicationProductCost(application) {
  return applicationQuantity(application) * applicationUnitCost(application);
}

function receiptLabels(product) {
  return [...new Set(receiptEntries(product).map((entry) => entry.number).filter(Boolean))];
}

function productWarehouseLabels(product) {
  return [...new Set(productGroupProducts(product).map((item) => item.warehouse).filter(Boolean))];
}

function productDisplayUnitCost(product) {
  return unitCostForProductDate(product, "9999-12-31", product?.unitCost);
}

function receiptPhotoSource(product) {
  return productGroupProducts(product).map((item) => item.receiptPhoto).find((value) => String(value || "").startsWith("data:image/")) || "";
}

function receiptQuantityTotal(product) {
  return receiptEntriesForProduct(product)
    .filter((entry) => entry.detailed)
    .reduce((sum, entry) => sum + parseDecimal(entry.quantity), 0);
}

function appendReceiptEntry(current, receiptNumber, receiptDate, quantity, unitCost, supplier = "", voucherId = "") {
  const incoming = String(receiptNumber || "").trim() || "Sin remito";
  const entry = [incoming, receiptDate || todayValue(), parseDecimal(quantity), parseDecimal(unitCost), String(supplier || "").trim(), voucherId].join("|").replace(/\|$/, "");
  return [String(current || "").trim(), entry].filter(Boolean).join("\n");
}

function hasReceiptNumber(product, receiptNumber) {
  const normalized = normalizeName(receiptNumber);
  return normalized && receiptLabels(product).some((number) => normalizeName(number) === normalized);
}

function serializeReceiptEntries(entries) {
  return entries.map((entry) => entry.detailed
    ? [entry.number, entry.date, parseDecimal(entry.quantity), parseDecimal(entry.unitCost), entry.supplier || "", entry.voucherId || ""].join("|").replace(/\|$/, "")
    : entry.number
  ).filter(Boolean).join("\n");
}

function matchingProductByName(name, excludedId = "") {
  const normalized = normalizeName(name);
  if (!normalized) return null;
  return data.products.find((product) => product.id !== excludedId && normalizeName(product.name) === normalized) || null;
}

function displayProducts() {
  const groups = new Map();
  data.products.forEach((product) => {
    const key = productStockKey(product) || product.id;
    const current = groups.get(key);
    if (!current || receiptEntriesForProduct(product).length > receiptEntriesForProduct(current).length) groups.set(key, product);
  });
  return Array.from(groups.values()).sort(compareProductsByStock);
}

function compareText(a, b) {
  return String(a || "").localeCompare(String(b || ""), "es", { numeric: true, sensitivity: "base" });
}

function compareProductsByName(a, b) {
  const byName = compareText(a?.name, b?.name);
  if (byName) return byName;
  return compareText(a?.unit, b?.unit);
}

function compareProductsByStock(a, b) {
  const aStock = stockForProduct(a).physical;
  const bStock = stockForProduct(b).physical;
  const aPositive = aStock > 0;
  const bPositive = bStock > 0;
  if (aPositive || bPositive) {
    if (aPositive !== bPositive) return aPositive ? -1 : 1;
    if (Math.abs(bStock - aStock) > 0.005) return bStock - aStock;
    return compareProductsByName(a, b);
  }
  const aNegative = aStock < 0;
  const bNegative = bStock < 0;
  if (aNegative || bNegative) {
    if (aNegative !== bNegative) return aNegative ? -1 : 1;
    if (Math.abs(aStock - bStock) > 0.005) return aStock - bStock;
    return compareProductsByName(a, b);
  }
  return compareProductsByName(a, b);
}

function applyExistingProductDefaults() {
  if (editingProductId) return;
  const input = document.activeElement?.name === "name" ? document.activeElement : document.querySelector("#productForm")?.elements?.name;
  applyExistingProductDefaultsForLine(input?.closest(".deposit-product-line") || document.querySelector("#productForm"));
}

function applyExistingProductDefaultsForLine(line) {
  const form = document.querySelector("#productForm");
  const nameInput = line?.querySelector?.('[name="name"]') || form?.elements?.name;
  const product = matchingProductByName(nameInput?.value);
  if (!form || !line || !product) return;
  line.querySelector('[name="type"]').value = product.type || "Otro";
  const vatSelect = line.querySelector('[name="vatRate"]');
  if (vatSelect) vatSelect.value = defaultVatRate(product.type);
  line.querySelector('[name="unit"]').value = product.unit || "";
  line.querySelector('[name="unitCost"]').value = product.unitCost ?? "";
  updateVoucherTotals();
  form.elements.warehouse.value = form.elements.warehouse.value || product.warehouse || "";
}

function depositProductLines() {
  return Array.from(document.querySelectorAll("#productForm .deposit-product-line"));
}

function depositLineValues(line) {
  return {
    name: line.querySelector('[name="name"]')?.value?.trim() || "",
    type: line.querySelector('[name="type"]')?.value || "Otro",
    unit: line.querySelector('[name="unit"]')?.value?.trim() || "",
    quantity: line.querySelector('[name="quantity"]')?.value || "",
    unitCost: line.querySelector('[name="unitCost"]')?.value || "",
    vatRate: line.querySelector('[name="vatRate"]')?.value || ""
  };
}

function findDepositProductMatch(values, excludedId = "") {
  const target = productLogicalKey(values);
  const exact = data.products.find((product) => product.id !== excludedId && productLogicalKey(product) === target);
  if (exact) return exact;
  return values.unit || values.warehouse ? null : matchingProductByName(values.name, excludedId);
}

function setDepositLineValues(line, values = {}) {
  if (!line) return;
  line.querySelector('[name="name"]').value = values.name || "";
  line.querySelector('[name="type"]').value = values.type || "Otro";
  line.querySelector('[name="unit"]').value = values.unit || "";
  line.querySelector('[name="quantity"]').value = values.quantity ?? "";
  line.querySelector('[name="unitCost"]').value = values.unitCost ?? "";
  const vat = line.querySelector('[name="vatRate"]');
  if (vat) vat.value = values.vatRate || defaultVatRate(values.type);
}

function syncDepositLineButtons() {
  const lines = depositProductLines();
  lines.forEach((line) => {
    line.querySelector(".remove-deposit-line")?.classList.toggle("hidden-panel", editingProductId || lines.length <= 1);
  });
  document.querySelector("#addDepositProductLine")?.classList.toggle("hidden-panel", Boolean(editingProductId));
}

function addDepositProductLine(values = {}) {
  const linesWrap = document.querySelector("#depositProductLines");
  const template = depositProductLines()[0];
  if (!linesWrap || !template) return;
  const line = template.cloneNode(true);
  setDepositLineValues(line, values);
  line.querySelector('[name="name"]')?.addEventListener("change", () => applyExistingProductDefaultsForLine(line));
  line.querySelector(".remove-deposit-line")?.addEventListener("click", () => {
    line.remove();
    syncDepositLineButtons();
    updateVoucherTotals();
  });
  linesWrap.insertBefore(line, linesWrap.querySelector("#addDepositProductLine"));
  syncDepositLineButtons();
  line.querySelector('[name="name"]')?.focus();
}

function resetDepositProductLines() {
  const lines = depositProductLines();
  lines.slice(1).forEach((line) => line.remove());
  setDepositLineValues(lines[0], {});
  syncDepositLineButtons();
}

function initializeDepositFormLayout() {
  const form = document.querySelector("#productForm");
  if (!form || form.querySelector("#depositProductLines")) return;
  const labelFor = (name) => form.elements[name]?.closest("label");
  const productLabels = ["name", "type", "unit", "quantity", "unitCost"].map(labelFor).filter(Boolean);
  const line = document.createElement("div");
  line.className = "deposit-product-line";
  productLabels[0].before(line);
  productLabels.forEach((label) => line.appendChild(label));
  const removeButton = document.createElement("button");
  removeButton.className = "link-button danger hidden-panel remove-deposit-line";
  removeButton.type = "button";
  removeButton.textContent = "✕";
  removeButton.title = "Quitar este producto";
  removeButton.setAttribute("aria-label", "Quitar este producto");
  line.appendChild(removeButton);
  const linesWrap = document.createElement("div");
  linesWrap.id = "depositProductLines";
  linesWrap.className = "deposit-product-lines";
  line.before(linesWrap);
  linesWrap.appendChild(line);
  [labelFor("warehouse"), labelFor("receiptDate"), labelFor("receiptNumber")].filter(Boolean).reverse().forEach((label) => {
    form.insertBefore(label, linesWrap);
  });
  if (!form.elements.supplier) {
    const supplierLabel = document.createElement("label");
    supplierLabel.innerHTML = `Proveedor <input name="supplier" list="supplierCatalogList" placeholder="Comercio o proveedor" />`;
    form.insertBefore(supplierLabel, linesWrap);
  }
  form.elements.receiptNumber.required = true;
  form.elements.warehouse.setAttribute("list", "warehouseCatalogList");
  form.elements.warehouse.placeholder = "Elegí o escribí depósito";
  form.elements.receiptNumber.closest("label").firstChild.textContent = "Nro. de remito/factura ";
  if (!form.elements.receiptPhotoFile) {
    const photoLabel = document.createElement("label");
    photoLabel.className = "receipt-photo-field";
    photoLabel.innerHTML = `Foto del remito/factura <input name="receiptPhotoFile" type="file" accept="image/*" />`;
    form.insertBefore(photoLabel, linesWrap);
  }
  let warehouseList = document.querySelector("#warehouseCatalogList");
  if (!warehouseList) {
    warehouseList = document.createElement("datalist");
    warehouseList.id = "warehouseCatalogList";
    document.body.appendChild(warehouseList);
  }
  let supplierList = document.querySelector("#supplierCatalogList");
  if (!supplierList) {
    supplierList = document.createElement("datalist");
    supplierList.id = "supplierCatalogList";
    document.body.appendChild(supplierList);
  }
  if (!document.querySelector("#addDepositProductLine")) {
    const button = document.createElement("button");
    button.className = "link-button add-line-button";
    button.id = "addDepositProductLine";
    button.type = "button";
    button.textContent = "+ Agregar producto";
    linesWrap.appendChild(button);
    button.addEventListener("click", () => addDepositProductLine());
  }
  line.querySelector('[name="name"]')?.addEventListener("change", () => applyExistingProductDefaultsForLine(line));
  removeButton.addEventListener("click", () => {
    line.remove();
    syncDepositLineButtons();
    updateVoucherTotals();
  });
  initializeVoucherFields(form, line, linesWrap);
  syncDepositLineButtons();
}

// ===== Comprobantes de compra (factura / remito) =====
// Cada ingreso al depósito guarda además el comprobante completo (tipo, IVA, percepciones, vencimiento),
// para que la app de administración lo importe sin volver a cargarlo.
const VOUCHER_TYPES = ["Factura A", "Factura B", "Factura C", "Remito", "Sin comprobante"];

function defaultVatRate(type) {
  return /fertiliz|semilla|curasem|inoculant/i.test(String(type || "")) ? "10.5" : "21";
}

function parseVoucherRecord(record) {
  const voucher = { ...record };
  if (typeof voucher.lines === "string") {
    try { voucher.lines = JSON.parse(voucher.lines || "[]"); } catch { voucher.lines = []; }
  }
  if (!Array.isArray(voucher.lines)) voucher.lines = [];
  voucher.partner = String(voucher.partner || "").trim();
  return voucher;
}

function voucherForSync(voucher) {
  return { ...voucher, lines: JSON.stringify(voucher.lines || []) };
}

function initializeVoucherFields(form, line, linesWrap) {
  if (form.elements.voucherType) return;
  const header = document.createElement("div");
  header.className = "voucher-header";
  header.innerHTML = `
    <label>Comprobante <select name="voucherType">${VOUCHER_TYPES.map((type) => `<option>${type}</option>`).join("")}</select></label>
    <label>Vencimiento <input name="dueDate" type="date" /></label>
    <label>Moneda <select name="currency"><option value="USD">US$</option><option value="ARS">Pesos</option></select></label>
    <label class="voucher-fx">TC de la factura (pesos por US$) <input name="fxRate" type="text" inputmode="decimal" placeholder="Ej. 1480" /></label>
    <label class="voucher-partner">Aporte de socio <input name="partner" list="partnerCatalogList" placeholder="Vacío = lo compra SAGRO" /></label>`;
  // El tipo de comprobante va primero, arriba del número.
  form.prepend(header);
  const vatLabel = document.createElement("label");
  vatLabel.innerHTML = `IVA <select name="vatRate"><option value="10.5">10,5 %</option><option value="21">21 %</option><option value="27">27 %</option><option value="0">Exento</option></select>`;
  line.querySelector(".remove-deposit-line")?.before(vatLabel);
  line.querySelector('[name="unitCost"]')?.closest("label")?.firstChild && (line.querySelector('[name="unitCost"]').closest("label").firstChild.textContent = "Precio neto u. ");
  const footer = document.createElement("div");
  footer.className = "voucher-footer";
  footer.innerHTML = `
    <label>Percepción IVA <input name="perceptionVat" type="text" inputmode="decimal" placeholder="0" /></label>
    <label>Percepción IIBB <input name="perceptionIibb" type="text" inputmode="decimal" placeholder="0" /></label>
    <label>Otros cargos <input name="otherCharges" type="text" inputmode="decimal" placeholder="0" /></label>
    <div id="voucherTotals" class="voucher-totals"></div>`;
  linesWrap.after(footer);
  let partnerList = document.querySelector("#partnerCatalogList");
  if (!partnerList) {
    partnerList = document.createElement("datalist");
    partnerList.id = "partnerCatalogList";
    partnerList.innerHTML = `<option value="Muller"></option>`;
    document.body.appendChild(partnerList);
  }
  const fxLabel = header.querySelector(".voucher-fx");
  form.elements.currency.addEventListener("change", () => { const input = fxLabel.querySelector("input"); input.placeholder = form.elements.currency.value === "ARS" ? "Obligatorio en pesos" : "El que figura en la factura"; updateVoucherTotals(); });
  form.elements.voucherType.addEventListener("change", () => {
    const label = form.elements.receiptNumber.closest("label");
    if (label?.firstChild) label.firstChild.textContent = form.elements.voucherType.value === "Remito" ? "Nro. de remito " : "Nro. de factura ";
  });
  form.addEventListener("input", (event) => {
    if (event.target.name === "type") { const vat = event.target.closest(".deposit-product-line")?.querySelector('[name="vatRate"]'); if (vat) vat.value = defaultVatRate(event.target.value); }
    updateVoucherTotals();
  });
  form.addEventListener("change", updateVoucherTotals);
  line.querySelector('[name="vatRate"]').value = defaultVatRate(line.querySelector('[name="type"]')?.value);
}

function voucherTotalsFromForm(form) {
  const lines = depositProductLines().map(depositLineValues).filter((item) => item.name);
  const net = lines.reduce((sum, item) => sum + parseDecimal(item.quantity) * parseDecimal(item.unitCost), 0);
  const vat = lines.reduce((sum, item) => sum + parseDecimal(item.quantity) * parseDecimal(item.unitCost) * parseDecimal(item.vatRate) / 100, 0);
  const perceptionVat = parseDecimal(form.elements.perceptionVat?.value);
  const perceptionIibb = parseDecimal(form.elements.perceptionIibb?.value);
  const otherCharges = parseDecimal(form.elements.otherCharges?.value);
  const round = (value) => Math.round(value * 100) / 100;
  return { lines, net: round(net), vat: round(vat), perceptionVat: round(perceptionVat), perceptionIibb: round(perceptionIibb), otherCharges: round(otherCharges), total: round(net + vat + perceptionVat + perceptionIibb + otherCharges) };
}

function updateVoucherTotals() {
  const form = document.querySelector("#productForm");
  const box = document.querySelector("#voucherTotals");
  if (!form || !box) return;
  if (editingProductId) { box.textContent = ""; return; }
  const totals = voucherTotalsFromForm(form);
  const currency = form.elements.currency?.value === "ARS" ? "$" : "US$";
  const fmt = (value) => `${currency} ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  box.innerHTML = `Neto <strong>${fmt(totals.net)}</strong> · IVA <strong>${fmt(totals.vat)}</strong> · Percepciones y otros <strong>${fmt(totals.perceptionVat + totals.perceptionIibb + totals.otherCharges)}</strong> · Total <strong>${fmt(totals.total)}</strong>`;
}

function ensureFilterClearButton(container, id, label, onClear) {
  const target = typeof container === "string" ? document.querySelector(container) : container;
  if (!target || document.querySelector(`#${id}`)) return;
  const button = document.createElement("button");
  button.className = "link-button filter-clear-button";
  button.id = id;
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClear);
  target.appendChild(button);
}

function ensureInlineClear(input, onClear) {
  if (!input || input.dataset.hasClearButton) return;
  input.dataset.hasClearButton = "true";
  const button = document.createElement("button");
  button.className = "field-clear-button";
  button.type = "button";
  button.textContent = "×";
  button.title = "Borrar filtro";
  button.setAttribute("aria-label", "Borrar filtro");
  button.addEventListener("click", () => {
    input.value = "";
    onClear?.();
    input.focus();
  });
  input.insertAdjacentElement("afterend", button);
}

function clearDepositFilters() {
  ["#productNameFilter", "#productReceiptFilter", "#productReceiptDateFrom", "#productReceiptDateTo"].forEach((selector) => {
    const input = document.querySelector(selector);
    if (input) input.value = "";
  });
  const sort = document.querySelector("#productReceiptDateSort");
  if (sort) sort.value = "desc";
  renderProducts();
}

function clearOrderFilters() {
  orderFilter = "Todas";
  orderProductFilter = "Todos";
  orderProductTextFilter = "";
  orderCropFilter = "Todos";
  orderLotFilter = "Todos";
  orderContractorFilter = "Todos";
  const status = document.querySelector("#orderStatusFilter");
  const crop = document.querySelector("#orderCropFilter");
  const lot = document.querySelector("#orderLotFilter");
  const product = document.querySelector("#orderProductFilter");
  const contractor = document.querySelector("#orderContractorFilter");
  const productSearch = document.querySelector("#orderProductSearch");
  if (status) status.value = "Todas";
  if (crop) crop.value = "Todos";
  if (lot) lot.value = "Todos";
  if (product) product.value = "Todos";
  if (contractor) contractor.value = "Todos";
  if (productSearch) productSearch.value = "";
  renderOrders();
}

function clearClosureFilters() {
  closureCropFilter = "Todos";
  const filter = document.querySelector("#closureCropFilter");
  if (filter) filter.value = "Todos";
  renderClosures();
}

function clearHistoryLotFilters() {
  historyLotCropFilter = "Todos";
  historyLotCampaignFilter = "Todos";
  const crop = document.querySelector("#historyLotCropFilter");
  const campaign = document.querySelector("#historyLotCampaignFilter");
  if (crop) crop.value = "Todos";
  if (campaign) campaign.value = "Todos";
  renderHistoryLotDetail();
}

function clearCostCategoryFilter() {
  selectedCostCategory = "";
  const detail = document.querySelector("#costCategoryDetail");
  if (detail) detail.innerHTML = "";
  renderCosts();
  switchView("costos");
}

function initializeFilterClearTools() {
  ensureFilterClearButton(".deposit-filters", "clearDepositFilters", "Limpiar", clearDepositFilters);
  ensureFilterClearButton(".order-filters", "clearOrderFilters", "Limpiar", clearOrderFilters);
  ensureFilterClearButton(document.querySelector("#historyLotCropFilter")?.closest(".panel-actions"), "clearHistoryLotFilters", "Limpiar", clearHistoryLotFilters);
  ensureFilterClearButton(document.querySelector("#closureCropFilter")?.closest(".panel-header"), "clearClosureFilters", "Limpiar", clearClosureFilters);
  ensureFilterClearButton(document.querySelector("#costCategoryDetail")?.closest(".panel")?.querySelector(".panel-header"), "clearCostCategoryFilter", "Limpiar filtro", clearCostCategoryFilter);
}

async function handleDepositProductSubmit(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  const form = event.currentTarget;
  const shared = formData(form);
  const lines = depositProductLines().map(depositLineValues).filter((line) => line.name);
  if (!lines.length) {
    showToast("Agregá al menos un producto");
    return;
  }
  if (!editingProductId && !String(shared.receiptNumber || "").trim()) {
    showToast("Indicá el número de remito o factura");
    return;
  }
  if (!editingProductId && !shared.receiptDate) {
    showToast("Indicá la fecha de compra o del remito");
    return;
  }

  const receiptPhotoFile = form.elements.receiptPhotoFile?.files?.[0];
  const receiptPhoto = receiptPhotoFile ? await readImageAsDataUrl(receiptPhotoFile, 960, 36000) : "";
  const receiptPhotoFull = receiptPhotoFile ? await readImageAsDataUrl(receiptPhotoFile, 1600, 3000000) : "";
  if (receiptPhotoFile && !receiptPhoto) {
    showToast("No se pudo procesar la foto del remito. Probá elegirla nuevamente.");
    return;
  }
  const wasEditing = Boolean(editingProductId);
  const changed = [];
  const currency = shared.currency === "ARS" ? "ARS" : "USD";
  const fxRate = parseDecimal(shared.fxRate);
  if (!editingProductId && currency === "ARS" && !(fxRate > 0)) {
    showToast("Indicá el tipo de cambio para pasar el precio a dólares");
    return;
  }
  const toUsd = (value) => currency === "ARS" ? parseDecimal(value) / fxRate : parseDecimal(value);
  if (!editingProductId) {
    const duplicates = possibleDuplicatePurchases(lines, shared, toUsd);
    if (duplicates.length && !window.confirm(`Posible compra repetida:\n\n${duplicates.join("\n")}\n\n¿Es otra compra distinta y querés guardarla igual?`)) return;
  }
  const voucher = editingProductId ? null : (() => {
    const totals = voucherTotalsFromForm(form);
    return parseVoucherRecord({
      id: uid("cmp"), type: shared.voucherType || "Factura A", number: String(shared.receiptNumber || "").trim(), date: shared.receiptDate || todayValue(), dueDate: shared.dueDate || "",
      supplier: String(shared.supplier || "").trim(), currency, fxRate: fxRate > 0 ? fxRate : "", warehouse: shared.warehouse || "", partner: String(shared.partner || "").trim(),
      lines: [], net: totals.net, vat: totals.vat, perceptionVat: totals.perceptionVat, perceptionIibb: totals.perceptionIibb, otherCharges: totals.otherCharges, total: totals.total,
      status: shared.voucherType === "Remito" ? "Pendiente de factura" : "", remitoNumber: "", notes: ""
    });
  })();
  for (const line of lines) {
    const values = { ...line, warehouse: shared.warehouse || "" };
    const existing = editingProductId
      ? data.products.find((product) => product.id === editingProductId)
      : findDepositProductMatch(values);
    if (!editingProductId && existing && shared.receiptNumber && hasReceiptNumber(existing, shared.receiptNumber)) {
      showToast(`El remito ${shared.receiptNumber} ya está cargado para ${line.name}`);
      return;
    }
    const receiptNumbers = editingProductId
      ? receiptText(existing)
      : appendReceiptEntry(receiptText(existing), shared.receiptNumber, shared.receiptDate, line.quantity, toUsd(line.unitCost), shared.supplier, voucher?.id || "");
    const productId = existing?.id || uid("prod");
    if (voucher) voucher.lines.push({ productId, name: line.name, type: line.type, unit: line.unit, quantity: parseDecimal(line.quantity), unitPrice: parseDecimal(line.unitCost), vatRate: parseDecimal(line.vatRate || defaultVatRate(line.type)) });
    delete values.vatRate;
    const record = {
      ...(existing || {}),
      id: productId,
      ...values,
      quantity: !editingProductId && existing ? baseStock(existing) + parseDecimal(line.quantity) : parseDecimal(line.quantity),
      unitCost: editingProductId ? parseDecimal(line.unitCost) : toUsd(line.unitCost),
      receiptNumbers,
      supplier: shared.supplier || existing?.supplier || "",
      receiptPhoto: receiptPhoto || existing?.receiptPhoto || ""
    };
    delete record.calculatedStock;
    delete record.applicationUse;
    // Al corregir el "Stock físico total" de un insumo, la diferencia con las compras queda como stock inicial
    // (columna stock_inicial), que es lo que se guarda en la planilla. Antes el cambio no llegaba a la planilla.
    if (editingProductId && existing) {
      const entered = parseDecimal(line.quantity);
      if (Math.abs(entered - baseStock(existing)) > 0.0001) record.initialStock = Math.round((entered - receiptQuantityTotal(existing)) * 10000) / 10000;
    }
    if (existing) {
      const index = data.products.findIndex((product) => product.id === existing.id);
      if (index >= 0) data.products[index] = record;
      queueSync("products", record, "update");
      recalculateApplicationsForProduct(record);
    } else {
      data.products.push(record);
      queueSync("products", record);
    }
    changed.push(record);
  }

  if (voucher) {
    data.vouchers ||= [];
    data.vouchers.push(voucher);
    queueSyncVoucher(voucher);
  }
  saveData();
  if (receiptPhotoFull) await queuePhotoUploads(voucher ? "vouchers" : "products", voucher ? voucher.id : changed[0]?.id, [receiptPhotoFull]);
  editingProductId = "";
  resetForm(form);
  resetDepositProductLines();
  updateVoucherTotals();
  form.elements.receiptDate.required = true;
  form.elements.receiptDate.value = todayValue();
  if (form.elements.receiptPhotoFile) form.elements.receiptPhotoFile.value = "";
  document.querySelector("#productFormTitle").textContent = "Nuevo ingreso al depósito";
  document.querySelector("#productQuantityLabel").firstChild.textContent = "Cantidad ";
  form.querySelector('button[type="submit"]').textContent = "Guardar ingreso";
  document.querySelector("#cancelProductEdit")?.classList.remove("hidden-panel");
  document.querySelector("#productFormBand")?.classList.add("hidden-panel");
  renderAll();
  showToast(changed.length > 1 ? `${changed.length} productos cargados en el remito` : wasEditing ? "Producto y costos actualizados" : "Ingreso guardado");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

const formatDateValue = (value) => value ? dateShort(value) : "";

function queueSyncVoucher(voucher, action = "append") {
  const syncCopy = voucherForSync(voucher);
  queueSync("vouchers", syncCopy, action);
  voucher.updatedAt = syncCopy.updatedAt;
  voucher._syncStatus = syncCopy._syncStatus;
  voucher._syncId = syncCopy._syncId;
  voucher._syncAction = syncCopy._syncAction;
}

function renderVouchers() {
  const body = document.querySelector("#vouchersTable");
  if (!body) return;
  const rows = (data.vouchers || []).slice().sort((x, y) => String(y.date || "").localeCompare(String(x.date || "")));
  const money = (voucher, value) => `${voucher.currency === "ARS" ? "$" : "US$"} ${parseDecimal(value).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  body.innerHTML = rows.length ? rows.map((voucher) => `<tr>
      <td>${escapeHtml(formatDateValue(voucher.date))}</td>
      <td>${escapeHtml(voucher.type)}${voucher.remitoNumber ? `<br><span class="muted">remito ${escapeHtml(voucher.remitoNumber)}</span>` : ""}</td>
      <td>${escapeHtml(voucher.number)}</td>
      <td>${escapeHtml(voucher.supplier)}${voucher.partner ? `<br><span class="muted">Aporte de ${escapeHtml(voucher.partner)}</span>` : ""}</td>
      <td>${escapeHtml((voucher.lines || []).map((item) => `${item.name} ${item.quantity} ${item.unit}`).join(", "))}</td>
      <td>${money(voucher, voucher.net)}</td>
      <td>${money(voucher, voucher.total)}</td>
      <td>${escapeHtml(voucher.dueDate ? formatDateValue(voucher.dueDate) : "")}</td>
      <td>${voucher.type === "Remito" ? `<button class="link-button" type="button" data-convert-voucher="${escapeHtml(voucher.id)}">Convertir en factura</button><br>` : `${escapeHtml(voucher.status || "")}${voucher.status ? "<br>" : ""}`}${voucher.fxRate ? `<span class="muted">TC ${escapeHtml(String(voucher.fxRate).replace(".", ","))}</span><br>` : ""}<button class="link-button" type="button" data-edit-voucher="${escapeHtml(voucher.id)}">Corregir datos</button>${driveLinksHtml(voucher, "Foto")}</td>
    </tr>`).join("") : `<tr><td colspan="9" class="muted">Todavía no hay comprobantes cargados con el formulario nuevo.</td></tr>`;
  body.querySelectorAll("[data-convert-voucher]").forEach((button) => button.addEventListener("click", () => openVoucherConversion(button.dataset.convertVoucher)));
  body.querySelectorAll("[data-edit-voucher]").forEach((button) => button.addEventListener("click", () => openVoucherEdit(button.dataset.editVoucher)));
}

// Corrige datos del papel que no cambian el stock: número, fechas y tipo de cambio.
function openVoucherEdit(voucherId) {
  const voucher = (data.vouchers || []).find((item) => item.id === voucherId);
  const box = document.querySelector("#voucherConversion");
  if (!voucher || !box) return;
  box.innerHTML = `<h2>Corregir ${escapeHtml(voucher.type)} ${escapeHtml(voucher.number)}</h2>
    <p class="muted">Para cambiar precios o cantidades, editá el ingreso del producto. Si ya lo importaste en administración, corregí también allá.</p>
    <form id="voucherEditForm" class="form-grid">
      <label>Número <input name="number" required value="${escapeHtml(voucher.number)}" /></label>
      <label>Fecha <input name="date" type="date" required value="${escapeHtml(voucher.date || "")}" /></label>
      <label>Vencimiento <input name="dueDate" type="date" value="${escapeHtml(voucher.dueDate || "")}" /></label>
      <label>TC de la factura (pesos por US$) <input name="fxRate" inputmode="decimal" value="${escapeHtml(voucher.fxRate ? String(voucher.fxRate).replace(".", ",") : "")}" placeholder="${voucher.currency === "ARS" ? "Obligatorio en pesos" : "El que figura en la factura"}" /></label>
      <div class="form-actions"><button type="submit">Guardar</button><button type="button" class="link-button" data-cancel-voucher-edit>Cancelar</button></div>
    </form>`;
  box.classList.remove("hidden-panel");
  box.querySelector("[data-cancel-voucher-edit]").addEventListener("click", () => box.classList.add("hidden-panel"));
  box.querySelector("#voucherEditForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = formData(event.currentTarget);
    const fxRate = parseDecimal(values.fxRate);
    if (voucher.currency === "ARS" && !(fxRate > 0)) { showToast("Indicá el tipo de cambio"); return; }
    if (voucher.currency === "ARS" && Number(voucher.fxRate) !== fxRate) { showToast("En pesos el TC cambia el costo: convertilo de nuevo desde el ingreso del producto"); return; }
    Object.assign(voucher, { number: String(values.number).trim(), date: values.date, dueDate: values.dueDate || "", fxRate: fxRate > 0 ? fxRate : "" });
    queueSyncVoucher(voucher, "update");
    saveData();
    box.classList.add("hidden-panel");
    renderAll();
    showToast("Comprobante corregido");
  });
}

function ensureVouchersPanel() {
  if (document.querySelector("#vouchersTable")) return;
  const anchor = document.querySelector("#purchasesByDateTable")?.closest(".panel");
  if (!anchor) return;
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.dataset.depositPanel = "comprobantes";
  panel.innerHTML = `<div class="panel-header"><h2>Datos fiscales de los comprobantes</h2><span class="panel-note">IVA, vencimiento y tipo de cambio de los comprobantes cargados con el formulario de ingreso, para pasarlos a administración.</span></div>
    <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Número</th><th>Proveedor</th><th>Productos</th><th>Neto</th><th>Total</th><th>Vence</th><th>Estado</th></tr></thead><tbody id="vouchersTable"></tbody></table></div>
    <div id="voucherConversion" class="form-band hidden-panel"></div>`;
  anchor.before(panel);
}

// Remito → factura: cambia número, precios e IVA del comprobante y de los ingresos al depósito que generó.
function openVoucherConversion(voucherId) {
  const voucher = (data.vouchers || []).find((item) => item.id === voucherId);
  const box = document.querySelector("#voucherConversion");
  if (!voucher || !box) return;
  box.innerHTML = `<h2>Convertir remito ${escapeHtml(voucher.number)} en factura</h2>
    <form id="voucherConversionForm" class="form-grid">
      <label>Comprobante <select name="type">${VOUCHER_TYPES.filter((type) => type !== "Remito").map((type) => `<option>${type}</option>`).join("")}</select></label>
      <label>Nro. de factura <input name="number" required /></label>
      <label>Fecha de factura <input name="date" type="date" required value="${escapeHtml(todayValue())}" /></label>
      <label>Vencimiento <input name="dueDate" type="date" value="${escapeHtml(voucher.dueDate || "")}" /></label>
      <label>Moneda <select name="currency"><option value="USD"${voucher.currency !== "ARS" ? " selected" : ""}>US$</option><option value="ARS"${voucher.currency === "ARS" ? " selected" : ""}>Pesos</option></select></label>
      <label>TC de la factura <input name="fxRate" inputmode="decimal" value="${escapeHtml(voucher.fxRate || "")}" /></label>
      ${(voucher.lines || []).map((item, index) => `<div class="deposit-product-line"><label>Producto <input value="${escapeHtml(item.name)}" readonly /></label><label>Cantidad <input value="${escapeHtml(item.quantity)}" readonly /></label><label>Precio unitario neto <input name="price-${index}" inputmode="decimal" value="${escapeHtml(item.unitPrice)}" required /></label><label>IVA <select name="vat-${index}">${["10.5", "21", "27", "0"].map((rate) => `<option value="${rate}"${String(item.vatRate) === rate ? " selected" : ""}>${rate === "0" ? "Exento" : `${rate.replace(".", ",")} %`}</option>`).join("")}</select></label></div>`).join("")}
      <label>Percepción IVA <input name="perceptionVat" inputmode="decimal" value="0" /></label>
      <label>Percepción IIBB <input name="perceptionIibb" inputmode="decimal" value="0" /></label>
      <label>Otros cargos <input name="otherCharges" inputmode="decimal" value="0" /></label>
      <div class="form-actions"><button type="submit">Guardar factura</button><button class="link-button" type="button" id="cancelVoucherConversion">Cancelar</button></div>
    </form>`;
  box.classList.remove("hidden-panel");
  box.scrollIntoView({ behavior: "smooth", block: "start" });
  box.querySelector("#cancelVoucherConversion").addEventListener("click", () => box.classList.add("hidden-panel"));
  box.querySelector("#voucherConversionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = formData(event.currentTarget);
    const currency = values.currency === "ARS" ? "ARS" : "USD";
    const fxRate = parseDecimal(values.fxRate);
    if (currency === "ARS" && !(fxRate > 0)) { showToast("Indicá el tipo de cambio"); return; }
    const toUsd = (value) => currency === "ARS" ? parseDecimal(value) / fxRate : parseDecimal(value);
    const lines = voucher.lines.map((item, index) => ({ ...item, unitPrice: parseDecimal(values[`price-${index}`]), vatRate: parseDecimal(values[`vat-${index}`]) }));
    const round = (value) => Math.round(value * 100) / 100;
    const net = round(lines.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
    const vat = round(lines.reduce((sum, item) => sum + item.quantity * item.unitPrice * item.vatRate / 100, 0));
    const perceptionVat = parseDecimal(values.perceptionVat);
    const perceptionIibb = parseDecimal(values.perceptionIibb);
    const otherCharges = parseDecimal(values.otherCharges);
    const remitoNumber = voucher.number;
    Object.assign(voucher, { type: values.type, number: String(values.number).trim(), date: values.date, dueDate: values.dueDate || voucher.dueDate || "", currency, fxRate: fxRate > 0 ? fxRate : "", lines, net, vat, perceptionVat, perceptionIibb, otherCharges, total: round(net + vat + perceptionVat + perceptionIibb + otherCharges), status: "Facturado", remitoNumber });
    // Los ingresos al depósito del remito pasan a tener el número y el precio de la factura.
    data.products.forEach((product) => {
      const entries = receiptEntriesForProduct(product);
      let touched = false;
      entries.forEach((entry) => {
        if (entry.voucherId !== voucher.id) return;
        const line = lines.find((item) => item.productId === product.id) || lines.find((item) => normalizeName(item.name) === normalizeName(product.name));
        entry.number = voucher.number;
        if (line) entry.unitCost = toUsd(line.unitPrice);
        touched = true;
      });
      if (!touched) return;
      product.receiptNumbers = serializeReceiptEntries(entries);
      queueSync("products", product, "update");
      recalculateApplicationsForProduct(product);
    });
    queueSyncVoucher(voucher, "update");
    saveData();
    box.classList.add("hidden-panel");
    renderAll();
    showToast(`Remito ${remitoNumber} convertido en factura ${voucher.number}`);
  });
}

function displayLotName(lot) {
  if (!lot) return "Sin lote";
  const name = String(lot.name || "").trim();
  const farm = normalizeName(lot.farm);
  if (!name) return "Sin lote";
  if (farm.includes("san luis") && farm.includes("isletas") && !normalizeName(name).startsWith("isletas")) {
    return name.replace(/^lote\s+/i, "Isletas ");
  }
  if (farm.includes("don cristobal") && !normalizeName(name).startsWith("don cristobal")) {
    return name.replace(/^lote\s+/i, "Don Cristobal ");
  }
  if (farm.includes("san agustin") && !normalizeName(name).startsWith("san agustin")) {
    return name.replace(/^lote\s+/i, "San Agustin ");
  }
  return name;
}

function lotName(id) {
  return displayLotName(findLot({ lotId: id }));
}

function findLot(record) {
  const lotId = record?.lotId || record?.id_lote || "";
  const lotNameValue = record?.lotName || record?.lote || "";
  const normalizedId = normalizeName(lotId);
  const normalizedName = normalizeName(lotNameValue);
  return data.lots.find((lot) => lot.id === lotId)
    || data.lots.find((lot) => normalizeName(lot.id) === normalizedId)
    || data.lots.find((lot) => normalizedName && normalizeName(lot.name) === normalizedName)
    || data.lots.find((lot) => normalizedName && normalizeName(displayLotName(lot)) === normalizedName)
    || data.lots.find((lot) => normalizedId && normalizeName(lot.name) === normalizedId)
    || data.lots.find((lot) => normalizedId && normalizeName(displayLotName(lot)) === normalizedId);
}

function sameLot(record, lot) {
  return findLot(record)?.id === lot.id;
}

function normalizeCampaignValue(value) {
  const text = String(value || "").trim();
  const compact = text.match(/^(\d{4})[/-](\d{2})$/);
  if (compact) return `${compact[1]}/${compact[2]}`;
  const sheetDate = text.match(/^(\d{4})-(\d{2})-01$/);
  if (sheetDate) return `${sheetDate[1]}/${sheetDate[2]}`;
  return text;
}

function normalizeCampaignRecords(dataset) {
  ["lots", "orders", "applications", "closures"].forEach((table) => {
    (dataset?.[table] || []).forEach((record) => {
      if (record.campaign) record.campaign = normalizeCampaignValue(record.campaign);
    });
  });
  const lots = dataset?.lots || [];
  const closures = dataset?.closures || [];
  const findDatasetLot = (record) => lots.find((lot) => lot.id === record?.lotId)
    || lots.find((lot) => normalizeName(lot.name) === normalizeName(record?.lotName || record?.lote || record?.lotId));
  lots.forEach((lot) => {
    const latest = closures
      .filter((closure) => closure.lotId === lot.id || normalizeName(closure.lotName) === normalizeName(lot.name))
      .sort((a, b) => parseInt(normalizeCampaignValue(b.campaign), 10) - parseInt(normalizeCampaignValue(a.campaign), 10))[0];
    if (!lot.campaign && latest?.campaign) lot.campaign = normalizeCampaignValue(latest.campaign);
    if (!lot.crop && latest?.crop) lot.crop = latest.crop;
    if (!lot.variety && latest?.variety) lot.variety = latest.variety;
  });
  (dataset?.orders || []).forEach((order) => {
    if (!order.campaign) order.campaign = normalizeCampaignValue(findDatasetLot(order)?.campaign);
  });
  (dataset?.applications || []).forEach((application) => {
    const order = (dataset?.orders || []).find((item) => item.id === application.orderId);
    if (!application.campaign) {
      application.campaign = normalizeCampaignValue(order?.campaign || findDatasetLot(application)?.campaign);
    }
  });
}

// Campaña activa = la que tienen la mayoría de las hectáreas. Antes era la más nueva de cualquier lote: con pasar un
// solo lote a la campaña siguiente, toda la app (costos, panel) saltaba a esa campaña.
function activeCampaignValue() {
  const hectaresByCampaign = new Map();
  data.lots.forEach((lot) => {
    const campaign = normalizeCampaignValue(lot.campaign);
    if (!campaign) return;
    hectaresByCampaign.set(campaign, (hectaresByCampaign.get(campaign) || 0) + (parseDecimal(lot.hectares) || 1));
  });
  return [...hectaresByCampaign.entries()]
    .sort((a, b) => (b[1] - a[1]) || (parseInt(b[0], 10) - parseInt(a[0], 10)))[0]?.[0] || "";
}

function applyActiveCampaignDefaults() {
  const campaign = activeCampaignValue();
  const label = document.querySelector("#activeCampaignLabel");
  if (label) label.textContent = campaign || "Sin campaña";
  ["#lotForm", "#closureForm"].forEach((selector) => {
    const input = document.querySelector(`${selector} [name="campaign"]`);
    if (input && !input.value) input.value = campaign;
  });
}

function recordMatchesCampaign(record, lot, campaign) {
  const target = normalizeCampaignValue(campaign);
  if (!target) return true;
  const linkedOrder = record?.orderId ? orderById(record.orderId) : null;
  const explicit = normalizeCampaignValue(record?.campaign || linkedOrder?.campaign);
  if (explicit) return explicit === target;
  return normalizeCampaignValue(lot?.campaign) === target;
}

function lotForPolygon(polygon) {
  return data.lots.find((lot) => lot.id === polygon.lotId)
    || data.lots.find((lot) => normalizeName(lot.name) === normalizeName(polygon.name))
    || data.lots.find((lot) => normalizeName(displayLotName(lot)) === normalizeName(polygon.name));
}

function polygonForLot(lot) {
  if (!lot) return null;
  return (data.mapPolygons || []).find((polygon) => lotForPolygon(polygon)?.id === lot.id) || null;
}

function productName(id) {
  return derivedData().productsById.get(id)?.name || "Sin producto";
}

function productType(id) {
  return derivedData().productsById.get(id)?.type || "Otros";
}

function orderById(id) {
  return data.orders.find((order) => order.id === id);
}

function orderShortLabel(orderOrId) {
  const order = typeof orderOrId === "string" ? orderById(orderOrId) : orderOrId;
  if (!order) return "OT-?";
  const readable = String(order.id || "").match(/^ORD-\d+$/i);
  if (readable) return order.id.toUpperCase();
  const index = data.orders.findIndex((item) => item.id === order.id);
  return `OT-${String(index + 1 || 1).padStart(3, "0")}`;
}

function productMatchesApplication(product, application) {
  const { ids: groupIds, names: groupNames } = productGroupMeta(product);
  if (application.productId && groupIds.has(application.productId)) return true;
  const applicationNames = [
    application.productName,
    productName(application.productId)
  ].map(normalizeName).filter(Boolean);
  return applicationNames.some((name) => groupNames.has(name));
}

// Stock inicial: columna stock_inicial de la planilla (existencia antes de empezar a cargar compras en la app).
function initialStock(product) {
  const value = product?.initialStock;
  return value === undefined || value === null || value === "" ? 0 : parseDecimal(value);
}

function baseStock(product) {
  const detailedReceiptTotal = receiptQuantityTotal(product);
  if (receiptEntriesForProduct(product).some((entry) => entry.detailed)) {
    return initialStock(product) + detailedReceiptTotal;
  }
  if (product?.initialStock !== undefined && product?.initialStock !== null && product?.initialStock !== "") {
    return initialStock(product);
  }
  if (product?.quantity !== undefined && product?.quantity !== null && product?.quantity !== "") {
    return parseDecimal(product.quantity);
  }
  if (product?.calculatedStock !== undefined && product?.calculatedStock !== null && product?.calculatedStock !== "") {
    return parseDecimal(product.calculatedStock);
  }
  return detailedReceiptTotal;
}

function applicationQuantity(application) {
  const explicit = parseDecimal(application.usedQuantity ?? application.quantity ?? application.cantidad);
  if (explicit) return explicit;
  return parseDecimal(application.dose) * parseDecimal(application.hectares);
}

function uniqueApplicationRows(rows = data.applications) {
  const unique = new Map();
  rows.forEach((row) => {
    const key = applicationKey(row);
    const existing = unique.get(key);
    if (!existing || row._syncStatus === "pending" || row._syncStatus === "delete-pending") {
      unique.set(key, row);
    }
  });
  return Array.from(unique.values());
}

function cleanStockValue(value) {
  return Math.abs(value) < 0.005 ? 0 : value;
}

function stockForProduct(product) {
  const cache = derivedData();
  const cacheKey = productStockKey(product) || product?.id || "";
  if (cache.stock.has(cacheKey)) return { ...cache.stock.get(cacheKey) };
  const result = computeStockForProduct(product);
  cache.stock.set(cacheKey, result);
  return { ...result };
}

function computeStockForProduct(product) {
  const base = productGroupProducts(product).reduce((sum, item) => sum + baseStock(item), 0);
  const movements = applicationsForProductGroup(product);
  const totals = movements.reduce((acc, application) => {
    const order = orderById(application.orderId);
    const quantity = applicationQuantity(application);
    if (order?.status === "Finalizada" || (!order && application.id)) {
      acc.consumed += quantity;
    } else if (order?.status === "Cancelada") {
      acc.cancelled += quantity;
    } else {
      acc.reserved += quantity;
    }
    return acc;
  }, { consumed: 0, reserved: 0, cancelled: 0 });

  return {
    physical: cleanStockValue(base - totals.consumed),
    reserved: cleanStockValue(totals.reserved),
    available: cleanStockValue(base - totals.consumed - totals.reserved),
    consumed: totals.consumed
  };
}

function applicationKey(row) {
  return [row.id, row.productId || row.productName || "", row.orderId || "", row.date || ""].map((value) => encodeURIComponent(String(value))).join("|");
}

function findApplicationByKey(key) {
  return data.applications.find((row) => applicationKey(row) === key);
}

function byRecentDate(a, b) {
  return String(b.date || "").localeCompare(String(a.date || ""));
}

function byOrderPriority(a, b) {
  const rank = { Pendiente: 0, "En curso": 1 };
  const statusDiff = (rank[a.status] ?? 2) - (rank[b.status] ?? 2);
  return statusDiff || byRecentDate(a, b);
}

function statusBadge(status) {
  const cls = status === "Finalizada" ? "done" : status === "Cancelada" ? "bad" : status === "En curso" ? "warn" : "";
  return `<span class="badge ${cls}">${status}</span>`;
}

function orderNeedsApplication(order) {
  const task = normalizeName(order.task);
  return ["pulver", "fertiliz", "siembra", "resiembra", "inocul", "curasemilla"].some((token) => task.includes(token));
}

let toastTimer = 0;
function showToast(message, durationMs) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  // Los errores ("No se pudo…") quedan 7 segundos; el resto, 2.
  const duration = durationMs || (/^no se pudo|error|tardó/i.test(String(message)) ? 7000 : 2000);
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), duration);
}

// Resultado de la última sincronización: queda fijo en el panel hasta que una salga bien.
const syncLastResultKey = "gestion-agro-sync-ultimo-resultado";
let syncLastResult = (() => {
  try { return JSON.parse(safeStorageGet(syncLastResultKey) || "null"); } catch { return null; }
})();

function setSyncLastResult(ok, message) {
  syncLastResult = { ok, message: String(message || ""), at: new Date().toISOString() };
  safeStorageSet(syncLastResultKey, JSON.stringify(syncLastResult));
}

function todayValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function lotHectares(lotId) {
  return Number(data.lots.find((lot) => lot.id === lotId)?.hectares || 0);
}

// ===== Cultivo actual del lote según la rotación y los cierres =====
// Un lote puede tener varios cultivos en la misma campaña (Trigo / Soja 2da). Cuando el cultivo del lote tiene
// cierre con kilos cosechados, deja de ser el actual y pasa a serlo el siguiente cultivo de la rotación que todavía
// no se cosechó (de esa campaña o de una posterior). Así las órdenes nuevas toman el cultivo nuevo y sus costos no
// se suman al cultivo ya cerrado.
function closureHarvested(closure) {
  return parseDecimal(closure?.kgHarvested) > 0;
}

function campaignStartYear(campaign) {
  return parseInt(normalizeCampaignValue(campaign), 10) || 0;
}

function nextCampaignValue(campaign) {
  const start = campaignStartYear(campaign);
  return start ? `${start + 1}/${String(start + 2).slice(-2)}` : "";
}

// Orden dentro de la campaña: primero lo cosechado, después lo que sigue; los "2da" van detrás del cultivo de invierno.
function cropSequenceRank(crop) {
  return /2da|2do|segunda|2°|2º/.test(normalizeName(crop)) ? 2 : 1;
}

function lotRotationSequence(lot, campaign) {
  const target = normalizeCampaignValue(campaign);
  if (!lot || !target) return [];
  return data.closures
    .filter((closure) => sameLot(closure, lot) && normalizeCampaignValue(closure.campaign) === target && closure.crop)
    .sort((a, b) => (Number(closureHarvested(b)) - Number(closureHarvested(a))) || (cropSequenceRank(a.crop) - cropSequenceRank(b.crop)));
}

function currentLotCropInfo(lot) {
  if (!lot) return { crop: "", variety: "", campaign: "", harvested: false, moved: false };
  const campaign = normalizeCampaignValue(lot.campaign);
  const crop = canonicalCropName(lot.crop);
  const sequence = lotRotationSequence(lot, campaign);
  const own = crop ? sequence.find((closure) => canonicalCropName(closure.crop) === crop) : null;
  if (crop && !(own && closureHarvested(own))) {
    return { crop: lot.crop, variety: lot.variety || own?.variety || "", campaign, harvested: false, moved: false };
  }
  // El cultivo del lote ya se cosechó (o el lote no tiene cultivo): siguiente cultivo sin cosechar en la rotación.
  const campaigns = [...new Set(data.closures.filter((closure) => sameLot(closure, lot)).map((closure) => normalizeCampaignValue(closure.campaign)))]
    .filter((value) => value && campaignStartYear(value) >= campaignStartYear(campaign))
    .sort((a, b) => campaignStartYear(a) - campaignStartYear(b));
  for (const value of campaigns) {
    const open = lotRotationSequence(lot, value).find((closure) => !closureHarvested(closure));
    if (!open) continue;
    const openCrop = canonicalCropName(open.crop);
    // Mismo cultivo y misma campaña que ya tiene el lote (p. ej. un "Trigo" repetido sin cosechar): no hay nada que
    // mover. Antes esto encolaba el lote en cada sincronización y la cola nunca terminaba.
    const same = openCrop === crop && value === campaign;
    return { crop: openCrop, variety: open.variety || "", campaign: value, harvested: false, moved: !same, previousCrop: lot.crop || "" };
  }
  return { crop: crop ? "" : (lot.crop || ""), variety: crop ? "" : (lot.variety || ""), campaign, harvested: Boolean(crop), moved: false, lastCrop: lot.crop || "" };
}

function lotCrop(lotId) {
  return currentLotCropInfo(data.lots.find((item) => item.id === lotId)).crop || "";
}

function lotVariety(lotId) {
  return currentLotCropInfo(data.lots.find((item) => item.id === lotId)).variety || "";
}

// Guarda en el lote el cambio de cultivo cuando el anterior ya se cosechó y la rotación tiene el siguiente.
function syncLotsWithRotation() {
  let changed = 0;
  data.lots.forEach((lot) => {
    const info = currentLotCropInfo(lot);
    if (!info.moved) return;
    // Mismo cultivo y campaña: no se toca (la variedad sola no alcanza; la app a veces la completa en memoria).
    const unchanged = canonicalCropName(lot.crop) === info.crop
      && normalizeCampaignValue(lot.campaign) === info.campaign;
    if (unchanged) return;
    if (canonicalCropName(info.previousCrop) !== info.crop) lot.previousCrop = info.previousCrop || lot.previousCrop || "";
    lot.crop = info.crop;
    lot.variety = info.variety || "";
    lot.campaign = info.campaign;
    queueSync("lots", lot, "update", { auto: true });
    changed += 1;
  });
  return changed;
}

// Cultivo al que se imputa cada costo: el de la orden; si la orden no lo tiene (barbechos viejos), el primer
// cultivo de la campaña (el barbecho de abril es del trigo, no de la soja de 2da).
function firstCampaignCrop(lot, campaign) {
  return canonicalCropName(lotRotationSequence(lot, campaign)[0]?.crop || lot?.crop || "");
}

function orderCostCrop(order, lot, campaign) {
  return canonicalCropName(order?.crop) || firstCampaignCrop(lot, campaign);
}

function applicationCostCrop(application, lot, campaign) {
  const order = orderById(application?.orderId);
  return order ? orderCostCrop(order, lot, campaign) : (canonicalCropName(application?.crop) || firstCampaignCrop(lot, campaign));
}

function applyLotDefaultCrop(form, force = false) {
  if (!form?.elements?.crop || !form.elements.lotId) return;
  const crop = lotCrop(form.elements.lotId.value);
  const lastDefault = form.dataset.defaultCrop || "";
  const canReplace = force || !form.elements.crop.value || form.elements.crop.value === lastDefault;
  if (crop && canReplace) {
    form.elements.crop.value = crop;
    form.dataset.defaultCrop = crop;
  }
}

function applyLotDefaultVariety(form, force = false) {
  if (!form?.elements?.variety || !form.elements.lotId) return;
  const variety = lotVariety(form.elements.lotId.value);
  const lastDefault = form.dataset.defaultVariety || "";
  const canReplace = force || !form.elements.variety.value || form.elements.variety.value === lastDefault;
  if (variety && canReplace) {
    form.elements.variety.value = variety;
    form.dataset.defaultVariety = variety;
  }
}

function applyClosureDefaults(form, force = false) {
  if (!form) return;
  const lot = data.lots.find((item) => item.id === form.elements.lotId?.value);
  if (!lot) return;
  if (form.elements.hectares && (force || !form.elements.hectares.value)) form.elements.hectares.value = lot.hectares || "";
  const info = currentLotCropInfo(lot);
  if (form.elements.crop && (force || !form.elements.crop.value)) form.elements.crop.value = info.crop || lot.crop || "";
  if (form.elements.variety && (force || !form.elements.variety.value)) form.elements.variety.value = info.variety || lot.variety || "";
  if (form.elements.campaign && info.campaign && (force || !form.elements.campaign.value)) form.elements.campaign.value = info.campaign;
}

function applyOrderLotDefaultHectares(force = false) {
  const form = document.querySelector("#orderForm");
  if (!form) return;
  const input = form.elements.plannedHectares;
  const hectares = lotHectares(form.elements.lotId.value);
  const lastDefault = form.dataset.defaultHectares || "";
  const canReplace = force || !input.value || input.value === lastDefault;
  if (hectares && canReplace) {
    input.value = hectares.toFixed(2);
    form.dataset.defaultHectares = input.value;
  }
}

function fillSelects() {
  document.querySelectorAll('select[name="lotId"]').forEach((select) => {
    const selected = select.value;
    select.innerHTML = data.lots.map((lot) => `<option value="${lot.id}">${displayLotName(lot)} - ${lot.farm}</option>`).join("");
    if (selected) select.value = selected;
  });

  document.querySelectorAll('select[name="productId"]').forEach((select) => {
    const selected = select.value;
    select.innerHTML = [
      ...[...data.products].sort(compareProductsByName).map((product) => `<option value="${product.id}">${product.name} (${product.unit})</option>`),
      `<option value="__manual__">Producto no cargado</option>`
    ].join("");
    if (selected) select.value = selected;
  });

  fillOptionSelect('select[name="taskPreset"]', taskOptions(), "Elegir tarea");
  fillOptionSelect('select[name="ownerPreset"]', contractorOptions(), "Elegir contratista");
  const taskList = document.querySelector("#taskList");
  if (taskList) taskList.innerHTML = taskOptions().map((task) => `<option value="${task}"></option>`).join("");
}

function fillOptionSelect(selector, options, placeholder) {
  document.querySelectorAll(selector).forEach((select) => {
    const selected = select.value;
    select.innerHTML = [`<option value="">${placeholder}</option>`, ...options.map((option) => `<option value="${option}">${option}</option>`)].join("");
    if (selected && options.includes(selected)) select.value = selected;
  });
}

function toggleManualProductInput(form = document.querySelector("#applicationForm")) {
  if (!form?.elements?.productId) return;
  const manual = form.elements.productId.value === "__manual__";
  form.querySelectorAll(".manual-product").forEach((field) => field.classList.toggle("hidden-panel", !manual));
  if (form.elements.manualProductName) form.elements.manualProductName.required = manual;
  if (form.elements.manualProductUnit) form.elements.manualProductUnit.required = manual;
}

function getOrCreateManualProduct(name, unit = "", lotId = "") {
  const cleanName = String(name || "").trim();
  const cleanUnit = String(unit || "").trim();
  if (!cleanName) return null;
  const existing = data.products.find((product) =>
    normalizeName(product.name) === normalizeName(cleanName)
    && (!cleanUnit || normalizeUnitKey(product.unit) === normalizeUnitKey(cleanUnit))
  );
  if (existing) return existing;
  const lot = data.lots.find((item) => item.id === lotId);
  const product = {
    id: uid("prod"),
    name: cleanName,
    type: "Sin clasificar",
    unit: cleanUnit || "unidad",
    quantity: 0,
    unitCost: 0,
    warehouse: lot?.farm || "",
    status: "Pendiente de compra"
  };
  data.products.push(product);
  queueSync("products", product);
  return product;
}

function readImageAsDataUrl(file, maxSize = 720, maxCharacters = 24000) {
  if (!file || !file.type?.startsWith("image/")) return Promise.resolve("");
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => resolve("");
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        let width = Math.max(1, Math.round(image.width * scale));
        let height = Math.max(1, Math.round(image.height * scale));
        let quality = 0.68;
        const canvas = document.createElement("canvas");
        let dataUrl = "";
        for (let attempt = 0; attempt < 10; attempt += 1) {
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          if (dataUrl.length <= maxCharacters) break;
          if (quality > 0.38) quality -= 0.1;
          else {
            const minWidth = maxCharacters < 14000 ? 140 : 280;
            const minHeight = maxCharacters < 14000 ? 105 : 210;
            width = Math.max(minWidth, Math.round(width * 0.78));
            height = Math.max(minHeight, Math.round(height * 0.78));
            quality = 0.58;
          }
        }
        resolve(dataUrl.length <= maxCharacters ? dataUrl : "");
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function monitorPhotoSource(photo) {
  return monitorPhotoSources(photo)[0] || "";
}

function monitorPhotoSources(photo) {
  if (!photo) return [];
  if (Array.isArray(photo)) return photo.filter((value) => isPhotoSource(value));
  const value = String(photo || "").trim();
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item) => isPhotoSource(item));
  } catch (error) {
    // Los monitoreos anteriores guardaban una sola foto como texto.
  }
  return value.split(/\n+/).map((item) => item.trim()).filter((item) => isPhotoSource(item));
}

function isPhotoSource(value) {
  const text = String(value || "");
  return text.startsWith("data:image/") || /^https?:\/\//i.test(text);
}

function serializeMonitorPhotos(photos) {
  const clean = photos.filter((item) => isPhotoSource(item)).slice(0, 4);
  return clean.length ? JSON.stringify(clean) : "";
}

function renderMonitorPhotoThumbs(photo, className = "monitor-photo-preview-list") {
  const photos = monitorPhotoSources(photo);
  return photos.length
    ? `<div class="${className}">${photos.map((src, index) => `<img class="monitor-photo-thumb" src="${src}" alt="Foto ${index + 1} de monitoreo" loading="lazy" />`).join("")}</div>`
    : "";
}

function updateMonitorPhotoPreview(photos = []) {
  const target = document.querySelector("#monitorPhotoPreview");
  if (!target) return;
  target.innerHTML = photos.length
    ? photos.map((src, index) => `
      <button class="monitor-photo-preview-item" type="button" data-remove-monitor-photo="${index}" title="Quitar foto">
        <img class="monitor-photo-thumb" src="${src}" alt="Foto ${index + 1} seleccionada" loading="lazy" />
        <span aria-hidden="true">x</span>
      </button>
    `).join("")
    : "";
  target.querySelectorAll("[data-remove-monitor-photo]").forEach((button) => {
    button.addEventListener("click", () => {
      monitorPhotoDraft.splice(Number(button.dataset.removeMonitorPhoto), 1);
      updateMonitorPhotoPreview(monitorPhotoDraft);
    });
  });
}

async function readMonitorPhotos(input) {
  const files = Array.from(input?.files || []).filter((file) => file.type?.startsWith("image/")).slice(0, 4);
  if (!files.length) return [];
  const photos = [];
  let skipped = 0;
  for (const file of files) {
    const photo = await readImageAsDataUrl(file, 520, 11500) || await readImageAsDataUrl(file, 360, 9000);
    if (photo) {
      photos.push(photo);
      await rememberFullPhoto(file, photo);
    }
    else skipped += 1;
  }
  if (skipped) showToast(`${skipped} foto${skipped === 1 ? "" : "s"} no se pudieron procesar. Se guardan las demás.`);
  return photos;
}

function uniqueSorted(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "es"));
}

function taskOptions() {
  const defaults = [
    "Pulverización",
    "Siembra",
    "Resiembra",
    "Fertilización",
    "Disco",
    "Rastra",
    "Monitoreo",
    "Cosecha",
    "Rolado",
    "Desmalezado"
  ];
  return uniqueSorted([...defaults, ...data.orders.map((order) => order.task)]);
}

// Nombres de contratistas unificados con la app de administración: si se escribe el nombre viejo, se guarda el nuevo.
const CONTRACTOR_ALIASES = {
  "muller hermanos": "Muller Franco Ariel y Muller Emiliano Andrés S.H. (Muller Hermanos)",
  "muller franco ariel y muller emiliano andres s.h.": "Muller Franco Ariel y Muller Emiliano Andrés S.H. (Muller Hermanos)",
  "muller emiliano y muller franco sh": "Muller Franco Ariel y Muller Emiliano Andrés S.H. (Muller Hermanos)"
};

function canonicalContractorName(name) {
  const clean = String(name || "").trim();
  return CONTRACTOR_ALIASES[normalizeName(clean).replace(/\s+/g, " ")] || clean;
}

function contractorOptions() {
  return uniqueSorted(data.orders.map((order) => canonicalContractorName(order.owner)));
}

function renderDashboard() {
  renderDashboardAlerts();
}

function renderDashboardAlerts() {
  renderOperationalAlerts();
  renderPaymentAlerts();
  renderDataAlerts();
}

// Tarjeta de alerta: líneas clicables (data-dashboard-*) y como máximo 8 visibles, con "y N más".
function alertCard(title, value, lines, emptyText = "Sin alertas", tone = "") {
  const visible = lines.slice(0, 8).join("");
  const more = lines.length > 8 ? `<div class="alert-line muted">y ${lines.length - 8} más…</div>` : "";
  return `
    <article class="alert-card ${tone}">
      <span>${title}</span>
      <strong>${value}</strong>
      <div class="alert-detail">${visible ? visible + more : `<span class="muted">${emptyText}</span>`}</div>
    </article>`;
}

function bindDashboardLinks(container) {
  container.querySelectorAll("[data-dashboard-order]").forEach((item) => {
    item.addEventListener("click", () => openOrderDetail(item.dataset.dashboardOrder, "dashboard"));
  });
  container.querySelectorAll("[data-dashboard-product]").forEach((item) => {
    item.addEventListener("click", () => {
      selectedProductId = item.dataset.dashboardProduct;
      editingReceiptIndex = -1;
      renderProductDetail();
      switchView("ficha-deposito");
    });
  });
  container.querySelectorAll("[data-dashboard-voucher]").forEach((item) => {
    item.addEventListener("click", () => {
      switchView("stock");
      const target = document.querySelector("#vouchersTable");
      target?.closest(".panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  container.querySelectorAll("[data-dashboard-lot]").forEach((item) => {
    item.addEventListener("click", () => openLotDetail(item.dataset.dashboardLot));
  });
}

// Stock mínimo del insumo (columna stock_minimo). Si el mismo insumo está en varios depósitos, vale el mayor.
function productMinStock(product) {
  return productGroupProducts(product).reduce((max, item) => Math.max(max, parseDecimal(item.minStock)), 0);
}

function renderOperationalAlerts() {
  const pendingOrders = data.orders
    .filter((order) => order.status === "Pendiente" || order.status === "En curso")
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const products = displayProducts();
  const negativeStock = products
    .filter((product) => stockForProduct(product).available < 0)
    .sort((a, b) => stockForProduct(a).available - stockForProduct(b).available);
  const belowMinimum = products
    .filter((product) => {
      const minimum = productMinStock(product);
      const available = stockForProduct(product).available;
      return minimum > 0 && available >= 0 && available < minimum;
    })
    .sort((a, b) => stockForProduct(a).available / productMinStock(a) - stockForProduct(b).available / productMinStock(b));
  const staleLots = lotsWithoutRecentMonitoring(15);
  const target = document.querySelector("#dashboardOperationalAlerts");

  target.innerHTML = [
    alertCard("Órdenes pendientes", pendingOrders.length, pendingOrders.map((item) => `
      <div class="alert-line clickable-alert" data-dashboard-order="${escapeHtml(item.id)}">
        <b>${dateShort(item.date)} · ${escapeHtml(lotName(item.lotId))}</b>
        <span>${escapeHtml(item.task)} · ${number(item.plannedHectares || 0, 2)} ha · ${escapeHtml(item.owner || "-")}</span>
      </div>`), "Sin órdenes pendientes"),
    alertCard("Stock negativo", negativeStock.length, negativeStock.map((item) => `
      <div class="alert-line clickable-alert" data-dashboard-product="${escapeHtml(item.id)}">
        <b>${escapeHtml(item.name)}</b>
        <span>Disponible ${number(stockForProduct(item).available, 2)} ${escapeHtml(item.unit)} · falta cargar una compra o el stock inicial</span>
      </div>`), "Sin stock negativo", negativeStock.length ? "warn" : ""),
    alertCard("Bajo el stock mínimo", belowMinimum.length, belowMinimum.map((item) => `
      <div class="alert-line clickable-alert" data-dashboard-product="${escapeHtml(item.id)}">
        <b>${escapeHtml(item.name)}</b>
        <span>Disponible ${number(stockForProduct(item).available, 2)} de un mínimo de ${number(productMinStock(item), 2)} ${escapeHtml(item.unit)}</span>
      </div>`), products.some((item) => productMinStock(item) > 0) ? "Todo por encima del mínimo" : "Cargá el stock mínimo en la ficha de cada insumo", belowMinimum.length ? "warn" : ""),
    alertCard("Sin monitoreo 15 días", staleLots.length, staleLots.map((item) => `
      <div class="alert-line clickable-alert" data-dashboard-lot="${escapeHtml(item.lot.id)}">
        <b>${escapeHtml(displayLotName(item.lot))} · ${escapeHtml(item.lot.farm)}</b>
        <span>Último monitoreo: ${item.lastDate ? dateShort(item.lastDate) : "sin registro"} · ${number(item.lot.hectares, 2)} ha</span>
      </div>`), "Todos los lotes monitoreados")
  ].join("");
  bindDashboardLinks(target);
}

function lotsWithoutRecentMonitoring(days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return data.lots.map((lot) => {
    const monitors = data.monitors
      .filter((monitor) => monitor.lotId === lot.id && monitor.date)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const lastDate = monitors[0]?.date || "";
    const isStale = !lastDate || new Date(`${lastDate}T00:00:00`) < cutoff;
    return { lot, lastDate, isStale };
  }).filter((item) => item.isStale);
}

function voucherDaysToDue(voucher) {
  if (!voucher?.dueDate) return null;
  const due = new Date(`${String(voucher.dueDate).slice(0, 10)}T00:00:00`);
  const today = new Date(`${todayValue()}T00:00:00`);
  return Math.round((due - today) / 864e5);
}

function voucherAmountText(vouchers) {
  const totals = vouchers.reduce((acc, voucher) => {
    const currency = voucher.currency === "ARS" ? "ARS" : "USD";
    acc[currency] = (acc[currency] || 0) + parseDecimal(voucher.total);
    return acc;
  }, {});
  const format = (value) => value.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const parts = [];
  if (totals.USD) parts.push(`US$ ${format(totals.USD)}`);
  if (totals.ARS) parts.push(`$ ${format(totals.ARS)}`);
  return parts.join(" + ") || "0";
}

function voucherLine(voucher, extra) {
  const amount = `${voucher.currency === "ARS" ? "$" : "US$"} ${parseDecimal(voucher.total).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  return `
    <div class="alert-line clickable-alert" data-dashboard-voucher="${escapeHtml(voucher.id)}">
      <b>${escapeHtml(extra)} · ${escapeHtml(voucher.supplier || "-")}</b>
      <span>${escapeHtml(voucher.type || "")} ${escapeHtml(voucher.number || "")} · ${amount}${voucher.partner ? ` · aporte ${escapeHtml(voucher.partner)}` : ""}</span>
    </div>`;
}

function renderPaymentAlerts() {
  const vouchers = (data.vouchers || []).filter((voucher) => voucher.type !== "Sin comprobante");
  const withDays = vouchers.map((voucher) => ({ voucher, days: voucherDaysToDue(voucher) })).filter((item) => item.days !== null);
  const byDue = (a, b) => a.days - b.days;
  const overdue = withDays.filter((item) => item.days < 0 && item.days >= -60).sort(byDue);
  const week = withDays.filter((item) => item.days >= 0 && item.days <= 7).sort(byDue);
  const month = withDays.filter((item) => item.days > 7 && item.days <= 30).sort(byDue);
  const pendingInvoice = vouchers
    .filter((voucher) => voucher.type === "Remito" && voucher.status !== "Facturado")
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const dueText = (item) => item.days === 0 ? "Vence hoy" : item.days < 0 ? `Venció hace ${-item.days} día${item.days === -1 ? "" : "s"}` : `${dateShort(item.voucher.dueDate)} (en ${item.days} día${item.days === 1 ? "" : "s"})`;
  const target = document.querySelector("#dashboardPaymentAlerts");
  const noVouchers = !vouchers.length ? "Todavía no hay comprobantes cargados con el formulario de ingreso" : "";

  target.innerHTML = [
    alertCard("Vencidos (últimos 60 días)", voucherAmountText(overdue.map((item) => item.voucher)), overdue.map((item) => voucherLine(item.voucher, dueText(item))), noVouchers || "Nada vencido", overdue.length ? "bad" : ""),
    alertCard("Vencen en 7 días", voucherAmountText(week.map((item) => item.voucher)), week.map((item) => voucherLine(item.voucher, dueText(item))), noVouchers || "Nada en los próximos 7 días", week.length ? "warn" : ""),
    alertCard("Vencen en 8 a 30 días", voucherAmountText(month.map((item) => item.voucher)), month.map((item) => voucherLine(item.voucher, dueText(item))), noVouchers || "Nada en el mes"),
    alertCard("Remitos sin factura", pendingInvoice.length, pendingInvoice.map((voucher) => {
      const age = Math.round((new Date(`${todayValue()}T00:00:00`) - new Date(`${String(voucher.date).slice(0, 10)}T00:00:00`)) / 864e5);
      return voucherLine(voucher, `${dateShort(voucher.date)} (hace ${age} días)`);
    }), noVouchers || "Todos los remitos tienen factura")
  ].join("");
  bindDashboardLinks(target);
}

function renderDataAlerts() {
  const target = document.querySelector("#dashboardDataAlerts");
  if (!target) return;
  const active = data.orders.filter((order) => order.status !== "Cancelada");
  const orderLine = (order, detail) => `
    <div class="alert-line clickable-alert" data-dashboard-order="${escapeHtml(order.id)}">
      <b>${dateShort(order.date)} · ${escapeHtml(lotName(order.lotId))}</b>
      <span>${escapeHtml(order.task || "-")} · ${escapeHtml(detail)}</span>
    </div>`;
  const byDateDesc = (a, b) => String(b.date || "").localeCompare(String(a.date || ""));
  const withoutLabor = active.filter((order) => !(laborCostForOrder(order) > 0)).sort(byDateDesc);
  const withoutInputs = data.orders
    .filter((order) => order.status === "Finalizada" && orderNeedsApplication(order) && !applicationsForOrder(order.id).length)
    .sort(byDateDesc);
  const withoutCompletion = data.orders.filter((order) => order.status === "Finalizada" && !order.completionDate).sort(byDateDesc);
  const usedProducts = new Set(cachedUniqueApplications().map((application) => productStockKey(applicationProduct(application) || {})));
  const withoutPrice = displayProducts().filter((product) => usedProducts.has(productStockKey(product)) && !(productDisplayUnitCost(product) > 0));

  target.innerHTML = [
    alertCard("Órdenes sin costo de labor", withoutLabor.length, withoutLabor.map((order) => orderLine(order, order.owner || "sin contratista")), "Todas tienen costo", withoutLabor.length ? "warn" : ""),
    alertCard("Finalizadas sin insumos cargados", withoutInputs.length, withoutInputs.map((order) => orderLine(order, `${number(order.plannedHectares || 0, 2)} ha`)), "Todas tienen insumos", withoutInputs.length ? "warn" : ""),
    alertCard("Finalizadas sin fecha real", withoutCompletion.length, withoutCompletion.map((order) => orderLine(order, "falta la fecha de finalización")), "Todas tienen fecha"),
    alertCard("Insumos aplicados sin precio", withoutPrice.length, withoutPrice.map((product) => `
      <div class="alert-line clickable-alert" data-dashboard-product="${escapeHtml(product.id)}">
        <b>${escapeHtml(product.name)}</b>
        <span>Sin costo unitario: sus aplicaciones suman u$s 0</span>
      </div>`), "Todos tienen precio", withoutPrice.length ? "warn" : "")
  ].join("");
  bindDashboardLinks(target);
}

function renderLots() {
  const formTitle = document.querySelector("#lotFormTitle");
  const cancelButton = document.querySelector("#cancelLotEdit");
  if (formTitle) formTitle.textContent = editingLotId ? "Editar lote" : "Nuevo lote";
  if (cancelButton) cancelButton.hidden = false;

  document.querySelector("#lotsTable").innerHTML = data.lots
    .map((lot) => {
      const outline = renderLotOutline(polygonForLot(lot));
      return `
      <tr class="clickable-row" data-lot-detail="${lot.id}">
        <td>
          <div class="lot-card-title">
            <span>${displayLotName(lot)}</span>
            ${outline ? `<div class="lot-card-outline">${outline}</div>` : ""}
          </div>
        </td>
        <td>${lot.farm}</td>
        <td>${number(lot.hectares, 2)}</td>
        <td>${lot.campaign}</td>
        <td>${lot.crop}</td>
        <td>${lot.variety || "-"}</td>
        <td>${lot.previousCrop || "-"}</td>
        <td>
          <div class="row-actions">
            <button class="link-button compact-action" data-edit-lot="${lot.id}" type="button">Editar</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("") || `<tr><td colspan="8">No hay lotes cargados.</td></tr>`;

  document.querySelectorAll("[data-lot-detail]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      openLotDetail(row.dataset.lotDetail);
    });
  });
  document.querySelectorAll("[data-edit-lot]").forEach((button) => {
    button.addEventListener("click", () => editLot(button.dataset.editLot));
  });
}

function editLot(lotId) {
  const lot = data.lots.find((item) => item.id === lotId);
  const form = document.querySelector("#lotForm");
  if (!lot || !form) return;
  editingLotId = lot.id;
  form.elements.name.value = lot.name || "";
  form.elements.farm.value = lot.farm || "";
  form.elements.hectares.value = lot.hectares || "";
  form.elements.campaign.value = lot.campaign || "";
  form.elements.crop.value = lot.crop || "";
  form.elements.variety.value = lot.variety || "";
  form.elements.previousCrop.value = lot.previousCrop || "";
  form.querySelector('button[type="submit"]').textContent = "Guardar cambios";
  document.querySelector("#lotFormBand")?.classList.remove("hidden-panel");
  renderLots();
  form.closest(".form-band")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelLotEdit() {
  const form = document.querySelector("#lotForm");
  editingLotId = "";
  form?.reset();
  if (form?.elements?.campaign) form.elements.campaign.value = "2025/26";
  if (form) form.querySelector('button[type="submit"]').textContent = "Guardar lote";
  document.querySelector("#lotFormBand")?.classList.add("hidden-panel");
  renderLots();
}

function openLotDetail(lotId) {
  orderDetailBackLotId = lotId;
  renderLotDetail(lotId, "#fullLotDetail");
  switchView("ficha-lote");
}

function renderMap(selectedPolygonId = data.mapPolygons?.[0]?.id) {
  const svg = document.querySelector("#lotMap");
  const detail = document.querySelector("#mapLotDetail");
  const polygons = data.mapPolygons || [];
  document.querySelector("#mapCount").textContent = `${polygons.length} polígonos`;

  if (!polygons.length) {
    svg.innerHTML = `<text x="450" y="280" text-anchor="middle">No hay polígonos cargados.</text>`;
    detail.innerHTML = `<div class="empty">Seleccioná un polígono del mapa para ver su información.</div>`;
    return;
  }

  const pad = 36;
  const width = 900 - pad * 2;
  const height = 560 - pad * 2;
  const allPoints = polygons.flatMap((polygon) => polygon.coordinates);
  const projectedPoints = allPoints.map(lonLatToWorld);
  const worldXs = projectedPoints.map((point) => point[0]);
  const worldYs = projectedPoints.map((point) => point[1]);
  const minWorldX = Math.min(...worldXs);
  const maxWorldX = Math.max(...worldXs);
  const minWorldY = Math.min(...worldYs);
  const maxWorldY = Math.max(...worldYs);
  const worldRangeX = maxWorldX - minWorldX || 1;
  const worldRangeY = maxWorldY - minWorldY || 1;
  const worldPadX = worldRangeX * 0.08;
  const worldPadY = worldRangeY * 0.08;
  const bounds = {
    minX: minWorldX - worldPadX,
    maxX: maxWorldX + worldPadX,
    minY: minWorldY - worldPadY,
    maxY: maxWorldY + worldPadY,
    pad,
    width,
    height
  };
  fitWorldBounds(bounds);

  const project = ([lon, lat]) => {
    const [worldX, worldY] = lonLatToWorld([lon, lat]);
    const x = pad + ((worldX - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * width;
    const y = pad + ((worldY - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * height;
    return [x, y];
  };

  const selected = polygons.find((polygon) => polygon.id === (selectedPolygonId || selectedMapPolygonId)) || polygons[0];
  selectedMapPolygonId = selected.id;
  const background = renderSatelliteBackground(bounds);
  const viewportTransform = `translate(${mapPanX.toFixed(1)} ${mapPanY.toFixed(1)}) translate(450 280) scale(${mapZoom.toFixed(3)}) translate(-450 -280)`;
  svg.innerHTML = `<g class="map-viewport" transform="${viewportTransform}">${background}${polygons.map((polygon, index) => {
    const points = polygon.coordinates.map(project);
    const pointsAttr = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const center = points.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0]).map((value) => value / points.length);
    const linkedLot = lotForPolygon(polygon);
    const classes = ["map-polygon", cropClass(linkedLot?.crop || polygon.name), polygon.id === selected.id ? "selected" : ""].join(" ");
    return `
      <g class="map-lot" data-polygon-id="${polygon.id}" tabindex="0">
        <polygon class="${classes}" points="${pointsAttr}"></polygon>
        <text x="${center[0].toFixed(1)}" y="${center[1].toFixed(1)}">${linkedLot?.name || polygon.name || `Polígono ${index + 1}`}</text>
      </g>
    `;
  }).join("")}</g>`;

  renderMapDetail(selected);

  svg.querySelectorAll(".map-lot").forEach((item) => {
    item.addEventListener("click", () => renderMap(item.dataset.polygonId));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") renderMap(item.dataset.polygonId);
    });
  });
  bindMapDrag(svg);
}

function applyMapTransform() {
  const viewport = document.querySelector(".map-viewport");
  if (!viewport) return;
  viewport.setAttribute("transform", `translate(${mapPanX.toFixed(1)} ${mapPanY.toFixed(1)}) translate(450 280) scale(${mapZoom.toFixed(3)}) translate(-450 -280)`);
}

function fitWorldBounds(bounds) {
  const worldWidth = bounds.maxX - bounds.minX || 1;
  const worldHeight = bounds.maxY - bounds.minY || 1;
  const viewportRatio = bounds.width / bounds.height;
  const worldRatio = worldWidth / worldHeight;

  if (worldRatio > viewportRatio) {
    const targetHeight = worldWidth / viewportRatio;
    const extra = (targetHeight - worldHeight) / 2;
    bounds.minY -= extra;
    bounds.maxY += extra;
  } else {
    const targetWidth = worldHeight * viewportRatio;
    const extra = (targetWidth - worldWidth) / 2;
    bounds.minX -= extra;
    bounds.maxX += extra;
  }
}

function lonLatToWorld([lon, lat]) {
  const sinLat = Math.sin((Math.max(Math.min(lat, 85.05112878), -85.05112878) * Math.PI) / 180);
  const x = (lon + 180) / 360;
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
  return [x, y];
}

function renderSatelliteBackground(bounds) {
  const maxTiles = 144;
  let selectedZoom = 13;
  let selectedTiles = [];

  for (let zoom = 17; zoom >= 8; zoom -= 1) {
    const scale = 2 ** zoom;
    const minTileX = Math.floor(bounds.minX * scale);
    const maxTileX = Math.floor(bounds.maxX * scale);
    const minTileY = Math.floor(bounds.minY * scale);
    const maxTileY = Math.floor(bounds.maxY * scale);
    const tileCount = (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);

    if (tileCount <= maxTiles || zoom === 8) {
      selectedZoom = zoom;
      selectedTiles = [];
      for (let x = minTileX; x <= maxTileX; x += 1) {
        for (let y = minTileY; y <= maxTileY; y += 1) {
          selectedTiles.push({ x, y });
        }
      }
      break;
    }
  }

  const scale = 2 ** selectedZoom;
  const rangeX = bounds.maxX - bounds.minX || 1;
  const rangeY = bounds.maxY - bounds.minY || 1;
  const tiles = selectedTiles.map((tile) => {
    const worldX = tile.x / scale;
    const worldY = tile.y / scale;
    const tileWorldSize = 1 / scale;
    const x = bounds.pad + ((worldX - bounds.minX) / rangeX) * bounds.width;
    const y = bounds.pad + ((worldY - bounds.minY) / rangeY) * bounds.height;
    const sizeX = (tileWorldSize / rangeX) * bounds.width;
    const sizeY = (tileWorldSize / rangeY) * bounds.height;
    const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${selectedZoom}/${tile.y}/${tile.x}`;
    return `<image href="${url}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${sizeX.toFixed(2)}" height="${sizeY.toFixed(2)}" preserveAspectRatio="none"></image>`;
  }).join("");

  return `
    <rect x="0" y="0" width="900" height="560" fill="#d5ddd4"></rect>
    <g class="satellite-layer">${tiles}</g>
    <rect x="0" y="0" width="900" height="560" fill="rgba(12, 34, 24, 0.08)"></rect>
    <text class="map-attribution" x="884" y="544">Esri World Imagery</text>
  `;
}

function renderTerrainBackground() {
  return `
    <defs>
      <linearGradient id="terrainShade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#dfead7"></stop>
        <stop offset="45%" stop-color="#edf1df"></stop>
        <stop offset="100%" stop-color="#c9d9bf"></stop>
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#7b8f75" flood-opacity="0.28"></feDropShadow>
      </filter>
      <pattern id="terrainTexture" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M0 18 C8 12, 14 24, 28 14" fill="none" stroke="#9bb28f" stroke-width="0.8" opacity="0.18"></path>
      </pattern>
    </defs>
    <rect x="0" y="0" width="900" height="560" fill="url(#terrainShade)"></rect>
    <rect x="0" y="0" width="900" height="560" fill="url(#terrainTexture)"></rect>
    <g class="contours">
      <path d="M-20 96 C120 36, 210 126, 345 72 S610 54, 936 138"></path>
      <path d="M-35 164 C105 96, 250 205, 395 136 S650 118, 935 196"></path>
      <path d="M-40 244 C150 184, 270 308, 455 214 S712 212, 940 286"></path>
      <path d="M-20 326 C105 282, 270 382, 420 308 S690 298, 938 370"></path>
      <path d="M-28 412 C132 356, 255 476, 445 398 S704 392, 940 470"></path>
      <path d="M80 -18 C152 96, 92 194, 188 304 S230 460, 162 590"></path>
      <path d="M405 -20 C470 98, 388 188, 512 302 S562 456, 506 590"></path>
      <path d="M700 -22 C780 88, 690 196, 808 308 S856 456, 782 590"></path>
    </g>
  `;
}

function renderPlainBackground() {
  return `<rect x="0" y="0" width="900" height="560" fill="#f8fbf8"></rect>`;
}

function renderMapDetail(polygon) {
  const lot = lotForPolygon(polygon);
  renderLotDetail(lot?.id, "#mapLotDetail", polygon);
}

function renderLotOutline(polygon) {
  if (!polygon?.coordinates?.length) return "";

  const projected = polygon.coordinates.map(lonLatToWorld);
  const xs = projected.map((point) => point[0]);
  const ys = projected.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const pad = 18;
  const width = 260;
  const height = 150;
  const scale = Math.min((width - pad * 2) / rangeX, (height - pad * 2) / rangeY);
  const drawWidth = rangeX * scale;
  const drawHeight = rangeY * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  const points = projected
    .map(([x, y]) => `${(offsetX + (x - minX) * scale).toFixed(1)},${(offsetY + (y - minY) * scale).toFixed(1)}`)
    .join(" ");

  return `
    <div class="lot-outline-card" aria-label="Contorno del lote">
      <svg viewBox="0 0 ${width} ${height}" role="img">
        <polygon points="${points}"></polygon>
      </svg>
    </div>
  `;
}

// Pasar al siguiente cultivo (misma campaña o la siguiente). Crea el cultivo en la rotación si no existe y lo deja
// como cultivo actual del lote. Sirve también para cultivos sin cosecha (verdeos, pasturas) o para cambiar de campaña.
function renderNextCropForm(lot, info) {
  const campaign = info.campaign || normalizeCampaignValue(lot.campaign) || activeCampaignValue();
  const next = nextCampaignValue(campaign);
  const crops = [...new Set(data.closures.map((closure) => canonicalCropName(closure.crop)).concat(["Soja 1ra", "Soja 2da", "Maiz", "Maiz 2da", "Trigo", "Girasol", "Sorgo", "Alfalfa", "Verdeo"]).filter(Boolean))].sort(compareText);
  const notice = info.harvested
    ? `<p class="next-crop-notice">${escapeHtml(info.lastCrop || "El cultivo")} ya está cosechado. Cargá el cultivo que sigue para que las órdenes nuevas se imputen a él.</p>`
    : "";
  return `
    <details class="next-crop" ${info.harvested ? "open" : ""}>
      <summary>Pasar al siguiente cultivo o campaña</summary>
      ${notice}
      <form class="form-grid compact-form" data-next-crop-form="${escapeHtml(lot.id)}">
        <label>Cultivo <input name="crop" list="nextCropList" required placeholder="Soja 2da" /></label>
        <label>Variedad/Híbrido <input name="variety" placeholder="Opcional" /></label>
        <label>Campaña
          <select name="campaign">
            <option value="${escapeHtml(campaign)}">${escapeHtml(campaign)} (misma campaña: segundo cultivo)</option>
            ${next ? `<option value="${escapeHtml(next)}">${escapeHtml(next)} (campaña siguiente)</option>` : ""}
          </select>
        </label>
        <div class="form-actions"><button type="submit">Guardar cultivo actual</button></div>
      </form>
      <datalist id="nextCropList">${crops.map((crop) => `<option value="${escapeHtml(crop)}"></option>`).join("")}</datalist>
      <p class="panel-note">El cultivo anterior queda en la rotación con sus costos. Para su margen, cargale los kilos cosechados en Cierre de campaña.</p>
    </details>`;
}

function bindNextCropForm(container) {
  container?.querySelectorAll("[data-next-crop-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const lot = data.lots.find((item) => item.id === form.dataset.nextCropForm);
      if (!lot) return;
      const values = formData(form);
      const crop = canonicalCropName(values.crop);
      const campaign = normalizeCampaignValue(values.campaign);
      if (!crop || !campaign) { showToast("Indicá el cultivo y la campaña"); return; }
      const previous = currentLotCropInfo(lot);
      let closure = lotRotationSequence(lot, campaign).find((item) => canonicalCropName(item.crop) === crop && !closureHarvested(item));
      if (!closure) {
        const groupId = lotRotationSequence(lot, campaign)[0]?.campaignGroupId || `CAM-${lot.id}-${campaign.replace("/", "-")}`;
        closure = { id: uid("clo"), campaignGroupId: groupId, lotId: lot.id, lotName: displayLotName(lot), campaign, crop, variety: values.variety || "", hectares: parseDecimal(lot.hectares), kgHarvested: "", priceTon: "", otherCosts: 0, applicationCosts: "", applicationCostsManual: false, income: "", grossMargin: "" };
        data.closures.push(closure);
        queueSync("closures", closure);
      } else if (values.variety && closure.variety !== values.variety) {
        closure.variety = values.variety;
        queueSync("closures", closure, "update");
      }
      const previousCrop = previous.crop || previous.lastCrop || lot.crop || "";
      if (canonicalCropName(previousCrop) !== crop) lot.previousCrop = previousCrop;
      lot.crop = crop;
      lot.variety = values.variety || closure.variety || "";
      lot.campaign = campaign;
      queueSync("lots", lot, "update");
      saveData();
      renderAll();
      openLotDetail(lot.id);
      showToast(`${displayLotName(lot)}: cultivo actual ${crop} (${campaign})`);
    });
  });
}

function renderLotDetail(lotId, targetSelector, polygon = null) {
  const target = document.querySelector(targetSelector);
  const lot = data.lots.find((item) => item.id === lotId);
  if (!lot) {
    target.innerHTML = polygon ? `
      <div class="map-detail-body">
        <strong>${polygon.name || "Polígono sin nombre"}</strong>
        <span>No está vinculado a un lote cargado.</span>
        <span>Para vincularlo, el nombre del polígono en el KML debe coincidir con el nombre del lote.</span>
      </div>
    ` : `<div class="empty">Seleccioná un lote para ver su ficha.</div>`;
    return;
  }

  const closures = lot ? data.closures.filter((closure) => sameLot(closure, lot)) : [];
  // Último cierre real: el más reciente con kilos cosechados (y dentro de la campaña, el último cultivo).
  const lastClosure = closures.filter(closureHarvested).sort((a, b) => (campaignStartYear(b.campaign) - campaignStartYear(a.campaign)) || (cropSequenceRank(b.crop) - cropSequenceRank(a.crop)))[0];
  const cropInfo = currentLotCropInfo(lot);
  const orders = lot ? data.orders.filter((order) => sameLot(order, lot)).sort((a, b) => String(b.date).localeCompare(String(a.date))) : [];
  const pendingOrders = orders.filter((order) => order.status !== "Finalizada" && order.status !== "Cancelada").length;
  const orderCosts = buildOrderCosts(lot.id);
  const lotCost = costForLot(lot);
  const totalSpent = lotCost.total;
  const totalSpentHa = lot.hectares ? totalSpent / lot.hectares : 0;
  const costParts = lotCostParts(lotCost);
  const outlinePolygon = polygon || polygonForLot(lot);
  const lotOutline = renderLotOutline(outlinePolygon);

  target.innerHTML = `
    <div class="map-detail-body">
      <div>
        <strong>${displayLotName(lot)}</strong>
        <span>${lot.farm} - ${number(lot.hectares, 2)} ha</span>
      </div>
      <div class="map-kpis">
        <div><b>${escapeHtml(cropInfo.crop || (cropInfo.harvested ? "Cosechado" : "-"))}</b><span>Cultivo actual</span></div>
        <div><b>${escapeHtml(cropInfo.variety || "-")}</b><span>Variedad/Hibrido</span></div>
        <div><b>${orders.length}</b><span>ordenes</span></div>
        <div><b>${pendingOrders}</b><span>Pendientes</span></div>
        <div><b>${money(totalSpentHa)}</b><span>Costo acum./ha</span></div>
      </div>
      <div class="lot-info-with-outline">
        <div class="map-info-lines">
          <span>Campaña ${cropInfo.campaign || lot.campaign || "-"}</span>
          <span>Antecesor: ${escapeHtml(cropInfo.moved ? cropInfo.previousCrop : (lot.previousCrop || "-"))}</span>
          <span>Ambiente: ${lot.environment || "-"}</span>
          <span>${lastClosure ? `Último cierre: ${lastClosure.campaign} ${escapeHtml(canonicalCropName(lastClosure.crop))}, ${numberOptional(closureYield(lastClosure))} kg/ha, ${escapeHtml(lastClosure.variety || "sin variedad")}, ${escapeHtml(lastClosure.enso || "sin ENSO")}, margen ${moneyOptional(lastClosure.grossMargin)}` : "Sin cierre histórico cargado"}</span>
        </div>
        ${lotOutline}
      </div>
      ${renderNextCropForm(lot, cropInfo)}
      <div class="map-subsection">
        <h3>ordenes del lote</h3>
        ${orders.length ? orders.map((order) => `
          <div class="map-row clickable-card" data-open-order-detail="${order.id}">
            <div>
              <b>${order.task}</b>
              <span>${dateShort(order.date)} - ${number(order.plannedHectares || 0, 2)} ha - ${order.owner || "-"}</span>
              <em>${formatOrderCost(order, orderCosts.get(order.id))}</em>
            </div>
            ${statusBadge(order.status)}
          </div>
        `).join("") : `<p class="map-empty">Sin ordenes cargadas.</p>`}
      </div>
      <div class="lot-total-box lot-cost-breakdown-box">
        <div class="lot-cost-totals">
          <article>
            <span>Costo total del lote</span>
            <strong>${money(totalSpent)}</strong>
          </article>
          <article>
            <span>Costo por hectárea</span>
            <strong>${money(totalSpentHa)}/ha</strong>
          </article>
        </div>
        ${costParts.length ? `
          <div class="lot-cost-bar">
            ${costParts.map((part) => `<span title="${part.label}" style="width:${((part.amount / totalSpent) * 100).toFixed(2)}%; background:${part.color}"></span>`).join("")}
          </div>
          <div class="lot-cost-grid">
            ${costParts.map((part) => `
              <div>
                <i style="background:${part.color}"></i>
                <span>${part.label}</span>
                <strong>${money(part.amount)}</strong>
                <em>${money(lot.hectares ? part.amount / lot.hectares : 0)}/ha · ${number((part.amount / totalSpent) * 100, 1)}%</em>
              </div>
            `).join("")}
          </div>
        ` : `<p class="map-empty">Todavía no hay costos imputados a este lote.</p>`}
      </div>
      <div class="map-actions">
        <button data-map-action="ordenes" data-lot-id="${lot.id}">Nueva orden</button>
        <button data-map-action="monitoreo" data-lot-id="${lot.id}">Monitoreo</button>
        <button data-map-action="aplicaciones" data-lot-id="${lot.id}">Aplicación</button>
        <button data-map-action="cierre" data-lot-id="${lot.id}">Cierre</button>
      </div>
    </div>
  `;

  target.querySelectorAll("[data-map-action]").forEach((button) => {
    button.addEventListener("click", () => {
      switchView(button.dataset.mapAction);
      const select = document.querySelector(`#${button.dataset.mapAction} select[name="lotId"]`);
      if (select) {
        select.value = button.dataset.lotId;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        const form = select.form;
        applyLotDefaultCrop(form, true);
        applyLotDefaultVariety(form, true);
        if (button.dataset.mapAction === "ordenes") {
          document.querySelector("#orderFormBand")?.classList.remove("hidden-panel");
          applyOrderLotDefaultHectares(true);
        }
        if (button.dataset.mapAction === "cierre") applyClosureDefaults(form, true);
      }
    });
  });
  target.querySelectorAll("[data-open-order-detail]").forEach((row) => {
    row.addEventListener("click", () => openOrderDetail(row.dataset.openOrderDetail, targetSelector === "#fullLotDetail" ? "ficha-lote" : "mapa"));
  });
  bindNextCropForm(target);
}

function buildOrderCosts(lotId) {
  const costs = new Map();
  const lot = data.lots.find((item) => item.id === lotId);

  data.orders.filter((order) => lot && sameLot(order, lot)).forEach((order) => {
    const labor = laborCostForOrder(order);
    costs.set(order.id, {
      product: 0,
      labor,
      total: labor,
      hectares: Number(order.plannedHectares || order.Hectareas_planificadas || 0)
    });
  });

  const seenLabor = new Set();
  uniqueApplicationRows(data.applications).filter((application) => lot && sameLot(application, lot)).forEach((application) => {
    const key = application.orderId || application.id;
    const item = costs.get(key) || { product: 0, labor: 0, total: 0, hectares: Number(application.hectares || 0) };
    item.product += applicationProductCost(application);
    item.hectares = item.hectares || Number(application.hectares || 0);

    if (!orderById(application.orderId) && application.laborCostTotal && !seenLabor.has(application.id)) {
      item.labor += Number(application.laborCostTotal || 0);
      seenLabor.add(application.id);
    }

    item.total = item.product + item.labor;
    costs.set(key, item);
  });

  costs.forEach((item) => {
    item.total = item.product + item.labor;
  });

  return costs;
}

function formatOrderCost(order, cost) {
  if (!cost || !cost.total) return "Costo: sin costo cargado";
  const hectares = cost.hectares || order.plannedHectares || 0;
  return `Costo: ${money(cost.total)} · ${money(hectares ? cost.total / hectares : 0)}/ha`;
}

function applicationsForOrder(orderId) {
  return data.applications.filter((application) => application.orderId === orderId);
}

function firstApplicationIdForOrder(orderId) {
  return applicationsForOrder(orderId).find((application) => application.id)?.id || "";
}

function groupApplications(applications) {
  return Array.from(applications.reduce((map, row) => {
    if (!row.id) return map;
    const item = map.get(row.id) || {
      id: row.id,
      date: row.date,
      hectares: row.hectares,
      products: [],
      totalCost: 0
    };
    item.products.push(row.productName || productName(row.productId));
    item.totalCost += Number(row.totalCost || 0);
    map.set(row.id, item);
    return map;
  }, new Map()).values()).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function parseKml(text) {
  const xml = new DOMParser().parseFromString(text, "application/xml");
  if (xml.querySelector("parsererror")) throw new Error("No se pudo leer el KML.");

  return Array.from(xml.querySelectorAll("Placemark")).flatMap((placemark, index) => {
    const name = placemark.querySelector("name")?.textContent?.trim() || `Polígono ${index + 1}`;
    const rings = Array.from(placemark.querySelectorAll("Polygon")).map((polygon) => {
      return polygon.querySelector("outerBoundaryIs LinearRing coordinates") || polygon.querySelector("coordinates");
    });

    return rings
      .filter(Boolean)
      .map((node, polygonIndex) => {
        const coordinates = node.textContent
          .trim()
          .split(/\s+/)
          .map((pair) => pair.split(",").map(Number))
          .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]))
          .map((point) => [point[0], point[1]]);
        return coordinates.length >= 3 ? { id: uid("poly"), name: polygonIndex ? `${name} ${polygonIndex + 1}` : name, coordinates } : null;
      })
      .filter(Boolean);
  });
}

function renderOrders() {
  populateOrderExtraFilters();
  const pending = data.orders.filter((order) => order.status === "Pendiente");
  const progress = data.orders.filter((order) => order.status === "En curso");
  const done = data.orders.filter((order) => order.status === "Finalizada");
  const pendingHa = [...pending, ...progress].reduce((sum, order) => sum + Number(order.plannedHectares || order.Hectareas_planificadas || 0), 0);

  document.querySelector("#ordersPending").textContent = pending.length;
  document.querySelector("#ordersProgress").textContent = progress.length;
  document.querySelector("#ordersDone").textContent = done.length;
  document.querySelector("#ordersPendingHa").textContent = number(pendingHa, 2);
  document.querySelectorAll("[data-order-filter-shortcut]").forEach((card) => {
    card.classList.toggle("active", card.dataset.orderFilterShortcut === orderFilter);
  });

  const applicationOrderIds = new Set(data.applications.map((application) => application.orderId).filter(Boolean));
  const applicationByOrderId = data.applications.reduce((map, application) => {
    if (application.orderId && application.id && !map.has(application.orderId)) map.set(application.orderId, application.id);
    return map;
  }, new Map());
  const visibleOrders = data.orders
    .filter(orderMatchesMainFilters)
    .slice()
    .sort(orderFilter === "Todas" ? byOrderPriority : byRecentDate);

  document.querySelector("#ordersTable").innerHTML = visibleOrders
    .map((order) => `
      <tr class="clickable-row" data-open-order-detail="${order.id}">
        <td>${dateShort(order.date)}</td>
        <td><strong class="lot-cell">${lotName(order.lotId)}</strong></td>
        <td>${order.task} <span class="muted-inline">${order.crop || lotCrop(order.lotId) || "-"} · ${order.variety || lotVariety(order.lotId) || "-"}</span> ${syncBadge(order)}</td>
        <td>${number(order.plannedHectares || order.Hectareas_planificadas || 0, 2)}</td>
        <td>${order.owner || "-"}</td>
        <td>${statusBadge(order.status)}</td>
        <td>
          <div class="row-actions">
            ${applicationOrderIds.has(order.id) ? `<button class="link-button" data-open-application="${applicationByOrderId.get(order.id)}">Ver aplicación</button>` : orderNeedsApplication(order) ? `<button class="link-button primary" data-add-application="${order.id}">Agregar aplicación</button>` : ""}
            ${order.status !== "Finalizada" ? `<button class="link-button" data-finish-order="${order.id}">Finalizar</button>` : ""}
            <button class="link-button" data-edit-order="${order.id}">Editar</button>
            <button class="link-button danger" data-delete-order="${order.id}">Eliminar</button>
          </div>
        </td>
      </tr>
    `)
    .join("") || `<tr><td colspan="7">No hay ordenes para este filtro.</td></tr>`;

  document.querySelectorAll("[data-open-application]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      highlightedApplicationId = button.dataset.openApplication;
      applicationBackView = "ordenes";
      applicationBackLotId = "";
      switchView("aplicaciones");
      renderApplications();
      showToast(`Mostrando ${highlightedApplicationId}`);
    });
  });
  document.querySelectorAll("[data-add-application]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openApplicationFormFromOrder(button.dataset.addApplication);
    });
  });
  document.querySelectorAll("[data-edit-order]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      editOrder(button.dataset.editOrder);
    });
  });
  document.querySelectorAll("[data-finish-order]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      finishOrder(button.dataset.finishOrder);
    });
  });
  document.querySelectorAll("[data-delete-order]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteOrder(button.dataset.deleteOrder);
    });
  });
  document.querySelectorAll("[data-open-order-detail]").forEach((row) => {
    row.addEventListener("click", () => openOrderDetail(row.dataset.openOrderDetail, "ordenes"));
  });
  renderOrderProductSummary();
}

function orderEffectiveCrop(order) {
  return order?.crop || lotCrop(order?.lotId) || "";
}

function populateOrderExtraFilters() {
  const statusSelect = document.querySelector("#orderStatusFilter");
  const cropSelect = document.querySelector("#orderCropFilter");
  const lotSelect = document.querySelector("#orderLotFilter");
  const productSelect = document.querySelector("#orderProductFilter");
  const contractorSelect = document.querySelector("#orderContractorFilter");
  if (statusSelect) {
    const statuses = ["Todas", "Pendiente", "En curso", "Finalizada", "Cancelada"];
    statusSelect.innerHTML = statuses.map((status) => `<option value="${status}">${status === "Todas" ? "Todos" : status}</option>`).join("");
    statusSelect.value = statuses.includes(orderFilter) ? orderFilter : "Todas";
    orderFilter = statusSelect.value;
  }
  if (cropSelect) {
    const crops = Array.from(new Set(data.orders.map(orderEffectiveCrop).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base", numeric: true }));
    cropSelect.innerHTML = [`<option value="Todos">Todos</option>`, ...crops.map((crop) => `<option value="${crop}">${crop}</option>`)].join("");
    cropSelect.value = crops.includes(orderCropFilter) ? orderCropFilter : "Todos";
    orderCropFilter = cropSelect.value;
  }
  if (lotSelect) {
    const lotIds = Array.from(new Set(data.orders.map((order) => order.lotId).filter(Boolean)))
      .sort((a, b) => lotName(a).localeCompare(lotName(b), "es", { sensitivity: "base", numeric: true }));
    lotSelect.innerHTML = [`<option value="Todos">Todos</option>`, ...lotIds.map((lotId) => `<option value="${lotId}">${lotName(lotId)}</option>`)].join("");
    lotSelect.value = lotIds.includes(orderLotFilter) ? orderLotFilter : "Todos";
    orderLotFilter = lotSelect.value;
  }
  if (productSelect) {
    const products = Array.from(new Set(data.applications
      .map((application) => application.productName || productName(application.productId))
      .filter(Boolean)))
      .sort(compareText);
    productSelect.innerHTML = [`<option value="Todos">Todos</option>`, ...products.map((product) => `<option value="${product}">${product}</option>`)].join("");
    const selectedProduct = products.find((product) => normalizeName(product) === normalizeName(orderProductFilter));
    productSelect.value = selectedProduct || "Todos";
    orderProductFilter = productSelect.value;
  }
  if (contractorSelect) {
    const contractors = Array.from(data.orders.reduce((map, order) => {
      const owner = String(order.owner || "").trim();
      const key = normalizeName(owner);
      if (key && !map.has(key)) map.set(key, owner);
      return map;
    }, new Map()).values()).sort(compareText);
    contractorSelect.innerHTML = [`<option value="Todos">Todos</option>`, ...contractors.map((contractor) => `<option value="${contractor}">${contractor}</option>`)].join("");
    const selectedContractor = contractors.find((contractor) => normalizeName(contractor) === normalizeName(orderContractorFilter));
    contractorSelect.value = selectedContractor || "Todos";
    orderContractorFilter = contractorSelect.value;
  }
}

function orderMatchesMainFilters(order) {
  if (orderFilter !== "Todas" && order.status !== orderFilter) return false;
  if (orderCropFilter !== "Todos" && normalizeName(orderEffectiveCrop(order)) !== normalizeName(orderCropFilter)) return false;
  if (orderLotFilter !== "Todos" && order.lotId !== orderLotFilter) return false;
  if (orderProductFilter !== "Todos" && !orderHasProduct(order, orderProductFilter)) return false;
  if (orderContractorFilter !== "Todos" && normalizeName(order.owner) !== normalizeName(orderContractorFilter)) return false;
  return true;
}

function orderHasProduct(order, productFilter) {
  const target = normalizeName(productFilter);
  if (!target) return true;
  return data.applications.some((application) => {
    if (application.orderId !== order.id) return false;
    const names = [
      application.productName,
      productName(application.productId)
    ].map(normalizeName).filter(Boolean);
    return names.some((name) => name === target);
  });
}

function ensureOrderProductSummaryPanel() {
  let panel = document.querySelector("#orderProductSummaryPanel");
  if (panel) return panel;
  const ordersPanel = document.querySelector("#ordersTable")?.closest(".panel");
  if (!ordersPanel) return null;
  ordersPanel.insertAdjacentHTML("afterend", `
    <section class="panel order-product-summary-panel" id="orderProductSummaryPanel">
      <div class="panel-header">
        <div>
          <h2>Productos por ordenes filtradas</h2>
          <span class="panel-note">Suma productos segun estado de orden y busqueda.</span>
        </div>
        <div class="panel-actions order-product-summary-filters">
          <label>Orden, lote o tarea <input id="orderProductSearch" placeholder="Buscar orden/lote/tarea" /></label>
          <button class="link-button" id="clearOrderProductSearch" type="button">Limpiar</button>
        </div>
      </div>
      <div id="orderProductSummaryMeta" class="panel-note"></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th class="num">Cantidad total</th>
              <th>Estado</th>
              <th>Ordenes</th>
            </tr>
          </thead>
          <tbody id="orderProductSummaryTable"></tbody>
        </table>
      </div>
      <div id="orderProductDetail" class="order-product-detail"></div>
    </section>
  `);
  panel = document.querySelector("#orderProductSummaryPanel");
  document.querySelector("#orderProductSearch")?.addEventListener("input", (event) => {
    orderProductTextFilter = event.target.value;
    renderOrderProductSummary();
  });
  document.querySelector("#clearOrderProductSearch")?.addEventListener("click", () => {
    orderProductTextFilter = "";
    const input = document.querySelector("#orderProductSearch");
    if (input) input.value = "";
    renderOrderProductSummary();
  });
  return panel;
}

function orderMatchesProductSummaryFilter(order, filter) {
  if (!filter) return true;
  const text = [
    order.id,
    dateShort(order.date),
    lotName(order.lotId),
    order.task,
    order.owner,
    order.status,
    order.crop,
    order.variety
  ].map(normalizeName).join(" ");
  return text.includes(filter);
}

function renderOrderProductSummary() {
  const panel = ensureOrderProductSummaryPanel();
  if (!panel) return;
  const input = document.querySelector("#orderProductSearch");
  if (input && input.value !== orderProductTextFilter) input.value = orderProductTextFilter;
  const filter = normalizeName(orderProductTextFilter);
  const orders = data.orders.filter((order) =>
    orderMatchesMainFilters(order)
    && orderMatchesProductSummaryFilter(order, filter)
  );
  const orderIds = new Set(orders.map((order) => order.id));
  const grouped = new Map();
  data.applications
    .filter((application) => application.orderId && orderIds.has(application.orderId))
    .forEach((application) => {
      const product = data.products.find((item) => item.id === application.productId);
      const name = application.productName || product?.name || application.productId || "Sin producto";
      const unit = product?.unit || application.unit || "";
      const key = `${normalizeName(name)}|${normalizeName(unit)}`;
      const item = grouped.get(key) || { key, name, unit, quantity: 0, orders: new Set(), statuses: new Set() };
      item.quantity += Number(application.usedQuantity || application.totalQuantity || (Number(application.dose || 0) * Number(application.hectares || 0)) || 0);
      item.orders.add(application.orderId);
      item.statuses.add(orderById(application.orderId)?.status || "Sin estado");
      grouped.set(key, item);
    });

  document.querySelector("#orderProductSummaryMeta").textContent = `Estado: ${orderFilter}. Cultivo: ${orderCropFilter}. Lote: ${orderLotFilter === "Todos" ? "Todos" : lotName(orderLotFilter)}. Producto: ${orderProductFilter}. Contratista: ${orderContractorFilter}. Ordenes consideradas: ${orders.length}.`;
  const rows = Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base", numeric: true }));
  document.querySelector("#orderProductSummaryTable").innerHTML = rows.map((item) => `
    <tr class="clickable-row ${item.key === selectedOrderProductKey ? "selected" : ""}" data-order-product-key="${encodeURIComponent(item.key)}">
      <td><strong>${item.name}</strong></td>
      <td class="num">${number(item.quantity, 2)} ${item.unit}</td>
      <td>${Array.from(item.statuses).join(", ")}</td>
      <td class="order-chip-list">${Array.from(item.orders).map((orderId) => `<button class="link-button small" data-open-summary-order="${orderId}" title="${orderId}">${orderShortLabel(orderId)}</button>`).join("")}</td>
    </tr>
  `).join("") || `<tr><td colspan="4">No hay productos vinculados a las ordenes filtradas.</td></tr>`;
  document.querySelectorAll("[data-order-product-key]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      selectedOrderProductKey = decodeURIComponent(row.dataset.orderProductKey || "");
      renderOrderProductSummary();
      document.querySelector("#orderProductDetail")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
  document.querySelectorAll("[data-open-summary-order]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openOrderDetail(button.dataset.openSummaryOrder, "ordenes");
    });
  });
  renderOrderProductDetail();
}

function renderOrderProductDetail() {
  const detail = document.querySelector("#orderProductDetail");
  if (!detail) return;
  if (!selectedOrderProductKey) {
    detail.innerHTML = "";
    return;
  }
  const [selectedName, selectedUnit] = selectedOrderProductKey.split("|");
  const filter = normalizeName(orderProductTextFilter);
  const orders = data.orders.filter((order) =>
    orderMatchesMainFilters(order)
    && orderMatchesProductSummaryFilter(order, filter)
  );
  const orderIds = new Set(orders.map((order) => order.id));
  const rows = data.applications
    .filter((application) => application.orderId && orderIds.has(application.orderId))
    .filter((application) => {
      const product = data.products.find((item) => item.id === application.productId);
      const name = application.productName || product?.name || application.productId || "Sin producto";
      const unit = product?.unit || application.unit || "";
      return `${normalizeName(name)}|${normalizeName(unit)}` === selectedOrderProductKey;
    })
    .slice()
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  const productLabel = rows[0]?.productName || productName(rows[0]?.productId) || selectedName || "Producto";
  detail.innerHTML = `
    <div class="panel-header compact-detail-header">
      <div>
        <h2>${productLabel}</h2>
        <span class="panel-note">Detalle por orden filtrada</span>
      </div>
      <button class="link-button" id="closeOrderProductDetail" type="button">Cerrar</button>
    </div>
    <div class="table-wrap order-product-detail-table">
      <table>
        <thead>
          <tr>
            <th>Orden</th>
            <th>Fecha</th>
            <th>Lote</th>
            <th>Estado</th>
            <th class="num">Dosis/ha</th>
            <th class="num">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const order = orderById(row.orderId);
            const quantity = Number(row.usedQuantity || row.totalQuantity || (Number(row.dose || 0) * Number(row.hectares || 0)) || 0);
            return `
              <tr>
                <td><button class="link-button small" data-open-summary-order="${row.orderId}" title="${row.orderId}">${orderShortLabel(order)}</button></td>
                <td>${dateShort(row.date || order?.date)}</td>
                <td>${lotName(row.lotId || order?.lotId)}</td>
                <td>${order?.status || "-"}</td>
                <td class="num">${number(row.dose, 2)}</td>
                <td class="num">${number(quantity, 2)} ${selectedUnit}</td>
              </tr>
            `;
          }).join("") || `<tr><td colspan="6">No hay detalle para este producto.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
  detail.querySelector("#closeOrderProductDetail")?.addEventListener("click", () => {
    selectedOrderProductKey = "";
    renderOrderProductSummary();
  });
  detail.querySelectorAll("[data-open-summary-order]").forEach((button) => {
    button.addEventListener("click", () => openOrderDetail(button.dataset.openSummaryOrder, "ordenes"));
  });
}

function openOrderDetail(orderId, backView = "ordenes") {
  selectedOrderId = orderId;
  orderDetailBackView = backView;
  const order = orderById(orderId);
  orderDetailBackLotId = backView === "ficha-lote" ? order?.lotId || orderDetailBackLotId : "";
  const backButton = document.querySelector("#backFromOrderDetail");
  if (backButton) {
    backButton.textContent = backView === "ficha-lote" ? "Volver al lote" : backView === "ficha-deposito" ? "Volver al insumo" : backView === "contratistas" ? "Volver a contratistas" : backView === "dashboard" ? "Volver al panel" : "Volver a ordenes";
  }
  renderOrderDetail(orderId);
  switchView("ficha-orden");
}

function renderOrderDetail(orderId) {
  const detail = document.querySelector("#orderDetail");
  if (!detail) return;

  const order = orderById(orderId);
  if (!order) {
    detail.innerHTML = `<div class="empty">No encontré esa orden.</div>`;
    return;
  }

  const rows = applicationsForOrder(order.id);
  const applicationId = firstApplicationIdForOrder(order.id);
  const productCost = uniqueApplicationRows(rows).reduce((sum, row) => sum + applicationProductCost(row), 0);
  const laborCost = laborCostForOrder(order);
  const hectares = Number(order.plannedHectares || order.Hectareas_planificadas || rows[0]?.hectares || 0);
  const total = productCost + laborCost;

  detail.innerHTML = `
    <div class="map-detail-body">
      <div>
        <strong>${order.task}</strong>
        <span>${dateShort(order.date)} · ${lotName(order.lotId)} · ${number(hectares, 2)} ha</span>
      </div>
      <div class="map-kpis">
        <div><b>${statusBadge(order.status)}</b><span>Estado</span></div>
        <div><b>${order.owner || "-"}</b><span>Responsable</span></div>
        <div><b>${money(laborCost)}</b><span>Labor</span></div>
        <div><b>${money(hectares ? total / hectares : 0)}</b><span>Total/ha</span></div>
      </div>
      <div class="map-info-lines">
        <span>Número de orden: ${orderShortLabel(order)}</span>
        <span>Fecha de ejecución: ${order.completionDate ? dateShort(order.completionDate) : "-"}</span>
        <span>Cultivo: ${order.crop || lotCrop(order.lotId) || "-"}</span>
        <span>Variedad/Híbrido: ${order.variety || lotVariety(order.lotId) || "-"}</span>
        <span>Costo labor/ha: ${money(order.laborCostHa || 0)}</span>
        <span>Observaciones: ${order.notes || "-"}</span>
      </div>
      <div class="detail-actions">
        ${order.status !== "Finalizada" ? `<button class="link-button primary" data-finish-order="${order.id}">Finalizar orden</button>` : ""}
        <button class="link-button primary" data-share-order="${order.id}" type="button">Enviar por WhatsApp</button>
        <button class="link-button" data-copy-order="${order.id}" type="button">Copiar texto</button>
        <button class="link-button" data-edit-order="${order.id}">Editar orden</button>
        <button class="link-button danger" data-delete-order="${order.id}">Eliminar orden</button>
      </div>
      <div class="map-subsection">
        <h3>Aplicación vinculada</h3>
        ${rows.length ? `
          <div class="map-row clickable-card" data-open-application="${applicationId}">
            <div>
              <b>${applicationId}</b>
              <span>Productos ${money(productCost)} · Labor ${money(laborCost)} · Total ${money(total)}</span>
              <em>${rows.map((row) => row.productName || productName(row.productId)).join(", ")}</em>
            </div>
            <button class="link-button">Ver aplicación</button>
          </div>
        ` : orderNeedsApplication(order) ? `
          <button class="link-button primary" data-add-application="${order.id}">Agregar aplicación</button>
        ` : `<p class="map-empty">Esta orden no tiene aplicación vinculada.</p>`}
      </div>
    </div>
  `;

  detail.querySelector("[data-edit-order]")?.addEventListener("click", () => editOrder(order.id));
  detail.querySelector("[data-share-order]")?.addEventListener("click", () => shareOrder(order.id));
  detail.querySelector("[data-copy-order]")?.addEventListener("click", () => shareOrder(order.id, "copy"));
  detail.querySelector("[data-delete-order]")?.addEventListener("click", () => deleteOrder(order.id));
  detail.querySelector("[data-finish-order]")?.addEventListener("click", () => finishOrder(order.id));
  detail.querySelector("[data-add-application]")?.addEventListener("click", () => openApplicationFormFromOrder(order.id));
  detail.querySelector("[data-open-application]")?.addEventListener("click", () => {
    highlightedApplicationId = applicationId;
    applicationBackView = orderDetailBackView === "ficha-lote" ? "ficha-lote" : "ordenes";
    applicationBackLotId = applicationBackView === "ficha-lote" ? order.lotId : "";
    switchView("aplicaciones");
    renderApplications();
  });
}

function renderMonitors() {
  document.querySelector("#monitorList").innerHTML = data.monitors
    .slice()
    .sort(byRecentDate)
    .map((monitor) => `
      <div class="list-item clickable-card ${monitor.id === selectedMonitorId ? "selected" : ""}" data-monitor-id="${monitor.id}">
        <div class="monitor-list-row">
          ${monitorPhotoSource(monitor.photo) ? `<img class="monitor-thumb" src="${monitorPhotoSource(monitor.photo)}" alt="Foto de monitoreo" loading="lazy" />` : ""}
          <div>
            <strong>${[dateShort(monitor.date), lotName(monitor.lotId), monitor.crop || lotCrop(monitor.lotId) || "-", lotVariety(monitor.lotId) || monitor.variety || "-", monitor.cropStatus || "Sin estado"].join(" - ")} ${syncBadge(monitor)}</strong>
            <span>Malezas: ${monitor.weeds || "-"} - Plagas/enfermedades: ${monitor.issues || "-"} - Recomendacion: ${monitor.recommendation || "-"}</span>
            ${renderMonitorPhotoThumbs(monitor.photo, "monitor-photo-strip")}
            <span class="item-actions">
              <button class="link-button" data-edit-monitor="${monitor.id}">Editar</button>
              <button class="link-button danger" data-delete-monitor="${monitor.id}">Eliminar</button>
            </span>
          </div>
        </div>
      </div>
    `)
    .join("") || `<div class="empty">No hay monitoreos cargados.</div>`;

  document.querySelectorAll("[data-monitor-id]").forEach((item) => {
    item.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      openMonitorDetail(item.dataset.monitorId);
    });
  });
  document.querySelectorAll("[data-edit-monitor]").forEach((button) => {
    button.addEventListener("click", () => editMonitor(button.dataset.editMonitor));
  });
  document.querySelectorAll("[data-delete-monitor]").forEach((button) => {
    button.addEventListener("click", () => deleteMonitor(button.dataset.deleteMonitor));
  });
}

function openMonitorDetail(monitorId) {
  selectedMonitorId = monitorId;
  renderMonitorDetail(monitorId);
  switchView("ficha-monitoreo");
}

function renderMonitorDetail(monitorId) {
  const detail = document.querySelector("#monitorDetail");
  if (!detail) return;

  const monitor = data.monitors.find((item) => item.id === monitorId);
  if (!monitor) {
    detail.innerHTML = `<div class="empty">Selecciona un monitoreo para ver su ficha.</div>`;
    return;
  }

  detail.innerHTML = `
    <div class="detail-grid">
      <article><span>Fecha</span><strong>${dateShort(monitor.date)}</strong></article>
      <article><span>Lote</span><strong>${lotName(monitor.lotId)}</strong></article>
      <article><span>Cultivo</span><strong>${monitor.crop || lotCrop(monitor.lotId) || "-"}</strong></article>
      <article><span>Variedad/Hibrido</span><strong>${lotVariety(monitor.lotId) || monitor.variety || "-"}</strong></article>
      <article><span>Estado</span><strong>${monitor.cropStatus || "-"}</strong></article>
      <article><span>Sincronizacion</span><strong>${syncBadge(monitor) || "Base cargada"}</strong></article>
    </div>
    <div class="detail-notes">
      <p><b>Malezas</b><span>${monitor.weeds || "-"}</span></p>
      <p><b>Plagas / enfermedades</b><span>${monitor.issues || "-"}</span></p>
      <p><b>Recomendacion</b><span>${monitor.recommendation || "-"}</span></p>
    </div>
    ${renderMonitorPhotoThumbs(monitor.photo, "monitor-photo-gallery")}
    ${driveLinksHtml(monitor, "Foto")}
    <div class="detail-actions">
      <button class="link-button" data-edit-monitor="${monitor.id}">Editar</button>
      <button class="link-button danger" data-delete-monitor="${monitor.id}">Eliminar</button>
    </div>
  `;

  detail.querySelector("[data-edit-monitor]")?.addEventListener("click", () => editMonitor(monitor.id));
  detail.querySelector("[data-delete-monitor]")?.addEventListener("click", () => deleteMonitor(monitor.id));
}

function renderApplications() {
  if (highlightedApplicationId) document.querySelector("#applicationFormBand")?.classList.add("hidden-panel");
  const grouped = Array.from(data.applications.reduce((map, row) => {
    if (!row.id) return map;
    const item = map.get(row.id) || {
      id: row.id,
      date: row.date,
      lotId: row.lotId,
      hectares: row.hectares,
      products: [],
      totalCost: 0
    };
    item.products.push(row.productName || productName(row.productId));
    item.totalCost += Number(row.productCost || row.totalCost || 0);
    if (!item.laborAdded) {
      item.totalCost += laborCostForApplicationRows(data.applications.filter((application) => application.id === row.id));
      item.laborAdded = true;
    }
    map.set(row.id, item);
    return map;
  }, new Map()).values());

  const visible = (highlightedApplicationId ? grouped.filter((application) => application.id === highlightedApplicationId) : grouped)
    .slice()
    .sort(byRecentDate);

  const tableBody = document.querySelector("#applicationsTable");
  const tableWrap = tableBody?.closest(".table-wrap");
  if (tableWrap) tableWrap.classList.toggle("hidden-panel", Boolean(highlightedApplicationId));
  tableBody.innerHTML = highlightedApplicationId ? "" : visible
    .map((application) => `
      <tr class="clickable-row" data-open-application-detail="${application.id}">
        <td>${dateShort(application.date)}</td>
        <td>${lotName(application.lotId)}</td>
        <td>${application.products.join(", ")} ${syncBadge(data.applications.find((row) => row.id === application.id))}</td>
        <td>${number(application.hectares, 2)}</td>
        <td>${money(application.totalCost)}</td>
        <td>${money(application.totalCost / application.hectares)}</td>
      </tr>
    `)
    .join("") || `<tr><td colspan="6">No hay aplicaciones para mostrar.</td></tr>`;

  renderApplicationDetail(highlightedApplicationId);
  const backButton = document.querySelector("#backToOrders");
  backButton.style.display = highlightedApplicationId ? "inline-flex" : "none";
  backButton.textContent = applicationBackView === "ficha-lote" ? "Volver al lote" : "Volver a ordenes";
  document.querySelectorAll("[data-open-application-detail]").forEach((row) => {
    row.addEventListener("click", () => {
      highlightedApplicationId = row.dataset.openApplicationDetail;
      renderApplications();
    });
  });
}

function renderApplicationDetail(applicationId) {
  const detail = document.querySelector("#applicationDetail");
  if (!applicationId) {
    detail.innerHTML = "";
    return;
  }

  const rows = data.applications.filter((application) => application.id === applicationId);
  if (!rows.length) {
    detail.innerHTML = `<div class="empty">No hay detalle para esta aplicación.</div>`;
    return;
  }

  const first = rows[0];
  const productCost = rows.reduce((sum, row) => sum + Number(row.productCost || 0), 0);
  const linkedOrder = orderById(first.orderId);
  const lot = findLot(first);
  const service = linkedOrder?.task || "Aplicación";
  const owner = linkedOrder?.owner || "-";
  const crop = linkedOrder?.crop || lot?.crop || "-";
  const variety = linkedOrder?.variety || lot?.variety || "-";
  const laborCost = laborCostForApplicationRows(rows);
  const laborCostHa = linkedOrder ? Number(linkedOrder.laborCostHa || 0) : Number(first.laborCostHa || 0);
  const total = productCost + laborCost;
  const costHa = first.hectares ? total / first.hectares : 0;

  detail.innerHTML = `
    <div class="application-detail-header">
      <div class="application-order-heading">
        <span class="application-order-label">Número de aplicación</span>
        <span class="application-order-number">${applicationId}${linkedOrder ? ` - ${orderShortLabel(linkedOrder)}` : ""}</span>
        <strong>${lotName(first.lotId)}</strong>
        <span>${number(first.hectares, 2)} ha</span>
      </div>
      <div class="detail-actions application-share-actions">
        <button class="link-button" data-copy-application-order="${applicationId}">Copiar orden</button>
        <button class="link-button" data-print-application-order="${applicationId}">Imprimir/PDF</button>
        <button class="link-button primary" data-add-product-application="${applicationId}">Agregar producto</button>
      </div>
    </div>
    <div class="application-order-summary">
      <article>
        <span>Lote</span>
        <strong>${lotName(first.lotId)}</strong>
        <small>${lot?.farm || "-"}</small>
      </article>
      <article>
        <span>Superficie</span>
        <strong>${number(first.hectares, 2)} ha</strong>
        <small>${crop}${variety && variety !== "-" ? ` · ${variety}` : ""}</small>
      </article>
      <article>
        <span>Fecha</span>
        <strong>${dateShort(first.date)}</strong>
        <small>${owner}</small>
      </article>
      <article>
        <span>Servicio</span>
        <strong>${service}</strong>
        <small>${linkedOrder?.status || "Pendiente"}</small>
      </article>
      <article class="cost-only">
        <span>Total</span>
        <strong>${money(total)}</strong>
        <small>${money(costHa)}/ha</small>
      </article>
    </div>
    <div class="application-detail-kpis cost-only">
      <span>Productos ${money(productCost)}</span>
      <span>Labor ${money(laborCost)} (${money(laborCostHa)}/ha)</span>
      <span>Total ${money(total)}</span>
      <span>Total/ha ${money(costHa)}</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Dosis/ha</th>
            <th>Cantidad</th>
            <th>Ha</th>
            <th class="cost-only">Costo unit.</th>
            <th class="cost-only">Costo producto</th>
            <th class="cost-only">$/ha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.productName || productName(row.productId)}</td>
              <td>${number(row.dose, 2)}</td>
              <td>${number(row.usedQuantity, 2)}</td>
              <td>${number(row.hectares, 2)}</td>
              <td class="cost-only">${money(row.unitCost)}</td>
              <td class="cost-only">${money(row.productCost)}</td>
              <td class="cost-only">${money(row.hectares ? row.productCost / row.hectares : 0)}</td>
              <td>
                <div class="row-actions">
                  <button class="link-button" data-edit-application="${applicationKey(row)}">Editar</button>
                  <button class="link-button danger" data-delete-application="${applicationKey(row)}">Eliminar</button>
                </div>
              </td>
            </tr>
          `).join("")}
          ${laborCost ? `
            <tr class="service-row">
              <td>Labor / servicio</td>
              <td>${money(laborCostHa)}/ha</td>
              <td>${number(first.hectares, 2)}</td>
              <td>-</td>
              <td class="cost-only">-</td>
              <td class="cost-only">${money(laborCost)}</td>
              <td class="cost-only">${money(laborCostHa)}</td>
              <td>-</td>
            </tr>
          ` : ""}
        </tbody>
      </table>
    </div>
  `;

  detail.querySelectorAll("[data-edit-application]").forEach((button) => {
    button.addEventListener("click", () => editApplication(button.dataset.editApplication));
  });
  detail.querySelectorAll("[data-delete-application]").forEach((button) => {
    button.addEventListener("click", () => deleteApplication(button.dataset.deleteApplication));
  });
  detail.querySelector("[data-add-product-application]")?.addEventListener("click", () => addProductToApplication(applicationId));
  detail.querySelector("[data-copy-application-order]")?.addEventListener("click", () => copyApplicationOrder(applicationId));
  detail.querySelector("[data-print-application-order]")?.addEventListener("click", () => printApplicationOrder(applicationId));
}

function applicationOrderText(applicationId) {
  const rows = data.applications.filter((application) => application.id === applicationId);
  if (!rows.length) return "";
  const first = rows[0];
  const linkedOrder = orderById(first.orderId);
  const lot = findLot(first);
  const service = linkedOrder?.task || "Aplicación";
  const owner = linkedOrder?.owner || "-";
  const lines = [
    `Orden: ${service}`,
    `Número de aplicación: ${applicationId}`,
    `Número de orden: ${linkedOrder ? orderShortLabel(linkedOrder) : first.orderId || "-"}`,
    `Fecha: ${dateShort(first.date)}`,
    `Lote: ${lotName(first.lotId)}${lot?.farm ? ` (${lot.farm})` : ""}`,
    `Superficie: ${number(first.hectares, 2)} ha`,
    `Responsable/contratista: ${owner}`,
    "",
    "Productos:"
  ];
  rows.forEach((row) => {
    lines.push(`- ${row.productName || productName(row.productId)}: ${number(row.dose, 2)} dosis/ha - ${number(applicationQuantity(row), 2)} total`);
  });
  return lines.join("\n");
}

async function copyApplicationOrder(applicationId) {
  const orderId = data.applications.find((application) => application.id === applicationId)?.orderId;
  const text = orderById(orderId) ? orderShareText(orderId) : applicationOrderText(applicationId);
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Orden copiada para compartir");
  } catch {
    showToast("No se pudo copiar automaticamente");
  }
}

function printApplicationOrder(applicationId) {
  if (!applicationId) return;
  document.body.dataset.printApplicationId = applicationId;
  document.body.classList.add("printing-application-order");
  window.setTimeout(() => window.print(), 50);
}

function laborCostForOrder(order) {
  if (!order) return 0;
  const explicit = Number(order.laborCostTotal || 0);
  if (explicit) return explicit;
  return Number(order.laborCostHa || 0) * Number(order.plannedHectares || order.Hectareas_planificadas || 0);
}

function laborCostForApplicationRows(rows) {
  const first = rows[0];
  const linkedOrder = orderById(first?.orderId);
  if (linkedOrder) return laborCostForOrder(linkedOrder);
  return rows.reduce((sum, row) => sum + Number(row.laborCostTotal || 0), 0);
}

function updateApplicationDoseFromTotal() {
  const form = document.querySelector("#applicationForm");
  if (!form?.elements?.totalQuantity || !form.elements.dose) return;
  const total = parseDecimal(form.elements.totalQuantity.value);
  const hectares = parseDecimal(form.elements.hectares.value);
  if (total && hectares) form.elements.dose.value = (total / hectares).toFixed(4).replace(/\.?0+$/, "");
}

function updateApplicationTotalFromDose() {
  const form = document.querySelector("#applicationForm");
  if (!form?.elements?.totalQuantity || !form.elements.dose) return;
  const dose = parseDecimal(form.elements.dose.value);
  const hectares = parseDecimal(form.elements.hectares.value);
  if (dose && hectares) form.elements.totalQuantity.value = (dose * hectares).toFixed(4).replace(/\.?0+$/, "");
}

function openApplicationFormFromOrder(orderId) {
  const order = orderById(orderId);
  const form = document.querySelector("#applicationForm");
  if (!order || !form) return;

  resetForm(form);
  editingApplicationKey = "";
  highlightedApplicationId = "";
  applicationDraftOrderId = order.id;
  configureApplicationSubmitButtons(false);
  switchView("aplicaciones");
  renderApplications();
  document.querySelector("#applicationFormBand")?.classList.remove("hidden-panel");

  form.elements.date.value = order.date || todayValue();
  form.elements.lotId.value = order.lotId || "";
  form.elements.orderId.value = order.id;
  form.elements.id.value = suggestedApplicationId(order);
  form.elements.hectares.value = order.plannedHectares || order.Hectareas_planificadas || "";
  form.elements.laborCostHa.value = order.laborCostHa || 0;
  form.elements.productId.focus();
  showToast("Aplicación vinculada a la orden");
}

function suggestedApplicationId(order) {
  const existing = data.applications.find((application) => application.orderId === order.id)?.id;
  if (existing) return existing;
  const maxNumber = data.applications.reduce((max, application) => {
    const found = String(application.id || "").match(/APL-(\d+)/i);
    return found ? Math.max(max, Number(found[1])) : max;
  }, 0);
  return `APL-${String(maxNumber + 1).padStart(3, "0")}`;
}

function addProductToApplication(applicationId) {
  const rows = data.applications.filter((application) => application.id === applicationId);
  const first = rows[0];
  const form = document.querySelector("#applicationForm");
  if (!first || !form) return;

  const linkedOrder = orderById(first.orderId);
  resetForm(form);
  editingApplicationKey = "";
  highlightedApplicationId = "";
  applicationDraftOrderId = first.orderId || "";
  configureApplicationSubmitButtons(false);
  switchView("aplicaciones");
  document.querySelector("#applicationFormBand")?.classList.remove("hidden-panel");

  form.elements.date.value = first.date || linkedOrder?.date || todayValue();
  form.elements.lotId.value = first.lotId || linkedOrder?.lotId || "";
  form.elements.orderId.value = first.orderId || "";
  form.elements.id.value = first.id;
  form.elements.hectares.value = first.hectares || linkedOrder?.plannedHectares || "";
  form.elements.laborCostHa.value = linkedOrder ? Number(linkedOrder.laborCostHa || 0) : 0;
  form.elements.productId.focus();
  showToast(`Agregando producto a ${applicationId}`);
}

function editOrder(orderId) {
  const order = orderById(orderId);
  const form = document.querySelector("#orderForm");
  if (!order || !form) return;
  editingOrderId = orderId;
  form.elements.date.value = order.date || "";
  form.elements.lotId.value = order.lotId || "";
  form.elements.crop.value = order.crop || lotCrop(order.lotId) || "";
  form.elements.variety.value = order.variety || lotVariety(order.lotId) || "";
  form.elements.taskPreset.value = taskOptions().includes(order.task) ? order.task : "";
  form.elements.task.value = order.task || "";
  form.elements.plannedHectares.value = order.plannedHectares || "";
  form.elements.ownerPreset.value = contractorOptions().includes(order.owner) ? order.owner : "";
  form.elements.owner.value = order.owner || "";
  form.elements.laborCostHa.value = order.laborCostHa || 0;
  form.elements.status.value = order.status || "Pendiente";
  form.elements.notes.value = order.notes || "";
  if (form.elements.partner) form.elements.partner.value = order.partner || "";
  form.dataset.originalStatus = order.status || "Pendiente";
  form.dataset.defaultHectares = String(order.plannedHectares || "");
  form.querySelector('button[type="submit"]').textContent = "Actualizar orden";
  switchView("ordenes");
  document.querySelector("#orderFormBand")?.classList.remove("hidden-panel");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.task.focus();
  showToast("Editando orden");
}

function finishOrder(orderId) {
  const order = orderById(orderId);
  if (!order) return;
  requestOrderCompletionDate(orderId);
}

function requestOrderCompletionDate(orderId) {
  const order = orderById(orderId);
  const dialog = document.querySelector("#orderCompletionDialog");
  const dateInput = document.querySelector("#orderCompletionDate");
  if (!order || !dialog || !dateInput) return;
  pendingCompletionOrderId = orderId;
  dateInput.value = order.completionDate || todayValue();
  const description = document.querySelector("#orderCompletionDescription");
  if (description) description.textContent = `${orderShortLabel(order)} - ${lotName(order.lotId)} - ${order.task}`;
  dialog.showModal();
  dateInput.focus();
}

function completeOrder(orderId, completionDate) {
  const order = orderById(orderId);
  if (!order || !completionDate) return;
  order.status = "Finalizada";
  order.completionDate = completionDate;
  queueSync("orders", order, "update");
  saveData();
  renderAll();
  if (selectedOrderId === orderId && document.querySelector("#ficha-orden")?.classList.contains("active")) renderOrderDetail(orderId);
  showToast(`Orden finalizada el ${dateShort(completionDate)}`);
}

function deleteOrder(orderId) {
  const order = orderById(orderId);
  const linkedApplications = data.applications.filter((application) => application.orderId === orderId);
  const extra = linkedApplications.length ? `\n\nTambién se eliminarán ${linkedApplications.length} renglón(es) de aplicación vinculados y se devolverá el stock local.` : "";
  if (!order || !window.confirm(`¿Eliminar la orden "${order.task}"?${extra}`)) return;
  data.orders = data.orders.filter((item) => item.id !== orderId);
  linkedApplications.forEach((application) => {
    returnApplicationStock(application);
    queueSync("applications", { ...application }, "delete");
  });
  data.applications = data.applications.filter((application) => application.orderId !== orderId);
  queueSync("orders", { ...order }, "delete");
  saveData();
  renderAll();
  showToast("Orden eliminada");
}

function editMonitor(monitorId) {
  const monitor = data.monitors.find((item) => item.id === monitorId);
  const form = document.querySelector("#monitorForm");
  if (!monitor || !form) return;
  editingMonitorId = monitorId;
  form.elements.date.value = monitor.date || "";
  form.elements.lotId.value = monitor.lotId || "";
  form.elements.crop.value = monitor.crop || lotCrop(monitor.lotId) || "";
  form.elements.variety.value = lotVariety(monitor.lotId) || monitor.variety || "";
  form.elements.cropStatus.value = monitor.cropStatus || "";
  form.elements.weeds.value = monitor.weeds || "";
  form.elements.issues.value = monitor.issues || "";
  form.elements.recommendation.value = monitor.recommendation || "";
  form.elements.photoFile.value = "";
  monitorPhotoDraft = monitorPhotoSources(monitor.photo);
  updateMonitorPhotoPreview(monitorPhotoDraft);
  form.querySelector('button[type="submit"]').textContent = "Actualizar monitoreo";
  switchView("monitoreo");
  document.querySelector("#monitorFormBand")?.classList.remove("hidden-panel");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteMonitor(monitorId) {
  const monitor = data.monitors.find((item) => item.id === monitorId);
  if (!monitor || !window.confirm(`¿Eliminar el monitoreo del ${dateShort(monitor.date)}?`)) return;
  data.monitors = data.monitors.filter((item) => item.id !== monitorId);
  selectedMonitorId = selectedMonitorId === monitorId ? "" : selectedMonitorId;
  queueSync("monitors", { ...monitor }, "delete");
  saveData();
  renderAll();
  switchView("monitoreo");
  showToast("Monitoreo eliminado");
}

function editApplication(key) {
  const row = findApplicationByKey(key);
  const form = document.querySelector("#applicationForm");
  if (!row || !form) return;
  editingApplicationKey = key;
  applicationDraftOrderId = row.orderId || "";
  highlightedApplicationId = "";
  document.querySelector("#applicationFormBand")?.classList.remove("hidden-panel");
  form.elements.date.value = row.date || "";
  form.elements.lotId.value = row.lotId || "";
  form.elements.orderId.value = row.orderId || "";
  form.elements.id.value = row.id || "";
  form.elements.productId.value = row.productId || "";
  form.elements.dose.value = row.dose || "";
  if (form.elements.totalQuantity) form.elements.totalQuantity.value = row.usedQuantity || "";
  form.elements.hectares.value = row.hectares || "";
  form.elements.laborCostHa.value = row.laborCostHa || 0;
  configureApplicationSubmitButtons(true);
  switchView("aplicaciones");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteApplication(key) {
  const row = findApplicationByKey(key);
  if (!row || !window.confirm(`¿Eliminar ${row.productName || productName(row.productId)} de ${row.id}?`)) return;
  returnApplicationStock(row);
  data.applications = data.applications.filter((item) => applicationKey(item) !== key);
  queueSync("applications", { ...row }, "delete");
  saveData();
  renderAll();
  highlightedApplicationId = row.id;
  renderApplications();
  showToast("Aplicación eliminada");
}

function returnApplicationStock(application) {
  return application;
}

function recalculateApplicationsForProduct(product) {
  averageCostVersion += 1;
  data.applications.forEach((application) => {
    if (!productMatchesApplication(product, application)) return;
    const usedQuantity = applicationQuantity(application);
    const laborCostTotal = parseDecimal(application.laborCostTotal);
    const previousUnitCost = parseDecimal(application.unitCost);
    const previousProductCost = parseDecimal(application.productCost);
    const previousTotalCost = parseDecimal(application.totalCost);
    application.productName = product.name;
    application.unitCost = unitCostForProductDate(product, applicationPricingDate(application), application.unitCost);
    application.productCost = usedQuantity * application.unitCost;
    application.totalCost = application.productCost;
    if (
      Math.abs(previousUnitCost - application.unitCost) > 0.005
      || Math.abs(previousProductCost - application.productCost) > 0.005
      || Math.abs(previousTotalCost - application.totalCost) > 0.005
    ) queueSync("applications", application, "update", { auto: true });
  });
}

function editProduct(productId) {
  const product = data.products.find((item) => item.id === productId);
  const form = document.querySelector("#productForm");
  if (!product || !form) return;
  editingProductId = productId;
  resetDepositProductLines();
  setDepositLineValues(depositProductLines()[0], {
    name: product.name || "",
    type: product.type || "Otro",
    unit: product.unit || "",
    quantity: baseStock(product),
    unitCost: product.unitCost ?? ""
  });
  form.elements.warehouse.value = product.warehouse || "";
  if (form.elements.supplier) form.elements.supplier.value = product.supplier || "";
  form.elements.receiptNumber.value = "";
  form.elements.receiptDate.required = false;
  document.querySelector("#productFormTitle").textContent = "Editar producto";
  document.querySelector("#productQuantityLabel").firstChild.textContent = "Stock físico total ";
  form.querySelector('button[type="submit"]').textContent = "Guardar cambios";
  document.querySelector("#cancelProductEdit")?.classList.remove("hidden-panel");
  document.querySelector("#productFormBand")?.classList.remove("hidden-panel");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelProductEdit() {
  const form = document.querySelector("#productForm");
  editingProductId = "";
  if (form) resetForm(form);
  if (form) {
    form.elements.receiptDate.required = true;
    form.elements.receiptDate.value = todayValue();
    resetDepositProductLines();
  }
  document.querySelector("#productFormTitle").textContent = "Nuevo ingreso al depósito";
  document.querySelector("#productQuantityLabel").firstChild.textContent = "Cantidad ";
  if (form) form.querySelector('button[type="submit"]').textContent = "Guardar ingreso";
  document.querySelector("#productFormBand")?.classList.add("hidden-panel");
  document.querySelector("#cancelProductEdit")?.classList.remove("hidden-panel");
  syncDepositLineButtons();
}

function closeProductDetail() {
  selectedProductId = "";
  selectedReceiptKey = "";
  editingReceiptIndex = -1;
  editingReceiptLineKey = "";
  document.querySelector("#productDetail").innerHTML = "";
  switchView("stock");
}

function editReceipt(index) {
  editingReceiptIndex = index;
  renderProductDetail();
}

function saveReceiptEdit(index) {
  const product = data.products.find((item) => item.id === selectedProductId);
  const form = document.querySelector("#receiptEditForm");
  const entries = receiptEntries(product);
  const previous = entries[index];
  const targetProduct = data.products.find((item) => item.id === previous?.sourceProductId);
  const targetEntries = receiptEntriesForProduct(targetProduct);
  if (!targetProduct || !form || !previous) return;
  const values = formData(form);
  targetProduct.unit = values.unit?.trim() || targetProduct.unit || "";
  if (!previous.detailed) {
    targetEntries[previous.sourceIndex] = { number: values.number.trim(), supplier: values.supplier || previous.supplier || "", detailed: false };
    targetProduct.receiptNumbers = serializeReceiptEntries(targetEntries);
    targetProduct.supplier = values.supplier || targetProduct.supplier || "";
    queueSync("products", targetProduct, "update");
    saveData();
    editingReceiptIndex = -1;
    renderAll();
    renderProductDetail();
    showToast("Número de remito actualizado");
    return;
  }
  const nextQuantity = parseDecimal(values.quantity);
  const previousQuantity = parseDecimal(previous.quantity);
  targetEntries[previous.sourceIndex] = { number: values.number.trim(), date: values.date, quantity: nextQuantity, unitCost: parseDecimal(values.unitCost), supplier: values.supplier || previous.supplier || "", detailed: true };
  targetProduct.quantity = baseStock(targetProduct) + nextQuantity - previousQuantity;
  targetProduct.receiptNumbers = serializeReceiptEntries(targetEntries);
  targetProduct.supplier = values.supplier || targetProduct.supplier || "";
  refreshProductCurrentUnitCost(targetProduct);
  delete targetProduct.calculatedStock;
  delete targetProduct.applicationUse;
  queueSync("products", targetProduct, "update");
  recalculateApplicationsForProduct(targetProduct);
  saveData();
  editingReceiptIndex = -1;
  renderAll();
  renderProductDetail();
  showToast("Remito actualizado");
}

function deleteReceipt(index) {
  const product = data.products.find((item) => item.id === selectedProductId);
  const entries = receiptEntries(product);
  const removed = entries[index];
  const targetProduct = data.products.find((item) => item.id === removed?.sourceProductId);
  const targetEntries = receiptEntriesForProduct(targetProduct);
  if (!targetProduct || !removed) return;
  const detail = removed.detailed
    ? `Se restarán ${number(removed.quantity, 2)} ${product.unit || ""} del stock físico.`
    : "Es un antecedente sin cantidad discriminada: se quitará el número de remito sin modificar el stock.";
  if (!window.confirm(`¿Eliminar el remito ${removed.number}?\n\n${detail}`)) return;
  targetEntries.splice(removed.sourceIndex, 1);
  if (removed.detailed) targetProduct.quantity = baseStock(targetProduct) - parseDecimal(removed.quantity);
  targetProduct.receiptNumbers = serializeReceiptEntries(targetEntries);
  refreshProductCurrentUnitCost(targetProduct);
  delete targetProduct.calculatedStock;
  delete targetProduct.applicationUse;
  queueSync("products", targetProduct, "update");
  recalculateApplicationsForProduct(targetProduct);
  saveData();
  editingReceiptIndex = -1;
  renderAll();
  renderProductDetail();
  showToast("Remito eliminado");
}

function deleteReceiptGroup() {
  const rows = receiptRowsByKey(selectedReceiptKey).filter((entry) => entry.detailed);
  if (!rows.length) return;
  const group = receiptGroupFromRows(rows);
  const detail = rows
    .map((entry) => `${entry.sourceProductName || entry.product?.name || "Producto"}: ${number(entry.quantity, 2)} ${entry.sourceUnit || entry.product?.unit || ""}`)
    .join("\n");
  if (!window.confirm(`¿Eliminar el remito ${group.number} completo?\n\nSe quitarán ${rows.length} productos:\n${detail}`)) return;

  const changedProducts = new Set();
  rows
    .slice()
    .sort((a, b) => String(b.sourceProductId).localeCompare(String(a.sourceProductId)) || b.sourceIndex - a.sourceIndex)
    .forEach((entry) => {
      const targetProduct = data.products.find((item) => item.id === entry.sourceProductId);
      if (!targetProduct) return;
      const targetEntries = receiptEntriesForProduct(targetProduct);
      if (!targetEntries[entry.sourceIndex]) return;
      targetEntries.splice(entry.sourceIndex, 1);
      targetProduct.receiptNumbers = serializeReceiptEntries(targetEntries);
      targetProduct.quantity = receiptQuantityTotal(targetProduct);
      refreshProductCurrentUnitCost(targetProduct);
      delete targetProduct.calculatedStock;
      delete targetProduct.applicationUse;
      changedProducts.add(targetProduct.id);
    });

  changedProducts.forEach((productId) => {
    const product = data.products.find((item) => item.id === productId);
    if (!product) return;
    queueSync("products", product, "update");
    recalculateApplicationsForProduct(product);
  });

  selectedReceiptKey = "";
  editingReceiptLineKey = "";
  editingReceiptHeader = false;
  saveData();
  renderAll();
  switchView("stock");
  showToast("Remito eliminado");
}

function openReceiptDetail(key) {
  selectedReceiptKey = key;
  selectedProductId = "";
  editingReceiptLineKey = "";
  editingReceiptHeader = false;
  renderReceiptDetail();
  switchView("ficha-deposito");
}

function closeReceiptDetail() {
  selectedReceiptKey = "";
  editingReceiptLineKey = "";
  editingReceiptHeader = false;
  document.querySelector("#productDetail").innerHTML = "";
  switchView("stock");
}

function editReceiptHeader() {
  editingReceiptHeader = true;
  editingReceiptLineKey = "";
  renderReceiptDetail();
}

function editReceiptLine(key) {
  editingReceiptHeader = false;
  editingReceiptLineKey = key;
  renderReceiptDetail();
}

function saveReceiptHeaderEdit() {
  const rows = receiptRowsByKey(selectedReceiptKey).filter((entry) => entry.detailed);
  const form = document.querySelector("#receiptHeaderEditForm");
  if (!rows.length || !form) return;
  const values = formData(form);
  const nextNumber = values.number.trim() || "Sin remito";
  const nextDate = values.date || todayValue();
  const nextSupplier = values.supplier.trim();
  const nextWarehouse = values.warehouse.trim();
  const changedProducts = new Set();

  rows.forEach((entry) => {
    const targetProduct = data.products.find((item) => item.id === entry.sourceProductId);
    if (!targetProduct) return;
    const targetEntries = receiptEntriesForProduct(targetProduct);
    const targetEntry = targetEntries[entry.sourceIndex];
    if (!targetEntry) return;
    targetEntries[entry.sourceIndex] = {
      ...targetEntry,
      number: nextNumber,
      date: nextDate,
      supplier: nextSupplier,
      detailed: true
    };
    targetProduct.receiptNumbers = serializeReceiptEntries(targetEntries);
    targetProduct.supplier = nextSupplier || targetProduct.supplier || "";
    if (nextWarehouse) targetProduct.warehouse = nextWarehouse;
    refreshProductCurrentUnitCost(targetProduct);
    delete targetProduct.calculatedStock;
    delete targetProduct.applicationUse;
    if (!changedProducts.has(targetProduct.id)) {
      changedProducts.add(targetProduct.id);
      queueSync("products", targetProduct, "update");
      recalculateApplicationsForProduct(targetProduct);
    }
  });

  const firstProduct = data.products.find((item) => item.id === rows[0]?.sourceProductId);
  selectedReceiptKey = receiptGroupKey({
    number: nextNumber,
    date: nextDate,
    supplier: nextSupplier,
    product: firstProduct,
    sourceWarehouse: nextWarehouse || firstProduct?.warehouse || ""
  });
  editingReceiptHeader = false;
  editingReceiptLineKey = "";
  saveData();
  renderAll();
  renderReceiptDetail();
  showToast("Datos del remito actualizados");
}

function saveReceiptLineEdit(lineKey) {
  const rows = receiptRowsByKey(selectedReceiptKey);
  const previous = rows.find((entry) => receiptLineKey(entry) === lineKey);
  const form = document.querySelector("#receiptLineEditForm");
  const targetProduct = data.products.find((item) => item.id === previous?.sourceProductId);
  if (!previous || !targetProduct || !form) return;
  const values = formData(form);
  const targetEntries = receiptEntriesForProduct(targetProduct);
  const previousQuantity = parseDecimal(previous.quantity);
  const nextQuantity = parseDecimal(values.quantity);
  targetProduct.name = values.productName.trim() || targetProduct.name;
  targetProduct.type = values.type.trim() || targetProduct.type || "";
  targetProduct.unit = values.unit.trim() || targetProduct.unit || "";
  targetProduct.warehouse = values.warehouse.trim() || targetProduct.warehouse || "";
  targetProduct.supplier = values.supplier.trim() || targetProduct.supplier || "";
  targetEntries[previous.sourceIndex] = {
    number: values.number.trim() || previous.number || "Sin remito",
    date: values.date || previous.date || todayValue(),
    quantity: nextQuantity,
    unitCost: parseDecimal(values.unitCost),
    supplier: values.supplier.trim() || "",
    detailed: true
  };
  targetProduct.quantity = baseStock(targetProduct) + nextQuantity - previousQuantity;
  targetProduct.receiptNumbers = serializeReceiptEntries(targetEntries);
  refreshProductCurrentUnitCost(targetProduct);
  delete targetProduct.calculatedStock;
  delete targetProduct.applicationUse;
  queueSync("products", targetProduct, "update");
  recalculateApplicationsForProduct(targetProduct);
  saveData();
  selectedReceiptKey = receiptGroupKey({
    ...targetEntries[previous.sourceIndex],
    product: targetProduct,
    sourceWarehouse: targetProduct.warehouse
  });
  editingReceiptLineKey = "";
  renderAll();
  renderReceiptDetail();
  showToast("Producto del remito actualizado");
}

function renderReceiptDetail() {
  const detail = document.querySelector("#productDetail");
  if (!detail) return;
  const rows = receiptRowsByKey(selectedReceiptKey).filter((entry) => entry.detailed);
  if (!selectedReceiptKey || !rows.length) {
    detail.innerHTML = `<div class="empty">No encontré ese remito.</div>`;
    return;
  }
  const group = receiptGroupFromRows(rows);
  detail.innerHTML = `
    <div class="application-detail-header">
      ${editingReceiptHeader ? `
        <form class="form-grid compact-form receipt-header-form" id="receiptHeaderEditForm">
          <label>Remito <input name="number" value="${group.number || ""}" required /></label>
          <label>Fecha <input name="date" type="date" value="${group.date || ""}" required /></label>
          <label>Proveedor <input name="supplier" value="${group.supplier || ""}" list="supplierCatalogList" /></label>
          <label>Depósito <input name="warehouse" value="${group.warehouse || ""}" list="warehouseCatalogList" /></label>
          <div class="form-actions">
            <button type="submit">Guardar remito</button>
            <button class="link-button" data-cancel-receipt-header-edit type="button">Cancelar</button>
          </div>
        </form>
      ` : `
        <div>
          <span>Ficha de remito</span>
          <strong>${group.number}</strong>
          <span>${dateShort(group.date)} · ${group.supplier || "Sin proveedor"} · ${group.warehouse || "Sin depósito"}</span>
        </div>
      `}
      <div class="application-detail-kpis">
        <span>${group.rows.length} productos</span>
        <span>Total ${money(group.total)}</span>
      </div>
      <div class="button-row">
        ${editingReceiptHeader ? "" : `<button class="link-button primary" data-edit-receipt-header type="button">Editar remito</button>`}
        ${editingReceiptHeader ? "" : `<button class="link-button danger" data-delete-receipt-group type="button">Eliminar remito</button>`}
        <button class="link-button" data-close-receipt-detail type="button">Volver al depósito</button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Unidad</th>
            <th>Cantidad</th>
            <th>Costo unit.</th>
            <th>Total</th>
            <th>Depósito</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${group.rows.map((entry) => {
            const lineKey = receiptLineKey(entry);
            const product = entry.product || data.products.find((item) => item.id === entry.sourceProductId) || {};
            return editingReceiptLineKey === lineKey ? `<tr>
              <td colspan="8">
                <form class="form-grid compact-form" id="receiptLineEditForm">
                  <label>Remito <input name="number" value="${entry.number || ""}" required /></label>
                  <label>Fecha <input name="date" type="date" value="${entry.date || ""}" required /></label>
                  <label>Proveedor <input name="supplier" value="${entry.supplier || product.supplier || ""}" list="supplierCatalogList" /></label>
                  <label>Depósito <input name="warehouse" value="${entry.sourceWarehouse || product.warehouse || ""}" list="warehouseCatalogList" /></label>
                  <label>Producto <input name="productName" value="${entry.sourceProductName || product.name || ""}" list="productCatalogList" required /></label>
                  <label>Tipo <input name="type" value="${product.type || ""}" list="productTypeList" /></label>
                  <label>Unidad <input name="unit" value="${entry.sourceUnit || product.unit || ""}" required /></label>
                  <label>Cantidad <input name="quantity" type="text" inputmode="decimal" value="${entry.quantity || ""}" required /></label>
                  <label>Costo unit. <input name="unitCost" type="text" inputmode="decimal" value="${entry.unitCost || ""}" required /></label>
                  <div class="form-actions">
                    <button type="submit">Guardar cambios</button>
                    <button class="link-button" data-cancel-receipt-line-edit type="button">Cancelar</button>
                  </div>
                </form>
              </td>
            </tr>` : `<tr>
              <td><strong>${entry.sourceProductName || product.name || "-"}</strong></td>
              <td>${product.type || "-"}</td>
              <td>${entry.sourceUnit || product.unit || "-"}</td>
              <td>${number(entry.quantity, 2)} ${entry.sourceUnit || product.unit || ""}</td>
              <td>${money(entry.unitCost)}</td>
              <td>${money(parseDecimal(entry.quantity) * parseDecimal(entry.unitCost))}</td>
              <td>${entry.sourceWarehouse || product.warehouse || "-"}</td>
              <td><button class="link-button" data-edit-receipt-line="${lineKey}" type="button">Editar</button></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
  detail.querySelector("[data-close-receipt-detail]")?.addEventListener("click", closeReceiptDetail);
  detail.querySelector("[data-edit-receipt-header]")?.addEventListener("click", editReceiptHeader);
  detail.querySelector("[data-delete-receipt-group]")?.addEventListener("click", deleteReceiptGroup);
  detail.querySelector("[data-cancel-receipt-header-edit]")?.addEventListener("click", () => {
    editingReceiptHeader = false;
    renderReceiptDetail();
  });
  detail.querySelector("#receiptHeaderEditForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveReceiptHeaderEdit();
  });
  detail.querySelectorAll("[data-edit-receipt-line]").forEach((button) => button.addEventListener("click", () => editReceiptLine(button.dataset.editReceiptLine)));
  detail.querySelector("[data-cancel-receipt-line-edit]")?.addEventListener("click", () => {
    editingReceiptLineKey = "";
    renderReceiptDetail();
  });
  detail.querySelector("#receiptLineEditForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveReceiptLineEdit(editingReceiptLineKey);
  });
}

function renderProductDetail() {
  const product = data.products.find((item) => item.id === selectedProductId);
  const panel = document.querySelector("#productDetailPanel");
  const detail = document.querySelector("#productDetail");
  if (!panel || !detail) return;
  if (!product) {
    detail.innerHTML = "";
    return;
  }
  const stock = stockForProduct(product);
  const entries = receiptEntries(product)
    .map((entry, index) => ({ ...entry, detailIndex: index }))
    .sort((a, b) => {
      const dateComparison = String(b.date || "").localeCompare(String(a.date || ""));
      if (dateComparison) return dateComparison;
      return String(b.number || "").localeCompare(String(a.number || ""), "es", { sensitivity: "base", numeric: true });
    });
  const receiptPhoto = receiptPhotoSource(product);
  const warehouses = productWarehouseLabels(product);
  const outputs = data.applications
    .filter((application) => productMatchesApplication(product, application))
    .map((application) => ({ application, order: orderById(application.orderId) }))
    .sort((a, b) => String(b.order?.date || b.application.date || "").localeCompare(String(a.order?.date || a.application.date || "")));
  detail.innerHTML = `
    <div class="application-detail-header">
      <div>
        <strong>${product.name}</strong>
        <span>${product.type || "-"} · ${warehouses.join(", ") || "-"}</span>
      </div>
      <div class="application-detail-kpis">
        <span>Fisico ${number(stock.physical, 2)} ${product.unit || ""}</span>
        <span>Reservado ${number(stock.reserved, 2)} ${product.unit || ""}</span>
        <span>Disponible ${number(stock.available, 2)} ${product.unit || ""}</span>
      </div>
      <form class="min-stock-form" id="minStockForm">
        <label>Stock mínimo <input name="minStock" type="text" inputmode="decimal" value="${productMinStock(product) ? escapeHtml(String(productMinStock(product)).replace(".", ",")) : ""}" placeholder="Sin mínimo" /> ${escapeHtml(product.unit || "")}</label>
        <button class="link-button" type="submit">Guardar mínimo</button>
      </form>
      <div class="row-actions">
        <button class="link-button primary" data-edit-product-from-detail="${product.id}" type="button">Editar producto</button>
        <button class="link-button" data-close-product-detail type="button">Volver al depósito</button>
      </div>
    </div>
    <div class="deposit-detail-grid">
      <div>
        <h3>Ingresos al depósito</h3>
        ${receiptPhoto ? `<div class="receipt-photo-preview"><img src="${receiptPhoto}" alt="Foto de remito o factura" loading="lazy" /><a class="link-button" href="${receiptPhoto}" target="_blank" rel="noopener">Abrir foto</a></div>` : ""}
        <div class="table-wrap">
          <table>
            <thead><tr><th>Remito</th><th>Proveedor</th><th>Depósito</th><th>Fecha</th><th>Cantidad</th><th>Costo unit.</th></tr></thead>
            <tbody>
              ${entries.map((entry) => editingReceiptIndex === entry.detailIndex ? `<tr>
                <td colspan="6">
                  <form class="form-grid compact-form" id="receiptEditForm">
                    <label>Remito <input name="number" value="${entry.number}" required /></label>
                    <label>Proveedor <input name="supplier" value="${entry.supplier || ""}" list="supplierCatalogList" /></label>
                    <label>Unidad <input name="unit" value="${entry.sourceUnit || product.unit || ""}" placeholder="lt, kg, unidad" required /></label>
                    ${entry.detailed ? `
                      <label>Fecha <input name="date" type="date" value="${entry.date}" required /></label>
                      <label>Cantidad <input name="quantity" type="text" inputmode="decimal" value="${entry.quantity}" required /></label>
                      <label>Costo unit. <input name="unitCost" type="text" inputmode="decimal" value="${entry.unitCost}" required /></label>
                    ` : `<span class="panel-note">Este ingreso anterior no guardó cantidad discriminada. Podés corregir el número de remito.</span>`}
                    <div class="form-actions">
                      <button type="submit">Guardar cambios</button>
                      <button class="link-button" data-cancel-receipt-edit type="button">Cancelar</button>
                    </div>
                  </form>
                </td>
              </tr>` : `<tr>
                <td>${entry.number}</td>
                <td>${entry.supplier || "-"}</td>
                <td>${entry.sourceWarehouse || "-"}</td>
                <td>${entry.detailed ? dateShort(entry.date) : "-"}</td>
                <td>${entry.detailed ? `${number(entry.quantity, 2)} ${product.unit || ""}` : "Anterior sin detalle"}</td>
                <td>${entry.detailed ? money(entry.unitCost) : "-"} <button class="link-button" data-edit-receipt="${entry.detailIndex}" type="button">Editar</button> <button class="link-button danger" data-delete-receipt="${entry.detailIndex}" type="button">Eliminar</button></td>
              </tr>`).join("") || `<tr><td colspan="6">Todavía no hay ingresos identificados por remito.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3>Salidas vinculadas a ordenes</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Orden</th><th>Lote</th><th>Estado</th><th>Cantidad</th></tr></thead>
            <tbody>
              ${outputs.map(({ application, order }) => `<tr class="clickable-row" data-open-output-order="${order?.id || application.orderId || ""}">
                <td>${dateShort(order?.date || application.date)}</td>
                <td><button class="link-button small" type="button">${orderShortLabel(order || application.orderId)}</button></td>
                <td>${lotName(order?.lotId || application.lotId)}</td>
                <td>${order?.status || "Aplicada"}</td>
                <td>${number(applicationQuantity(application), 2)} ${product.unit || ""}</td>
              </tr>`).join("") || `<tr><td colspan="5">No hay salidas vinculadas a ordenes.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  detail.querySelector("[data-edit-product-from-detail]")?.addEventListener("click", () => editProduct(product.id));
  detail.querySelector("#minStockForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const raw = String(event.currentTarget.elements.minStock.value || "").trim();
    const minimum = raw ? parseDecimal(raw, NaN) : 0;
    if (!Number.isFinite(minimum) || minimum < 0) { showToast("Indicá un número válido"); return; }
    // Se guarda en el insumo del grupo que tenga más ingresos; en los demás depósitos se limpia para que no compitan.
    productGroupProducts(product).forEach((item) => {
      const value = item.id === product.id ? (minimum || "") : "";
      if (String(item.minStock ?? "") === String(value)) return;
      item.minStock = value;
      queueSync("products", item, "update");
    });
    saveData();
    renderAll();
    renderProductDetail();
    showToast(minimum ? `Stock mínimo: ${number(minimum, 2)} ${product.unit || ""}` : "Stock mínimo borrado");
  });
  detail.querySelector("[data-close-product-detail]")?.addEventListener("click", closeProductDetail);
  detail.querySelectorAll("[data-open-output-order]").forEach((row) => {
    row.addEventListener("click", () => {
      if (row.dataset.openOutputOrder) openOrderDetail(row.dataset.openOutputOrder, "ficha-deposito");
    });
  });
  detail.querySelectorAll("[data-edit-receipt]").forEach((button) => button.addEventListener("click", () => editReceipt(Number(button.dataset.editReceipt))));
  detail.querySelectorAll("[data-delete-receipt]").forEach((button) => button.addEventListener("click", () => deleteReceipt(Number(button.dataset.deleteReceipt))));
  detail.querySelector("[data-cancel-receipt-edit]")?.addEventListener("click", () => {
    editingReceiptIndex = -1;
    renderProductDetail();
  });
  detail.querySelector("#receiptEditForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveReceiptEdit(editingReceiptIndex);
  });
}

function ensureDepositTotalsPanel() {
  let panel = document.querySelector("#depositFilterTotals");
  if (panel) return panel;
  const productsPanel = document.querySelector("#productsTable")?.closest(".panel");
  const tableWrap = productsPanel?.querySelector(".table-wrap");
  if (!productsPanel || !tableWrap) return null;
  panel = document.createElement("div");
  panel.id = "depositFilterTotals";
  panel.className = "deposit-filter-totals";
  productsPanel.insertBefore(panel, tableWrap);
  return panel;
}

function ensureCompleteReceiptsTable() {
  let table = document.querySelector("#completeReceiptsTable");
  if (table) return table;
  const purchasesPanel = document.querySelector("#purchasesByDateTable")?.closest(".panel");
  if (!purchasesPanel) return null;
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.dataset.depositPanel = "comprobantes";
  panel.innerHTML = `
    <div class="panel-header">
      <h2>Remitos y facturas</h2>
      <span class="panel-note">Un renglón por comprobante. Tocá el número para abrirlo.</span>
    </div>
    <div class="table-wrap">
      <table class="compact-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Comprobante</th>
            <th>Tipo</th>
            <th>Proveedor</th>
            <th>Depósito</th>
            <th>Productos</th>
            <th>Total u$s</th>
          </tr>
        </thead>
        <tbody id="completeReceiptsTable"></tbody>
      </table>
    </div>
  `;
  purchasesPanel.insertAdjacentElement("beforebegin", panel);
  return panel.querySelector("#completeReceiptsTable");
}

function addUnitTotal(map, unit, value) {
  const key = unit || "";
  map.set(key, (map.get(key) || 0) + parseDecimal(value));
}

function formatUnitTotals(map) {
  const entries = Array.from(map.entries()).filter(([, value]) => Math.abs(value) >= 0.005);
  if (!entries.length) return "-";
  return entries.map(([unit, value]) => `${number(value, 2)} ${unit}`.trim()).join(" · ");
}

function openLotFormForNew() {
  const form = document.querySelector("#lotForm");
  const band = document.querySelector("#lotFormBand");
  if (!form || !band) return;
  editingLotId = "";
  resetForm(form);
  form.elements.campaign.value = activeCampaignValue();
  form.querySelector('button[type="submit"]').textContent = "Guardar lote";
  renderLots();
  band.classList.remove("hidden-panel");
  band.scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.name?.focus();
}

function configureApplicationSubmitButtons(editing = false) {
  const form = document.querySelector("#applicationForm");
  if (!form) return;
  const addButton = form.querySelector('[data-application-action="add"]');
  const finishButton = form.querySelector('[data-application-action="finish"]');
  if (addButton) addButton.textContent = editing ? "Actualizar producto" : "Agregar otro producto";
  finishButton?.classList.toggle("hidden-panel", editing);
}

function openApplicationFormForNew() {
  const form = document.querySelector("#applicationForm");
  const band = document.querySelector("#applicationFormBand");
  if (!form || !band) return;
  editingApplicationKey = "";
  applicationDraftOrderId = "";
  highlightedApplicationId = "";
  resetForm(form);
  form.elements.date.value = todayValue();
  form.elements.laborCostHa.value = 0;
  configureApplicationSubmitButtons(false);
  toggleManualProductInput(form);
  band.classList.remove("hidden-panel");
  band.scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.lotId?.focus();
}

function openClosureFormForNew() {
  const form = document.querySelector("#closureForm");
  const band = document.querySelector("#closureFormBand");
  if (!form || !band) return;
  editingClosureFormId = "";
  closureReturnView = "";
  resetForm(form);
  applyClosureDefaults(form, true);
  form.querySelector('button[type="submit"]').textContent = "Guardar cierre";
  band.classList.remove("hidden-panel");
  band.scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.lotId?.focus();
}

function cancelClosureForm() {
  editingClosureFormId = "";
  closureReturnView = "";
  const form = document.querySelector("#closureForm");
  if (form) {
    resetForm(form);
    applyClosureDefaults(form, true);
  }
  document.querySelector("#closureFormBand")?.classList.add("hidden-panel");
}

function openProductFormForNew() {
  const form = document.querySelector("#productForm");
  const band = document.querySelector("#productFormBand");
  if (!form || !band) return;
  editingProductId = "";
  resetForm(form);
  resetDepositProductLines();
  form.elements.receiptDate.required = true;
  form.elements.receiptDate.value = todayValue();
  if (form.elements.receiptPhotoFile) form.elements.receiptPhotoFile.value = "";
  document.querySelector("#productFormTitle").textContent = "Nuevo ingreso al depósito";
  document.querySelector("#productQuantityLabel").firstChild.textContent = "Cantidad ";
  form.querySelector('button[type="submit"]').textContent = "Guardar ingreso";
  document.querySelector("#cancelProductEdit")?.classList.remove("hidden-panel");
  band.classList.remove("hidden-panel");
  band.scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.receiptNumber?.focus();
}

function openOrderFormForNew() {
  const form = document.querySelector("#orderForm");
  const band = document.querySelector("#orderFormBand");
  if (!form || !band) return;
  editingOrderId = "";
  resetForm(form);
  form.elements.date.value = todayValue();
  form.elements.status.value = "Pendiente";
  form.elements.laborCostHa.value = 0;
  form.dataset.originalStatus = "Pendiente";
  form.dataset.completionDate = "";
  form.querySelector('button[type="submit"]').textContent = "Guardar orden";
  applyOrderLotDefaultHectares(true);
  applyLotDefaultCrop(form, true);
  applyLotDefaultVariety(form, true);
  band.classList.remove("hidden-panel");
  band.scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.lotId?.focus();
}

function openMonitorFormForNew() {
  const form = document.querySelector("#monitorForm");
  const band = document.querySelector("#monitorFormBand");
  if (!form || !band) return;
  editingMonitorId = "";
  resetForm(form);
  form.elements.date.value = todayValue();
  if (form.elements.photoFile) form.elements.photoFile.value = "";
  monitorPhotoDraft = [];
  updateMonitorPhotoPreview([]);
  form.querySelector('button[type="submit"]').textContent = "Guardar monitoreo";
  applyLotDefaultCrop(form, true);
  applyLotDefaultVariety(form, true);
  band.classList.remove("hidden-panel");
  band.scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.lotId?.focus();
}

function cancelOrderForm() {
  const form = document.querySelector("#orderForm");
  editingOrderId = "";
  if (form) resetForm(form);
  form?.querySelector('button[type="submit"]') && (form.querySelector('button[type="submit"]').textContent = "Guardar orden");
  document.querySelector("#orderFormBand")?.classList.add("hidden-panel");
}

function cancelMonitorForm() {
  const form = document.querySelector("#monitorForm");
  editingMonitorId = "";
  if (form) resetForm(form);
  if (form?.elements?.photoFile) form.elements.photoFile.value = "";
  monitorPhotoDraft = [];
  updateMonitorPhotoPreview([]);
  form?.querySelector('button[type="submit"]') && (form.querySelector('button[type="submit"]').textContent = "Guardar monitoreo");
  document.querySelector("#monitorFormBand")?.classList.add("hidden-panel");
}

function cancelApplicationForm() {
  const form = document.querySelector("#applicationForm");
  editingApplicationKey = "";
  applicationDraftOrderId = "";
  if (form) resetForm(form);
  configureApplicationSubmitButtons(false);
  document.querySelector("#applicationFormBand")?.classList.add("hidden-panel");
  renderApplications();
}

// ===== Solapas del depósito: Productos / Remitos y facturas =====
// La solapa elegida se recuerda en este dispositivo (solo comodidad; si no se puede guardar, arranca en Productos).
const depositTabStorageKey = "gestion-agro-deposito-solapa";
let depositTab = safeStorageGet(depositTabStorageKey) === "comprobantes" ? "comprobantes" : "productos";

function setDepositTab(tab) {
  depositTab = tab === "comprobantes" ? "comprobantes" : "productos";
  const view = document.querySelector("#stock");
  if (view) view.dataset.tab = depositTab;
  document.querySelectorAll("[data-deposit-tab]").forEach((button) => {
    const active = button.dataset.depositTab === depositTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  try { window.localStorage?.setItem(depositTabStorageKey, depositTab); } catch { /* sin almacenamiento: no pasa nada */ }
}

function setupDepositTabs() {
  const view = document.querySelector("#stock");
  if (!view || view.dataset.tabsBound) return;
  view.dataset.tabsBound = "true";
  document.querySelectorAll("[data-deposit-tab]").forEach((button) => button.addEventListener("click", () => setDepositTab(button.dataset.depositTab)));
  setDepositTab(depositTab);
}

function renderProducts() {
  const nameFilter = normalizeName(document.querySelector("#productNameFilter")?.value);
  const receiptFilter = normalizeName(document.querySelector("#productReceiptFilter")?.value);
  const dateFrom = document.querySelector("#productReceiptDateFrom")?.value || "";
  const dateTo = document.querySelector("#productReceiptDateTo")?.value || "";
  const dateSort = document.querySelector("#productReceiptDateSort")?.value || "desc";
  const productsForDisplay = displayProducts();
  const catalog = [...new Set(productsForDisplay.map((product) => product.name).filter(Boolean))].sort(compareText);
  const catalogList = document.querySelector("#productCatalogList");
  if (catalogList) catalogList.innerHTML = catalog.map((name) => `<option value="${name}"></option>`).join("");
  const receiptCatalog = [...new Set(productsForDisplay.flatMap(receiptLabels))].sort(compareText);
  const receiptCatalogList = document.querySelector("#receiptCatalogList");
  if (receiptCatalogList) receiptCatalogList.innerHTML = receiptCatalog.map((number) => `<option value="${number}"></option>`).join("");
  const warehouseCatalog = [...new Set(data.products.map((product) => product.warehouse).filter(Boolean))].sort(compareText);
  const warehouseList = document.querySelector("#warehouseCatalogList");
  if (warehouseList) warehouseList.innerHTML = warehouseCatalog.map((warehouse) => `<option value="${warehouse}"></option>`).join("");
  const supplierCatalog = [...new Set(data.products.flatMap((product) =>
    receiptEntriesForProduct(product).map((entry) => entry.supplier || product.supplier).concat(product.supplier || [])
  ).filter(Boolean))].sort(compareText);
  const supplierList = document.querySelector("#supplierCatalogList");
  if (supplierList) supplierList.innerHTML = supplierCatalog.map((supplier) => `<option value="${supplier}"></option>`).join("");
  const filteredProducts = productsForDisplay.filter((product) => {
    if (nameFilter && !normalizeName(product.name).includes(nameFilter)) return false;
    return true;
  });
  setupDepositTabs();
  const vouchersById = new Map((data.vouchers || []).map((voucher) => [voucher.id, voucher]));
  const receiptLink = (entry, label = entry.number || "Sin número") => `<button class="receipt-link" type="button" data-open-receipt-key="${escapeHtml(receiptGroupKey(entry))}" title="Abrir comprobante">${escapeHtml(label)}</button>`;

  document.querySelector("#productsTable").innerHTML = filteredProducts
    .map((product) => {
      const stock = stockForProduct(product);
      const unitCost = productDisplayUnitCost(product);
      const warehouses = productWarehouseLabels(product);
      return `
      <tr class="clickable-row" data-open-product="${product.id}">
        <td>${product.name} ${syncBadge(product)}</td>
        <td>${product.type}</td>
        <td>${number(stock.physical, 2)} ${product.unit}</td>
        <td>${number(stock.reserved, 2)} ${product.unit}</td>
        <td>${number(stock.available, 2)} ${product.unit}</td>
        <td>${money(unitCost)}</td>
        <td>${money(stock.available * unitCost)}</td>
        <td class="nowrap" title="${escapeHtml(warehouses.join(", "))}">${escapeHtml(warehouses[0] || "-")}${warehouses.length > 1 ? ` <small class="muted">+${warehouses.length - 1}</small>` : ""}${product.status && product.status !== "OK" ? ` ${statusBadge(product.status)}` : ""}</td>
        <td class="receipt-cell nowrap">${(() => {
          // Una sola línea: el comprobante más reciente (navegable) y cuántos más hay (abre la ficha con todos).
          const entries = receiptEntries(product)
            .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
          if (!entries.length) return "-";
          const latest = entries[0];
          const more = entries.length > 1 ? ` <button class="link-button receipt-more" type="button" data-open-product-receipts="${escapeHtml(product.id)}" title="Ver los ${entries.length} comprobantes">+${entries.length - 1}</button>` : "";
          return `${receiptLink(latest)}${latest.date ? ` <small class="muted">${dateShort(latest.date)}</small>` : ""}${more}`;
        })()}</td>
        <td><button class="link-button" data-edit-product="${product.id}" type="button">Editar</button></td>
      </tr>
    `;
    })
    .join("") || `<tr><td colspan="13">No hay productos para mostrar.</td></tr>`;

  const purchases = productsForDisplay.flatMap((product) =>
    receiptEntries(product)
      .filter((entry) => entry.detailed)
      .map((entry) => ({ ...entry, product }))
  ).filter((entry) => {
    if (nameFilter && !normalizeName(entry.product.name).includes(nameFilter)) return false;
    if (receiptFilter && !normalizeName(entry.number).includes(receiptFilter)) return false;
    if (dateFrom && (!entry.date || entry.date < dateFrom)) return false;
    if (dateTo && (!entry.date || entry.date > dateTo)) return false;
    return true;
  }).sort((a, b) => {
    const comparison = String(a.date || "").localeCompare(String(b.date || ""));
    return dateSort === "asc" ? comparison : -comparison;
  });

  document.querySelector("#depositFilterTotals")?.remove();
  const purchasesHeader = document.querySelector("#purchasesByDateTable")?.closest("table")?.querySelector("thead tr");
  if (purchasesHeader && !purchasesHeader.querySelector("[data-supplier-column]")) {
    const supplierHeader = document.createElement("th");
    supplierHeader.dataset.supplierColumn = "true";
    supplierHeader.textContent = "Proveedor";
    purchasesHeader.insertBefore(supplierHeader, purchasesHeader.lastElementChild);
  }

  document.querySelector("#purchasesByDateTable").innerHTML = purchases.map((entry) => `
    <tr class="clickable-row" data-open-product="${entry.product.id}">
      <td>${dateShort(entry.date)}</td>
      <td>${entry.product.name}</td>
      <td class="nowrap">${entry.number ? receiptLink({ ...entry, supplier: entry.supplier || entry.product.supplier || "", sourceWarehouse: entry.sourceWarehouse || entry.product.warehouse || "" }) : "-"}</td>
      <td>${number(entry.quantity, 2)} ${entry.sourceUnit || entry.product.unit || ""}</td>
      <td>${money(entry.unitCost)}</td>
      <td>${money(parseDecimal(entry.quantity) * parseDecimal(entry.unitCost))}</td>
      <td>${entry.supplier || entry.product.supplier || "-"}</td>
      <td>${entry.sourceWarehouse || entry.product.warehouse || "-"}</td>
    </tr>
  `).join("") || `<tr><td colspan="8">No hay compras para los filtros seleccionados.</td></tr>`;

  const receiptGroups = new Map();
  purchases.forEach((entry) => {
    const supplier = entry.supplier || entry.product.supplier || "";
    const warehouse = entry.sourceWarehouse || entry.product.warehouse || "";
    const key = receiptGroupKey({ ...entry, supplier, sourceWarehouse: warehouse });
    if (!receiptGroups.has(key)) {
      receiptGroups.set(key, {
        number: entry.number || "Sin remito",
        date: entry.date || "",
        supplier,
        warehouse,
        products: [],
        total: 0,
        voucher: entry.voucherId ? vouchersById.get(entry.voucherId) : null,
        key
      });
    }
    const group = receiptGroups.get(key);
    if (!group.voucher && entry.voucherId) group.voucher = vouchersById.get(entry.voucherId) || null;
    group.products.push(`${entry.sourceProductName || entry.product.name}: ${number(entry.quantity, 2)} ${entry.sourceUnit || entry.product.unit || ""}`);
    group.total += parseDecimal(entry.quantity) * parseDecimal(entry.unitCost);
  });
  const completeReceiptsTable = ensureCompleteReceiptsTable();
  if (completeReceiptsTable) {
    const groups = Array.from(receiptGroups.values());
    completeReceiptsTable.innerHTML = groups.map((group) => {
      // Una línea: primer producto y cuántos más (la lista completa en el título y en el comprobante).
      const shown = escapeHtml(group.products[0] || "-");
      const extra = group.products.length > 1 ? ` <small class="muted">+${group.products.length - 1}</small>` : "";
      return `
      <tr class="clickable-row" data-open-receipt="${escapeHtml(group.key)}">
        <td class="nowrap">${dateShort(group.date)}</td>
        <td class="nowrap"><button class="receipt-link" type="button" data-open-receipt-key="${escapeHtml(group.key)}">${escapeHtml(group.number)}</button></td>
        <td>${escapeHtml(group.voucher?.type || "-")}</td>
        <td>${escapeHtml(group.supplier || "-")}</td>
        <td>${escapeHtml(group.warehouse || "-")}</td>
        <td class="products-cell" title="${escapeHtml(group.products.join("\n"))}">${shown}${extra}</td>
        <td class="nowrap">${money(group.total)}</td>
      </tr>`;
    }).join("") || `<tr><td colspan="7">No hay remitos ni facturas para los filtros seleccionados.</td></tr>`;
    const receiptsCount = document.querySelector("#depositCountReceipts");
    if (receiptsCount) receiptsCount.textContent = groups.length ? String(groups.length) : "";
  }
  const productsCount = document.querySelector("#depositCountProducts");
  if (productsCount) productsCount.textContent = filteredProducts.length ? String(filteredProducts.length) : "";
  document.querySelectorAll("#stock [data-open-receipt-key]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openReceiptDetail(button.dataset.openReceiptKey);
    });
  });
  document.querySelectorAll("#stock [data-open-product-receipts]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectedProductId = button.dataset.openProductReceipts;
      selectedReceiptKey = "";
      editingReceiptIndex = -1;
      renderProductDetail();
      switchView("ficha-deposito");
    });
  });

  document.querySelectorAll("[data-edit-product]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      editProduct(button.dataset.editProduct);
    });
  });
  document.querySelectorAll("#productsTable tr[data-open-product]").forEach((row) => {
    row.addEventListener("click", () => {
      selectedProductId = row.dataset.openProduct;
      editingReceiptIndex = -1;
      renderProductDetail();
      switchView("ficha-deposito");
    });
  });
  document.querySelectorAll("#purchasesByDateTable tr[data-open-product]").forEach((row) => {
    row.addEventListener("click", () => {
      selectedProductId = row.dataset.openProduct;
      editingReceiptIndex = -1;
      renderProductDetail();
      switchView("ficha-deposito");
    });
  });
  document.querySelectorAll("#completeReceiptsTable tr[data-open-receipt]").forEach((row) => {
    row.addEventListener("click", () => {
      openReceiptDetail(row.dataset.openReceipt);
    });
  });
  if (selectedReceiptKey) renderReceiptDetail();
  else renderProductDetail();
}

const COST_CATEGORY_ORDER = ["labor", "herbicides", "insecticides", "fungicides", "fertilizers", "seeds", "adjuvants", "others"];
const COST_CATEGORY_META = {
  labor: { label: "Labores", color: "#2f7d4a" },
  herbicides: { label: "Herbicidas", color: "#7aa35a" },
  insecticides: { label: "Insecticidas", color: "#c46f1a" },
  fungicides: { label: "Fungicidas", color: "#6d5bd0" },
  fertilizers: { label: "Fertilizantes", color: "#3478a6" },
  seeds: { label: "Semillas/Curasem.", color: "#b8791f" },
  adjuvants: { label: "Coadyuvantes", color: "#0f766e" },
  others: { label: "Otros", color: "#86938e" }
};

function emptyLotCostRecord(lot) {
  const record = { lot, total: 0, entries: [] };
  COST_CATEGORY_ORDER.forEach((category) => {
    record[category] = 0;
  });
  return record;
}

function emptyCategoryTotals() {
  const totals = { total: 0 };
  COST_CATEGORY_ORDER.forEach((category) => {
    totals[category] = 0;
  });
  return totals;
}

function costCategory(type) {
  const normalized = normalizeName(type);
  if (normalized.includes("herbicida")) return "herbicides";
  if (normalized.includes("insecticida")) return "insecticides";
  if (normalized.includes("fungicida")) return "fungicides";
  if (normalized.includes("fertilizante")) return "fertilizers";
  if (normalized.includes("semilla") || normalized.includes("inoculante") || normalized.includes("curasemilla")) return "seeds";
  if (normalized.includes("coadyuvante")) return "adjuvants";
  return "others";
}

function lotCostParts(row) {
  return COST_CATEGORY_ORDER
    .map((category) => ({
      category,
      label: costCategoryLabel(category),
      amount: parseDecimal(row?.[category]),
      color: COST_CATEGORY_META[category]?.color || COST_CATEGORY_META.others.color
    }))
    .filter((part) => part.amount > 0);
}

function costForLot(lot) {
  return buildLotCosts().find((item) => item.lot.id === lot.id) || emptyLotCostRecord(lot);
}

// ===== Campaña elegida en Costos =====
// Vacío = la campaña activa (la más reciente de los lotes). Antes cada lote mostraba su propia campaña actual,
// y no se podía ver una campaña anterior.
let selectedCostCampaign = "";

function costCampaignOptions() {
  const values = [...data.orders, ...data.applications, ...data.closures, ...data.lots]
    .map((record) => normalizeCampaignValue(record?.campaign))
    .filter((value) => /^\d{4}\/\d{2}$/.test(value));
  return [...new Set(values)].sort((a, b) => b.localeCompare(a));
}

function currentCostCampaign() {
  return normalizeCampaignValue(selectedCostCampaign || activeCampaignValue());
}

function buildLotCosts(campaign = currentCostCampaign()) {
  const cache = derivedData();
  cache.lotCosts ||= new Map();
  if (!cache.lotCosts.has(campaign)) cache.lotCosts.set(campaign, computeLotCosts(campaign));
  return cache.lotCosts.get(campaign);
}

function computeLotCosts(campaign) {
  const byLot = new Map(data.lots.map((lot) => [lot.id, emptyLotCostRecord(lot)]));

  data.orders.forEach((order) => {
    if (order.status === "Cancelada") return;
    const lot = findLot(order);
    const item = lot ? byLot.get(lot.id) : null;
    const laborTotal = laborCostForOrder(order);
    if (!item || !recordMatchesCampaign(order, lot, campaign)) return;
    const hectares = parseDecimal(order.plannedHectares || order.Hectareas_planificadas);
    item.labor += laborTotal;
    item.entries.push({
      crop: orderCostCrop(order, lot, campaign),
      date: order.date || "",
      orderId: order.id || "-",
      task: order.task || "Labor / servicio",
      description: order.owner ? `Labor / servicio · ${order.owner}` : "Labor / servicio",
      category: "labor",
      quantity: hectares,
      unit: "ha",
      unitCost: hectares ? laborTotal / hectares : parseDecimal(order.laborCostHa),
      total: laborTotal,
      pendingCost: !laborTotal
    });
  });

  uniqueApplicationRows(data.applications).forEach((application) => {
    const lot = findLot(application);
    const item = lot ? byLot.get(lot.id) : null;
    if (!item || !recordMatchesCampaign(application, lot, campaign)) return;
    const category = costCategory(productType(application.productId));
    const productCost = applicationProductCost(application);
    const unitCost = applicationUnitCost(application);
    const order = orderById(application.orderId);
    item[category] += productCost;
    const entryCrop = applicationCostCrop(application, lot, campaign);
    item.entries.push({
      crop: entryCrop,
      date: applicationPricingDate(application),
      orderId: application.orderId || "-",
      task: order?.task || "Aplicación",
      description: application.productName || productName(application.productId),
      category,
      quantity: applicationQuantity(application),
      unit: applicationProduct(application)?.unit || "",
      unitCost,
      total: productCost
    });

    if (!order) {
      const laborTotal = Number(application.laborCostTotal || 0);
      item.labor += laborTotal;
      if (laborTotal) item.entries.push({
        crop: entryCrop,
        date: applicationPricingDate(application),
        orderId: application.orderId || "-",
        task: order?.task || "Labor / servicio",
        description: "Labor / servicio",
        category: "labor",
        quantity: parseDecimal(application.hectares),
        unit: "ha",
        unitCost: parseDecimal(application.laborCostHa),
        total: laborTotal
      });
    }
  });

  byLot.forEach((item) => {
    item.total = COST_CATEGORY_ORDER.reduce((sum, category) => sum + parseDecimal(item[category]), 0);
  });

  return Array.from(byLot.values()).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);
}

function renderCostCampaignSelect() {
  const select = document.querySelector("#costCampaignSelect");
  if (!select) return;
  const campaign = currentCostCampaign();
  const options = costCampaignOptions();
  if (campaign && !options.includes(campaign)) options.unshift(campaign);
  select.innerHTML = options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}${value === activeCampaignValue() ? " (actual)" : ""}</option>`).join("");
  select.value = campaign;
  if (!select.dataset.bound) {
    select.dataset.bound = "true";
    select.addEventListener("change", () => {
      selectedCostCampaign = select.value === activeCampaignValue() ? "" : select.value;
      renderCosts();
      if (selectedCostLotId) renderLotCostDetail();
      if (selectedCostCategory) renderCostCategoryDetail();
    });
  }
  const note = document.querySelector("#costCampaignNote");
  if (note) note.textContent = campaign === activeCampaignValue() ? "Campaña en curso" : "Campaña anterior: solo lo cargado en la app para esa campaña";
}

function renderCosts() {
  renderCostCampaignSelect();
  const campaign = currentCostCampaign();
  const rows = buildLotCosts(campaign);
  const totals = rows.reduce((acc, row) => {
    COST_CATEGORY_ORDER.forEach((category) => {
      acc[category] += parseDecimal(row[category]);
    });
    acc.total += row.total;
    return acc;
  }, emptyCategoryTotals());

  document.querySelector("#costSummary").innerHTML = `
    <article class="clickable-card" data-open-cost-category="all"><span>Total costos</span><strong>${money(totals.total)}</strong></article>
    <article class="clickable-card" data-open-cost-category="labor"><span>Labores</span><strong>${money(totals.labor)}</strong></article>
    <article class="clickable-card" data-open-cost-category="herbicides"><span>Herbicidas</span><strong>${money(totals.herbicides)}</strong></article>
    <article class="clickable-card" data-open-cost-category="seeds-fertilizers"><span>Semillas/Fert.</span><strong>${money(totals.seeds + totals.fertilizers)}</strong></article>
  `;

  document.querySelector("#costCards").innerHTML = rows.map((row) => {
    const parts = lotCostParts(row);

    return `
      <article class="cost-card" data-open-cost-lot="${row.lot.id}">
        <div class="cost-card-head">
          <div><strong>${displayLotName(row.lot)}</strong><span>${row.lot.farm} · ${campaign || "-"} · ${number(row.lot.hectares, 2)} ha</span></div>
          <b>${money(row.total)}</b>
        </div>
        <div class="cost-bar">
          ${parts.map((part) => `<span style="width:${((part.amount / row.total) * 100).toFixed(2)}%; background:${part.color}"></span>`).join("")}
        </div>
        <div class="cost-legend">
          ${parts.map((part) => `<span>${part.label} ${number((part.amount / row.total) * 100, 1)}%</span>`).join("")}
        </div>
      </article>
    `;
  }).join("") || `<div class="empty">Todavía no hay costos cargados.</div>`;

  document.querySelector("#costTable").innerHTML = rows.map((row) => `
    <tr class="clickable-row" data-open-cost-lot="${row.lot.id}">
      <td>${displayLotName(row.lot)}</td>
      <td>${campaign || "-"}</td>
      <td>${number(row.lot.hectares, 2)}</td>
      <td>${money(row.labor)}</td>
      <td>${money(row.herbicides)}</td>
      <td>${money(row.insecticides)}</td>
      <td>${money(row.fungicides)}</td>
      <td>${money(row.fertilizers)}</td>
      <td>${money(row.seeds)}</td>
      <td>${money(row.adjuvants)}</td>
      <td>${money(row.others)}</td>
      <td>${money(row.total)}</td>
      <td>${money(row.total / row.lot.hectares)}</td>
    </tr>
  `).join("") || `<tr><td colspan="13">Todavía no hay costos cargados.</td></tr>`;

  document.querySelectorAll("[data-open-cost-lot]").forEach((element) => {
    element.addEventListener("click", () => openLotCostDetail(element.dataset.openCostLot));
  });
  document.querySelectorAll("[data-open-cost-category]").forEach((element) => {
    element.addEventListener("click", () => openCostCategoryDetail(element.dataset.openCostCategory));
  });
  renderMargins(campaign);
  if (selectedCostLotId) renderLotCostDetail();
  if (selectedCostCategory) renderCostCategoryDetail();
}

// ===== Margen bruto por lote y campaña =====
// Ingreso: kg cosechados / 1000 × precio por tn de cada cierre (un lote puede tener dos cultivos en la campaña).
// Costos: insumos + labores cargados en la app para esa campaña + "otros costos" de los cierres.
// Se calcula en vivo: si cambia un precio de insumo o una labor, el margen se actualiza solo.
function buildLotMargins(campaign = currentCostCampaign()) {
  const costsByLot = new Map(buildLotCosts(campaign).map((row) => [row.lot.id, row]));
  const rows = [];
  data.lots.forEach((lot) => {
    const closures = lotRotationSequence(lot, campaign);
    const costRow = costsByLot.get(lot.id);
    if (!closures.length && !costRow) return;
    if (closures.length <= 1) {
      rows.push(buildMarginRow(lot, closures, costRow?.total || 0));
      return;
    }
    // Doble cultivo: cada costo va al cultivo de su orden; lo que no tiene cultivo, al primero de la campaña.
    const crops = closures.map((closure) => canonicalCropName(closure.crop));
    const costByCrop = new Map();
    (costRow?.entries || []).forEach((entry) => {
      const crop = crops.includes(entry.crop) ? entry.crop : crops[0];
      costByCrop.set(crop, (costByCrop.get(crop) || 0) + parseDecimal(entry.total));
    });
    closures.forEach((closure) => rows.push(buildMarginRow(lot, [closure], costByCrop.get(canonicalCropName(closure.crop)) || 0, true)));
  });
  return rows.sort((a, b) => (b.complete - a.complete) || (b.marginHa - a.marginHa) || (b.appCosts - a.appCosts));
}

function buildMarginRow(lot, closures, appCosts, partOfRotation = false) {
  {
    // Campañas anteriores a la app: si el cierre tiene costos de aplicación cargados a mano, se usan esos.
    if (!(appCosts > 0)) {
      const manual = closures.reduce((sum, closure) => sum + (closure.applicationCostsManual === true || closure.applicationCostsManual === "TRUE" ? parseDecimal(closure.applicationCosts) : 0), 0);
      if (manual > 0) appCosts = manual;
    }
    const harvestedHectares = Math.max(...closures.map((closure) => parseDecimal(closure.hectares)), 0);
    const hectares = harvestedHectares || parseDecimal(lot.hectares);
    const kg = closures.reduce((sum, closure) => sum + parseDecimal(closure.kgHarvested), 0);
    const income = closures.reduce((sum, closure) => sum + parseDecimal(closure.kgHarvested) / 1000 * parseDecimal(closure.priceTon), 0);
    const otherCosts = closures.reduce((sum, closure) => sum + parseDecimal(closure.otherCosts), 0);
    const totalCosts = appCosts + otherCosts;
    const priced = closures.filter((closure) => parseDecimal(closure.kgHarvested) > 0 && parseDecimal(closure.priceTon) > 0);
    const avgPrice = priced.length
      ? priced.reduce((sum, closure) => sum + parseDecimal(closure.kgHarvested) * parseDecimal(closure.priceTon), 0) / priced.reduce((sum, closure) => sum + parseDecimal(closure.kgHarvested), 0)
      : 0;
    let status = "Completo";
    if (!closures.length) status = "Sin cierre de campaña";
    else if (!(kg > 0)) status = "Falta rinde";
    else if (priced.length < closures.filter((closure) => parseDecimal(closure.kgHarvested) > 0).length) status = "Falta precio";
    else if (!(appCosts > 0)) status = "Sin costos en la app";
    // Ningún cultivo cuesta menos de u$s 50/ha: si da menos, faltan cargar labores o insumos de esa campaña.
    else if (hectares && appCosts / hectares < 50) status = `Costos incompletos (u$s ${number(appCosts / hectares, 0)}/ha)`;
    const complete = status === "Completo";
    const yieldText = closures
      .filter((closure) => parseDecimal(closure.kgHarvested) > 0)
      .map((closure) => {
        const ha = parseDecimal(closure.hectares) || parseDecimal(lot.hectares);
        return `${canonicalCropName(closure.crop) || "-"} ${number(ha ? parseDecimal(closure.kgHarvested) / ha : 0, 0)}`;
      })
      .join(" · ");
    return {
      lot,
      partOfRotation,
      closures,
      yieldText,
      singleCrop: closures.length <= 1,
      crops: [...new Set(closures.map((closure) => canonicalCropName(closure.crop)).filter(Boolean))].join(" / ") || lotCrop(lot.id) || "-",
      hectares,
      yieldKgHa: hectares && kg ? kg / hectares : 0,
      avgPrice,
      income,
      appCosts,
      otherCosts,
      margin: income - totalCosts,
      marginHa: hectares ? (income - totalCosts) / hectares : 0,
      // Rinde de indiferencia: solo con un cultivo (con doble cultivo no hay un único rinde que cubra los costos).
      breakEvenKgHa: closures.length <= 1 && avgPrice && hectares ? totalCosts / (avgPrice / 1000) / hectares : 0,
      status,
      complete
    };
  }
}

function renderMargins(campaign = currentCostCampaign()) {
  const table = document.querySelector("#marginTable");
  const summary = document.querySelector("#marginSummary");
  if (!table || !summary) return;
  const rows = buildLotMargins(campaign);
  const complete = rows.filter((row) => row.complete);
  const sum = (list, field) => list.reduce((total, row) => total + row[field], 0);
  const completeHa = sum(complete, "hectares");
  summary.innerHTML = `
    <article><span>Ingreso (lotes completos)</span><strong>${money(sum(complete, "income"))}</strong></article>
    <article><span>Costos (lotes completos)</span><strong>${money(sum(complete, "appCosts") + sum(complete, "otherCosts"))}</strong></article>
    <article><span>Margen bruto</span><strong>${money(sum(complete, "margin"))}</strong></article>
    <article><span>Margen promedio</span><strong>${completeHa ? `${money(sum(complete, "margin") / completeHa)}/ha` : "-"}</strong></article>
    <article><span>Lotes con margen completo</span><strong>${complete.length} de ${rows.length}</strong></article>`;
  const cell = (ok, value) => ok ? value : "-";
  table.innerHTML = rows.map((row) => `
    <tr class="clickable-row ${row.complete ? "" : "row-incomplete"}" data-open-margin-lot="${escapeHtml(row.lot.id)}">
      <td>${escapeHtml(displayLotName(row.lot))}</td>
      <td>${escapeHtml(row.crops)}</td>
      <td>${number(row.hectares, 1)}</td>
      <td class="nowrap">${row.closures.filter((closure) => parseDecimal(closure.kgHarvested) > 0).map((closure) => {
        const ha = parseDecimal(closure.hectares) || parseDecimal(row.lot.hectares);
        return `<div>${row.singleCrop ? "" : `<small>${escapeHtml(canonicalCropName(closure.crop))}</small> `}${number(ha ? parseDecimal(closure.kgHarvested) / ha : 0, 0)}</div>`;
      }).join("") || "-"}</td>
      <td class="nowrap">${row.closures.filter((closure) => parseDecimal(closure.kgHarvested) > 0).map((closure) => `<div>${row.singleCrop ? "" : `<small>${escapeHtml(canonicalCropName(closure.crop))}</small> `}${parseDecimal(closure.priceTon) > 0 ? number(parseDecimal(closure.priceTon), 0) : "falta"}</div>`).join("") || "-"}</td>
      <td>${cell(row.income, money(row.income))}</td>
      <td>${money(row.appCosts)}</td>
      <td>${row.otherCosts ? money(row.otherCosts) : "-"}</td>
      <td class="${row.complete ? (row.margin >= 0 ? "value-good" : "value-bad") : ""}">${row.complete ? money(row.margin) : "-"}</td>
      <td class="${row.complete ? (row.marginHa >= 0 ? "value-good" : "value-bad") : ""}">${row.complete ? money(row.marginHa) : "-"}</td>
      <td>${cell(row.breakEvenKgHa, number(row.breakEvenKgHa, 0))}</td>
      <td>${row.complete ? `<span class="badge done">Completo</span>` : `<span class="badge warn">${escapeHtml(row.status)}</span>`}</td>
    </tr>`).join("") || `<tr><td colspan="12">No hay cierres ni costos cargados para la campaña ${escapeHtml(campaign || "-")}.</td></tr>`;
  table.querySelectorAll("[data-open-margin-lot]").forEach((row) => row.addEventListener("click", () => openLotCostDetail(row.dataset.openMarginLot)));
  renderReferencePrices(campaign);
}

// Precios de referencia: completa de una vez el precio por tn de los cierres de la campaña que no lo tienen.
// Se guarda en cada cierre (planilla Campanas), así el margen queda igual en todos los dispositivos.
function renderReferencePrices(campaign, anchorSelector = "#marginSummary", formId = "referencePrices") {
  const box = document.querySelector(`#${formId}`) || (() => {
    const element = document.createElement("form");
    element.id = formId;
    element.className = "reference-prices";
    document.querySelector(anchorSelector)?.after(element);
    return element;
  })();
  const missing = data.closures.filter((closure) => normalizeCampaignValue(closure.campaign) === campaign
    && parseDecimal(closure.kgHarvested) > 0 && !(parseDecimal(closure.priceTon) > 0));
  const crops = [...new Set(missing.map((closure) => canonicalCropName(closure.crop)).filter(Boolean))].sort(compareText);
  if (!crops.length) {
    box.innerHTML = "";
    box.classList.add("hidden-panel");
    return;
  }
  box.classList.remove("hidden-panel");
  box.innerHTML = `
    <strong>Hay ${missing.length} cierre${missing.length === 1 ? "" : "s"} con rinde y sin precio.</strong>
    <span class="panel-note">Cargá un precio de referencia (u$s por tonelada, neto de gastos de comercialización) y se aplica solo a los cierres de ${escapeHtml(campaign)} que no tienen precio.</span>
    <div class="reference-price-grid">${crops.map((crop) => `<label>${escapeHtml(crop)} <input name="${escapeHtml(crop)}" type="text" inputmode="decimal" placeholder="u$s/tn" /></label>`).join("")}</div>
    <div class="form-actions"><button type="submit">Aplicar precios</button></div>`;
  box.onsubmit = (event) => {
    event.preventDefault();
    const prices = Object.fromEntries(crops.map((crop) => [crop, parseDecimal(box.elements[crop]?.value)]).filter(([, price]) => price > 0));
    if (!Object.keys(prices).length) { showToast("Cargá al menos un precio"); return; }
    let updated = 0;
    missing.forEach((closure) => {
      const price = prices[canonicalCropName(closure.crop)];
      if (!price) return;
      const lot = findLot(closure);
      closure.priceTon = price;
      closure.income = parseDecimal(closure.kgHarvested) / 1000 * price;
      if (!closure.applicationCostsManual && lot) closure.applicationCosts = applicationCostForLot(lot.id, campaign, closure.crop);
      closure.grossMargin = closure.income - parseDecimal(closure.otherCosts) - parseDecimal(closure.applicationCosts);
      queueSync("closures", closure, "update");
      updated += 1;
    });
    saveData();
    renderAll();
    showToast(`Precio aplicado a ${updated} cierre${updated === 1 ? "" : "s"}`);
  };
}

function costCategoryLabel(category) {
  return COST_CATEGORY_META[category]?.label || "Otros";
}

function openLotCostDetail(lotId) {
  selectedCostLotId = lotId;
  renderLotCostDetail();
  switchView("ficha-costos-lote");
}

function costCategoryTitle(category) {
  return ({
    all: "Todos los costos",
    labor: "Labores",
    herbicides: "Herbicidas",
    "seeds-fertilizers": "Semillas y fertilizantes"
  })[category] || "Detalle de costos";
}

function openCostCategoryDetail(category) {
  selectedCostCategory = category;
  renderCostCategoryDetail();
  switchView("ficha-costos-rubro");
}

function renderCostCategoryDetail() {
  const detail = document.querySelector("#costCategoryDetail");
  if (!detail) return;
  const rows = buildLotCosts();
  const categories = selectedCostCategory === "seeds-fertilizers"
    ? ["seeds", "fertilizers"]
    : [selectedCostCategory];
  const entries = rows.flatMap((row) => row.entries
    .filter((entry) => selectedCostCategory === "all" || categories.includes(entry.category))
    .map((entry) => ({ ...entry, lot: row.lot })))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const total = entries.reduce((sum, entry) => sum + (entry.pendingCost ? 0 : parseDecimal(entry.total)), 0);
  const lots = new Set(entries.map((entry) => entry.lot.id)).size;
  detail.innerHTML = `
    <div class="application-detail-head">
      <div>
        <span class="eyebrow">Detalle por rubro</span>
        <h2>${costCategoryTitle(selectedCostCategory)}</h2>
        <p>Campaña ${currentCostCampaign() || "-"} · ${entries.length} movimientos en ${lots} lotes</p>
      </div>
      <div class="row-actions">
        <button class="link-button filter-clear-button" id="clearCostCategoryFilter" type="button">Limpiar filtro</button>
        <button class="link-button" id="backToCostsFromCategory" type="button">Volver a costos</button>
      </div>
    </div>
    <div class="cost-detail-summary">
      <article><span>Total</span><strong>${money(total)}</strong></article>
      <article><span>Lotes</span><strong>${lots}</strong></article>
      <article><span>Movimientos</span><strong>${entries.length}</strong></article>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Lote</th><th>Orden</th><th>Labor</th><th>Concepto</th><th>Rubro</th><th>Cantidad</th><th>Costo unit.</th><th>Total</th><th>u$s/ha</th></tr></thead>
        <tbody>${entries.map((entry) => {
          const hectares = parseDecimal(entry.lot.hectares);
          return `
            <tr>
              <td>${dateShort(entry.date)}</td><td>${displayLotName(entry.lot)}</td><td>${orderShortLabel(entry.orderId)}</td><td>${entry.task}</td>
              <td>${entry.description}</td><td>${costCategoryLabel(entry.category)}</td>
              <td>${number(entry.quantity, 2)} ${entry.unit}</td>
              <td>${entry.pendingCost ? "Pendiente" : money(entry.unitCost)}</td>
              <td>${entry.pendingCost ? "Pendiente" : money(entry.total)}</td>
              <td>${entry.pendingCost ? "Pendiente" : money(hectares ? entry.total / hectares : 0)}</td>
            </tr>
          `;
        }).join("") || `<tr><td colspan="13">No hay movimientos para este rubro.</td></tr>`}</tbody>
      </table>
    </div>
  `;
  detail.querySelector("#clearCostCategoryFilter")?.addEventListener("click", clearCostCategoryFilter);
  detail.querySelector("#backToCostsFromCategory")?.addEventListener("click", () => switchView("costos"));
}

function renderLotCostDetail() {
  const detail = document.querySelector("#lotCostDetail");
  if (!detail) return;
  const row = buildLotCosts().find((item) => item.lot.id === selectedCostLotId);
  if (!row) {
    detail.innerHTML = `<div class="empty">No hay costos cargados para este lote.</div>`;
    return;
  }
  const hectares = parseDecimal(row.lot.hectares);
  const entries = [...row.entries].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  detail.innerHTML = `
    <div class="application-detail-head">
      <div>
        <span class="eyebrow">Costos del lote</span>
        <h2>${displayLotName(row.lot)}</h2>
        <p>${row.lot.farm || "-"} · Campaña ${currentCostCampaign() || "-"} · ${number(hectares, 2)} ha</p>
      </div>
      <button class="link-button" id="backToCosts" type="button">Volver a costos</button>
    </div>
    <div class="cost-detail-summary">
      <article><span>Total acumulado</span><strong>${money(row.total)}</strong></article>
      <article><span>Total por hectárea</span><strong>${money(hectares ? row.total / hectares : 0)}</strong></article>
      <article><span>Labores</span><strong>${money(row.labor)}</strong></article>
      <article><span>Insumos</span><strong>${money(row.total - row.labor)}</strong></article>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Orden</th><th>Labor</th><th>Concepto</th><th>Rubro</th><th>Cantidad</th><th>Costo unit.</th><th>Total</th><th>u$s/ha</th></tr></thead>
        <tbody>${entries.map((entry) => `
          <tr>
            <td>${dateShort(entry.date)}</td><td>${orderShortLabel(entry.orderId)}</td><td>${entry.task}</td>
            <td>${entry.description}</td><td>${costCategoryLabel(entry.category)}</td>
            <td>${number(entry.quantity, 2)} ${entry.unit}</td>
            <td>${entry.pendingCost ? "Pendiente" : money(entry.unitCost)}</td>
            <td>${entry.pendingCost ? "Pendiente" : money(entry.total)}</td>
            <td>${entry.pendingCost ? "Pendiente" : money(hectares ? entry.total / hectares : 0)}</td>
          </tr>
        `).join("")}</tbody>
      </table>
    </div>
  `;
  detail.querySelector("#backToCosts")?.addEventListener("click", () => switchView("costos"));
}

function cropClass(crop) {
  const normalized = crop.toLowerCase();
  if (normalized.includes("soja")) return "crop-soja";
  if (normalized.includes("maíz") || normalized.includes("maiz")) return "crop-maiz";
  if (normalized.includes("trigo")) return "crop-trigo";
  if (normalized.includes("girasol")) return "crop-girasol";
  return "crop-default";
}

function canonicalCropName(crop) {
  const value = String(crop || "").trim();
  const normalized = normalizeName(value);
  if (!value) return "";
  if (normalized.startsWith("soja") && (normalized.includes("1") || normalized.includes("1ra") || normalized.includes("1o"))) return "Soja 1ra";
  if (normalized.startsWith("soja") && (normalized.includes("2") || normalized.includes("2da") || normalized.includes("2o") || normalized.includes("2°") || normalized.includes("2º"))) return "Soja 2da";
  if (normalized.startsWith("soja")) return "Soja";
  if (normalized.includes("alfalfa")) return "Alfalfa";
  if (/^ma.*z/.test(normalized) || normalized.includes("maiz")) return "Maiz";
  if (normalized.includes("trigo")) return "Trigo";
  if (normalized.includes("girasol")) return "Girasol";
  if (normalized.includes("cebada") && !normalized.includes("cebadilla")) return "Cebada";
  if (normalized.includes("cebadilla")) return "Cebadilla";
  if (normalized.includes("barbecho")) return "Barbecho";
  return value;
}

function renderRotation() {
  const header = document.querySelector("#rotacion .panel-header");
  if (header && !document.querySelector("#toggleRotationCampaigns")) {
    const actions = document.createElement("div");
    actions.className = "panel-actions";
    actions.innerHTML = `<span class="panel-note">Por lote y campaña</span><button class="link-button" id="toggleRotationCampaigns" type="button">Mostrar todas</button>`;
    header.querySelector(".panel-note")?.remove();
    header.appendChild(actions);
  }
  const currentCampaign = Array.from(new Set(data.lots.map((lot) => lot.campaign).filter(Boolean))).sort().at(-1) || "";
  const campaigns = Array.from(new Set([...data.lots.map((lot) => lot.campaign), ...data.closures.map((closure) => closure.campaign)])).filter(Boolean).sort();
  const currentIndex = currentCampaign ? campaigns.indexOf(currentCampaign) : campaigns.length - 1;
  const visibleCampaigns = (rotationShowAllCampaigns ? campaigns : campaigns.slice(Math.max(0, currentIndex - 2), currentIndex + 1)).reverse();
  const rows = data.lots.map((lot) => {
    const cells = visibleCampaigns.map((campaign) => {
      const closures = data.closures.filter((item) => sameLot(item, lot) && item.campaign === campaign && item.crop);
      const crops = Array.from(new Set(closures.map((closure) => canonicalCropName(closure.crop)).filter(Boolean)));
      const crop = crops.length ? crops.join(" / ") : (lot.campaign === campaign ? canonicalCropName(lot.crop) : "-");
      return `<button class="rotation-cell ${campaign === currentCampaign ? "current-campaign" : ""} ${crop !== "-" ? cropClass(crop) : "crop-default"}" data-open-campaign-lot="${lot.id}" data-open-campaign="${campaign}" type="button">${crop}</button>`;
    }).join("");
    return `<div class="rotation-row" style="--rotation-columns: ${visibleCampaigns.length};"><div class="rotation-lot">${displayLotName(lot)}</div>${cells}</div>`;
  }).join("");

  document.querySelector("#rotationGrid").innerHTML = `
    <div class="rotation-row" style="--rotation-columns: ${visibleCampaigns.length};">
      <div class="rotation-head">Lote</div>
      ${visibleCampaigns.map((campaign) => `<div class="rotation-head ${campaign === currentCampaign ? "current-campaign" : ""}">${campaign}</div>`).join("")}
    </div>
    ${rows || `<div class="empty">No hay datos para mostrar.</div>`}
  `;
  const toggle = document.querySelector("#toggleRotationCampaigns");
  if (toggle) toggle.textContent = rotationShowAllCampaigns ? "Mostrar 3 campañas" : "Mostrar todas";
}

function campaignClosuresForLot(lot, campaign) {
  if (!lot || !campaign) return [];
  return data.closures
    .filter((closure) => sameLot(closure, lot) && closure.campaign === campaign)
    .sort((a, b) => String(a.crop || "").localeCompare(String(b.crop || "")));
}

function openCampaignDetail(lotId, campaign) {
  selectedCampaignLotId = lotId;
  selectedCampaign = campaign;
  editingCampaignClosureId = "";
  renderCampaignDetail();
  switchView("ficha-campana");
}

function campaignCropOptions(selectedCrop = "") {
  const base = ["Soja 1ra", "Soja 2da", "Trigo", "Maiz", "Girasol", "Cebada", "Sorgo", "Alfalfa", "Barbecho"];
  const fromData = [
    ...data.lots.map((lot) => lot.crop),
    ...data.closures.map((closure) => closure.crop)
  ].filter(Boolean);
  return Array.from(new Set([...base, ...fromData, selectedCrop].map(canonicalCropName).filter(Boolean)))
    .sort((a, b) => String(a).localeCompare(String(b), "es"));
}

function cropSelectOptions(selectedCrop = "") {
  const canonicalSelected = canonicalCropName(selectedCrop);
  const options = campaignCropOptions(selectedCrop);
  const selectedExists = options.some((option) => normalizeName(option) === normalizeName(canonicalSelected));
  return `
    ${options.map((option) => `<option value="${option}" ${normalizeName(option) === normalizeName(canonicalSelected) ? "selected" : ""}>${option}</option>`).join("")}
    <option value="Otro" ${selectedCrop && !selectedExists ? "selected" : ""}>Otro</option>
  `;
}

function upgradeCampaignCropControl() {
  const form = document.querySelector("#campaignDetailForm");
  const input = form?.querySelector('input[name="crop"]');
  if (!form || !input) return;

  const currentCrop = input.value || "";
  const select = document.createElement("select");
  select.name = "crop";
  select.required = true;
  select.innerHTML = cropSelectOptions(currentCrop);
  input.replaceWith(select);

  const otherLabel = document.createElement("label");
  otherLabel.className = "campaign-other-crop";
  otherLabel.innerHTML = `Otro cultivo <input name="cropOther" value="${currentCrop}" placeholder="Escribir cultivo" />`;
  select.closest("label").insertAdjacentElement("afterend", otherLabel);
}

function toggleCampaignOtherCrop() {
  const form = document.querySelector("#campaignDetailForm");
  const select = form?.elements?.crop;
  const label = form?.querySelector(".campaign-other-crop");
  if (!select || !label) return;
  label.classList.toggle("hidden-panel", select.value !== "Otro");
}

function renderCampaignDetail() {
  const container = document.querySelector("#campaignDetail");
  if (!container || !selectedCampaignLotId || !selectedCampaign) return;

  const lot = data.lots.find((item) => item.id === selectedCampaignLotId);
  if (!lot) {
    container.innerHTML = `<div class="empty">No encontré el lote seleccionado.</div>`;
    return;
  }

  const records = campaignClosuresForLot(lot, selectedCampaign);
  const editing = records.find((record) => record.id === editingCampaignClosureId) || null;
  const hectares = editing ? editing.hectares : lot.hectares;
  const crop = editing ? editing.crop : (lot.campaign === selectedCampaign ? lot.crop : "");
  const variety = editing ? editing.variety : (lot.campaign === selectedCampaign ? lot.variety : "");
  const enso = editing?.enso || "";
  const kgHarvested = editing?.kgHarvested || "";
  const priceTon = editing?.priceTon || "";
  const otherCosts = editing?.otherCosts || 0;
  const applicationCosts = editing?.applicationCostsManual ? (editing.applicationCosts || "") : "";
  const ensoNormalized = normalizeName(enso);

  document.querySelector("#campaignDetailTitle").textContent = `${displayLotName(lot)}  ·  ${selectedCampaign}`;

  const rows = records.map((record) => `
    <tr>
      <td>${record.crop || "-"}</td>
      <td>${record.variety || "-"}</td>
      <td>${record.enso || "-"}</td>
      <td>${numberOptional(record.hectares, 2)}</td>
      <td>${numberOptional(record.kgHarvested)}</td>
      <td>${numberOptional(closureYield(record))}</td>
      <td>${moneyOptional(record.income)}</td>
      <td>
        <button class="link-button" data-edit-campaign-closure="${record.id}" type="button">Editar</button>
        <button class="link-button danger" data-delete-campaign-closure="${record.id}" type="button">Eliminar</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="8">Todavía no hay datos cargados para esta campaña.</td></tr>`;

  container.innerHTML = `
    <div class="campaign-detail-layout">
      <div class="campaign-detail-main">
        <div class="detail-grid campaign-summary">
          <article><span>Lote</span><strong>${displayLotName(lot)}</strong></article>
          <article><span>Campo</span><strong>${lot.farm || "-"}</strong></article>
          <article><span>Hectáreas del lote</span><strong>${numberOptional(lot.hectares, 2)}</strong></article>
          <article><span>Campaña</span><strong>${selectedCampaign}</strong></article>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cultivo</th>
                <th>Var./Híb.</th>
                <th>ENSO</th>
                <th>Ha</th>
                <th>Kg cosechados</th>
                <th>Rinde kg/ha</th>
                <th>Ingreso bruto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>

      <form id="campaignDetailForm" class="form-grid campaign-detail-form">
        <h3>${editing ? "Editar registro" : "Agregar registro"}</h3>
        <label>Cultivo <input name="crop" required value="${crop || ""}" placeholder="Soja 2da, Trigo, Maiz" /></label>
        <label>Variedad/Hibrido <input name="variety" value="${variety || ""}" placeholder="Ceibo, DM 46R18, DK..." /></label>
        <label>ENSO
          <select name="enso">
            <option value="">Sin dato</option>
            <option ${ensoNormalized === "el nino" ? "selected" : ""}>El Niño</option>
            <option ${ensoNormalized === "la nina" ? "selected" : ""}>La Niña</option>
            <option ${ensoNormalized === "neutral" ? "selected" : ""}>Neutral</option>
          </select>
        </label>
        <label>Ha cosechadas <input name="hectares" type="number" min="0" step="0.01" value="${hectares || ""}" /></label>
        <label>Kg cosechados <input name="kgHarvested" type="number" min="0" step="1" value="${kgHarvested || ""}" /></label>
        <label>Precio por tonelada <input name="priceTon" type="number" min="0" step="0.01" value="${priceTon || ""}" /></label>
        <label>Otros costos <input name="otherCosts" type="number" min="0" step="0.01" value="${otherCosts || 0}" /></label>
        <label>Costos aplicación <input name="applicationCosts" type="number" min="0" step="0.01" value="${applicationCosts}" placeholder="Automático o manual" /></label>
        <div class="form-actions">
          <button type="submit">${editing ? "Guardar cambios" : "Agregar a campaña"}</button>
          ${editing ? `<button class="link-button" id="cancelCampaignEdit" type="button">Cancelar</button>` : ""}
        </div>
      </form>
    </div>
  `;

  bindCampaignDetailRenderedTools();
}

function saveCampaignDetailRecord(event) {
  event.preventDefault();
  const lot = data.lots.find((item) => item.id === selectedCampaignLotId);
  if (!lot) return;

  const values = formData(event.currentTarget);
  const selectedCrop = values.crop === "Otro" ? String(values.cropOther || "").trim() : canonicalCropName(values.crop);
  if (!selectedCrop) {
    showToast("Elegí o escribí un cultivo");
    return;
  }
  const existing = editingCampaignClosureId ? data.closures.find((closure) => closure.id === editingCampaignClosureId) : null;
  const hectares = parseDecimal(values.hectares);
  const kgHarvested = values.kgHarvested === "" ? "" : parseDecimal(values.kgHarvested);
  const priceTon = values.priceTon === "" ? "" : parseDecimal(values.priceTon);
  const otherCosts = parseDecimal(values.otherCosts);
  const manualApplicationCosts = values.applicationCosts === "" ? "" : parseDecimal(values.applicationCosts);
  const applicationCosts = manualApplicationCosts === ""
    ? applicationCostForLot(lot.id, selectedCampaign, selectedCrop)
    : manualApplicationCosts;
  const income = kgHarvested && priceTon ? (kgHarvested / 1000) * priceTon : "";
  const grossMargin = income === "" ? "" : income - otherCosts - Number(applicationCosts || 0);
  const campaignGroupId = existing?.campaignGroupId
    || campaignClosuresForLot(lot, selectedCampaign)[0]?.campaignGroupId
    || `CAM-${lot.id}-${String(selectedCampaign || "").replace("/", "-")}`;
  const record = {
    ...(existing || {}),
    id: existing?.id || uid("clo"),
    campaignGroupId,
    lotId: lot.id,
    lotName: displayLotName(lot),
    campaign: selectedCampaign,
    crop: selectedCrop,
    variety: values.variety,
    enso: values.enso,
    hectares,
    kgHarvested,
    priceTon,
    otherCosts,
    applicationCosts,
    applicationCostsManual: manualApplicationCosts !== "",
    income,
    grossMargin
  };

  if (existing) {
    const index = data.closures.findIndex((closure) => closure.id === existing.id);
    if (index >= 0) data.closures[index] = record;
    queueSync("closures", record, "update");
  } else {
    data.closures.push(record);
    queueSync("closures", record);
  }

  editingCampaignClosureId = "";
  const moved = syncLotsWithRotation();
  saveData();
  renderAll();
  renderCampaignDetail();
  showToast(moved ? `Campaña guardada. Cultivo actual: ${lotCrop(lot.id) || "-"}` : "Campaña guardada");
}

function deleteCampaignDetailRecord(id) {
  const record = data.closures.find((closure) => closure.id === id);
  if (!record) return;
  if (!window.confirm(`¿Eliminar ${record.crop || "este registro"} de la campaña ${record.campaign || selectedCampaign}?`)) return;
  data.closures = data.closures.filter((closure) => closure.id !== id);
  queueSync("closures", record, "delete");
  if (editingCampaignClosureId === id) editingCampaignClosureId = "";
  saveData();
  renderAll();
  renderCampaignDetail();
  showToast("Registro eliminado");
}

function editClosureInMainForm(id, returnView = "ficha-campana") {
  const record = data.closures.find((closure) => closure.id === id);
  const form = document.querySelector("#closureForm");
  if (!record || !form) return;
  editingClosureFormId = id;
  closureReturnView = returnView;
  form.elements.lotId.value = record.lotId || "";
  form.elements.campaign.value = record.campaign || "";
  form.elements.crop.value = canonicalCropName(record.crop) || record.crop || "";
  form.elements.variety.value = record.variety || "";
  form.elements.enso.value = record.enso || "";
  form.elements.hectares.value = record.hectares || "";
  form.elements.kgHarvested.value = record.kgHarvested || "";
  form.elements.priceTon.value = record.priceTon || "";
  form.elements.otherCosts.value = record.otherCosts || 0;
  form.querySelector('button[type="submit"]').textContent = "Actualizar cierre";
  switchView("cierre");
  document.querySelector("#closureFormBand")?.classList.remove("hidden-panel");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast("Editando cierre");
}

function bindCampaignDetailRenderedTools() {
  upgradeCampaignCropControl();
  document.querySelector("#campaignDetailForm")?.addEventListener("submit", saveCampaignDetailRecord);
  toggleCampaignOtherCrop();
  document.querySelector('#campaignDetailForm select[name="crop"]')?.addEventListener("change", toggleCampaignOtherCrop);
  document.querySelector("#cancelCampaignEdit")?.addEventListener("click", () => {
    editingCampaignClosureId = "";
    renderCampaignDetail();
  });
  document.querySelectorAll("[data-edit-campaign-closure]").forEach((button) => {
    button.addEventListener("click", () => editClosureInMainForm(button.dataset.editCampaignClosure, "ficha-campana"));
  });
  document.querySelectorAll("[data-delete-campaign-closure]").forEach((button) => {
    button.addEventListener("click", () => deleteCampaignDetailRecord(button.dataset.deleteCampaignClosure));
  });
}

function historicalClosures() {
  return data.closures
    .filter((closure) => closure.crop && closure.campaign)
    .map((closure) => ({ ...closure, lot: findLot(closure), yieldKgHa: closureYield(closure) }))
    .sort((a, b) => String(b.campaign || "").localeCompare(String(a.campaign || "")));
}

function cropYieldAverages(records = historicalClosures()) {
  return records.reduce((map, record) => {
    if (!record.yieldKgHa) return map;
    const item = map.get(record.crop) || { total: 0, count: 0 };
    item.total += record.yieldKgHa;
    item.count += 1;
    map.set(record.crop, item);
    return map;
  }, new Map());
}

function averageFrom(item) {
  return item?.count ? item.total / item.count : "";
}

function yieldClass(record, cropAverages) {
  const avg = averageFrom(cropAverages.get(record.crop));
  if (!record.yieldKgHa || !avg) return "";
  if (record.yieldKgHa > avg) return "yield-above";
  if (record.yieldKgHa < avg) return "yield-below";
  return "yield-even";
}

function renderYieldCell(record, cropAverages) {
  const cls = yieldClass(record, cropAverages);
  return `<span class="yield-value ${cls}">${numberOptional(record.yieldKgHa)}</span>`;
}

function historyCropGroup(crop) {
  return otherHistoryCrops.some((item) => normalizeName(item) === normalizeName(crop)) ? "Otros" : crop;
}

function isForageHistoryCrop(crop) {
  const normalized = normalizeName(crop);
  return forageHistoryCrops.some((item) => normalized.includes(normalizeName(item)));
}

function historicalYieldRecords() {
  return historicalClosures().filter((record) => !isForageHistoryCrop(record.crop));
}

function historyCropCardClass(crop) {
  const normalized = normalizeName(crop);
  if (normalized.includes("maiz")) return "crop-card-maiz";
  if (normalized.includes("soja")) return "crop-card-soja";
  if (normalized.includes("trigo")) return "crop-card-trigo";
  if (normalized.includes("otros")) return "crop-card-otros";
  return "crop-card-default";
}

function averageYield(records) {
  const yielded = records.filter((record) => record.yieldKgHa);
  return yielded.length ? yielded.reduce((sum, record) => sum + record.yieldKgHa, 0) / yielded.length : "";
}

function renderYieldComparedTo(record, avg) {
  let cls = "";
  if (record.yieldKgHa && avg) {
    cls = record.yieldKgHa > avg ? "yield-above" : record.yieldKgHa < avg ? "yield-below" : "yield-even";
  }
  return `<span class="yield-value ${cls}">${numberOptional(record.yieldKgHa)}</span>`;
}

// ===== Histórico: solapas Por lote / Por cultivo / Por campaña =====
const historyTabKey = "gestion-agro-historico-solapa";
let historyTab = ["lote", "cultivo", "campana"].includes(safeStorageGet(historyTabKey)) ? safeStorageGet(historyTabKey) : "lote";
let historyEnsoFilter = "";
let historyFarmFilter = "";
let historyCampaignSelected = "";
const ENSO_PHASES = ["El Niño", "La Niña", "Neutral"];

// Cultivo para comparar rindes: igual que en el resto de la app, pero el maíz tardío va aparte (rinde distinto).
function historyCropKey(crop) {
  const normalized = normalizeName(crop);
  if (/^ma.*z/.test(normalized) && normalized.includes("tardi")) return "Maíz tardío";
  const canonical = canonicalCropName(crop);
  return canonical === "Maiz" ? "Maíz" : canonical;
}

function normalizeEnso(value) {
  const normalized = normalizeName(value);
  if (normalized.includes("nino")) return "El Niño";
  if (normalized.includes("nina")) return "La Niña";
  if (normalized.includes("neutral") || normalized.includes("neutro")) return "Neutral";
  return "";
}

function isValidCampaign(value) {
  return /^\d{4}\/\d{2}$/.test(normalizeCampaignValue(value));
}

// Un registro por cultivo cosechado (con kilos): lote, campaña, cultivo, ENSO, ha y rinde.
function historyRecords() {
  const cache = derivedData();
  if (cache.historyRecords) return cache.historyRecords;
  cache.historyRecords = data.closures
    .filter((closure) => closure.crop && isValidCampaign(closure.campaign) && closureHarvested(closure))
    .map((closure) => {
      const lot = findLot(closure);
      const hectares = parseDecimal(closure.hectares) || parseDecimal(lot?.hectares);
      return {
        closure,
        lot,
        campaign: normalizeCampaignValue(closure.campaign),
        crop: historyCropKey(closure.crop),
        enso: normalizeEnso(closure.enso),
        hectares,
        kg: parseDecimal(closure.kgHarvested),
        yieldKgHa: hectares ? parseDecimal(closure.kgHarvested) / hectares : 0
      };
    })
    .filter((record) => record.yieldKgHa > 0);
  return cache.historyRecords;
}

// Margen de cada cierre, solo cuando está completo (rinde, precio y costos).
function historyMarginIndex() {
  const cache = derivedData();
  if (cache.historyMargins) return cache.historyMargins;
  const map = new Map();
  [...new Set(data.closures.map((closure) => normalizeCampaignValue(closure.campaign)).filter(isValidCampaign))]
    .forEach((campaign) => buildLotMargins(campaign).forEach((row) => {
      if (row.complete) row.closures.forEach((closure) => map.set(closure.id, row));
    }));
  cache.historyMargins = map;
  return map;
}

// Rinde promedio ponderado por hectáreas (kg totales / ha totales).
function weightedYield(records) {
  const hectares = records.reduce((sum, record) => sum + record.hectares, 0);
  return hectares ? records.reduce((sum, record) => sum + record.kg, 0) / hectares : 0;
}

function groupBy(list, keyFn) {
  return list.reduce((map, item) => {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
    return map;
  }, new Map());
}

function historyCropOrder(a, b) {
  const order = ["Soja 1ra", "Soja 2da", "Maíz", "Maíz tardío", "Trigo", "Girasol", "Sorgo"];
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || compareText(a, b);
}

function setHistoryTab(tab) {
  historyTab = ["lote", "cultivo", "campana"].includes(tab) ? tab : "lote";
  try { window.localStorage?.setItem(historyTabKey, historyTab); } catch { /* sin almacenamiento */ }
  renderHistoryPanel();
}

function renderHistoryPanel() {
  const view = document.querySelector("#historico");
  if (!view) return;
  renderHistoryLotSearch();
  view.dataset.tab = historyTab;
  view.querySelectorAll("[data-history-tab]").forEach((button) => {
    const active = button.dataset.historyTab === historyTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  if (!view.dataset.tabsBound) {
    view.dataset.tabsBound = "true";
    view.querySelectorAll("[data-history-tab]").forEach((button) => button.addEventListener("click", () => setHistoryTab(button.dataset.historyTab)));
  }
  // Solo se arma la solapa visible (la vista completa tiene cientos de celdas).
  if (historyTab === "lote") renderHistoryByLot(view.querySelector("#historyByLot"));
  else if (historyTab === "cultivo") renderHistoryByCrop(view.querySelector("#historyByCrop"));
  else renderHistoryByCampaign(view.querySelector("#historyByCampaign"));
}

// ---------- Solapa 1: por lote (filas = lotes, columnas = campañas) ----------
function renderHistoryByLot(container) {
  if (!container) return;
  const records = historyRecords();
  const margins = historyMarginIndex();
  const averages = new Map([...groupBy(records, (record) => record.crop)].map(([crop, list]) => [crop, weightedYield(list)]));
  const farms = uniqueSorted(data.lots.map((lot) => lot.farm));
  if (historyFarmFilter && !farms.includes(historyFarmFilter)) historyFarmFilter = "";
  const lots = data.lots
    .filter((lot) => !historyFarmFilter || lot.farm === historyFarmFilter)
    .sort((a, b) => compareText(a.farm, b.farm) || compareText(displayLotName(a), displayLotName(b)));
  const lotIds = new Set(lots.map((lot) => lot.id));
  const campaigns = [...new Set(data.closures.filter((closure) => lotIds.has(findLot(closure)?.id)).map((closure) => normalizeCampaignValue(closure.campaign)).filter(isValidCampaign))]
    .sort((a, b) => campaignStartYear(b) - campaignStartYear(a));
  const cell = (lot, campaign) => {
    const closures = lotRotationSequence(lot, campaign);
    if (!closures.length) return "";
    return closures.map((closure) => {
      const crop = historyCropKey(closure.crop);
      if (!closureHarvested(closure)) return `<div class="hist-crop muted">${escapeHtml(crop)}</div>`;
      const ha = parseDecimal(closure.hectares) || parseDecimal(lot.hectares);
      const kgHa = ha ? parseDecimal(closure.kgHarvested) / ha : 0;
      const avg = averages.get(crop) || 0;
      const cls = avg && kgHa ? (kgHa >= avg * 1.05 ? "yield-above" : kgHa <= avg * 0.95 ? "yield-below" : "yield-even") : "";
      const margin = margins.get(closure.id);
      return `<div class="hist-crop ${cropClass(crop)}"><b>${escapeHtml(crop)}</b> <span class="yield-value ${cls}">${number(kgHa, 0)}</span>${margin ? `<small class="${margin.marginHa >= 0 ? "value-good" : "value-bad"}">MB ${money(margin.marginHa)}/ha</small>` : ""}</div>`;
    }).join("");
  };
  container.innerHTML = `
    <div class="history-toolbar">
      <label class="inline-select">Campo
        <select id="historyFarmFilter"><option value="">Todos</option>${farms.map((farm) => `<option value="${escapeHtml(farm)}">${escapeHtml(farm)}</option>`).join("")}</select>
      </label>
      <span class="panel-note">Rinde en kg/ha. <span class="legend-above">Verde</span>: 5 % o más sobre el promedio histórico del cultivo; <span class="legend-below">rojo</span>: 5 % o más debajo. MB = margen bruto (solo si el cierre tiene precio y costos). En gris, cultivos sin cosecha.</span>
    </div>
    <div class="table-wrap history-matrix-wrap">
      <table class="history-matrix">
        <thead><tr><th class="sticky-col">Lote</th>${campaigns.map((campaign) => `<th>${campaign}</th>`).join("")}</tr></thead>
        <tbody>${lots.map((lot) => `<tr>
          <th class="sticky-col"><button class="receipt-link" type="button" data-history-lot="${escapeHtml(lot.id)}">${escapeHtml(displayLotName(lot))}</button><small>${escapeHtml(lot.farm || "")} · ${number(lot.hectares, 0)} ha</small></th>
          ${campaigns.map((campaign) => `<td>${cell(lot, campaign)}</td>`).join("")}
        </tr>`).join("") || `<tr><td>No hay lotes para este campo.</td></tr>`}</tbody>
      </table>
    </div>`;
  const select = container.querySelector("#historyFarmFilter");
  select.value = historyFarmFilter;
  select.addEventListener("change", () => { historyFarmFilter = select.value; renderHistoryPanel(); });
  container.querySelectorAll("[data-history-lot]").forEach((button) => button.addEventListener("click", () => openHistoryLot(button.dataset.historyLot)));
}

// ---------- Solapa 2: por cultivo (promedios por campaña y total, filtro ENSO) ----------
function renderHistoryByCrop(container) {
  if (!container) return;
  const all = historyRecords();
  const records = historyEnsoFilter ? all.filter((record) => record.enso === historyEnsoFilter) : all;
  const margins = historyMarginIndex();
  const byCrop = groupBy(records, (record) => record.crop);
  const crops = [...byCrop.keys()].sort(historyCropOrder);
  const campaigns = [...new Set(records.map((record) => record.campaign))].sort((a, b) => campaignStartYear(b) - campaignStartYear(a));
  // Fase ENSO de cada campaña: la más cargada en sus cierres.
  const ensoByCampaign = new Map([...groupBy(all.filter((record) => record.enso), (record) => record.campaign)].map(([campaign, list]) => {
    const counts = groupBy(list, (record) => record.enso);
    return [campaign, [...counts.entries()].sort((a, b) => b[1].length - a[1].length)[0][0]];
  }));
  const ensoShort = { "El Niño": "Niño", "La Niña": "Niña", Neutral: "Neutral" };
  const cropRows = crops.map((crop) => {
    const list = byCrop.get(crop);
    const yields = list.map((record) => record.yieldKgHa);
    const withMargin = list.map((record) => margins.get(record.closure.id)).filter(Boolean);
    const marginHa = withMargin.length ? withMargin.reduce((sum, row) => sum + row.marginHa, 0) / withMargin.length : null;
    const byCampaign = groupBy(list, (record) => record.campaign);
    return `<tr>
      <th class="sticky-col"><span class="hist-crop ${cropClass(crop)}"><b>${escapeHtml(crop)}</b></span></th>
      <td class="hist-total"><b>${number(weightedYield(list), 0)}</b></td>
      <td>${list.length}</td>
      <td>${number(Math.min(...yields), 0)}</td>
      <td>${number(Math.max(...yields), 0)}</td>
      <td>${marginHa == null ? "-" : `<span class="${marginHa >= 0 ? "value-good" : "value-bad"}">${money(marginHa)}</span> <small>(${withMargin.length})</small>`}</td>
      ${campaigns.map((campaign) => {
        const items = byCampaign.get(campaign) || [];
        return `<td>${items.length ? `${number(weightedYield(items), 0)}<small> (${items.length})</small>` : ""}</td>`;
      }).join("")}
    </tr>`;
  }).join("");
  // Comparación por fase ENSO (siempre con todos los datos)
  const allByCrop = groupBy(all, (record) => record.crop);
  const ensoRows = [...allByCrop.keys()].sort(historyCropOrder).map((crop) => {
    const list = allByCrop.get(crop);
    const total = weightedYield(list);
    const phase = (name) => {
      const items = list.filter((record) => record.enso === name);
      if (!items.length) return "<td>-</td>";
      const value = weightedYield(items);
      const diff = total ? Math.round((value / total - 1) * 100) || 0 : 0;
      return `<td>${number(value, 0)} <small class="${diff >= 0 ? "value-good" : "value-bad"}">${diff >= 0 ? "+" : ""}${number(diff, 0)} %</small> <small>(${items.length})</small></td>`;
    };
    return `<tr><th class="sticky-col"><span class="hist-crop ${cropClass(crop)}"><b>${escapeHtml(crop)}</b></span></th>${ENSO_PHASES.map(phase).join("")}<td><b>${number(total, 0)}</b> <small>(${list.length})</small></td></tr>`;
  }).join("");
  container.innerHTML = `
    <div class="history-toolbar">
      <label class="inline-select">Año
        <select id="historyEnsoFilter">
          <option value="">Todos</option>
          ${ENSO_PHASES.map((phase) => `<option value="${phase}">${phase}</option>`).join("")}
        </select>
      </label>
      <span class="panel-note">Rinde promedio en kg/ha, ponderado por hectáreas. Entre paréntesis, cuántos lotes cosechados entran en el promedio.${historyEnsoFilter ? ` Mostrando solo campañas ${historyEnsoFilter}.` : ""}</span>
    </div>
    <section class="panel">
      <div class="panel-header"><h2>Rinde por cultivo y campaña</h2></div>
      <div class="table-wrap history-matrix-wrap">
        <table class="history-matrix">
          <thead><tr><th class="sticky-col">Cultivo</th><th>Promedio total</th><th>Lotes</th><th>Mínimo</th><th>Máximo</th><th>Margen prom. u$s/ha</th>${campaigns.map((campaign) => `<th>${campaign}${ensoByCampaign.get(campaign) ? `<small class="enso-tag">${ensoShort[ensoByCampaign.get(campaign)]}</small>` : ""}</th>`).join("")}</tr></thead>
          <tbody>${cropRows || `<tr><td colspan="6">No hay rindes para este filtro.</td></tr>`}</tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header"><h2>Rinde según el año (ENSO)</h2><span class="panel-note">Promedio de cada cultivo en años Niño, Niña y Neutral, y la diferencia contra su promedio total. Usa todos los datos, sin filtro.</span></div>
      <div class="table-wrap">
        <table class="history-matrix">
          <thead><tr><th class="sticky-col">Cultivo</th>${ENSO_PHASES.map((phase) => `<th>${phase}</th>`).join("")}<th>Todos</th></tr></thead>
          <tbody>${ensoRows}</tbody>
        </table>
      </div>
    </section>`;
  const select = container.querySelector("#historyEnsoFilter");
  select.value = historyEnsoFilter;
  select.addEventListener("change", () => { historyEnsoFilter = select.value; renderHistoryPanel(); });
}

// ---------- Solapa 3: por campaña ----------
function renderHistoryByCampaign(container) {
  if (!container) return;
  const records = historyRecords();
  const campaigns = [...new Set(data.closures.map((closure) => normalizeCampaignValue(closure.campaign)).filter(isValidCampaign))]
    .sort((a, b) => campaignStartYear(b) - campaignStartYear(a));
  if (!campaigns.includes(historyCampaignSelected)) {
    // Por defecto: la campaña más reciente que ya tiene rindes.
    historyCampaignSelected = campaigns.find((campaign) => records.some((record) => record.campaign === campaign)) || campaigns[0] || "";
  }
  const campaign = historyCampaignSelected;
  const rows = buildLotMargins(campaign).filter((row) => row.closures.length);
  const campaignRecords = records.filter((record) => record.campaign === campaign);
  const enso = [...new Set(campaignRecords.map((record) => record.enso).filter(Boolean))].join(" / ");
  const byCrop = groupBy(rows, (row) => historyCropKey(row.closures[0].crop));
  const summary = [...byCrop.keys()].sort(historyCropOrder).map((crop) => {
    const list = byCrop.get(crop);
    const harvested = campaignRecords.filter((record) => record.crop === crop);
    const complete = list.filter((row) => row.complete);
    const completeHa = complete.reduce((sum, row) => sum + row.hectares, 0);
    const marginHa = completeHa ? complete.reduce((sum, row) => sum + row.margin, 0) / completeHa : null;
    return `<tr>
      <th><span class="hist-crop ${cropClass(crop)}"><b>${escapeHtml(crop)}</b></span></th>
      <td>${list.length}</td>
      <td>${number(list.reduce((sum, row) => sum + row.hectares, 0), 0)}</td>
      <td>${harvested.length ? number(weightedYield(harvested), 0) : "-"}</td>
      <td>${marginHa == null ? "-" : `<span class="${marginHa >= 0 ? "value-good" : "value-bad"}">${money(marginHa)}</span>`}</td>
      <td>${complete.length} de ${list.length}</td>
    </tr>`;
  }).join("");
  const sorted = rows.slice().sort((a, b) => historyCropOrder(historyCropKey(a.closures[0].crop), historyCropKey(b.closures[0].crop)) || compareText(displayLotName(a.lot), displayLotName(b.lot)));
  container.innerHTML = `
    <div class="history-toolbar">
      <label class="inline-select">Campaña
        <select id="historyCampaignSelect">${campaigns.map((value) => `<option value="${value}">${value}</option>`).join("")}</select>
      </label>
      <span class="panel-note">${enso ? `Año ${escapeHtml(enso)}. ` : ""}Margen = ingreso (kg × precio por tn) menos costos de la app y otros costos del cierre. Tocá un lote para ver su historia.</span>
    </div>
    <section class="panel">
      <div class="panel-header"><h2>Resumen por cultivo · ${escapeHtml(campaign)}</h2></div>
      <div class="table-wrap" id="historyCampaignSummary">
        <table class="history-matrix">
          <thead><tr><th>Cultivo</th><th>Lotes</th><th>Ha</th><th>Rinde kg/ha</th><th>Margen u$s/ha</th><th>Con margen completo</th></tr></thead>
          <tbody>${summary || `<tr><td colspan="6">No hay cultivos cargados en esta campaña.</td></tr>`}</tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header"><h2>Lotes · ${escapeHtml(campaign)}</h2></div>
      <div class="table-wrap">
        <table class="compact-table">
          <thead><tr><th>Lote</th><th>Cultivo</th><th>Var./Híb.</th><th>ENSO</th><th>Ha</th><th>Rinde kg/ha</th><th>Precio u$s/tn</th><th>Ingreso</th><th>Costos</th><th>Margen</th><th>MB u$s/ha</th><th>Estado</th></tr></thead>
          <tbody>${sorted.map((row) => {
            const closure = row.closures[0];
            const kgHa = closureHarvested(closure) && row.hectares ? parseDecimal(closure.kgHarvested) / row.hectares : 0;
            const price = parseDecimal(closure.priceTon);
            return `<tr>
              <td class="nowrap"><button class="receipt-link" type="button" data-history-lot="${escapeHtml(row.lot.id)}">${escapeHtml(displayLotName(row.lot))}</button></td>
              <td><span class="hist-crop ${cropClass(historyCropKey(closure.crop))}"><b>${escapeHtml(historyCropKey(closure.crop))}</b></span></td>
              <td>${escapeHtml(closure.variety || "-")}</td>
              <td>${escapeHtml(normalizeEnso(closure.enso) || "-")}</td>
              <td>${number(row.hectares, 1)}</td>
              <td>${kgHa ? number(kgHa, 0) : "-"}</td>
              <td>${price > 0 ? number(price, 0) : "-"}</td>
              <td class="nowrap">${row.income ? money(row.income) : "-"}</td>
              <td class="nowrap">${row.appCosts + row.otherCosts ? money(row.appCosts + row.otherCosts) : "-"}</td>
              <td class="nowrap ${row.complete ? (row.margin >= 0 ? "value-good" : "value-bad") : ""}">${row.complete ? money(row.margin) : "-"}</td>
              <td class="nowrap ${row.complete ? (row.marginHa >= 0 ? "value-good" : "value-bad") : ""}">${row.complete ? money(row.marginHa) : "-"}</td>
              <td>${row.complete ? '<span class="badge done">Completo</span>' : `<span class="badge warn">${escapeHtml(row.status)}</span>`}</td>
            </tr>`;
          }).join("") || `<tr><td colspan="12">No hay cierres en esta campaña.</td></tr>`}</tbody>
        </table>
      </div>
    </section>`;
  const select = container.querySelector("#historyCampaignSelect");
  select.value = campaign;
  select.addEventListener("change", () => { historyCampaignSelected = select.value; renderHistoryPanel(); });
  container.querySelectorAll("[data-history-lot]").forEach((button) => button.addEventListener("click", () => openHistoryLot(button.dataset.historyLot)));
  renderReferencePrices(campaign, "#historyCampaignSummary", "historyReferencePrices");
}

function renderHistoryCropCardsLegacy() {
  const container = document.querySelector("#historyCropCards");
  if (!container) return;
  const records = historicalYieldRecords();
  const grouped = records.reduce((map, record) => {
    const key = historyCropGroup(record.crop);
    const list = map.get(key) || [];
    list.push(record);
    map.set(key, list);
    return map;
  }, new Map());
  const cropSummaries = Array.from(grouped.entries())
    .map(([crop, cropRecords]) => {
      const yielded = cropRecords.filter((record) => record.yieldKgHa);
      const avg = averageYield(cropRecords);
      return {
        crop,
        avg,
        count: yielded.length,
        lots: new Set(cropRecords.map((record) => record.lot?.id || record.lotName || record.lotId).filter(Boolean)).size,
        cropNames: Array.from(new Set(cropRecords.map((record) => record.crop))).sort(),
        best: yielded.reduce((best, record) => !best || record.yieldKgHa > best.yieldKgHa ? record : best, null),
        worst: yielded.reduce((worst, record) => !worst || record.yieldKgHa < worst.yieldKgHa ? record : worst, null)
      };
    })
    .sort((a, b) => b.avg - a.avg);

  if (!cropSummaries.some((item) => item.crop === selectedHistoryCrop)) selectedHistoryCrop = cropSummaries[0]?.crop || "";
  renderHistoryLotSearch();

  container.innerHTML = cropSummaries.map((item) => `
    <button class="history-crop-card ${historyCropCardClass(item.crop)} ${item.crop === selectedHistoryCrop ? "active" : ""}" type="button" data-history-crop="${item.crop}">
      <strong>${item.crop}</strong>
      <span>${item.avg ? `${number(item.avg)} kg/ha promedio` : "Sin rindes"}</span>
      <small>${item.count} rindes · ${item.lots} lotes</small>
      ${item.crop === "Otros" ? `<small>${item.cropNames.join(" · ")}</small>` : ""}
      <small>Mejor: ${item.best ? `${item.best.lot?.name || item.best.lotName || item.best.lotId || "Sin lote"} ${item.best.campaign} (${number(item.best.yieldKgHa)} kg/ha)` : "-"}</small>
    </button>
  `).join("") || `<div class="empty">Todavía no hay rendimientos históricos cargados.</div>`;
}

function renderHistoryLotSearch() {
  const list = document.querySelector("#historyLotOptions");
  if (!list) return;
  list.innerHTML = data.lots.map((lot) => `<option value="${displayLotName(lot)} · ${lot.farm || ""}"></option>`).join("");
}

function findHistoryLotFromSearch() {
  const input = document.querySelector("#historyLotSearch");
  const value = normalizeName(input?.value || "");
  return data.lots.find((lot) => normalizeName(`${displayLotName(lot)} · ${lot.farm || ""}`) === value)
    || data.lots.find((lot) => normalizeName(`${lot.name} · ${lot.farm || ""}`) === value)
    || data.lots.find((lot) => normalizeName(displayLotName(lot)) === value)
    || data.lots.find((lot) => normalizeName(lot.name) === value)
    || data.lots.find((lot) => value && normalizeName(`${displayLotName(lot)} ${lot.farm || ""}`).includes(value))
    || data.lots.find((lot) => value && normalizeName(`${lot.name} ${lot.farm || ""}`).includes(value));
}

function openHistoryCrop(crop) {
  selectedHistoryCrop = crop;
  renderHistoryCropDetail();
  switchView("ficha-historico-cultivo");
}

function openHistoryLot(lotId) {
  selectedHistoryLotId = lotId;
  historyLotCropFilter = "Todos";
  historyLotCampaignFilter = "Todos";
  renderHistoryLotDetail();
  switchView("ficha-historico-lote");
}

function renderHistoryCropDetail(records = historicalYieldRecords()) {
  const title = document.querySelector("#historyCropTitle");
  const target = document.querySelector("#historyCropDetail");
  if (!target) return;
  const crop = selectedHistoryCrop;
  title.textContent = crop ? `Detalle de ${crop}` : "Detalle por cultivo";
  if (!crop) {
    target.innerHTML = `<div class="empty">Elegí un cultivo para ver el detalle.</div>`;
    return;
  }

  const cropRecords = records.filter((record) => historyCropGroup(record.crop) === crop);
  const avgByLot = Array.from(cropRecords.reduce((map, record) => {
    const lotLabel = record.lot?.name || record.lotName || record.lotId || "Sin lote";
    const item = map.get(lotLabel) || { total: 0, count: 0, lotLabel };
    if (record.yieldKgHa) {
      item.total += record.yieldKgHa;
      item.count += 1;
    }
    map.set(lotLabel, item);
    return map;
  }, new Map()).values()).filter((item) => item.count).sort((a, b) => (b.total / b.count) - (a.total / a.count));

  target.innerHTML = `
    <div class="history-split">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Lote</th><th>Promedio kg/ha</th><th>Años con rinde</th></tr></thead>
          <tbody>
            ${avgByLot.map((item) => `<tr><td>${item.lotLabel}</td><td><strong>${number(item.total / item.count)}</strong></td><td>${item.count}</td></tr>`).join("") || `<tr><td colspan="3">No hay rindes para promediar.</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Campaña</th><th>Lote</th><th>Cultivo</th><th>Var./Híb.</th><th>ENSO</th><th>Rinde kg/ha</th></tr></thead>
          <tbody>
            ${cropRecords.map((record) => `
              <tr>
                <td>${record.campaign}</td>
                <td>${record.lot?.name || record.lotName || record.lotId || "Sin lote"}</td>
                <td>${record.crop}</td>
                <td>${record.variety || "-"}</td>
                <td>${record.enso || "-"}</td>
                <td>${renderYieldComparedTo(record, averageYield(records.filter((item) => item.crop === record.crop)))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderHistoryLotDetail(records = historicalYieldRecords()) {
  const target = document.querySelector("#historyLotDetail");
  const title = document.querySelector("#historyLotTitle");
  if (!target) return;
  const lot = data.lots.find((item) => item.id === selectedHistoryLotId);
  const lotRecords = lot ? records.filter((record) => sameLot(record, lot)) : [];
  const cropFilter = document.querySelector("#historyLotCropFilter");
  const campaignFilter = document.querySelector("#historyLotCampaignFilter");
  const cropOptions = Array.from(new Set(lotRecords.map((record) => record.crop).filter(Boolean))).sort();
  const campaignOptions = Array.from(new Set(lotRecords.map((record) => record.campaign).filter(Boolean))).sort().reverse();
  if (cropFilter) {
    cropFilter.innerHTML = `<option>Todos</option>${cropOptions.map((crop) => `<option>${crop}</option>`).join("")}`;
    cropFilter.value = cropOptions.includes(historyLotCropFilter) ? historyLotCropFilter : "Todos";
    historyLotCropFilter = cropFilter.value;
  }
  if (campaignFilter) {
    campaignFilter.innerHTML = `<option>Todos</option>${campaignOptions.map((campaign) => `<option>${campaign}</option>`).join("")}`;
    campaignFilter.value = campaignOptions.includes(historyLotCampaignFilter) ? historyLotCampaignFilter : "Todos";
    historyLotCampaignFilter = campaignFilter.value;
  }
  const visibleLotRecords = lotRecords.filter((record) =>
    (historyLotCropFilter === "Todos" || record.crop === historyLotCropFilter)
    && (historyLotCampaignFilter === "Todos" || record.campaign === historyLotCampaignFilter)
  );
  const cropAverages = cropYieldAverages(records);
  const lotCropAverages = Array.from(lotRecords.reduce((map, record) => {
    if (!record.yieldKgHa) return map;
    const item = map.get(record.crop) || { crop: record.crop, total: 0, count: 0 };
    item.total += record.yieldKgHa;
    item.count += 1;
    map.set(record.crop, item);
    return map;
  }, new Map()).values()).sort((a, b) => (b.total / b.count) - (a.total / a.count));
  if (title) title.textContent = lot ? `Historia de ${displayLotName(lot)}` : "Historia por lote";

  target.innerHTML = `
    <div class="history-crop-grid compact-history-grid">
      ${lotCropAverages.map((item) => `
        <article class="history-crop-card ${historyCropCardClass(item.crop)}">
          <strong>${item.crop}</strong>
          <span>${number(item.total / item.count)} kg/ha promedio</span>
          <small>${item.count} campaña${item.count === 1 ? "" : "s"} con rinde</small>
        </article>
      `).join("") || `<div class="empty">Este lote no tiene rindes para promediar.</div>`}
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Campaña</th><th>Cultivo</th><th>Var./Híb.</th><th>ENSO</th><th>Ha</th><th>Kg cosechados</th><th>Rinde kg/ha</th></tr></thead>
        <tbody>
          ${visibleLotRecords.map((record) => `
            <tr>
              <td>${record.campaign}</td>
              <td>${record.crop}</td>
              <td>${record.variety || "-"}</td>
              <td>${record.enso || "-"}</td>
              <td>${numberOptional(record.hectares, 2)}</td>
              <td>${numberOptional(record.kgHarvested)}</td>
              <td>${renderYieldCell(record, cropAverages)}</td>
            </tr>
          `).join("") || `<tr><td colspan="7">No hay registros con esos filtros.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

// Con crop: solo los costos de ese cultivo (cuando la campaña del lote tiene más de un cultivo).
function applicationCostForLot(lotId, campaign = "", crop = "") {
  const lot = data.lots.find((item) => item.id === lotId);
  if (!lot) return 0;
  const targetCampaign = normalizeCampaignValue(campaign || lot.campaign);
  const targetCrop = lotRotationSequence(lot, targetCampaign).length > 1 ? canonicalCropName(crop) : "";
  const eligibleOrders = data.orders.filter((order) => (
    sameLot(order, lot)
    && order.status === "Finalizada"
    && recordMatchesCampaign(order, lot, targetCampaign)
    && (!targetCrop || orderCostCrop(order, lot, targetCampaign) === targetCrop)
  ));
  const eligibleOrderIds = new Set(eligibleOrders.map((order) => order.id));
  const labor = eligibleOrders.reduce((sum, order) => sum + laborCostForOrder(order), 0);
  const seenStandaloneLabor = new Set();
  let standaloneLabor = 0;
  const products = uniqueApplicationRows(data.applications)
    .filter((application) => {
      if (!sameLot(application, lot) || !recordMatchesCampaign(application, lot, targetCampaign)) return false;
      const order = orderById(application.orderId);
      if (!order && targetCrop && applicationCostCrop(application, lot, targetCampaign) !== targetCrop) return false;
      return !order || eligibleOrderIds.has(order.id);
    })
    .reduce((sum, application) => {
      if (!orderById(application.orderId) && !seenStandaloneLabor.has(application.id)) {
        standaloneLabor += parseDecimal(application.laborCostTotal);
        seenStandaloneLabor.add(application.id);
      }
      return sum + applicationProductCost(application);
    }, 0);
  return products + labor + standaloneLabor;
}

function renderClosures() {
  const filter = document.querySelector("#closureCropFilter");
  const crops = Array.from(new Set(data.closures.map((closure) => closure.crop).filter(Boolean))).sort();
  if (filter) {
    const current = closureCropFilter;
    filter.innerHTML = `<option>Todos</option>${crops.map((crop) => `<option>${crop}</option>`).join("")}`;
    filter.value = crops.includes(current) ? current : "Todos";
    closureCropFilter = filter.value;
  }
  const visibleClosures = data.closures
    .filter((closure) => closureCropFilter === "Todos" || closure.crop === closureCropFilter);

  document.querySelector("#closuresTable").innerHTML = visibleClosures
    .slice()
    .sort((a, b) => String(b.campaign || "").localeCompare(String(a.campaign || "")))
    .map((closure) => `
      <tr>
        <td>${findLot(closure)?.name || closure.lotName || closure.lote || closure.lotId || "Sin lote"}</td>
        <td>${closure.campaign}</td>
        <td>${closure.crop}</td>
        <td>${closure.variety || "-"}</td>
        <td>${closure.enso || "-"}</td>
        <td>${numberOptional(closure.kgHarvested)}</td>
        <td>${numberOptional(closureYield(closure))}</td>
        <td>${moneyOptional(closure.income)}</td>
        <td>${moneyOptional(closure.grossMargin)}</td>
      </tr>
    `)
    .join("") || `<tr><td colspan="9">No hay cierres cargados.</td></tr>`;
}

// ===== Fase 3: fotos completas a Drive =====
// La miniatura sigue en la planilla (la ven todos al instante). La foto completa espera en el celular (IndexedDB,
// no ocupa el espacio de localStorage) y se sube a Drive después de sincronizar el registro.
const photoUploadDbName = "gestion-agro-fotos";
const fullPhotoBySmall = new Map();
let photoUploadsPending = 0;
let photoUploadRunning = false;

function photoUploadDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("Este navegador no permite guardar fotos completas")); return; }
    const request = indexedDB.open(photoUploadDbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("uploads", { keyPath: "uploadId" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function photoUploadStore(mode, action) {
  const db = await photoUploadDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("uploads", mode);
    const result = action(tx.objectStore("uploads"));
    tx.oncomplete = () => { db.close(); resolve(result?.result ?? result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function listPhotoUploads() {
  try {
    const uploads = await photoUploadStore("readonly", (store) => store.getAll());
    photoUploadsPending = uploads.length;
    return uploads;
  } catch {
    photoUploadsPending = 0;
    return [];
  }
}

async function queuePhotoUploads(table, recordId, dataUrls) {
  const items = dataUrls.filter(Boolean).map((dataUrl) => ({ uploadId: uid("foto").replace(/[^a-zA-Z0-9_-]/g, ""), table, recordId, dataUrl, createdAt: new Date().toISOString(), attempts: 0, lastError: "" }));
  if (!items.length) return;
  try {
    await photoUploadStore("readwrite", (store) => items.forEach((item) => store.put(item)));
    await listPhotoUploads();
    renderSyncStatus();
  } catch (error) {
    showToast("No se pudo guardar la foto completa en el celular: queda solo la miniatura");
  }
}

// Foto completa para Drive: hasta 1600 px, JPEG. Se calcula en paralelo a la miniatura.
async function rememberFullPhoto(file, smallDataUrl) {
  if (!file || !smallDataUrl) return;
  const full = await readImageAsDataUrl(file, 1600, 3000000);
  if (full) fullPhotoBySmall.set(smallDataUrl, full);
}

async function processPhotoUploads() {
  if (photoUploadRunning || !syncConfig.apiUrl || navigator.onLine === false) return;
  const uploads = await listPhotoUploads();
  if (!uploads.length) return;
  photoUploadRunning = true;
  let uploaded = 0;
  try {
    for (const upload of uploads) {
      let result;
      try {
        const response = await fetchWithTimeout(syncConfig.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "uploadPhoto", key: syncConfig.apiKey || "", upload: { uploadId: upload.uploadId, table: upload.table, recordId: upload.recordId, dataUrl: upload.dataUrl } })
        }, photoUploadTimeoutMs);
        result = await response.json();
      } catch {
        break; // sin conexión: se reintenta en la próxima sincronización
      }
      if (result?.ok) {
        await photoUploadStore("readwrite", (store) => store.delete(upload.uploadId));
        uploaded += 1;
        const record = syncCollection(upload.table).find((item) => item.id === upload.recordId);
        if (record && result.url && !String(record.driveLinks || "").includes(result.url)) {
          record.driveLinks = [record.driveLinks, result.url].filter(Boolean).join("\n");
        }
        continue;
      }
      if (/clave de acceso/i.test(result?.error || "")) break;
      upload.attempts = (upload.attempts || 0) + 1;
      upload.lastError = result?.pending ? "" : (result?.error || "No se pudo subir");
      await photoUploadStore("readwrite", (store) => store.put(upload));
    }
  } finally {
    photoUploadRunning = false;
    await listPhotoUploads();
    if (uploaded) {
      saveData();
      renderAll();
      showToast(`${uploaded} foto${uploaded === 1 ? "" : "s"} subida${uploaded === 1 ? "" : "s"} a Drive`);
    } else {
      renderSyncStatus();
    }
  }
}

function driveLinksHtml(record, label = "Foto completa") {
  const links = String(record?.driveLinks || "").split(/\s+/).filter((link) => /^https:\/\/(drive|docs)\.google\.com\//.test(link));
  if (!links.length) return "";
  return `<span class="drive-links">${links.map((link, index) => `<a class="link-button" href="${escapeHtml(link)}" target="_blank" rel="noopener">${label}${links.length > 1 ? ` ${index + 1}` : ""} en Drive</a>`).join(" ")}</span>`;
}

// ===== Fase 3: orden de trabajo para mandar al contratista =====
function lotCentroidLink(lot) {
  const polygon = polygonForLot(lot);
  const points = (polygon?.coordinates || []).filter((point) => Array.isArray(point) && point.length >= 2);
  if (!points.length) return "";
  const lon = points.reduce((sum, point) => sum + Number(point[0]), 0) / points.length;
  const lat = points.reduce((sum, point) => sum + Number(point[1]), 0) / points.length;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`;
}

function orderShareText(orderId) {
  const order = orderById(orderId);
  if (!order) return "";
  const lot = findLot(order);
  const rows = uniqueApplicationRows(applicationsForOrder(order.id));
  const hectares = parseDecimal(order.plannedHectares || rows[0]?.hectares);
  const location = lot ? lotCentroidLink(lot) : "";
  const lines = [
    `*Orden de trabajo ${orderShortLabel(order)}*`,
    `Tarea: ${order.task || "-"}`,
    `Fecha: ${dateShort(order.date)}`,
    `Lote: ${lotName(order.lotId)}${lot?.farm ? ` (${lot.farm})` : ""}`,
    `Superficie: ${number(hectares, 2)} ha`,
    `Cultivo: ${order.crop || lotCrop(order.lotId) || "-"}${order.variety ? ` · ${order.variety}` : ""}`,
    `Contratista: ${order.owner || "-"}`
  ];
  if (location) lines.push(`Ubicación: ${location}`);
  if (rows.length) {
    lines.push("", "*Receta*");
    rows.forEach((row) => {
      const product = applicationProduct(row);
      const unit = product?.unit || "";
      lines.push(`• ${row.productName || productName(row.productId)}: ${number(parseDecimal(row.dose), 3)} ${unit}/ha → total ${number(applicationQuantity(row), 2)} ${unit}${product?.warehouse ? ` (${product.warehouse})` : ""}`);
    });
  }
  if (order.notes) lines.push("", `Observaciones: ${order.notes}`);
  return lines.join("\n");
}

async function shareOrder(orderId, mode = "share") {
  const text = orderShareText(orderId);
  if (!text) return;
  if (mode === "copy") {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Orden copiada");
    } catch {
      showToast("No se pudo copiar automáticamente");
    }
    return;
  }
  if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ text });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

// ===== Fase 3: resumen por contratista =====
let contractorCampaign = "";
let selectedContractorKey = "";

function contractorKey(name) {
  return normalizeName(name).replace(/\s+/g, " ");
}

function orderWorkMonth(order) {
  return String(order.completionDate || order.date || "").slice(0, 7);
}

function monthLabel(month) {
  const [year, value] = String(month).split("-");
  const names = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return value ? `${names[Number(value) - 1] || value} ${year}` : "Sin fecha";
}

function buildContractorSummary(campaign = contractorCampaign) {
  const groups = new Map();
  data.orders
    .filter((order) => order.status !== "Cancelada")
    .filter((order) => !campaign || normalizeCampaignValue(order.campaign || findLot(order)?.campaign) === campaign)
    .forEach((order) => {
      const key = contractorKey(order.owner) || "(sin contratista)";
      if (!groups.has(key)) groups.set(key, { key, names: new Map(), months: new Map(), orders: [], hectares: 0, labor: 0, missingCost: 0 });
      const group = groups.get(key);
      const name = String(order.owner || "").trim() || "(sin contratista)";
      group.names.set(name, (group.names.get(name) || 0) + 1);
      const month = orderWorkMonth(order);
      if (!group.months.has(month)) group.months.set(month, { month, orders: [], hectares: 0, labor: 0, missingCost: 0, tasks: new Map() });
      const bucket = group.months.get(month);
      const hectares = parseDecimal(order.plannedHectares);
      const labor = laborCostForOrder(order);
      [group, bucket].forEach((target) => {
        target.orders.push(order);
        target.hectares += hectares;
        target.labor += labor;
        if (!(labor > 0)) target.missingCost += 1;
      });
      bucket.tasks.set(order.task || "-", (bucket.tasks.get(order.task || "-") || 0) + hectares);
    });
  return [...groups.values()].map((group) => ({
    ...group,
    name: [...group.names.entries()].sort((a, b) => b[1] - a[1])[0][0],
    variants: [...group.names.keys()],
    months: [...group.months.values()].sort((a, b) => b.month.localeCompare(a.month))
  })).sort((a, b) => b.labor - a.labor);
}

function renderContractors() {
  const view = document.querySelector("#contratistas");
  if (!view) return;
  const select = view.querySelector("#contractorCampaignSelect");
  const options = costCampaignOptions();
  if (contractorCampaign === "" && !select.dataset.bound) contractorCampaign = activeCampaignValue();
  select.innerHTML = [`<option value="">Todas las campañas</option>`, ...options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join("");
  select.value = contractorCampaign;
  if (!select.dataset.bound) {
    select.dataset.bound = "true";
    select.addEventListener("change", () => { contractorCampaign = select.value; renderContractors(); });
    view.querySelector("#contractorCsv").addEventListener("click", downloadContractorCsv);
  }
  const groups = buildContractorSummary(contractorCampaign);
  const totals = groups.reduce((acc, group) => ({ hectares: acc.hectares + group.hectares, labor: acc.labor + group.labor, orders: acc.orders + group.orders.length, missing: acc.missing + group.missingCost }), { hectares: 0, labor: 0, orders: 0, missing: 0 });
  view.querySelector("#contractorSummary").innerHTML = `
    <article><span>Labores</span><strong>${money(totals.labor)}</strong></article>
    <article><span>Hectáreas trabajadas</span><strong>${number(totals.hectares, 0)} ha</strong></article>
    <article><span>Órdenes</span><strong>${totals.orders}</strong></article>
    <article><span>Sin costo cargado</span><strong>${totals.missing}</strong></article>`;
  view.querySelector("#contractorTable").innerHTML = groups.map((group) => {
    const open = selectedContractorKey === group.key;
    const header = `
      <tr class="clickable-row contractor-row ${open ? "open" : ""}" data-contractor="${escapeHtml(group.key)}">
        <td><b>${escapeHtml(group.name)}</b>${group.variants.length > 1 ? `<br><small class="muted">También escrito: ${escapeHtml(group.variants.filter((name) => name !== group.name).join(", "))}</small>` : ""}</td>
        <td>${open ? "▾" : "▸"} ${group.months.length} mes${group.months.length === 1 ? "" : "es"}</td>
        <td>${group.orders.length}</td>
        <td>${number(group.hectares, 1)}</td>
        <td>${money(group.labor)}</td>
        <td>${group.hectares ? money(group.labor / group.hectares) : "-"}</td>
        <td>${group.missingCost ? `<span class="badge warn">${group.missingCost} sin costo</span>` : ""}</td>
      </tr>`;
    const months = open ? group.months.map((month) => `
      <tr class="contractor-month">
        <td colspan="2">${escapeHtml(monthLabel(month.month))}<br><small class="muted">${escapeHtml([...month.tasks.entries()].map(([task, ha]) => `${task} ${number(ha, 0)} ha`).join(" · "))}</small></td>
        <td>${month.orders.length}</td>
        <td>${number(month.hectares, 1)}</td>
        <td>${money(month.labor)}</td>
        <td>${month.hectares ? money(month.labor / month.hectares) : "-"}</td>
        <td>${month.orders.map((order) => `<button class="link-button" type="button" data-contractor-order="${escapeHtml(order.id)}">${escapeHtml(orderShortLabel(order))}</button>`).join(" ")}</td>
      </tr>`).join("") : "";
    return header + months;
  }).join("") || `<tr><td colspan="7">No hay órdenes para esta campaña.</td></tr>`;
  view.querySelectorAll("[data-contractor]").forEach((row) => row.addEventListener("click", () => {
    selectedContractorKey = selectedContractorKey === row.dataset.contractor ? "" : row.dataset.contractor;
    renderContractors();
  }));
  view.querySelectorAll("[data-contractor-order]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    openOrderDetail(button.dataset.contractorOrder, "contratistas");
  }));
}

function downloadContractorCsv() {
  const groups = buildContractorSummary(contractorCampaign);
  const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const decimal = (value, digits = 2) => Number(value || 0).toFixed(digits).replace(".", ",");
  const lines = [["Contratista", "Mes", "Orden", "Fecha", "Fecha finalización", "Lote", "Tarea", "Ha", "Labor u$s/ha", "Labor u$s total", "Campaña", "Estado"].map(cell).join(";")];
  groups.forEach((group) => group.months.forEach((month) => month.orders.forEach((order) => {
    lines.push([group.name, month.month, orderShortLabel(order), order.date, order.completionDate || "", lotName(order.lotId), order.task, decimal(order.plannedHectares), decimal(order.laborCostHa), decimal(laborCostForOrder(order)), order.campaign || "", order.status].map(cell).join(";"));
  })));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `labores-contratistas-${(contractorCampaign || "todas").replace("/", "-")}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

// ===== Fase 3: aviso de compra repetida =====
// Misma fecha, misma cantidad y mismo precio que un ingreso ya cargado con OTRO número: suele ser la misma compra
// cargada dos veces (pasó con Urea y Picloram). Se pregunta antes de guardar.
function possibleDuplicatePurchases(lines, shared, toUsd) {
  const warnings = [];
  lines.forEach((line) => {
    const product = findDepositProductMatch({ ...line, warehouse: shared.warehouse || "" }) || matchingProductByName(line.name);
    if (!product) return;
    const quantity = parseDecimal(line.quantity);
    const unitCost = toUsd(line.unitCost);
    receiptEntries(product).forEach((entry) => {
      if (!entry.detailed || entry.date !== shared.receiptDate) return;
      if (Math.abs(parseDecimal(entry.quantity) - quantity) > 0.001) return;
      if (Math.abs(parseDecimal(entry.unitCost) - unitCost) > Math.max(0.01, unitCost * 0.005)) return;
      if (normalizeName(entry.number) === normalizeName(shared.receiptNumber)) return;
      warnings.push(`${line.name}: ${number(quantity, 2)} a ${number(unitCost, 2)} el ${dateShort(entry.date)} ya está cargado con el comprobante ${entry.number}${entry.supplier ? ` (${entry.supplier})` : ""}`);
    });
  });
  return warnings;
}

function renderAll() {
  averageCostVersion += 1;
  fillSelects();
  renderContractors();
  applyActiveCampaignDefaults();
  renderSyncStatus();
  renderDashboard();
  renderLots();
  renderOrders();
  renderMonitors();
  renderApplications();
  renderProducts();
  ensureVouchersPanel();
  renderVouchers();
  renderCosts();
  renderMap();
  renderRotation();
  renderHistoryPanel();
  renderClosures();
  if (document.querySelector("#ficha-campana")?.classList.contains("active")) renderCampaignDetail();
  if (document.querySelector("#ficha-orden")?.classList.contains("active") && selectedOrderId) renderOrderDetail(selectedOrderId);
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function resetForm(form) {
  const currentDate = form.querySelector('input[type="date"]')?.value;
  form.reset();
  if (currentDate && form.querySelector('input[type="date"]')) {
    form.querySelector('input[type="date"]').valueAsDate = new Date();
  }
}

function bindForms() {
  document.querySelector("#newLotButton")?.addEventListener("click", openLotFormForNew);
  document.querySelector("#lotForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formData(form);
    const record = { id: editingLotId || uid("lot"), ...values, hectares: parseDecimal(values.hectares) };
    if (editingLotId) {
      const index = data.lots.findIndex((lot) => lot.id === editingLotId);
      if (index >= 0) {
        data.lots[index] = { ...data.lots[index], ...record };
        queueSync("lots", data.lots[index], "update");
      }
      editingLotId = "";
      event.currentTarget.querySelector('button[type="submit"]').textContent = "Guardar lote";
    } else {
      data.lots.push(record);
      queueSync("lots", record);
    }
    saveData();
    resetForm(event.currentTarget);
    renderAll();
    document.querySelector("#lotFormBand")?.classList.add("hidden-panel");
    showToast("Lote guardado");
  });

  initializeDepositFormLayout();
  document.querySelector("#productForm").addEventListener("submit", handleDepositProductSubmit, true);
  document.querySelector("#newDepositButton")?.addEventListener("click", openProductFormForNew);
  document.querySelector("#productForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = formData(event.currentTarget);
    const existing = editingProductId
      ? data.products.find((product) => product.id === editingProductId)
      : matchingProductByName(values.name);
    const isNewIngreso = !editingProductId && Boolean(existing);
    if (!editingProductId && !values.receiptDate) {
      showToast("Indicá la fecha de compra o del remito");
      return;
    }
    if (!editingProductId && existing && values.receiptNumber && hasReceiptNumber(existing, values.receiptNumber)) {
      showToast("Ese remito ya está cargado para este producto");
      return;
    }
    const receiptNumbers = editingProductId
      ? receiptText(existing)
      : appendReceiptEntry(receiptText(existing), values.receiptNumber, values.receiptDate, values.quantity, values.unitCost);
    const record = {
      ...(existing || {}),
      id: existing?.id || uid("prod"),
      ...values,
      quantity: isNewIngreso ? baseStock(existing) + parseDecimal(values.quantity) : parseDecimal(values.quantity),
      unitCost: parseDecimal(values.unitCost),
      receiptNumbers
    };
    delete record.receiptNumber;
    delete record.receiptDate;
    delete record.calculatedStock;
    delete record.applicationUse;
    if (existing) {
      const index = data.products.findIndex((product) => product.id === existing.id);
      if (index >= 0) data.products[index] = record;
      queueSync("products", record, "update");
      recalculateApplicationsForProduct(record);
    } else {
      data.products.push(record);
      queueSync("products", record);
    }
    saveData();
    editingProductId = "";
    resetForm(event.currentTarget);
    event.currentTarget.elements.receiptDate.required = true;
    event.currentTarget.elements.receiptDate.value = todayValue();
    document.querySelector("#productFormTitle").textContent = "Nuevo ingreso al depósito";
    document.querySelector("#productQuantityLabel").firstChild.textContent = "Cantidad ";
    event.currentTarget.querySelector('button[type="submit"]').textContent = "Guardar ingreso";
    document.querySelector("#cancelProductEdit")?.classList.add("hidden-panel");
    renderAll();
    showToast(isNewIngreso ? "Ingreso sumado al producto existente" : existing ? "Producto y costos actualizados" : "Producto guardado");
  });
  document.querySelector("#cancelProductEdit")?.addEventListener("click", cancelProductEdit);
  document.querySelector("#productForm")?.elements?.name?.addEventListener("change", applyExistingProductDefaults);
  document.querySelector("#productNameFilter")?.addEventListener("input", renderProducts);
  document.querySelector("#productReceiptFilter")?.addEventListener("input", renderProducts);
  document.querySelector("#productReceiptDateFrom")?.addEventListener("change", renderProducts);
  document.querySelector("#productReceiptDateTo")?.addEventListener("change", renderProducts);
  document.querySelector("#productReceiptDateSort")?.addEventListener("change", renderProducts);
  document.querySelector("#productForm").elements.receiptDate.value = todayValue();

  const orderForm = document.querySelector("#orderForm");
  document.querySelector("#newOrderButton")?.addEventListener("click", openOrderFormForNew);
  document.querySelector("#cancelOrderForm")?.addEventListener("click", cancelOrderForm);
  document.querySelector("#orderCompletionForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const completionDate = document.querySelector("#orderCompletionDate")?.value || "";
    if (!pendingCompletionOrderId || !completionDate) return;
    completeOrder(pendingCompletionOrderId, completionDate);
    pendingCompletionOrderId = "";
    document.querySelector("#orderCompletionDialog")?.close();
  });
  document.querySelector("#cancelOrderCompletion")?.addEventListener("click", () => {
    pendingCompletionOrderId = "";
    document.querySelector("#orderCompletionDialog")?.close();
  });
  orderForm.elements.lotId.addEventListener("change", () => {
    applyOrderLotDefaultHectares();
    applyLotDefaultCrop(orderForm);
    applyLotDefaultVariety(orderForm);
  });
  orderForm.elements.crop.addEventListener("input", () => {
    if (orderForm.elements.crop.value !== orderForm.dataset.defaultCrop) orderForm.dataset.defaultCrop = "";
  });
  orderForm.elements.variety.addEventListener("input", () => {
    if (orderForm.elements.variety.value !== orderForm.dataset.defaultVariety) orderForm.dataset.defaultVariety = "";
  });
  orderForm.elements.taskPreset.addEventListener("change", () => {
    if (orderForm.elements.taskPreset.value) orderForm.elements.task.value = orderForm.elements.taskPreset.value;
  });
  orderForm.elements.ownerPreset.addEventListener("change", () => {
    if (orderForm.elements.ownerPreset.value) orderForm.elements.owner.value = orderForm.elements.ownerPreset.value;
  });
  orderForm.elements.status.addEventListener("change", () => {
    if (orderForm.elements.status.value === "Finalizada" && orderForm.dataset.originalStatus !== "Finalizada") {
      orderForm.dataset.completionDate = todayValue();
    }
  });
  orderForm.elements.plannedHectares.addEventListener("input", () => {
    if (orderForm.elements.plannedHectares.value !== orderForm.dataset.defaultHectares) {
      orderForm.dataset.defaultHectares = "";
    }
  });

  document.querySelector("#orderForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = formData(event.currentTarget);
    delete values.taskPreset;
    delete values.ownerPreset;
    const plannedHectares = parseDecimal(values.plannedHectares);
    const laborCostHa = parseDecimal(values.laborCostHa);
    const existing = editingOrderId ? data.orders.find((order) => order.id === editingOrderId) : null;
    const lot = findLot(values);
    if (values.owner) values.owner = canonicalContractorName(values.owner);
    const record = {
      id: editingOrderId || uid("ord"),
      ...values,
      campaign: normalizeCampaignValue(existing?.campaign || lot?.campaign),
      completionDate: values.status === "Finalizada"
        ? (existing?.completionDate || event.currentTarget.dataset.completionDate || todayValue())
        : "",
      plannedHectares,
      laborCostHa,
      laborCostTotal: plannedHectares * laborCostHa
    };
    if (editingOrderId) {
      const index = data.orders.findIndex((order) => order.id === editingOrderId);
      if (index >= 0) {
        data.orders[index] = { ...data.orders[index], ...record };
        queueSync("orders", data.orders[index], "update");
      }
      editingOrderId = "";
      event.currentTarget.querySelector('button[type="submit"]').textContent = "Guardar orden";
      event.currentTarget.dataset.originalStatus = "";
    } else {
      data.orders.push(record);
      queueSync("orders", record);
    }
    saveData();
    resetForm(event.currentTarget);
    applyOrderLotDefaultHectares(true);
    applyLotDefaultCrop(event.currentTarget, true);
    applyLotDefaultVariety(event.currentTarget, true);
    renderAll();
    document.querySelector("#orderFormBand")?.classList.add("hidden-panel");
    showToast("Orden guardada");
  });

  const monitorForm = document.querySelector("#monitorForm");
  document.querySelector("#newMonitorButton")?.addEventListener("click", openMonitorFormForNew);
  document.querySelector("#cancelMonitorForm")?.addEventListener("click", cancelMonitorForm);
  monitorForm.elements.lotId.addEventListener("change", () => {
    applyLotDefaultCrop(monitorForm);
    applyLotDefaultVariety(monitorForm);
  });
  monitorForm.elements.crop.addEventListener("input", () => {
    if (monitorForm.elements.crop.value !== monitorForm.dataset.defaultCrop) monitorForm.dataset.defaultCrop = "";
  });
  monitorForm.elements.variety.addEventListener("input", () => {
    if (monitorForm.elements.variety.value !== monitorForm.dataset.defaultVariety) monitorForm.dataset.defaultVariety = "";
  });
  monitorForm.elements.photoFile?.addEventListener("change", async () => {
    try {
      const photos = await readMonitorPhotos(monitorForm.elements.photoFile);
      monitorPhotoDraft = [...monitorPhotoDraft, ...photos].slice(0, 4);
      updateMonitorPhotoPreview(monitorPhotoDraft);
      monitorForm.elements.photoFile.value = "";
    } catch (error) {
      showToast(error?.message || "No se pudieron previsualizar las fotos");
    }
  });
  document.querySelectorAll("[data-set-barbecho]").forEach((button) => {
    button.addEventListener("click", () => {
      const form = document.querySelector(`#${button.dataset.setBarbecho}`);
      if (!form?.elements?.crop) return;
      form.elements.crop.value = "Barbecho";
      if (form.elements.variety) form.elements.variety.value = "";
      form.dataset.defaultCrop = "Barbecho";
      form.dataset.defaultVariety = "";
    });
  });

  document.querySelector("#monitorForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalLabel = submitButton?.textContent || "Guardar monitoreo";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Guardando...";
    }
    try {
      const values = formData(form);
      delete values.photoFile;
      const existing = editingMonitorId ? data.monitors.find((monitor) => monitor.id === editingMonitorId) : null;
      const selectedPhotos = await readMonitorPhotos(form.elements.photoFile);
      const photos = [...monitorPhotoDraft, ...selectedPhotos].slice(0, 4);
      const record = {
        id: editingMonitorId || uid("mon"),
        ...values,
        crop: values.crop || lotCrop(values.lotId),
        variety: values.variety || lotVariety(values.lotId),
        photo: serializeMonitorPhotos(photos)
      };
      if (editingMonitorId) {
        const index = data.monitors.findIndex((monitor) => monitor.id === editingMonitorId);
        if (index >= 0) {
          data.monitors[index] = { ...data.monitors[index], ...record };
          queueSync("monitors", data.monitors[index], "update");
        }
        editingMonitorId = "";
      } else {
        data.monitors.push(record);
        queueSync("monitors", record);
      }
      saveData();
      await queuePhotoUploads("monitors", record.id, photos.map((photo) => fullPhotoBySmall.get(photo)));
      photos.forEach((photo) => fullPhotoBySmall.delete(photo));
      resetForm(form);
      if (form.elements.photoFile) form.elements.photoFile.value = "";
      monitorPhotoDraft = [];
      updateMonitorPhotoPreview([]);
      document.querySelector("#monitorFormBand")?.classList.add("hidden-panel");
      renderAll();
      openMonitorDetail(record.id);
      showToast("Monitoreo guardado");
    } catch (error) {
      showToast(error?.message || "No se pudo guardar el monitoreo");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = editingMonitorId ? originalLabel : "Guardar monitoreo";
      }
    }
  });

  const closureForm = document.querySelector("#closureForm");
  document.querySelector("#newClosureButton")?.addEventListener("click", openClosureFormForNew);
  document.querySelector("#cancelClosureForm")?.addEventListener("click", cancelClosureForm);
  closureForm.elements.lotId.addEventListener("change", () => applyClosureDefaults(closureForm, true));

  const applicationForm = document.querySelector("#applicationForm");
  document.querySelector("#newApplicationButton")?.addEventListener("click", openApplicationFormForNew);
  document.querySelector("#cancelApplicationForm")?.addEventListener("click", cancelApplicationForm);
  applicationForm.elements.productId.addEventListener("change", (event) => {
    toggleManualProductInput(event.currentTarget.form);
  });
  applicationForm.elements.totalQuantity?.addEventListener("input", updateApplicationDoseFromTotal);
  applicationForm.elements.hectares.addEventListener("input", () => {
    if (applicationForm.elements.totalQuantity?.value) updateApplicationDoseFromTotal();
    else updateApplicationTotalFromDose();
  });
  applicationForm.elements.dose.addEventListener("input", updateApplicationTotalFromDose);

  applicationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const wasEditingApplication = Boolean(editingApplicationKey);
    const submitAction = wasEditingApplication ? "finish" : (event.submitter?.dataset.applicationAction || "finish");
    const values = formData(event.currentTarget);
    const product = values.productId === "__manual__"
      ? getOrCreateManualProduct(values.manualProductName, values.manualProductUnit, values.lotId)
      : data.products.find((item) => item.id === values.productId);
    if (!product) {
      showToast("Elegí o escribí un producto");
      return;
    }
    values.productId = product.id;
    delete values.manualProductName;
    delete values.manualProductUnit;
    const hectares = parseDecimal(values.hectares);
    const totalQuantity = parseDecimal(values.totalQuantity);
    const dose = totalQuantity && hectares ? totalQuantity / hectares : parseDecimal(values.dose);
    const laborCostHa = parseDecimal(values.laborCostHa);
    const usedQuantity = totalQuantity || dose * hectares;
    const previousRow = editingApplicationKey ? findApplicationByKey(editingApplicationKey) : null;
    const pricingDate = orderById(values.orderId)?.date || values.date || "";
    const unitCost = unitCostForProductDate(product, pricingDate, previousRow?.unitCost);
    const productCost = usedQuantity * unitCost;
    const laborCost = laborCostHa * hectares;

    const linkedApplicationId = values.orderId ? firstApplicationIdForOrder(values.orderId) : "";
    const idTakenByOtherOrder = Boolean(values.id && values.orderId && data.applications.some((application) => (
      application.id === values.id && application.orderId && application.orderId !== values.orderId
    )));
    const applicationId = editingApplicationKey
      ? (values.id || previousRow?.id || uid("app"))
      : (linkedApplicationId || (idTakenByOtherOrder ? suggestedApplicationId(orderById(values.orderId) || { id: values.orderId }) : values.id) || previousRow?.id || uid("app"));
    const record = {
      id: applicationId,
      ...values,
      id: applicationId,
      _matchProductId: previousRow?.productId || values.productId,
      _matchProductName: previousRow?.productName || product?.name || "",
      _matchOrderId: previousRow?.orderId || values.orderId,
      dose,
      hectares,
      laborCostHa,
      laborCostTotal: laborCost,
      usedQuantity,
      unitCost,
      productName: product?.name || "",
      campaign: normalizeCampaignValue(orderById(values.orderId)?.campaign || findLot(values)?.campaign),
      productCost,
      totalCost: productCost
    };

    if (editingApplicationKey) {
      const index = data.applications.findIndex((application) => applicationKey(application) === editingApplicationKey);
      if (index >= 0) {
        data.applications[index] = { ...data.applications[index], ...record };
        queueSync("applications", data.applications[index], "update");
      }
      editingApplicationKey = "";
      configureApplicationSubmitButtons(false);
    } else {
      data.applications.push(record);
      queueSync("applications", record);
    }
    saveData();
    if (submitAction === "add") {
      const kept = {
        date: values.date,
        lotId: values.lotId,
        orderId: values.orderId,
        id: applicationId,
        hectares: values.hectares
      };
      resetForm(event.currentTarget);
      event.currentTarget.elements.date.value = kept.date;
      event.currentTarget.elements.lotId.value = kept.lotId;
      event.currentTarget.elements.orderId.value = kept.orderId;
      event.currentTarget.elements.id.value = kept.id;
      event.currentTarget.elements.hectares.value = kept.hectares;
      event.currentTarget.elements.laborCostHa.value = "0";
      toggleManualProductInput(event.currentTarget);
      configureApplicationSubmitButtons(false);
      renderAll();
      event.currentTarget.elements.productId.focus();
      showToast("Producto agregado. Podés cargar otro.");
    } else {
      resetForm(event.currentTarget);
      highlightedApplicationId = applicationId;
      applicationDraftOrderId = "";
      document.querySelector("#applicationFormBand")?.classList.add("hidden-panel");
      configureApplicationSubmitButtons(false);
      renderAll();
      switchView("aplicaciones");
      highlightedApplicationId = applicationId;
      renderApplications();
      window.setTimeout(() => {
        document.querySelector("#applicationDetail")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
      showToast(wasEditingApplication ? "Producto actualizado" : "Aplicación guardada y stock actualizado");
    }
  });

  document.querySelector("#closureForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = formData(event.currentTarget);
    const crop = canonicalCropName(values.crop);
    const hectares = parseDecimal(values.hectares);
    const kgHarvested = parseDecimal(values.kgHarvested);
    const priceTon = parseDecimal(values.priceTon);
    const otherCosts = parseDecimal(values.otherCosts);
    const applicationCosts = applicationCostForLot(values.lotId, values.campaign, crop);
    const income = (kgHarvested / 1000) * priceTon;
    const existing = editingClosureFormId
      ? data.closures.find((closure) => closure.id === editingClosureFormId)
      : data.closures.find((closure) => closure.lotId === values.lotId && closure.campaign === values.campaign && canonicalCropName(closure.crop) === crop);

    const record = {
      ...(existing || {}),
      id: existing?.id || uid("clo"),
      campaignGroupId: existing?.campaignGroupId || `CAM-${values.lotId}-${String(values.campaign || "").replace("/", "-")}`,
      ...values,
      crop,
      hectares,
      kgHarvested,
      priceTon,
      otherCosts,
      applicationCosts,
      applicationCostsManual: false,
      income,
      grossMargin: income - otherCosts - applicationCosts
    };

    if (existing) {
      const index = data.closures.findIndex((closure) => closure.id === existing.id);
      if (index >= 0) data.closures[index] = record;
      queueSync("closures", record, "update");
    } else {
      data.closures.push(record);
      queueSync("closures", record);
    }
    // Si el cultivo cosechado era el actual del lote, pasa al siguiente de la rotación (si ya está cargado).
    syncLotsWithRotation();
    saveData();
    const closedLot = data.lots.find((item) => item.id === values.lotId);
    const closedInfo = currentLotCropInfo(closedLot);
    const returnView = closureReturnView;
    editingClosureFormId = "";
    closureReturnView = "";
    event.currentTarget.querySelector('button[type="submit"]').textContent = "Guardar cierre";
    resetForm(event.currentTarget);
    applyClosureDefaults(event.currentTarget, true);
    renderAll();
    document.querySelector("#closureFormBand")?.classList.add("hidden-panel");
    if (returnView) {
      if (returnView === "ficha-campana") renderCampaignDetail();
      switchView(returnView);
    }
    showToast(closedInfo.harvested
      ? "Cierre guardado. Cargá el cultivo que sigue desde la ficha del lote"
      : kgHarvested > 0 ? `Cierre guardado. Cultivo actual: ${closedInfo.crop || "-"}` : "Campaña cerrada");
  });
}

function bindSyncTools() {
  const input = document.querySelector("#syncApiUrl");
  const keyInput = document.querySelector("#syncApiKey");
  const saveButton = document.querySelector("#saveSyncConfig");
  const syncButton = document.querySelector("#syncNow");
  const globalSyncButton = document.querySelector("#globalSyncNow");

  if (input) input.value = syncConfig.apiUrl || "";
  if (keyInput) keyInput.value = syncConfig.apiKey || "";
  saveButton?.addEventListener("click", () => {
    syncConfig.apiUrl = input.value.trim();
    // La clave de acceso queda solo en este dispositivo; nunca se escribe en el código.
    if (keyInput) syncConfig.apiKey = keyInput.value.trim();
    saveSyncConfig();
    renderSyncStatus();
    showToast(syncConfig.apiUrl ? "Configuración guardada" : "URL borrada");
    syncPending();
  });
  syncButton?.addEventListener("click", () => syncPending());
  document.querySelector("#syncTest")?.addEventListener("click", () => runConnectionTest());
  globalSyncButton?.addEventListener("click", () => syncPending());
  window.addEventListener("online", () => {
    renderSyncStatus();
    syncPending();
  });
  window.addEventListener("offline", renderSyncStatus);
}

function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      switchView(button.dataset.view);
      document.querySelector(".nav-more")?.removeAttribute("open");
    });
  });
}

function bindOrderFilters() {
  document.querySelectorAll("[data-order-filter-shortcut]").forEach((button) => {
    button.addEventListener("click", () => {
      orderFilter = button.dataset.orderFilterShortcut || "Todas";
      const statusSelect = document.querySelector("#orderStatusFilter");
      if (statusSelect) statusSelect.value = orderFilter;
      renderOrders();
      document.querySelector("#ordersTable")?.closest(".panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  document.querySelector("#orderStatusFilter")?.addEventListener("change", (event) => {
    orderFilter = event.target.value || "Todas";
    renderOrders();
  });
  document.querySelector("#orderCropFilter")?.addEventListener("change", (event) => {
    orderCropFilter = event.target.value || "Todos";
    renderOrders();
  });
  document.querySelector("#orderLotFilter")?.addEventListener("change", (event) => {
    orderLotFilter = event.target.value || "Todos";
    renderOrders();
  });
  document.querySelector("#orderProductFilter")?.addEventListener("change", (event) => {
    orderProductFilter = event.target.value || "Todos";
    renderOrders();
  });
  document.querySelector("#orderContractorFilter")?.addEventListener("change", (event) => {
    orderContractorFilter = event.target.value || "Todos";
    renderOrders();
  });
}

function bindApplicationTools() {
  const goBack = () => {
    highlightedApplicationId = "";
    applicationDraftOrderId = "";
    renderApplications();
    if (applicationBackView === "ficha-lote" && applicationBackLotId) {
      openLotDetail(applicationBackLotId);
    } else {
      switchView("ordenes");
    }
    applicationBackView = "ordenes";
    applicationBackLotId = "";
  };
  document.querySelector("#showAllApplications").addEventListener("click", () => {
    highlightedApplicationId = "";
    applicationDraftOrderId = "";
    applicationBackView = "ordenes";
    applicationBackLotId = "";
    renderApplications();
  });
  document.querySelector("#backToOrders").addEventListener("click", goBack);
  document.querySelector("#backToOrdersFromApplicationForm")?.addEventListener("click", goBack);
}

function bindMonitorTools() {
  document.querySelector("#backToMonitors")?.addEventListener("click", () => {
    selectedMonitorId = "";
    renderMonitors();
    switchView("monitoreo");
  });
}

function bindLotTools() {
  document.querySelector("#backToLots").addEventListener("click", () => switchView("lotes"));
  document.querySelector("#backFromOrderDetail")?.addEventListener("click", () => {
    if (orderDetailBackView === "ficha-lote" && orderDetailBackLotId) {
      openLotDetail(orderDetailBackLotId);
    } else if (orderDetailBackView === "ficha-deposito") {
      if (selectedProductId) renderProductDetail();
      if (selectedReceiptKey) renderReceiptDetail();
      switchView("ficha-deposito");
    } else {
      switchView(orderDetailBackView || "ordenes");
    }
  });
  document.querySelector("#cancelLotEdit")?.addEventListener("click", cancelLotEdit);
}

function bindHistoryTools() {
  document.querySelector("#historyCropCards")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-history-crop]");
    if (!button) return;
    openHistoryCrop(button.dataset.historyCrop);
  });
  document.querySelector("#openHistoryLot")?.addEventListener("click", () => {
    const lot = findHistoryLotFromSearch();
    if (!lot) {
      showToast("Elegí un lote de la lista");
      return;
    }
    openHistoryLot(lot.id);
  });
  document.querySelector("#historyLotSearch")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    document.querySelector("#openHistoryLot")?.click();
  });
  document.querySelector("#backToHistoryFromCrop")?.addEventListener("click", () => switchView("historico"));
  document.querySelector("#backToHistoryFromLot")?.addEventListener("click", () => {
    const input = document.querySelector("#historyLotSearch");
    if (input) input.value = "";
    selectedHistoryLotId = "";
    historyLotCropFilter = "Todos";
    historyLotCampaignFilter = "Todos";
    renderHistoryPanel();
    switchView("historico");
  });
}

function bindRotationTools() {
  document.querySelector("#rotacion")?.addEventListener("click", (event) => {
    if (!event.target.closest("#toggleRotationCampaigns")) return;
    rotationShowAllCampaigns = !rotationShowAllCampaigns;
    renderRotation();
  });
  document.querySelector("#rotationGrid")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-campaign-lot]");
    if (!button) return;
    openCampaignDetail(button.dataset.openCampaignLot, button.dataset.openCampaign);
  });
  document.querySelector("#backToRotation")?.addEventListener("click", () => {
    editingCampaignClosureId = "";
    switchView("rotacion");
  });
}

function bindClosureTools() {
  document.querySelector("#closureCropFilter")?.addEventListener("change", (event) => {
    closureCropFilter = event.target.value;
    renderClosures();
  });
  document.querySelector("#historyLotCropFilter")?.addEventListener("change", (event) => {
    historyLotCropFilter = event.target.value;
    renderHistoryLotDetail();
  });
  document.querySelector("#historyLotCampaignFilter")?.addEventListener("change", (event) => {
    historyLotCampaignFilter = event.target.value;
    renderHistoryLotDetail();
  });
}

function bindMapTools() {
  document.querySelectorAll(".map-zoom").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.mapZoom === "in") mapZoom = Math.min(8, mapZoom * 1.35);
      if (button.dataset.mapZoom === "out") mapZoom = Math.max(1, mapZoom / 1.35);
      if (button.dataset.mapZoom === "reset") {
        mapZoom = 2.2;
        mapPanX = 0;
        mapPanY = 0;
      }
      renderMap(selectedMapPolygonId);
    });
  });
}

function bindMapDrag(svg) {
  let start = null;

  svg.onpointerdown = (event) => {
    if (event.target.closest(".map-lot")) return;
    start = { x: event.clientX, y: event.clientY, panX: mapPanX, panY: mapPanY };
    svg.setPointerCapture(event.pointerId);
  };

  svg.onpointermove = (event) => {
    if (!start) return;
    mapPanX = start.panX + event.clientX - start.x;
    mapPanY = start.panY + event.clientY - start.y;
    applyMapTransform();
  };

  svg.onpointerup = () => {
    start = null;
  };

  svg.onpointercancel = () => {
    start = null;
  };
}

function switchView(viewName) {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewName));
  document.querySelector("#viewTitle").textContent = titles[viewName];
}

function bindMapUpload() {
  document.querySelector("#kmlInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith(".kmz")) {
      showToast("Por ahora cargá el archivo KML sin comprimir");
      event.target.value = "";
      return;
    }

    try {
      const polygons = parseKml(await file.text());
      if (!polygons.length) throw new Error("El KML no tiene polígonos.");
      data.mapPolygons = polygons;
      saveData();
      renderMap(polygons[0].id);
      showToast(`${polygons.length} polígonos cargados`);
    } catch (error) {
      showToast(error.message || "No se pudo cargar el KML");
    } finally {
      event.target.value = "";
    }
  });
}

function setToday() {
  document.querySelectorAll('input[type="date"]:not(#productReceiptDateFrom):not(#productReceiptDateTo)').forEach((input) => {
    input.valueAsDate = new Date();
  });
  document.querySelector("#productReceiptDateFrom").value = "";
  document.querySelector("#productReceiptDateTo").value = "";
}

function registerServiceWorker() {
  const canRegister = "serviceWorker" in navigator && ["http:", "https:"].includes(window.location.protocol);
  if (!canRegister) return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

setToday();
registerServiceWorker();
bindNavigation();
bindOrderFilters();
bindApplicationTools();
bindMonitorTools();
bindLotTools();
bindHistoryTools();
bindRotationTools();
bindClosureTools();
bindSyncTools();
bindForms();
initializeFilterClearTools();
bindMapUpload();
bindMapTools();
window.addEventListener("afterprint", () => {
  document.body.classList.remove("printing-application-order");
  delete document.body.dataset.printApplicationId;
});
if (syncLotsWithRotation()) saveData();
renderAll();
listPhotoUploads().then(renderSyncStatus);
applyOrderLotDefaultHectares(true);
applyLotDefaultCrop(document.querySelector("#orderForm"), true);
applyLotDefaultVariety(document.querySelector("#orderForm"), true);
applyLotDefaultCrop(document.querySelector("#monitorForm"), true);
applyLotDefaultVariety(document.querySelector("#monitorForm"), true);
applyClosureDefaults(document.querySelector("#closureForm"), true);
if (syncConfig.apiUrl && navigator.onLine !== false) {
  window.setTimeout(() => syncPending(), 400);
}
