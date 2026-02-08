const TOOLBAR_ICON_PATHS = {
  16: "extension/icons/icon16.png",
  32: "extension/icons/icon32.png",
  48: "extension/icons/icon48.png",
  128: "extension/icons/icon128.png"
};

function setIcon() {
  chrome.action.setIcon({ path: TOOLBAR_ICON_PATHS }, () => {
    if (chrome.runtime.lastError) {
      console.error("Failed to update toolbar icon", chrome.runtime.lastError);
    }
  });
}

function syncIconWithStorage() {
  setIcon();
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(null, (result) => {
    const hasLegacyEnabled = Object.prototype.hasOwnProperty.call(result, "enabled");
    const legacyValue = hasLegacyEnabled ? Boolean(result.enabled) : false;
    const resolvedLogoEnabled =
      typeof result.logoEnabled === "boolean"
        ? result.logoEnabled
        : hasLegacyEnabled
          ? legacyValue
          : false;

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

    if (typeof result.faviconEnabled !== "boolean") {
      updates.faviconEnabled = resolvedLogoEnabled;
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
    Object.prototype.hasOwnProperty.call(changes, "faviconEnabled") ||
    Object.prototype.hasOwnProperty.call(changes, "textEnabled") ||
    Object.prototype.hasOwnProperty.call(changes, "enabled")
  ) {
    syncIconWithStorage();
  }
});

setIcon();
syncIconWithStorage();
