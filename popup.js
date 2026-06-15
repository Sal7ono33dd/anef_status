(function () {
  const EXTENSION_VERSION = "3.0";

  const versionPill = document.getElementById("version-pill");
  const statusTitleEl = document.getElementById("status-title");
  const statusStepEl = document.getElementById("status-step");
  const statusCodeEl = document.getElementById("status-code");
  const statusDescEl = document.getElementById("status-desc");
  const statusSinceEl = document.getElementById("status-since");
  const lastSyncEl = document.getElementById("last-sync");
  const progressFillEl = document.getElementById("progress-fill");
  const progressMarkerEl = document.getElementById("progress-marker");
  const tileDepotEl = document.getElementById("tile-depot");
  const tileEntretienEl = document.getElementById("tile-entretien");
  const tileStatutEl = document.getElementById("tile-statut");
  const refreshBtn = document.getElementById("refresh-btn");
  const rexBtn = document.getElementById("rex-btn");
  const copyBtn = document.getElementById("copy-btn");
  const eyeBtn = document.getElementById("eye-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const settingsPanel = document.getElementById("settings-panel");
  const alertsToggle = document.getElementById("alerts-toggle");
  const alertsDetailEl = document.getElementById("alerts-detail");
  const alertStatusEl = document.getElementById("alert-status");
  const alertsStatusEl = document.getElementById("alerts-status");
  const resultEl = document.getElementById("result");

  let currentCode = "";
  let codeVisible = true;
  let alertsEnabled = true;

  const statusTitles = {
    draft: "Brouillon",
    dossier_depose: "Dossier depose",
    verification_formelle_a_traiter: "Verification formelle",
    verification_formelle_en_cours: "Verification formelle",
    instruction_a_affecter: "Instruction prefecture",
    instruction_recepisse_completude_a_envoyer: "Recepisse de completude",
    instruction_date_ea_a_fixer: "Entretien a fixer",
    ea_en_attente_ea: "Entretien d'assimilation",
    ea_crea_a_valider: "Compte rendu EA",
    prop_decision_pref_a_effectuer: "Decision prefecture",
    controle_a_affecter: "Controle SDANF",
    controle_a_effectuer: "Controle SDANF",
    controle_en_attente_pec: "Controle SCEC",
    controle_pec_a_faire: "Controle SCEC",
    controle_transmise_pour_decret: "Transmission decret",
    transmis_a_ac: "Service decret",
    a_verifier_avant_insertion_decret: "Verification decret",
    prete_pour_insertion_decret: "Pret pour decret",
    inseree_dans_decret: "Insere dans decret",
    decret_naturalisation_publie: "Decret publie",
    decret_publie: "Decret publie",
    decision_notifiee: "Decision notifiee",
  };

  function setResult(message, kind) {
    resultEl.textContent = message || "";
    resultEl.className = "result";
    if (kind) resultEl.classList.add(kind);
  }

  function formatCode(code) {
    if (!code) return "CODE INCONNU";
    return codeVisible ? code : code.replace(/[a-z0-9]/gi, "*");
  }

  function getStageInfo(code) {
    const normalized = String(code || "").toLowerCase();

    if (!normalized || normalized === "code_non_reconnu") {
      return { label: "Etape -/12", value: 1, progress: 8 };
    }
    if (normalized === "draft") return { label: "Etape 1/12", value: 1, progress: 8 };
    if (normalized === "dossier_depose") return { label: "Etape 2/12", value: 2, progress: 16 };
    if (normalized.startsWith("verification_")) return { label: "Etape 3/12", value: 3, progress: 25 };
    if (normalized.startsWith("instruction_recepisse")) return { label: "Etape 5/12", value: 5, progress: 42 };
    if (normalized.startsWith("instruction_")) return { label: "Etape 4/12", value: 4, progress: 34 };
    if (normalized.startsWith("ea_") || normalized.includes("date_ea")) {
      return { label: "Etape 6/12", value: 6, progress: 50 };
    }
    if (normalized.startsWith("prop_decision_pref_")) {
      return { label: "Etape 7/12", value: 7, progress: 58 };
    }
    if (normalized.startsWith("controle_")) {
      return { label: "Etape 9.1/12", value: 9.1, progress: 72 };
    }
    if (normalized.startsWith("scec_") || normalized === "non_applicable") {
      return { label: "Etape 9.2/12", value: 9.2, progress: 76 };
    }
    if (
      normalized.startsWith("decret_") ||
      normalized === "transmis_a_ac" ||
      normalized.includes("insertion_decret")
    ) {
      return { label: "Etape 10/12", value: 10, progress: 84 };
    }
    if (
      normalized.startsWith("decision_") ||
      normalized.startsWith("css_") ||
      normalized.includes("irrecevabilite") ||
      normalized === "demande_traitee"
    ) {
      return { label: "Etape 12/12", value: 12, progress: 100 };
    }

    return { label: "Etape 4/12", value: 4, progress: 34 };
  }

  function titleFromState(code, description) {
    const normalized = String(code || "").toLowerCase();
    if (statusTitles[normalized]) return statusTitles[normalized];

    const desc = String(description || "").trim();
    if (!desc) return "Statut ANEF";
    return desc.split(":").pop().trim() || desc;
  }

  function descriptionFromState(code, description) {
    const normalized = String(code || "").toLowerCase();
    if (normalized === "controle_a_affecter") {
      return "Votre dossier est arrive a la Sous-Direction de l'Acces a la Nationalite Francaise (SDANF). Il attend d'etre attribue a un agent pour le controle ministeriel.";
    }
    if (normalized.startsWith("controle_")) {
      return "Votre dossier est en controle administratif. Les services competents verifient les elements transmis avant la suite de la procedure.";
    }
    if (normalized.startsWith("ea_")) {
      return "Votre dossier est dans la phase d'entretien d'assimilation ou de validation du compte rendu.";
    }
    if (normalized.startsWith("decret_") || normalized.includes("insertion_decret")) {
      return "Votre dossier est dans la phase decret. La decision finale ou la publication est en cours de traitement.";
    }
    return description || "Aucun statut detaille disponible pour le moment.";
  }

  function compactDate(value) {
    if (!value || value === "Jamais" || value === "date inconnue") return "-";
    return String(value).replace(/\s*\((manual|alarm|page|force)\)/i, "");
  }

  function renderAlerts(enabled) {
    alertsEnabled = enabled !== false;
    alertsToggle.checked = alertsEnabled;
    alertsDetailEl.textContent = alertsEnabled
      ? "Verification automatique activee toutes les 15 minutes."
      : "Alertes desactivees. Actualisation manuelle uniquement.";
    alertsStatusEl.textContent = alertsEnabled
      ? "Verification auto activee"
      : "Alertes desactivees";
    alertStatusEl.classList.toggle("off", !alertsEnabled);
  }

  function renderState(state) {
    const code = state.lastKnownStatusCode || "code_non_reconnu";
    const description = state.lastKnownStatusDescription || "";
    const stage = getStageInfo(code);
    currentCode = code;

    statusTitleEl.textContent = titleFromState(code, description);
    statusStepEl.textContent = stage.label;
    statusCodeEl.textContent = formatCode(code);
    statusDescEl.textContent = descriptionFromState(code, description);
    statusSinceEl.textContent = compactDate(state.lastKnownStatusDateLabel || "date inconnue");
    lastSyncEl.textContent = compactDate(state.lastSyncAtLabel || "Jamais");

    const progress = Math.max(0, Math.min(100, Number(stage.progress || 0)));
    progressFillEl.style.width = `${Math.max(6, progress - 25)}%`;
    progressMarkerEl.style.left = `${progress}%`;

    tileDepotEl.textContent = compactDate(state.lastKnownStatusDateLabel || "-");
    tileEntretienEl.textContent = stage.value >= 6 ? "En cours" : "A venir";
    tileStatutEl.textContent = compactDate(state.lastKnownStatusDateLabel || "-");
    renderAlerts(state.alertsEnabled !== false);
  }

  async function loadState({ silent }) {
    if (!silent) setResult("Chargement...");

    try {
      const response = await chrome.runtime.sendMessage({ type: "ANF_GET_SYNC_STATE" });
      if (!response?.ok || !response?.state) {
        throw new Error(response?.error || "Etat indisponible");
      }
      renderState(response.state);
      if (!silent) setResult("Statut local mis a jour.", "ok");
    } catch (_error) {
      if (!silent) setResult("Impossible de charger le statut.", "error");
    }
  }

  async function forceSync() {
    refreshBtn.disabled = true;
    setResult("Actualisation...");

    try {
      const response = await chrome.runtime.sendMessage({ type: "ANF_FORCE_SYNC" });
      if (!response?.ok) throw new Error(response?.error || "Echec de synchro");

      await loadState({ silent: true });
      const syncResult = response.result || {};
      setResult(syncResult.changed ? "Nouveau statut detecte." : "Aucune mise a jour.", "ok");
    } catch (_error) {
      setResult("Actualisation impossible.", "error");
    } finally {
      refreshBtn.disabled = false;
    }
  }

  function toggleSettings() {
    const shouldOpen = settingsPanel.hasAttribute("hidden");
    settingsPanel.hidden = !shouldOpen;
    settingsBtn.setAttribute("aria-expanded", String(shouldOpen));
  }

  async function updateAlertsSetting() {
    const nextValue = alertsToggle.checked;
    const previousValue = alertsEnabled;
    renderAlerts(nextValue);
    setResult("Enregistrement des parametres...");

    try {
      const response = await chrome.runtime.sendMessage({
        type: "ANF_SET_ALERTS_ENABLED",
        payload: { enabled: nextValue },
      });
      if (!response?.ok) throw new Error(response?.error || "Echec parametres");

      renderAlerts(response.settings?.alertsEnabled !== false);
      setResult(
        response.settings?.alertsEnabled !== false
          ? "Alertes activees."
          : "Alertes desactivees.",
        "ok"
      );
    } catch (_error) {
      renderAlerts(previousValue);
      setResult("Parametres impossibles a enregistrer.", "error");
    }
  }

  function copyCode() {
    if (!currentCode) return;
    navigator.clipboard?.writeText(currentCode);
    setResult("Code copie.", "ok");
  }

  function toggleCode() {
    codeVisible = !codeVisible;
    statusCodeEl.textContent = formatCode(currentCode);
  }

  versionPill.textContent = `v${EXTENSION_VERSION}`;
  refreshBtn.addEventListener("click", forceSync);
  settingsBtn.addEventListener("click", toggleSettings);
  alertsToggle.addEventListener("change", updateAlertsSetting);
  copyBtn.addEventListener("click", copyCode);
  eyeBtn.addEventListener("click", toggleCode);
  rexBtn.addEventListener("click", () => setResult("Mon REX arrive bientot.", "ok"));

  loadState({ silent: false });
  setInterval(() => loadState({ silent: true }), 20000);
})();
