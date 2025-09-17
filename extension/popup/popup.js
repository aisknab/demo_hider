const toggleInput = document.getElementById("visibility-toggle");
const statusElement = document.getElementById("status");

function updateStatus(enabled) {
  statusElement.textContent = enabled
    ? "Demo Retailer branding is applied on supported pages."
    : "Default site branding is shown.";
}

function applyState(enabled) {
  toggleInput.checked = enabled;
  updateStatus(enabled);
}

function syncToggleWithStorage() {
  chrome.storage.sync.get({ enabled: false }, (result) => {
    applyState(Boolean(result.enabled));
  });
}

toggleInput.addEventListener("change", () => {
  const isEnabled = toggleInput.checked;
  chrome.storage.sync.set({ enabled: isEnabled }, () => {
    if (chrome.runtime.lastError) {
      console.error("Unable to persist toggle state", chrome.runtime.lastError);
      return;
    }

    updateStatus(isEnabled);
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && Object.prototype.hasOwnProperty.call(changes, "enabled")) {
    applyState(Boolean(changes.enabled.newValue));
  }
});

syncToggleWithStorage();

