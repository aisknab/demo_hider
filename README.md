# Demo Header Logo Hider

A local Chrome extension that applies "Demo Retailer" branding to key elements
used in Criteo Retail Media demos. When enabled, it replaces the header logo with
an inline "Demo Retailer" logo and updates the account name text. The original
content is restored when the toggle is turned off.

## Getting started

1. In Chrome, open `chrome://extensions`, enable **Developer mode**, and choose
   **Load unpacked**.

2. Select the root folder of this repository (the directory that contains this
   README and `manifest.json`).

3. Pin the “Demo Header Logo Hider” action if desired.

## Usage

* Open the extension popup and use the toggle to apply or restore the Demo
  Retailer branding.
* Set a custom retailer name in the popup to control the replacement text and
  the default logo text.
* Upload a custom logo image in the popup to replace the logo (stored locally
  on the current device).
* Upload a custom favicon image in the popup to replace the page favicon, and
  use the Replace favicon toggle to turn it on or off.
* The setting is stored using `chrome.storage.sync`, so it persists across page
  refreshes and browser restarts.
* While enabled, a MutationObserver reapplies the branding even if the page
  re-renders dynamically.

## Development notes

* The repository purposefully avoids third-party dependencies.
* Toolbar icons are generated dynamically by the background service worker so no
  binary assets need to be checked into version control.
