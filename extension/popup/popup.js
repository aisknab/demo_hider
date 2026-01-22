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

const state = {
  logoEnabled: false,
  faviconEnabled: DEFAULT_FAVICON_ENABLED,
  textEnabled: false,
  customLogoDataUrl: null,
  customLogoInvert: false,
  customFaviconDataUrl: null,
  retailerName: DEFAULT_RETAILER_NAME
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

  logoToggle.checked = state.logoEnabled;
  faviconToggle.checked = state.faviconEnabled;
  textToggle.checked = state.textEnabled;

  if (document.activeElement !== retailerNameInput) {
    retailerNameInput.value = state.retailerName;
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
          updateState({
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

async function buildAutoFillUpdates({ extractedName, logoUrl, faviconUrl }) {
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
    updates.customLogoInvert = await shouldInvertLogoDataUrl(logoResult.dataUrl);
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

  function getElementArea(element) {
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return 0;
    }

    const rect = element.getBoundingClientRect();
    return rect.width * rect.height;
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

  function findImageLogo() {
    const selectors = [
      'header a[class*="logo" i] img',
      'header a[aria-label*="home" i] img',
      'header img[src*="logo" i]',
      'a[class*="logo" i] img',
      'a[aria-label*="home" i] img',
      'img[src*="logo" i]',
      'img[data-src*="logo" i]',
      'img[alt*="logo" i]',
      'img[class*="logo" i]',
      'img[id*="logo" i]'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (isSearchContext(element)) {
          continue;
        }

        const src =
          element.getAttribute("src") || element.getAttribute("data-src");
        if (src && src.trim()) {
          return src.trim();
        }

        const srcset = element.getAttribute("srcset");
        if (srcset) {
          const firstCandidate = srcset.split(",")[0] || "";
          const url = firstCandidate.trim().split(/\s+/)[0];
          if (url) {
            return url;
          }
        }
      }
    }

    return "";
  }

  function getSvgLogoScore(svgElement, normalizedName) {
    if (!svgElement || isSearchContext(svgElement)) {
      return -1;
    }

    const area = getElementArea(svgElement);
    if (area && area < 900) {
      return -1;
    }

    let score = 0;
    if (area) {
      score += Math.min(area / 1000, 6);
    }

    const keywords = getElementKeywords(svgElement);
    if (keywords.includes("logo") || keywords.includes("brand")) {
      score += 3;
    }

    if (
      svgElement.closest(
        'a[class*="logo" i], a[aria-label*="logo" i], a[aria-label*="home" i]'
      )
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

    return score;
  }

  function findInlineSvgLogo(extractedName) {
    const selectors = [
      "header svg[data-testid*=\"logo\" i]",
      "header svg[aria-label*=\"logo\" i]",
      "header svg[class*=\"logo\" i]",
      "header svg[id*=\"logo\" i]",
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
    let bestScore = 0;

    candidates.forEach((svgElement) => {
      const score = getSvgLogoScore(svgElement, normalizedName);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = svgElement;
      }
    });

    return bestCandidate ? svgToDataUrl(bestCandidate) : "";
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
  const imageLogo = findImageLogo();
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
  const inlineSvgLogo = findInlineSvgLogo(extractedName);

  const logoCandidates = [
    imageLogo,
    inlineSvgLogo,
    metaLogo,
    linkLogo,
    appleHref,
    ogImage,
    iconHref
  ];

  let logoUrl = "";
  for (const candidate of logoCandidates) {
    const resolved = resolveUrl(candidate, baseUrl);
    if (resolved) {
      logoUrl = resolved;
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
            faviconUrl: payload.faviconUrl
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
    updateState(update);
  }
});

syncStateWithStorage();

