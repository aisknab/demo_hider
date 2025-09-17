# Demo Header Logo Hider

A local Chrome extension that toggles the visibility of the header logo element
used in Criteo Retail Media demos. When enabled, it removes any element matching
the selector:

```
body > app-root > app-shell > mat-sidenav-container > mat-sidenav-content > app-header > div > mat-toolbar > div.toolbar-left > app-header-logo > img
```

## Getting started

1. Generate the toolbar icons (they are excluded from the repository so that no
   binary assets are committed). Use the Python interpreter available on your
   system — on macOS/Linux it is often `python3`:

   ```bash
   python3 scripts/generate_icons.py
   ```

2. In Chrome, open `chrome://extensions`, enable **Developer mode**, and choose
   **Load unpacked**.
3. Select the root folder of this repository (the directory that contains this
   README and `manifest.json`).
4. Pin the “Demo Header Logo Hider” action if desired.

## Usage

* Open the extension popup and use the toggle to hide or show the header logo.
* The setting is stored using `chrome.storage.sync`, so it persists across page
  refreshes and browser restarts.
* While enabled, a MutationObserver keeps the target element hidden even if the
  page re-renders dynamically.

## Development notes

* The repository purposefully avoids third-party dependencies.
* Toolbar icons are generated using the Python standard library and stored in
  the `extension/icons/` directory.
* To update the icons, edit `scripts/generate_icons.py` and run it again.

