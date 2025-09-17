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

function setIcon(enabled) {
  const path = enabled ? ICON_PATHS.enabled : ICON_PATHS.disabled;
  chrome.action.setIcon({ path });
}

function syncIconWithStorage() {
  chrome.storage.sync.get({ enabled: false }, (result) => {
    setIcon(Boolean(result.enabled));
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(null, (result) => {
    if (typeof result.enabled !== "boolean") {
      chrome.storage.sync.set({ enabled: false }, syncIconWithStorage);
    } else {
      syncIconWithStorage();
    }
  });
});

chrome.runtime.onStartup.addListener(syncIconWithStorage);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && Object.prototype.hasOwnProperty.call(changes, "enabled")) {
    setIcon(Boolean(changes.enabled.newValue));
  }
});

syncIconWithStorage();
