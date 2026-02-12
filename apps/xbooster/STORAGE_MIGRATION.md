# xBooster Chrome Storage Migration

## Export (old extension)

Open the extension's **service worker console** and run:

```js
chrome.storage.local.get(null, d => console.log(JSON.stringify(d)));
```

Then right-click the output → **"Copy string contents"**.

## Import (new extension)

Open the new extension's **service worker console** and paste:

```js
chrome.storage.local.set(PASTE_HERE, () => console.log("Done"));
```

Replace `PASTE_HERE` with the raw JSON object you copied (starts with `{`, ends with `}`). Do NOT wrap in quotes — paste the object directly.

## Storage Keys

| Key | Description |
|-----|-------------|
| `xAuth` | Captured auth headers (cookie, csrf, bearer, user-agent). Re-captured automatically on page load. |
| `xbooster_replied` | Already-replied tweet IDs for Mentions tab (prevents duplicate replies). |
| `xbooster_settings` | Mentions tab settings (fetch interval, send delay, word limits, etc). |
| `xbooster_engage_settings` | Engage tab settings (cycle interval, source delay, send delay, etc). |
| `xbooster_engage_sources` | Saved list/community sources for Engage tab. |
| `xbooster_engage_replied` | Already-replied tweet IDs for Engage tab. |

## Selective Import

To only import the replied history (recommended when upgrading with new settings):

```js
chrome.storage.local.set({"xbooster_replied": PASTE_ARRAY_HERE}, () => console.log("Done"));
```

Where `PASTE_ARRAY_HERE` is the `xbooster_replied` array from the exported data.
