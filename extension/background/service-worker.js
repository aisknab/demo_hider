const ICON_PATHS = {
  enabled: {
    16: "extension/icons/active-16.png",
    32: "extension/icons/active-32.png",
    48: "extension/icons/active-48.png",
    128: "extension/icons/active-128.png"
  },
  disabled: {
    16: "extension/icons/inactive-16.png",
    32: "extension/icons/inactive-32.png",
    48: "extension/icons/inactive-48.png",
    128: "extension/icons/inactive-128.png"
  }
};

const STORAGE_DEFAULTS = {
  logoEnabled: false,
  textEnabled: false,
  enabled: false
};

function setIcon(enabled) {
  const path = enabled ? ICON_PATHS.enabled : ICON_PATHS.disabled;
  chrome.action.setIcon({ path });
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

syncIconWithStorage();
