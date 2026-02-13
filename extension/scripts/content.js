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
const BRAND_COLORS_ENABLED_STORAGE_KEY = "brandColorsEnabled";
const LEGACY_BRAND_COLORS_AUTO_ENABLED_STORAGE_KEY = "brandColorsAutoEnabled";
const PRIMARY_COLOR_STORAGE_KEY = "primaryColor";
const SECONDARY_COLOR_STORAGE_KEY = "secondaryColor";
const PRIMARY_TEXT_COLOR_STORAGE_KEY = "primaryTextColor";
const SECONDARY_TEXT_COLOR_STORAGE_KEY = "secondaryTextColor";
const SELECTED_CURRENCY_STORAGE_KEY = "selectedCurrency";
const CURRENCY_RATES_STORAGE_KEY = "currencyRates";
const CURRENCY_RATES_UPDATED_AT_STORAGE_KEY = "currencyRatesUpdatedAt";
const DEFAULT_SELECTED_CURRENCY = "USD";
const DEFAULT_BRAND_COLORS_ENABLED = false;
const DEFAULT_PRIMARY_COLOR = "#ff6c00";
const DEFAULT_SECONDARY_COLOR = "#0f9d58";
const DEFAULT_PRIMARY_TEXT_COLOR = "#ffffff";
const DEFAULT_SECONDARY_TEXT_COLOR = "#ffffff";
const CURRENCY_CODES = [
  "USD",
  "CAD",
  "MXN",
  "BRL",
  "ARS",
  "CLP",
  "COP",
  "PEN",
  "EUR",
  "GBP",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "TRY",
  "ZAR",
  "AED",
  "SAR",
  "ILS",
  "JPY",
  "AUD",
  "NZD",
  "CNY",
  "HKD",
  "SGD",
  "KRW",
  "THB",
  "VND",
  "PHP",
  "IDR",
  "MYR",
  "INR",
  "TWD",
  "PKR",
  "BDT",
  "LKR"
];
const DOLLAR_AMOUNT_TEST_PATTERN =
  /\$\s*-?(?:(?:\d{1,3}(?:,\d{3})+)|\d+)(?:\.\d+)?/;
const DOLLAR_AMOUNT_REPLACE_PATTERN =
  /\$\s*(-?(?:(?:\d{1,3}(?:,\d{3})+)|\d+)(?:\.\d+)?)/g;
const LEADING_AMOUNT_PATTERN =
  /^\s*(-?(?:(?:\d{1,3}(?:,\d{3})+)|\d+)(?:\.\d+)?)/;
const TRAILING_DOLLAR_PATTERN = /^(.*)\$\s*$/;
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
  retailerName: DEFAULT_RETAILER_NAME,
  brandColorsEnabled: DEFAULT_BRAND_COLORS_ENABLED,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  secondaryColor: DEFAULT_SECONDARY_COLOR,
  primaryTextColor: DEFAULT_PRIMARY_TEXT_COLOR,
  secondaryTextColor: DEFAULT_SECONDARY_TEXT_COLOR,
  selectedCurrency: DEFAULT_SELECTED_CURRENCY,
  currencyRates: { USD: 1 },
  currencyRatesUpdatedAt: 0
};
let observer;
let isInitialized = false;
const customLogos = new WeakMap();
const originalFavicons = new Map();
let injectedFaviconLink = null;
let originalAccountName = null;
let originalAccountNamePriority = 0;
let originalAccountNameSource = null;
let originalDocumentTitle = null;
let lastAppliedDocumentTitle = null;
const replacedTextNodes = new Map();
const currencyReplacedTextNodes = new Map();
const currencyFormatterCache = new Map();
const observedCurrencyShadowRoots = new WeakSet();
const currencyShadowObservers = [];
const retailerCellOriginalContent = new Map();
const originalBrandColorVariables = new Map();
let appliedBrandColorSignature = "";
let primaryPaletteDirection = null;
let secondaryPaletteDirection = null;
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
const BRAND_COLOR_PALETTE_FACTORS = [
  0.88,
  0.72,
  0.56,
  0.34,
  0,
  -0.12,
  -0.24,
  -0.36,
  -0.48
];
const BRAND_COLOR_VARIABLE_NAMES = [
  "--primary-sys-0",
  "--primary-sys-1",
  "--primary-sys-2",
  "--primary-sys-3",
  "--primary-sys-4",
  "--primary-sys-5",
  "--primary-sys-6",
  "--primary-sys-7",
  "--primary-sys-8",
  "--primary-sys-9",
  "--accent-sys-0",
  "--accent-sys-1",
  "--accent-sys-2",
  "--accent-sys-3",
  "--accent-sys-4",
  "--accent-sys-5",
  "--accent-sys-6",
  "--accent-sys-7",
  "--accent-sys-8",
  "--accent-sys-9"
];

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

function normalizeHexColor(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  let normalized = value.trim();

  if (!normalized) {
    return fallback;
  }

  if (!normalized.startsWith("#")) {
    normalized = `#${normalized}`;
  }

  const shortMatch = normalized.match(/^#([0-9a-fA-F]{3})$/);
  if (shortMatch) {
    const [red, green, blue] = shortMatch[1].split("");
    return `#${red}${red}${green}${green}${blue}${blue}`.toLowerCase();
  }

  const longMatch = normalized.match(/^#([0-9a-fA-F]{6})$/);
  if (!longMatch) {
    return fallback;
  }

  return `#${longMatch[1]}`.toLowerCase();
}

function clampColorChannel(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToHex(red, green, blue) {
  const toToken = (value) => clampColorChannel(value).toString(16).padStart(2, "0");
  return `#${toToken(red)}${toToken(green)}${toToken(blue)}`;
}

function hexToRgb(value) {
  const normalized = normalizeHexColor(value, "");
  if (!normalized) {
    return null;
  }

  return {
    red: Number.parseInt(normalized.slice(1, 3), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    blue: Number.parseInt(normalized.slice(5, 7), 16)
  };
}

function parseRgbColor(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.trim().match(/^rgba?\((.+)\)$/i);
  if (!match) {
    return null;
  }

  const channels = match[1]
    .replace(/\//g, " ")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((token) => Number.parseFloat(token));

  if (
    channels.length < 3 ||
    !Number.isFinite(channels[0]) ||
    !Number.isFinite(channels[1]) ||
    !Number.isFinite(channels[2])
  ) {
    return null;
  }

  if (
    channels.length >= 4 &&
    Number.isFinite(channels[3]) &&
    channels[3] <= 0
  ) {
    return null;
  }

  return {
    red: channels[0],
    green: channels[1],
    blue: channels[2]
  };
}

function normalizeCssColorToHex(value) {
  const normalizedHex = normalizeHexColor(value, "");
  if (normalizedHex) {
    return normalizedHex;
  }

  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  context.fillStyle = "#010203";
  context.fillStyle = trimmed;
  const firstPass = context.fillStyle;
  context.fillStyle = "#fdfcfb";
  context.fillStyle = trimmed;
  const secondPass = context.fillStyle;

  if (firstPass === "#010203" && secondPass === "#fdfcfb") {
    return "";
  }

  const parsedHex = normalizeHexColor(secondPass, "");
  if (parsedHex) {
    return parsedHex;
  }

  const parsedRgb = parseRgbColor(secondPass);
  if (!parsedRgb) {
    return "";
  }

  return rgbToHex(parsedRgb.red, parsedRgb.green, parsedRgb.blue);
}

function getPerceivedLuminance(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return 0;
  }

  return (
    (0.2126 * rgb.red + 0.7152 * rgb.green + 0.0722 * rgb.blue) / 255
  );
}

function mixRgbColors(source, target, amount) {
  const normalizedAmount = Math.max(0, Math.min(1, Number(amount) || 0));

  return {
    red: source.red + (target.red - source.red) * normalizedAmount,
    green: source.green + (target.green - source.green) * normalizedAmount,
    blue: source.blue + (target.blue - source.blue) * normalizedAmount
  };
}

function adjustHexColorTone(hexColor, factor) {
  const source = hexToRgb(hexColor);
  if (!source) {
    return hexColor;
  }

  const normalizedFactor = Math.max(-1, Math.min(1, Number(factor) || 0));
  const target =
    normalizedFactor >= 0
      ? { red: 255, green: 255, blue: 255 }
      : { red: 0, green: 0, blue: 0 };
  const mixed = mixRgbColors(source, target, Math.abs(normalizedFactor));

  return rgbToHex(mixed.red, mixed.green, mixed.blue);
}

function detectPaletteDirection(prefix) {
  if (!document.documentElement) {
    return "light-to-dark";
  }

  const computedStyles = window.getComputedStyle(document.documentElement);
  const first = normalizeCssColorToHex(
    computedStyles.getPropertyValue(`${prefix}1`)
  );
  const last = normalizeCssColorToHex(
    computedStyles.getPropertyValue(`${prefix}9`)
  );

  if (!first || !last) {
    return "light-to-dark";
  }

  return getPerceivedLuminance(first) >= getPerceivedLuminance(last)
    ? "light-to-dark"
    : "dark-to-light";
}

function buildPaletteFromBaseColor(baseColor, direction, fallbackColor) {
  const normalizedBase = normalizeHexColor(baseColor, fallbackColor);
  const palette = BRAND_COLOR_PALETTE_FACTORS.map((factor) => {
    return adjustHexColorTone(normalizedBase, factor);
  });

  if (direction === "dark-to-light") {
    return palette.slice().reverse();
  }

  return palette;
}

function buildBrandColorSignature() {
  return [
    state.brandColorsEnabled,
    state.primaryColor,
    state.secondaryColor,
    state.primaryTextColor,
    state.secondaryTextColor,
    primaryPaletteDirection || "",
    secondaryPaletteDirection || ""
  ].join("|");
}

function captureOriginalBrandColorVariables() {
  if (!document.documentElement || originalBrandColorVariables.size > 0) {
    return;
  }

  const rootStyle = document.documentElement.style;

  BRAND_COLOR_VARIABLE_NAMES.forEach((name) => {
    originalBrandColorVariables.set(name, rootStyle.getPropertyValue(name));
  });
}

function normalizeBrandVariableValue(value) {
  const normalizedColor = normalizeCssColorToHex(value);
  if (normalizedColor) {
    return normalizedColor;
  }

  return (value || "").trim().toLowerCase();
}

function areBrandColorValuesApplied(assignments) {
  if (!document.documentElement || !assignments || typeof assignments !== "object") {
    return false;
  }

  const rootStyle = document.documentElement.style;

  return Object.keys(assignments).every((name) => {
    const expected = normalizeBrandVariableValue(assignments[name]);
    const current = normalizeBrandVariableValue(rootStyle.getPropertyValue(name));
    return current === expected;
  });
}

function applyBrandColorCustomizations() {
  if (!document.documentElement) {
    return;
  }

  captureOriginalBrandColorVariables();

  if (!primaryPaletteDirection) {
    primaryPaletteDirection = detectPaletteDirection("--primary-sys-");
  }

  if (!secondaryPaletteDirection) {
    secondaryPaletteDirection = detectPaletteDirection("--accent-sys-");
  }

  const nextSignature = buildBrandColorSignature();

  const primaryPalette = buildPaletteFromBaseColor(
    state.primaryColor,
    primaryPaletteDirection,
    DEFAULT_PRIMARY_COLOR
  );
  const secondaryPalette = buildPaletteFromBaseColor(
    state.secondaryColor,
    secondaryPaletteDirection,
    DEFAULT_SECONDARY_COLOR
  );
  const assignments = {
    "--primary-sys-0": normalizeHexColor(
      state.primaryTextColor,
      DEFAULT_PRIMARY_TEXT_COLOR
    ),
    "--accent-sys-0": normalizeHexColor(
      state.secondaryTextColor,
      DEFAULT_SECONDARY_TEXT_COLOR
    )
  };

  for (let index = 1; index <= 9; index += 1) {
    assignments[`--primary-sys-${index}`] = primaryPalette[index - 1];
    assignments[`--accent-sys-${index}`] = secondaryPalette[index - 1];
  }

  const rootStyle = document.documentElement.style;

  if (
    nextSignature === appliedBrandColorSignature &&
    areBrandColorValuesApplied(assignments)
  ) {
    return;
  }

  Object.keys(assignments).forEach((name) => {
    rootStyle.setProperty(name, assignments[name]);
  });

  appliedBrandColorSignature = nextSignature;
}

function restoreBrandColorCustomizations() {
  if (!document.documentElement) {
    return;
  }

  if (originalBrandColorVariables.size === 0) {
    appliedBrandColorSignature = "";
    primaryPaletteDirection = null;
    secondaryPaletteDirection = null;
    return;
  }

  const rootStyle = document.documentElement.style;

  originalBrandColorVariables.forEach((value, name) => {
    if (typeof value === "string" && value.trim()) {
      rootStyle.setProperty(name, value);
    } else {
      rootStyle.removeProperty(name);
    }
  });

  originalBrandColorVariables.clear();
  appliedBrandColorSignature = "";
  primaryPaletteDirection = null;
  secondaryPaletteDirection = null;
}

function normalizeCurrencyCode(value) {
  if (typeof value !== "string") {
    return DEFAULT_SELECTED_CURRENCY;
  }

  const normalized = value.trim().toUpperCase();
  return CURRENCY_CODES.includes(normalized)
    ? normalized
    : DEFAULT_SELECTED_CURRENCY;
}

function normalizeCurrencyRates(value) {
  const normalizedRates = { USD: 1 };

  if (!value || typeof value !== "object") {
    return normalizedRates;
  }

  CURRENCY_CODES.forEach((code) => {
    if (code === "USD") {
      normalizedRates.USD = 1;
      return;
    }

    const rate = Number(value[code]);
    if (Number.isFinite(rate) && rate > 0) {
      normalizedRates[code] = rate;
    }
  });

  return normalizedRates;
}

function normalizeCurrencyRatesUpdatedAt(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return 0;
  }

  return Math.floor(timestamp);
}

function areCurrencyRatesEqual(first, second) {
  const normalizedFirst = normalizeCurrencyRates(first);
  const normalizedSecond = normalizeCurrencyRates(second);

  return CURRENCY_CODES.every((code) => {
    return normalizedFirst[code] === normalizedSecond[code];
  });
}

function getCurrencyRate(currencyCode) {
  const normalizedCode = normalizeCurrencyCode(currencyCode);

  if (normalizedCode === DEFAULT_SELECTED_CURRENCY) {
    return 1;
  }

  const rate = Number(state.currencyRates[normalizedCode]);
  if (!Number.isFinite(rate) || rate <= 0) {
    return null;
  }

  return rate;
}

function getCurrencyFormatter(currencyCode) {
  const normalizedCode = normalizeCurrencyCode(currencyCode);

  if (currencyFormatterCache.has(normalizedCode)) {
    return currencyFormatterCache.get(normalizedCode);
  }

  let formatter;

  try {
    formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCode
    });
  } catch (error) {
    formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: DEFAULT_SELECTED_CURRENCY
    });
  }

  currencyFormatterCache.set(normalizedCode, formatter);
  return formatter;
}

function formatCurrencyValue(value, currencyCode) {
  return getCurrencyFormatter(currencyCode).format(value);
}

function containsDollarAmount(value) {
  if (typeof value !== "string" || !value.includes("$")) {
    return false;
  }

  return DOLLAR_AMOUNT_TEST_PATTERN.test(value);
}

function convertDollarAmountsInText(value, currencyCode, rate) {
  if (!containsDollarAmount(value)) {
    return value;
  }

  return value.replace(
    DOLLAR_AMOUNT_REPLACE_PATTERN,
    (match, amountToken) => {
      const amount = Number.parseFloat(String(amountToken).replace(/,/g, ""));

      if (!Number.isFinite(amount)) {
        return match;
      }

      const convertedAmount = amount * rate;
      return formatCurrencyValue(convertedAmount, currencyCode);
    }
  );
}

function getCurrencyEntryOriginalValue(entry) {
  if (typeof entry === "string") {
    return entry;
  }

  if (
    entry &&
    typeof entry === "object" &&
    typeof entry.originalText === "string"
  ) {
    return entry.originalText;
  }

  return "";
}

function getCurrencyEntryConvertedValue(entry) {
  if (
    entry &&
    typeof entry === "object" &&
    typeof entry.lastConvertedText === "string"
  ) {
    return entry.lastConvertedText;
  }

  return "";
}

function resolveCurrencyNodeValues(node) {
  const currentValue = node.nodeValue ?? "";
  const storedEntry = currencyReplacedTextNodes.get(node);
  const storedOriginalValue = getCurrencyEntryOriginalValue(storedEntry);
  const storedConvertedValue = getCurrencyEntryConvertedValue(storedEntry);

  let originalValue = currentValue;

  if (storedOriginalValue) {
    const hasKnownCurrentValue =
      currentValue === storedOriginalValue ||
      (storedConvertedValue && currentValue === storedConvertedValue);
    originalValue = hasKnownCurrentValue ? storedOriginalValue : currentValue;
  }

  return {
    currentValue,
    originalValue,
    storedEntry
  };
}

function containsDollarSymbol(value) {
  return typeof value === "string" && value.includes("$");
}

function isIgnoredCurrencyTextNode(node) {
  const parent = node ? node.parentNode : null;
  return Boolean(parent && EXCLUDED_TEXT_PARENT_NODES.has(parent.nodeName));
}

function collectCurrencyTraversalRoots() {
  if (!document.documentElement) {
    return [];
  }

  const roots = [];
  const queue = [document.documentElement];
  const visited = new Set();

  while (queue.length > 0) {
    const root = queue.shift();

    if (!root || visited.has(root)) {
      continue;
    }

    visited.add(root);
    roots.push(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

    while (walker.nextNode()) {
      const element = walker.currentNode;

      if (element && element.shadowRoot && !visited.has(element.shadowRoot)) {
        queue.push(element.shadowRoot);
      }
    }
  }

  return roots;
}

function ensureCurrencyShadowObservers() {
  if (typeof ShadowRoot === "undefined") {
    return;
  }

  const roots = collectCurrencyTraversalRoots();

  roots.forEach((root) => {
    if (!(root instanceof ShadowRoot)) {
      return;
    }

    if (observedCurrencyShadowRoots.has(root)) {
      return;
    }

    const observer = new MutationObserver(() => {
      applyCurrencyCustomizations();
      ensureCurrencyShadowObservers();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true
    });

    observedCurrencyShadowRoots.add(root);
    currencyShadowObservers.push(observer);
  });
}

function applyConvertedCurrencyValue(node, originalValue, convertedValue, currentValue) {
  const entryExists = currencyReplacedTextNodes.has(node);

  if (convertedValue === originalValue) {
    if (entryExists) {
      currencyReplacedTextNodes.delete(node);

      if (currentValue !== originalValue) {
        node.nodeValue = originalValue;
      }
    }

    return;
  }

  currencyReplacedTextNodes.set(node, {
    originalText: originalValue,
    lastConvertedText: convertedValue
  });

  if (currentValue !== convertedValue) {
    node.nodeValue = convertedValue;
  }
}

function tryConvertSplitDollarAmount(nodes, startIndex, selectedCurrency, rate) {
  const firstNode = nodes[startIndex];
  const firstValues = resolveCurrencyNodeValues(firstNode);
  const firstOriginalValue = firstValues.originalValue;

  if (!containsDollarSymbol(firstOriginalValue) || containsDollarAmount(firstOriginalValue)) {
    return null;
  }

  const trailingDollarMatch = firstOriginalValue.match(TRAILING_DOLLAR_PATTERN);
  if (!trailingDollarMatch) {
    return null;
  }

  let secondNode = null;
  let secondValues = null;
  let secondIndex = startIndex + 1;

  while (secondIndex < nodes.length) {
    const candidateNode = nodes[secondIndex];
    const candidateValues = resolveCurrencyNodeValues(candidateNode);
    const candidateOriginalValue = candidateValues.originalValue;

    if (candidateOriginalValue.length === 0 || /^\s+$/.test(candidateOriginalValue)) {
      secondIndex += 1;
      continue;
    }

    secondNode = candidateNode;
    secondValues = candidateValues;
    break;
  }

  if (!secondNode || !secondValues) {
    return null;
  }

  const secondOriginalValue = secondValues.originalValue;
  const amountMatch = secondOriginalValue.match(LEADING_AMOUNT_PATTERN);

  if (!amountMatch) {
    return null;
  }

  const numericToken = amountMatch[1];
  const amount = Number.parseFloat(String(numericToken).replace(/,/g, ""));

  if (!Number.isFinite(amount)) {
    return null;
  }

  const convertedAmountText = formatCurrencyValue(amount * rate, selectedCurrency);
  const updatedFirstValue = `${trailingDollarMatch[1]}${convertedAmountText}`;
  const consumedPrefixLength = amountMatch[0].length;
  const updatedSecondValue = secondOriginalValue.slice(consumedPrefixLength);

  applyConvertedCurrencyValue(
    firstNode,
    firstOriginalValue,
    updatedFirstValue,
    firstValues.currentValue
  );
  applyConvertedCurrencyValue(
    secondNode,
    secondOriginalValue,
    updatedSecondValue,
    secondValues.currentValue
  );

  return {
    secondNode
  };
}

function collectCurrencyCandidateTextNodes(root) {
  const nodes = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (isIgnoredCurrencyTextNode(node)) {
        return NodeFilter.FILTER_REJECT;
      }

      const values = resolveCurrencyNodeValues(node);
      const hasCandidateDollarAmount =
        containsDollarSymbol(values.currentValue) ||
        containsDollarSymbol(values.originalValue);

      if (!hasCandidateDollarAmount) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  return nodes;
}

function restoreCurrencyCustomizations() {
  currencyReplacedTextNodes.forEach((entry, node) => {
    if (!node || !node.isConnected) {
      return;
    }

    const originalValue = getCurrencyEntryOriginalValue(entry);

    if (typeof originalValue === "string" && node.nodeValue !== originalValue) {
      node.nodeValue = originalValue;
    }
  });

  currencyReplacedTextNodes.clear();
}

function applyCurrencyCustomizations() {
  if (!document.documentElement) {
    return;
  }

  ensureCurrencyShadowObservers();

  const selectedCurrency = normalizeCurrencyCode(state.selectedCurrency);

  if (selectedCurrency === DEFAULT_SELECTED_CURRENCY) {
    restoreCurrencyCustomizations();
    return;
  }

  const rate = getCurrencyRate(selectedCurrency);
  if (!Number.isFinite(rate) || rate <= 0) {
    restoreCurrencyCustomizations();
    return;
  }

  const roots = collectCurrencyTraversalRoots();

  roots.forEach((root) => {
    const nodesToUpdate = collectCurrencyCandidateTextNodes(root);
    const consumedNodes = new Set();

    for (let index = 0; index < nodesToUpdate.length; index += 1) {
      const node = nodesToUpdate[index];

      if (consumedNodes.has(node)) {
        continue;
      }

      const values = resolveCurrencyNodeValues(node);
      const originalValue = values.originalValue;
      const currentValue = values.currentValue;

      if (!containsDollarSymbol(originalValue)) {
        if (values.storedEntry) {
          currencyReplacedTextNodes.delete(node);
        }
        continue;
      }

      if (containsDollarAmount(originalValue)) {
        const convertedValue = convertDollarAmountsInText(
          originalValue,
          selectedCurrency,
          rate
        );

        applyConvertedCurrencyValue(node, originalValue, convertedValue, currentValue);
        continue;
      }

      const splitResult = tryConvertSplitDollarAmount(
        nodesToUpdate,
        index,
        selectedCurrency,
        rate
      );

      if (splitResult && splitResult.secondNode) {
        consumedNodes.add(splitResult.secondNode);
        continue;
      }

      if (values.storedEntry) {
        currencyReplacedTextNodes.delete(node);

        if (currentValue !== originalValue) {
          node.nodeValue = originalValue;
        }
      }
    }
  });

  currencyReplacedTextNodes.forEach((_, node) => {
    if (!node || !node.isConnected) {
      currencyReplacedTextNodes.delete(node);
    }
  });
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

function splitTitleOnColon(title) {
  if (typeof title !== "string") {
    return null;
  }

  const index = title.indexOf(":");

  if (index <= 0) {
    return null;
  }

  return {
    prefix: title.slice(0, index),
    suffix: title.slice(index)
  };
}

function applyDocumentTitleCustomization() {
  if (!document || typeof document.title !== "string") {
    return;
  }

  const currentTitle = document.title;

  if (!currentTitle) {
    return;
  }

  const isUsingReplacement =
    typeof lastAppliedDocumentTitle === "string" &&
    currentTitle === lastAppliedDocumentTitle;

  if (originalDocumentTitle === null || !isUsingReplacement) {
    originalDocumentTitle = currentTitle;
  }

  const split = splitTitleOnColon(originalDocumentTitle);

  if (!split) {
    lastAppliedDocumentTitle = currentTitle;
    return;
  }

  const updatedTitle = `${getRetailerName()}${split.suffix}`;

  if (updatedTitle !== currentTitle) {
    document.title = updatedTitle;
  }

  lastAppliedDocumentTitle = document.title;
}

function restoreDocumentTitleCustomization() {
  if (originalDocumentTitle !== null && typeof document?.title === "string") {
    document.title = originalDocumentTitle;
  }

  originalDocumentTitle = null;
  lastAppliedDocumentTitle = null;
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
  applyDocumentTitleCustomization();
}

function restoreAccountNameCustomizations() {
  const accountNameElements = getAccountNameElements();
  accountNameElements.forEach((element) => restoreAccountName(element));
  restoreGlobalAccountNameReplacements();
  restoreRetailerCellCustomizations();
  restoreDocumentTitleCustomization();
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

  if (state.brandColorsEnabled) {
    applyBrandColorCustomizations();
  } else {
    restoreBrandColorCustomizations();
  }

  applyCurrencyCustomizations();
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

    if (state.brandColorsEnabled) {
      applyBrandColorCustomizations();
    }

    applyCurrencyCustomizations();
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
  const normalizedSelectedCurrency = normalizeCurrencyCode(newState.selectedCurrency);
  const normalizedCurrencyRates = normalizeCurrencyRates(newState.currencyRates);
  const normalizedCurrencyRatesUpdatedAt = normalizeCurrencyRatesUpdatedAt(
    newState.currencyRatesUpdatedAt
  );
  const normalizedPrimaryColor = normalizeHexColor(
    newState.primaryColor,
    DEFAULT_PRIMARY_COLOR
  );
  const normalizedSecondaryColor = normalizeHexColor(
    newState.secondaryColor,
    DEFAULT_SECONDARY_COLOR
  );
  const normalizedPrimaryTextColor = normalizeHexColor(
    newState.primaryTextColor,
    DEFAULT_PRIMARY_TEXT_COLOR
  );
  const normalizedSecondaryTextColor = normalizeHexColor(
    newState.secondaryTextColor,
    DEFAULT_SECONDARY_TEXT_COLOR
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
    retailerName: normalizeRetailerName(newState.retailerName),
    brandColorsEnabled: Boolean(newState.brandColorsEnabled),
    primaryColor: normalizedPrimaryColor,
    secondaryColor: normalizedSecondaryColor,
    primaryTextColor: normalizedPrimaryTextColor,
    secondaryTextColor: normalizedSecondaryTextColor,
    selectedCurrency: normalizedSelectedCurrency,
    currencyRates: normalizedCurrencyRates,
    currencyRatesUpdatedAt: normalizedCurrencyRatesUpdatedAt
  };

  const hasLogoDataUpdate =
    normalizedState.customLogoDataUrl !== state.customLogoDataUrl;
  const hasLogoInvertUpdate =
    normalizedState.customLogoInvert !== state.customLogoInvert;
  const hasFaviconDataUpdate =
    normalizedState.customFaviconDataUrl !== state.customFaviconDataUrl;
  const hasRetailerNameUpdate =
    normalizedState.retailerName !== state.retailerName;
  const hasBrandColorsEnabledUpdate =
    normalizedState.brandColorsEnabled !== state.brandColorsEnabled;
  const hasPrimaryColorUpdate =
    normalizedState.primaryColor !== state.primaryColor;
  const hasSecondaryColorUpdate =
    normalizedState.secondaryColor !== state.secondaryColor;
  const hasPrimaryTextColorUpdate =
    normalizedState.primaryTextColor !== state.primaryTextColor;
  const hasSecondaryTextColorUpdate =
    normalizedState.secondaryTextColor !== state.secondaryTextColor;
  const hasSelectedCurrencyUpdate =
    normalizedState.selectedCurrency !== state.selectedCurrency;
  const hasCurrencyRatesUpdate =
    !areCurrencyRatesEqual(normalizedState.currencyRates, state.currencyRates);
  const hasCurrencyRatesUpdatedAtUpdate =
    normalizedState.currencyRatesUpdatedAt !== state.currencyRatesUpdatedAt;
  const shouldRefreshLogo =
    normalizedState.logoEnabled &&
    (hasLogoDataUpdate || hasLogoInvertUpdate || hasRetailerNameUpdate);
  const shouldRefreshFavicon =
    normalizedState.logoEnabled &&
    normalizedState.faviconEnabled &&
    (hasFaviconDataUpdate || hasRetailerNameUpdate);
  const shouldRefreshText =
    normalizedState.textEnabled && hasRetailerNameUpdate;
  const shouldRefreshBrandColors =
    normalizedState.brandColorsEnabled &&
    (hasPrimaryColorUpdate ||
      hasSecondaryColorUpdate ||
      hasPrimaryTextColorUpdate ||
      hasSecondaryTextColorUpdate);
  const shouldRefreshCurrency =
    hasSelectedCurrencyUpdate ||
    (normalizedState.selectedCurrency !== DEFAULT_SELECTED_CURRENCY &&
      (hasCurrencyRatesUpdate || hasCurrencyRatesUpdatedAtUpdate));
  const hasChanged =
    normalizedState.logoEnabled !== state.logoEnabled ||
    normalizedState.faviconEnabled !== state.faviconEnabled ||
    normalizedState.textEnabled !== state.textEnabled ||
    hasBrandColorsEnabledUpdate ||
    hasLogoInvertUpdate ||
    shouldRefreshLogo ||
    shouldRefreshFavicon ||
    shouldRefreshText ||
    shouldRefreshBrandColors ||
    shouldRefreshCurrency;

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
  state.brandColorsEnabled = normalizedState.brandColorsEnabled;
  state.primaryColor = normalizedState.primaryColor;
  state.secondaryColor = normalizedState.secondaryColor;
  state.primaryTextColor = normalizedState.primaryTextColor;
  state.secondaryTextColor = normalizedState.secondaryTextColor;
  state.selectedCurrency = normalizedState.selectedCurrency;
  state.currencyRates = normalizedState.currencyRates;
  state.currencyRatesUpdatedAt = normalizedState.currencyRatesUpdatedAt;

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
    retailerName: state.retailerName,
    brandColorsEnabled: state.brandColorsEnabled,
    primaryColor: state.primaryColor,
    secondaryColor: state.secondaryColor,
    primaryTextColor: state.primaryTextColor,
    secondaryTextColor: state.secondaryTextColor,
    selectedCurrency: state.selectedCurrency,
    currencyRates: state.currencyRates,
    currencyRatesUpdatedAt: state.currencyRatesUpdatedAt
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
  const hasBrandColorsEnabled = Object.prototype.hasOwnProperty.call(
    partial,
    BRAND_COLORS_ENABLED_STORAGE_KEY
  );
  const hasLegacyBrandColorsAutoEnabled = Object.prototype.hasOwnProperty.call(
    partial,
    LEGACY_BRAND_COLORS_AUTO_ENABLED_STORAGE_KEY
  );
  const hasPrimaryColor = Object.prototype.hasOwnProperty.call(
    partial,
    PRIMARY_COLOR_STORAGE_KEY
  );
  const hasSecondaryColor = Object.prototype.hasOwnProperty.call(
    partial,
    SECONDARY_COLOR_STORAGE_KEY
  );
  const hasPrimaryTextColor = Object.prototype.hasOwnProperty.call(
    partial,
    PRIMARY_TEXT_COLOR_STORAGE_KEY
  );
  const hasSecondaryTextColor = Object.prototype.hasOwnProperty.call(
    partial,
    SECONDARY_TEXT_COLOR_STORAGE_KEY
  );
  const hasSelectedCurrency = Object.prototype.hasOwnProperty.call(
    partial,
    SELECTED_CURRENCY_STORAGE_KEY
  );
  const hasCurrencyRates = Object.prototype.hasOwnProperty.call(
    partial,
    CURRENCY_RATES_STORAGE_KEY
  );
  const hasCurrencyRatesUpdatedAt = Object.prototype.hasOwnProperty.call(
    partial,
    CURRENCY_RATES_UPDATED_AT_STORAGE_KEY
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

  if (hasBrandColorsEnabled) {
    newState.brandColorsEnabled = Boolean(partial.brandColorsEnabled);
  } else if (hasLegacyBrandColorsAutoEnabled) {
    newState.brandColorsEnabled = Boolean(partial.brandColorsAutoEnabled);
  }

  if (hasPrimaryColor) {
    newState.primaryColor = partial.primaryColor;
  }

  if (hasSecondaryColor) {
    newState.secondaryColor = partial.secondaryColor;
  }

  if (hasPrimaryTextColor) {
    newState.primaryTextColor = partial.primaryTextColor;
  }

  if (hasSecondaryTextColor) {
    newState.secondaryTextColor = partial.secondaryTextColor;
  }

  if (hasSelectedCurrency) {
    newState.selectedCurrency = partial.selectedCurrency;
  }

  if (hasCurrencyRates) {
    newState.currencyRates = partial.currencyRates;
  }

  if (hasCurrencyRatesUpdatedAt) {
    newState.currencyRatesUpdatedAt = partial.currencyRatesUpdatedAt;
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
      retailerName: DEFAULT_RETAILER_NAME,
      brandColorsEnabled: DEFAULT_BRAND_COLORS_ENABLED,
      brandColorsAutoEnabled: DEFAULT_BRAND_COLORS_ENABLED,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      secondaryColor: DEFAULT_SECONDARY_COLOR,
      primaryTextColor: DEFAULT_PRIMARY_TEXT_COLOR,
      secondaryTextColor: DEFAULT_SECONDARY_TEXT_COLOR,
      selectedCurrency: DEFAULT_SELECTED_CURRENCY
    },
    (result) => {
      chrome.storage.local.get(
        {
          customLogoDataUrl: null,
          customLogoInvert: false,
          customFaviconDataUrl: null,
          currencyRates: { USD: 1 },
          currencyRatesUpdatedAt: 0
        },
        (localResult) => {
          setFeatureState({
            ...result,
            customLogoDataUrl: localResult.customLogoDataUrl,
            customLogoInvert: localResult.customLogoInvert,
            customFaviconDataUrl: localResult.customFaviconDataUrl,
            currencyRates: localResult.currencyRates,
            currencyRatesUpdatedAt: localResult.currencyRatesUpdatedAt
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
      Object.prototype.hasOwnProperty.call(message, RETAILER_NAME_STORAGE_KEY) ||
      Object.prototype.hasOwnProperty.call(
        message,
        BRAND_COLORS_ENABLED_STORAGE_KEY
      ) ||
      Object.prototype.hasOwnProperty.call(
        message,
        LEGACY_BRAND_COLORS_AUTO_ENABLED_STORAGE_KEY
      ) ||
      Object.prototype.hasOwnProperty.call(message, PRIMARY_COLOR_STORAGE_KEY) ||
      Object.prototype.hasOwnProperty.call(message, SECONDARY_COLOR_STORAGE_KEY) ||
      Object.prototype.hasOwnProperty.call(
        message,
        PRIMARY_TEXT_COLOR_STORAGE_KEY
      ) ||
      Object.prototype.hasOwnProperty.call(
        message,
        SECONDARY_TEXT_COLOR_STORAGE_KEY
      ) ||
      Object.prototype.hasOwnProperty.call(message, SELECTED_CURRENCY_STORAGE_KEY) ||
      Object.prototype.hasOwnProperty.call(message, CURRENCY_RATES_STORAGE_KEY) ||
      Object.prototype.hasOwnProperty.call(
        message,
        CURRENCY_RATES_UPDATED_AT_STORAGE_KEY
      ))
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

    if (
      Object.prototype.hasOwnProperty.call(
        changes,
        BRAND_COLORS_ENABLED_STORAGE_KEY
      )
    ) {
      update.brandColorsEnabled = changes[BRAND_COLORS_ENABLED_STORAGE_KEY].newValue;
      hasUpdate = true;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        changes,
        LEGACY_BRAND_COLORS_AUTO_ENABLED_STORAGE_KEY
      )
    ) {
      update.brandColorsAutoEnabled =
        changes[LEGACY_BRAND_COLORS_AUTO_ENABLED_STORAGE_KEY].newValue;
      hasUpdate = true;
    }

    if (Object.prototype.hasOwnProperty.call(changes, PRIMARY_COLOR_STORAGE_KEY)) {
      update.primaryColor = changes[PRIMARY_COLOR_STORAGE_KEY].newValue;
      hasUpdate = true;
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, SECONDARY_COLOR_STORAGE_KEY)
    ) {
      update.secondaryColor = changes[SECONDARY_COLOR_STORAGE_KEY].newValue;
      hasUpdate = true;
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, PRIMARY_TEXT_COLOR_STORAGE_KEY)
    ) {
      update.primaryTextColor = changes[PRIMARY_TEXT_COLOR_STORAGE_KEY].newValue;
      hasUpdate = true;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        changes,
        SECONDARY_TEXT_COLOR_STORAGE_KEY
      )
    ) {
      update.secondaryTextColor =
        changes[SECONDARY_TEXT_COLOR_STORAGE_KEY].newValue;
      hasUpdate = true;
    }

    if (Object.prototype.hasOwnProperty.call(changes, SELECTED_CURRENCY_STORAGE_KEY)) {
      update.selectedCurrency = changes[SELECTED_CURRENCY_STORAGE_KEY].newValue;
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

    if (Object.prototype.hasOwnProperty.call(changes, CURRENCY_RATES_STORAGE_KEY)) {
      update.currencyRates = changes[CURRENCY_RATES_STORAGE_KEY].newValue;
      hasUpdate = true;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        changes,
        CURRENCY_RATES_UPDATED_AT_STORAGE_KEY
      )
    ) {
      update.currencyRatesUpdatedAt =
        changes[CURRENCY_RATES_UPDATED_AT_STORAGE_KEY].newValue;
      hasUpdate = true;
    }
  }

  if (hasUpdate) {
    setFeatureState(update);
  }
});
