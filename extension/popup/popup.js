const logoToggle = document.getElementById("logo-toggle");
const faviconToggle = document.getElementById("favicon-toggle");
const textToggle = document.getElementById("text-toggle");
const statusElement = document.getElementById("status");
const retailerUrlInput = document.getElementById("retailer-url-input");
const retailerUrlAutoButton = document.getElementById("retailer-url-auto");
const retailerUrlStatus = document.getElementById("retailer-url-status");
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

const CUSTOM_LOGO_STORAGE_KEY = "customLogoDataUrl";
const CUSTOM_FAVICON_STORAGE_KEY = "customFaviconDataUrl";
const RETAILER_NAME_STORAGE_KEY = "retailerName";
const RETAILER_URL_STORAGE_KEY = "retailerUrl";
const DEFAULT_RETAILER_NAME = "demo retailer";
const DEFAULT_RETAILER_URL = "";
const DEFAULT_FAVICON_ENABLED = false;
const MAX_CUSTOM_LOGO_BYTES = 1024 * 1024 * 2;
const MAX_CUSTOM_FAVICON_BYTES = 1024 * 512;

const state = {
  logoEnabled: false,
  faviconEnabled: DEFAULT_FAVICON_ENABLED,
  textEnabled: false,
  customLogoDataUrl: null,
  customFaviconDataUrl: null,
  retailerName: DEFAULT_RETAILER_NAME,
  retailerUrl: DEFAULT_RETAILER_URL
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

function normalizeRetailerUrl(value) {
  if (typeof value !== "string") {
    return DEFAULT_RETAILER_URL;
  }

  return value.trim();
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

function setRetailerUrlStatus(message, isError = false) {
  retailerUrlStatus.textContent = message;

  if (isError) {
    retailerUrlStatus.setAttribute("data-error", "true");
  } else {
    retailerUrlStatus.removeAttribute("data-error");
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
  state.customLogoDataUrl = normalizeCustomLogoDataUrl(newState.customLogoDataUrl);
  state.customFaviconDataUrl = normalizeCustomFaviconDataUrl(
    newState.customFaviconDataUrl
  );
  state.retailerName = normalizeRetailerName(newState.retailerName);
  state.retailerUrl = normalizeRetailerUrl(newState.retailerUrl);

  logoToggle.checked = state.logoEnabled;
  faviconToggle.checked = state.faviconEnabled;
  textToggle.checked = state.textEnabled;

  if (document.activeElement !== retailerNameInput) {
    retailerNameInput.value = state.retailerName;
  }

  if (document.activeElement !== retailerUrlInput) {
    retailerUrlInput.value = state.retailerUrl;
  }

  statusElement.textContent = getStatusMessage(state);
  updateCustomLogoUi();
  updateCustomFaviconUi();
}

function buildUpdatedState(partial) {
  const newState = {
    logoEnabled: state.logoEnabled,
    faviconEnabled: state.faviconEnabled,
    textEnabled: state.textEnabled,
    customLogoDataUrl: state.customLogoDataUrl,
    customFaviconDataUrl: state.customFaviconDataUrl,
    retailerName: state.retailerName,
    retailerUrl: state.retailerUrl
  };

  const hasLogo = Object.prototype.hasOwnProperty.call(partial, "logoEnabled");
  const hasFavicon = Object.prototype.hasOwnProperty.call(partial, "faviconEnabled");
  const hasText = Object.prototype.hasOwnProperty.call(partial, "textEnabled");
  const hasCustomLogo = Object.prototype.hasOwnProperty.call(
    partial,
    CUSTOM_LOGO_STORAGE_KEY
  );
  const hasCustomFavicon = Object.prototype.hasOwnProperty.call(
    partial,
    CUSTOM_FAVICON_STORAGE_KEY
  );
  const hasRetailerName = Object.prototype.hasOwnProperty.call(
    partial,
    RETAILER_NAME_STORAGE_KEY
  );
  const hasRetailerUrl = Object.prototype.hasOwnProperty.call(
    partial,
    RETAILER_URL_STORAGE_KEY
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

  if (hasCustomFavicon) {
    newState.customFaviconDataUrl = partial.customFaviconDataUrl;
  }

  if (hasRetailerName) {
    newState.retailerName = partial.retailerName;
  }

  if (hasRetailerUrl) {
    newState.retailerUrl = partial.retailerUrl;
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
      retailerUrl: DEFAULT_RETAILER_URL
    },
    (result) => {
      chrome.storage.local.get(
        { customLogoDataUrl: null, customFaviconDataUrl: null },
        (localResult) => {
          updateState({
            ...result,
            customLogoDataUrl: localResult.customLogoDataUrl,
            customFaviconDataUrl: localResult.customFaviconDataUrl
          });
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

function persistCustomLogo(dataUrl) {
  chrome.storage.local.set(
    {
      customLogoDataUrl: dataUrl
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

function persistRetailerUrl(url) {
  chrome.storage.sync.set(
    {
      retailerUrl: url
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Unable to persist retailer URL", chrome.runtime.lastError);
        syncStateWithStorage();
      }
    }
  );
}

let autoFillInProgress = false;
let autoFillSequence = 0;

function parseRetailerUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  let candidate = trimmed;

  if (candidate.startsWith("//")) {
    candidate = `https:${candidate}`;
  }

  const hasScheme = /^https?:\/\//i.test(candidate);

  if (!hasScheme) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname || !["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

function getMetaContent(document, selectors) {
  if (!document) {
    return "";
  }

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

function getFirstAttributeValue(document, selectors, attributeName) {
  if (!document) {
    return "";
  }

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

function collectLinkCandidates(document, selector) {
  if (!document) {
    return [];
  }

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

function getBaseUrl(document, fallbackUrl) {
  const baseHref = getFirstAttributeValue(document, ["base[href]"], "href");

  if (baseHref) {
    try {
      return new URL(baseHref, fallbackUrl).toString();
    } catch (error) {
      return fallbackUrl;
    }
  }

  return fallbackUrl;
}

function resolveUrl(value, baseUrl) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch (error) {
    return null;
  }
}

function extractRetailerName(document, parsedUrl) {
  const candidates = [
    getMetaContent(document, [
      'meta[property="og:site_name" i]',
      'meta[name="application-name" i]',
      'meta[name="apple-mobile-web-app-title" i]'
    ]),
    getMetaContent(document, [
      'meta[property="og:title" i]',
      'meta[name="twitter:title" i]'
    ]),
    typeof document?.title === "string" ? document.title : ""
  ];

  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  if (parsedUrl && parsedUrl.hostname) {
    return parsedUrl.hostname.replace(/^www\./i, "");
  }

  return "";
}

function extractLogoUrl(document, baseUrl) {
  const metaLogo = getMetaContent(document, [
    'meta[property="og:logo" i]',
    'meta[name="logo" i]',
    'meta[itemprop="logo" i]'
  ]);
  const linkLogo = getFirstAttributeValue(
    document,
    ['link[rel~="logo" i]'],
    "href"
  );
  const imageLogo = getFirstAttributeValue(
    document,
    [
      'img[alt*="logo" i]',
      'img[class*="logo" i]',
      'img[id*="logo" i]'
    ],
    "src"
  );
  const appleLinks = collectLinkCandidates(
    document,
    'link[rel~="apple-touch-icon" i]'
  );
  const appleHref = selectIconHref(appleLinks, true);
  const ogImage = getMetaContent(document, [
    'meta[property="og:image" i]',
    'meta[property="og:image:url" i]',
    'meta[property="og:image:secure_url" i]',
    'meta[name="twitter:image" i]',
    'meta[name="twitter:image:src" i]'
  ]);
  const iconLinks = collectLinkCandidates(
    document,
    'link[rel~="icon" i], link[rel~="shortcut" i]'
  );
  const iconHref = selectIconHref(iconLinks, true);

  const candidates = [
    metaLogo,
    linkLogo,
    imageLogo,
    appleHref,
    ogImage,
    iconHref
  ];

  for (const candidate of candidates) {
    const resolved = resolveUrl(candidate, baseUrl);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function extractFaviconUrl(document, baseUrl, parsedUrl) {
  const iconLinks = collectLinkCandidates(
    document,
    'link[rel~="icon" i], link[rel~="shortcut" i], link[rel~="mask-icon" i]'
  );
  const iconHref = selectIconHref(iconLinks, false);
  if (iconHref) {
    const resolved = resolveUrl(iconHref, baseUrl);
    if (resolved) {
      return resolved;
    }
  }

  const appleLinks = collectLinkCandidates(
    document,
    'link[rel~="apple-touch-icon" i]'
  );
  const appleHref = selectIconHref(appleLinks, false);
  if (appleHref) {
    const resolved = resolveUrl(appleHref, baseUrl);
    if (resolved) {
      return resolved;
    }
  }

  if (parsedUrl && parsedUrl.origin) {
    return new URL("/favicon.ico", parsedUrl.origin).toString();
  }

  return null;
}

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

async function fetchRetailerDocument(url) {
  const response = await fetch(url, { redirect: "follow" });

  if (!response.ok) {
    throw new Error(`Unable to fetch retailer URL (status ${response.status})`);
  }

  const html = await response.text();
  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  const finalUrl = response.url || url;
  const baseUrl = getBaseUrl(document, finalUrl);

  return { document, baseUrl, finalUrl };
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

async function autoFillFromRetailerUrl() {
  if (autoFillInProgress) {
    return;
  }

  const rawValue = retailerUrlInput.value ?? "";

  if (!rawValue.trim()) {
    const newState = {
      ...state,
      retailerUrl: DEFAULT_RETAILER_URL
    };

    applyState(newState);
    persistRetailerUrl(DEFAULT_RETAILER_URL);
    setRetailerUrlStatus("Enter a retailer URL to auto fill branding.");
    return;
  }

  const parsedUrl = parseRetailerUrl(rawValue);

  if (!parsedUrl) {
    setRetailerUrlStatus("Enter a valid URL to auto fill branding.", true);
    return;
  }

  const normalizedUrl = parsedUrl.toString();
  const newState = {
    ...state,
    retailerUrl: normalizedUrl
  };

  applyState(newState);
  persistRetailerUrl(normalizedUrl);

  autoFillInProgress = true;
  autoFillSequence += 1;
  const currentSequence = autoFillSequence;

  retailerUrlAutoButton.disabled = true;
  setRetailerUrlStatus(`Fetching branding from ${parsedUrl.hostname}...`);

  try {
    const { document, baseUrl } = await fetchRetailerDocument(normalizedUrl);

    if (currentSequence !== autoFillSequence) {
      return;
    }

    const extractedName = extractRetailerName(document, parsedUrl);
    const logoUrl = extractLogoUrl(document, baseUrl);
    const faviconUrl = extractFaviconUrl(document, baseUrl, parsedUrl);

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
      updates.customLogoDataUrl = logoResult.dataUrl;
      found.push("logo");
    } else {
      issues.push(describeImageFailure("Logo", logoResult.error));
    }

    let faviconResult = { dataUrl: null, error: "missing" };
    if (faviconUrl) {
      faviconResult = await fetchImageAsDataUrl(
        faviconUrl,
        MAX_CUSTOM_FAVICON_BYTES
      );
    }

    if (faviconResult.dataUrl) {
      updates.customFaviconDataUrl = faviconResult.dataUrl;
      found.push("favicon");
    } else {
      issues.push(describeImageFailure("Favicon", faviconResult.error));
    }

    if (Object.keys(updates).length > 0) {
      const updatedState = buildUpdatedState(updates);
      applyState(updatedState);
    }

    if (Object.prototype.hasOwnProperty.call(updates, RETAILER_NAME_STORAGE_KEY)) {
      persistRetailerName(updates.retailerName);
    }

    if (Object.prototype.hasOwnProperty.call(updates, CUSTOM_LOGO_STORAGE_KEY)) {
      persistCustomLogo(updates.customLogoDataUrl);
    }

    if (Object.prototype.hasOwnProperty.call(updates, CUSTOM_FAVICON_STORAGE_KEY)) {
      persistCustomFavicon(updates.customFaviconDataUrl);
    }

    if (found.length === 0) {
      setRetailerUrlStatus("No branding assets found for that URL.", true);
    } else {
      const messageParts = [`Auto-filled ${formatFeatureList(found)}.`];
      if (issues.length > 0) {
        messageParts.push(issues.join(" "));
      }
      setRetailerUrlStatus(messageParts.join(" "));
    }
  } catch (error) {
    console.error("Unable to auto fill branding", error);
    if (currentSequence === autoFillSequence) {
      setRetailerUrlStatus("Unable to fetch branding from that URL.", true);
    }
  } finally {
    if (currentSequence === autoFillSequence) {
      autoFillInProgress = false;
      retailerUrlAutoButton.disabled = false;
    }
  }
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

retailerUrlAutoButton.addEventListener("click", () => {
  autoFillFromRetailerUrl();
});

retailerUrlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    autoFillFromRetailerUrl();
  }
});

retailerUrlInput.addEventListener("change", () => {
  autoFillFromRetailerUrl();
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
      customLogoDataUrl: dataUrl
    };

    applyState(newState);
    persistCustomLogo(dataUrl);
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
    customLogoDataUrl: null
  };

  applyState(newState);
  persistCustomLogo(null);
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

    if (Object.prototype.hasOwnProperty.call(changes, RETAILER_URL_STORAGE_KEY)) {
      update.retailerUrl = changes[RETAILER_URL_STORAGE_KEY].newValue;
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

    if (Object.prototype.hasOwnProperty.call(changes, CUSTOM_FAVICON_STORAGE_KEY)) {
      update.customFaviconDataUrl = changes[CUSTOM_FAVICON_STORAGE_KEY].newValue;
      hasUpdate = true;
    }
  }

  if (hasUpdate) {
    updateState(update);
  }
});

syncStateWithStorage();

