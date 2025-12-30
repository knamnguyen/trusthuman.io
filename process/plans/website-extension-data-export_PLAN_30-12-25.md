# Website-to-Extension Data Export Feature - Implementation Plan

**Date**: 30-12-25
**Type**: SIMPLE (one-session feature)
**Complexity**: Low-Medium

---

## Overview

Enable users to export their Chrome extension data (target lists + custom style guides/personas) from a web page at `engagekit.io/export-migrate`. The web page will communicate with the Chrome extension via `chrome.runtime.sendMessage` (external messaging) to retrieve data from `chrome.storage.local`, then download it as a JSON file.

---

## Goals

1. Set up external messaging between `engagekit.io` domain and the Chrome extension
2. Create a secure message handler in the background script to retrieve storage data
3. Build a Next.js page at `/export-migrate` that:
   - Detects if the extension is installed
   - Fetches data from extension on button click
   - Downloads data as a JSON file
4. Provide clear error handling for "extension not installed" scenario

---

## Scope

### In Scope
- Manifest.json configuration for `externally_connectable`
- Background script message handler for `getExportData` action
- Next.js page at `/export-migrate` with:
  - Extension detection
  - Export button UI
  - JSON file download functionality
- Error states and user feedback

### Out of Scope
- Import/restore functionality (future feature)
- Data transformation or migration logic
- Authentication/authorization (data is already in user's extension)
- Cloud backup/sync

---

## Technical Context

### Extension Architecture
- **Location**: `apps/chrome-extension/`
- **Background Script**: `apps/chrome-extension/src/pages/background/index.ts`
- **Manifest**: `apps/chrome-extension/manifest.json`
- **Build System**: Vite with custom config at `apps/chrome-extension/vite.config.base.ts`

### Storage Keys (chrome.storage.local)
1. **Custom Style Guides** (Personas):
   - Key: `customStyleGuides`
   - Type: `Array<{ name: string; prompt: string }>`
   - Location: Used in `apps/chrome-extension/src/pages/popup/Popup.tsx`

2. **Target Lists** (Names):
   - Key: `engagekit-profile-lists`
   - Type: `string[]`
   - Location: Used throughout extension for list management

3. **Profile Data** (URNs + metadata):
   - Key: `engagekit-profile-data`
   - Type: `Record<string, ProfileData>`
   - Structure: `{ [profileUrn: string]: { name: string; urn: string; profileUrl: string; ... } }`
   - Location: Used in `apps/chrome-extension/src/pages/background/get-list-urns.ts`

### Next.js App
- **Location**: `apps/nextjs/`
- **App Router**: Uses Next.js 15 App Router at `apps/nextjs/src/app/`
- **Example Page**: `apps/nextjs/src/app/extension-auth/page.tsx` (reference for "use client" pattern)
- **Styling**: Tailwind CSS v4 + shadcn/ui components from `@sassy/ui`

### Environment Variables
- **VITE_APP_URL**: Base URL for the web app (used in extension config)
  - Dev: `http://localhost:3000` (or custom port)
  - Production: `https://engagekit.io`

---

## Implementation Checklist

### Phase 1: Manifest Configuration
1. **Edit `apps/chrome-extension/manifest.json`**
   - Add `externally_connectable` field with matches for `https://engagekit.io/*` and `http://localhost:3000/*` (for local dev)
   - Position: After `host_permissions` array, before `background` field
   - Format:
     ```json
     "externally_connectable": {
       "matches": [
         "https://engagekit.io/*",
         "http://localhost:3000/*"
       ]
     }
     ```

### Phase 2: Background Script Message Handler
2. **Edit `apps/chrome-extension/src/pages/background/index.ts`**
   - Locate the `chrome.runtime.onMessage.addListener` callback (currently at line ~461)
   - Add new case `getExportData` BEFORE the `default` case (around line 560, before the default router fallback)
   - Handler logic:
     ```typescript
     case "getExportData":
       chrome.storage.local.get(
         ["customStyleGuides", "engagekit-profile-lists", "engagekit-profile-data"],
         (result) => {
           sendResponse({
             success: true,
             data: {
               customStyleGuides: result.customStyleGuides || [],
               profileLists: result["engagekit-profile-lists"] || [],
               profileData: result["engagekit-profile-data"] || {},
               exportedAt: new Date().toISOString(),
             },
           });
         }
       );
       return true; // Keep channel open for async response
     ```

### Phase 3: Next.js Export Page
3. **Create `apps/nextjs/src/app/export-migrate/page.tsx`**
   - File: New file at exact path `apps/nextjs/src/app/export-migrate/page.tsx`
   - Directive: `"use client";` at top (required for browser APIs)
   - Imports:
     ```typescript
     import { useState, useEffect } from "react";
     import { Download, Chrome, AlertCircle, CheckCircle2 } from "lucide-react";
     import { Button } from "@sassy/ui/button";
     import {
       Card,
       CardContent,
       CardDescription,
       CardHeader,
       CardTitle,
     } from "@sassy/ui/card";
     import { Alert, AlertDescription, AlertTitle } from "@sassy/ui/alert";
     ```

4. **Implement Export Page Component in `apps/nextjs/src/app/export-migrate/page.tsx`**
   - State management:
     ```typescript
     const [extensionDetected, setExtensionDetected] = useState<boolean | null>(null);
     const [isExporting, setIsExporting] = useState(false);
     const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");
     const [errorMessage, setErrorMessage] = useState("");
     ```

   - Extension detection (useEffect on mount):
     ```typescript
     useEffect(() => {
       detectExtension();
     }, []);

     const detectExtension = () => {
       const EXTENSION_ID = "YOUR_EXTENSION_ID"; // TODO: Replace with actual ID from manifest

       if (typeof chrome !== "undefined" && chrome.runtime) {
         try {
           chrome.runtime.sendMessage(
             EXTENSION_ID,
             { action: "ping" },
             (response) => {
               if (chrome.runtime.lastError) {
                 setExtensionDetected(false);
               } else {
                 setExtensionDetected(true);
               }
             }
           );
         } catch (error) {
           setExtensionDetected(false);
         }
       } else {
         setExtensionDetected(false);
       }
     };
     ```

   - Export handler:
     ```typescript
     const handleExport = async () => {
       setIsExporting(true);
       setExportStatus("idle");
       setErrorMessage("");

       const EXTENSION_ID = "YOUR_EXTENSION_ID"; // TODO: Replace with actual ID

       try {
         chrome.runtime.sendMessage(
           EXTENSION_ID,
           { action: "getExportData" },
           (response) => {
             if (chrome.runtime.lastError) {
               setErrorMessage(chrome.runtime.lastError.message || "Unknown error");
               setExportStatus("error");
               setIsExporting(false);
               return;
             }

             if (response?.success && response?.data) {
               downloadJSON(response.data);
               setExportStatus("success");
             } else {
               setErrorMessage("Failed to retrieve data from extension");
               setExportStatus("error");
             }
             setIsExporting(false);
           }
         );
       } catch (error) {
         setErrorMessage(error instanceof Error ? error.message : "Unknown error");
         setExportStatus("error");
         setIsExporting(false);
       }
     };
     ```

   - Download helper:
     ```typescript
     const downloadJSON = (data: any) => {
       const filename = `engagekit-export-${new Date().toISOString().split('T')[0]}.json`;
       const json = JSON.stringify(data, null, 2);
       const blob = new Blob([json], { type: "application/json" });
       const url = URL.createObjectURL(blob);

       const a = document.createElement("a");
       a.href = url;
       a.download = filename;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       URL.revokeObjectURL(url);
     };
     ```

5. **Build UI Layout in `apps/nextjs/src/app/export-migrate/page.tsx`**
   - Return JSX structure:
     ```tsx
     return (
       <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
         <Card className="w-full max-w-lg shadow-lg">
           <CardHeader className="text-center">
             <Chrome className="mx-auto h-12 w-12 text-blue-600" />
             <CardTitle className="mt-4 text-2xl font-bold">
               Export Your Data
             </CardTitle>
             <CardDescription>
               Download your target lists and custom personas from the EngageKit extension
             </CardDescription>
           </CardHeader>

           <CardContent className="space-y-6">
             {/* Extension Detection Status */}
             {extensionDetected === false && (
               <Alert variant="destructive">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Extension Not Detected</AlertTitle>
                 <AlertDescription>
                   Please install the EngageKit Chrome extension to export your data.
                 </AlertDescription>
               </Alert>
             )}

             {extensionDetected === true && (
               <Alert>
                 <CheckCircle2 className="h-4 w-4 text-green-600" />
                 <AlertTitle>Extension Connected</AlertTitle>
                 <AlertDescription>
                   Click the button below to export your data.
                 </AlertDescription>
               </Alert>
             )}

             {/* Export Button */}
             <Button
               onClick={handleExport}
               disabled={!extensionDetected || isExporting}
               className="w-full"
               size="lg"
             >
               <Download className="mr-2 h-5 w-5" />
               {isExporting ? "Exporting..." : "Export Data"}
             </Button>

             {/* Success Message */}
             {exportStatus === "success" && (
               <Alert>
                 <CheckCircle2 className="h-4 w-4 text-green-600" />
                 <AlertTitle>Export Successful</AlertTitle>
                 <AlertDescription>
                   Your data has been downloaded. Check your Downloads folder.
                 </AlertDescription>
               </Alert>
             )}

             {/* Error Message */}
             {exportStatus === "error" && (
               <Alert variant="destructive">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Export Failed</AlertTitle>
                 <AlertDescription>{errorMessage}</AlertDescription>
               </Alert>
             )}

             {/* Data Preview */}
             <div className="text-muted-foreground space-y-2 rounded-lg bg-slate-100 p-4 text-sm">
               <p className="font-semibold">What will be exported:</p>
               <ul className="ml-4 list-disc space-y-1">
                 <li>Custom style guides (personas)</li>
                 <li>Target list names</li>
                 <li>Profile data (URNs and metadata)</li>
                 <li>Export timestamp</li>
               </ul>
             </div>
           </CardContent>
         </Card>
       </div>
     );
     ```

### Phase 4: Extension ID Configuration
6. **Get Chrome Extension ID**
   - Option A (Development): Load unpacked extension in Chrome, copy ID from `chrome://extensions/`
   - Option B (Production): After publishing, use the permanent ID from Chrome Web Store
   - Update both locations in `apps/nextjs/src/app/export-migrate/page.tsx`:
     - Line in `detectExtension()`: `const EXTENSION_ID = "..."`
     - Line in `handleExport()`: `const EXTENSION_ID = "..."`
   - **Note**: Consider moving to environment variable `NEXT_PUBLIC_CHROME_EXTENSION_ID` for easier management

### Phase 5: Testing & Validation
7. **Local Testing Setup**
   - Build extension: `cd apps/chrome-extension && pnpm build`
   - Load unpacked extension from `apps/chrome-extension/dist/`
   - Start Next.js dev server: `pnpm dev:next`
   - Navigate to `http://localhost:3000/export-migrate`

8. **Test Scenarios**
   - [ ] Extension not installed → Shows error alert
   - [ ] Extension installed → Shows success alert and export button enabled
   - [ ] Click export with empty data → Downloads JSON with empty arrays/objects
   - [ ] Click export with populated data → Downloads JSON with all data
   - [ ] Verify JSON structure matches expected format
   - [ ] Verify filename format: `engagekit-export-YYYY-MM-DD.json`

9. **Production Testing**
   - [ ] Add `externally_connectable` domain to production extension
   - [ ] Test on `https://engagekit.io/export-migrate`
   - [ ] Verify CSP headers allow extension communication

---

## Exported Data Structure

The downloaded JSON file will have the following structure:

```json
{
  "customStyleGuides": [
    {
      "name": "Professional Networker",
      "prompt": "Write comments that are professional and insightful..."
    }
  ],
  "profileLists": [
    "VCs in AI",
    "Product Managers",
    "Startup Founders"
  ],
  "profileData": {
    "urn:li:fsd_profile:ACoAACXXXXX": {
      "name": "John Doe",
      "urn": "urn:li:fsd_profile:ACoAACXXXXX",
      "profileUrl": "https://www.linkedin.com/in/johndoe/",
      "headline": "CEO @ TechCo",
      "lists": ["Startup Founders"]
    }
  },
  "exportedAt": "2025-12-30T12:34:56.789Z"
}
```

---

## Acceptance Criteria

- [ ] Manifest.json has `externally_connectable` with correct domains
- [ ] Background script responds to `getExportData` message with proper data structure
- [ ] `/export-migrate` page loads without errors
- [ ] Page detects extension presence correctly
- [ ] Export button disabled when extension not detected
- [ ] Export button triggers download of JSON file
- [ ] Downloaded file has correct filename format
- [ ] Downloaded JSON contains all three storage keys + timestamp
- [ ] Error states display helpful messages
- [ ] UI follows EngageKit design patterns (shadcn/ui components)

---

## Dependencies

### Internal Packages
- `@sassy/ui` - UI components (Button, Card, Alert)
- No new dependencies required

### External Libraries
- All required libraries already in Next.js app (lucide-react for icons)

### Environment Variables
- Optional: `NEXT_PUBLIC_CHROME_EXTENSION_ID` (can be hardcoded initially)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Extension ID changes between dev/prod | High | Use environment variable or document clearly in README |
| Browser compatibility (non-Chrome) | Medium | Add browser detection, show warning for non-Chrome users |
| Large data size causes download failure | Low | Test with large datasets (100+ profiles), consider chunking if needed |
| CSP headers block extension messaging | Medium | Verify CSP config on production deployment |

---

## Integration Notes

### With Chrome Extension
- No changes to storage structure required
- Background script addition is non-breaking (new case in switch statement)
- Manifest change requires extension reload in development

### With Next.js App
- New route at `/export-migrate` (no conflicts with existing routes)
- Uses existing UI components from `@sassy/ui`
- Client-side only (no server-side rendering needed)

### With Future Import Feature
- Exported JSON structure designed to be directly importable
- Fields match storage keys exactly for easy restoration
- Timestamp field can be used for version tracking

---

## Post-Implementation Tasks

1. **Documentation**
   - Add user guide to help center: "How to export your data"
   - Update README with new page route
   - Document extension ID configuration process

2. **Future Enhancements**
   - Import/restore functionality (reverse of export)
   - Encrypted export option (with password protection)
   - Cloud sync integration
   - Export history tracking
   - Selective export (choose which data to export)

3. **Analytics** (Optional)
   - Track export button clicks
   - Track successful/failed exports
   - Monitor file download completion rates

---

## Change Management

**Scope Changes**: None expected - straightforward feature addition

**Breaking Changes**: None - purely additive feature

**Rollback Plan**:
- Remove `externally_connectable` from manifest
- Delete `/export-migrate` page
- Remove message handler case from background script

---

## Notes

- **Extension Detection**: Using `chrome.runtime.sendMessage` with extension ID is the standard approach. Alternative would be using `window.postMessage` but that's less secure.
- **File Download**: Using Blob + URL.createObjectURL is standard for client-side downloads. No server-side processing needed.
- **Security**: External messaging is safe because manifest explicitly whitelists domains. Only `engagekit.io` can send messages to the extension.
- **Browser Support**: Chrome/Chromium only (by design). Extension doesn't support Firefox yet.

---

## References

- Chrome Extension External Messaging: https://developer.chrome.com/docs/extensions/reference/api/runtime#external
- Manifest v3 externally_connectable: https://developer.chrome.com/docs/extensions/reference/manifest/externally-connectable
- Next.js App Router: https://nextjs.org/docs/app
- Existing auth page pattern: `apps/nextjs/src/app/extension-auth/page.tsx`
