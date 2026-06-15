(async function () {
  const CONFIG = {
    URL_PATTERN: "administration-etrangers-en-france",
    TAB_NAME: "Demande d'accès à la Nationalité Française",
    API_ENDPOINT:
      "https://administration-etrangers-en-france.interieur.gouv.fr/api/anf/dossier-stepper",
    API_DOSSIER_ENDPOINT:
      "https://administration-etrangers-en-france.interieur.gouv.fr/api/anf/usager/dossiers/",
    WAIT_TIME: 100,
  };

  // Extension version from manifest.json
  const extensionVersion = "3.0";
  console.log(`Extension API Naturalisation - Version: ${extensionVersion}`);

  // Fonction de décryptage dédiée à Kamal : Round 2
  function IamKamal_23071993_v2(encryptedData) {
    const rsaKey = {
      privateKeyPem:
        "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/WvhR9YrO6DHY\n0UpAoIlIuDoF3PtLEJ3J0T5FOLAPSY2sa33AnECl6jWfM7uLuojuTDbfIz6J3vAo\nsNUzwYFNHKx3EG1o6cYzjWm2LzZDa4e25wYlXcL2r3T0mFGS9DT7adKlomNURj4L\nf2WUt11oNH8RYyH/uNk+kIL0HRJLtfTjyyjlWSyjUUDD1ATYZwjnQS2HvdcqJ+Go\n3TTvqTG7yOPzC/lwSKG3zE3eL+pi9E9Lgw9NlSanewOu7toB9NiKwzP3kfSBNpkz\nSv4UBNClfp1UG+psSPnTx3Csil9TbPjSe99ZZ0/ffPf0h2xoga/7rWgScQwHzN9E\ncrvEfDgxAgMBAAECggEAa08Ikm2wOffcfEph6XwdgLpPT5ptEdtvoQ3GbessUGZf\nHKHrE2iMmH6PM4g/VEx3Hat/2gJZv9dVtnv0E+IgMK4zyVFdCciPbbmP3qr7MzPK\nF7fWqn26J7ydSc1hcZehXpwplNlL+qaphKkcvhlWOGm4GHgPSOjQa1V/GoZzDCE1\ne1z9KpVuMMiV4d89FFiE3MHtnrmMnmUdbnesffVftnPmzkkGKKWTCL1BLrdEXgCz\nGSFdqCo+PjcJjEojjmqHhgzTyjPOR6JGh0FqG9ht3aduIQMZfKR1p2+Ds18NlOZu\nT60Lyc7Ud/d0H0f2h9GfftHYCSLkIxfTaAmoYXzXAQKBgQDoWc91xlh8Kb3vmIN1\nIoVY2yhviDTpUqkGxvjt6WYmu38CFpEwSO0cpTVCAkWRKvjKLUOoCAaqfaTrN04t\nLG85Z18gvSQKmncfv0zrKaTN/FrnKOA//hPCAcveDT6Ir9SCxgVmNBox70k89eQ+\n5cDOZACqFhKcoAQa/LjF621HBQKBgQDS1Pi+GhSwbn6nBiqQdzU1+RpXdburzubd\n3dgNlrAOmLoFEGqYNzaMcKbNljNTnAdv/FX6/NYaQGx/pYTs26o/SZZ+SE7Cl2RS\nRJIuWeskuNEoH4W06JgO1djyHVOiHmKbyaATWCjoZSQnnHo8OUBUKOJpw8mrNlQl\nIYUE0OLcPQKBgQDD3LlKUZnTiKhoqYrfGeuIfK34Xrwjlx+O6/l5LA+FRPaKfxWC\nu2bNh+J+M0YLWksAuulWYvWjkGiOMz++Sr+zhxUkluwj2BPk+jDP53nafgju5YEr\n0HU9TKBbHZUCSh384wo4HmGaiFiXf7wY3ToLgTciKZsk1qq/SRxFEvE6NQKBgHcS\nCs2qgybFsMf55o4ilS2/Ww4sEurMdny1bvD1usbzoJN9mwYOoMMeWEZh3ukIhPbN\nJ24R34WB/wT0YSc4RGVr1Q/LHJgv0lvYGEsPQ4tAyfeEHgp3FnHCerz6rSIxUPW1\nIK/sKWZewNWSPULH/rnJQV4EUmBc1ZcG4E5A/u7tAoGBAMneO96PMhJFQDhsakTL\nvGTbhuwBnFjbSuxmyebhszASOuKm8XTVDe004AZTSy7lAm+iYTkfeRbfVrIGWElT\n5DWhmlN/zNTdX56dQWG3P5M48+bxZFXz0YCBAZJw8jZ5LcFuKrr5tQbcNZN9Pqgk\nQJNdXtE3G7SjkDOn36yZSaXp\n-----END PRIVATE KEY-----",
      passphrase: "wa_sir_3awtani_Dir_l_bou9_aaa_khay_div",
    };

    const extractFormData = function (data) {
      var parts = data.split("#K#");
      if (parts.length) {
        return parts[0];
      } else {
        return null;
      }
    };
    try {
      var privateKey = forge.pki.decryptRsaPrivateKey(
        rsaKey.privateKeyPem.trim(),
        rsaKey.passphrase
      );
      if (!privateKey) {
        throw new Error(
          "Échec de décryptage de la clé privée. Vérifiez la passphrase."
        );
      }
      var decodedData = forge.util.decode64(encryptedData);
      var buffer = forge.util.createBuffer(decodedData, "raw");
      var decryptedData = privateKey.decrypt(buffer.getBytes(), "RSA-OAEP", {
        md: forge.md.sha256.create(),
        mgf1: forge.md.sha256.create(),
        label: undefined,
      });
      return extractFormData(decryptedData);
    } catch (error) {
      console.error("Erreur de décryptage :", error);
      return null;
    }
  }

  if (!window.location.href.includes(CONFIG.URL_PATTERN)) return;

  try {
    let trackingDataReady = false;
    let earlyTrackingObserver = null;
    let earlyTrackingObserverTimer = null;

    function findNativeTabList() {
      return Array.from(document.querySelectorAll('[role="tablist"]')).find(
        (tabList) => !tabList.closest("#anf-recreated-tracking-root")
      );
    }

    function findNativeTabHost(tabList) {
      return (
        tabList?.closest(".mat-mdc-tab-header") ||
        tabList?.closest(".mat-tab-header") ||
        tabList?.parentElement ||
        tabList
      );
    }

    function findNativeTabContainer(tabList) {
      const sampleTab = tabList?.querySelector('[role="tab"]:not(#anf-recreated-tracking-tab)');
      if (
        sampleTab?.parentElement &&
        sampleTab.parentElement !== tabList &&
        sampleTab.parentElement.parentElement === tabList
      ) {
        return sampleTab.parentElement;
      }

      return tabList;
    }

    function restoreNativeTabPanels() {
      document.querySelectorAll("[data-anf-previous-display]").forEach((panel) => {
        const previousDisplay = panel.dataset.anfPreviousDisplay;
        panel.style.display = previousDisplay === "__empty__" ? "" : previousDisplay;
        delete panel.dataset.anfPreviousDisplay;
      });
    }

    function hideSelectedNativeTabPanel(tabList) {
      const selectedTab = tabList?.querySelector(
        '[role="tab"][aria-selected="true"]:not(#anf-recreated-tracking-tab)'
      );
      const panelId = selectedTab?.getAttribute("aria-controls");
      if (!panelId) return;

      const panel = document.getElementById(panelId);
      if (
        !panel ||
        panel.id === "anf-recreated-tracking-panel" ||
        panel.closest("#anf-recreated-tracking-root")
      ) {
        return;
      }

      if (!panel.dataset.anfPreviousDisplay) {
        panel.dataset.anfPreviousDisplay = panel.style.display || "__empty__";
      }
      panel.style.display = "none";
    }

    function hideAdoptedNativeTabPanel() {
      const trackingTab = document.getElementById("anf-recreated-tracking-tab");
      const panelId = trackingTab?.dataset?.anfOriginalAriaControls;
      if (!panelId || panelId === "anf-recreated-tracking-panel") return;

      const panel = document.getElementById(panelId);
      if (
        !panel ||
        panel.id === "anf-recreated-tracking-panel" ||
        panel.closest("#anf-recreated-tracking-root")
      ) {
        return;
      }

      if (!panel.dataset.anfPreviousDisplay) {
        panel.dataset.anfPreviousDisplay = panel.style.display || "__empty__";
      }
      panel.style.display = "none";
    }

    function markTrackingTabSelected(tabList, selected) {
      const trackingTab = document.getElementById("anf-recreated-tracking-tab");
      if (!trackingTab) return;

      trackingTab.setAttribute("aria-selected", selected ? "true" : "false");
      trackingTab.classList.toggle("anf-tracking-tab-active", selected);
      trackingTab.classList.toggle("mdc-tab--active", selected);
      trackingTab.classList.toggle("mat-mdc-tab-label-active", selected);
      trackingTab.classList.toggle("mat-tab-label-active", selected);
      trackingTab.classList.toggle("mat-mdc-tab-active", selected);

    }

    function activateTrackingPanel(tabList, panel, shouldScroll = true) {
      restoreNativeTabPanels();
      hideSelectedNativeTabPanel(tabList);
      hideAdoptedNativeTabPanel();
      panel.hidden = false;
      markTrackingTabSelected(tabList, true);
      if (shouldScroll) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function deactivateTrackingPanel() {
      const trackingPanel = document.getElementById("anf-recreated-tracking-panel");
      restoreNativeTabPanels();
      if (trackingPanel) trackingPanel.hidden = true;
      markTrackingTabSelected(null, false);
    }

    function isNativeTabEvent(event, tabList) {
      const target =
        event.target instanceof Element ? event.target : event.target?.parentElement;
      const clickedTab = target?.closest?.('[role="tab"]');
      return Boolean(
        clickedTab &&
          clickedTab.id !== "anf-recreated-tracking-tab" &&
          tabList?.contains(clickedTab)
      );
    }

    function bindNativeTabCloseHandlers(tabList) {
      if (!tabList || tabList.dataset.anfTrackingCloseBound) return;

      tabList.dataset.anfTrackingCloseBound = "true";
      const closeOnNativeTab = (event) => {
        if (isNativeTabEvent(event, tabList)) {
          deactivateTrackingPanel();
        }
      };
      const closeOnNativeTabKey = (event) => {
        if ((event.key === "Enter" || event.key === " ") && isNativeTabEvent(event, tabList)) {
          deactivateTrackingPanel();
        }
      };

      tabList.addEventListener("pointerdown", closeOnNativeTab, true);
      tabList.addEventListener("click", closeOnNativeTab, true);
      tabList.addEventListener("keydown", closeOnNativeTabKey, true);
    }

    function createTrackingTabFromNative(tabList) {
      const sampleTab = tabList?.querySelector('[role="tab"]:not(#anf-recreated-tracking-tab)');
      const trackingTab = sampleTab ? sampleTab.cloneNode(true) : document.createElement("button");

      trackingTab.id = "anf-recreated-tracking-tab";
      trackingTab.setAttribute("role", "tab");
      trackingTab.setAttribute("aria-selected", "false");
      trackingTab.setAttribute("aria-controls", "anf-recreated-tracking-panel");
      trackingTab.setAttribute("tabindex", "0");
      trackingTab.removeAttribute("disabled");
      trackingTab.removeAttribute("aria-disabled");
      trackingTab.removeAttribute("aria-labelledby");
      trackingTab.removeAttribute("data-mat-tab-label");
      trackingTab.classList.remove(
        "mdc-tab--active",
        "mat-mdc-tab-label-active",
        "mat-tab-label-active",
        "mat-mdc-tab-active"
      );
      trackingTab.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));

      if (trackingTab.tagName.toLowerCase() === "button") {
        trackingTab.type = "button";
      }
      if (trackingTab.tagName.toLowerCase() === "a") {
        trackingTab.href = "#anf-recreated-tracking-panel";
      }

      const label =
        trackingTab.querySelector(".mdc-tab__text-label") ||
        trackingTab.querySelector(".mat-tab-label-content") ||
        trackingTab.querySelector(".mat-mdc-tab-label-content") ||
        trackingTab;
      label.textContent = "Demande d'accès à la Nationalité Française";

      return trackingTab;
    }

    function normalizeTabText(text) {
      return (text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    }

    function isNationalityTab(tab) {
      if (!tab || tab.id === "anf-recreated-tracking-tab") return false;
      const label = normalizeTabText(tab.textContent);
      return (
        label.includes("nationalite francaise") ||
        label.includes("naturalisation")
      );
    }

    function findNativeNationalityTab(tabList) {
      const tabContainer = findNativeTabContainer(tabList);
      const directMatch = Array.from(tabContainer?.children || []).find(
        (tab) => tab.getAttribute("role") === "tab" && isNationalityTab(tab)
      );
      if (directMatch) return directMatch;

      return Array.from(
        tabList?.querySelectorAll('[role="tab"]:not(#anf-recreated-tracking-tab)') || []
      ).find(isNationalityTab);
    }

    function adoptNativeNationalityTab(nativeTab) {
      if (!nativeTab) return null;

      if (!nativeTab.dataset.anfOriginalTabId) {
        nativeTab.dataset.anfOriginalTabId = nativeTab.id || "__empty__";
      }
      if (!nativeTab.dataset.anfOriginalAriaControls) {
        nativeTab.dataset.anfOriginalAriaControls =
          nativeTab.getAttribute("aria-controls") || "";
      }

      nativeTab.id = "anf-recreated-tracking-tab";
      nativeTab.dataset.anfAdoptedNativeTab = "true";
      nativeTab.setAttribute("role", "tab");
      nativeTab.setAttribute("aria-selected", "false");
      nativeTab.setAttribute("aria-controls", "anf-recreated-tracking-panel");
      nativeTab.setAttribute("tabindex", "0");
      nativeTab.removeAttribute("disabled");
      nativeTab.removeAttribute("aria-disabled");

      const label =
        nativeTab.querySelector(".mdc-tab__text-label") ||
        nativeTab.querySelector(".mat-tab-label-content") ||
        nativeTab.querySelector(".mat-mdc-tab-label-content") ||
        nativeTab;
      label.textContent = "Demande d'accès à la Nationalité Française";

      return nativeTab;
    }

    function getOrCreateTrackingTab(tabList) {
      const nativeNationalityTab = findNativeNationalityTab(tabList);
      const existingTrackingTab = document.getElementById("anf-recreated-tracking-tab");

      if (nativeNationalityTab) {
        if (existingTrackingTab && existingTrackingTab !== nativeNationalityTab) {
          existingTrackingTab.remove();
        }
        return adoptNativeNationalityTab(nativeNationalityTab);
      }

      return existingTrackingTab || createTrackingTabFromNative(tabList);
    }

    function bindTrackingTabOpenHandler(trackingTab, tabList, panel) {
      if (!trackingTab) return;

      trackingTab.__anfTrackingPanel = panel;
      trackingTab.__anfTrackingTabList = tabList;

      const openTrackingPanel = (event) => {
        if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        activateTrackingPanel(
          trackingTab.__anfTrackingTabList || tabList,
          trackingTab.__anfTrackingPanel || panel
        );
      };

      trackingTab.onclick = openTrackingPanel;
      if (trackingTab.dataset.anfTrackingOpenBound) return;

      trackingTab.dataset.anfTrackingOpenBound = "true";
      trackingTab.addEventListener("pointerdown", openTrackingPanel, true);
      trackingTab.addEventListener("click", openTrackingPanel, true);
      trackingTab.addEventListener("keydown", openTrackingPanel, true);
    }

    function findChangeSituationTab(tabContainer) {
      return Array.from(tabContainer?.children || []).find((tab) => {
        if (tab.id === "anf-recreated-tracking-tab") return false;
        if (tab.getAttribute("role") !== "tab") return false;
        return normalizeTabText(tab.textContent).includes("demande de changement de situation");
      });
    }

    function insertTrackingTabIntoNativeList(tabList, trackingTab) {
      const tabContainer = findNativeTabContainer(tabList);
      if (!tabContainer || !trackingTab) return;

      const legacyWrapper = document.getElementById("anf-recreated-tracking-tab-wrapper");
      if (legacyWrapper) {
        if (legacyWrapper.contains(trackingTab)) {
          legacyWrapper.parentNode?.insertBefore(trackingTab, legacyWrapper);
        }
        legacyWrapper.remove();
      }

      const beforeTab = findChangeSituationTab(tabContainer);
      if (trackingTab.dataset.anfAdoptedNativeTab === "true") return;
      if (trackingTab.parentNode !== tabContainer) {
        tabContainer.insertBefore(trackingTab, beforeTab || null);
      } else if (beforeTab && trackingTab.nextElementSibling !== beforeTab) {
        tabContainer.insertBefore(trackingTab, beforeTab);
      }
    }

    function ensureTrackingRoot() {
      let root = document.getElementById("anf-recreated-tracking-root");
      const tabList = findNativeTabList();
      if (!tabList) return root || null;

      if (!root) {
        root = document.createElement("div");
        root.id = "anf-recreated-tracking-root";
      }

      const tabHost = findNativeTabHost(tabList);
      if (tabHost?.parentNode) {
        if (root.previousElementSibling !== tabHost) {
          tabHost.parentNode.insertBefore(root, tabHost.nextSibling);
        }
      } else if (tabList.parentNode) {
        if (root.previousElementSibling !== tabList) {
          tabList.parentNode.insertBefore(root, tabList.nextSibling);
        }
      }

      return root;
    }

    function injectEarlyTrackingShellCss() {
      const styleId = "anf-early-tracking-shell-style";
      if (document.getElementById(styleId)) return;

      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = `
        #anf-recreated-tracking-root {
          box-sizing: border-box;
          width: 100%;
          padding: 0;
          margin: 0;
          font-family: inherit;
        }
        #anf-recreated-tracking-tab {
          cursor: pointer;
        }
        #anf-recreated-tracking-panel {
          box-sizing: border-box;
          width: min(1180px, calc(100% - 32px));
          margin: 18px auto;
          padding: 18px;
          border: 1px solid #d9e4f2;
          border-radius: 8px;
          background: #ffffff;
          color: #1f2937;
          box-shadow: 0 6px 22px rgba(15, 23, 42, 0.10);
          font-family: inherit;
        }
        #anf-recreated-tracking-panel[hidden] {
          display: none !important;
        }
        .anf-tracking-loading {
          margin: 0;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
        }
      `;
      document.head.appendChild(styleEl);
    }

    function ensureEarlyTrackingShell() {
      const existingPanel = document.getElementById("anf-recreated-tracking-panel");
      const existingTab = document.getElementById("anf-recreated-tracking-tab");
      if (existingPanel && existingTab) {
        const tabList = findNativeTabList();
        const nativeNationalityTab = findNativeNationalityTab(tabList);
        if (tabList && nativeNationalityTab && existingTab.dataset.anfAdoptedNativeTab !== "true") {
          const adoptedTab = getOrCreateTrackingTab(tabList);
          bindTrackingTabOpenHandler(adoptedTab, tabList, existingPanel);
          insertTrackingTabIntoNativeList(tabList, adoptedTab);
          bindNativeTabCloseHandlers(tabList);
        }
        return;
      }

      injectEarlyTrackingShellCss();
      const tabList = findNativeTabList();
      if (!tabList) return;
      const root = ensureTrackingRoot();
      if (!root) return;

      const tab = getOrCreateTrackingTab(tabList);

      const panel = existingPanel || document.createElement("section");
      panel.id = "anf-recreated-tracking-panel";
      panel.setAttribute("role", "tabpanel");
      panel.hidden = true;
      if (!panel.dataset.anfLoading) {
        panel.dataset.anfLoading = "true";
        panel.innerHTML = '<p class="anf-tracking-loading">Chargement de la demande d’accès à la Nationalité Française...</p>';
      }

      bindTrackingTabOpenHandler(tab, tabList, panel);

      insertTrackingTabIntoNativeList(tabList, tab);
      bindNativeTabCloseHandlers(tabList);
      if (panel.parentNode !== root) root.appendChild(panel);
    }

    function removeEarlyTrackingShell() {
      const panel = document.getElementById("anf-recreated-tracking-panel");
      if (!panel?.dataset?.anfLoading) return;

      const tab = document.getElementById("anf-recreated-tracking-tab");
      const root = document.getElementById("anf-recreated-tracking-root");
      panel.remove();
      tab?.remove();
      if (root && !root.children.length) root.remove();
    }

    function startEarlyTrackingObserver() {
      if (earlyTrackingObserver || !document.documentElement) return;

      earlyTrackingObserver = new MutationObserver(() => {
        if (earlyTrackingObserverTimer) return;
        earlyTrackingObserverTimer = setTimeout(() => {
          earlyTrackingObserverTimer = null;
          const hasPanel = document.getElementById("anf-recreated-tracking-panel");
          const hasTab = document.getElementById("anf-recreated-tracking-tab");
          if (hasPanel && hasTab) return;

          if (trackingDataReady) {
            renderRecreatedTrackingTab();
          } else {
            ensureEarlyTrackingShell();
          }
        }, 150);
      });

      earlyTrackingObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }

    function stopEarlyTrackingObserver() {
      if (earlyTrackingObserverTimer) {
        clearTimeout(earlyTrackingObserverTimer);
        earlyTrackingObserverTimer = null;
      }
      earlyTrackingObserver?.disconnect();
      earlyTrackingObserver = null;
    }

    async function fetchWithRetry(url, maxWaitMs = 45000) {
      const startedAt = Date.now();
      let lastError = null;

      while (Date.now() - startedAt < maxWaitMs) {
        try {
          const response = await fetch(url);
          if (response.ok) return response;
          lastError = new Error(`Erreur API: ${response.status}`);
        } catch (error) {
          lastError = error;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      throw lastError || new Error("API ANEF indisponible");
    }

    restoreNativeTabPanels();
    ensureEarlyTrackingShell();
    startEarlyTrackingObserver();

    // Fonction pour attendre l'élément de l'onglet
    async function waitForElement(maxWaitMs = 7000) {
      const startedAt = Date.now();
      while (Date.now() - startedAt < maxWaitMs) {
        const tabs = Array.from(
          document.querySelectorAll('a[role="tab"], button[role="tab"]')
        );
        const tabElement = tabs.find((el) => {
          if (el.id === "anf-recreated-tracking-tab") return false;
          const label = el.textContent.trim();
          const normalizedLabel = label.toLowerCase();
          return (
            label === CONFIG.TAB_NAME ||
            normalizedLabel.includes("nationalit") ||
            normalizedLabel.includes("naturalisation")
          );
        });

        if (tabElement) {
          return tabElement;
        }

        await new Promise((resolve) => setTimeout(resolve, CONFIG.WAIT_TIME)); // Attendre avant de réessayer
      }

      return null;
    }

    // fonction pour attendre le chargement de l'étape active
    async function waitForActiveStep(maxWaitMs = 5000) {
      const startedAt = Date.now();
      while (Date.now() - startedAt < maxWaitMs) {
        const activeStep = document.querySelector("li.itemFrise.active");
        if (activeStep) return activeStep;
        await new Promise((resolve) => setTimeout(resolve, CONFIG.WAIT_TIME));
      }

      return null;
    }

    const tabElement = await waitForElement();
    const hasNativeTrackingTab = Boolean(
      tabElement && tabElement.id !== "anf-recreated-tracking-tab"
    );
    if (!tabElement) {
      console.log(
        "Extension API Naturalisation : onglet ANEF introuvable, reconstruction locale activee"
      );
    }

    // Obtenir les données du dossier directement
    const response = await fetchWithRetry(CONFIG.API_ENDPOINT);
    if (!response.ok) throw new Error(`Erreur API: ${response.status}`);

    const dossierData = await response.json();
    if (!dossierData?.dossier?.statut) throw new Error("Statut non trouvé");

    const data = {
      dossier: dossierData.dossier,
    };

    // Récupérer l'ID du dossier
    const idDossier = dossierData.dossier.id;
    const requestNumber = firstNonBlank(
      dossierData?.dossier?.numero_demande,
      dossierData?.dossier?.numero,
      dossierData?.dossier?.id_demande,
      idDossier
    );

    // Récupérer les données dossier (date d'entretien + décret) depuis l'API dossier
    let assimilationDate = null;
    let assimilationPlateforme = null;
    let decretId = null;
    let recepisseCreated = null;
    let complementInstructionDate = null;
    let demandeDate = null;
    let fiscalStampNumber = null;
    try {
      const dossierResponse = await fetch(
        CONFIG.API_DOSSIER_ENDPOINT + idDossier
      );
      if (dossierResponse.ok) {
        const raw = await dossierResponse.json();
        const dossierDetails = raw?.data ?? raw;
        fiscalStampNumber = getFiscalStampNumber(dossierDetails);

        // Date de demande (consommation taxe)
        demandeDate = dossierDetails?.taxe_payee?.date_consommation || null;

        // entretien d'assimilation
        assimilationDate =
          dossierDetails?.entretien_assimilation?.date_rdv || null;
        assimilationPlateforme =
          dossierDetails?.entretien_assimilation?.unite_gestion?.nom_plateforme || null;
        // décret id (prendre le premier trouvé)

        const idents = dossierDetails?.demande?.informations?.etat_civil?.identites_decrets;
        if (Array.isArray(idents) && idents.length > 0) {
          for (const identite of idents) {
            if (identite?.decret?.id) {
              decretId = identite.decret.id;
              break;
            }
          }
        }
        // demande de complément d'instruction (prendre le dernier)
        const demandeComplements = dossierDetails?.demande_complement;
        if (Array.isArray(demandeComplements) && demandeComplements.length > 0) {
          const complementInstructions = demandeComplements.filter(
            (dc) => dc?.type_complement === "COMPLEMENT_INSTRUCTION"
          );
          if (complementInstructions.length > 0) {
            complementInstructionDate = complementInstructions.sort(
              (a, b) => new Date(b.date_creation_demande) - new Date(a.date_creation_demande)
            )[0]?.date_creation_demande;
          }
        }
      }
    } catch (e) {
      console.log(
        "Erreur lors de la récupération de l'entretien d'assimilation:",
        e
      );
    }

    if (!decretId) {
      console.log(
        "Extension API Naturalisation  : Aucun numéro de décret trouvé pour ce dossier"
      );
    }

    // Fin récupération dossier (une seule requête)

    // Récupérer les notifications et extraire la date de réception du récépissé de complétude
    try {
      const notifRes = await fetch(
        "https://administration-etrangers-en-france.interieur.gouv.fr/api/notifications"
      );
      if (notifRes.ok) {
        const notifJson = await notifRes.json();
        const items = Array.isArray(notifJson?._items) ? notifJson._items : [];
        
        // Récupérer RECEPISSE_COMPLETUDE_ENVOYE
        const matches = items.filter(
          (it) =>
            String(it?.id_demande) === String(idDossier) &&
            it?.type_notification === "NATIONALITE" &&
            it?.motif_notification === "RECEPISSE_COMPLETUDE_ENVOYE"
        );
        if (matches.length) {
          recepisseCreated = matches.sort(
            (a, b) => new Date(b._created) - new Date(a._created)
          )[0]?._created;
        }
      }
    } catch (e) {
      console.log(
        "Extension API Naturalisation  : Erreur lors de la récupération des notifications:",
        e
      );
    }

    // Fonction pour obtenir la description du statut
    async function getStatusDescription(status) {
      const statusMap = {
        // 0 Brouillon
        draft: "Dossier en brouillon",
        // 1 Dépôt de la demande
        dossier_depose: "Dossier déposé",
        // 2 Examen des pièces en cours
        verification_formelle_a_traiter: "Préfecture : Vérification à traiter",
        verification_formelle_en_cours:
          "Préfecture : Vérification formelle en cours",
        verification_formelle_mise_en_demeure:
          "Préfecture : Vérification formelle, mise en demeure",
        instruction_a_affecter:
          "Préfecture : En attente affectation à un agent",
        // 3 Réception du récépissé de complétude
        instruction_recepisse_completude_a_envoyer:
          "Préfecture : récépissé de complétude à envoyer",
        instruction_recepisse_completude_a_envoyer_retour_complement_a_traiter:
          "Préfecture : Compléments à vérfier par l'agent",
        // 4 Entretien
        instruction_date_ea_a_fixer: "Préfecture : Date entretien à fixer",
        ea_demande_report_ea: "Préfecture : Demande de report entretien",
        ea_en_attente_ea: "Préfecture : Attente convocation entretien",
        ea_crea_a_valider:
          "Préfecture : Entretien passé, compte-rendu à valider",
        // 5 Decision prefecture
        prop_decision_pref_a_effectuer: "Préfecture : Décision à effectuer",
        prop_decision_pref_en_attente_retour_hierarchique:
          "Préfecture : En attente retour hiérarchique",
        prop_decision_pref_en_attente_retour_hierarchiqu:
          "Préfecture : En attente retour hiérarchique",
        prop_decision_pref_prop_a_editer:
          "Préfecture : Décision prise, rédaction en cours",
        prop_decision_pref_en_attente_retour_signataire:
          "Préfecture : En attente retour signataire",
        // 6 Controle
        controle_a_affecter: "SDANF : Dossier transmis, attente d'affectation",
        controle_a_effectuer: "SDANF : Contrôle état civil à effectuer",
        controle_en_attente_pec: "SCEC : Attente validation pièce d'état civil",
        controle_pec_a_faire: "SCEC : Validation en cours pièce d'état civil",
        controle_transmise_pour_decret:
          "SDANF : Décret transmis pour approbation",
        controle_en_attente_retour_hierarchique:
          "SDANF : Attente retour hiérarchique pour décret",
        controle_decision_a_editer:
          "SDANF : Décision hiérarchique prise, édition prochaine",
        controle_en_attente_signature:
          "SDANF : Décision prise, attente signature",
        controle_demande_notifiee: "Contrôle : demande notifiée",
        // 7 Traitement en cours
        transmis_a_ac: "Décret : Dossier transmis au service décret",
        a_verifier_avant_insertion_decret:
          "Décret : Vérification avant insertion décret",
        prete_pour_insertion_decret:
          "Décret : Dossier prêt pour insertion décret",
        inseree_dans_decret: "Décret : Demande insérée dans décret",
        decret_envoye_prefecture: "Décret envoyé à préfecture",
        notification_envoyee: "Décret : Notification envoyée au demandeur",
        demande_traitee: "Décret : Demande finalisée",
        // 8 Décision
        decret_naturalisation_publie:
          "Décision : Décret de naturalisation publié",
        decret_en_preparation: "Décision : Décret en préparation",
        decret_a_qualifier: "Décision : Décret à qualifier",
        decret_en_validation: "Décision : Décret en validation",
        decision_negative_en_delais_recours:
          "Décision négative en délais de recours",
        irrecevabilite_manifeste: "Décision : irrecevabilité manifeste",
        irrecevabilite_manifeste_en_delais_recours:
          "Décision : irrecevabilité en délais de recours",
        decision_notifiee: "Décision notifiée",
        demande_en_cours_rapo: "Décision : Demande en cours RAPO",
        controle_demande_notifiee: "Décision : Contrôle demande notifiée",
        decret_publie: "Décret de naturalisation publié",
        // 9 CSS
        css_en_delais_recours: "Classement sans suite en délais de recours",
        css_notifie: "Classement sans suite notifiée",
        css_mise_en_demeure_a_affecter:
          "Classement sans suite, Mise en demeure à affecter",
        css_manuels_a_affecter:
          "Proposition de Classement sans suite manuels à affecter",
        css_manuels_a_rediger:
          "Proposition de Classement sans suite manuels à rédiger",
        css_mise_en_demeure_a_rediger:
          "Classement sans suite, Mise en demeure à rédiger",
        css_automatiques_a_affecter:
          "Classement sans suite automatiques à affecter",
        css_automatiques_a_rediger:
          "Proposition de Classement sans suite automatiques à rédiger",
        //
        prenat_a_traiter: "Prenaturalisation : À traiter",
        prenat_en_cours: "Prenaturalisation : En cours",
        prenat_en_attente_complements:
          "Prenaturalisation : En attente compléments",
        prenat_cloture: "Prenaturalisation : Clôturée",
        //
        scec_a_faire: "SCEC à faire",
        scec_en_cours: "SCEC en cours",
        scec_en_attente: "SCEC en attente",
        scec_bloque: "SCEC bloqué",
        scec_termine: "SCEC terminé",
        non_applicable: "SCEC non attribuable",
        //
        code_non_reconnu: "Code non reconnu",
      };

      return statusMap[status] || status || statusMap["code_non_reconnu"];
    }

    let dossierStatusCode = IamKamal_23071993_v2(data.dossier.statut);
    if (!dossierStatusCode) {
      dossierStatusCode = "code_non_reconnu";
    }

    const dossierStatus = await getStatusDescription(
      String(dossierStatusCode).toLowerCase()
    );

    function getStatusVisual(statusCode) {
      const code = String(statusCode || "").toLowerCase();

      if (code.startsWith("verification_") || code.startsWith("instruction_")) {
        return {
          iconClass: "fa-file-text-o",
          phaseLabel: "Instruction prefecture",
          iconColor: "#1f4e8a",
          cardBackground: "linear-gradient(165deg, #e8f1fb, #ffffff)",
          cardBorder: "#1f4e8a",
          badgeBackground: "#dbeafe",
          badgeColor: "#1e3a8a",
        };
      }

      if (code.startsWith("ea_")) {
        return {
          iconClass: "fa-comments",
          phaseLabel: "Entretien assimilation",
          iconColor: "#9a3412",
          cardBackground: "linear-gradient(165deg, #fff3e8, #ffffff)",
          cardBorder: "#c2410c",
          badgeBackground: "#ffedd5",
          badgeColor: "#9a3412",
        };
      }

      if (
        code.startsWith("controle_") ||
        code.startsWith("scec_") ||
        code === "non_applicable"
      ) {
        return {
          iconClass: "fa-search",
          phaseLabel: "Controle administratif",
          iconColor: "#075985",
          cardBackground: "linear-gradient(165deg, #e8f7ff, #ffffff)",
          cardBorder: "#0284c7",
          badgeBackground: "#dbeafe",
          badgeColor: "#0c4a6e",
        };
      }

      if (
        code.startsWith("decret_") ||
        code.startsWith("transmis_a_ac") ||
        code.includes("insertion_decret")
      ) {
        return {
          iconClass: "fa-gavel",
          phaseLabel: "Phase decret",
          iconColor: "#166534",
          cardBackground: "linear-gradient(165deg, #e8f9ef, #ffffff)",
          cardBorder: "#16a34a",
          badgeBackground: "#dcfce7",
          badgeColor: "#166534",
        };
      }

      if (
        code.startsWith("decision_") ||
        code.startsWith("css_") ||
        code.includes("irrecevabilite")
      ) {
        return {
          iconClass: "fa-balance-scale",
          phaseLabel: "Decision",
          iconColor: "#7c2d12",
          cardBackground: "linear-gradient(165deg, #fff2ec, #ffffff)",
          cardBorder: "#ea580c",
          badgeBackground: "#ffedd5",
          badgeColor: "#9a3412",
        };
      }

      if (code.startsWith("draft") || code.startsWith("dossier_depose")) {
        return {
          iconClass: "fa-folder-open",
          phaseLabel: "Depot dossier",
          iconColor: "#1f4e8a",
          cardBackground: "linear-gradient(165deg, #edf2ff, #ffffff)",
          cardBorder: "#3b82f6",
          badgeBackground: "#dbeafe",
          badgeColor: "#1e3a8a",
        };
      }

      return {
        iconClass: "fa-info-circle",
        phaseLabel: "Suivi dossier",
        iconColor: "#255a99",
        cardBackground: "linear-gradient(165deg, #dbe2e9, #ffffff)",
        cardBorder: "#255a99",
        badgeBackground: "#e2e8f0",
        badgeColor: "#334155",
      };
    }

    console.log(
      "Extension API Naturalisation  : Statut code = " + dossierStatusCode
    );

    console.log(
      "Extension API Naturalisation  : Statut description = " + dossierStatus
    );

    const statusVisual = getStatusVisual(dossierStatusCode);

    // Push latest status to extension background worker for sync state.
    function pushStatusToBackground() {
      try {
        window.postMessage(
          {
            source: "ANF_STATUS_EXTENSION",
            type: "STATUS_UPDATE",
            payload: {
              dossierId: idDossier,
              encryptedStatus: data?.dossier?.statut || "",
              statusCode: dossierStatusCode || "",
              statusDescription: dossierStatus || "",
              statusDate: data?.dossier?.date_statut || "",
              extensionVersion,
            },
          },
          window.location.origin
        );
      } catch (e) {
        console.log(
          "Extension API Naturalisation  : Erreur envoi statut vers background:",
          e
        );
      }
    }

    pushStatusToBackground();

    // Fonction pour calculer le nombre de jours écoulés
    function daysAgo(dateString) {
      const inputDate = new Date(dateString);
      const currentDate = new Date();
      const diffInDays = Math.floor(
        (currentDate - inputDate) / (1000 * 60 * 60 * 24)
      );

      if (diffInDays === 0) {
        const hours = String(inputDate.getHours()).padStart(2, "0");
        const minutes = String(inputDate.getMinutes()).padStart(2, "0");
        return `Aujourd'hui à ${hours}h${minutes}`;
      }
      if (diffInDays === 1) {
        const hours = String(inputDate.getHours()).padStart(2, "0");
        const minutes = String(inputDate.getMinutes()).padStart(2, "0");
        return `Hier à ${hours}h${minutes}`;
      }
      if (diffInDays <= 30) return `il y a ${diffInDays} jrs`;

      const years = Math.floor(diffInDays / 365);
      const months = Math.floor((diffInDays % 365) / 30);
      const days = diffInDays % 30;

      if (years >= 1) {
        if (months === 0) {
          return `il y a ${years} ${years === 1 ? "an" : "ans"}`;
        }
        return `il y a ${years} ${
          years === 1 ? "an" : "ans"
        } et ${months} mois`;
      }

      if (months >= 1) {
        if (days === 0) {
          return `il y a ${months} ${months === 1 ? "mois" : "mois"}`;
        }
        return `il y a ${months} ${
          months === 1 ? "mois" : "mois"
        } et ${days} jrs`;
      }

      return `il y a ${months} mois`;
    }

    // Formatter la date au format DD/MM/YY HH24hMI
    function formatDate(dateString) {
      if (!dateString) return "";
      const d = new Date(dateString);
      if (isNaN(d)) return "";
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getFullYear());
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy}`; // ${hh}h${mi}`;
    }

    function firstNonBlank(...values) {
      return values.find((value) => String(value || "").trim()) || "";
    }

    function joinNonBlank(...values) {
      return values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(" - ");
    }

    function buildDateBadge(dateString) {
      const formatted = formatDate(dateString);
      if (!formatted) return "";
      return `${formatted} (${daysAgo(dateString)})`;
    }

    function maskDetail(value) {
      const text = String(value || "").trim();
      if (!text) return "";
      return "*".repeat(Math.min(Math.max(text.length, 10), 16));
    }

    function stripStatusPrefix(value) {
      return String(value || "").replace(/^[^:]+:\s*/, "").trim();
    }

    function formatDateTime(dateString) {
      if (!dateString) return "";
      const d = new Date(dateString);
      if (isNaN(d)) return "";
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getFullYear());
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy} à ${hh}:${mi}:${ss}`;
    }

    function findDeepValueByKey(source, keyMatcher, seen = new Set()) {
      if (!source || typeof source !== "object" || seen.has(source)) return "";
      seen.add(source);

      for (const [key, value] of Object.entries(source)) {
        if (
          keyMatcher(key) &&
          (typeof value === "string" || typeof value === "number") &&
          String(value).trim()
        ) {
          return String(value).trim();
        }
      }

      for (const value of Object.values(source)) {
        if (value && typeof value === "object") {
          const found = findDeepValueByKey(value, keyMatcher, seen);
          if (found) return found;
        }
      }

      return "";
    }

    function getFiscalStampNumber(dossierDetails) {
      const taxePayee = dossierDetails?.taxe_payee || {};
      const directValue = firstNonBlank(
        taxePayee.numero_timbre,
        taxePayee.numero_timbre_fiscal,
        taxePayee.num_timbre,
        taxePayee.timbre_fiscal,
        taxePayee.numero,
        taxePayee.reference,
        dossierDetails?.timbre_fiscal?.numero,
        dossierDetails?.timbre_fiscal?.reference
      );

      return (
        directValue ||
        findDeepValueByKey(dossierDetails, (key) => {
          const normalizedKey = normalizeTabText(key);
          return (
            normalizedKey.includes("timbre") &&
            !normalizedKey.includes("date") &&
            !normalizedKey.includes("montant")
          );
        })
      );
    }

    function createEyeSvg(isHidden) {
      return isHidden
        ? `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M17.94 17.94A10.9 10.9 0 0 1 12 20C7 20 2.73 16.89 1 12c.8-2.26 2.22-4.17 4.06-5.47"></path>
            <path d="M9.9 4.24A10.7 10.7 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-2.3 3.95"></path>
            <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"></path>
            <path d="M3 3l18 18"></path>
          </svg>`
        : `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>`;
    }

    function maskSummaryValue(value) {
      const text = String(value || "").trim();
      if (!text) return "-";
      return "*".repeat(Math.min(Math.max(text.length, 10), 16));
    }

    function createMaskableSummaryValue(value) {
      const wrapper = document.createElement("span");
      wrapper.className = "anf-summary-secret";

      const rawValue = String(value || "").trim();
      const valueEl = document.createElement("span");
      valueEl.className = "anf-summary-secret-value";
      valueEl.textContent = maskSummaryValue(rawValue);
      wrapper.appendChild(valueEl);

      if (!rawValue) return wrapper;

      let isHidden = true;
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "anf-summary-eye";
      toggle.setAttribute("aria-label", "Afficher la valeur");
      toggle.innerHTML = createEyeSvg(true);
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        isHidden = !isHidden;
        valueEl.textContent = isHidden ? maskSummaryValue(rawValue) : rawValue;
        toggle.setAttribute("aria-label", isHidden ? "Afficher la valeur" : "Masquer la valeur");
        toggle.innerHTML = createEyeSvg(isHidden);
      });
      wrapper.appendChild(toggle);

      return wrapper;
    }

    const recreatedTrackingSteps = [
      {
        key: "demande_envoyee",
        title: "Demande envoyée",
        description: "Dépôt initial de la demande sur ANEF.",
      },
      {
        key: "examen_pieces",
        title: "Examen des pièces en cours",
        description: "Vérification formelle des pièces et compléments éventuels.",
      },
      {
        key: "demande_deposee",
        title: "Demande déposée",
        description: "Dossier enregistré et pris en compte.",
      },
      {
        key: "traitement_plateforme_1",
        title: "Traitement en cours (Plateforme)",
        description: "Traitement initial par la plateforme.",
      },
      {
        key: "recepisse_completude",
        title: "Réception du récépissé de complétude",
        description: "Dossier considéré complet par l'administration.",
      },
      {
        key: "traitement_plateforme_2",
        title: "Traitement en cours (Plateforme)",
        description: "Traitement plateforme après complétude.",
      },
      {
        key: "entretien_assimilation",
        title: "Entretien d'assimilation",
        description: "Convocation, entretien puis validation du compte rendu.",
      },
      {
        key: "traitement_plateforme_3",
        title: "Traitement en cours (Plateforme)",
        description: "Traitement plateforme après entretien.",
      },
      {
        key: "traitement_sdanf_1",
        title: "Traitement en cours (SDANF)",
        description: "Contrôle ministériel par la SDANF.",
      },
      {
        key: "traitement_scec",
        title: "Traitement en cours (SCEC)",
        description: "Vérification de l'état civil par le SCEC.",
      },
      {
        key: "traitement_sdanf_2",
        title: "Traitement en cours (SDANF)",
        description: "Retour SDANF avant décision.",
      },
      {
        key: "decision_prise",
        title: "Décision prise",
        description: "Décision finale, notification ou publication du décret.",
      },
      {
        key: "ceremonie_naturalisation",
        title: "Cérémonie de naturalisation",
        description: "Étape finale après la décision.",
      },
    ];

    function inferRecreatedTrackingIndex(statusCode) {
      const code = String(statusCode || "").trim().toLowerCase();
      if (!code || code === "-" || code === "code_non_reconnu") return 0;

      if (code === "draft") return 0;
      if (code === "dossier_depose") return 2;
      if (code.startsWith("verification_")) return 1;
      if (code.startsWith("instruction_recepisse")) return 4;
      if (code === "instruction_date_ea_a_fixer") return 5;
      if (code.startsWith("ea_") || code.includes("date_ea")) return 6;
      if (code.startsWith("instruction_")) return 3;
      if (code.startsWith("prop_decision_pref_")) return 7;
      if (
        code === "controle_a_affecter" ||
        code === "controle_a_effectuer" ||
        code === "controle_en_attente_retour_ministeriel" ||
        code === "controle_en_attente_retour_prefecture"
      ) {
        return 8;
      }
      if (
        code === "controle_en_attente_pec" ||
        code === "controle_pec_a_faire" ||
        code.startsWith("scec_") ||
        code === "non_applicable"
      ) {
        return 9;
      }
      if (code.startsWith("controle_")) {
        return 10;
      }
      if (
        code.startsWith("decret_") ||
        code === "transmis_a_ac" ||
        code === "a_verifier_avant_insertion_decret" ||
        code === "prete_pour_insertion_decret" ||
        code === "inseree_dans_decret" ||
        code === "decret_envoye_prefecture" ||
        code === "notification_envoyee" ||
        code === "demande_traitee" ||
        code.startsWith("decision_") ||
        code.startsWith("css_") ||
        code.includes("irrecevabilite") ||
        code === "demande_en_cours_rapo"
      ) {
        return 11;
      }
      if (code.includes("ceremonie") || code.includes("cérémonie")) {
        return 12;
      }

      return 1;
    }

    function getRecreatedStepDetail(stepKey, index, currentIndex) {
      const isCurrent = index === currentIndex;
      const isPending = index > currentIndex;
      const currentDetail = isCurrent ? dossierStatus : "";

      switch (stepKey) {
        case "demande_envoyee":
          return (
            buildDateBadge(firstNonBlank(demandeDate, data?.dossier?.date_statut)) ||
            (isPending ? "En attente" : "Demande envoyée")
          );
        case "examen_pieces":
          if (complementInstructionDate) {
            return `Complément demandé le ${formatDate(complementInstructionDate)}`;
          }
          return currentDetail || (isPending ? "En attente" : "Pièces examinées");
        case "demande_deposee":
          return (
            buildDateBadge(firstNonBlank(demandeDate, data?.dossier?.date_statut)) ||
            (isPending ? "En attente" : "Dossier déposé")
          );
        case "traitement_plateforme_1":
        case "traitement_plateforme_2":
        case "traitement_plateforme_3":
          return (
            currentDetail ||
            joinNonBlank(
              assimilationPlateforme ? `Plateforme: ${assimilationPlateforme}` : "",
              isPending ? "En attente" : "Traitement plateforme"
            )
          );
        case "recepisse_completude":
          return (
            buildDateBadge(recepisseCreated) ||
            (isPending ? "En attente" : "Récépissé de complétude")
          );
        case "entretien_assimilation":
          return (
            joinNonBlank(
              buildDateBadge(assimilationDate),
              assimilationPlateforme ? `Plateforme: ${assimilationPlateforme}` : ""
            ) ||
            currentDetail ||
            (isPending ? "En attente" : "Entretien traité")
          );
        case "traitement_sdanf_1":
        case "traitement_sdanf_2":
          return currentDetail || (isPending ? "En attente" : "Traitement SDANF");
        case "traitement_scec":
          return currentDetail || (isPending ? "En attente" : "Traitement SCEC");
        case "decision_prise":
          return (
            joinNonBlank(
              decretId ? `Décret no ${decretId}` : "",
              currentDetail,
              isCurrent ? buildDateBadge(data?.dossier?.date_statut) : ""
            ) || (isPending ? "En attente" : "Décision traitée")
          );
        case "ceremonie_naturalisation":
          return isPending ? "En attente" : "Cérémonie de naturalisation";
        default:
          return isPending ? "En attente" : "";
      }
    }

    function getRecreatedStepSubdetails(stepKey, index, currentIndex) {
      const isCurrent = index === currentIndex;
      const isPending = index > currentIndex;
      const statusDate = data?.dossier?.date_statut || "";
      const code = String(dossierStatusCode || "").toLowerCase();
      const details = [];

      const add = (text, variant = "") => {
        const value = String(text || "").trim();
        if (value) details.push({ text: value, variant });
      };

      if (stepKey === "demande_envoyee") {
        add(buildDateBadge(demandeDate), "date");
      }

      if (stepKey === "examen_pieces") {
        add(
          complementInstructionDate
            ? `Complément demandé le ${formatDate(complementInstructionDate)}`
            : "",
          "date"
        );
      }

      if (stepKey === "demande_deposee") {
        add(formatDate(demandeDate), "date");
      }

      if (stepKey === "recepisse_completude") {
        add(formatDate(recepisseCreated), "date");
      }

      if (stepKey === "entretien_assimilation") {
        add(formatDate(assimilationDate), "date");
        if (assimilationPlateforme) {
          details.push({
            text: maskDetail(assimilationPlateforme),
            rawText: assimilationPlateforme,
            variant: "masked",
          });
        }
      }

      if (
        isCurrent &&
        ["traitement_plateforme_1", "traitement_plateforme_2", "traitement_plateforme_3"].includes(stepKey)
      ) {
        add(stripStatusPrefix(dossierStatus), "status");
        add(formatDate(statusDate), "date");
      }

      if (isCurrent && stepKey === "traitement_sdanf_1") {
        add(stripStatusPrefix(dossierStatus), "status");
        add(formatDate(statusDate), "date");
      }

      if (isCurrent && stepKey === "traitement_scec") {
        add(stripStatusPrefix(dossierStatus), "status");
        add(formatDate(statusDate), "date");
      }

      if (isCurrent && stepKey === "traitement_sdanf_2") {
        add(stripStatusPrefix(dossierStatus), "status");
        add(formatDate(statusDate), "date");
      }

      if (stepKey === "decision_prise") {
        if (isCurrent) {
          add(
            code.includes("decret") || normalizeTabText(dossierStatus).startsWith("decret")
              ? dossierStatus
              : stripStatusPrefix(dossierStatus),
            "status-card"
          );
          add(statusDate ? `(${daysAgo(statusDate)})` : "", "status-time");
        }
        if (decretId) {
          details.push({
            text: `Décret de Naturalisation\nN° ${decretId}`,
            variant: "decret-card",
          });
          details.push({
            text: "LégiFrance",
            variant: "link",
            href: "https://www.legifrance.gouv.fr/search/all?tab_selection=all&searchField=ALL&query=nationalit%C3%A9+fran%C3%A7aise&page=1&init=true",
          });
        }
      }

      if (!details.length && isCurrent && !isPending) {
        add(getRecreatedStepDetail(stepKey, index, currentIndex), "status");
      }

      return details;
    }

    function appendRecreatedStepSubdetails(item, stepKey, index, currentIndex) {
      const details = getRecreatedStepSubdetails(stepKey, index, currentIndex);
      if (!details.length) return;

      const wrapper = document.createElement("div");
      wrapper.className = "anf-recreated-step-details";
      details.forEach((detail) => {
        const element = detail.href ? document.createElement("a") : document.createElement("span");
        element.className = `anf-recreated-step-detail${
          detail.variant ? ` is-${detail.variant}` : ""
        }`;
        if (detail.variant === "masked" && detail.rawText) {
          element.classList.add("is-toggleable");
          const valueEl = document.createElement("span");
          valueEl.className = "anf-recreated-masked-value";
          valueEl.textContent = detail.text;
          element.appendChild(valueEl);

          let isHidden = true;
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "anf-recreated-eye";
          toggle.setAttribute("aria-label", "Afficher la préfecture");
          toggle.innerHTML = createEyeSvg(true);
          toggle.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            isHidden = !isHidden;
            valueEl.textContent = isHidden ? detail.text : detail.rawText;
            toggle.setAttribute(
              "aria-label",
              isHidden ? "Afficher la préfecture" : "Masquer la préfecture"
            );
            toggle.innerHTML = createEyeSvg(isHidden);
          });
          element.appendChild(toggle);
        } else {
          element.textContent = detail.text;
        }
        if (detail.href) {
          element.href = detail.href;
          element.target = "_blank";
          element.rel = "noopener noreferrer";
        }
        wrapper.appendChild(element);
      });

      item.appendChild(wrapper);
    }

    function createRequestSummaryCell(label, contentNodeOrText, isState = false) {
      const cell = document.createElement("div");
      cell.className = `anf-summary-cell${isState ? " is-state" : ""}`;

      const labelEl = document.createElement("div");
      labelEl.className = "anf-summary-label";
      labelEl.textContent = label;
      cell.appendChild(labelEl);

      const valueEl = document.createElement("div");
      valueEl.className = "anf-summary-value";
      if (contentNodeOrText instanceof Node) {
        valueEl.appendChild(contentNodeOrText);
      } else {
        valueEl.textContent = contentNodeOrText || "-";
      }
      cell.appendChild(valueEl);

      return cell;
    }

    function createRequestSummary() {
      const summary = document.createElement("section");
      summary.className = "anf-request-summary";

      const title = document.createElement("div");
      title.className = "anf-summary-title";
      title.textContent = "Suivi de ma demande :";
      summary.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "anf-summary-grid";

      grid.appendChild(
        createRequestSummaryCell("N° de la demande", createMaskableSummaryValue(requestNumber))
      );
      grid.appendChild(
        createRequestSummaryCell("Type de demande", "Accès à la Nationalité Française")
      );
      grid.appendChild(
        createRequestSummaryCell(
          "N° du timbre Fiscal",
          createMaskableSummaryValue(fiscalStampNumber)
        )
      );

      const state = document.createElement("span");
      state.className = "anf-summary-state";
      state.appendChild(createTextElement("span", "anf-summary-state-title", "Dernière sauvegarde :"));
      state.appendChild(
        createTextElement(
          "span",
          "anf-summary-state-date",
          `le ${formatDateTime(firstNonBlank(data?.dossier?.date_statut, demandeDate)) || "-"}`
        )
      );
      grid.appendChild(createRequestSummaryCell("État de la demande", state, true));

      summary.appendChild(grid);
      return summary;
    }

    function createRecreatedStepIcon(stepKey) {
      const iconByStep = {
        demande_envoyee: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M22 2 11 13"></path>
            <path d="m22 2-7 20-4-9-9-4 20-7Z"></path>
          </svg>
        `,
        examen_pieces: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M21 12a9 9 0 0 1-9 9 8.7 8.7 0 0 1-6-2.4"></path>
            <path d="M3 12a9 9 0 0 1 15-6.7"></path>
            <path d="M18 3v5h-5"></path>
            <path d="M6 21v-5h5"></path>
          </svg>
        `,
        demande_deposee: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1"></path>
            <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7H3"></path>
          </svg>
        `,
        traitement_plateforme_1: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            <path d="M15 5l4 4"></path>
          </svg>
        `,
        recepisse_completude: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path>
            <path d="M14 2v6h6"></path>
            <path d="M8 13h8"></path>
            <path d="M8 17h6"></path>
          </svg>
        `,
        traitement_plateforme_2: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            <path d="M15 5l4 4"></path>
          </svg>
        `,
        entretien_assimilation: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"></path>
            <path d="M8 9h8"></path>
            <path d="M8 13h5"></path>
          </svg>
        `,
        traitement_plateforme_3: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            <path d="M15 5l4 4"></path>
          </svg>
        `,
        traitement_sdanf_1: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            <path d="M15 5l4 4"></path>
          </svg>
        `,
        traitement_scec: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            <path d="M15 5l4 4"></path>
          </svg>
        `,
        traitement_sdanf_2: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            <path d="M15 5l4 4"></path>
          </svg>
        `,
        decision_prise: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"></path>
            <path d="m22 6-10 7L2 6"></path>
          </svg>
        `,
        ceremonie_naturalisation: `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
            <circle cx="8.5" cy="10" r="2"></circle>
            <path d="M6 16c.7-1.4 1.5-2 2.5-2s1.8.6 2.5 2"></path>
            <path d="M14 9h4"></path>
            <path d="M14 13h4"></path>
            <path d="M14 17h3"></path>
          </svg>
        `,
      };

      const icon = document.createElement("span");
      icon.className = "anf-recreated-icon";
      icon.innerHTML = iconByStep[stepKey] || iconByStep.traitement_plateforme_1;
      return icon;
    }

    function injectRecreatedTrackingCss() {
      const styleId = "anf-recreated-tracking-style";
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      styleEl.textContent = `
        #anf-recreated-tracking-root {
          box-sizing: border-box;
          width: 100%;
          padding: 0;
          margin: 0;
          font-family: inherit;
        }
        #anf-recreated-tracking-tab {
          cursor: pointer;
        }
        #anf-recreated-tracking-panel {
          box-sizing: border-box;
          width: min(1180px, calc(100% - 32px));
          margin: 18px auto;
          padding: 18px;
          border: 1px solid #d9e4f2;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 6px 22px rgba(15, 23, 42, 0.10);
          color: #1f2937;
          font-family: inherit;
        }
        #anf-recreated-tracking-panel[hidden] {
          display: none !important;
        }
        .anf-request-summary {
          margin: 0 0 22px;
          color: #1f2937;
          font-family: inherit;
        }
        .anf-summary-title {
          margin: 0 0 14px;
          color: #334155;
          font-size: 13px;
          font-weight: 800;
        }
        .anf-summary-grid {
          display: grid;
          grid-template-columns: 1.05fr 1.55fr 1.35fr 2fr;
          border-top: 2px solid #475569;
          border-bottom: 2px solid #475569;
        }
        .anf-summary-cell {
          min-width: 0;
          padding: 10px 16px 12px 0;
        }
        .anf-summary-label {
          min-height: 28px;
          border-bottom: 1px solid #64748b;
          color: #334155;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }
        .anf-summary-value {
          min-height: 58px;
          display: flex;
          align-items: center;
          color: #111827;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.45;
        }
        .anf-summary-cell.is-state .anf-summary-value {
          align-items: flex-start;
          padding-top: 10px;
          font-weight: 700;
        }
        .anf-summary-secret {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }
        .anf-summary-secret-value {
          letter-spacing: 1px;
          overflow-wrap: anywhere;
        }
        .anf-summary-eye {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 26px;
          width: 26px;
          height: 26px;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: #255a99;
          cursor: pointer;
          padding: 0;
        }
        .anf-summary-eye:hover {
          background: #eef6ff;
        }
        .anf-summary-eye svg {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .anf-summary-state {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .anf-summary-state-title,
        .anf-summary-state-date {
          display: block;
        }
        .anf-recreated-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }
        .anf-recreated-title {
          margin: 0 0 6px;
          color: #163f6d;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0;
        }
        .anf-recreated-subtitle {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.4;
        }
        .anf-recreated-current {
          min-width: 260px;
          padding: 12px 14px;
          border: 1px solid ${statusVisual.cardBorder};
          border-radius: 8px;
          background: ${statusVisual.cardBackground};
        }
        .anf-recreated-current-label {
          display: block;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .anf-recreated-current-value {
          display: block;
          margin-top: 4px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.35;
        }
        .anf-recreated-current-meta {
          display: block;
          margin-top: 4px;
          color: #475569;
          font-size: 12px;
          line-height: 1.35;
        }
        .anf-recreated-frise {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(150px, 178px);
          gap: 0;
          overflow-x: auto;
          overflow-y: hidden;
          list-style: none;
          margin: 0;
          padding: 6px 2px 12px;
          scroll-snap-type: x proximity;
        }
        .anf-recreated-step {
          position: relative;
          min-height: 258px;
          padding: 0 8px;
          border: 0;
          border-radius: 0;
          background: transparent;
          text-align: center;
          scroll-snap-align: start;
        }
        .anf-recreated-step::before {
          content: "";
          position: absolute;
          top: 69px;
          left: 50%;
          width: 100%;
          height: 1px;
          background: #c7cfdf;
          z-index: 0;
        }
        .anf-recreated-step:last-child::before {
          display: none;
        }
        .anf-recreated-step::after {
          content: "";
          position: absolute;
          top: 63px;
          left: 50%;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #c7cfdf;
          transform: translateX(-50%);
          z-index: 1;
        }
        .anf-recreated-step.is-done {
          background: transparent;
        }
        .anf-recreated-step.is-current {
          background: transparent;
          box-shadow: none;
        }
        .anf-recreated-step.is-pending {
          color: #64748b;
        }
        .anf-recreated-step.is-done::before,
        .anf-recreated-step.is-done::after {
          background: #09245a;
        }
        .anf-recreated-step.is-current::before,
        .anf-recreated-step.is-current::after {
          background: ${statusVisual.iconColor};
        }
        .anf-recreated-step-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          margin-bottom: 0;
        }
        .anf-recreated-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          flex: 0 0 44px;
          width: 44px;
          height: 44px;
          margin-bottom: 42px;
          border-radius: 50%;
          background: transparent;
          color: #09245a;
          box-shadow: none;
        }
        .anf-recreated-icon svg {
          display: block;
          width: 38px;
          height: 38px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .anf-recreated-step.is-done .anf-recreated-icon {
          background: transparent;
          color: #09245a;
        }
        .anf-recreated-step.is-current .anf-recreated-icon {
          background: transparent;
          color: ${statusVisual.iconColor};
        }
        .anf-recreated-step.is-pending .anf-recreated-icon {
          background: transparent;
          color: #6f7b9a;
        }
        .anf-recreated-step-index {
          display: none;
        }
        .anf-recreated-step-title {
          margin: 0;
          color: #09245a;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.32;
        }
        .anf-recreated-step-details {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          min-height: 30px;
        }
        .anf-recreated-step-detail {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: 100%;
          padding: 3px 8px;
          border-radius: 999px;
          background: #eef2f7;
          color: #334155;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.25;
          text-align: center;
          overflow-wrap: anywhere;
          white-space: normal;
        }
        .anf-recreated-step-detail.is-date {
          background: #f8fafc;
          color: #334155;
        }
        .anf-recreated-step-detail.is-masked {
          background: #f1f5f9;
          color: #475569;
          letter-spacing: 1px;
        }
        .anf-recreated-step-detail.is-toggleable {
          gap: 6px;
          padding-right: 4px;
        }
        .anf-recreated-masked-value {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .anf-recreated-eye {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 22px;
          width: 22px;
          height: 22px;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: #255a99;
          cursor: pointer;
          padding: 0;
        }
        .anf-recreated-eye:hover {
          background: #e0ebf8;
        }
        .anf-recreated-eye svg {
          width: 17px;
          height: 17px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .anf-recreated-step-detail.is-status {
          background: #ffffff;
          color: #334155;
          border: 1px solid #d9e4f2;
          border-radius: 8px;
          padding: 5px 8px;
        }
        .anf-recreated-step-detail.is-status-card {
          width: 100%;
          min-height: 70px;
          padding: 10px 8px;
          border: 2px solid ${statusVisual.cardBorder};
          border-radius: 8px;
          background: #ffffff;
          color: #334155;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.16);
          font-size: 13px;
          line-height: 1.55;
          white-space: normal;
        }
        .anf-recreated-step-detail.is-status-time {
          background: transparent;
          color: #9f1239;
          font-size: 12px;
          padding: 0;
        }
        .anf-recreated-step-detail.is-decret-card {
          width: 100%;
          min-height: 74px;
          padding: 10px 8px;
          border: 1px solid #8fd4a5;
          border-radius: 8px;
          background: linear-gradient(165deg, #dff7e7, #f7fff9);
          color: #166534;
          box-shadow: 0 6px 14px rgba(22, 101, 52, 0.16);
          font-size: 13px;
          line-height: 1.55;
          white-space: pre-line;
        }
        .anf-recreated-step-detail.is-link {
          background: transparent;
          color: #255a99;
          padding: 0;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
        }
        .anf-recreated-step-detail.is-link:hover {
          text-decoration: underline;
        }
        .anf-recreated-step-desc {
          display: none;
        }
        .anf-recreated-badge {
          display: none;
        }
        .anf-recreated-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
        }
        .anf-recreated-actions a {
          color: #255a99;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }
        .anf-recreated-actions a:hover {
          text-decoration: underline;
        }
        @media (max-width: 900px) {
          #anf-recreated-tracking-panel {
            width: calc(100% - 20px);
            margin: 12px auto;
            padding: 14px;
          }
          .anf-recreated-header {
            flex-direction: column;
          }
          .anf-summary-grid {
            grid-template-columns: 1fr 1fr;
          }
          .anf-recreated-current {
            width: 100%;
            min-width: 0;
          }
          .anf-recreated-frise {
            grid-auto-columns: minmax(150px, 50vw);
          }
        }
        @media (max-width: 560px) {
          .anf-summary-grid {
            grid-template-columns: 1fr;
          }
          .anf-summary-cell {
            padding-right: 0;
          }
          .anf-recreated-frise {
            grid-auto-columns: minmax(150px, 68vw);
          }
        }
      `;
    }

    function createTextElement(tagName, className, text) {
      const element = document.createElement(tagName);
      if (className) element.className = className;
      element.textContent = text;
      return element;
    }

    function findTrackingInsertTarget() {
      const tabList = findNativeTabList();
      const root = ensureTrackingRoot();
      return {
        tabList,
        panelAfter: root,
      };
    }

    function ensureRecreatedTrackingTab(insertTarget, panel) {
      let tabList = insertTarget.tabList;
      const root = ensureTrackingRoot();
      if (!tabList || !root) return false;
      if (panel.parentNode !== root) {
        root.appendChild(panel);
      }

      const trackingTab = getOrCreateTrackingTab(tabList);
      bindTrackingTabOpenHandler(trackingTab, tabList, panel);

      insertTrackingTabIntoNativeList(tabList, trackingTab);
      bindNativeTabCloseHandlers(tabList);

      return true;
    }

    function renderRecreatedTrackingTab() {
      injectRecreatedTrackingCss();

      let panel = document.getElementById("anf-recreated-tracking-panel");
      const wasVisible = panel?.hidden === false;
      const insertTarget = findTrackingInsertTarget();
      if (!insertTarget.tabList || !insertTarget.panelAfter) return false;
      if (!panel) {
        panel = document.createElement("section");
        panel.id = "anf-recreated-tracking-panel";
        panel.setAttribute("role", "tabpanel");

        insertTarget.panelAfter.appendChild(panel);
      }

      panel.innerHTML = "";
      delete panel.dataset.anfLoading;
      if (!ensureRecreatedTrackingTab(insertTarget, panel)) return false;

      const inferredIndex = inferRecreatedTrackingIndex(dossierStatusCode);
      const currentIndex = Math.min(
        recreatedTrackingSteps.length - 1,
        decretId ? Math.max(inferredIndex, 11) : inferredIndex
      );
      panel.appendChild(createRequestSummary());

      const header = document.createElement("div");
      header.className = "anf-recreated-header";

      const headingBlock = document.createElement("div");
      headingBlock.appendChild(
        createTextElement("h2", "anf-recreated-title", "Demande d'accès à la Nationalité Française")
      );
      headingBlock.appendChild(
        createTextElement(
          "p",
          "anf-recreated-subtitle",
          "Parcours du dossier depuis le dépôt jusqu'à la décision finale."
        )
      );
      header.appendChild(headingBlock);

      const currentCard = document.createElement("div");
      currentCard.className = "anf-recreated-current";
      currentCard.appendChild(
        createTextElement("span", "anf-recreated-current-label", "Statut actuel")
      );
      currentCard.appendChild(
        createTextElement("span", "anf-recreated-current-value", dossierStatus)
      );
      currentCard.appendChild(
        createTextElement(
          "span",
          "anf-recreated-current-meta",
          joinNonBlank(
            dossierStatusCode,
            data?.dossier?.date_statut ? `depuis le ${formatDate(data.dossier.date_statut)}` : ""
          )
        )
      );
      header.appendChild(currentCard);
      panel.appendChild(header);

      const list = document.createElement("ol");
      list.className = "anf-recreated-frise";

      recreatedTrackingSteps.forEach((step, index) => {
        const item = document.createElement("li");
        item.className = "anf-recreated-step";
        if (index < currentIndex) item.classList.add("is-done");
        if (index === currentIndex) item.classList.add("is-current");
        if (index > currentIndex) item.classList.add("is-pending");

        const top = document.createElement("div");
        top.className = "anf-recreated-step-top";

        const icon = createRecreatedStepIcon(step.key);
        top.appendChild(icon);

        const titleWrap = document.createElement("div");
        titleWrap.appendChild(
          createTextElement("div", "anf-recreated-step-index", `Etape ${index + 1}`)
        );
        titleWrap.appendChild(
          createTextElement("h3", "anf-recreated-step-title", step.title)
        );
        top.appendChild(titleWrap);

        item.appendChild(top);
        appendRecreatedStepSubdetails(item, step.key, index, currentIndex);
        item.appendChild(
          createTextElement("p", "anf-recreated-step-desc", step.description)
        );
        item.appendChild(
          createTextElement(
            "span",
            "anf-recreated-badge",
            index < currentIndex ? "Terminee" : index === currentIndex ? "Etape actuelle" : "A venir"
          )
        );

        list.appendChild(item);
      });

      panel.appendChild(list);

      const actions = document.createElement("div");
      actions.className = "anf-recreated-actions";

      if (decretId || currentIndex === recreatedTrackingSteps.length - 1) {
        const legifrance = document.createElement("a");
        legifrance.href =
          "https://www.legifrance.gouv.fr/search/all?tab_selection=all&searchField=ALL&query=nationalit%C3%A9+fran%C3%A7aise&page=1&init=true";
        legifrance.target = "_blank";
        legifrance.rel = "noopener noreferrer";
        legifrance.textContent = "Rechercher sur LegiFrance";
        actions.appendChild(legifrance);
      }

      if (actions.children.length) panel.appendChild(actions);
      panel.hidden = !wasVisible;
      markTrackingTabSelected(insertTarget.tabList, wasVisible);

      console.log(
        "Extension API Naturalisation : onglet de suivi reconstruit jusqu'a la derniere etape"
      );
      return true;
    }

    // Attendre l'élément actif au lieu de lancer une erreur s'il n'est pas trouvé
    const activeStep = hasNativeTrackingTab ? await waitForActiveStep() : null;
    trackingDataReady = true;
    renderRecreatedTrackingTab();
    if (!activeStep) {
      return;
    }

    // Trouver la classe CSS dynamique
    const dynamicClass = activeStep
      .getAttributeNames()
      .find((name) => name.startsWith("_ngcontent-"));

    // Ajouter la date de demande envoyée au libellé s'il existe
    async function addDemandeEnvoyeeDateIfPresent() {
      if (!demandeDate) return;
      const maxTries = 20;
      for (let i = 0; i < maxTries; i++) {
        const pEl = Array.from(document.querySelectorAll("p")).find(
          (el) =>
            el.textContent &&
            (el.textContent.trim().toLowerCase() === "demande envoyée" || el.textContent.trim().toLowerCase() === "dossier déposé")
        );
        if (pEl) {
          if (!pEl.querySelector(".anf-demande-date")) {
            const span = document.createElement("span");
            if (dynamicClass) span.setAttribute(dynamicClass, "");
            span.className = "anf-step-info anf-demande-date";
            span.innerHTML = `${formatDate(demandeDate)} <span class="secondary-text">(${daysAgo(demandeDate)})</span>`;
            pEl.appendChild(span);
          }
          break;
        }
        await new Promise((r) => setTimeout(r, CONFIG.WAIT_TIME));
      }
    }

    // Ajouter la date de demande de complément d'instruction au libellé s'il existe
    async function addComplementInstructionDateIfPresent() {
      if (!complementInstructionDate) return;
      const maxTries = 20;
      for (let i = 0; i < maxTries; i++) {
        const pEl = Array.from(document.querySelectorAll("p")).find(
          (el) =>
            el.textContent &&
            el.textContent.trim().toLowerCase() === "examen des pièces en cours"
        );
        if (pEl) {
          if (!pEl.querySelector(".anf-complement-date")) {
            const span = document.createElement("span");
            if (dynamicClass) span.setAttribute(dynamicClass, "");
            span.className = "anf-step-info anf-complement-date";
            span.innerHTML = `Complément demandé le ${formatDate(complementInstructionDate)}`;
            pEl.appendChild(document.createElement("br"));
            pEl.appendChild(span);
          }
          break;
        }
        await new Promise((r) => setTimeout(r, CONFIG.WAIT_TIME));
      }
    }

    // Ajouter la date d'entretien d'assimilation au libellé s'il existe
    async function addAssimilationDateIfPresent() {
      if (!assimilationDate) return;
      const maxTries = 20;
      for (let i = 0; i < maxTries; i++) {
        const pEl = Array.from(document.querySelectorAll("p")).find(
          (el) =>
            el.textContent &&
            el.textContent.trim().toLowerCase() === "entretien d'assimilation"
        );
        if (pEl) {
          if (!pEl.querySelector(".anf-assim-date")) {
            const span = document.createElement("span");
            if (dynamicClass) span.setAttribute(dynamicClass, "");
            span.className = "anf-step-info anf-assim-date";
            
            span.innerHTML = `${formatDate(assimilationDate)}`;
            pEl.appendChild(span);

            if (assimilationPlateforme) {
              pEl.appendChild(document.createElement("br"));
              const pSpan = document.createElement("span");
              if (dynamicClass) pSpan.setAttribute(dynamicClass, "");
              pSpan.className = "anf-step-info";
              pSpan.style.marginTop = "4px";
              pSpan.style.cursor = "pointer";
              
              const tSpan = document.createElement("span");
              const hiddenText = "  " + "*".repeat(12);
              tSpan.textContent = hiddenText;
              pSpan.appendChild(tSpan);
              
              let hidden = true;
              pSpan.onclick = function(e){
                  e.stopPropagation();
                  hidden = !hidden;
                  if(hidden){
                      tSpan.textContent = hiddenText;
                  } else {
                      tSpan.textContent = "  " + assimilationPlateforme;
                  }
              };
              pEl.appendChild(pSpan);
            }
          }
          break;
        }
        await new Promise((r) => setTimeout(r, CONFIG.WAIT_TIME));
      }
    }

    // Ajouter la date de réception du récépissé de complétude au libellé s'il existe
    async function addRecepisseCompletuDateIfPresent() {
      if (!recepisseCreated) return;
      const maxTries = 20;
      for (let i = 0; i < maxTries; i++) {
        const pEl = Array.from(document.querySelectorAll("p")).find(
          (el) =>
            el.textContent &&
            el.textContent.trim().toLowerCase() ===
              "réception du récépissé de complétude"
        );
        if (pEl) {
          if (!pEl.querySelector(".anf-recepisse-date")) {
            const span = document.createElement("span");
            if (dynamicClass) span.setAttribute(dynamicClass, "");
            span.className = "anf-step-info anf-recepisse-date";
            span.innerHTML = `${formatDate(recepisseCreated)}`;
            pEl.appendChild(span);
          }
          break;
        }
        await new Promise((r) => setTimeout(r, CONFIG.WAIT_TIME));
      }
    }

    // Ajouter la date du statut au step actif
    function addActiveStepDateTag() {
      const statutDate = data?.dossier?.date_statut;
      if (!activeStep || !statutDate) return;
      const p = activeStep.querySelector("p");
      if (!p) return;
      if (p.querySelector(".anf-active-date")) return;
      const span = document.createElement("span");
      if (dynamicClass) span.setAttribute(dynamicClass, "");
      span.className = "anf-step-info anf-active-date";
      span.innerHTML = `${formatDate(statutDate)}`;
      p.appendChild(span);
    }

    // Création du nouvel élément avec le style et le format spécifiés
    const newElement = document.createElement("li");
    newElement.setAttribute(dynamicClass, "");
    newElement.className = "itemFrise active ng-star-inserted";
    newElement.style.background = statusVisual.cardBackground;
    newElement.style.border = `2px solid ${statusVisual.cardBorder}`;
    newElement.style.borderRadius = "8px";
    newElement.style.boxShadow = "inset 2px 2px 5px rgba(0, 0, 0, 0.2), 5px 5px 15px rgba(0, 0, 0, 0.3)";
    // Get version for display
    const versionText = `v${extensionVersion}`;

    // Inject or update CSS to handle hover display for long statut code
    const styleId = "anf-status-style";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .itemFriseContent .anf-status-footer { position: absolute; bottom: 2px; left: 6px; right: 6px; font-size: 10px; color: #666; display: flex; justify-content: flex-end; }
      .itemFriseContent .anf-status-date { white-space: nowrap; }
      .itemFriseContent .anf-code-popup { position: absolute; top: calc(100% + 5px); left: 50%; background: #ffffff; color: #333; border: 1px solid #255a99; border-radius: 6px; padding: 6px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-size: 11px; font-family: inherit; line-height: 1.3; font-weight: inherit; opacity: 0; visibility: hidden; transform: translate(-50%, 4px); transition: opacity .15s ease, transform .15s ease, visibility 0s linear .15s; z-index: 1000; display: inline-block; white-space: nowrap; width: max-content; }
      .itemFriseContent:hover .anf-code-popup { opacity: 1; visibility: visible; transform: translate(-50%, 0); transition: opacity .15s ease, transform .15s ease; }
      .itemFriseContent .anf-main-status-icon {
        font-size: 15px;
        padding: 7px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
      .itemFriseContent .anf-status-title {
        font-weight: 700;
      }
      .itemFriseContent .anf-status-phase {
        display: inline-block;
        margin-left: 6px;
        padding: 1px 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }
      
      /* New badge styles for dates and info */
      .anf-step-info {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;       /* Allow inner content to wrap */
        gap: 5px;
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px; /* Pill shape */
        padding: 2px 10px;
        margin: 2px 0 2px 6px; /* Vertical spacing for wrapping */
        font-size: 11px;
        color: #475569; /* Slate 600 */
        font-weight: 600;
        vertical-align: middle;
        white-space: normal;   /* Allow text to wrap */
        line-height: 1.4;      /* Better line height for wrapped text */
        max-width: 98%;        /* Prevent overflow */
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        transition: all 0.2s ease;
      }
      .anf-step-info:hover {
        background-color: #f1f5f9;
        border-color: #cbd5e1;
      }
      .anf-step-info i {
        color: #255a99; /* Primary Blue */
        font-size: 12px;
      }
      .anf-step-info.warning {
        background-color: #fff7ed; /* Orange 50 */
        border-color: #ffedd5;
        color: #c2410c; /* Orange 700 */
      }
      .anf-step-info.warning i {
        color: #ea580c; /* Orange 600 */
      }
      .anf-step-info .secondary-text {
        color: #94a3b8; /* Slate 400 */
        font-size: 10px;
        font-weight: 400;
        margin-left: 2px;
      }
    `;

    newElement.innerHTML = `
      <div ${dynamicClass} class="itemFriseContent" style="position: relative;">
        <span ${dynamicClass} style="position: absolute; top: 1px; right: 3px; font-size: 8px; color: #aaa; opacity: 0.85;">${versionText}</span>
        <span ${dynamicClass} class="itemFriseIcon">
          <span ${dynamicClass} aria-hidden="true" class="fa ${statusVisual.iconClass} anf-main-status-icon" style="color: ${statusVisual.iconColor}!important;"></span>
        </span>
  <div ${dynamicClass} class="anf-code-popup">${dossierStatusCode} <br/> depuis le <i>${formatDate(
      data?.dossier?.date_statut
    )}</i></div>
        <p ${dynamicClass}>
          <span class="anf-status-title">${dossierStatus}</span>
          <span class="anf-status-phase" style="background: ${statusVisual.badgeBackground}; color: ${statusVisual.badgeColor};">${statusVisual.phaseLabel}</span>
          <span style="color: #bf2626;">(${daysAgo(
      data?.dossier?.date_statut
    )})</span>
        </p>
      </div>
    `;

    activeStep.parentNode.insertBefore(newElement, activeStep.nextSibling);
    console.log(
      "Extension API Naturalisation  : Nouvel élément inséré avec le statut du dossier"
    );

    // Ajouter une étape pour le décret si disponible
    if (decretId) {
      const decretElement = document.createElement("li");
      decretElement.setAttribute(dynamicClass, "");
      decretElement.className = "itemFrise active ng-star-inserted";
      decretElement.style.background = "linear-gradient(165deg, #d4f4dd, #f0fff4)";
      decretElement.style.border = "2px solid #10b981";
      decretElement.style.borderRadius = "8px";
      decretElement.style.boxShadow = "inset 2px 2px 5px rgba(16, 185, 129, 0.2), 5px 5px 15px rgba(0, 0, 0, 0.3)";
      decretElement.style.marginLeft = "20px";

      decretElement.innerHTML = `
        <div ${dynamicClass} class="itemFriseContent" style="position: relative;">
          <span ${dynamicClass} style="position: absolute; top: 1px; right: 3px; font-size: 8px; color: #aaa; opacity: 0.85;">${versionText}</span>
          <span ${dynamicClass} class="itemFriseIcon">
            <span ${dynamicClass} aria-hidden="true" class="fa fa-gavel anf-main-status-icon" style="color: #19a53cff!important;"></span>
          </span>
          <p ${dynamicClass}>
            <span class="anf-status-title">Décret de Naturalisation</span>
            <span class="anf-status-phase" style="background: #dcfce7; color: #166534;">Publication</span>
            <span style="color: #bf2626;">N° ${decretId}</span>
            <br/>
            <a href="https://www.legifrance.gouv.fr/search/all?tab_selection=all&searchField=ALL&query=nationalit%C3%A9+fran%C3%A7aise&page=1&init=true" target="_blank" style="color: #255a99; text-decoration: none; font-size: 11px;">
              <i class="fa fa-search" aria-hidden="true"></i> LégiFrance
            </a>
          </p>
        </div>
      `;
      
      newElement.parentNode.insertBefore(decretElement, newElement.nextSibling);
      console.log(
        "Extension API Naturalisation  : Élément décret inséré avec l'ID: " + decretId
      );
    }

    // Fonction pour masquer/afficher le numéro de série
    async function addSeriesVisibilityToggle() {
      const maxTries = 20;
      for (let i = 0; i < maxTries; i++) {
        const tds = Array.from(document.querySelectorAll('td.fixed'));
        const seriesTd = tds.find(td => /^\d{4}X\s\d+$/.test(td.textContent.trim()));

        if (seriesTd) {
            if (seriesTd.querySelector('.anf-toggle-serie')) return;

            const fullSerie = seriesTd.textContent.trim();
            const parts = fullSerie.split(' ');
            if (parts.length !== 2) return;

            const prefix = parts[0];
            const suffix = parts[1];
            const maskedSuffix = '*'.repeat(suffix.length);
            
            let isHidden = true;

            seriesTd.textContent = '';
            
            const textSpan = document.createElement('span');
            textSpan.textContent = `${prefix} ${maskedSuffix}`;
            seriesTd.appendChild(textSpan);

            const icon = document.createElement('i');
            icon.className = 'fa fa-eye-slash anf-toggle-serie';
            icon.style.marginLeft = '8px';
            icon.style.cursor = 'pointer';
            icon.style.color = '#255a99';
            
            icon.onclick = function(e) {
                e.stopPropagation();
                isHidden = !isHidden;
                if (isHidden) {
                    textSpan.textContent = `${prefix} ${maskedSuffix}`;
                    icon.className = 'fa fa-eye-slash anf-toggle-serie';
                } else {
                    textSpan.textContent = `${prefix} ${suffix}`;
                    icon.className = 'fa fa-eye anf-toggle-serie';
                }
            };

            seriesTd.appendChild(icon);
            break;
        }
        await new Promise((r) => setTimeout(r, CONFIG.WAIT_TIME));
      }
    }

    // Fonction pour masquer/afficher le numéro de timbre fiscal
    async function addFiscalStampVisibilityToggle() {
      const maxTries = 20;
      for (let i = 0; i < maxTries; i++) {
        const tds = Array.from(document.querySelectorAll('td.fixed'));
        // Fiscal stamp is usually a 16 digit number
        const fiscalTd = tds.find(td => /^\d{16}$/.test(td.textContent.trim()));

        if (fiscalTd) {
            if (fiscalTd.querySelector('.anf-toggle-fiscal')) return;

            const fullStamp = fiscalTd.textContent.trim();
            const maskedStamp = '*'.repeat(fullStamp.length);
            
            let isHidden = true;

            fiscalTd.textContent = '';
            
            const textSpan = document.createElement('span');
            textSpan.textContent = maskedStamp;
            fiscalTd.appendChild(textSpan);

            const icon = document.createElement('i');
            icon.className = 'fa fa-eye-slash anf-toggle-fiscal';
            icon.style.marginLeft = '8px';
            icon.style.cursor = 'pointer';
            icon.style.color = '#255a99';
            
            icon.onclick = function(e) {
                e.stopPropagation();
                isHidden = !isHidden;
                if (isHidden) {
                    textSpan.textContent = maskedStamp;
                    icon.className = 'fa fa-eye-slash anf-toggle-fiscal';
                } else {
                    textSpan.textContent = fullStamp;
                    icon.className = 'fa fa-eye anf-toggle-fiscal';
                }
            };

            fiscalTd.appendChild(icon);
            break;
        }
        await new Promise((r) => setTimeout(r, CONFIG.WAIT_TIME));
      }
    }

    // Ajouter la date de demande envoyée si disponible
    addDemandeEnvoyeeDateIfPresent();
    // Ajouter la date de demande de complément d'instruction si disponible
    addComplementInstructionDateIfPresent();
    // Ajouter la date d'entretien d'assimilation si disponible
    addAssimilationDateIfPresent();
    // Ajouter la date de récépissé de complétude si disponible
    addRecepisseCompletuDateIfPresent();
    // Ajouter la date au step actif
    addActiveStepDateTag();
    // Ajouter le toggle pour le numéro de série
    addSeriesVisibilityToggle();
    // Ajouter le toggle pour le numéro de timbre fiscal
    addFiscalStampVisibilityToggle();
  } catch (error) {
    const loadingPanel = document.getElementById("anf-recreated-tracking-panel");
    if (loadingPanel?.dataset?.anfLoading) {
      loadingPanel.innerHTML =
        '<p class="anf-tracking-loading">Suivi indisponible pour le moment. La page ANEF est peut-etre encore en cours de chargement.</p>';
    }
    console.log(
      "Extension API Naturalisation : Erreur d'initialisation:",
      error
    );
  }
})();
