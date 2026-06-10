const storageKey = "gestion-agro-v3";
const syncQueueKey = "gestion-agro-sync-queue-v1";
const syncConfigKey = "gestion-agro-sync-config-v1";
const defaultSyncApiUrl = "https://script.google.com/macros/s/AKfycbxCnXxTt91wEZF-rXzldO3zseFTuYBFKnMFzFi8DPtj3iVMGvamxS8uD0Jb2Ex1BTn_/exec";
const syncedBadgeVisibleMs = 6000;

const starterData = {
  lots: [
    { id: "lot-1", name: "Lote 1", farm: "La Esperanza", hectares: 86, campaign: "2025/26", crop: "Soja", previousCrop: "Maíz" },
    { id: "lot-2", name: "Lote 2", farm: "La Esperanza", hectares: 122, campaign: "2025/26", crop: "Maíz", previousCrop: "Trigo/Soja 2da" },
    { id: "lot-3", name: "Lote 3", farm: "El Ombú", hectares: 64, campaign: "2025/26", crop: "Trigo", previousCrop: "Soja" }
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
    { id: "clo-1", lotId: "lot-1", campaign: "2024/25", crop: "Maíz", hectares: 86, kgHarvested: 774000, priceTon: 185000, otherCosts: 8600000, applicationCosts: 0, income: 143190000, grossMargin: 134590000 },
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
let mapLayer = "satellite";
let orderFilter = "Todas";
let highlightedApplicationId = "";
let applicationDraftOrderId = "";
let editingLotId = "";
let editingProductId = "";
let selectedProductId = "";
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
  normalizeCampaignRecords(loaded);
  return loaded;
}

function saveData() {
  safeStorageSet(storageKey, JSON.stringify(data));
}

function loadSyncQueue() {
  try {
    return JSON.parse(safeStorageGet(syncQueueKey) || "[]");
  } catch {
    return [];
  }
}

function saveSyncQueue() {
  safeStorageSet(syncQueueKey, JSON.stringify(syncQueue));
}

function loadSyncConfig() {
  try {
    const saved = JSON.parse(safeStorageGet(syncConfigKey) || "{}");
    return { apiUrl: saved.apiUrl || defaultSyncApiUrl };
  } catch {
    return { apiUrl: defaultSyncApiUrl };
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

function queueSync(table, record, action = "append") {
  const baseUpdatedAt = record?.updatedAt || "";
  const updatedAt = new Date().toISOString();
  if (record) record.updatedAt = updatedAt;
  const syncRecord = enrichRecordForSync(record);
  syncRecord.baseUpdatedAt = baseUpdatedAt;
  syncRecord.updatedAt = updatedAt;
  const item = {
    syncId: uid("sync"),
    table,
    action,
    record: syncRecord,
    createdAt: new Date().toISOString()
  };
  if (record) {
    record._syncStatus = action === "delete" ? "delete-pending" : "pending";
    record._syncId = item.syncId;
    record._syncAction = action;
  }
  syncQueue.push(item);
  saveSyncQueue();
  renderSyncStatus();
  if (syncConfig.apiUrl && navigator.onLine !== false) syncPending();
}

function enrichRecordForSync(record) {
  const enriched = { ...record };
  if (enriched.lotId && !enriched.lotName) enriched.lotName = lotName(enriched.lotId);
  if (enriched.productId && !enriched.productName) enriched.productName = productName(enriched.productId);
  return enriched;
}

function syncMessage() {
  const pending = syncQueue.length;
  const urlState = syncConfig.apiUrl ? "URL configurada" : "falta pegar la URL de Apps Script";
  const connection = navigator.onLine === false ? "sin conexion" : "con conexion";
  if (!pending) return `Todo sincronizado (${urlState}, ${connection}).`;
  return `${pending} carga${pending === 1 ? "" : "s"} pendiente${pending === 1 ? "" : "s"} (${urlState}, ${connection}).`;
}

function renderSyncStatus() {
  const input = document.querySelector("#syncApiUrl");
  const status = document.querySelector("#syncStatus");
  const syncNow = document.querySelector("#syncNow");
  const globalSyncNow = document.querySelector("#globalSyncNow");
  if (input && document.activeElement !== input) input.value = syncConfig.apiUrl || "";
  if (status) {
    const pendingDetail = syncQueue.slice(0, 5).map((item) => {
      const label = item.record?.date ? `${dateShort(item.record.date)} · ` : "";
      return `<span class="sync-line">${label}${syncTableLabel(item.table)} · ${item.record?.task || item.record?.cropStatus || item.record?.name || item.record?.id || "registro"}</span>`;
    }).join("");
    status.innerHTML = `
      <strong>${syncRunning ? "Sincronizando..." : syncMessage()}</strong>
      <span>Los datos quedan guardados en este navegador aunque no haya señal.</span>
      ${pendingDetail ? `<div class="sync-pending-list">${pendingDetail}</div>` : ""}
    `;
  }
  if (syncNow) syncNow.disabled = syncRunning || !syncConfig.apiUrl;
  if (globalSyncNow) {
    globalSyncNow.disabled = syncRunning || !syncConfig.apiUrl;
    globalSyncNow.classList.toggle("syncing", syncRunning);
  }
}

function syncTableLabel(table) {
  const labels = {
    lots: "Lote",
    products: "Depósito",
    orders: "Orden",
    monitors: "Monitoreo",
    applications: "Aplicación",
    closures: "Cierre"
  };
  return labels[table] || table;
}

function markSynced(syncId) {
  const queueItem = syncQueue.find((item) => item.syncId === syncId);
  if (!queueItem) return;
  const collectionByTable = {
    lots: data.lots,
    products: data.products,
    orders: data.orders,
    monitors: data.monitors,
    applications: data.applications,
    closures: data.closures
  };
  const collection = collectionByTable[queueItem.table] || [];
  const record = collection.find((item) => item._syncId === syncId || item.id === queueItem.record?.id);
  if (record && queueItem.action !== "delete") {
    record._syncStatus = "synced";
    record._syncedAt = new Date().toISOString();
    window.setTimeout(renderAll, syncedBadgeVisibleMs + 250);
  }
}

function syncBadge(record) {
  if (!record?._syncStatus) return "";
  if (record._syncStatus === "synced") {
    const syncedAt = record._syncedAt ? new Date(record._syncedAt).getTime() : 0;
    if (syncedAt && Date.now() - syncedAt > syncedBadgeVisibleMs) return "";
    return `<span class="sync-badge synced">Sincronizado</span>`;
  }
  if (record._syncStatus === "delete-pending") return `<span class="sync-badge pending">Eliminación pendiente</span>`;
  return `<span class="sync-badge pending">Pendiente de sincronizar</span>`;
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

  const batch = syncQueue.slice();
  try {
    const results = [];
    for (const item of batch) {
      results.push(await syncOneItem(item));
    }
    const syncedIds = new Set(results.flatMap((result) => (result.synced || []).map((item) => item.syncId)));
    syncedIds.forEach(markSynced);
    syncQueue = syncQueue.filter((item) => !syncedIds.has(item.syncId));
    await pullRemoteData();
    saveSyncQueue();
    saveData();
    showToast(syncedIds.size ? "Sincronizacion completa" : "Datos actualizados desde Sheets");
  } catch (error) {
    showToast(`No se pudo sincronizar: ${error.message || "queda pendiente"}`);
  } finally {
    syncRunning = false;
    renderSyncStatus();
  }
}

async function syncOneItem(item) {
  try {
    const response = await fetch(syncConfig.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ source: "gestion-agro", items: [item] })
    });
    const result = await response.json();
    if (!response.ok || result.ok === false) throw new Error(result.error || "No se pudo sincronizar");
    return result;
  } catch {
    return syncOneItemJsonp(item);
  }
}

function syncOneItemJsonp(item) {
  return new Promise((resolve, reject) => {
    const callbackName = `gestionAgroSync_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const payload = encodeURIComponent(JSON.stringify({ source: "gestion-agro", items: [item] }));
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
      if (!result || result.ok === false) {
        reject(new Error(result?.error || "No se pudo sincronizar"));
        return;
      }
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

function pullRemoteData() {
  return new Promise((resolve, reject) => {
    const callbackName = `gestionAgroRead_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const separator = syncConfig.apiUrl.includes("?") ? "&" : "?";
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tiempo de lectura agotado"));
    }, 20000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
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
      mergeRemoteData(result.data || {});
      resolve(result);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("No se pudo conectar con Apps Script"));
    };
    script.src = `${syncConfig.apiUrl}${separator}action=read&callback=${callbackName}&ts=${Date.now()}`;
    document.body.appendChild(script);
  });
}

function mergeRemoteData(remote) {
  const tables = ["lots", "products", "orders", "monitors", "applications", "closures"];
  tables.forEach((table) => {
    const rows = Array.isArray(remote[table]) ? remote[table] : [];
    const current = Array.isArray(data[table]) ? data[table] : [];
    const remoteKeys = new Set(rows.filter((row) => row?.id).map((row) => recordMergeKey(table, row)));
    rows.forEach((row) => {
      if (!row || !row.id) return;
      const key = recordMergeKey(table, row);
      const index = current.findIndex((item) => recordMergeKey(table, item) === key);
      const cleanRow = { ...row };
      if (index >= 0) {
        if (current[index]._syncStatus === "pending" || current[index]._syncStatus === "delete-pending") return;
        current[index] = { ...current[index], ...cleanRow, _syncStatus: undefined, _syncId: undefined, _syncAction: undefined };
      } else {
        current.push(cleanRow);
      }
    });
    const filtered = current.filter((item) => {
      if (!item?.id) return false;
      if (item._syncStatus === "pending" || item._syncStatus === "delete-pending") return true;
      return remoteKeys.has(recordMergeKey(table, item));
    });
    data[table] = table === "applications" ? uniqueApplicationRows(filtered) : filtered;
  });
  normalizeCampaignRecords(data);
  data.products.forEach(recalculateApplicationsForProduct);
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

function productGroupProducts(product) {
  const key = productLogicalKey(product);
  if (!key) return product ? [product] : [];
  return data.products.filter((item) => productLogicalKey(item) === key);
}

function receiptEntriesForProduct(product) {
  return String(receiptText(product) || "").split(/\r?\n/).flatMap((line) => {
    const value = line.trim();
    if (!value) return [];
    if (value.includes("|")) {
      const [number, date, quantity, unitCost] = value.split("|");
      return [{ number, date, quantity, unitCost, detailed: true }];
    }
    return value.split(",").map((number) => ({ number: number.trim(), detailed: false })).filter((entry) => entry.number);
  });
}

function receiptEntries(product) {
  return productGroupProducts(product).flatMap((item) =>
    receiptEntriesForProduct(item).map((entry, index) => ({ ...entry, sourceProductId: item.id, sourceIndex: index }))
  );
}

function datedReceiptEntries(product) {
  return receiptEntries(product)
    .filter((entry) => entry.detailed && entry.date)
    .map((entry) => ({ ...entry, parsedUnitCost: parseDecimal(entry.unitCost) }))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function unitCostForProductDate(product, date, fallbackCost = "") {
  if (!product) return parseDecimal(fallbackCost);
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

function receiptQuantityTotal(product) {
  return receiptEntriesForProduct(product)
    .filter((entry) => entry.detailed)
    .reduce((sum, entry) => sum + parseDecimal(entry.quantity), 0);
}

function appendReceiptEntry(current, receiptNumber, receiptDate, quantity, unitCost) {
  const incoming = String(receiptNumber || "").trim() || "Sin remito";
  const entry = [incoming, receiptDate || todayValue(), parseDecimal(quantity), parseDecimal(unitCost)].join("|");
  return [String(current || "").trim(), entry].filter(Boolean).join("\n");
}

function hasReceiptNumber(product, receiptNumber) {
  const normalized = normalizeName(receiptNumber);
  return normalized && receiptLabels(product).some((number) => normalizeName(number) === normalized);
}

function serializeReceiptEntries(entries) {
  return entries.map((entry) => entry.detailed
    ? [entry.number, entry.date, parseDecimal(entry.quantity), parseDecimal(entry.unitCost)].join("|")
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
    const key = productLogicalKey(product) || product.id;
    const current = groups.get(key);
    if (!current || receiptEntriesForProduct(product).length > receiptEntriesForProduct(current).length) groups.set(key, product);
  });
  return Array.from(groups.values());
}

function applyExistingProductDefaults() {
  if (editingProductId) return;
  const form = document.querySelector("#productForm");
  const product = matchingProductByName(form?.elements?.name?.value);
  if (!form || !product) return;
  form.elements.type.value = product.type || "Otro";
  form.elements.unit.value = product.unit || "";
  form.elements.unitCost.value = product.unitCost ?? "";
  form.elements.warehouse.value = product.warehouse || "";
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

function activeCampaignValue() {
  const campaigns = data.lots.map((lot) => normalizeCampaignValue(lot.campaign)).filter(Boolean);
  return campaigns.sort((a, b) => parseInt(b, 10) - parseInt(a, 10))[0] || "";
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
  return data.products.find((product) => product.id === id)?.name || "Sin producto";
}

function productType(id) {
  return data.products.find((product) => product.id === id)?.type || "Otros";
}

function orderById(id) {
  return data.orders.find((order) => order.id === id);
}

function productMatchesApplication(product, application) {
  const group = productGroupProducts(product);
  const groupIds = new Set(group.map((item) => item.id));
  if (application.productId && groupIds.has(application.productId)) return true;
  return !application.productId && normalizeName(product?.name) === normalizeName(application.productName);
}

function baseStock(product) {
  if (product?.quantity !== undefined && product?.quantity !== null && product?.quantity !== "") {
    return parseDecimal(product.quantity);
  }
  if (product?.calculatedStock !== undefined && product?.calculatedStock !== null && product?.calculatedStock !== "") {
    return parseDecimal(product.calculatedStock);
  }
  return receiptQuantityTotal(product);
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
  const base = productGroupProducts(product).reduce((sum, item) => sum + baseStock(item), 0);
  const movements = uniqueApplicationRows().filter((application) => productMatchesApplication(product, application));
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

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
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

function lotCrop(lotId) {
  const lot = data.lots.find((item) => item.id === lotId);
  if (!lot) return "";
  if (lot.crop) return lot.crop;
  return data.closures.find((closure) => (
    sameLot(closure, lot)
    && closure.campaign === lot.campaign
    && closure.crop
  ))?.crop || "";
}

function lotVariety(lotId) {
  return data.lots.find((lot) => lot.id === lotId)?.variety || "";
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
  if (form.elements.crop && (force || !form.elements.crop.value)) form.elements.crop.value = lot.crop || "";
  if (form.elements.variety && (force || !form.elements.variety.value)) form.elements.variety.value = lot.variety || "";
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
    select.innerHTML = data.products.map((product) => `<option value="${product.id}">${product.name} (${product.unit})</option>`).join("");
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
            width = Math.max(280, Math.round(width * 0.78));
            height = Math.max(210, Math.round(height * 0.78));
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
  const value = String(photo || "");
  return value.startsWith("data:image/") || /^https?:\/\//i.test(value) ? value : "";
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

function contractorOptions() {
  return uniqueSorted(data.orders.map((order) => order.owner));
}

function renderDashboard() {
  renderDashboardAlerts();
}

function renderDashboardAlerts() {
  renderOperationalAlerts();
  renderPaymentAlerts();
}

function renderOperationalAlerts() {
  const pendingOrders = data.orders
    .filter((order) => order.status === "Pendiente" || order.status === "En curso")
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const negativeStock = data.products
    .filter((product) => stockForProduct(product).available < 0)
    .sort((a, b) => stockForProduct(a).available - stockForProduct(b).available);
  const staleLots = lotsWithoutRecentMonitoring(15);

  const cards = [
    {
      title: "Órdenes pendientes",
      value: pendingOrders.length,
      detail: pendingOrders.map((item) => `
        <div class="alert-line clickable-alert" data-dashboard-order="${item.id}">
          <b>${dateShort(item.date)} · ${lotName(item.lotId)}</b>
          <span>${item.task} · ${number(item.plannedHectares || 0, 2)} ha · ${item.owner || "-"}</span>
        </div>
      `).join("")
    },
    {
      title: "Stock negativo",
      value: negativeStock.length,
      detail: negativeStock.map((item) => `
        <div class="alert-line">
          <b>${item.name}</b>
          <span>Disponible ${number(stockForProduct(item).available, 2)} ${item.unit} · reservado ${number(stockForProduct(item).reserved, 2)} ${item.unit} · ${item.warehouse || "-"}</span>
        </div>
      `).join("")
    },
    {
      title: "Sin monitoreo 15 días",
      value: staleLots.length,
      detail: staleLots.map((item) => `
        <div class="alert-line">
          <b>${displayLotName(item.lot)} · ${item.lot.farm}</b>
          <span>Último monitoreo: ${item.lastDate ? dateShort(item.lastDate) : "sin registro"} · ${number(item.lot.hectares, 2)} ha</span>
        </div>
      `).join("")
    }
  ];

  document.querySelector("#dashboardOperationalAlerts").innerHTML = cards.map((card) => `
    <article class="alert-card">
      <span>${card.title}</span>
      <strong>${card.value}</strong>
      <div class="alert-detail">${card.detail || "Sin alertas"}</div>
    </article>
  `).join("");

  document.querySelectorAll("[data-dashboard-order]").forEach((item) => {
    item.addEventListener("click", () => openOrderDetail(item.dataset.dashboardOrder, "dashboard"));
  });
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

function renderPaymentAlerts() {
  const movements = data.stockMovements || [];
  const purchases = data.purchases || [];
  const withoutInvoice = movements.filter((movement) => movement.movementType === "Ingreso" && !movement.invoiceNumber);
  const withoutPrice = movements.filter((movement) => movement.movementType === "Ingreso" && !movement.netUnitCost);
  const dueSoon = purchases.filter((purchase) => purchase.paymentStatus === "Por vencer");
  const overdue = purchases.filter((purchase) => purchase.paymentStatus === "Vencida");

  const cards = [
    { title: "Ingresos sin factura", value: withoutInvoice.length, detail: withoutInvoice.slice(0, 3).map((item) => `${dateShort(item.date)} · ${item.store || "-"} · ${item.productName || item.productId}`).join("<br>") },
    { title: "Sin precio", value: withoutPrice.length, detail: withoutPrice.slice(0, 3).map((item) => `${item.productName || item.productId} · ${number(item.quantity, 2)} ${item.unit}`).join("<br>") },
    { title: "Por vencer", value: money(dueSoon.reduce((sum, item) => sum + item.totalAmount, 0)), detail: dueSoon.slice(0, 3).map((item) => `${dateShort(item.dueDate)} · ${item.store || "-"} · ${item.invoiceNumber || "-"}`).join("<br>") },
    { title: "Vencido", value: money(overdue.reduce((sum, item) => sum + item.totalAmount, 0)), detail: overdue.slice(0, 3).map((item) => `${dateShort(item.dueDate)} · ${item.store || "-"} · ${item.invoiceNumber || "-"}`).join("<br>") }
  ];

  document.querySelector("#dashboardPaymentAlerts").innerHTML = cards.map((card) => `
    <article class="alert-card">
      <span>${card.title}</span>
      <strong>${card.value}</strong>
      <p>${card.detail || "Sin alertas"}</p>
    </article>
  `).join("");
}

function renderLots() {
  const formTitle = document.querySelector("#lotFormTitle");
  const cancelButton = document.querySelector("#cancelLotEdit");
  if (formTitle) formTitle.textContent = editingLotId ? "Editar lote" : "Nuevo lote";
  if (cancelButton) cancelButton.hidden = !editingLotId;

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
  renderLots();
  form.closest(".form-band")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelLotEdit() {
  const form = document.querySelector("#lotForm");
  editingLotId = "";
  form?.reset();
  if (form?.elements?.campaign) form.elements.campaign.value = "2025/26";
  if (form) form.querySelector('button[type="submit"]').textContent = "Guardar lote";
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
  const lastClosure = closures.slice().sort((a, b) => String(b.campaign || "").localeCompare(String(a.campaign || "")))[0];
  const orders = lot ? data.orders.filter((order) => sameLot(order, lot)).sort((a, b) => String(b.date).localeCompare(String(a.date))) : [];
  const pendingOrders = orders.filter((order) => order.status !== "Finalizada" && order.status !== "Cancelada").length;
  const orderCosts = buildOrderCosts(lot.id);
  const totalSpent = Array.from(orderCosts.values()).reduce((sum, item) => sum + item.total, 0);
  const totalSpentHa = lot.hectares ? totalSpent / lot.hectares : 0;
  const outlinePolygon = polygon || polygonForLot(lot);
  const lotOutline = renderLotOutline(outlinePolygon);

  target.innerHTML = `
    <div class="map-detail-body">
      <div>
        <strong>${displayLotName(lot)}</strong>
        <span>${lot.farm} · ${number(lot.hectares, 2)} ha</span>
      </div>
      <div class="map-kpis">
        <div><b>${lot.crop || "-"}</b><span>Cultivo</span></div>
        <div><b>${lot.variety || "-"}</b><span>Variedad/Híbrido</span></div>
        <div><b>${orders.length}</b><span>Órdenes</span></div>
        <div><b>${pendingOrders}</b><span>Pendientes</span></div>
        <div><b>${money(totalSpentHa)}</b><span>Costo acum./ha</span></div>
      </div>
      <div class="lot-info-with-outline">
        <div class="map-info-lines">
          <span>Campaña ${lot.campaign || "-"}</span>
          <span>Antecesor: ${lot.previousCrop || "-"}</span>
          <span>Ambiente: ${lot.environment || "-"}</span>
          <span>${lastClosure ? `Último cierre: ${lastClosure.campaign}, ${numberOptional(closureYield(lastClosure))} kg/ha, ${lastClosure.variety || "sin variedad"}, ${lastClosure.enso || "sin ENSO"}, margen ${moneyOptional(lastClosure.grossMargin)}` : "Sin cierre histórico cargado"}</span>
        </div>
        ${lotOutline}
      </div>
      <div class="map-subsection">
        <h3>Órdenes del lote</h3>
        ${orders.length ? orders.map((order) => `
          <div class="map-row clickable-card" data-open-order-detail="${order.id}">
            <div>
              <b>${order.task}</b>
              <span>${dateShort(order.date)} · ${number(order.plannedHectares || 0, 2)} ha · ${order.owner || "-"}</span>
              <em>${formatOrderCost(order, orderCosts.get(order.id))}</em>
            </div>
            ${statusBadge(order.status)}
          </div>
        `).join("") : `<p class="map-empty">Sin órdenes cargadas.</p>`}
      </div>
      <div class="lot-total-box">
        <span>Costo acumulado</span>
        <strong>${money(totalSpent)}</strong>
        <b>${money(totalSpentHa)}/ha</b>
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
        if (button.dataset.mapAction === "ordenes") applyOrderLotDefaultHectares(true);
        if (button.dataset.mapAction === "cierre") applyClosureDefaults(form, true);
      }
    });
  });
  target.querySelectorAll("[data-open-order-detail]").forEach((row) => {
    row.addEventListener("click", () => openOrderDetail(row.dataset.openOrderDetail, targetSelector === "#fullLotDetail" ? "ficha-lote" : "mapa"));
  });
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
    .filter((order) => orderFilter === "Todas" || order.status === orderFilter)
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
    .join("") || `<tr><td colspan="7">No hay órdenes para este filtro.</td></tr>`;

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
}

function openOrderDetail(orderId, backView = "ordenes") {
  selectedOrderId = orderId;
  orderDetailBackView = backView;
  const order = orderById(orderId);
  orderDetailBackLotId = backView === "ficha-lote" ? order?.lotId || orderDetailBackLotId : "";
  const backButton = document.querySelector("#backFromOrderDetail");
  if (backButton) backButton.textContent = backView === "ficha-lote" ? "Volver al lote" : "Volver a órdenes";
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
  const productCost = rows.reduce((sum, row) => sum + Number(row.productCost || 0), 0);
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
        <span>ID orden: ${order.id}</span>
        <span>Cultivo: ${order.crop || lotCrop(order.lotId) || "-"}</span>
        <span>Variedad/Híbrido: ${order.variety || lotVariety(order.lotId) || "-"}</span>
        <span>Costo labor/ha: ${money(order.laborCostHa || 0)}</span>
        <span>Observaciones: ${order.notes || "-"}</span>
      </div>
      <div class="detail-actions">
        ${order.status !== "Finalizada" ? `<button class="link-button primary" data-finish-order="${order.id}">Finalizar orden</button>` : ""}
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
            <strong>${dateShort(monitor.date)} · ${lotName(monitor.lotId)} · ${monitor.crop || lotCrop(monitor.lotId) || "-"} · ${lotVariety(monitor.lotId) || monitor.variety || "-"} · ${monitor.cropStatus || "Sin estado"} ${syncBadge(monitor)}</strong>
            <span>Malezas: ${monitor.weeds || "-"} · Plagas/enfermedades: ${monitor.issues || "-"} · Recomendación: ${monitor.recommendation || "-"}</span>
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
    detail.innerHTML = `<div class="empty">Seleccioná un monitoreo para ver su ficha.</div>`;
    return;
  }

  detail.innerHTML = `
    <div class="detail-grid">
      <article><span>Fecha</span><strong>${dateShort(monitor.date)}</strong></article>
      <article><span>Lote</span><strong>${lotName(monitor.lotId)}</strong></article>
      <article><span>Cultivo</span><strong>${monitor.crop || lotCrop(monitor.lotId) || "-"}</strong></article>
      <article><span>Variedad/Híbrido</span><strong>${lotVariety(monitor.lotId) || monitor.variety || "-"}</strong></article>
      <article><span>Estado</span><strong>${monitor.cropStatus || "-"}</strong></article>
      <article><span>Sincronización</span><strong>${syncBadge(monitor) || "Base cargada"}</strong></article>
    </div>
    <div class="detail-notes">
      <p><b>Malezas</b><span>${monitor.weeds || "-"}</span></p>
      <p><b>Plagas / enfermedades</b><span>${monitor.issues || "-"}</span></p>
      <p><b>Recomendación</b><span>${monitor.recommendation || "-"}</span></p>
    </div>
    ${monitorPhotoSource(monitor.photo) ? `<img class="monitor-photo" src="${monitorPhotoSource(monitor.photo)}" alt="Foto de monitoreo" />` : ""}
    <div class="detail-actions">
      <button class="link-button" data-edit-monitor="${monitor.id}">Editar</button>
      <button class="link-button danger" data-delete-monitor="${monitor.id}">Eliminar</button>
    </div>
  `;

  detail.querySelector("[data-edit-monitor]")?.addEventListener("click", () => editMonitor(monitor.id));
  detail.querySelector("[data-delete-monitor]")?.addEventListener("click", () => deleteMonitor(monitor.id));
}

function renderApplications() {
  document.querySelector("#applicationFormBand")?.classList.toggle("hidden-panel", Boolean(highlightedApplicationId));
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
  backButton.textContent = applicationBackView === "ficha-lote" ? "Volver al lote" : "Volver a órdenes";
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
  const service = linkedOrder?.task || "Aplicacion";
  const owner = linkedOrder?.owner || "-";
  const crop = linkedOrder?.crop || lot?.crop || "-";
  const variety = linkedOrder?.variety || lot?.variety || "-";
  const laborCost = laborCostForApplicationRows(rows);
  const laborCostHa = linkedOrder ? Number(linkedOrder.laborCostHa || 0) : Number(first.laborCostHa || 0);
  const total = productCost + laborCost;
  const costHa = first.hectares ? total / first.hectares : 0;

  detail.innerHTML = `
    <div class="application-detail-header">
      <div>
        <strong>${applicationId}</strong>
        <span>${dateShort(first.date)} · ${lotName(first.lotId)} · ${number(first.hectares, 2)} ha</span>
        <div class="detail-actions">
          <button class="link-button primary" data-add-product-application="${applicationId}">Agregar producto</button>
        </div>
      </div>
      <div class="application-detail-kpis">
        <span>Productos ${money(productCost)}</span>
        <span>Labor ${money(laborCost)} (${money(laborCostHa)}/ha)</span>
        <span>Total ${money(total)}</span>
        <span>Total/ha ${money(costHa)}</span>
      </div>
    </div>
    <div class="application-order-summary">
      <article class="application-summary-main">
        <span>Lote</span>
        <strong>${lotName(first.lotId)}</strong>
        <small>${lot?.farm || "-"}</small>
      </article>
      <article class="application-summary-main">
        <span>Superficie</span>
        <strong>${number(first.hectares, 2)} ha</strong>
        <small>${crop}${variety && variety !== "-" ? ` - ${variety}` : ""}</small>
      </article>
      <article>
        <span>Servicio</span>
        <strong>${service}</strong>
        <small>${owner}</small>
      </article>
      <article>
        <span>Fecha</span>
        <strong>${dateShort(first.date)}</strong>
        <small>${linkedOrder?.status || "Pendiente"}</small>
      </article>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Dosis/ha</th>
            <th>Ha</th>
            <th>Cantidad</th>
            <th>Costo unit.</th>
            <th>Costo producto</th>
            <th>$/ha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.productName || productName(row.productId)}</td>
              <td>${number(row.dose, 2)}</td>
              <td>${number(row.hectares, 2)}</td>
              <td>${number(row.usedQuantity, 2)}</td>
              <td>${money(row.unitCost)}</td>
              <td>${money(row.productCost)}</td>
              <td>${money(row.hectares ? row.productCost / row.hectares : 0)}</td>
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
              <td>-</td>
              <td>${money(laborCost)}</td>
              <td>${money(laborCostHa)}</td>
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
  switchView("aplicaciones");
  renderApplications();

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
  const match = String(order.id || "").match(/(\d+)$/);
  const preferred = match ? `APL-${match[1].padStart(3, "0")}` : "";
  const idAvailable = (id) => id && !data.applications.some((application) => application.id === id);
  if (idAvailable(preferred)) return preferred;

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
  form.dataset.originalStatus = order.status || "Pendiente";
  form.dataset.defaultHectares = String(order.plannedHectares || "");
  form.querySelector('button[type="submit"]').textContent = "Actualizar orden";
  switchView("ordenes");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.task.focus();
  showToast("Editando orden");
}

function finishOrder(orderId) {
  const order = orderById(orderId);
  if (!order) return;
  order.status = "Finalizada";
  order.completionDate = todayValue();
  queueSync("orders", order, "update");
  saveData();
  renderAll();
  showToast("Orden finalizada");
}

function deleteOrder(orderId) {
  const order = orderById(orderId);
  const linkedApplications = data.applications.filter((application) => application.orderId === orderId);
  const extra = linkedApplications.length ? `\n\nTambién se eliminarán ${linkedApplications.length} renglón(es) de aplicación vinculados y se devolverá el stock local.` : "";
  if (!order || !window.confirm(`Eliminar la orden "${order.task}"?${extra}`)) return;
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
  form.querySelector('button[type="submit"]').textContent = "Actualizar monitoreo";
  switchView("monitoreo");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteMonitor(monitorId) {
  const monitor = data.monitors.find((item) => item.id === monitorId);
  if (!monitor || !window.confirm(`Eliminar el monitoreo del ${dateShort(monitor.date)}?`)) return;
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
  form.querySelector('button[type="submit"]').textContent = "Actualizar aplicación";
  switchView("aplicaciones");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteApplication(key) {
  const row = findApplicationByKey(key);
  if (!row || !window.confirm(`Eliminar ${row.productName || productName(row.productId)} de ${row.id}?`)) return;
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
    ) queueSync("applications", application, "update");
  });
}

function editProduct(productId) {
  const product = data.products.find((item) => item.id === productId);
  const form = document.querySelector("#productForm");
  if (!product || !form) return;
  editingProductId = productId;
  form.elements.name.value = product.name || "";
  form.elements.type.value = product.type || "Otro";
  form.elements.unit.value = product.unit || "";
  form.elements.quantity.value = baseStock(product);
  form.elements.unitCost.value = product.unitCost ?? "";
  form.elements.warehouse.value = product.warehouse || "";
  form.elements.receiptNumber.value = "";
  form.elements.receiptDate.required = false;
  document.querySelector("#productFormTitle").textContent = "Editar producto";
  document.querySelector("#productQuantityLabel").firstChild.textContent = "Stock físico total ";
  form.querySelector('button[type="submit"]').textContent = "Guardar cambios";
  document.querySelector("#cancelProductEdit")?.classList.remove("hidden-panel");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelProductEdit() {
  const form = document.querySelector("#productForm");
  editingProductId = "";
  if (form) resetForm(form);
  if (form) {
    form.elements.receiptDate.required = true;
    form.elements.receiptDate.value = todayValue();
  }
  document.querySelector("#productFormTitle").textContent = "Nuevo ingreso al depósito";
  document.querySelector("#productQuantityLabel").firstChild.textContent = "Cantidad a ingresar ";
  if (form) form.querySelector('button[type="submit"]').textContent = "Guardar ingreso";
  document.querySelector("#cancelProductEdit")?.classList.add("hidden-panel");
}

function closeProductDetail() {
  selectedProductId = "";
  editingReceiptIndex = -1;
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
  if (!previous.detailed) {
    targetEntries[previous.sourceIndex] = { number: values.number.trim(), detailed: false };
    targetProduct.receiptNumbers = serializeReceiptEntries(targetEntries);
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
  targetEntries[previous.sourceIndex] = { number: values.number.trim(), date: values.date, quantity: nextQuantity, unitCost: parseDecimal(values.unitCost), detailed: true };
  targetProduct.quantity = baseStock(targetProduct) + nextQuantity - previousQuantity;
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
  const entries = receiptEntries(product);
  const outputs = data.applications
    .filter((application) => productMatchesApplication(product, application))
    .map((application) => ({ application, order: orderById(application.orderId) }))
    .sort((a, b) => String(b.application.date || b.order?.date || "").localeCompare(String(a.application.date || a.order?.date || "")));
  detail.innerHTML = `
    <div class="application-detail-header">
      <div>
        <strong>${product.name}</strong>
        <span>${product.type || "-"} · ${product.warehouse || "-"}</span>
      </div>
      <div class="application-detail-kpis">
        <span>Físico ${number(stock.physical, 2)} ${product.unit || ""}</span>
        <span>Reservado ${number(stock.reserved, 2)} ${product.unit || ""}</span>
        <span>Disponible ${number(stock.available, 2)} ${product.unit || ""}</span>
      </div>
      <button class="link-button" data-close-product-detail type="button">Volver al depósito</button>
    </div>
    <div class="deposit-detail-grid">
      <div>
        <h3>Ingresos al depósito</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Remito</th><th>Fecha</th><th>Cantidad</th><th>Costo unit.</th></tr></thead>
            <tbody>
              ${entries.map((entry, index) => editingReceiptIndex === index ? `<tr>
                <td colspan="4">
                  <form class="form-grid compact-form" id="receiptEditForm">
                    <label>Remito <input name="number" value="${entry.number}" required /></label>
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
                <td>${entry.detailed ? dateShort(entry.date) : "-"}</td>
                <td>${entry.detailed ? `${number(entry.quantity, 2)} ${product.unit || ""}` : "Anterior sin detalle"}</td>
                <td>${entry.detailed ? money(entry.unitCost) : "-"} <button class="link-button" data-edit-receipt="${index}" type="button">Editar</button> <button class="link-button danger" data-delete-receipt="${index}" type="button">Eliminar</button></td>
              </tr>`).join("") || `<tr><td colspan="4">Todavía no hay ingresos identificados por remito.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3>Salidas vinculadas a órdenes</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Orden</th><th>Lote</th><th>Estado</th><th>Cantidad</th></tr></thead>
            <tbody>
              ${outputs.map(({ application, order }) => `<tr>
                <td>${dateShort(application.date || order?.date)}</td>
                <td>${order?.id || application.orderId || "-"}</td>
                <td>${lotName(application.lotId || order?.lotId)}</td>
                <td>${order?.status || "Aplicada"}</td>
                <td>${number(applicationQuantity(application), 2)} ${product.unit || ""}</td>
              </tr>`).join("") || `<tr><td colspan="5">No hay salidas vinculadas a órdenes.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  detail.querySelector("[data-close-product-detail]")?.addEventListener("click", closeProductDetail);
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

function renderProducts() {
  const nameFilter = normalizeName(document.querySelector("#productNameFilter")?.value);
  const receiptFilter = normalizeName(document.querySelector("#productReceiptFilter")?.value);
  const dateFrom = document.querySelector("#productReceiptDateFrom")?.value || "";
  const dateTo = document.querySelector("#productReceiptDateTo")?.value || "";
  const dateSort = document.querySelector("#productReceiptDateSort")?.value || "desc";
  const productsForDisplay = displayProducts();
  const catalog = [...new Set(productsForDisplay.map((product) => product.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const catalogList = document.querySelector("#productCatalogList");
  if (catalogList) catalogList.innerHTML = catalog.map((name) => `<option value="${name}"></option>`).join("");
  const receiptCatalog = [...new Set(productsForDisplay.flatMap(receiptLabels))].sort((a, b) => a.localeCompare(b, "es"));
  const receiptCatalogList = document.querySelector("#receiptCatalogList");
  if (receiptCatalogList) receiptCatalogList.innerHTML = receiptCatalog.map((number) => `<option value="${number}"></option>`).join("");
  const filteredProducts = productsForDisplay.filter((product) => {
    if (nameFilter && !normalizeName(product.name).includes(nameFilter)) return false;
    if (receiptFilter && !normalizeName(receiptLabels(product).join(" ")).includes(receiptFilter)) return false;
    return true;
  });

  document.querySelector("#productsTable").innerHTML = filteredProducts
    .map((product) => {
      const stock = stockForProduct(product);
      return `
      <tr class="clickable-row" data-open-product="${product.id}">
        <td>${product.name} ${syncBadge(product)}</td>
        <td>${product.type}</td>
        <td>${number(stock.physical, 2)} ${product.unit}</td>
        <td>${number(stock.reserved, 2)} ${product.unit}</td>
        <td>${number(stock.available, 2)} ${product.unit}</td>
        <td>${money(product.unitCost)}</td>
        <td>${money(stock.available * product.unitCost)}</td>
        <td>${product.warehouse || "-"} · ${statusBadge(product.status || "OK")}</td>
        <td>${receiptLabels(product).join(", ") || "-"}</td>
        <td><button class="link-button" data-edit-product="${product.id}" type="button">Editar</button></td>
      </tr>
    `;
    })
    .join("") || `<tr><td colspan="10">No hay productos para mostrar.</td></tr>`;

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

  document.querySelector("#purchasesByDateTable").innerHTML = purchases.map((entry) => `
    <tr class="clickable-row" data-open-product="${entry.product.id}">
      <td>${dateShort(entry.date)}</td>
      <td>${entry.product.name}</td>
      <td>${entry.number || "-"}</td>
      <td>${number(entry.quantity, 2)} ${entry.product.unit || ""}</td>
      <td>${money(entry.unitCost)}</td>
      <td>${money(parseDecimal(entry.quantity) * parseDecimal(entry.unitCost))}</td>
      <td>${entry.product.warehouse || "-"}</td>
    </tr>
  `).join("") || `<tr><td colspan="7">No hay compras para los filtros seleccionados.</td></tr>`;

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
  renderProductDetail();
}

function costCategory(type) {
  const normalized = normalizeName(type);
  if (normalized.includes("herbicida")) return "herbicides";
  if (normalized.includes("fertilizante")) return "fertilizers";
  if (normalized.includes("semilla") || normalized.includes("inoculante") || normalized.includes("curasemilla")) return "seeds";
  return "others";
}

function buildLotCosts() {
  const byLot = new Map(data.lots.map((lot) => [lot.id, {
    lot,
    labor: 0,
    herbicides: 0,
    fertilizers: 0,
    seeds: 0,
    others: 0,
    total: 0,
    entries: []
  }]));

  data.orders.forEach((order) => {
    if (order.status === "Cancelada") return;
    const lot = findLot(order);
    const item = lot ? byLot.get(lot.id) : null;
    const laborTotal = laborCostForOrder(order);
    if (!item || !recordMatchesCampaign(order, lot, lot.campaign)) return;
    const hectares = parseDecimal(order.plannedHectares || order.Hectareas_planificadas);
    item.labor += laborTotal;
    item.entries.push({
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
    if (!item || !recordMatchesCampaign(application, lot, lot.campaign)) return;
    const category = costCategory(productType(application.productId));
    const productCost = applicationProductCost(application);
    const unitCost = applicationUnitCost(application);
    const order = orderById(application.orderId);
    item[category] += productCost;
    item.entries.push({
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
    item.total = item.labor + item.herbicides + item.fertilizers + item.seeds + item.others;
  });

  return Array.from(byLot.values()).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);
}

function renderCosts() {
  const rows = buildLotCosts();
  const totals = rows.reduce((acc, row) => {
    acc.labor += row.labor;
    acc.herbicides += row.herbicides;
    acc.fertilizers += row.fertilizers;
    acc.seeds += row.seeds;
    acc.others += row.others;
    acc.total += row.total;
    return acc;
  }, { labor: 0, herbicides: 0, fertilizers: 0, seeds: 0, others: 0, total: 0 });

  document.querySelector("#costSummary").innerHTML = `
    <article class="clickable-card" data-open-cost-category="all"><span>Total costos</span><strong>${money(totals.total)}</strong></article>
    <article class="clickable-card" data-open-cost-category="labor"><span>Labores</span><strong>${money(totals.labor)}</strong></article>
    <article class="clickable-card" data-open-cost-category="herbicides"><span>Herbicidas</span><strong>${money(totals.herbicides)}</strong></article>
    <article class="clickable-card" data-open-cost-category="seeds-fertilizers"><span>Semillas/Fert.</span><strong>${money(totals.seeds + totals.fertilizers)}</strong></article>
  `;

  document.querySelector("#costCards").innerHTML = rows.map((row) => {
    const parts = [
      ["Labor", row.labor, "#2f7d4a"],
      ["Herbicidas", row.herbicides, "#7aa35a"],
      ["Fertilizantes", row.fertilizers, "#3478a6"],
      ["Semillas", row.seeds, "#b8791f"],
      ["Otros", row.others, "#86938e"]
    ].filter((part) => part[1] > 0);

    return `
      <article class="cost-card" data-open-cost-lot="${row.lot.id}">
        <div class="cost-card-head">
          <div><strong>${displayLotName(row.lot)}</strong><span>${row.lot.farm} · ${row.lot.campaign || "-"} · ${number(row.lot.hectares, 2)} ha</span></div>
          <b>${money(row.total)}</b>
        </div>
        <div class="cost-bar">
          ${parts.map((part) => `<span style="width:${((part[1] / row.total) * 100).toFixed(2)}%; background:${part[2]}"></span>`).join("")}
        </div>
        <div class="cost-legend">
          ${parts.map((part) => `<span>${part[0]} ${number((part[1] / row.total) * 100, 1)}%</span>`).join("")}
        </div>
      </article>
    `;
  }).join("") || `<div class="empty">Todavía no hay costos cargados.</div>`;

  document.querySelector("#costTable").innerHTML = rows.map((row) => `
    <tr class="clickable-row" data-open-cost-lot="${row.lot.id}">
      <td>${displayLotName(row.lot)}</td>
      <td>${row.lot.campaign || "-"}</td>
      <td>${number(row.lot.hectares, 2)}</td>
      <td>${money(row.labor)}</td>
      <td>${money(row.herbicides)}</td>
      <td>${money(row.fertilizers)}</td>
      <td>${money(row.seeds)}</td>
      <td>${money(row.others)}</td>
      <td>${money(row.total)}</td>
      <td>${money(row.total / row.lot.hectares)}</td>
    </tr>
  `).join("") || `<tr><td colspan="10">Todavía no hay costos cargados.</td></tr>`;

  document.querySelectorAll("[data-open-cost-lot]").forEach((element) => {
    element.addEventListener("click", () => openLotCostDetail(element.dataset.openCostLot));
  });
  document.querySelectorAll("[data-open-cost-category]").forEach((element) => {
    element.addEventListener("click", () => openCostCategoryDetail(element.dataset.openCostCategory));
  });
  if (selectedCostLotId) renderLotCostDetail();
  if (selectedCostCategory) renderCostCategoryDetail();
}

function costCategoryLabel(category) {
  return ({ labor: "Labor", herbicides: "Herbicidas", fertilizers: "Fertilizantes", seeds: "Semillas", others: "Otros" })[category] || "Otros";
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
        <p>${entries.length} movimientos en ${lots} lotes</p>
      </div>
      <button class="link-button" id="backToCostsFromCategory" type="button">Volver a costos</button>
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
              <td>${dateShort(entry.date)}</td><td>${displayLotName(entry.lot)}</td><td>${entry.orderId}</td><td>${entry.task}</td>
              <td>${entry.description}</td><td>${costCategoryLabel(entry.category)}</td>
              <td>${number(entry.quantity, 2)} ${entry.unit}</td>
              <td>${entry.pendingCost ? "Pendiente" : money(entry.unitCost)}</td>
              <td>${entry.pendingCost ? "Pendiente" : money(entry.total)}</td>
              <td>${entry.pendingCost ? "Pendiente" : money(hectares ? entry.total / hectares : 0)}</td>
            </tr>
          `;
        }).join("") || `<tr><td colspan="10">No hay movimientos para este rubro.</td></tr>`}</tbody>
      </table>
    </div>
  `;
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
        <p>${row.lot.farm || "-"} · ${row.lot.campaign || "-"} · ${number(hectares, 2)} ha</p>
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
            <td>${dateShort(entry.date)}</td><td>${entry.orderId}</td><td>${entry.task}</td>
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
  if (normalized.startsWith("soja") && (normalized.includes("2") || normalized.includes("2da") || normalized.includes("2o") || normalized.includes("2°"))) return "Soja 2da";
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
  const visibleCampaigns = rotationShowAllCampaigns ? campaigns : campaigns.slice(Math.max(0, currentIndex - 2), currentIndex + 1);
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
        <label>Variedad/Híbrido <input name="variety" value="${variety || ""}" placeholder="Ceibo, DM 46R18, DK..." /></label>
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
    ? applicationCostForLot(lot.id, selectedCampaign)
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
  saveData();
  renderAll();
  renderCampaignDetail();
  showToast("Campaña guardada");
}

function deleteCampaignDetailRecord(id) {
  const record = data.closures.find((closure) => closure.id === id);
  if (!record) return;
  if (!window.confirm(`Eliminar ${record.crop || "este registro"} de la campaña ${record.campaign || selectedCampaign}?`)) return;
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

function renderHistoryPanel() {
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

function applicationCostForLot(lotId, campaign = "") {
  const lot = data.lots.find((item) => item.id === lotId);
  if (!lot) return 0;
  const targetCampaign = normalizeCampaignValue(campaign || lot.campaign);
  const eligibleOrders = data.orders.filter((order) => (
    sameLot(order, lot)
    && order.status === "Finalizada"
    && recordMatchesCampaign(order, lot, targetCampaign)
  ));
  const eligibleOrderIds = new Set(eligibleOrders.map((order) => order.id));
  const labor = eligibleOrders.reduce((sum, order) => sum + laborCostForOrder(order), 0);
  const seenStandaloneLabor = new Set();
  let standaloneLabor = 0;
  const products = uniqueApplicationRows(data.applications)
    .filter((application) => {
      if (!sameLot(application, lot) || !recordMatchesCampaign(application, lot, targetCampaign)) return false;
      const order = orderById(application.orderId);
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

function renderAll() {
  fillSelects();
  applyActiveCampaignDefaults();
  renderSyncStatus();
  renderDashboard();
  renderLots();
  renderOrders();
  renderMonitors();
  renderApplications();
  renderProducts();
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
  document.querySelector("#lotForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = formData(event.currentTarget);
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
    showToast("Lote guardado");
  });

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
    document.querySelector("#productQuantityLabel").firstChild.textContent = "Cantidad a ingresar ";
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
    showToast("Orden guardada");
  });

  const monitorForm = document.querySelector("#monitorForm");
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
      const photoFile = form.elements.photoFile.files?.[0];
      const photo = await readImageAsDataUrl(photoFile);
      if (photoFile && !photo) {
        showToast("No se pudo procesar la foto. Probá elegirla nuevamente.");
        return;
      }
      const record = {
        id: editingMonitorId || uid("mon"),
        ...values,
        crop: values.crop || lotCrop(values.lotId),
        variety: values.variety || lotVariety(values.lotId),
        photo: photo || existing?.photo || ""
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
      resetForm(form);
      if (form.elements.photoFile) form.elements.photoFile.value = "";
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
  closureForm.elements.lotId.addEventListener("change", () => applyClosureDefaults(closureForm, true));

  const applicationForm = document.querySelector("#applicationForm");
  applicationForm.elements.totalQuantity?.addEventListener("input", updateApplicationDoseFromTotal);
  applicationForm.elements.hectares.addEventListener("input", () => {
    if (applicationForm.elements.totalQuantity?.value) updateApplicationDoseFromTotal();
    else updateApplicationTotalFromDose();
  });
  applicationForm.elements.dose.addEventListener("input", updateApplicationTotalFromDose);

  applicationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const wasEditingApplication = Boolean(editingApplicationKey);
    const values = formData(event.currentTarget);
    const product = data.products.find((item) => item.id === values.productId);
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
      event.currentTarget.querySelector('button[type="submit"]').textContent = "Guardar aplicación";
    } else {
      data.applications.push(record);
      queueSync("applications", record);
    }
    saveData();
    resetForm(event.currentTarget);
    highlightedApplicationId = applicationId;
    applicationDraftOrderId = "";
    document.querySelector("#applicationFormBand")?.classList.add("hidden-panel");
    renderAll();
    switchView("aplicaciones");
    highlightedApplicationId = applicationId;
    renderApplications();
    window.setTimeout(() => {
      document.querySelector("#applicationDetail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    showToast(wasEditingApplication ? "Aplicación actualizada" : "Aplicación guardada y stock actualizado");
  });

  document.querySelector("#closureForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = formData(event.currentTarget);
    const crop = canonicalCropName(values.crop);
    const hectares = parseDecimal(values.hectares);
    const kgHarvested = parseDecimal(values.kgHarvested);
    const priceTon = parseDecimal(values.priceTon);
    const otherCosts = parseDecimal(values.otherCosts);
    const applicationCosts = applicationCostForLot(values.lotId, values.campaign);
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
    saveData();
    const returnView = closureReturnView;
    editingClosureFormId = "";
    closureReturnView = "";
    event.currentTarget.querySelector('button[type="submit"]').textContent = "Guardar cierre";
    resetForm(event.currentTarget);
    applyClosureDefaults(event.currentTarget, true);
    renderAll();
    if (returnView) {
      if (returnView === "ficha-campana") renderCampaignDetail();
      switchView(returnView);
    }
    showToast("Campaña cerrada");
  });
}

function bindSyncTools() {
  const input = document.querySelector("#syncApiUrl");
  const saveButton = document.querySelector("#saveSyncConfig");
  const syncButton = document.querySelector("#syncNow");
  const globalSyncButton = document.querySelector("#globalSyncNow");

  if (input) input.value = syncConfig.apiUrl || "";
  saveButton?.addEventListener("click", () => {
    syncConfig.apiUrl = input.value.trim();
    saveSyncConfig();
    renderSyncStatus();
    showToast(syncConfig.apiUrl ? "URL guardada" : "URL borrada");
    syncPending();
  });
  syncButton?.addEventListener("click", () => syncPending());
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
  document.querySelectorAll(".order-filter, [data-order-filter-shortcut]").forEach((button) => {
    button.addEventListener("click", () => {
      orderFilter = button.dataset.orderFilter || button.dataset.orderFilterShortcut;
      document.querySelectorAll(".order-filter").forEach((item) => item.classList.toggle("active", item.dataset.orderFilter === orderFilter));
      renderOrders();
      document.querySelector("#ordersTable")?.closest(".panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function bindApplicationTools() {
  document.querySelector("#showAllApplications").addEventListener("click", () => {
    highlightedApplicationId = "";
    applicationDraftOrderId = "";
    applicationBackView = "ordenes";
    applicationBackLotId = "";
    renderApplications();
  });
  document.querySelector("#backToOrders").addEventListener("click", () => {
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
  });
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
bindMapUpload();
bindMapTools();
renderAll();
applyOrderLotDefaultHectares(true);
applyLotDefaultCrop(document.querySelector("#orderForm"), true);
applyLotDefaultVariety(document.querySelector("#orderForm"), true);
applyLotDefaultCrop(document.querySelector("#monitorForm"), true);
applyLotDefaultVariety(document.querySelector("#monitorForm"), true);
applyClosureDefaults(document.querySelector("#closureForm"), true);
if (syncConfig.apiUrl && navigator.onLine !== false) {
  window.setTimeout(() => syncPending(), 400);
}
