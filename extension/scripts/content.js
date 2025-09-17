const RETAILER_NAME = "Demo Retailer";
const LOGO_SELECTOR = "body > app-root > app-shell > mat-sidenav-container > mat-sidenav-content > app-header > div > mat-toolbar > div.toolbar-left > app-header-logo > img";
const ACCOUNT_NAME_SELECTORS = [
  '[data-test="headerAccountListButtonText"]',
  "span.cds-p1-bold"
];
const TITLE_SELECTOR = "title";
const TITLE_SEPARATOR = ":";
const ORIGINAL_TITLE_ATTR = "data-demo-hider-original-title";

const LOGO_WIDTH = 300;
const LOGO_HEIGHT = 100;
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" viewBox="0 0 ${LOGO_WIDTH} ${LOGO_HEIGHT}"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" fill="#FF6C00" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="600" dominant-baseline="middle" text-anchor="middle">${RETAILER_NAME}</text></svg>`;
const LOGO_DATA_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(LOGO_SVG)}`;
const CUSTOM_LOGO_ATTR = "data-demo-hider-custom-logo";
const ORIGINAL_TEXT_ATTR = "data-demo-hider-original-text";

const state = {
  logoEnabled: false,
  textEnabled: false
};
let observer;
let isInitialized = false;
const customLogos = new WeakMap();

function getAccountNameElements() {
  const elements = new Set();

  ACCOUNT_NAME_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      elements.add(element);
    });
  });

  return Array.from(elements);
}

function ensureCustomLogo(originalElement) {
  if (!originalElement) {
    return;
  }

  if (!customLogos.has(originalElement)) {
    const originalAttributes = {
      src: originalElement.getAttribute("src"),
      srcset: originalElement.getAttribute("srcset"),
      alt: originalElement.getAttribute("alt")
    };

    customLogos.set(originalElement, originalAttributes);
  }

  originalElement.setAttribute("src", LOGO_DATA_URL);
  originalElement.removeAttribute("srcset");
  originalElement.setAttribute("alt", RETAILER_NAME);
  originalElement.setAttribute(CUSTOM_LOGO_ATTR, "true");
}

function removeCustomLogo(originalElement) {
  const originalAttributes = customLogos.get(originalElement);
  if (!originalAttributes) {
    return;
  }

  if (originalAttributes.src !== null) {
    originalElement.setAttribute("src", originalAttributes.src);
  } else {
    originalElement.removeAttribute("src");
  }

  if (originalAttributes.srcset !== null && originalAttributes.srcset !== "") {
    originalElement.setAttribute("srcset", originalAttributes.srcset);
  } else {
    originalElement.removeAttribute("srcset");
  }

  if (originalAttributes.alt !== null) {
    originalElement.setAttribute("alt", originalAttributes.alt);
  } else {
    originalElement.removeAttribute("alt");
  }

  originalElement.removeAttribute(CUSTOM_LOGO_ATTR);
  customLogos.delete(originalElement);
}

function applyCustomAccountName(element) {
  if (!element) {
    return;
  }

  if (!element.hasAttribute(ORIGINAL_TEXT_ATTR)) {
    const originalText = element.textContent ?? "";
    element.setAttribute(ORIGINAL_TEXT_ATTR, originalText);
  }

  const currentText = element.textContent ?? "";
  if (currentText.trim() === RETAILER_NAME) {
    return;
  }

  element.textContent = RETAILER_NAME;
}

function restoreAccountName(element) {
  if (!element || !element.hasAttribute(ORIGINAL_TEXT_ATTR)) {
    return;
  }

  const originalText = element.getAttribute(ORIGINAL_TEXT_ATTR);
  element.textContent = originalText ?? "";
  element.removeAttribute(ORIGINAL_TEXT_ATTR);
}

function applyLogoCustomizations() {
  const logoElements = document.querySelectorAll(LOGO_SELECTOR);
  logoElements.forEach((element) => ensureCustomLogo(element));
}

function restoreLogoCustomizations() {
  const logoElements = document.querySelectorAll(LOGO_SELECTOR);
  logoElements.forEach((element) => removeCustomLogo(element));
}

function applyAccountNameCustomizations() {
  const accountNameElements = getAccountNameElements();
  accountNameElements.forEach((element) => applyCustomAccountName(element));
  applyTitleCustomization();
}

function restoreAccountNameCustomizations() {
  const accountNameElements = getAccountNameElements();
  accountNameElements.forEach((element) => restoreAccountName(element));
  restoreTitleCustomization();
}

function applyTitleCustomization() {
  const titleElement = document.querySelector(TITLE_SELECTOR);
  if (!titleElement) {
    return;
  }

  const currentText = titleElement.textContent ?? "";
  const colonIndex = currentText.indexOf(TITLE_SEPARATOR);

  if (colonIndex <= 0) {
    return;
  }

  const prefix = currentText.slice(0, colonIndex).trim();
  if (prefix === RETAILER_NAME) {
    return;
  }

  if (!titleElement.hasAttribute(ORIGINAL_TITLE_ATTR)) {
    titleElement.setAttribute(ORIGINAL_TITLE_ATTR, currentText);
  }

  const suffix = currentText.slice(colonIndex + TITLE_SEPARATOR.length);
  titleElement.textContent = `${RETAILER_NAME}${TITLE_SEPARATOR}${suffix}`;
}

function restoreTitleCustomization() {
  const titleElement = document.querySelector(TITLE_SELECTOR);
  if (!titleElement || !titleElement.hasAttribute(ORIGINAL_TITLE_ATTR)) {
    return;
  }

  const originalTitle = titleElement.getAttribute(ORIGINAL_TITLE_ATTR);
  titleElement.textContent = originalTitle ?? "";
  titleElement.removeAttribute(ORIGINAL_TITLE_ATTR);
}

function updateCustomizations() {
  if (state.logoEnabled) {
    applyLogoCustomizations();
  } else {
    restoreLogoCustomizations();
  }

  if (state.textEnabled) {
    applyAccountNameCustomizations();
  } else {
    restoreAccountNameCustomizations();
  }
}

function ensureObserver() {
  if (observer || !document.body) {
    return;
  }

  observer = new MutationObserver(() => {
    if (state.logoEnabled) {
      applyLogoCustomizations();
    }

    if (state.textEnabled) {
      applyAccountNameCustomizations();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function applyState(newState, forceUpdate = false) {
  const normalizedState = {
    logoEnabled: Boolean(newState.logoEnabled),
    textEnabled: Boolean(newState.textEnabled)
  };

  const hasChanged =
    normalizedState.logoEnabled !== state.logoEnabled ||
    normalizedState.textEnabled !== state.textEnabled;

  state.logoEnabled = normalizedState.logoEnabled;
  state.textEnabled = normalizedState.textEnabled;

  if (hasChanged || forceUpdate) {
    updateCustomizations();
  }
}

function setFeatureState(partial) {
  const newState = {
    logoEnabled: state.logoEnabled,
    textEnabled: state.textEnabled
  };

  const hasLogo = Object.prototype.hasOwnProperty.call(partial, "logoEnabled");
  const hasText = Object.prototype.hasOwnProperty.call(partial, "textEnabled");

  if (hasLogo) {
    newState.logoEnabled = Boolean(partial.logoEnabled);
  }

  if (hasText) {
    newState.textEnabled = Boolean(partial.textEnabled);
  }

  if (!hasLogo && !hasText && Object.prototype.hasOwnProperty.call(partial, "enabled")) {
    const boolValue = Boolean(partial.enabled);
    newState.logoEnabled = boolValue;
    newState.textEnabled = boolValue;
  }

  applyState(newState, !isInitialized);
  isInitialized = true;
}

function initialize() {
  ensureObserver();
  chrome.storage.sync.get(
    { logoEnabled: false, textEnabled: false, enabled: false },
    (result) => {
      setFeatureState(result);
    }
  );
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}

chrome.runtime.onMessage.addListener((message) => {
  if (
    message &&
    (Object.prototype.hasOwnProperty.call(message, "logoEnabled") ||
      Object.prototype.hasOwnProperty.call(message, "textEnabled") ||
      Object.prototype.hasOwnProperty.call(message, "enabled"))
  ) {
    setFeatureState(message);
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") {
    return;
  }

  const update = {};
  let hasUpdate = false;

  if (Object.prototype.hasOwnProperty.call(changes, "logoEnabled")) {
    update.logoEnabled = changes.logoEnabled.newValue;
    hasUpdate = true;
  }

  if (Object.prototype.hasOwnProperty.call(changes, "textEnabled")) {
    update.textEnabled = changes.textEnabled.newValue;
    hasUpdate = true;
  }

  if (!hasUpdate && Object.prototype.hasOwnProperty.call(changes, "enabled")) {
    update.enabled = changes.enabled.newValue;
    hasUpdate = true;
  }

  if (hasUpdate) {
    setFeatureState(update);
  }
});

