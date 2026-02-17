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
        });
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
