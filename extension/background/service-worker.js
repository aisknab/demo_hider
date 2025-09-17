const ICON_SIZES = [16, 32, 48, 128];
const ICON_THEME = {
  enabled: {
    background: "#199E4D",
    glyph: "#FFFFFF"
  },
  disabled: {
    background: "#6C757D",
    glyph: "#FFFFFF"
  }
};

const ICON_PIXEL_CACHE = (() => {
  function hexToRgbaTuple(hex) {
    let normalized = String(hex).trim();
    if (normalized.startsWith("#")) {
      normalized = normalized.slice(1);
    }

    if (normalized.length === 3) {
      normalized = normalized
        .split("")
        .map((char) => char + char)
        .join("");
    }

    const value = parseInt(normalized, 16);
    return [
      (value >> 16) & 0xff,
      (value >> 8) & 0xff,
      value & 0xff,
      255
    ];
  }

  function createSolidIconPixels(background, size) {
    const [red, green, blue, alpha] = hexToRgbaTuple(background);
    const pixels = new Uint8ClampedArray(size * size * 4);

    for (let index = 0; index < pixels.length; index += 4) {
      pixels[index] = red;
      pixels[index + 1] = green;
      pixels[index + 2] = blue;
      pixels[index + 3] = alpha;
    }

    return pixels;
  }

  function drawIconPixels(background, glyph, size) {
    if (typeof OffscreenCanvas === "undefined") {
      return createSolidIconPixels(background, size);
    }

    const canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext("2d");

    if (!context) {
      return createSolidIconPixels(background, size);
    }

    context.clearRect(0, 0, size, size);
    context.fillStyle = background;
    context.fillRect(0, 0, size, size);

    const fontSize = Math.floor(size * 0.65);
    context.fillStyle = glyph;
    context.font = `600 ${fontSize}px "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("D", size / 2, size / 2 + size * 0.05);

    return new Uint8ClampedArray(context.getImageData(0, 0, size, size).data);
  }

  const cache = { enabled: {}, disabled: {} };

  Object.keys(ICON_THEME).forEach((stateKey) => {
    const colors = ICON_THEME[stateKey];

    ICON_SIZES.forEach((size) => {
      cache[stateKey][size] = drawIconPixels(colors.background, colors.glyph, size);
    });
  });

  return cache;
})();

function createImageDataFromPixels(pixels, size) {
  const data = new Uint8ClampedArray(pixels);

  if (typeof ImageData === "function") {
    return new ImageData(data, size, size);
  }

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext("2d");

    if (context) {
      const imageData = context.createImageData(size, size);
      imageData.data.set(data);
      return imageData;
    }
  }

  throw new Error("Unable to construct ImageData for toolbar icon rendering.");
}

function getIconImageData(enabled) {
  const key = enabled ? "enabled" : "disabled";
  const images = {};

  ICON_SIZES.forEach((size) => {
    images[size] = createImageDataFromPixels(ICON_PIXEL_CACHE[key][size], size);
  });

  return images;
}

const STORAGE_DEFAULTS = {
  logoEnabled: false,
  textEnabled: false,
  enabled: false
};

function setIcon(enabled) {
  const imageData = getIconImageData(enabled);

  chrome.action.setIcon({ imageData }, () => {
    if (chrome.runtime.lastError) {
      console.error("Failed to update toolbar icon", chrome.runtime.lastError);
    }
  });
}

function resolveBrandingEnabled(value) {
  const hasLogo = typeof value.logoEnabled === "boolean";
  const hasText = typeof value.textEnabled === "boolean";

  if (hasLogo || hasText) {
    return (hasLogo && Boolean(value.logoEnabled)) || (hasText && Boolean(value.textEnabled));
  }

  return Boolean(value.enabled);
}

function syncIconWithStorage() {
  chrome.storage.sync.get(STORAGE_DEFAULTS, (result) => {
    setIcon(resolveBrandingEnabled(result));
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(null, (result) => {
    const hasLegacyEnabled = Object.prototype.hasOwnProperty.call(result, "enabled");
    const legacyValue = hasLegacyEnabled ? Boolean(result.enabled) : false;

    const updates = {};
    let hasUpdates = false;

    if (typeof result.logoEnabled !== "boolean") {
      updates.logoEnabled = hasLegacyEnabled ? legacyValue : false;
      hasUpdates = true;
    }

    if (typeof result.textEnabled !== "boolean") {
      updates.textEnabled = hasLegacyEnabled ? legacyValue : false;
      hasUpdates = true;
    }

    function finalize() {
      if (hasLegacyEnabled) {
        chrome.storage.sync.remove("enabled", () => {
          if (chrome.runtime.lastError) {
            console.error("Unable to remove legacy toggle", chrome.runtime.lastError);
          }
          syncIconWithStorage();
        });
      } else {
        syncIconWithStorage();
      }
    }

    if (hasUpdates) {
      chrome.storage.sync.set(updates, () => {
        if (chrome.runtime.lastError) {
          console.error("Unable to initialize feature toggles", chrome.runtime.lastError);
        }
        finalize();
      });
    } else {
      finalize();
    }
  });
});

chrome.runtime.onStartup.addListener(syncIconWithStorage);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") {
    return;
  }

  if (
    Object.prototype.hasOwnProperty.call(changes, "logoEnabled") ||
    Object.prototype.hasOwnProperty.call(changes, "textEnabled") ||
    Object.prototype.hasOwnProperty.call(changes, "enabled")
  ) {
    syncIconWithStorage();
  }
});

setIcon(false);
syncIconWithStorage();
