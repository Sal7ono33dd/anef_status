(function () {
  const STORAGE_KEYS = [
    "autoLoginEnabled",
    "envFranceConnectFiscalNumber",
    "envFranceConnectPassword",
    "lastAutoLoginAttemptAt",
    "lastAutoLoginStatus",
  ];
  const MAX_RUN_MS = 90000;
  const ATTEMPT_VALID_WINDOW_MS = 20 * 60 * 1000;
  const TICK_MS = 1200;
  const emitted = new Set();

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function notify(status, step, extra) {
    const error = String(extra?.error || "");
    const key = `${status}|${step}|${error}`;
    if (emitted.has(key)) return;
    emitted.add(key);

    chrome.runtime.sendMessage(
      {
        type: "ANF_AUTO_LOGIN_STATUS",
        payload: {
          status,
          step,
          error,
          url: location.href,
        },
      },
      function () {
        void chrome.runtime.lastError;
      }
    );
  }

  function dispatchInputEvents(input) {
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setInputValue(input, value) {
    if (!input) return false;
    input.focus();
    input.value = "";
    dispatchInputEvents(input);
    input.value = value;
    dispatchInputEvents(input);
    return true;
  }

  function safeClick(element) {
    if (!element) return false;
    try {
      element.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
    } catch (_error) {
      // ignore
    }

    ["mouseover", "mousedown", "mouseup", "click"].forEach((type) => {
      try {
        element.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
      } catch (_error) {
        // ignore
      }
    });

    try {
      element.click();
    } catch (_error) {
      // ignore
    }
    return true;
  }

  function findClickableByText(patterns) {
    const candidates = document.querySelectorAll(
      "a, button, [role='button'], input[type='submit'], input[type='button']"
    );

    for (const node of candidates) {
      const text = normalizeText(
        node.textContent || node.value || node.getAttribute("aria-label")
      );
      if (!text) continue;
      if (patterns.some((p) => text.includes(p))) {
        return node;
      }
    }
    return null;
  }

  function handleAnefStep() {
    const directLogin =
      document.querySelector('a[href*="authentification"]') ||
      document.querySelector('a[href*="openid-connect/auth"]') ||
      document.querySelector('a[href*="sso.anef.dgef.interieur.gouv.fr"]');

    if (safeClick(directLogin)) {
      notify("progress", "anef_click_se_connecter");
      return true;
    }

    const byText = findClickableByText([
      "se connecter",
      "connexion",
      "s'identifier",
      "m'identifier",
    ]);

    if (safeClick(byText)) {
      notify("progress", "anef_click_login");
      return true;
    }

    return false;
  }

  function handleSsoStep() {
    const directFranceConnect =
      document.querySelector("#social-franceconnect") ||
      document.querySelector('a[href*="franceconnect"]') ||
      document.querySelector('a[id*="franceconnect"]') ||
      document.querySelector('button[id*="franceconnect"]') ||
      document.querySelector('button[name*="franceconnect"]');

    if (safeClick(directFranceConnect)) {
      notify("progress", "sso_click_franceconnect");
      return true;
    }

    const byText = findClickableByText([
      "franceconnect",
      "france connect",
      "s'identifier avec franceconnect",
      "s'identifier avec france connect",
    ]);

    if (safeClick(byText)) {
      notify("progress", "sso_click_franceconnect_text");
      return true;
    }

    return false;
  }

  function handleFranceConnectStep() {
    const direct =
      document.querySelector('a[href*="impots"]') ||
      document.querySelector('a[href*="dgfip"]') ||
      document.querySelector('button[data-provider*="impots"]') ||
      document.querySelector('[data-testid*="impots"]');

    if (safeClick(direct)) {
      notify("progress", "franceconnect_select_impots");
      return true;
    }

    const byText = findClickableByText([
      "impots.gouv",
      "impots",
      "dgfip",
      "identifiez-vous avec impots",
    ]);

    if (safeClick(byText)) {
      notify("progress", "franceconnect_select_impots_text");
      return true;
    }

    return false;
  }

  function handleImpotsStep(credentials) {
    const spiInput =
      document.querySelector('input[name="spi"]') ||
      document.querySelector("#spi") ||
      document.querySelector('input[id*="spi"]') ||
      document.querySelector('input[autocomplete="username"]');

    const pwdInput =
      document.querySelector('input[name="pwd"]') ||
      document.querySelector("#pwd") ||
      document.querySelector('input[type="password"]');

    const submitButton =
      document.querySelector("#btnAction") ||
      document.querySelector('button[type="submit"]') ||
      document.querySelector('input[type="submit"]');

    const continueButton =
      document.querySelector("#btnAction") ||
      findClickableByText(["continuer", "continue", "suivant"]);

    const loginButton =
      document.querySelector("#btnAction") ||
      findClickableByText(["se connecter", "connexion", "valider", "connecter"]);

    let filledSomething = false;

    if (spiInput && credentials.fiscalNumber) {
      if (String(spiInput.value || "").trim() !== credentials.fiscalNumber) {
        filledSomething = setInputValue(spiInput, credentials.fiscalNumber) || filledSomething;
      }
    }

    if (pwdInput && credentials.password) {
      if (String(pwdInput.value || "") !== credentials.password) {
        filledSomething = setInputValue(pwdInput, credentials.password) || filledSomething;
      }
    }

    if (filledSomething) {
      notify("progress", "impots_fill_credentials");
    }

    if (spiInput && !pwdInput) {
      if (continueButton) {
        safeClick(continueButton);
        notify("submitted", "impots_submit_spi_continue");
        return true;
      }
      return filledSomething;
    }

    if (pwdInput && !spiInput) {
      if (loginButton) {
        safeClick(loginButton);
        notify("submitted", "impots_submit_password_login");
        return true;
      }
      return filledSomething;
    }

    const hasCreds =
      Boolean(spiInput?.value) &&
      Boolean(pwdInput?.value) &&
      normalizeText(spiInput.value).length > 0 &&
      String(pwdInput.value || "").length > 0;

    if (hasCreds && submitButton) {
      safeClick(submitButton);
      notify("submitted", "impots_submit_login");
      return true;
    }

    return filledSomething;
  }

  async function bootstrap() {
    const config = await chrome.storage.local.get(STORAGE_KEYS);

    if (config.autoLoginEnabled === false) {
      notify("failed", "auto_login_disabled", { error: "Auto login disabled." });
      return;
    }

    const fiscalNumber = String(config.envFranceConnectFiscalNumber || "").trim();
    const password = String(config.envFranceConnectPassword || "");

    if (!fiscalNumber || !password) {
      notify("failed", "missing_env", {
        error: "envFranceConnectFiscalNumber/envFranceConnectPassword missing",
      });
      return;
    }

    const lastAttemptStatus = String(config.lastAutoLoginStatus || "").toLowerCase();
    const lastAttemptMs = new Date(config.lastAutoLoginAttemptAt || "").getTime();
    const isRecentAttempt =
      !Number.isNaN(lastAttemptMs) && Date.now() - lastAttemptMs <= ATTEMPT_VALID_WINDOW_MS;
    const isActiveAttempt =
      lastAttemptStatus === "started" ||
      lastAttemptStatus === "progress" ||
      lastAttemptStatus === "submitted";

    if (!isRecentAttempt || !isActiveAttempt) {
      return;
    }

    const credentials = { fiscalNumber, password };
    const startedAt = Date.now();

    const run = function () {
      if (Date.now() - startedAt > MAX_RUN_MS) {
        notify("failed", "timeout", { error: "Auto login timeout" });
        return;
      }

      try {
        const host = location.hostname.toLowerCase();

        if (host.includes("administration-etrangers-en-france.interieur.gouv.fr")) {
          const done = handleAnefStep();
          if (done) {
            setTimeout(run, TICK_MS);
            return;
          }
        }

        if (host.includes("sso.anef.dgef.interieur.gouv.fr")) {
          const done = handleSsoStep();
          if (done) {
            setTimeout(run, TICK_MS);
            return;
          }
        }

        if (host.includes("franceconnect")) {
          const done = handleFranceConnectStep();
          if (done) {
            setTimeout(run, TICK_MS);
            return;
          }
        }

        if (host.includes("impots.gouv.fr") || host.includes("dgfip")) {
          const done = handleImpotsStep(credentials);
          if (done) {
            setTimeout(run, TICK_MS);
            return;
          }
        }

        setTimeout(run, TICK_MS);
      } catch (error) {
        notify("failed", "exception", {
          error: error?.message || String(error),
        });
      }
    };

    notify("progress", "bootstrap");
    run();
  }

  bootstrap().catch((error) => {
    notify("failed", "bootstrap_error", {
      error: error?.message || String(error),
    });
  });
})();
