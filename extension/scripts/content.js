const LOGO_SELECTOR = "body > app-root > app-shell > mat-sidenav-container > mat-sidenav-content > app-header > div > mat-toolbar > div.toolbar-left > app-header-logo > img";
const ACCOUNT_NAME_SELECTOR = '[data-test="headerAccountListButtonText"]';

const HIDDEN_ATTR = "data-demo-hider-hidden";
const DISPLAY_VALUE_ATTR = "data-demo-hider-display";
const DISPLAY_PRIORITY_ATTR = "data-demo-hider-display-priority";
const ORIGINAL_TEXT_ATTR = "data-demo-hider-original-text";

const LOGO_WIDTH = 300;
const LOGO_HEIGHT = 100;
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" viewBox="0 0 ${LOGO_WIDTH} ${LOGO_HEIGHT}"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" fill="#FF6C00" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="600" dominant-baseline="middle" text-anchor="middle">Demo Retailer</text></svg>`;
const LOGO_DATA_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(LOGO_SVG)}`;
const CUSTOM_LOGO_ATTR = "data-demo-hider-custom-logo";

let enabled = false;
let observer;
const customLogos = new WeakMap();

function hideElement(element) {
  if (!element || element.hasAttribute(HIDDEN_ATTR)) {
    return;
  }

  const currentDisplay = element.style.getPropertyValue("display");
  const currentPriority = element.style.getPropertyPriority("display");

  if (currentDisplay) {
    element.setAttribute(DISPLAY_VALUE_ATTR, currentDisplay);
  } else {
    element.removeAttribute(DISPLAY_VALUE_ATTR);
  }

  if (currentPriority) {
    element.setAttribute(DISPLAY_PRIORITY_ATTR, currentPriority);
  } else {
    element.removeAttribute(DISPLAY_PRIORITY_ATTR);
  }

  element.setAttribute(HIDDEN_ATTR, "true");
  element.style.setProperty("display", "none", "important");
}

function restoreElement(element) {
  if (!element || !element.hasAttribute(HIDDEN_ATTR)) {
    return;
  }

  const originalDisplay = element.getAttribute(DISPLAY_VALUE_ATTR);
  const originalPriority = element.getAttribute(DISPLAY_PRIORITY_ATTR) || "";

  if (originalDisplay !== null && originalDisplay !== "") {
    element.style.setProperty("display", originalDisplay, originalPriority);
  } else {
    element.style.removeProperty("display");
  }

  element.removeAttribute(HIDDEN_ATTR);
  element.removeAttribute(DISPLAY_VALUE_ATTR);
  element.removeAttribute(DISPLAY_PRIORITY_ATTR);
}

function ensureCustomLogo(originalElement) {
  if (!originalElement) {
    return;
  }

  hideElement(originalElement);

  if (customLogos.has(originalElement)) {
    const placeholder = customLogos.get(originalElement);
    if (placeholder && !placeholder.isConnected && originalElement.parentNode) {
      originalElement.parentNode.insertBefore(placeholder, originalElement.nextSibling);
    }
    return;
  }

  if (!originalElement.parentNode) {
    return;
  }

  const placeholder = document.createElement("img");
  placeholder.src = LOGO_DATA_URL;
  placeholder.alt = "Demo Retailer";
  placeholder.width = LOGO_WIDTH;
  placeholder.height = LOGO_HEIGHT;
  placeholder.setAttribute(CUSTOM_LOGO_ATTR, "true");
  placeholder.style.setProperty("max-width", "100%");
  placeholder.style.setProperty("height", "auto");

  originalElement.parentNode.insertBefore(placeholder, originalElement.nextSibling);
  customLogos.set(originalElement, placeholder);
}

function removeCustomLogo(originalElement) {
  const placeholder = customLogos.get(originalElement);
  if (placeholder) {
    if (placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
    customLogos.delete(originalElement);
  }

  restoreElement(originalElement);
}

function applyCustomAccountName(element) {
  if (!element) {
    return;
  }

  if (!element.hasAttribute(ORIGINAL_TEXT_ATTR)) {
    const originalText = element.textContent ?? "";
    element.setAttribute(ORIGINAL_TEXT_ATTR, originalText);
  }

  element.textContent = "Demo Retailer";
}

function restoreAccountName(element) {
  if (!element || !element.hasAttribute(ORIGINAL_TEXT_ATTR)) {
    return;
  }

  const originalText = element.getAttribute(ORIGINAL_TEXT_ATTR);
  element.textContent = originalText ?? "";
  element.removeAttribute(ORIGINAL_TEXT_ATTR);
}

function applyCustomizations() {
  const logoElements = document.querySelectorAll(LOGO_SELECTOR);
  logoElements.forEach((element) => ensureCustomLogo(element));

  const accountNameElements = document.querySelectorAll(ACCOUNT_NAME_SELECTOR);
  accountNameElements.forEach((element) => applyCustomAccountName(element));
}

function restoreCustomizations() {
  const logoElements = document.querySelectorAll(LOGO_SELECTOR);
  logoElements.forEach((element) => removeCustomLogo(element));

  const accountNameElements = document.querySelectorAll(ACCOUNT_NAME_SELECTOR);
  accountNameElements.forEach((element) => restoreAccountName(element));
}

function updateVisibility() {
  if (enabled) {
    applyCustomizations();
  } else {
    restoreCustomizations();
  }
}

function ensureObserver() {
  if (observer || !document.body) {
    return;
  }

  observer = new MutationObserver(() => {
    if (enabled) {
      applyCustomizations();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function setEnabledState(newState) {
  enabled = Boolean(newState);
  updateVisibility();
}

function initialize() {
  ensureObserver();
  chrome.storage.sync.get({ enabled: false }, (result) => {
    setEnabledState(result.enabled);
  });
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}

chrome.runtime.onMessage.addListener((message) => {
  if (message && Object.prototype.hasOwnProperty.call(message, "enabled")) {
    setEnabledState(message.enabled);
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && Object.prototype.hasOwnProperty.call(changes, "enabled")) {
    setEnabledState(changes.enabled.newValue);
  }
});

