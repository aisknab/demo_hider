const RETAILER_NAME = "Demo Retailer";
const LOGO_SELECTOR = "body > app-root > app-shell > mat-sidenav-container > mat-sidenav-content > app-header > div > mat-toolbar > div.toolbar-left > app-header-logo > img";
const ACCOUNT_NAME_SELECTORS = [
  '[data-test="headerAccountListButtonText"]',
  "span.cds-p1-bold"
];
const RETAILER_COLUMN_CELL_SELECTOR = "[class*='column-retailers']";
const RETAILER_COLUMN_TEXT_SELECTOR =
  `${RETAILER_COLUMN_CELL_SELECTOR} .cds-display-block, ${RETAILER_COLUMN_CELL_SELECTOR} app-show-more-popover`;
const EXCLUDED_TEXT_PARENT_NODES = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE"
]);

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
let originalAccountName = null;
let originalAccountNamePriority = 0;
let originalAccountNameSource = null;
const replacedTextNodes = new Map();
const retailerCellOriginalContent = new Map();
const RETAILER_CELL_PROPERTY_NAMES = ["text", "tooltip", "value"];

function createRetailerCellSnapshot(element, originalText) {
  const attributes = {};
  Array.from(element.attributes).forEach((attribute) => {
    attributes[attribute.name] = attribute.value;
  });

  const properties = {};
  RETAILER_CELL_PROPERTY_NAMES.forEach((propertyName) => {
    const value = element[propertyName];
    if (typeof value === "string") {
      properties[propertyName] = value;
    }
  });

  return {
    html: element.innerHTML,
    attributes,
    properties,
    originalText: originalText ?? ""
  };
}

function restoreRetailerCellFromSnapshot(element, snapshot) {
  if (!element || !snapshot) {
    return;
  }

  if (typeof snapshot === "string") {
    element.innerHTML = snapshot;
    return;
  }

  element.innerHTML = snapshot.html ?? "";

  if (snapshot.attributes && typeof snapshot.attributes === "object") {
    Object.keys(snapshot.attributes).forEach((name) => {
      const value = snapshot.attributes[name];

      if (value === null || typeof value === "undefined") {
        element.removeAttribute(name);
      } else {
        element.setAttribute(name, value);
      }
    });
  }

  if (snapshot.properties && typeof snapshot.properties === "object") {
    Object.keys(snapshot.properties).forEach((propertyName) => {
      const value = snapshot.properties[propertyName];

      if (typeof value !== "string") {
        return;
      }

      try {
        element[propertyName] = value;
      } catch (error) {
        // Ignore read-only property assignments.
      }
    });
  }
}

function getRetailerTextVariants(value) {
  const variants = new Set();
  const normalized = typeof value === "string" ? value : "";

  if (normalized) {
    variants.add(normalized);
  }

  const trimmed = normalized.trim();

  if (trimmed && trimmed !== normalized) {
    variants.add(trimmed);
  }

  return Array.from(variants);
}

function replaceRetailerTextNodes(element, variants) {
  if (!element) {
    return false;
  }

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let replaced = false;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const originalValue = node.nodeValue ?? "";
    let updatedValue = originalValue;

    variants.forEach((variant) => {
      if (!variant || !updatedValue.includes(variant)) {
        return;
      }

      updatedValue = updatedValue.split(variant).join(RETAILER_NAME);
    });

    if (updatedValue !== originalValue) {
      node.nodeValue = updatedValue;
      replaced = true;
    }
  }

  return replaced;
}

function updateRetailerCellAttributes(element, variants) {
  Array.from(element.attributes).forEach((attribute) => {
    let updatedValue = attribute.value ?? "";

    variants.forEach((variant) => {
      if (!variant || !updatedValue.includes(variant)) {
        return;
      }

      updatedValue = updatedValue.split(variant).join(RETAILER_NAME);
    });

    if (updatedValue !== attribute.value) {
      element.setAttribute(attribute.name, updatedValue);
    }
  });
}

function updateRetailerCellProperties(element, variants) {
  RETAILER_CELL_PROPERTY_NAMES.forEach((propertyName) => {
    let value = element[propertyName];

    if (typeof value !== "string") {
      return;
    }

    variants.forEach((variant) => {
      if (!variant || !value.includes(variant)) {
        return;
      }

      value = value.split(variant).join(RETAILER_NAME);
    });

    if (value !== element[propertyName]) {
      try {
        element[propertyName] = value;
      } catch (error) {
        // Ignore read-only property assignments.
      }
    }
  });
}

function applyRetailerCellReplacement(element, originalText) {
  const variants = getRetailerTextVariants(originalText);

  let hasReplacedText = false;

  if (variants.length > 0) {
    hasReplacedText = replaceRetailerTextNodes(element, variants);
  }

  if (!hasReplacedText) {
    const currentText = element.textContent ?? "";

    if (currentText.trim() !== RETAILER_NAME) {
      element.textContent = RETAILER_NAME;
    }
  }

  if (variants.length === 0) {
    return;
  }

  updateRetailerCellAttributes(element, variants);
  updateRetailerCellProperties(element, variants);
}

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

  const currentText = element.textContent ?? "";
  const trimmedCurrent = currentText.trim();
  const storedOriginal = element.getAttribute(ORIGINAL_TEXT_ATTR);
  const trimmedStored = (storedOriginal ?? "").trim();
  const priority = getAccountNamePriority(element);

  if (
    trimmedCurrent &&
    trimmedCurrent !== RETAILER_NAME &&
    trimmedCurrent !== trimmedStored
  ) {
    element.setAttribute(ORIGINAL_TEXT_ATTR, currentText);
    setOriginalAccountName(currentText, element, priority);
  } else if (trimmedStored && trimmedStored !== RETAILER_NAME) {
    setOriginalAccountName(storedOriginal, element, priority);
  } else if (!element.hasAttribute(ORIGINAL_TEXT_ATTR)) {
    element.setAttribute(ORIGINAL_TEXT_ATTR, currentText);
  }

  if (trimmedCurrent === RETAILER_NAME) {
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

function getAccountNamePriority(element) {
  if (!element || typeof element.matches !== "function") {
    return 0;
  }

  if (element.matches(ACCOUNT_NAME_SELECTORS[0])) {
    return 2;
  }

  return 1;
}

function setOriginalAccountName(value, source, priority = 0) {
  const trimmed = (value ?? "").trim();

  if (!trimmed || trimmed === RETAILER_NAME) {
    return;
  }

  const root = document.documentElement;
  if (
    originalAccountNameSource &&
    root &&
    !root.contains(originalAccountNameSource)
  ) {
    originalAccountNameSource = null;
  }

  const normalizedPriority = Number.isFinite(priority) ? priority : 0;
  const isSameSource =
    source && originalAccountNameSource && source === originalAccountNameSource;
  const sourceIsUnset = originalAccountNameSource === null;

  const shouldUpdate =
    originalAccountName === null ||
    normalizedPriority > originalAccountNamePriority ||
    isSameSource ||
    (sourceIsUnset && normalizedPriority === originalAccountNamePriority);

  if (!shouldUpdate) {
    return;
  }

  if (originalAccountName && originalAccountName !== trimmed) {
    restoreGlobalAccountNameReplacements();
  }

  originalAccountName = trimmed;
  originalAccountNameSource = source ?? originalAccountNameSource;
  originalAccountNamePriority = normalizedPriority;
}

function replaceAccountNameInTextNodes() {
  if (!originalAccountName || originalAccountName === RETAILER_NAME) {
    return;
  }

  if (!document.documentElement) {
    return;
  }

  const walker = document.createTreeWalker(
    document.documentElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentNode;

        if (
          parent &&
          EXCLUDED_TEXT_PARENT_NODES.has(parent.nodeName)
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        const value = node.nodeValue;
        if (!value || !value.includes(originalAccountName)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodesToUpdate = [];
  while (walker.nextNode()) {
    nodesToUpdate.push(walker.currentNode);
  }

  nodesToUpdate.forEach((node) => {
    const value = node.nodeValue ?? "";
    if (!value.includes(originalAccountName)) {
      return;
    }

    if (!replacedTextNodes.has(node)) {
      replacedTextNodes.set(node, value);
    }

    node.nodeValue = value.split(originalAccountName).join(RETAILER_NAME);
  });
}

function applyRetailerCellCustomizations() {
  if (!document || typeof document.querySelectorAll !== "function") {
    return;
  }

  const retailerElements = document.querySelectorAll(
    RETAILER_COLUMN_TEXT_SELECTOR
  );

  retailerElements.forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const textContent = element.textContent ?? "";
    const trimmedText = textContent.trim();

    if (!trimmedText || trimmedText === RETAILER_NAME) {
      return;
    }

    if (trimmedText === "-") {
      return;
    }

    const currentHTML = element.innerHTML;
    const storedOriginal = retailerCellOriginalContent.get(element);

    if (
      !storedOriginal ||
      typeof storedOriginal !== "object" ||
      storedOriginal.html !== currentHTML ||
      storedOriginal.originalText !== trimmedText
    ) {
      retailerCellOriginalContent.set(
        element,
        createRetailerCellSnapshot(element, trimmedText)
      );
    }

    applyRetailerCellReplacement(element, trimmedText);
  });

  retailerCellOriginalContent.forEach((_, element) => {
    if (!element || !element.isConnected) {
      retailerCellOriginalContent.delete(element);
    }
  });
}

function restoreRetailerCellCustomizations() {
  retailerCellOriginalContent.forEach((snapshot, element) => {
    if (!element) {
      return;
    }

    if (element.isConnected) {
      restoreRetailerCellFromSnapshot(element, snapshot);
    }
  });

  retailerCellOriginalContent.clear();
}

function restoreGlobalAccountNameReplacements() {
  replacedTextNodes.forEach((originalValue, node) => {
    if (node.nodeValue !== originalValue) {
      node.nodeValue = originalValue;
    }
  });

  replacedTextNodes.clear();
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
  applyRetailerCellCustomizations();
  replaceAccountNameInTextNodes();
}

function restoreAccountNameCustomizations() {
  const accountNameElements = getAccountNameElements();
  accountNameElements.forEach((element) => restoreAccountName(element));
  restoreGlobalAccountNameReplacements();
  restoreRetailerCellCustomizations();
  originalAccountName = null;
  originalAccountNamePriority = 0;
  originalAccountNameSource = null;
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

