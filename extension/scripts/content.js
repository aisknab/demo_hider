const DEFAULT_RETAILER_NAME = "demo retailer";
const DEFAULT_FAVICON_ENABLED = false;
const LOGO_SELECTOR = "body > app-root > app-shell > mat-sidenav-container > mat-sidenav-content > app-header > div > mat-toolbar > div.toolbar-left > app-header-logo > img";
const ACCOUNT_NAME_SELECTORS = [
  '[data-test="headerAccountListButtonText"]',
  "span.cds-p1-bold"
];
const RETAILER_COLUMN_CELL_SELECTOR = "[class*='column-retailers']";
const SHOW_MORE_POPOVER_SELECTOR = "app-show-more-popover";
const RETAILER_COLUMN_TEXT_DESCENDANT_SELECTORS = [
  ".cds-display-block",
  SHOW_MORE_POPOVER_SELECTOR
];
const RETAILER_COLUMN_TEXT_DESCENDANT_SELECTOR =
  RETAILER_COLUMN_TEXT_DESCENDANT_SELECTORS.join(", ");
const RETAILER_COLUMN_TEXT_SELECTOR =
  RETAILER_COLUMN_TEXT_DESCENDANT_SELECTORS.map(
    (selector) => `${RETAILER_COLUMN_CELL_SELECTOR} ${selector}`
  ).join(", ");
const EXCLUDED_TEXT_PARENT_NODES = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE"
]);

const LOGO_WIDTH = 300;
const LOGO_HEIGHT = 100;
const CUSTOM_LOGO_STORAGE_KEY = "customLogoDataUrl";
const CUSTOM_LOGO_INVERT_STORAGE_KEY = "customLogoInvert";
const CUSTOM_FAVICON_STORAGE_KEY = "customFaviconDataUrl";
const RETAILER_NAME_STORAGE_KEY = "retailerName";
const CUSTOM_LOGO_ATTR = "data-demo-hider-custom-logo";
const CUSTOM_FAVICON_ATTR = "data-demo-hider-custom-favicon";
const ORIGINAL_TEXT_ATTR = "data-demo-hider-original-text";

const state = {
  logoEnabled: false,
  textEnabled: false,
  customLogoDataUrl: null,
  customLogoInvert: false,
  customFaviconDataUrl: null,
  faviconEnabled: DEFAULT_FAVICON_ENABLED,
  retailerName: DEFAULT_RETAILER_NAME
};
let observer;
let isInitialized = false;
const customLogos = new WeakMap();
const originalFavicons = new Map();
let injectedFaviconLink = null;
let originalAccountName = null;
let originalAccountNamePriority = 0;
let originalAccountNameSource = null;
const replacedTextNodes = new Map();
const retailerCellOriginalContent = new Map();
const RETAILER_CELL_TEXT_PROPERTY_NAMES = [
  "text",
  "tooltip",
  "value",
  "content",
  "popoverText",
  "popoverTitle",
  "popoverContent",
  "title",
  "label"
];
const RETAILER_CELL_TEXT_ATTRIBUTE_NAMES = new Set([
  "text",
  "tooltip",
  "title",
  "aria-label",
  "data-tooltip",
  "data-tooltip-text",
  "data-popover",
  "data-popover-content",
  "data-title",
  "data-label",
  "data-content",
  "data-description",
  "ng-reflect-text",
  "ng-reflect-tooltip",
  "ng-reflect-tooltip-text",
  "ng-reflect-title",
  "ng-reflect-content"
]);
const RETAILER_CELL_TEXT_ATTRIBUTE_TOKENS = new Set([
  "text",
  "tooltip",
  "title",
  "label",
  "content",
  "description",
  "popover"
]);

function normalizeRetailerName(value) {
  if (typeof value !== "string") {
    return DEFAULT_RETAILER_NAME;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : DEFAULT_RETAILER_NAME;
}

function getRetailerName() {
  return state.retailerName;
}

function escapeSvgText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildLogoSvg(text) {
  const escapedText = escapeSvgText(text);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" viewBox="0 0 ${LOGO_WIDTH} ${LOGO_HEIGHT}"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" fill="#FF6C00" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="600" dominant-baseline="middle" text-anchor="middle">${escapedText}</text></svg>`;
}

function getDefaultLogoDataUrl() {
  const svg = buildLogoSvg(getRetailerName());
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getRetailerMonogram() {
  const name = getRetailerName();
  const trimmed = name.trim();
  const fallback = DEFAULT_RETAILER_NAME.trim();
  const base = trimmed || fallback || "D";
  return base.charAt(0).toUpperCase();
}

function buildFaviconSvg(letter) {
  const escapedLetter = escapeSvgText(letter);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" ry="12" fill="#FF6C00"/><text x="50%" y="50%" fill="#FFFFFF" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="600" text-anchor="middle" dominant-baseline="central">${escapedLetter}</text></svg>`;
}

function getFaviconDataUrl() {
  const svg = buildFaviconSvg(getRetailerMonogram());
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeCustomLogoDataUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("data:image/")) {
    return null;
  }

  return trimmed;
}

function normalizeCustomFaviconDataUrl(value) {
  return normalizeCustomLogoDataUrl(value);
}

function normalizeCustomLogoInvert(value, dataUrl) {
  if (!dataUrl) {
    return false;
  }

  return Boolean(value);
}

function getActiveLogoDataUrl() {
  return state.customLogoDataUrl || getDefaultLogoDataUrl();
}

function getActiveFaviconDataUrl() {
  return state.customFaviconDataUrl || getFaviconDataUrl();
}

function createRetailerCellSnapshot(element, originalText) {
  const attributes = {};
  Array.from(element.attributes).forEach((attribute) => {
    attributes[attribute.name] = attribute.value;
  });

  const properties = {};
  RETAILER_CELL_TEXT_PROPERTY_NAMES.forEach((propertyName) => {
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

function isTextualAttributeName(name) {
  if (!name) {
    return false;
  }

  const normalized = name.toLowerCase();

  if (RETAILER_CELL_TEXT_ATTRIBUTE_NAMES.has(normalized)) {
    return true;
  }

  if (normalized.includes("tooltip") || normalized.includes("popover")) {
    return true;
  }

  if (
    /(?:^|[-_:])(text|title|label|content|description)(?:$|[-_:])/.test(
      normalized
    )
  ) {
    return true;
  }

  const tokens = normalized.split(/[-_:]+/);

  return tokens.some((token) => RETAILER_CELL_TEXT_ATTRIBUTE_TOKENS.has(token));
}

function getElementTextAttributeValues(element) {
  if (!element || !element.attributes) {
    return [];
  }

  const values = [];

  Array.from(element.attributes).forEach((attribute) => {
    if (!attribute) {
      return;
    }

    const value = attribute.value;

    if (typeof value !== "string" || value === "") {
      return;
    }

    if (!isTextualAttributeName(attribute.name)) {
      return;
    }

    values.push(value);
  });

  return values;
}

function getElementTextPropertyValues(element) {
  if (!element) {
    return [];
  }

  const values = [];

  RETAILER_CELL_TEXT_PROPERTY_NAMES.forEach((propertyName) => {
    const value = element[propertyName];

    if (typeof value !== "string" || value === "") {
      return;
    }

    values.push(value);
  });

  return values;
}

function collectRetailerCellTextInfo(element) {
  const textContent = element.textContent ?? "";
  const trimmedText = textContent.trim();
  const attributeValues = getElementTextAttributeValues(element);
  const propertyValues = getElementTextPropertyValues(element);

  const hasAttributeText = attributeValues.some((value) => {
    const normalized = value.trim();
    return normalized && normalized !== getRetailerName();
  });

  const hasPropertyText = propertyValues.some((value) => {
    const normalized = value.trim();
    return normalized && normalized !== getRetailerName();
  });

  const hasTextContent =
    trimmedText && trimmedText !== getRetailerName() ? true : false;

  const hasOriginalText = hasTextContent || hasAttributeText || hasPropertyText;

  let fallbackText = trimmedText;

  if (!fallbackText) {
    const attributeText = attributeValues.find((value) => value && value.trim());
    if (attributeText) {
      fallbackText = attributeText.trim();
    }
  }

  if (!fallbackText) {
    const propertyText = propertyValues.find((value) => value && value.trim());
    if (propertyText) {
      fallbackText = propertyText.trim();
    }
  }

  return {
    trimmedText,
    attributeValues,
    propertyValues,
    hasOriginalText,
    fallbackText: fallbackText ?? ""
  };
}

function buildRetailerCellVariants(originalText, element, textInfo) {
  const variants = new Set();

  if (originalAccountName && originalAccountName !== getRetailerName()) {
    getRetailerTextVariants(originalAccountName).forEach((variant) => {
      variants.add(variant);
    });
  }

  getRetailerTextVariants(originalText).forEach((variant) => {
    variants.add(variant);
  });

  const addValuesToVariants = (values) => {
    if (!Array.isArray(values)) {
      return;
    }

    values.forEach((value) => {
      getRetailerTextVariants(value).forEach((variant) => {
        variants.add(variant);
      });
    });
  };

  if (textInfo && typeof textInfo === "object") {
    addValuesToVariants(textInfo.attributeValues);
    addValuesToVariants(textInfo.propertyValues);
  } else if (element instanceof HTMLElement) {
    addValuesToVariants(getElementTextAttributeValues(element));
    addValuesToVariants(getElementTextPropertyValues(element));
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

      updatedValue = updatedValue.split(variant).join(getRetailerName());
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

      updatedValue = updatedValue.split(variant).join(getRetailerName());
    });

    if (updatedValue !== attribute.value) {
      element.setAttribute(attribute.name, updatedValue);
    }
  });
}

function updateRetailerCellProperties(element, variants) {
  RETAILER_CELL_TEXT_PROPERTY_NAMES.forEach((propertyName) => {
    let value = element[propertyName];

    if (typeof value !== "string") {
      return;
    }

    variants.forEach((variant) => {
      if (!variant || !value.includes(variant)) {
        return;
      }

      value = value.split(variant).join(getRetailerName());
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

function applyRetailerCellReplacement(element, originalText, textInfo) {
  const variants = buildRetailerCellVariants(originalText, element, textInfo);

  let hasReplacedText = false;

  if (variants.length > 0) {
    hasReplacedText = replaceRetailerTextNodes(element, variants);
  }

  if (!hasReplacedText) {
    const currentText = element.textContent ?? "";

    if (originalText && originalText.trim() && currentText.trim() !== getRetailerName()) {
      // No descendant text nodes matched any of the known variants, so replace
      // the entire cell contents as a fallback. This differs from the standard
      // replacement rule where only occurrences of the original retailer name
      // are updated.
      element.textContent = getRetailerName();
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
      alt: originalElement.getAttribute("alt"),
      filter: originalElement.style.filter
    };

    customLogos.set(originalElement, originalAttributes);
  }

  const originalAttributes = customLogos.get(originalElement);
  const originalFilter =
    originalAttributes && typeof originalAttributes.filter === "string"
      ? originalAttributes.filter
      : "";

  originalElement.setAttribute("src", getActiveLogoDataUrl());
  originalElement.removeAttribute("srcset");
  originalElement.setAttribute("alt", getRetailerName());

  if (state.customLogoInvert) {
    originalElement.style.filter = "invert(1)";
  } else {
    originalElement.style.filter = originalFilter;
  }

  originalElement.setAttribute(CUSTOM_LOGO_ATTR, "true");
}

function getFaviconLinkElements() {
  if (!document.head) {
    return [];
  }

  return Array.from(document.head.querySelectorAll("link[rel~=\"icon\" i]"));
}

function rememberOriginalFaviconAttributes(element) {
  if (
    !element ||
    originalFavicons.has(element) ||
    element.hasAttribute(CUSTOM_FAVICON_ATTR)
  ) {
    return;
  }

  originalFavicons.set(element, {
    href: element.getAttribute("href"),
    type: element.getAttribute("type")
  });
}

function ensureCustomFavicon(element) {
  if (!element) {
    return;
  }

  rememberOriginalFaviconAttributes(element);
  element.setAttribute("href", getActiveFaviconDataUrl());
  element.setAttribute("type", "image/svg+xml");
  element.setAttribute(CUSTOM_FAVICON_ATTR, "true");
}

function ensureInjectedFaviconLink() {
  if (!document.head) {
    return;
  }

  if (!injectedFaviconLink) {
    injectedFaviconLink = document.createElement("link");
    injectedFaviconLink.setAttribute("rel", "icon");
    injectedFaviconLink.setAttribute("type", "image/svg+xml");
    injectedFaviconLink.setAttribute(CUSTOM_FAVICON_ATTR, "true");
  }

  injectedFaviconLink.setAttribute("href", getActiveFaviconDataUrl());

  if (!injectedFaviconLink.isConnected) {
    document.head.appendChild(injectedFaviconLink);
  }
}

function removeInjectedFaviconLink() {
  if (!injectedFaviconLink) {
    return;
  }

  if (injectedFaviconLink.isConnected) {
    injectedFaviconLink.remove();
  }

  injectedFaviconLink = null;
}

function applyFaviconCustomizations() {
  if (!document.head) {
    return;
  }

  const faviconElements = getFaviconLinkElements();
  const nonInjectedElements = faviconElements.filter(
    (element) => element !== injectedFaviconLink
  );

  if (nonInjectedElements.length === 0) {
    ensureInjectedFaviconLink();
    return;
  }

  nonInjectedElements.forEach((element) => ensureCustomFavicon(element));
  removeInjectedFaviconLink();
}

function restoreFaviconCustomizations() {
  originalFavicons.forEach((attributes, element) => {
    if (!element) {
      return;
    }

    if (attributes.href === null) {
      element.removeAttribute("href");
    } else {
      element.setAttribute("href", attributes.href);
    }

    if (attributes.type === null || typeof attributes.type === "undefined") {
      element.removeAttribute("type");
    } else {
      element.setAttribute("type", attributes.type);
    }

    element.removeAttribute(CUSTOM_FAVICON_ATTR);
  });

  originalFavicons.clear();
  removeInjectedFaviconLink();

  if (document.head) {
    document
      .querySelectorAll(`link[${CUSTOM_FAVICON_ATTR}]`)
      .forEach((element) => {
        element.removeAttribute(CUSTOM_FAVICON_ATTR);
      });
  }
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

  if (typeof originalAttributes.filter === "string") {
    originalElement.style.filter = originalAttributes.filter;
  } else {
    originalElement.style.removeProperty("filter");
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
    trimmedCurrent !== getRetailerName() &&
    trimmedCurrent !== trimmedStored
  ) {
    element.setAttribute(ORIGINAL_TEXT_ATTR, currentText);
    setOriginalAccountName(currentText, element, priority);
  } else if (trimmedStored && trimmedStored !== getRetailerName()) {
    setOriginalAccountName(storedOriginal, element, priority);
  } else if (!element.hasAttribute(ORIGINAL_TEXT_ATTR)) {
    element.setAttribute(ORIGINAL_TEXT_ATTR, currentText);
  }

  if (trimmedCurrent === getRetailerName()) {
    return;
  }

  element.textContent = getRetailerName();
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

  if (!trimmed || trimmed === getRetailerName()) {
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
  if (!originalAccountName || originalAccountName === getRetailerName()) {
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

    node.nodeValue = value.split(originalAccountName).join(getRetailerName());
  });
}

function processRetailerCellElement(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const textInfo = collectRetailerCellTextInfo(element);

  if (!textInfo.hasOriginalText) {
    return false;
  }

  const normalizedFallback = (textInfo.fallbackText ?? "").trim();

  if (textInfo.trimmedText === "-" || normalizedFallback === "-") {
    return false;
  }

  const currentHTML = element.innerHTML;
  const storedOriginal = retailerCellOriginalContent.get(element);

  const elementContainsRetailerName =
    typeof currentHTML === "string" && currentHTML.includes(getRetailerName());

  let shouldUpdateSnapshot = false;

  if (!storedOriginal || typeof storedOriginal !== "object") {
    shouldUpdateSnapshot = true;
  } else {
    const storedOriginalText =
      typeof storedOriginal.originalText === "string"
        ? storedOriginal.originalText
        : "";

    const isNewOriginalText =
      normalizedFallback &&
      normalizedFallback !== getRetailerName() &&
      normalizedFallback !== storedOriginalText;

    if (isNewOriginalText && !elementContainsRetailerName) {
      shouldUpdateSnapshot = true;
    }
  }

  if (shouldUpdateSnapshot) {
    retailerCellOriginalContent.set(
      element,
      createRetailerCellSnapshot(element, normalizedFallback)
    );
  }

  applyRetailerCellReplacement(element, normalizedFallback, textInfo);
  return true;
}

function applyRetailerCellCustomizations() {
  if (!document || typeof document.querySelectorAll !== "function") {
    return;
  }

  const popoverElements = document.querySelectorAll(SHOW_MORE_POPOVER_SELECTOR);

  popoverElements.forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    processRetailerCellElement(element);
  });

  const retailerCells = document.querySelectorAll(RETAILER_COLUMN_CELL_SELECTOR);

  retailerCells.forEach((cell) => {
    if (!(cell instanceof HTMLElement)) {
      return;
    }

    const descendantElements = cell.querySelectorAll(
      RETAILER_COLUMN_TEXT_DESCENDANT_SELECTOR
    );

    if (descendantElements.length > 0) {
      descendantElements.forEach((element) => {
        processRetailerCellElement(element);
      });
      return;
    }

    processRetailerCellElement(cell);
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

  if (state.logoEnabled && state.faviconEnabled) {
    applyFaviconCustomizations();
  } else {
    restoreFaviconCustomizations();
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

    if (state.logoEnabled && state.faviconEnabled) {
      applyFaviconCustomizations();
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
  const normalizedCustomLogoDataUrl = normalizeCustomLogoDataUrl(
    newState.customLogoDataUrl
  );
  const normalizedCustomLogoInvert = normalizeCustomLogoInvert(
    newState.customLogoInvert,
    normalizedCustomLogoDataUrl
  );

  const normalizedState = {
    logoEnabled: Boolean(newState.logoEnabled),
    faviconEnabled: Boolean(newState.faviconEnabled),
    textEnabled: Boolean(newState.textEnabled),
    customLogoDataUrl: normalizedCustomLogoDataUrl,
    customLogoInvert: normalizedCustomLogoInvert,
    customFaviconDataUrl: normalizeCustomFaviconDataUrl(
      newState.customFaviconDataUrl
    ),
    retailerName: normalizeRetailerName(newState.retailerName)
  };

  const hasLogoDataUpdate =
    normalizedState.customLogoDataUrl !== state.customLogoDataUrl;
  const hasLogoInvertUpdate =
    normalizedState.customLogoInvert !== state.customLogoInvert;
  const hasFaviconDataUpdate =
    normalizedState.customFaviconDataUrl !== state.customFaviconDataUrl;
  const hasRetailerNameUpdate =
    normalizedState.retailerName !== state.retailerName;
  const shouldRefreshLogo =
    normalizedState.logoEnabled &&
    (hasLogoDataUpdate || hasLogoInvertUpdate || hasRetailerNameUpdate);
  const shouldRefreshFavicon =
    normalizedState.logoEnabled &&
    normalizedState.faviconEnabled &&
    (hasFaviconDataUpdate || hasRetailerNameUpdate);
  const shouldRefreshText =
    normalizedState.textEnabled && hasRetailerNameUpdate;
  const hasChanged =
    normalizedState.logoEnabled !== state.logoEnabled ||
    normalizedState.faviconEnabled !== state.faviconEnabled ||
    normalizedState.textEnabled !== state.textEnabled ||
    hasLogoInvertUpdate ||
    shouldRefreshLogo ||
    shouldRefreshFavicon ||
    shouldRefreshText;

  if (hasRetailerNameUpdate && state.textEnabled) {
    restoreAccountNameCustomizations();
  }

  state.logoEnabled = normalizedState.logoEnabled;
  state.faviconEnabled = normalizedState.faviconEnabled;
  state.textEnabled = normalizedState.textEnabled;
  state.customLogoDataUrl = normalizedState.customLogoDataUrl;
  state.customLogoInvert = normalizedState.customLogoInvert;
  state.customFaviconDataUrl = normalizedState.customFaviconDataUrl;
  state.retailerName = normalizedState.retailerName;

  if (hasChanged || forceUpdate) {
    updateCustomizations();
  }
}

function setFeatureState(partial) {
  const newState = {
    logoEnabled: state.logoEnabled,
    faviconEnabled: state.faviconEnabled,
    textEnabled: state.textEnabled,
    customLogoDataUrl: state.customLogoDataUrl,
    customLogoInvert: state.customLogoInvert,
    customFaviconDataUrl: state.customFaviconDataUrl,
    retailerName: state.retailerName
  };

  const hasLogo = Object.prototype.hasOwnProperty.call(partial, "logoEnabled");
  const hasFavicon = Object.prototype.hasOwnProperty.call(partial, "faviconEnabled");
  const hasText = Object.prototype.hasOwnProperty.call(partial, "textEnabled");
  const hasCustomLogo = Object.prototype.hasOwnProperty.call(
    partial,
    CUSTOM_LOGO_STORAGE_KEY
  );
  const hasCustomLogoInvert = Object.prototype.hasOwnProperty.call(
    partial,
    CUSTOM_LOGO_INVERT_STORAGE_KEY
  );
  const hasCustomFavicon = Object.prototype.hasOwnProperty.call(
    partial,
    CUSTOM_FAVICON_STORAGE_KEY
  );
  const hasRetailerName = Object.prototype.hasOwnProperty.call(
    partial,
    RETAILER_NAME_STORAGE_KEY
  );

  if (hasLogo) {
    newState.logoEnabled = Boolean(partial.logoEnabled);
  }

  if (hasFavicon) {
    newState.faviconEnabled = Boolean(partial.faviconEnabled);
  }

  if (hasText) {
    newState.textEnabled = Boolean(partial.textEnabled);
  }

  if (hasCustomLogo) {
    newState.customLogoDataUrl = partial.customLogoDataUrl;
  }

  if (hasCustomLogoInvert) {
    newState.customLogoInvert = partial.customLogoInvert;
  }

  if (hasCustomFavicon) {
    newState.customFaviconDataUrl = partial.customFaviconDataUrl;
  }

  if (hasRetailerName) {
    newState.retailerName = partial.retailerName;
  }

  if (
    !hasLogo &&
    !hasFavicon &&
    !hasText &&
    Object.prototype.hasOwnProperty.call(partial, "enabled")
  ) {
    const boolValue = Boolean(partial.enabled);
    newState.logoEnabled = boolValue;
    newState.faviconEnabled = boolValue;
    newState.textEnabled = boolValue;
  }

  applyState(newState, !isInitialized);
  isInitialized = true;
}

function initialize() {
  ensureObserver();
  chrome.storage.sync.get(
    {
      logoEnabled: false,
      faviconEnabled: DEFAULT_FAVICON_ENABLED,
      textEnabled: false,
      enabled: false,
      retailerName: DEFAULT_RETAILER_NAME
    },
    (result) => {
      chrome.storage.local.get(
        {
          customLogoDataUrl: null,
          customLogoInvert: false,
          customFaviconDataUrl: null
        },
        (localResult) => {
          setFeatureState({
            ...result,
            customLogoDataUrl: localResult.customLogoDataUrl,
            customLogoInvert: localResult.customLogoInvert,
            customFaviconDataUrl: localResult.customFaviconDataUrl
          });
        }
      );
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
      Object.prototype.hasOwnProperty.call(message, "faviconEnabled") ||
      Object.prototype.hasOwnProperty.call(message, "textEnabled") ||
      Object.prototype.hasOwnProperty.call(message, "enabled") ||
      Object.prototype.hasOwnProperty.call(message, RETAILER_NAME_STORAGE_KEY))
  ) {
    setFeatureState(message);
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  const update = {};
  let hasUpdate = false;

  if (area === "sync") {
    if (Object.prototype.hasOwnProperty.call(changes, "logoEnabled")) {
      update.logoEnabled = changes.logoEnabled.newValue;
      hasUpdate = true;
    }

    if (Object.prototype.hasOwnProperty.call(changes, "faviconEnabled")) {
      update.faviconEnabled = changes.faviconEnabled.newValue;
      hasUpdate = true;
    }

    if (Object.prototype.hasOwnProperty.call(changes, "textEnabled")) {
      update.textEnabled = changes.textEnabled.newValue;
      hasUpdate = true;
    }

    if (Object.prototype.hasOwnProperty.call(changes, RETAILER_NAME_STORAGE_KEY)) {
      update.retailerName = changes[RETAILER_NAME_STORAGE_KEY].newValue;
      hasUpdate = true;
    }

    if (!hasUpdate && Object.prototype.hasOwnProperty.call(changes, "enabled")) {
      update.enabled = changes.enabled.newValue;
      hasUpdate = true;
    }
  }

  if (area === "local") {
    if (Object.prototype.hasOwnProperty.call(changes, CUSTOM_LOGO_STORAGE_KEY)) {
      update.customLogoDataUrl = changes[CUSTOM_LOGO_STORAGE_KEY].newValue;
      hasUpdate = true;
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, CUSTOM_LOGO_INVERT_STORAGE_KEY)
    ) {
      update.customLogoInvert = changes[CUSTOM_LOGO_INVERT_STORAGE_KEY].newValue;
      hasUpdate = true;
    }

    if (Object.prototype.hasOwnProperty.call(changes, CUSTOM_FAVICON_STORAGE_KEY)) {
      update.customFaviconDataUrl = changes[CUSTOM_FAVICON_STORAGE_KEY].newValue;
      hasUpdate = true;
    }
  }

  if (hasUpdate) {
    setFeatureState(update);
  }
});

