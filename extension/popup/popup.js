const logoToggle = document.getElementById("logo-toggle");
const textToggle = document.getElementById("text-toggle");
const statusElement = document.getElementById("status");

const state = {
  logoEnabled: false,
  textEnabled: false
};

function getStatusMessage(currentState) {
  if (currentState.logoEnabled && currentState.textEnabled) {
    return "Demo Retailer branding is applied to the logo and account name.";
  }

  if (currentState.logoEnabled) {
    return "Demo Retailer branding is applied to the logo only.";
  }

  if (currentState.textEnabled) {
    return "Demo Retailer branding is applied to the account name only.";
  }

  return "Default site branding is shown.";
}

function applyState(newState) {
  state.logoEnabled = Boolean(newState.logoEnabled);
  state.textEnabled = Boolean(newState.textEnabled);

  logoToggle.checked = state.logoEnabled;
  textToggle.checked = state.textEnabled;

  statusElement.textContent = getStatusMessage(state);
}

function buildUpdatedState(partial) {
  const newState = {
    logoEnabled: state.logoEnabled,
    textEnabled: state.textEnabled
  };

  const hasLogo = Object.prototype.hasOwnProperty.call(partial, "logoEnabled");
  const hasText = Object.prototype.hasOwnProperty.call(partial, "textEnabled");

  if (hasLogo) {
    newState.logoEnabled = Boolean(partial.logoEnabled);
  }

  if (hasText) {
    newState.textEnabled = Boolean(partial.textEnabled);
  }

  if (!hasLogo && !hasText && Object.prototype.hasOwnProperty.call(partial, "enabled")) {
    const boolValue = Boolean(partial.enabled);
    newState.logoEnabled = boolValue;
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
    { logoEnabled: false, textEnabled: false, enabled: false },
    (result) => {
      updateState(result);
    }
  );
}

function persistState(newState) {
  chrome.storage.sync.set(
    {
      logoEnabled: Boolean(newState.logoEnabled),
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

logoToggle.addEventListener("change", () => {
  const newState = {
    ...state,
    logoEnabled: logoToggle.checked
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

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") {
    return;
  }

  const update = {};
  let hasUpdate = false;

  if (Object.prototype.hasOwnProperty.call(changes, "logoEnabled")) {
    update.logoEnabled = changes.logoEnabled.newValue;
    hasUpdate = true;
  }

  if (Object.prototype.hasOwnProperty.call(changes, "textEnabled")) {
    update.textEnabled = changes.textEnabled.newValue;
    hasUpdate = true;
  }

  if (!hasUpdate && Object.prototype.hasOwnProperty.call(changes, "enabled")) {
    update.enabled = changes.enabled.newValue;
    hasUpdate = true;
  }

  if (hasUpdate) {
    updateState(update);
  }
});

syncStateWithStorage();

