const TARGET_SELECTOR = "body > app-root > app-shell > mat-sidenav-container > mat-sidenav-content > app-header > div > mat-toolbar > div.toolbar-left > app-header-logo > img";
const HIDDEN_ATTR = "data-demo-hider-hidden";
const DISPLAY_VALUE_ATTR = "data-demo-hider-display";
const DISPLAY_PRIORITY_ATTR = "data-demo-hider-display-priority";

let enabled = false;
let observer;

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

function hideMatchingElements() {
  const elements = document.querySelectorAll(TARGET_SELECTOR);
  elements.forEach((element) => hideElement(element));
}

function restoreMatchingElements() {
  const elements = document.querySelectorAll(TARGET_SELECTOR);
  elements.forEach((element) => restoreElement(element));
}

function updateVisibility() {
  if (enabled) {
    hideMatchingElements();
  } else {
    restoreMatchingElements();
  }
}

function ensureObserver() {
  if (observer || !document.body) {
    return;
  }

  observer = new MutationObserver(() => {
    if (enabled) {
      hideMatchingElements();
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

