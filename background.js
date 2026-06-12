const CONFIG = {
  ANEF_HOME_URL: "https://administration-etrangers-en-france.interieur.gouv.fr/",
  ANEF_LOGIN_URL:
    "https://sso.anef.dgef.interieur.gouv.fr/auth/realms/anef-usagers/protocol/openid-connect/auth?client_id=anef-usagers&theme=portail-anef&redirect_uri=https%3A%2F%2Fadministration-etrangers-en-france.interieur.gouv.fr%2Fparticuliers%2F%23&response_mode=fragment&response_type=code&scope=openid",
  API_ENDPOINT:
    "https://administration-etrangers-en-france.interieur.gouv.fr/api/anf/dossier-stepper",
  STATUS_SYNC_ALARM: "anf-status-sync",
  HOURLY_RECAP_ALARM: "anf-hourly-recap",
  LEGACY_DAILY_ALARM: "anf-daily-notification",
  STATUS_SYNC_INTERVAL_MINUTES: 15,
  HOURLY_RECAP_INTERVAL_MINUTES: 60,
  AUTH_REMINDER_COOLDOWN_MINUTES: 360,
  AUTO_LOGIN_COOLDOWN_MINUTES: 30,
  SYNC_HISTORY_LIMIT: 200,
};

const DB_CONFIG = {
  NAME: "anf_local_status_db",
  VERSION: 1,
  STORES: {
    STATUS_SNAPSHOTS: "statusSnapshots",
    SYNC_HISTORY: "syncHistory",
  },
};

const AUTO_LOGIN_ENV_DEFAULTS = {
  autoLoginEnabled: false,
  envFranceConnectFiscalNumber: "",
  envFranceConnectPassword: "",
};

const STORAGE_KEYS = [
  "lastSyncAt",
  "lastSyncTrigger",
  "lastSyncState",
  "lastSyncError",
  "authState",
  "lastAuthNotificationAt",
  "lastAuthRecoveryNotificationAt",
  "lastKnownStatus",
  "lastKnownStatusDate",
  "lastKnownStatusCode",
  "lastKnownStatusDescription",
  "lastKnownDossierId",
  "lastStatusChangeAt",
  "lastStatusChangeReason",
  "lastStatusChangeNotificationAt",
  "lastNotifiedSnapshotSignature",
  "lastNoUpdateAt",
  "noUpdateStreak",
  "lastHourlyRecapAt",
  "lastHourlyRecapState",
  "lastHourlyRecapMessage",
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

function maskSensitive(value, keepLast = 3) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= keepLast) return "*".repeat(text.length);
  return `${"*".repeat(text.length - keepLast)}${text.slice(-keepLast)}`;
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

function shouldSendReminder(lastIso, cooldownMinutes) {
  if (!lastIso) return true;
  const last = new Date(lastIso).getTime();
  if (Number.isNaN(last)) return true;
  return Date.now() - last >= cooldownMinutes * 60 * 1000;
}

function createNotification(id, title, message) {
  return chrome.notifications
    .create(id, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title,
      message,
      priority: 2,
    })
    .catch((error) => {
      console.log(
        "Extension API Naturalisation : notification bloquee/inactive",
        error?.message || String(error)
      );
      return null;
    });
}

function setAuthExpiredBadge() {
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#b91c1c" });
  chrome.action.setTitle({
    title: "Session ANEF expiree: reconnexion FranceConnect en cours",
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
    title: "Suivi Naturalisation (sync + notifications)",
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

async function ensureAutoLoginEnvDefaults() {
  const stored = await chrome.storage.local.get([
    "autoLoginEnabled",
    "envFranceConnectFiscalNumber",
    "envFranceConnectPassword",
  ]);
  const updates = {};
  if (typeof stored.autoLoginEnabled !== "boolean") {
    updates.autoLoginEnabled = AUTO_LOGIN_ENV_DEFAULTS.autoLoginEnabled;
  }
  if (!stored.envFranceConnectFiscalNumber) {
    updates.envFranceConnectFiscalNumber =
      AUTO_LOGIN_ENV_DEFAULTS.envFranceConnectFiscalNumber;
  }
  if (!stored.envFranceConnectPassword) {
    updates.envFranceConnectPassword = AUTO_LOGIN_ENV_DEFAULTS.envFranceConnectPassword;
  }
  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }
}

async function startAutoLoginAttempt(reason) {
  const nowIso = new Date().toISOString();
  const storage = await chrome.storage.local.get(STORAGE_KEYS);
  const enabled = storage.autoLoginEnabled !== false;
  const fiscalNumber = String(storage.envFranceConnectFiscalNumber || "").trim();
  const password = String(storage.envFranceConnectPassword || "");

  if (!enabled || !fiscalNumber || !password) {
    await chrome.storage.local.set({
      lastAutoLoginAttemptAt: nowIso,
      lastAutoLoginStatus: "skipped",
      lastAutoLoginStep: "missing_env",
      lastAutoLoginError: "Auto login disabled or env missing.",
      lastAutoLoginReason: reason,
      lastAutoLoginEventAt: nowIso,
    });
    return { started: false, reason: "missing_env" };
  }

  if (
    !shouldSendReminder(
      storage.lastAutoLoginAttemptAt,
      CONFIG.AUTO_LOGIN_COOLDOWN_MINUTES
    )
  ) {
    await chrome.storage.local.set({
      lastAutoLoginStatus: "cooldown",
      lastAutoLoginStep: "cooldown",
      lastAutoLoginError: "Auto login cooldown active.",
      lastAutoLoginReason: reason,
      lastAutoLoginEventAt: nowIso,
    });
    return { started: false, reason: "cooldown" };
  }

  try {
    const tab = await chrome.tabs.create({
      url: CONFIG.ANEF_LOGIN_URL,
      active: false,
    });
    await chrome.storage.local.set({
      lastAutoLoginAttemptAt: nowIso,
      lastAutoLoginStatus: "started",
      lastAutoLoginStep: "open_anef",
      lastAutoLoginError: "",
      lastAutoLoginReason: reason,
      lastAutoLoginTabId: tab?.id ?? null,
      lastAutoLoginEventAt: nowIso,
    });
    await createNotification(
      `anf-autologin-start-${Date.now()}`,
      "ANEF: reconnexion automatique",
      "Tentative via FranceConnect en cours."
    );
    return { started: true };
  } catch (error) {
    const errorMessage = error?.message || String(error);
    await chrome.storage.local.set({
      lastAutoLoginAttemptAt: nowIso,
      lastAutoLoginStatus: "error",
      lastAutoLoginStep: "open_anef_failed",
      lastAutoLoginError: errorMessage,
      lastAutoLoginReason: reason,
      lastAutoLoginEventAt: nowIso,
    });
    return { started: false, reason: "tab_open_error", error: errorMessage };
  }
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
function buildStatusChangeMessage(snapshot) {
  const dateText = formatDate(snapshot.statusDateRaw || snapshot.statusDateNorm);

  if (snapshot.statusDescription && dateText) {
    return `${snapshot.statusDescription} (maj: ${dateText}).`;
  }

  if (snapshot.statusDescription) {
    return `${snapshot.statusDescription}.`;
  }

  if (dateText) {
    return `Un changement a ete detecte (maj dossier: ${dateText}).`;
  }

  return "Un changement de dossier a ete detecte. Ouvre ANEF pour le detail.";
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
  clearBadge();

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
      storage.lastNotifiedSnapshotSignature !== mergedSnapshot.signature
    ) {
      await createNotification(
        `anf-change-${Date.now()}`,
        "ANEF: changement detecte",
        buildStatusChangeMessage(mergedSnapshot)
      );
      updates.lastStatusChangeNotificationAt = nowIso;
      updates.lastNotifiedSnapshotSignature = mergedSnapshot.signature;
    }
  } else {
    updates.noUpdateStreak = previousStreak + 1;
    updates.lastNoUpdateAt = nowIso;
  }

  if (storage.authState === "expired") {
    await createNotification(
      `anf-auth-restored-${Date.now()}`,
      "ANEF: session reconnectee",
      "La session est active. La synchro et les alertes reprennent."
    );
    updates.lastAuthRecoveryNotificationAt = nowIso;
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

      if (
        shouldSendReminder(
          storage.lastAuthNotificationAt,
          CONFIG.AUTH_REMINDER_COOLDOWN_MINUTES
        )
      ) {
        await createNotification(
          `anf-auth-expired-${Date.now()}`,
          "ANEF: session expiree",
          "Session expiree detectee. Reconnexion FranceConnect automatique lancee."
        );
        updates.lastAuthNotificationAt = nowIso;
      }

      await startAutoLoginAttempt("auth_expired_sync");
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

async function handleAutoLoginStatus(payload) {
  const nowIso = new Date().toISOString();
  const status = String(payload?.status || "progress");
  const step = String(payload?.step || "unknown");
  const error = String(payload?.error || "");
  const url = String(payload?.url || "");

  await chrome.storage.local.set({
    lastAutoLoginStatus: status,
    lastAutoLoginStep: step,
    lastAutoLoginError: error,
    lastAutoLoginEventAt: nowIso,
  });

  await recordSyncEvent({
    createdAt: nowIso,
    trigger: "autoLogin",
    source: "autologin",
    state: status === "failed" ? "error" : "ok",
    hasUpdate: false,
    changeReason: step,
    dossierId: "",
    statusDate: "",
    statusCode: "",
    errorMessage: error || url,
  });
}

async function sendHourlyRecapNotification() {
  const nowIso = new Date().toISOString();
  const storage = await chrome.storage.local.get(STORAGE_KEYS);

  let recentHistory = [];
  try {
    recentHistory = await getRecentSyncHistory(20);
  } catch (error) {
    console.log(
      "Extension API Naturalisation : impossible de lire historique sync",
      error?.message || String(error)
    );
  }

  const oneHourAgoMs = Date.now() - 60 * 60 * 1000;
  const lastHourEntries = recentHistory.filter((entry) => {
    const time = new Date(entry.createdAt).getTime();
    return !Number.isNaN(time) && time >= oneHourAgoMs;
  });

  const okCount = lastHourEntries.filter((entry) => entry.state === "ok").length;
  const errorCount = lastHourEntries.filter((entry) => entry.state !== "ok").length;
  const updateCount = lastHourEntries.filter((entry) => Boolean(entry.hasUpdate)).length;

  const lastSyncLabel = formatDateTime(storage.lastSyncAt) || "inconnue";
  const lastChangeLabel = formatDateTime(storage.lastStatusChangeAt) || "aucun";

  let title = "ANEF: recap horaire";
  let message = "";
  let recapState = "ok";

  if (storage.authState === "expired") {
    title = "ANEF: session expiree";
    message = `Session expiree. Derniere sync: ${lastSyncLabel}. Reconnexion auto FranceConnect en cours.`;
    recapState = "auth_expired";
  } else if (updateCount === 0) {
    message = `Aucune mise a jour. Sync OK: ${okCount}, erreurs: ${errorCount}. Dernier changement: ${lastChangeLabel}.`;
    recapState = "no_update";
  } else {
    message = `${updateCount} update(s) detectee(s) sur la derniere heure. Derniere sync: ${lastSyncLabel}.`;
    recapState = "updates_detected";
  }

  await createNotification(`anf-hourly-${Date.now()}`, title, message);

  await chrome.storage.local.set({
    lastHourlyRecapAt: nowIso,
    lastHourlyRecapState: recapState,
    lastHourlyRecapMessage: message,
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

  return {
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
    lastHourlyRecapAt: storage.lastHourlyRecapAt || "",
    lastHourlyRecapAtLabel: formatDateTime(storage.lastHourlyRecapAt) || "Aucun",
    lastHourlyRecapState: storage.lastHourlyRecapState || "",
    lastHourlyRecapMessage: storage.lastHourlyRecapMessage || "",
    autoLoginEnabled: storage.autoLoginEnabled !== false,
    autoLoginFiscalMasked: maskSensitive(storage.envFranceConnectFiscalNumber, 3),
    lastAutoLoginAttemptAt: storage.lastAutoLoginAttemptAt || "",
    lastAutoLoginAttemptAtLabel:
      formatDateTime(storage.lastAutoLoginAttemptAt) || "Aucune",
    lastAutoLoginStatus: storage.lastAutoLoginStatus || "idle",
    lastAutoLoginStep: storage.lastAutoLoginStep || "-",
    lastAutoLoginError: storage.lastAutoLoginError || "",
    lastAutoLoginReason: storage.lastAutoLoginReason || "",
    lastAutoLoginEventAt: storage.lastAutoLoginEventAt || "",
    lastAutoLoginEventAtLabel:
      formatDateTime(storage.lastAutoLoginEventAt) || "Aucun",
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
}
function ensureAlarms() {
  chrome.alarms.create(CONFIG.STATUS_SYNC_ALARM, {
    periodInMinutes: CONFIG.STATUS_SYNC_INTERVAL_MINUTES,
  });

  chrome.alarms.create(CONFIG.HOURLY_RECAP_ALARM, {
    when: Date.now() + CONFIG.HOURLY_RECAP_INTERVAL_MINUTES * 60 * 1000,
    periodInMinutes: CONFIG.HOURLY_RECAP_INTERVAL_MINUTES,
  });

  chrome.alarms.clear(CONFIG.LEGACY_DAILY_ALARM).catch(() => {
    // ignore
  });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarms();
  ensureAutoLoginEnvDefaults().catch(() => {
    // ignore
  });
  runSync({ trigger: "onInstalled", sendChangeNotification: false });
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarms();
  ensureAutoLoginEnvDefaults().catch(() => {
    // ignore
  });
  runSync({ trigger: "onStartup", sendChangeNotification: false });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CONFIG.STATUS_SYNC_ALARM) {
    runSync({ trigger: "periodicStatusSync", sendChangeNotification: true });
    return;
  }

  if (alarm.name === CONFIG.HOURLY_RECAP_ALARM) {
    sendHourlyRecapNotification();
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (!notificationId.startsWith("anf-")) return;
  chrome.tabs.create({ url: CONFIG.ANEF_HOME_URL });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const messageType = message?.type;

  if (messageType === "ANF_TEST_NOTIFICATION") {
    createNotification(
      `anf-test-${Date.now()}`,
      "ANEF: test notification",
      "Si tu vois ceci, les notifications Brave/Chrome fonctionnent."
    )
      .then((notificationId) => sendResponse({ ok: Boolean(notificationId) }))
      .catch((error) => {
        console.log(
          "Extension API Naturalisation : erreur test notification",
          error?.message || String(error)
        );
        sendResponse({ ok: false });
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

  if (messageType === "ANF_AUTO_LOGIN_STATUS") {
    handleAutoLoginStatus(message?.payload)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error?.message || String(error),
        });
      });
    return true;
  }

  if (messageType === "ANF_SET_AUTO_LOGIN_ENV") {
    const fiscalNumber = String(message?.payload?.fiscalNumber || "").trim();
    const password = String(message?.payload?.password || "");
    const enabled = message?.payload?.enabled !== false;

    chrome.storage.local
      .set({
        autoLoginEnabled: enabled,
        envFranceConnectFiscalNumber: fiscalNumber,
        envFranceConnectPassword: password,
      })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        sendResponse({ ok: false, error: error?.message || String(error) });
      });
    return true;
  }

  return false;
});
