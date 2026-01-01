# Chrome Extension Data Export/Import Scripts

Quick console scripts to export and import personas (custom styles) and target lists from the EngageKit Chrome extension.

## How to Access Console

1. Open the extension popup (click extension icon)
2. Right-click anywhere in the popup
3. Select "Inspect"
4. Go to "Console" tab
5. Paste the scripts below

---

## 1. EXPORT Script

Exports all personas and target lists to a JSON file.

```javascript
// EXPORT - Paste in extension popup/background console
(async () => {
  const keys = ['customStyleGuides', 'engagekit-profile-lists', 'engagekit-profile-data'];

  chrome.storage.local.get(keys, (result) => {
    const exportData = {
      customStyleGuides: result.customStyleGuides || [],
      profileLists: result['engagekit-profile-lists'] || [],
      profileData: result['engagekit-profile-data'] || {},
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engagekit-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('✅ Exported:', {
      personas: exportData.customStyleGuides.length,
      lists: exportData.profileLists.length,
      profiles: Object.keys(exportData.profileData).length
    });
  });
})();
```

**Output:** Downloads `engagekit-export-YYYY-MM-DD.json`

---

## 2. IMPORT Script

Imports personas and target lists from a previously exported JSON file.

```javascript
// IMPORT - Paste in extension popup/background console
(async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        const updates = {};
        if (data.customStyleGuides) updates.customStyleGuides = data.customStyleGuides;
        if (data.profileLists) updates['engagekit-profile-lists'] = data.profileLists;
        if (data.profileData) updates['engagekit-profile-data'] = data.profileData;

        chrome.storage.local.set(updates, () => {
          console.log('✅ Imported:', {
            personas: data.customStyleGuides?.length || 0,
            lists: data.profileLists?.length || 0,
            profiles: Object.keys(data.profileData || {}).length
          });
          alert('Import successful! Reload extension to see changes.');
        });
      } catch (err) {
        console.error('❌ Import failed:', err);
        alert('Import failed: Invalid JSON file');
      }
    };

    reader.readAsText(file);
  };

  input.click();
})();
```

**Output:** Opens file picker, imports data, shows success alert

---

## Exported Data Structure

```json
{
  "customStyleGuides": [
    { "name": "Friendly", "prompt": "Write in a friendly tone..." }
  ],
  "profileLists": ["Influencers", "Tech Leaders"],
  "profileData": {
    "https://linkedin.com/in/username": {
      "profileUrl": "https://linkedin.com/in/username",
      "fullName": "John Doe",
      "headline": "Software Engineer",
      "lists": ["Influencers"]
    }
  },
  "exportedAt": "2025-12-30T12:34:56.789Z"
}
```

---

## Notes

- **Reload extension** after importing to see changes in the UI
- Scripts must be run in the extension's context (popup or background page console)
- Export file is human-readable JSON (can be edited manually if needed)
