const CONFIG = {
  API_ENDPOINT:
    "https://administration-etrangers-en-france.interieur.gouv.fr/api/anf/dossier-stepper",
  STATUS_SYNC_ALARM: "anf-status-sync",
  LEGACY_HOURLY_RECAP_ALARM: "anf-hourly-recap",
  LEGACY_DAILY_ALARM: "anf-daily-notification",
  STATUS_SYNC_INTERVAL_MINUTES: 15,
  SYNC_HISTORY_LIMIT: 200,
};

const DEFAULT_ALERTS_ENABLED = true;

const DB_CONFIG = {
  NAME: "anf_local_status_db",
  VERSION: 1,
  STORES: {
    STATUS_SNAPSHOTS: "statusSnapshots",
    SYNC_HISTORY: "syncHistory",
  },
};

const STORAGE_KEYS = [
  "alertsEnabled",
  "lastSyncAt",
  "lastSyncTrigger",
  "lastSyncState",
  "lastSyncError",
  "authState",
  "lastKnownStatus",
  "lastKnownStatusDate",
  "lastKnownStatusCode",
  "lastKnownStatusDescription",
  "lastKnownDossierId",
  "lastStatusChangeAt",
  "lastStatusChangeReason",
  "lastStatusAlertAt",
  "lastAlertedSnapshotSignature",
  "lastNoUpdateAt",
  "noUpdateStreak",
];

const LEGACY_STORAGE_KEYS = [
  "autoLoginEnabled",
  "envFranceConnectFiscalNumber",
  "envFranceConnectPassword",
  "lastAutoLoginAttemptAt",
  "lastAutoLoginStatus",
  "lastAutoLoginStep",
  "lastAutoLoginError",
  "lastAutoLoginReason",
  "lastAutoLoginTabId",
  "lastAutoLoginEventAt",
  "lastAuthNotificationAt",
  "lastAuthRecoveryNotificationAt",
  "lastStatusChangeNotificationAt",
  "lastNotifiedSnapshotSignature",
  "lastHourlyRecapAt",
  "lastHourlyRecapState",
  "lastHourlyRecapMessage",
];

let dbPromise;

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatDate(date)} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function normalizeStatusCode(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeStatusDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString();
}

function normalizeEncryptedStatus(value) {
  return String(value || "").trim();
}

function buildSnapshotId(dossierId) {
  return dossierId ? `dossier:${dossierId}` : "dossier:default";
}

function buildSnapshotSignature(snapshot) {
  const code = normalizeStatusCode(snapshot?.statusCodeNorm || snapshot?.statusCode);
  const date = normalizeStatusDate(snapshot?.statusDateNorm || snapshot?.statusDateRaw);
  if (code || date) return `code:${code}|date:${date}`;
  return `enc:${normalizeEncryptedStatus(snapshot?.encryptedStatus)}`;
}

function getStageBadgeText(code) {
  const normalized = normalizeStatusCode(code);

  if (!normalized || normalized === "code_non_reconnu") return "";
  if (normalized === "draft") return "1";
  if (normalized === "dossier_depose") return "2";
  if (normalized.startsWith("verification_")) return "3";
  if (normalized.startsWith("instruction_recepisse")) return "5";
  if (normalized.startsWith("instruction_")) return "4";
  if (normalized.startsWith("ea_") || normalized.includes("date_ea")) return "6";
  if (normalized.startsWith("prop_decision_pref_")) return "7";
  if (
    normalized === "controle_en_attente_pec" ||
    normalized === "controle_pec_a_faire" ||
    normalized.startsWith("scec_") ||
    normalized === "non_applicable"
  ) {
    return "9.2";
  }
  if (normalized.startsWith("controle_")) return "9.1";
  if (
    normalized.startsWith("decret_") ||
    normalized === "transmis_a_ac" ||
    normalized.includes("insertion_decret")
  ) {
    return "10";
  }
  if (
    normalized.startsWith("decision_") ||
    normalized.startsWith("css_") ||
    normalized.includes("irrecevabilite") ||
    normalized === "demande_traitee"
  ) {
    return "12";
  }

  return "4";
}

function alertsEnabledFromStorage(storage) {
  return storage?.alertsEnabled !== false;
}

async function ensureAlertDefaults() {
  const storage = await chrome.storage.local.get(["alertsEnabled"]);
  if (typeof storage.alertsEnabled !== "boolean") {
    await chrome.storage.local.set({ alertsEnabled: DEFAULT_ALERTS_ENABLED });
  }
}

async function cleanupLegacyStorage() {
  await chrome.storage.local.remove(LEGACY_STORAGE_KEYS).catch(() => {
    // ignore
  });
}

async function getAlertsEnabled() {
  const storage = await chrome.storage.local.get(["alertsEnabled"]);
  return alertsEnabledFromStorage(storage);
}

async function setAlertsEnabled(enabled) {
  const alertsEnabled = Boolean(enabled);
  await chrome.storage.local.set({ alertsEnabled });
  await ensureAlarms();
  await restoreStatusBadge();
  return { alertsEnabled };
}

function setStepBadge(code, description, titlePrefix = "Suivi Naturalisation") {
  const badgeText = getStageBadgeText(code);
  if (!badgeText) {
    clearBadge();
    return;
  }

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: "#f4b400" });
  if (chrome.action.setBadgeTextColor) {
    try {
      const badgeTextColor = chrome.action.setBadgeTextColor({ color: "#111827" });
      if (badgeTextColor?.catch) {
        badgeTextColor.catch(() => {
          // ignore
        });
      }
    } catch (_error) {
      // ignore
    }
  }

  const detail = String(description || "").trim();
  chrome.action.setTitle({
    title: `${titlePrefix}: etape ${badgeText}${detail ? ` - ${detail}` : ""}`,
  });
}

async function restoreStatusBadge() {
  const storage = await chrome.storage.local.get([
    "lastKnownStatusCode",
    "lastKnownStatusDescription",
  ]);
  setStepBadge(storage.lastKnownStatusCode, storage.lastKnownStatusDescription);
}

function setStatusChangeBadge(snapshot) {
  setStepBadge(
    snapshot?.statusCodeNorm || snapshot?.statusCode,
    snapshot?.statusDescription,
    "Nouveau statut detecte"
  );
}

function setAuthExpiredBadge() {
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#b91c1c" });
  chrome.action.setTitle({
    title: "Session ANEF expiree: reconnecte-toi sur ANEF",
  });
}

function setSyncErrorBadge() {
  chrome.action.setBadgeText({ text: "?" });
  chrome.action.setBadgeBackgroundColor({ color: "#ea580c" });
  chrome.action.setTitle({
    title: "Erreur de synchro ANEF: ouvre ANEF pour verifier ta session",
  });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: "" });
  chrome.action.setTitle({
    title: "Suivi Naturalisation",
  });
}

function reqToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openLocalDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_CONFIG.NAME, DB_CONFIG.VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.STATUS_SNAPSHOTS)) {
        const statusStore = db.createObjectStore(DB_CONFIG.STORES.STATUS_SNAPSHOTS, {
          keyPath: "id",
        });
        statusStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.SYNC_HISTORY)) {
        const syncStore = db.createObjectStore(DB_CONFIG.STORES.SYNC_HISTORY, {
          keyPath: "id",
          autoIncrement: true,
        });
        syncStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function getStatusSnapshot(snapshotId) {
  const db = await openLocalDb();
  const store = db
    .transaction(DB_CONFIG.STORES.STATUS_SNAPSHOTS, "readonly")
    .objectStore(DB_CONFIG.STORES.STATUS_SNAPSHOTS);
  return reqToPromise(store.get(snapshotId));
}

async function putStatusSnapshot(snapshot) {
  const db = await openLocalDb();
  const store = db
    .transaction(DB_CONFIG.STORES.STATUS_SNAPSHOTS, "readwrite")
    .objectStore(DB_CONFIG.STORES.STATUS_SNAPSHOTS);
  await reqToPromise(store.put(snapshot));
}

async function appendSyncHistory(entry) {
  const db = await openLocalDb();
  const store = db
    .transaction(DB_CONFIG.STORES.SYNC_HISTORY, "readwrite")
    .objectStore(DB_CONFIG.STORES.SYNC_HISTORY);
  await reqToPromise(store.add(entry));
  await pruneSyncHistory(CONFIG.SYNC_HISTORY_LIMIT);
}

async function pruneSyncHistory(maxEntries) {
  const db = await openLocalDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_CONFIG.STORES.SYNC_HISTORY, "readwrite");
    const store = tx.objectStore(DB_CONFIG.STORES.SYNC_HISTORY);
    const keysReq = store.getAllKeys();
    keysReq.onsuccess = () => {
      const keys = keysReq.result || [];
      const overflow = Math.max(0, keys.length - maxEntries);
      for (let i = 0; i < overflow; i += 1) {
        store.delete(keys[i]);
      }
    };
    keysReq.onerror = () => reject(keysReq.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function getRecentSyncHistory(limit = 6) {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const store = db
      .transaction(DB_CONFIG.STORES.SYNC_HISTORY, "readonly")
      .objectStore(DB_CONFIG.STORES.SYNC_HISTORY);
    const request = store.openCursor(null, "prev");
    const items = [];
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || items.length >= limit) {
        resolve(items);
        return;
      }
      items.push(cursor.value);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
}

function mergeSnapshot(previousSnapshot, incomingSnapshot, nowIso) {
  const mergedDateRaw =
    incomingSnapshot.statusDateRaw || previousSnapshot?.statusDateRaw || "";
  const mergedCode = incomingSnapshot.statusCode || previousSnapshot?.statusCode || "";

  const merged = {
    id: incomingSnapshot.id || previousSnapshot?.id || buildSnapshotId(incomingSnapshot.dossierId),
    dossierId: incomingSnapshot.dossierId || previousSnapshot?.dossierId || "",
    statusCode: mergedCode,
    statusCodeNorm: normalizeStatusCode(mergedCode),
    statusDescription:
      incomingSnapshot.statusDescription || previousSnapshot?.statusDescription || "",
    encryptedStatus:
      incomingSnapshot.encryptedStatus || previousSnapshot?.encryptedStatus || "",
    statusDateRaw: mergedDateRaw,
    statusDateNorm: normalizeStatusDate(mergedDateRaw),
    updatedAt: nowIso,
    source: incomingSnapshot.source,
  };

  merged.signature = buildSnapshotSignature(merged);
  return merged;
}

function detectSnapshotChange(previousSnapshot, currentSnapshot) {
  if (!previousSnapshot) return { changed: false, reason: "first_snapshot" };

  const previousDate = normalizeStatusDate(
    previousSnapshot.statusDateNorm || previousSnapshot.statusDateRaw
  );
  const currentDate = normalizeStatusDate(
    currentSnapshot.statusDateNorm || currentSnapshot.statusDateRaw
  );

  if (previousDate && currentDate) {
    if (previousDate !== currentDate) return { changed: true, reason: "status_date_changed" };

    const previousCode = normalizeStatusCode(
      previousSnapshot.statusCodeNorm || previousSnapshot.statusCode
    );
    const currentCode = normalizeStatusCode(
      currentSnapshot.statusCodeNorm || currentSnapshot.statusCode
    );

    if (previousCode && currentCode && previousCode !== currentCode) {
      return { changed: true, reason: "status_code_changed" };
    }
    return { changed: false, reason: "same_status_and_date" };
  }

  if (previousDate !== currentDate) {
    return { changed: true, reason: "status_date_presence_changed" };
  }

  const previousCode = normalizeStatusCode(
    previousSnapshot.statusCodeNorm || previousSnapshot.statusCode
  );
  const currentCode = normalizeStatusCode(
    currentSnapshot.statusCodeNorm || currentSnapshot.statusCode
  );

  if (previousCode && currentCode && previousCode !== currentCode) {
    return { changed: true, reason: "status_code_changed_without_date" };
  }

  const previousEncrypted = normalizeEncryptedStatus(previousSnapshot.encryptedStatus);
  const currentEncrypted = normalizeEncryptedStatus(currentSnapshot.encryptedStatus);

  if (previousEncrypted && currentEncrypted && previousEncrypted !== currentEncrypted) {
    return { changed: true, reason: "encrypted_status_changed_without_metadata" };
  }

  return { changed: false, reason: "no_meaningful_change" };
}
async function fetchCurrentDossierStatus() {
  const response = await fetch(CONFIG.API_ENDPOINT, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const responseUrl = String(response.url || "");
  const redirectedToLogin =
    Boolean(response.redirected) &&
    /(connexion|login|auth|sso|compte)/i.test(responseUrl);

  if (redirectedToLogin) {
    const error = new Error("Session ANEF expiree (redirection connexion)");
    error.httpStatus = response.status;
    error.isAuthExpired = true;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`API ANEF indisponible: ${response.status}`);
    error.httpStatus = response.status;
    error.isAuthExpired = response.status === 401 || response.status === 403;
    throw error;
  }

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();

  if (!contentType.includes("application/json")) {
    const error = new Error(`Reponse ANEF inattendue: ${contentType || "unknown"}`);
    error.httpStatus = response.status;
    error.isAuthExpired = true;
    throw error;
  }

  let payload;
  try {
    payload = await response.json();
  } catch (_error) {
    const parseError = new Error("Reponse ANEF invalide (JSON impossible)");
    parseError.httpStatus = response.status;
    parseError.isAuthExpired = true;
    throw parseError;
  }

  const dossier = payload?.dossier;

  if (!dossier?.statut) {
    const payloadText = JSON.stringify(payload || {}).slice(0, 1200);
    const unauthorizedLike =
      payload?.status === 401 ||
      payload?.code === 401 ||
      /(non\s*autor|unauthor|session|expire|auth|connexion)/i.test(payloadText);
    const error = new Error("Aucun statut dossier disponible");
    error.httpStatus = response.status;
    error.isAuthExpired = unauthorizedLike || response.status === 401 || response.status === 403;
    throw error;
  }

  return {
    dossierId: String(dossier.id ?? ""),
    encryptedStatus: String(dossier.statut || ""),
    statusDate: String(dossier.date_statut || ""),
  };
}

async function recordSyncEvent(entry) {
  try {
    await appendSyncHistory(entry);
  } catch (error) {
    console.log(
      "Extension API Naturalisation : erreur ecriture historique",
      error?.message || String(error)
    );
  }
}

async function processIncomingSnapshot({ incomingSnapshot, trigger, sendChangeNotification }) {
  const nowIso = new Date().toISOString();
  const storage = await chrome.storage.local.get(STORAGE_KEYS);

  const snapshotId = buildSnapshotId(incomingSnapshot.dossierId);
  const previousSnapshot = await getStatusSnapshot(snapshotId);
  const mergedSnapshot = mergeSnapshot(
    previousSnapshot,
    {
      ...incomingSnapshot,
      id: snapshotId,
    },
    nowIso
  );

  const change = detectSnapshotChange(previousSnapshot, mergedSnapshot);
  const hasPreviousSnapshot = Boolean(previousSnapshot);
  const hasUpdate = hasPreviousSnapshot && change.changed;

  await putStatusSnapshot(mergedSnapshot);
  setStepBadge(mergedSnapshot.statusCodeNorm, mergedSnapshot.statusDescription);

  const updates = {
    lastSyncAt: nowIso,
    lastSyncTrigger: trigger,
    lastSyncState: "ok",
    lastSyncError: "",
    authState: "ok",
    lastKnownStatus: mergedSnapshot.encryptedStatus,
    lastKnownStatusDate: mergedSnapshot.statusDateRaw,
    lastKnownStatusCode: mergedSnapshot.statusCodeNorm,
    lastKnownStatusDescription: mergedSnapshot.statusDescription,
    lastKnownDossierId: mergedSnapshot.dossierId,
  };

  const previousStreak = Number(storage.noUpdateStreak || 0);

  if (!hasPreviousSnapshot) {
    updates.noUpdateStreak = 0;
    updates.lastNoUpdateAt = nowIso;
  } else if (hasUpdate) {
    updates.noUpdateStreak = 0;
    updates.lastStatusChangeAt = nowIso;
    updates.lastStatusChangeReason = change.reason;

    if (
      sendChangeNotification &&
      alertsEnabledFromStorage(storage) &&
      storage.lastAlertedSnapshotSignature !== mergedSnapshot.signature
    ) {
      setStatusChangeBadge(mergedSnapshot);
      updates.lastStatusAlertAt = nowIso;
      updates.lastAlertedSnapshotSignature = mergedSnapshot.signature;
    }
  } else {
    updates.noUpdateStreak = previousStreak + 1;
    updates.lastNoUpdateAt = nowIso;
  }

  await chrome.storage.local.set(updates);

  await recordSyncEvent({
    createdAt: nowIso,
    trigger,
    source: incomingSnapshot.source,
    state: "ok",
    hasUpdate,
    changeReason: change.reason,
    dossierId: mergedSnapshot.dossierId,
    statusDate: mergedSnapshot.statusDateRaw,
    statusCode: mergedSnapshot.statusCodeNorm,
    errorMessage: "",
  });

  return {
    ok: true,
    changed: hasUpdate,
    reason: change.reason,
  };
}

async function runSync({ trigger, sendChangeNotification = true }) {
  try {
    const current = await fetchCurrentDossierStatus();

    return processIncomingSnapshot({
      incomingSnapshot: {
        dossierId: current.dossierId,
        encryptedStatus: current.encryptedStatus,
        statusDateRaw: current.statusDate,
        statusCode: "",
        statusDescription: "",
        source: "api",
      },
      trigger,
      sendChangeNotification,
    });
  } catch (error) {
    const nowIso = new Date().toISOString();
    const storage = await chrome.storage.local.get(STORAGE_KEYS);
    const errorMessage = error?.message || String(error);

    const isAuthExpired =
      Boolean(error?.isAuthExpired) ||
      error?.httpStatus === 401 ||
      error?.httpStatus === 403;

    const updates = {
      lastSyncAt: nowIso,
      lastSyncTrigger: trigger,
      lastSyncState: "error",
      lastSyncError: errorMessage,
      authState: isAuthExpired ? "expired" : "error",
    };

    if (isAuthExpired) {
      setAuthExpiredBadge();
    } else {
      setSyncErrorBadge();
    }

    await chrome.storage.local.set(updates);

    await recordSyncEvent({
      createdAt: nowIso,
      trigger,
      source: "api",
      state: isAuthExpired ? "auth_expired" : "error",
      hasUpdate: false,
      changeReason: "",
      dossierId: "",
      statusDate: "",
      statusCode: "",
      errorMessage,
    });

    console.log("Extension API Naturalisation : erreur sync", errorMessage);

    return {
      ok: false,
      error: errorMessage,
      authExpired: isAuthExpired,
    };
  }
}

async function handleStatusFromPage(payload) {
  const encryptedStatus = String(payload?.encryptedStatus || "");
  if (!encryptedStatus) {
    return { ok: false, reason: "empty_status" };
  }

  return processIncomingSnapshot({
    incomingSnapshot: {
      dossierId: String(payload?.dossierId || ""),
      encryptedStatus,
      statusDateRaw: String(payload?.statusDate || ""),
      statusCode: String(payload?.statusCode || ""),
      statusDescription: String(payload?.statusDescription || ""),
      source: "page",
    },
    trigger: "pageMessage",
    sendChangeNotification: true,
  });
}

async function getDashboardState() {
  const storage = await chrome.storage.local.get(STORAGE_KEYS);
  let recentHistory = [];

  try {
    recentHistory = await getRecentSyncHistory(8);
  } catch (error) {
    console.log(
      "Extension API Naturalisation : impossible de lire la bdd locale",
      error?.message || String(error)
    );
  }

  const state = {
    authState: storage.authState || "unknown",
    lastSyncAt: storage.lastSyncAt || "",
    lastSyncAtLabel: formatDateTime(storage.lastSyncAt) || "Jamais",
    lastSyncState: storage.lastSyncState || "never",
    lastSyncError: storage.lastSyncError || "",
    lastSyncTrigger: storage.lastSyncTrigger || "",
    lastKnownStatusDate: storage.lastKnownStatusDate || "",
    lastKnownStatusDateLabel: formatDate(storage.lastKnownStatusDate) || "Inconnue",
    lastKnownStatusCode: storage.lastKnownStatusCode || "",
    lastKnownStatusDescription: storage.lastKnownStatusDescription || "",
    lastKnownDossierId: storage.lastKnownDossierId || "",
    lastStatusChangeAt: storage.lastStatusChangeAt || "",
    lastStatusChangeAtLabel: formatDateTime(storage.lastStatusChangeAt) || "Aucun",
    lastStatusChangeReason: storage.lastStatusChangeReason || "",
    lastNoUpdateAt: storage.lastNoUpdateAt || "",
    lastNoUpdateAtLabel: formatDateTime(storage.lastNoUpdateAt) || "Aucun",
    noUpdateStreak: Number(storage.noUpdateStreak || 0),
    alertsEnabled: alertsEnabledFromStorage(storage),
    lastStatusAlertAt: storage.lastStatusAlertAt || "",
    lastStatusAlertAtLabel: formatDateTime(storage.lastStatusAlertAt) || "Aucun",
    recentSyncs: recentHistory.map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt,
      createdAtLabel: formatDateTime(entry.createdAt) || "Inconnu",
      trigger: entry.trigger,
      state: entry.state,
      hasUpdate: Boolean(entry.hasUpdate),
      changeReason: entry.changeReason || "",
      errorMessage: entry.errorMessage || "",
    })),
  };
  setStepBadge(state.lastKnownStatusCode, state.lastKnownStatusDescription);
  return state;
}

async function ensureAlarms() {
  await ensureAlertDefaults();

  if (await getAlertsEnabled()) {
    chrome.alarms.create(CONFIG.STATUS_SYNC_ALARM, {
      periodInMinutes: CONFIG.STATUS_SYNC_INTERVAL_MINUTES,
    });
  } else {
    await chrome.alarms.clear(CONFIG.STATUS_SYNC_ALARM).catch(() => {
      // ignore
    });
  }

  chrome.alarms.clear(CONFIG.LEGACY_HOURLY_RECAP_ALARM).catch(() => {
    // ignore
  });
  chrome.alarms.clear(CONFIG.LEGACY_DAILY_ALARM).catch(() => {
    // ignore
  });
}

async function bootExtension(trigger) {
  await cleanupLegacyStorage();
  await ensureAlarms();
  await restoreStatusBadge();
  if (await getAlertsEnabled()) {
    await runSync({ trigger, sendChangeNotification: false });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  bootExtension("onInstalled").catch(() => {
    // ignore
  });
});

chrome.runtime.onStartup.addListener(() => {
  bootExtension("onStartup").catch(() => {
    // ignore
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CONFIG.STATUS_SYNC_ALARM) {
    getAlertsEnabled().then((enabled) => {
      if (enabled) {
        runSync({ trigger: "periodicStatusSync", sendChangeNotification: true });
      }
    });
    return;
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const messageType = message?.type;

  if (messageType === "ANF_SET_ALERTS_ENABLED") {
    const enabled = message?.payload?.enabled === true;
    setAlertsEnabled(enabled)
      .then((settings) => sendResponse({ ok: true, settings }))
      .catch((error) => {
        sendResponse({ ok: false, error: error?.message || String(error) });
      });
    return true;
  }

  if (messageType === "ANF_GET_ALERTS_SETTINGS") {
    getAlertsEnabled()
      .then((alertsEnabled) => sendResponse({ ok: true, alertsEnabled }))
      .catch((error) => {
        sendResponse({ ok: false, error: error?.message || String(error) });
      });
    return true;
  }

  if (messageType === "ANF_FORCE_SYNC") {
    runSync({ trigger: "manualPopupSync", sendChangeNotification: true })
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error?.message || String(error),
        });
      });
    return true;
  }

  if (messageType === "ANF_GET_SYNC_STATE") {
    getDashboardState()
      .then((state) => sendResponse({ ok: true, state }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error?.message || String(error),
        });
      });
    return true;
  }

  if (messageType === "ANF_STATUS_FROM_PAGE") {
    handleStatusFromPage(message?.payload)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.log(
          "Extension API Naturalisation : erreur status page->background",
          error?.message || String(error)
        );
        sendResponse({ ok: false });
      });
    return true;
  }

  return false;
});
