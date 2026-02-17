# Demo Header Logo Hider

Chrome extension for Criteo demo environments that can:

- Replace header branding (logo, account name, favicon).
- Auto-grab branding assets from the active retailer tab.
- Auto-grab retailer color settings and apply Criteo CSS theme tokens.
- Convert displayed USD amounts (values prefixed with `$`) into selected currencies.

Changes are client-side only and do not modify backend data.

## Supported pages

- `https://criteo.com/*`
- `https://*.criteo.com/*`

## Features

- `Replace all` toggle for turning all replace toggles on or off together.
- `Replace logo` toggle.
- `Replace account name` toggle.
- `Replace favicon` toggle (when logo replacement is enabled).
- `Brand colors` section with:
  - `Replace` toggle for applying color replacement on Criteo pages.
  - Editable `primaryColor`, `secondaryColor`, `primaryTextColor`, `secondaryTextColor`.
  - Color swatches next to each value for visual preview.
- Retailer name override.
- Custom logo upload.
- Custom favicon upload.
- Auto-grab branding from active tab (name, logo, favicon, brand colors).
- Currency selector with grouped options: `US`, `EMEA`, `APAC`.
- Live currency conversion for `$` amounts, including dynamically rendered content.

## Brand color replacement behavior

- `Auto grab from active tab` always refreshes the four stored brand color values.
- When `Brand colors -> Replace` is enabled, the extension applies:
  - `--primary-sys-0` from `primaryTextColor`
  - `--accent-sys-0` from `secondaryTextColor`
  - `--primary-sys-1` through `--primary-sys-9` from `primaryColor`
  - `--accent-sys-1` through `--accent-sys-9` from `secondaryColor`
- Palette variations (`1..9`) are generated client-side from the base colors.
- Disabling `Brand colors -> Replace` restores original page variables.

## Currency conversion behavior

- Conversion applies only to values that include a leading `$`.
- Converted values are rendered using the selected target currency format.
- Conversion updates as pages re-render.
- Exchange rates are fetched from online APIs and cached locally.
- If fresh rates are unavailable, cached rates are used when possible.

## Install

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this repository root (the folder with `manifest.json`).
5. Pin the extension action if needed.

## Usage

1. Open the extension popup.
2. Use `Replace all` to quickly turn all replace toggles on/off, or enable them individually.
3. Optionally set a retailer name, upload custom logo/favicon assets, and edit brand colors.
4. To auto-grab assets and colors, open a retailer site tab and click `Auto grab from active tab`.
5. Enable `Brand colors -> Replace` to apply the grabbed/manual color theme on Criteo pages.
6. For currency conversion, choose a currency from the dropdown.
7. Any visible `$`-prefixed amounts on supported pages will be converted.

## Data and storage

- `chrome.storage.sync` stores feature toggles, retailer name, selected currency, and brand color settings.
- `chrome.storage.local` stores custom images and cached exchange rates.

## Development notes

- No third-party runtime dependencies.
- Toolbar icons are static assets configured in `manifest.json`.
