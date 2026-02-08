const logoToggle = document.getElementById("logo-toggle");
const faviconToggle = document.getElementById("favicon-toggle");
const textToggle = document.getElementById("text-toggle");
const statusElement = document.getElementById("status");
const retailerTabAutoButton = document.getElementById("retailer-tab-auto");
const retailerAutoStatus = document.getElementById("retailer-auto-status");
const retailerNameInput = document.getElementById("retailer-name-input");
const customLogoInput = document.getElementById("custom-logo-input");
const customLogoClearButton = document.getElementById("custom-logo-clear");
const customLogoPreview = document.getElementById("custom-logo-preview");
const customLogoPreviewImage = document.getElementById("custom-logo-preview-image");
const customLogoStatus = document.getElementById("custom-logo-status");
const customFaviconInput = document.getElementById("custom-favicon-input");
const customFaviconClearButton = document.getElementById("custom-favicon-clear");
const customFaviconPreview = document.getElementById("custom-favicon-preview");
const customFaviconPreviewImage = document.getElementById("custom-favicon-preview-image");
const customFaviconStatus = document.getElementById("custom-favicon-status");
const currencySelect = document.getElementById("currency-select");
const currencyStatus = document.getElementById("currency-status");
const extensionUpdateCurrent = document.getElementById("extension-update-current");
const extensionUpdateStatus = document.getElementById("extension-update-status");
const extensionUpdateLink = document.getElementById("extension-update-link");

const CUSTOM_LOGO_STORAGE_KEY = "customLogoDataUrl";
const CUSTOM_LOGO_INVERT_STORAGE_KEY = "customLogoInvert";
const CUSTOM_FAVICON_STORAGE_KEY = "customFaviconDataUrl";
const RETAILER_NAME_STORAGE_KEY = "retailerName";
const DEFAULT_RETAILER_NAME = "demo retailer";
const DEFAULT_FAVICON_ENABLED = false;
const MAX_CUSTOM_LOGO_BYTES = 1024 * 1024 * 2;
const MAX_CUSTOM_FAVICON_BYTES = 1024 * 512;
const LOGO_INVERT_SAMPLE_SIZE = 64;
const LOGO_INVERT_WHITE_THRESHOLD = 235;
const LOGO_INVERT_DARK_THRESHOLD = 120;
const LOGO_INVERT_ALPHA_THRESHOLD = 16;
const LOGO_INVERT_RATIO = 0.9;
const LOGO_INVERT_MAX_DARK_RATIO = 0.02;
const LOGO_INVERT_MIN_OPAQUE_PIXELS = 20;
const SELECTED_CURRENCY_STORAGE_KEY = "selectedCurrency";
const CURRENCY_RATES_STORAGE_KEY = "currencyRates";
const CURRENCY_RATES_UPDATED_AT_STORAGE_KEY = "currencyRatesUpdatedAt";
const DEFAULT_SELECTED_CURRENCY = "USD";
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
const CURRENCY_RATE_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const CURRENCY_API_ENDPOINTS = [
  `https://api.frankfurter.app/latest?from=USD&to=${CURRENCY_CODES.filter(
    (code) => code !== "USD"
  ).join(",")}`,
  "https://open.er-api.com/v6/latest/USD"
];
const GITHUB_REPOSITORY = "aisknab/demo_hider";
const GITHUB_REPOSITORY_URL = `https://github.com/${GITHUB_REPOSITORY}`;
const GITHUB_RELEASES_PAGE_URL = `https://github.com/${GITHUB_REPOSITORY}/releases`;
const GITHUB_RELEASE_LATEST_API_URL = `https://api.github.com/repos/${GITHUB_REPOSITORY}/releases/latest`;
const GITHUB_TAGS_API_URL = `https://api.github.com/repos/${GITHUB_REPOSITORY}/tags?per_page=1`;
const GITHUB_BRANCH_CANDIDATES = ["main", "master"];

const state = {
  logoEnabled: false,
  faviconEnabled: DEFAULT_FAVICON_ENABLED,
  textEnabled: false,
  customLogoDataUrl: null,
  customLogoInvert: false,
  customFaviconDataUrl: null,
  retailerName: DEFAULT_RETAILER_NAME,
  selectedCurrency: DEFAULT_SELECTED_CURRENCY,
  currencyRates: { USD: 1 },
  currencyRatesUpdatedAt: 0
};

function getStatusMessage(currentState) {
  const retailerName = normalizeRetailerName(currentState.retailerName);

  const features = [];

  if (currentState.logoEnabled) {
    features.push("logo");
  }

  if (currentState.logoEnabled && currentState.faviconEnabled) {
    features.push("favicon");
  }

  if (currentState.textEnabled) {
    features.push("account name");
  }

  if (features.length === 0) {
    return "Default site branding is shown.";
  }

  const list =
    features.length === 1
      ? features[0]
      : `${features.slice(0, -1).join(", ")} and ${features[features.length - 1]}`;

  return `${retailerName} branding is applied to the ${list}.`;
}

function normalizeRetailerName(value) {
  if (typeof value !== "string") {
    return DEFAULT_RETAILER_NAME;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : DEFAULT_RETAILER_NAME;
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

function getCurrencyRateFromRates(currencyCode, rates) {
  const normalizedCode = normalizeCurrencyCode(currencyCode);

  if (normalizedCode === DEFAULT_SELECTED_CURRENCY) {
    return 1;
  }

  if (!rates || typeof rates !== "object") {
    return null;
  }

  const rate = Number(rates[normalizedCode]);
  if (!Number.isFinite(rate) || rate <= 0) {
    return null;
  }

  return rate;
}

function getSelectedCurrencyRate() {
  return getCurrencyRateFromRates(state.selectedCurrency, state.currencyRates);
}

function formatCurrencyTimestamp(timestamp) {
  if (!timestamp) {
    return "unknown time";
  }

  try {
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    return "unknown time";
  }
}

function setCurrencyStatus(message, isError = false) {
  if (!currencyStatus) {
    return;
  }

  currencyStatus.textContent = message;

  if (isError) {
    currencyStatus.setAttribute("data-error", "true");
  } else {
    currencyStatus.removeAttribute("data-error");
  }
}

function setCurrencySelectorDisabled(disabled) {
  if (!currencySelect) {
    return;
  }

  currencySelect.disabled = disabled;
}

function hasFreshCurrencyRate(currencyCode) {
  const normalizedCode = normalizeCurrencyCode(currencyCode);

  if (normalizedCode === DEFAULT_SELECTED_CURRENCY) {
    return true;
  }

  const rate = getCurrencyRateFromRates(normalizedCode, state.currencyRates);
  if (!Number.isFinite(rate) || rate <= 0) {
    return false;
  }

  if (!state.currencyRatesUpdatedAt) {
    return false;
  }

  return Date.now() - state.currencyRatesUpdatedAt <= CURRENCY_RATE_CACHE_TTL_MS;
}

function updateCurrencyUi() {
  if (!currencySelect) {
    return;
  }

  if (document.activeElement !== currencySelect) {
    currencySelect.value = state.selectedCurrency;
  }

  const selectedCurrency = state.selectedCurrency;

  if (selectedCurrency === DEFAULT_SELECTED_CURRENCY) {
    setCurrencyStatus("Dollar amounts stay in USD.");
    return;
  }

  const rate = getSelectedCurrencyRate();
  if (!Number.isFinite(rate) || rate <= 0) {
    setCurrencyStatus(
      `No conversion rate available for ${selectedCurrency}. Select again to retry.`,
      true
    );
    return;
  }

  const updatedAt = formatCurrencyTimestamp(state.currencyRatesUpdatedAt);
  setCurrencyStatus(`USD -> ${selectedCurrency}: ${rate.toFixed(4)} (updated ${updatedAt})`);
}

function setCustomLogoStatus(message, isError = false) {
  customLogoStatus.textContent = message;

  if (isError) {
    customLogoStatus.setAttribute("data-error", "true");
  } else {
    customLogoStatus.removeAttribute("data-error");
  }
}

function updateCustomLogoUi() {
  const hasCustomLogo = Boolean(state.customLogoDataUrl);

  customLogoPreview.hidden = !hasCustomLogo;
  customLogoClearButton.disabled = !hasCustomLogo;

  if (hasCustomLogo) {
    customLogoPreviewImage.src = state.customLogoDataUrl;
  } else {
    customLogoPreviewImage.removeAttribute("src");
  }

  if (!hasCustomLogo) {
    setCustomLogoStatus("No custom logo uploaded.");
  } else if (state.logoEnabled) {
    setCustomLogoStatus("Custom logo is active on supported pages.");
  } else {
    setCustomLogoStatus("Custom logo saved. Turn on Replace logo to apply it.");
  }
}

function setCustomFaviconStatus(message, isError = false) {
  customFaviconStatus.textContent = message;

  if (isError) {
    customFaviconStatus.setAttribute("data-error", "true");
  } else {
    customFaviconStatus.removeAttribute("data-error");
  }
}

function setAutoGrabStatus(message, isError = false) {
  retailerAutoStatus.textContent = message;

  if (isError) {
    retailerAutoStatus.setAttribute("data-error", "true");
  } else {
    retailerAutoStatus.removeAttribute("data-error");
  }
}

function setAutoFillButtonsDisabled(disabled) {
  retailerTabAutoButton.disabled = disabled;
}

function setExtensionUpdateStatus(message, isError = false) {
  if (!extensionUpdateStatus) {
    return;
  }

  extensionUpdateStatus.textContent = message;

  if (isError) {
    extensionUpdateStatus.setAttribute("data-error", "true");
  } else {
    extensionUpdateStatus.removeAttribute("data-error");
  }
}

function hideExtensionUpdateLink() {
  if (!extensionUpdateLink) {
    return;
  }

  extensionUpdateLink.hidden = true;
  extensionUpdateLink.removeAttribute("href");
}

function toHttpUrl(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch (error) {
    return "";
  }

  return "";
}

function showExtensionUpdateLink(url, text = "Get latest version") {
  if (!extensionUpdateLink) {
    return;
  }

  extensionUpdateLink.href = toHttpUrl(url) || GITHUB_RELEASES_PAGE_URL;
  extensionUpdateLink.textContent = text;
  extensionUpdateLink.hidden = false;
}

function normalizeVersionString(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/^v/i, "");
}

function parseVersion(version) {
  const normalized = normalizeVersionString(version);
  if (!normalized) {
    return null;
  }

  const [corePart, preReleasePart = ""] = normalized.split("-", 2);
  const coreSegments = corePart.split(".").map((segment) => {
    const numeric = Number.parseInt(segment, 10);
    return Number.isFinite(numeric) ? numeric : 0;
  });
  const preReleaseSegments = preReleasePart
    ? preReleasePart.split(".").filter((segment) => segment.length > 0)
    : [];

  return {
    coreSegments,
    preReleaseSegments
  };
}

function comparePreReleaseSegments(leftSegments, rightSegments) {
  const maxLength = Math.max(leftSegments.length, rightSegments.length);

  for (let index = 0; index < maxLength; index += 1) {
    const left = leftSegments[index];
    const right = rightSegments[index];

    if (typeof left === "undefined") {
      return -1;
    }

    if (typeof right === "undefined") {
      return 1;
    }

    const leftIsNumeric = /^\d+$/.test(left);
    const rightIsNumeric = /^\d+$/.test(right);

    if (leftIsNumeric && rightIsNumeric) {
      const leftNumber = Number.parseInt(left, 10);
      const rightNumber = Number.parseInt(right, 10);

      if (leftNumber !== rightNumber) {
        return leftNumber < rightNumber ? -1 : 1;
      }

      continue;
    }

    if (leftIsNumeric && !rightIsNumeric) {
      return -1;
    }

    if (!leftIsNumeric && rightIsNumeric) {
      return 1;
    }

    const comparison = left.localeCompare(right, undefined, {
      sensitivity: "base"
    });

    if (comparison !== 0) {
      return comparison < 0 ? -1 : 1;
    }
  }

  return 0;
}

function compareVersions(currentVersion, latestVersion) {
  const current = parseVersion(currentVersion);
  const latest = parseVersion(latestVersion);

  if (!current || !latest) {
    return 0;
  }

  const maxCoreSegments = Math.max(
    current.coreSegments.length,
    latest.coreSegments.length
  );

  for (let index = 0; index < maxCoreSegments; index += 1) {
    const currentSegment = current.coreSegments[index] || 0;
    const latestSegment = latest.coreSegments[index] || 0;

    if (currentSegment !== latestSegment) {
      return currentSegment < latestSegment ? -1 : 1;
    }
  }

  const currentHasPreRelease = current.preReleaseSegments.length > 0;
  const latestHasPreRelease = latest.preReleaseSegments.length > 0;

  if (!currentHasPreRelease && latestHasPreRelease) {
    return 1;
  }

  if (currentHasPreRelease && !latestHasPreRelease) {
    return -1;
  }

  if (!currentHasPreRelease && !latestHasPreRelease) {
    return 0;
  }

  return comparePreReleaseSegments(
    current.preReleaseSegments,
    latest.preReleaseSegments
  );
}

function getGitHubManifestUrl(branch) {
  return `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${branch}/manifest.json`;
}

function getGitHubArchiveUrl(branch) {
  return `https://github.com/${GITHUB_REPOSITORY}/archive/refs/heads/${branch}.zip`;
}

async function fetchLatestVersionFromManifestBranch(branch) {
  if (!branch) {
    return null;
  }

  const response = await fetch(getGitHubManifestUrl(branch), {
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const manifestPayload = await response.json();
  const latestVersion = normalizeVersionString(
    manifestPayload && manifestPayload.version
  );

  if (!latestVersion) {
    return null;
  }

  return {
    latestVersion,
    downloadUrl: getGitHubArchiveUrl(branch)
  };
}

async function fetchLatestGitHubVersion() {
  const headers = {
    Accept: "application/vnd.github+json"
  };
  let lastError = null;

  try {
    const releaseResponse = await fetch(GITHUB_RELEASE_LATEST_API_URL, {
      cache: "no-store",
      headers
    });

    if (releaseResponse.ok) {
      const releasePayload = await releaseResponse.json();
      const rawTag =
        typeof releasePayload.tag_name === "string"
          ? releasePayload.tag_name
          : releasePayload.name;
      const latestVersion = normalizeVersionString(rawTag);

      if (latestVersion) {
        return {
          latestVersion,
          downloadUrl:
            toHttpUrl(releasePayload.html_url) || GITHUB_RELEASES_PAGE_URL
        };
      }
    } else if (releaseResponse.status !== 404) {
      lastError = new Error(
        `GitHub release lookup failed with status ${releaseResponse.status}.`
      );
    }
  } catch (error) {
    lastError = error;
  }

  try {
    const tagsResponse = await fetch(GITHUB_TAGS_API_URL, {
      cache: "no-store",
      headers
    });

    if (tagsResponse.ok) {
      const tagsPayload = await tagsResponse.json();
      const firstTag =
        Array.isArray(tagsPayload) &&
        tagsPayload[0] &&
        typeof tagsPayload[0].name === "string"
          ? tagsPayload[0].name
          : "";
      const latestVersion = normalizeVersionString(firstTag);

      if (latestVersion) {
        return {
          latestVersion,
          downloadUrl: `${GITHUB_RELEASES_PAGE_URL}/tag/${encodeURIComponent(
            firstTag
          )}`
        };
      }
    } else {
      lastError = new Error(
        `GitHub tag lookup failed with status ${tagsResponse.status}.`
      );
    }
  } catch (error) {
    lastError = error;
  }

  for (const branch of GITHUB_BRANCH_CANDIDATES) {
    try {
      const manifestVersion = await fetchLatestVersionFromManifestBranch(branch);
      if (manifestVersion) {
        return manifestVersion;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No GitHub release, tag, or manifest version was found.");
}

async function checkForExtensionUpdates() {
  const currentVersion = normalizeVersionString(
    chrome.runtime.getManifest().version
  );

  if (extensionUpdateCurrent) {
    extensionUpdateCurrent.textContent = currentVersion
      ? `Current: v${currentVersion}`
      : "Current: unknown";
  }

  hideExtensionUpdateLink();
  setExtensionUpdateStatus("Checking for updates...");

  try {
    const latest = await fetchLatestGitHubVersion();
    const comparison = compareVersions(currentVersion, latest.latestVersion);

    if (comparison < 0) {
      setExtensionUpdateStatus(`New version available: v${latest.latestVersion}.`);
      showExtensionUpdateLink(latest.downloadUrl, "Open update on GitHub");
      return;
    }

    if (comparison > 0) {
      setExtensionUpdateStatus(
        `You are on v${currentVersion} (newer than GitHub v${latest.latestVersion}).`
      );
      showExtensionUpdateLink(GITHUB_RELEASES_PAGE_URL, "View GitHub releases");
      return;
    }

    setExtensionUpdateStatus(`You are on the latest version (v${currentVersion}).`);
  } catch (error) {
    console.error("Unable to check extension updates", error);
    setExtensionUpdateStatus("Unable to check for updates right now.", true);
    showExtensionUpdateLink(GITHUB_REPOSITORY_URL, "Open repository");
  }
}

function updateCustomFaviconUi() {
  const hasCustomFavicon = Boolean(state.customFaviconDataUrl);

  customFaviconPreview.hidden = !hasCustomFavicon;
  customFaviconClearButton.disabled = !hasCustomFavicon;

  if (hasCustomFavicon) {
    customFaviconPreviewImage.src = state.customFaviconDataUrl;
  } else {
    customFaviconPreviewImage.removeAttribute("src");
  }

  if (!hasCustomFavicon) {
    setCustomFaviconStatus("No custom favicon uploaded.");
  } else if (state.logoEnabled && state.faviconEnabled) {
    setCustomFaviconStatus("Custom favicon is active on supported pages.");
  } else if (!state.logoEnabled) {
    setCustomFaviconStatus("Custom favicon saved. Turn on Replace logo to apply it.");
  } else {
    setCustomFaviconStatus("Custom favicon saved. Turn on Replace favicon to apply it.");
  }
}

function applyState(newState) {
  state.logoEnabled = Boolean(newState.logoEnabled);
  state.faviconEnabled = Boolean(newState.faviconEnabled);
  state.textEnabled = Boolean(newState.textEnabled);
  const normalizedCustomLogoDataUrl = normalizeCustomLogoDataUrl(
    newState.customLogoDataUrl
  );
  state.customLogoDataUrl = normalizedCustomLogoDataUrl;
  state.customLogoInvert = normalizeCustomLogoInvert(
    newState.customLogoInvert,
    normalizedCustomLogoDataUrl
  );
  state.customFaviconDataUrl = normalizeCustomFaviconDataUrl(
    newState.customFaviconDataUrl
  );
  state.retailerName = normalizeRetailerName(newState.retailerName);
  state.selectedCurrency = normalizeCurrencyCode(newState.selectedCurrency);
  state.currencyRates = normalizeCurrencyRates(newState.currencyRates);
  state.currencyRatesUpdatedAt = normalizeCurrencyRatesUpdatedAt(
    newState.currencyRatesUpdatedAt
  );

  logoToggle.checked = state.logoEnabled;
  faviconToggle.checked = state.faviconEnabled;
  textToggle.checked = state.textEnabled;

  if (document.activeElement !== retailerNameInput) {
    retailerNameInput.value = state.retailerName;
  }

  statusElement.textContent = getStatusMessage(state);
  updateCustomLogoUi();
  updateCustomFaviconUi();
  updateCurrencyUi();
}

function buildUpdatedState(partial) {
  const newState = {
    logoEnabled: state.logoEnabled,
    faviconEnabled: state.faviconEnabled,
    textEnabled: state.textEnabled,
    customLogoDataUrl: state.customLogoDataUrl,
    customLogoInvert: state.customLogoInvert,
    customFaviconDataUrl: state.customFaviconDataUrl,
    retailerName: state.retailerName,
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

  return newState;
}

function updateState(partial) {
  const newState = buildUpdatedState(partial);
  applyState(newState);
}

function syncStateWithStorage() {
  chrome.storage.sync.get(
    {
      logoEnabled: false,
      faviconEnabled: DEFAULT_FAVICON_ENABLED,
      textEnabled: false,
      enabled: false,
      retailerName: DEFAULT_RETAILER_NAME,
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
          updateState({
            ...result,
            customLogoDataUrl: localResult.customLogoDataUrl,
            customLogoInvert: localResult.customLogoInvert,
            customFaviconDataUrl: localResult.customFaviconDataUrl,
            currencyRates: localResult.currencyRates,
            currencyRatesUpdatedAt: localResult.currencyRatesUpdatedAt
          });

          const selectedCurrency = normalizeCurrencyCode(result.selectedCurrency);
          if (
            selectedCurrency !== DEFAULT_SELECTED_CURRENCY &&
            !hasFreshCurrencyRate(selectedCurrency)
          ) {
            void applySelectedCurrency(selectedCurrency, { forceRefresh: true });
          }
        }
      );
    }
  );
}

function persistState(newState) {
  chrome.storage.sync.set(
    {
      logoEnabled: Boolean(newState.logoEnabled),
      faviconEnabled: Boolean(newState.faviconEnabled),
      textEnabled: Boolean(newState.textEnabled)
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Unable to persist toggle state", chrome.runtime.lastError);
        syncStateWithStorage();
      }
    }
  );
}

function persistCustomLogo(dataUrl, invert = false) {
  chrome.storage.local.set(
    {
      customLogoDataUrl: dataUrl,
      customLogoInvert: Boolean(invert)
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Unable to persist custom logo", chrome.runtime.lastError);
        setCustomLogoStatus(
          "Unable to save the custom logo. Try a smaller image.",
          true
        );
        syncStateWithStorage();
      }
    }
  );
}

function persistCustomFavicon(dataUrl) {
  chrome.storage.local.set(
    {
      customFaviconDataUrl: dataUrl
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Unable to persist custom favicon", chrome.runtime.lastError);
        setCustomFaviconStatus(
          "Unable to save the custom favicon. Try a smaller image.",
          true
        );
        syncStateWithStorage();
      }
    }
  );
}

function persistRetailerName(name) {
  chrome.storage.sync.set(
    {
      retailerName: name
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Unable to persist retailer name", chrome.runtime.lastError);
        syncStateWithStorage();
      }
    }
  );
}

function persistSelectedCurrency(code) {
  chrome.storage.sync.set(
    {
      selectedCurrency: normalizeCurrencyCode(code)
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Unable to persist selected currency", chrome.runtime.lastError);
        syncStateWithStorage();
      }
    }
  );
}

function persistCurrencyRates(rates, updatedAt) {
  chrome.storage.local.set(
    {
      currencyRates: normalizeCurrencyRates(rates),
      currencyRatesUpdatedAt: normalizeCurrencyRatesUpdatedAt(updatedAt)
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Unable to persist currency rates", chrome.runtime.lastError);
        setCurrencyStatus("Unable to cache conversion rates.", true);
      }
    }
  );
}

async function fetchLatestCurrencyRates(requiredCurrencyCode = null) {
  const normalizedRequiredCurrency =
    requiredCurrencyCode && requiredCurrencyCode !== DEFAULT_SELECTED_CURRENCY
      ? normalizeCurrencyCode(requiredCurrencyCode)
      : null;
  let lastError = null;

  for (const endpoint of CURRENCY_API_ENDPOINTS) {
    let response;

    try {
      response = await fetch(endpoint, { cache: "no-store" });
    } catch (error) {
      lastError = error;
      continue;
    }

    if (!response.ok) {
      lastError = new Error(`Currency API request failed (${response.status}).`);
      continue;
    }

    let payload;

    try {
      payload = await response.json();
    } catch (error) {
      lastError = new Error("Currency API returned invalid JSON.");
      continue;
    }

    const normalizedRates = normalizeCurrencyRates(payload && payload.rates);
    const hasAtLeastOneRate = CURRENCY_CODES.some((code) => {
      if (code === DEFAULT_SELECTED_CURRENCY) {
        return false;
      }

      const rate = Number(normalizedRates[code]);
      return Number.isFinite(rate) && rate > 0;
    });

    if (!hasAtLeastOneRate) {
      lastError = new Error("Currency API response did not include usable rates.");
      continue;
    }

    if (normalizedRequiredCurrency) {
      const requiredRate = Number(normalizedRates[normalizedRequiredCurrency]);

      if (!Number.isFinite(requiredRate) || requiredRate <= 0) {
        lastError = new Error(
          `Currency API response did not include ${normalizedRequiredCurrency} rate.`
        );
        continue;
      }
    }

    return {
      rates: normalizedRates,
      updatedAt: Date.now()
    };
  }

  throw lastError || new Error("Unable to reach currency APIs.");
}

async function applySelectedCurrency(nextCurrencyCode, options = {}) {
  const forceRefresh = Boolean(options.forceRefresh);
  const normalizedCode = normalizeCurrencyCode(nextCurrencyCode);
  const previousCode = state.selectedCurrency;

  if (normalizedCode === previousCode && !forceRefresh) {
    updateCurrencyUi();
    return;
  }

  setCurrencySelectorDisabled(true);

  try {
    let nextRates = state.currencyRates;
    let nextUpdatedAt = state.currencyRatesUpdatedAt;
    let usedCachedRates = false;

    if (
      normalizedCode !== DEFAULT_SELECTED_CURRENCY &&
      (!hasFreshCurrencyRate(normalizedCode) || forceRefresh)
    ) {
      const cachedRate = getCurrencyRateFromRates(normalizedCode, state.currencyRates);

      try {
        setCurrencyStatus("Fetching latest conversion rates...");
        const fetched = await fetchLatestCurrencyRates(normalizedCode);
        nextRates = fetched.rates;
        nextUpdatedAt = fetched.updatedAt;
        persistCurrencyRates(nextRates, nextUpdatedAt);
      } catch (error) {
        if (!Number.isFinite(cachedRate) || cachedRate <= 0) {
          console.error("Unable to fetch exchange rates", error);
          setCurrencyStatus("Unable to fetch exchange rates right now. Try again.", true);
          applyState({
            ...state,
            selectedCurrency: previousCode
          });
          return;
        }

        usedCachedRates = true;
        console.error("Unable to refresh exchange rates; using cached rates", error);
      }
    }

    const nextState = {
      ...state,
      selectedCurrency: normalizedCode,
      currencyRates: nextRates,
      currencyRatesUpdatedAt: nextUpdatedAt
    };

    applyState(nextState);
    persistSelectedCurrency(normalizedCode);

    if (usedCachedRates) {
      const selectedRate = getSelectedCurrencyRate();

      if (Number.isFinite(selectedRate) && selectedRate > 0) {
        setCurrencyStatus(
          `Using cached USD -> ${normalizedCode} rate: ${selectedRate.toFixed(4)}.`
        );
      } else {
        setCurrencyStatus("Using cached conversion rates.");
      }
    }
  } finally {
    setCurrencySelectorDisabled(false);
  }
}

let autoFillInProgress = false;
let autoFillSequence = 0;

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(typeof reader.result === "string" ? reader.result : null);
    });

    reader.addEventListener("error", () => {
      reject(new Error("Unable to read image data."));
    });

    reader.readAsDataURL(blob);
  });
}

function estimateDataUrlBytes(dataUrl) {
  if (typeof dataUrl !== "string") {
    return null;
  }

  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    return null;
  }

  const header = dataUrl.slice(0, commaIndex);
  const data = dataUrl.slice(commaIndex + 1);

  if (header.includes(";base64")) {
    return Math.floor((data.length * 3) / 4);
  }

  try {
    return decodeURIComponent(data).length;
  } catch (error) {
    return data.length;
  }
}

function isLikelyImageUrl(url) {
  if (!url) {
    return false;
  }

  return /\.(png|jpe?g|gif|svg|webp|ico|bmp)(?:[?#]|$)/i.test(url);
}

async function fetchImageAsDataUrl(url, maxBytes) {
  if (!url) {
    return { dataUrl: null, error: "missing" };
  }

  if (url.startsWith("data:image/")) {
    const estimatedBytes = estimateDataUrlBytes(url);
    if (
      Number.isFinite(estimatedBytes) &&
      Number.isFinite(maxBytes) &&
      estimatedBytes > maxBytes
    ) {
      return { dataUrl: null, error: "too-large" };
    }

    return { dataUrl: url, error: null };
  }

  let response;

  try {
    response = await fetch(url, { redirect: "follow" });
  } catch (error) {
    return { dataUrl: null, error: "fetch-failed" };
  }

  if (!response.ok) {
    return { dataUrl: null, error: "fetch-failed" };
  }

  const blob = await response.blob();

  if (Number.isFinite(maxBytes) && blob.size > maxBytes) {
    return { dataUrl: null, error: "too-large" };
  }

  const isImage = blob.type ? blob.type.startsWith("image/") : isLikelyImageUrl(url);

  if (!isImage) {
    return { dataUrl: null, error: "not-image" };
  }

  try {
    const dataUrl = await blobToDataUrl(blob);
    if (!dataUrl) {
      return { dataUrl: null, error: "read-failed" };
    }
    return { dataUrl, error: null };
  } catch (error) {
    return { dataUrl: null, error: "read-failed" };
  }
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error("Unable to load image data.")),
      { once: true }
    );

    image.decoding = "async";
    image.src = dataUrl;
  });
}

async function shouldInvertLogoDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return false;
  }

  let image;

  try {
    image = await loadImageFromDataUrl(dataUrl);
  } catch (error) {
    return false;
  }

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  if (!width || !height) {
    return false;
  }

  const scale = Math.min(
    LOGO_INVERT_SAMPLE_SIZE / width,
    LOGO_INVERT_SAMPLE_SIZE / height,
    1
  );
  const sampleWidth = Math.max(1, Math.round(width * scale));
  const sampleHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return false;
  }

  context.clearRect(0, 0, sampleWidth, sampleHeight);
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

  let opaquePixels = 0;
  let whitePixels = 0;
  let darkPixels = 0;

  try {
    const data = context.getImageData(0, 0, sampleWidth, sampleHeight).data;

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3];

      if (alpha < LOGO_INVERT_ALPHA_THRESHOLD) {
        continue;
      }

      opaquePixels += 1;

      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      if (
        red >= LOGO_INVERT_WHITE_THRESHOLD &&
        green >= LOGO_INVERT_WHITE_THRESHOLD &&
        blue >= LOGO_INVERT_WHITE_THRESHOLD
      ) {
        whitePixels += 1;
      } else {
        const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        if (luminance <= LOGO_INVERT_DARK_THRESHOLD) {
          darkPixels += 1;
        }
      }
    }
  } catch (error) {
    return false;
  }

  if (opaquePixels < LOGO_INVERT_MIN_OPAQUE_PIXELS) {
    return false;
  }

  const darkRatio = darkPixels / opaquePixels;
  const whiteRatio = whitePixels / opaquePixels;

  if (darkRatio > LOGO_INVERT_MAX_DARK_RATIO) {
    return false;
  }

  return whiteRatio >= LOGO_INVERT_RATIO;
}

function splitCssLayers(value) {
  if (typeof value !== "string") {
    return [];
  }

  const layers = [];
  let current = "";
  let depth = 0;
  let quote = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (quote) {
      if (char === quote && value[index - 1] !== "\\") {
        quote = null;
      }
      current += char;
      continue;
    }

    if (char === "\"" || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "(") {
      depth += 1;
      current += char;
      continue;
    }

    if (char === ")") {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }

    if (char === "," && depth === 0) {
      if (current.trim()) {
        layers.push(current.trim());
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    layers.push(current.trim());
  }

  return layers;
}

function isZeroPositionValue(value) {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "0" || normalized === "0px" || normalized === "0%";
}

function getCssLayerValue(value, index) {
  const layers = splitCssLayers(value);
  if (layers.length === 0) {
    return "";
  }

  if (Number.isInteger(index) && index >= 0 && index < layers.length) {
    return layers[index];
  }

  return layers[0];
}

function parseCssSizeToken(token, elementSize) {
  if (!token) {
    return null;
  }

  const trimmed = token.trim().toLowerCase();
  if (!trimmed || trimmed === "auto") {
    return null;
  }

  if (trimmed.endsWith("%")) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));
    if (!Number.isFinite(percent)) {
      return null;
    }
    return (elementSize * percent) / 100;
  }

  const number = Number.parseFloat(trimmed);
  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function computeBackgroundDrawSize(
  sizeValue,
  elementWidth,
  elementHeight,
  imageWidth,
  imageHeight
) {
  const normalized = (sizeValue || "").trim().toLowerCase();
  if (!normalized || normalized === "auto") {
    return { width: imageWidth, height: imageHeight };
  }

  if (normalized === "contain" || normalized === "cover") {
    const scaleX = elementWidth / imageWidth;
    const scaleY = elementHeight / imageHeight;
    const scale =
      normalized === "contain" ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
    return { width: imageWidth * scale, height: imageHeight * scale };
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const widthToken = tokens[0] || "auto";
  const heightToken = tokens[1] || "auto";

  const width = parseCssSizeToken(widthToken, elementWidth);
  const height = parseCssSizeToken(heightToken, elementHeight);

  if (width !== null && height !== null) {
    return { width, height };
  }

  if (width !== null) {
    return { width, height: imageHeight * (width / imageWidth) };
  }

  if (height !== null) {
    return { width: imageWidth * (height / imageHeight), height };
  }

  return { width: imageWidth, height: imageHeight };
}

function resolveBackgroundPositionValue(value, elementSize, drawSize) {
  const trimmed = (value || "").trim().toLowerCase();
  if (!trimmed) {
    return 0;
  }

  if (trimmed === "left" || trimmed === "top") {
    return 0;
  }

  if (trimmed === "center") {
    return (elementSize - drawSize) / 2;
  }

  if (trimmed === "right" || trimmed === "bottom") {
    return elementSize - drawSize;
  }

  if (trimmed.endsWith("%")) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));
    if (!Number.isFinite(percent)) {
      return 0;
    }
    return ((elementSize - drawSize) * percent) / 100;
  }

  const number = Number.parseFloat(trimmed);
  if (!Number.isFinite(number)) {
    return 0;
  }

  return number;
}

function parseBackgroundPositionLayer(value, elementWidth, elementHeight, drawWidth, drawHeight) {
  const tokens = (value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const xToken = tokens[0] || "0%";
  const yToken = tokens[1] || "50%";

  return {
    x: resolveBackgroundPositionValue(xToken, elementWidth, drawWidth),
    y: resolveBackgroundPositionValue(yToken, elementHeight, drawHeight)
  };
}

async function cropLogoSpriteDataUrl(dataUrl, logoMeta) {
  if (
    typeof dataUrl !== "string" ||
    !dataUrl.startsWith("data:image/") ||
    !logoMeta ||
    logoMeta.type !== "css-background"
  ) {
    return null;
  }

  const elementWidth = Number(logoMeta.elementWidth);
  const elementHeight = Number(logoMeta.elementHeight);

  if (!Number.isFinite(elementWidth) || !Number.isFinite(elementHeight)) {
    return null;
  }

  let image;

  try {
    image = await loadImageFromDataUrl(dataUrl);
  } catch (error) {
    return null;
  }

  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;

  if (!imageWidth || !imageHeight) {
    return null;
  }

  const layerIndex = Number.isInteger(logoMeta.backgroundLayerIndex)
    ? logoMeta.backgroundLayerIndex
    : 0;

  const sizeValue = getCssLayerValue(logoMeta.backgroundSize || "", layerIndex);
  const drawSize = computeBackgroundDrawSize(
    sizeValue,
    elementWidth,
    elementHeight,
    imageWidth,
    imageHeight
  );

  if (!drawSize.width || !drawSize.height) {
    return null;
  }

  const positionXValue = getCssLayerValue(
    logoMeta.backgroundPositionX || "",
    layerIndex
  );
  const positionYValue = getCssLayerValue(
    logoMeta.backgroundPositionY || "",
    layerIndex
  );

  const positionLayer = getCssLayerValue(
    logoMeta.backgroundPosition || "",
    layerIndex
  );
  const positionFromLayer = parseBackgroundPositionLayer(
    positionLayer,
    elementWidth,
    elementHeight,
    drawSize.width,
    drawSize.height
  );

  let posX = positionFromLayer.x;
  let posY = positionFromLayer.y;

  if (positionXValue || positionYValue) {
    const resolvedX = resolveBackgroundPositionValue(
      positionXValue,
      elementWidth,
      drawSize.width
    );
    const resolvedY = resolveBackgroundPositionValue(
      positionYValue,
      elementHeight,
      drawSize.height
    );

    const useLayerPosition =
      isZeroPositionValue(positionXValue) &&
      isZeroPositionValue(positionYValue) &&
      positionLayer &&
      positionLayer !== "0% 0%";

    if (!useLayerPosition) {
      posX = resolvedX;
      posY = resolvedY;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(elementWidth));
  canvas.height = Math.max(1, Math.round(elementHeight));

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    0,
    0,
    imageWidth,
    imageHeight,
    posX,
    posY,
    drawSize.width,
    drawSize.height
  );

  try {
    return canvas.toDataURL("image/png");
  } catch (error) {
    return null;
  }
}

function formatFeatureList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function describeImageFailure(label, error) {
  switch (error) {
    case "too-large":
      return `${label} too large to save.`;
    case "not-image":
      return `${label} is not an image.`;
    case "fetch-failed":
      return `Unable to download ${label.toLowerCase()}.`;
    case "read-failed":
      return `Unable to read ${label.toLowerCase()}.`;
    default:
      return `${label} not found.`;
  }
}

async function buildAutoFillUpdates({ extractedName, logoUrl, faviconUrl, logoMeta }) {
  const updates = {};
  const found = [];
  const issues = [];

  if (extractedName) {
    const normalizedName = normalizeRetailerName(extractedName);
    updates.retailerName = normalizedName;
    found.push("name");
  }

  let logoResult = { dataUrl: null, error: "missing" };
  if (logoUrl) {
    logoResult = await fetchImageAsDataUrl(logoUrl, MAX_CUSTOM_LOGO_BYTES);
  }

  if (logoResult.dataUrl) {
    let finalLogoDataUrl = logoResult.dataUrl;
    const croppedDataUrl = await cropLogoSpriteDataUrl(
      logoResult.dataUrl,
      logoMeta
    );
    if (croppedDataUrl) {
      finalLogoDataUrl = croppedDataUrl;
    }

    updates.customLogoDataUrl = finalLogoDataUrl;
    updates.customLogoInvert = await shouldInvertLogoDataUrl(finalLogoDataUrl);
    found.push("logo");
  } else {
    issues.push(describeImageFailure("Logo", logoResult.error));
  }

  let faviconResult = { dataUrl: null, error: "missing" };
  if (faviconUrl) {
    faviconResult = await fetchImageAsDataUrl(faviconUrl, MAX_CUSTOM_FAVICON_BYTES);
  }

  if (faviconResult.dataUrl) {
    updates.customFaviconDataUrl = faviconResult.dataUrl;
    found.push("favicon");
  } else {
    issues.push(describeImageFailure("Favicon", faviconResult.error));
  }

  return { updates, found, issues };
}

function finalizeAutoFill(sequence) {
  if (sequence !== autoFillSequence) {
    return;
  }

  autoFillInProgress = false;
  setAutoFillButtonsDisabled(false);
}

function collectBrandingFromActiveTab() {
  function getMetaContent(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) {
        continue;
      }

      const content = element.getAttribute("content");
      if (content && content.trim()) {
        return content.trim();
      }
    }

    return "";
  }

  function getFirstAttributeValue(selectors, attributeName) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) {
        continue;
      }

      const value = element.getAttribute(attributeName);
      if (value && value.trim()) {
        return value.trim();
      }
    }

    return "";
  }

  function collectLinkCandidates(selector) {
    return Array.from(document.querySelectorAll(selector))
      .map((element) => ({
        href: element.getAttribute("href"),
        sizes: element.getAttribute("sizes")
      }))
      .filter((entry) => entry.href && entry.href.trim());
  }

  function parseIconSizes(value) {
    if (!value || value.trim().toLowerCase() === "any") {
      return [];
    }

    return value
      .split(/\s+/)
      .map((token) => {
        const match = token.match(/(\d+)\s*[xX]\s*(\d+)/);
        if (!match) {
          return null;
        }

        const width = Number.parseInt(match[1], 10);
        const height = Number.parseInt(match[2], 10);

        if (!Number.isFinite(width) || !Number.isFinite(height)) {
          return null;
        }

        return Math.max(width, height);
      })
      .filter((size) => Number.isFinite(size));
  }

  function selectIconHref(links, preferLargest) {
    if (!Array.isArray(links) || links.length === 0) {
      return "";
    }

    let selected = null;
    let selectedSize = preferLargest ? -1 : Number.POSITIVE_INFINITY;

    links.forEach((link) => {
      const sizes = parseIconSizes(link.sizes);
      const size = sizes.length
        ? preferLargest
          ? Math.max(...sizes)
          : Math.min(...sizes)
        : null;

      if (size === null) {
        if (!selected) {
          selected = link;
        }
        return;
      }

      const shouldReplace = preferLargest ? size > selectedSize : size < selectedSize;
      if (shouldReplace) {
        selected = link;
        selectedSize = size;
      }
    });

    return selected ? selected.href : links[0].href;
  }

  function resolveUrl(value, baseUrl) {
    if (typeof value !== "string") {
      return "";
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    if (trimmed.startsWith("data:image/")) {
      return trimmed;
    }

    if (trimmed.startsWith("blob:")) {
      return "";
    }

    try {
      return new URL(trimmed, baseUrl).toString();
    } catch (error) {
      return "";
    }
  }

  function getElementKeywords(element) {
    if (!element) {
      return "";
    }

    return [
      element.getAttribute("class"),
      element.getAttribute("id"),
      element.getAttribute("aria-label"),
      element.getAttribute("data-testid"),
      element.getAttribute("role")
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function isFooterContext(element) {
    if (!element || typeof element.closest !== "function") {
      return false;
    }

    return Boolean(
      element.closest(
        "footer, [role=\"contentinfo\"], [class*=\"footer\" i], [id*=\"footer\" i]"
      )
    );
  }

  function hasLogoAncestor(element) {
    if (!element || typeof element.closest !== "function") {
      return false;
    }

    const logoElement = element.closest(
      '[class*="logo" i], [id*="logo" i], [aria-label*="logo" i], [data-testid*="logo" i]'
    );

    if (!logoElement) {
      return false;
    }

    const keywords = getElementKeywords(logoElement);
    if (keywords.includes("search")) {
      return false;
    }

    return true;
  }

  function isSearchContext(element) {
    if (!element) {
      return false;
    }

    const keywords = getElementKeywords(element);
    if (keywords.includes("search")) {
      return !hasLogoAncestor(element);
    }

    const searchAncestor = element.closest(
      '[class*="search" i], [id*="search" i], [aria-label*="search" i], [role="search" i], form[action*="search" i]'
    );

    if (searchAncestor) {
      return !hasLogoAncestor(element);
    }

    return false;
  }

  function getElementTopRatio(element) {
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return null;
    }

    const rect = element.getBoundingClientRect();
    const absoluteTop = rect.top + (window.scrollY || 0);
    const docHeight = Math.max(
      document.documentElement?.scrollHeight || 0,
      document.body?.scrollHeight || 0,
      window.innerHeight || 0
    );

    if (!docHeight) {
      return null;
    }

    return absoluteTop / docHeight;
  }

  function getElementTopScore(element) {
    const ratio = getElementTopRatio(element);

    if (ratio === null) {
      return 0;
    }

    if (ratio <= 0.2) {
      return 3;
    }

    if (ratio <= 0.5) {
      return 1;
    }

    if (ratio >= 0.8) {
      return -3;
    }

    return 0;
  }

  function getElementArea(element) {
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return 0;
    }

    const rect = element.getBoundingClientRect();
    return rect.width * rect.height;
  }

  function getElementRect(element) {
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return null;
    }

    const rect = element.getBoundingClientRect();
    if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height)) {
      return null;
    }

    return rect;
  }

  function normalizePathname(pathname) {
    if (!pathname) {
      return "/";
    }

    const trimmed = pathname.trim();
    if (!trimmed) {
      return "/";
    }

    const normalized = trimmed.endsWith("/") && trimmed.length > 1
      ? trimmed.slice(0, -1)
      : trimmed;

    return normalized || "/";
  }

  function isHomeLinkElement(element) {
    if (!element || typeof element.closest !== "function") {
      return false;
    }

    const anchor = element.closest("a");
    if (!anchor) {
      return false;
    }

    const label = (
      anchor.getAttribute("aria-label") ||
      anchor.getAttribute("title") ||
      ""
    ).toLowerCase();

    if (label.includes("home")) {
      return true;
    }

    const href = (anchor.getAttribute("href") || "").trim();
    if (!href || href.startsWith("#")) {
      return false;
    }

    const homePaths = new Set(["/", "/home", "/main"]);

    try {
      const resolved = new URL(href, location.href);
      if (resolved.origin !== location.origin) {
        return false;
      }

      return homePaths.has(normalizePathname(resolved.pathname));
    } catch (error) {
      if (href.startsWith("/")) {
        return homePaths.has(normalizePathname(href));
      }
      return false;
    }
  }

  function splitCssLayers(value) {
    if (typeof value !== "string") {
      return [];
    }

    const layers = [];
    let current = "";
    let depth = 0;
    let quote = null;

    for (let index = 0; index < value.length; index += 1) {
      const char = value[index];

      if (quote) {
        if (char === quote && value[index - 1] !== "\\") {
          quote = null;
        }
        current += char;
        continue;
      }

      if (char === "\"" || char === "'") {
        quote = char;
        current += char;
        continue;
      }

      if (char === "(") {
        depth += 1;
        current += char;
        continue;
      }

      if (char === ")") {
        depth = Math.max(0, depth - 1);
        current += char;
        continue;
      }

      if (char === "," && depth === 0) {
        if (current.trim()) {
          layers.push(current.trim());
        }
        current = "";
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      layers.push(current.trim());
    }

    return layers;
  }

  function extractBackgroundImageUrls(styleValue) {
    if (!styleValue || styleValue === "none") {
      return [];
    }

    const layers = splitCssLayers(styleValue);
    const results = [];

    layers.forEach((layer, index) => {
      const match = /url\((['"]?)(.*?)\1\)/i.exec(layer);
      const url = match && match[2] ? match[2].trim() : "";
      if (url) {
        results.push({ url, layerIndex: index });
      }
    });

    return results;
  }

  function getCssImageUrlsForElement(element) {
    if (!element || typeof window.getComputedStyle !== "function") {
      return [];
    }

    const entries = [];
    const pseudoSelectors = [null, "::before", "::after"];

    pseudoSelectors.forEach((pseudo) => {
      const style = pseudo ? window.getComputedStyle(element, pseudo) : window.getComputedStyle(element);
      if (!style) {
        return;
      }

      const backgroundEntries = extractBackgroundImageUrls(style.backgroundImage);
      backgroundEntries.forEach((entry) => {
        entries.push({
          url: entry.url,
          layerIndex: entry.layerIndex,
          style
        });
      });
    });

    return entries;
  }

  function normalizeLogoText(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.replace(/\s+/g, " ").trim();
  }

  function svgToDataUrl(svgElement) {
    if (!svgElement) {
      return "";
    }

    const clone = svgElement.cloneNode(true);

    if (clone && !clone.getAttribute("xmlns")) {
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;
  }

  function getImageLogoScore(imageElement, normalizedName) {
    if (!imageElement || isSearchContext(imageElement)) {
      return -1;
    }

    if (isFooterContext(imageElement)) {
      return -1;
    }

    let score = 0;
    const area = getElementArea(imageElement);

    if (area) {
      if (area >= 800) {
        score += 1;
      }

      if (area < 200) {
        score -= 1;
      }
    }

    const keywords = getElementKeywords(imageElement);
    if (keywords.includes("logo") || keywords.includes("brand")) {
      score += 2;
    }

    if (hasLogoAncestor(imageElement)) {
      score += 3;
    }

    if (imageElement.closest("header, nav, [role=\"banner\"]")) {
      score += 2;
    }

    const altText = (imageElement.getAttribute("alt") || "").trim().toLowerCase();
    if (normalizedName && altText) {
      if (altText.includes(normalizedName) || normalizedName.includes(altText)) {
        score += 3;
      }

      if (altText.includes("logo")) {
        score += 1;
      }
    }

    score += getElementTopScore(imageElement);

    return score;
  }

  function findImageLogo() {
    const selectors = [
      'header a[class*="logo" i] img',
      'header a[aria-label*="home" i] img',
      'header img[src*="logo" i]',
      'header [class*="logo" i] img',
      'header [id*="logo" i] img',
      'a[class*="logo" i] img',
      'a[aria-label*="home" i] img',
      '[class*="logo" i] img',
      '[id*="logo" i] img',
      '[class*="brand" i] img',
      'img[src*="logo" i]',
      'img[data-src*="logo" i]',
      'img[alt*="logo" i]',
      'img[class*="logo" i]',
      'img[id*="logo" i]'
    ];

    const candidates = new Set();

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        candidates.add(element);
      }
    }

    let bestCandidate = null;
    let bestScore = 0;
    const normalizedName = extractedName ? extractedName.trim().toLowerCase() : "";

    candidates.forEach((element) => {
      const score = getImageLogoScore(element, normalizedName);
      if (score <= -1) {
        return;
      }
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = element;
      }
    });

    if (!bestCandidate) {
      return { url: "", score: Number.NEGATIVE_INFINITY };
    }

    const src =
      bestCandidate.getAttribute("src") || bestCandidate.getAttribute("data-src");
    if (src && src.trim()) {
      return { url: src.trim(), score: bestScore };
    }

    const srcset = bestCandidate.getAttribute("srcset");
    if (srcset) {
      const firstCandidate = srcset.split(",")[0] || "";
      const url = firstCandidate.trim().split(/\s+/)[0];
      if (url) {
        return { url, score: bestScore };
      }
    }

    return { url: "", score: bestScore };
  }

  function getBackgroundLogoScore(element, normalizedName) {
    if (!element || isSearchContext(element)) {
      return -1;
    }

    if (isFooterContext(element)) {
      return -1;
    }

    let score = 0;
    const area = getElementArea(element);

    if (area) {
      if (area >= 800) {
        score += 1;
      }

      if (area < 200) {
        score -= 1;
      }
    }

    const keywords = getElementKeywords(element);
    if (keywords.includes("logo") || keywords.includes("brand")) {
      score += 2;
    }

    if (hasLogoAncestor(element)) {
      score += 2;
    }

    if (element.closest("header, nav, [role=\"banner\"]")) {
      score += 2;
    }

    const elementText = normalizeLogoText(element.textContent || "");
    if (normalizedName && elementText) {
      const textLower = elementText.toLowerCase();
      if (textLower.includes(normalizedName) || normalizedName.includes(textLower)) {
        score += 3;
      }
    }

    score += getElementTopScore(element);

    return score;
  }

  function findBackgroundLogo(extractedName) {
    const selectors = [
      'header [class*="logo" i]',
      'header [id*="logo" i]',
      '[class*="logo" i]',
      '[id*="logo" i]',
      '[class*="brand" i]',
      '[id*="brand" i]',
      '[data-testid*="logo" i]',
      '[aria-label*="logo" i]'
    ];

    const candidates = new Set();
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        candidates.add(element);
      });
    });

    let bestUrl = "";
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestMeta = null;
    const normalizedName = extractedName ? extractedName.trim().toLowerCase() : "";
    const maxDescendantChecks = 60;

    candidates.forEach((element) => {
      const elementsToCheck = [element];
      const descendants = Array.from(element.querySelectorAll("*"));
      if (descendants.length > maxDescendantChecks) {
        descendants.length = maxDescendantChecks;
      }
      elementsToCheck.push(...descendants);

      elementsToCheck.forEach((node) => {
        const cssEntries = getCssImageUrlsForElement(node);
        if (cssEntries.length === 0) {
          return;
        }

        const score = getBackgroundLogoScore(node, normalizedName);
        if (score <= -1) {
          return;
        }

        const rect = node.getBoundingClientRect();

        cssEntries.forEach((entry) => {
          const url = entry.url;
          if (!url) {
            return;
          }

          if (score > bestScore) {
            bestScore = score;
            bestUrl = url;
            bestMeta = {
              type: "css-background",
              backgroundLayerIndex: entry.layerIndex,
              backgroundSize: entry.style ? entry.style.backgroundSize : "",
              backgroundPosition: entry.style ? entry.style.backgroundPosition : "",
              backgroundPositionX: entry.style ? entry.style.backgroundPositionX : "",
              backgroundPositionY: entry.style ? entry.style.backgroundPositionY : "",
              backgroundRepeat: entry.style ? entry.style.backgroundRepeat : "",
              elementWidth: Math.round(rect.width || 0),
              elementHeight: Math.round(rect.height || 0)
            };
          }
        });
      });
    });

    if (!bestUrl) {
      return { url: "", score: Number.NEGATIVE_INFINITY, meta: null };
    }

    return { url: bestUrl, score: bestScore, meta: bestMeta };
  }

  function getSvgLogoScore(svgElement, normalizedName) {
    if (!svgElement || isSearchContext(svgElement)) {
      return -1;
    }

    if (isFooterContext(svgElement)) {
      return -1;
    }

    const area = getElementArea(svgElement);
    if (!area || area < 900) {
      return -1;
    }

    let score = 0;
    if (area) {
      score += Math.min(area / 1000, 6);
    }

    const rect = getElementRect(svgElement);
    if (rect && rect.height > 0) {
      const ratio = rect.width / rect.height;
      if (ratio >= 1.6) {
        score += 1;
      } else if (ratio <= 0.6) {
        score -= 1;
      }
    }

    const keywords = getElementKeywords(svgElement);
    if (keywords.includes("logo") || keywords.includes("brand")) {
      score += 3;
    }

    if (
      svgElement.closest(
        'a[class*="logo" i], a[aria-label*="logo" i], a[aria-label*="home" i]'
      ) ||
      isHomeLinkElement(svgElement)
    ) {
      score += 3;
    }

    if (svgElement.closest("header, nav, [role=\"banner\"]")) {
      score += 1;
    }

    const titleNode = svgElement.querySelector("title");
    if (normalizedName && titleNode) {
      const titleText = (titleNode.textContent || "").trim().toLowerCase();
      if (titleText && (titleText.includes(normalizedName) || normalizedName.includes(titleText))) {
        score += 4;
      }
    }

    if (svgElement.getAttribute("aria-hidden") === "true") {
      score -= 0.5;
    }

    score += getElementTopScore(svgElement);

    return score;
  }

  function findInlineSvgLogo(extractedName) {
    const selectors = [
      "header svg[data-testid*=\"logo\" i]",
      "header svg[aria-label*=\"logo\" i]",
      "header svg[class*=\"logo\" i]",
      "header svg[id*=\"logo\" i]",
      "header svg",
      "nav svg",
      "[role=\"banner\"] svg",
      "svg[data-testid*=\"logo\" i]",
      "svg[aria-label*=\"logo\" i]",
      "svg[class*=\"logo\" i]",
      "svg[id*=\"logo\" i]"
    ];

    const normalizedName = extractedName ? extractedName.trim().toLowerCase() : "";
    const candidates = new Set();

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        candidates.add(element);
      });
    });

    if (normalizedName) {
      const titleNodes = document.querySelectorAll("svg title");
      for (const titleNode of titleNodes) {
        const text = (titleNode.textContent || "").trim().toLowerCase();
        if (text && (text.includes(normalizedName) || normalizedName.includes(text))) {
          const svgElement = titleNode.closest("svg");
          if (svgElement) {
            candidates.add(svgElement);
          }
        }
      }
    }

    let bestCandidate = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    candidates.forEach((svgElement) => {
      const score = getSvgLogoScore(svgElement, normalizedName);
      if (score <= -1) {
        return;
      }
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = svgElement;
      }
    });

    if (!bestCandidate) {
      return { url: "", score: Number.NEGATIVE_INFINITY };
    }

    return { url: svgToDataUrl(bestCandidate), score: bestScore };
  }

  const pageUrl = location.href || "";
  const baseUrl = document.baseURI || pageUrl || "";

  const nameCandidates = [
    getMetaContent([
      'meta[property="og:site_name" i]',
      'meta[name="application-name" i]',
      'meta[name="apple-mobile-web-app-title" i]'
    ]),
    getMetaContent([
      'meta[property="og:title" i]',
      'meta[name="twitter:title" i]'
    ]),
    typeof document.title === "string" ? document.title : ""
  ];

  let extractedName = "";

  for (const candidate of nameCandidates) {
    const trimmed = candidate.trim();
    if (trimmed) {
      extractedName = trimmed;
      break;
    }
  }

  if (!extractedName && pageUrl) {
    try {
      extractedName = new URL(pageUrl).hostname.replace(/^www\./i, "");
    } catch (error) {
      extractedName = "";
    }
  }

  const metaLogo = getMetaContent([
    'meta[property="og:logo" i]',
    'meta[name="logo" i]',
    'meta[itemprop="logo" i]'
  ]);
  const linkLogo = getFirstAttributeValue(['link[rel~="logo" i]'], "href");
  const imageLogoResult = findImageLogo();
  const appleLinks = collectLinkCandidates('link[rel~="apple-touch-icon" i]');
  const appleHref = selectIconHref(appleLinks, true);
  const ogImage = getMetaContent([
    'meta[property="og:image" i]',
    'meta[property="og:image:url" i]',
    'meta[property="og:image:secure_url" i]',
    'meta[name="twitter:image" i]',
    'meta[name="twitter:image:src" i]'
  ]);
  const iconLinks = collectLinkCandidates(
    'link[rel~="icon" i], link[rel~="shortcut" i]'
  );
  const iconHref = selectIconHref(iconLinks, true);
  const inlineSvgLogoResult = findInlineSvgLogo(extractedName);
  const backgroundLogoResult = findBackgroundLogo(extractedName);

  const scoredLogoResults = [
    { ...imageLogoResult, priority: 3 },
    { ...inlineSvgLogoResult, priority: 4 },
    { ...backgroundLogoResult, priority: 2, meta: backgroundLogoResult.meta || null }
  ].filter((result) => result.url);

  scoredLogoResults.sort((a, b) => {
    const scoreDelta = b.score - a.score;
    if (scoreDelta !== 0) {
      return scoreDelta;
    }
    return b.priority - a.priority;
  });

  const logoCandidates = [
    ...scoredLogoResults.map((result) => ({
      url: result.url,
      meta: result.meta || null
    })),
    { url: metaLogo, meta: null },
    { url: linkLogo, meta: null },
    { url: appleHref, meta: null },
    { url: ogImage, meta: null },
    { url: iconHref, meta: null }
  ];

  let logoUrl = "";
  let logoMeta = null;
  for (const candidate of logoCandidates) {
    const resolved = resolveUrl(candidate.url, baseUrl);
    if (resolved) {
      logoUrl = resolved;
      logoMeta = candidate.meta;
      break;
    }
  }

  const faviconLinks = collectLinkCandidates(
    'link[rel~="icon" i], link[rel~="shortcut" i], link[rel~="mask-icon" i]'
  );
  const faviconHref = selectIconHref(faviconLinks, false);
  const appleSmallHref = selectIconHref(appleLinks, false);

  const faviconCandidates = [faviconHref, appleSmallHref];
  let faviconUrl = "";

  for (const candidate of faviconCandidates) {
    const resolved = resolveUrl(candidate, baseUrl);
    if (resolved) {
      faviconUrl = resolved;
      break;
    }
  }

  if (!faviconUrl && pageUrl) {
    try {
      faviconUrl = new URL("/favicon.ico", pageUrl).toString();
    } catch (error) {
      faviconUrl = "";
    }
  }

  return {
    extractedName,
    logoUrl,
    logoMeta,
    faviconUrl,
    pageUrl
  };
}

function isRestrictedTabUrl(url) {
  if (!url) {
    return false;
  }

  return !/^https?:/i.test(url);
}

function describeActiveTabFailure(url) {
  if (!url) {
    return "Open a website tab to auto grab branding.";
  }

  if (/^(chrome|edge|about|moz-extension|chrome-extension):/i.test(url)) {
    return "Active tab is a browser page. Open a website and try again.";
  }

  if (/^file:/i.test(url)) {
    return "Active tab is a local file. Open a website and try again.";
  }

  return "Active tab cannot be accessed. Open a website and try again.";
}

async function autoFillFromActiveTab() {
  if (autoFillInProgress) {
    return;
  }

  autoFillInProgress = true;
  autoFillSequence += 1;
  const currentSequence = autoFillSequence;

  setAutoFillButtonsDisabled(true);
  setAutoGrabStatus("Reading branding from the active tab...");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (currentSequence !== autoFillSequence) {
      return;
    }

    if (chrome.runtime.lastError) {
      console.error("Unable to read active tab", chrome.runtime.lastError);
      setAutoGrabStatus("Unable to read the active tab.", true);
      finalizeAutoFill(currentSequence);
      return;
    }

    const tab = Array.isArray(tabs) ? tabs[0] : null;

    if (!tab || !tab.id) {
      setAutoGrabStatus(describeActiveTabFailure(tab?.url), true);
      finalizeAutoFill(currentSequence);
      return;
    }

    if (tab.url && isRestrictedTabUrl(tab.url)) {
      setAutoGrabStatus(describeActiveTabFailure(tab.url), true);
      finalizeAutoFill(currentSequence);
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: collectBrandingFromActiveTab
      },
      async (results) => {
        if (currentSequence !== autoFillSequence) {
          return;
        }

        if (chrome.runtime.lastError) {
          console.error("Unable to read branding from active tab", chrome.runtime.lastError);
          setAutoGrabStatus(describeActiveTabFailure(tab.url), true);
          finalizeAutoFill(currentSequence);
          return;
        }

        const payload =
          Array.isArray(results) && results[0] ? results[0].result : null;

        if (!payload) {
          setAutoGrabStatus("No branding data found on the active tab.", true);
          finalizeAutoFill(currentSequence);
          return;
        }

        try {
          const { updates, found, issues } = await buildAutoFillUpdates({
            extractedName: payload.extractedName,
            logoUrl: payload.logoUrl,
            faviconUrl: payload.faviconUrl,
            logoMeta: payload.logoMeta
          });

          if (Object.keys(updates).length > 0) {
            const updatedState = buildUpdatedState(updates);
            applyState(updatedState);
          }

          if (Object.prototype.hasOwnProperty.call(updates, RETAILER_NAME_STORAGE_KEY)) {
            persistRetailerName(updates.retailerName);
          }

          if (Object.prototype.hasOwnProperty.call(updates, CUSTOM_LOGO_STORAGE_KEY)) {
            persistCustomLogo(
              updates.customLogoDataUrl,
              updates.customLogoInvert
            );
          }

          if (
            Object.prototype.hasOwnProperty.call(updates, CUSTOM_FAVICON_STORAGE_KEY)
          ) {
            persistCustomFavicon(updates.customFaviconDataUrl);
          }

          if (found.length === 0) {
            setAutoGrabStatus("No branding assets found on the active tab.", true);
          } else {
            const messageParts = [`Auto-filled ${formatFeatureList(found)}.`];
            if (issues.length > 0) {
              messageParts.push(issues.join(" "));
            }
            setAutoGrabStatus(messageParts.join(" "));
          }
        } catch (error) {
          console.error("Unable to auto fill branding from active tab", error);
          setAutoGrabStatus("Unable to fetch branding from the active tab.", true);
        } finally {
          finalizeAutoFill(currentSequence);
        }
      }
    );
  });
}

logoToggle.addEventListener("change", () => {
  const newState = {
    ...state,
    logoEnabled: logoToggle.checked
  };

  applyState(newState);
  persistState(newState);
});

faviconToggle.addEventListener("change", () => {
  const newState = {
    ...state,
    faviconEnabled: faviconToggle.checked
  };

  applyState(newState);
  persistState(newState);
});

textToggle.addEventListener("change", () => {
  const newState = {
    ...state,
    textEnabled: textToggle.checked
  };

  applyState(newState);
  persistState(newState);
});

retailerTabAutoButton.addEventListener("click", () => {
  autoFillFromActiveTab();
});

retailerNameInput.addEventListener("change", () => {
  const newName = normalizeRetailerName(retailerNameInput.value);
  const newState = {
    ...state,
    retailerName: newName
  };

  applyState(newState);
  persistRetailerName(newName);
});

if (currencySelect) {
  currencySelect.addEventListener("change", () => {
    void applySelectedCurrency(currencySelect.value);
  });
}

customLogoInput.addEventListener("change", () => {
  const file = customLogoInput.files && customLogoInput.files[0];

  if (!file) {
    return;
  }

  if (!file.type || !file.type.startsWith("image/")) {
    setCustomLogoStatus("Please choose an image file.", true);
    customLogoInput.value = "";
    return;
  }

  if (file.size > MAX_CUSTOM_LOGO_BYTES) {
    setCustomLogoStatus("Image too large. Use a file under 2 MB.", true);
    customLogoInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    const dataUrl = typeof reader.result === "string" ? reader.result : null;

    if (!dataUrl) {
      setCustomLogoStatus("Unable to read the image file.", true);
      return;
    }

    const newState = {
      ...state,
      customLogoDataUrl: dataUrl,
      customLogoInvert: false
    };

    applyState(newState);
    persistCustomLogo(dataUrl, false);
    customLogoInput.value = "";
  });

  reader.addEventListener("error", () => {
    setCustomLogoStatus("Unable to read the image file.", true);
  });

  reader.readAsDataURL(file);
});

customLogoClearButton.addEventListener("click", () => {
  customLogoInput.value = "";

  const newState = {
    ...state,
    customLogoDataUrl: null,
    customLogoInvert: false
  };

  applyState(newState);
  persistCustomLogo(null, false);
});

customFaviconInput.addEventListener("change", () => {
  const file = customFaviconInput.files && customFaviconInput.files[0];

  if (!file) {
    return;
  }

  if (!file.type || !file.type.startsWith("image/")) {
    setCustomFaviconStatus("Please choose an image file.", true);
    customFaviconInput.value = "";
    return;
  }

  if (file.size > MAX_CUSTOM_FAVICON_BYTES) {
    setCustomFaviconStatus("Image too large. Use a file under 512 KB.", true);
    customFaviconInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    const dataUrl = typeof reader.result === "string" ? reader.result : null;

    if (!dataUrl) {
      setCustomFaviconStatus("Unable to read the image file.", true);
      return;
    }

    const newState = {
      ...state,
      customFaviconDataUrl: dataUrl
    };

    applyState(newState);
    persistCustomFavicon(dataUrl);
    customFaviconInput.value = "";
  });

  reader.addEventListener("error", () => {
    setCustomFaviconStatus("Unable to read the image file.", true);
  });

  reader.readAsDataURL(file);
});

customFaviconClearButton.addEventListener("click", () => {
  customFaviconInput.value = "";

  const newState = {
    ...state,
    customFaviconDataUrl: null
  };

  applyState(newState);
  persistCustomFavicon(null);
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
    updateState(update);
  }
});

syncStateWithStorage();
void checkForExtensionUpdates();
