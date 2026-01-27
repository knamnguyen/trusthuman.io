# Threads Share Button Implementation Plan

**Date**: 27-01-26
**Component**: `packages/ui/src/components/table-content-component.tsx`
**Objective**: Add Threads sharing capability using Web Intent URL with pre-filled text

---

## Implementation Checklist

### 1. Import Threads Icon
**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/packages/ui/src/components/table-content-component.tsx`
**Line**: 7
**Action**: Add `siThreads` to existing simple-icons import

**Before**:
```typescript
import { siFacebook, siX } from "simple-icons";
```

**After**:
```typescript
import { siFacebook, siThreads, siX } from "simple-icons";
```

---

### 2. Create Threads Share Handler
**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/packages/ui/src/components/table-content-component.tsx`
**Line**: After line 265 (after `handleShareLinkedIn`)
**Action**: Add new handler function following existing pattern

**Code to Add**:
```typescript
  const handleShareThreads = () => {
    const url = encodeURIComponent(getCurrentUrl());
    const title = encodeURIComponent(getCurrentTitle());
    const shareUrl = `https://www.threads.net/intent/post?text=${title}%20${url}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  };
```

---

### 3. Add Threads Share Button
**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/packages/ui/src/components/table-content-component.tsx`
**Line**: After line 418 (after LinkedIn button, before closing `</div>`)
**Action**: Add button element following existing styling pattern

**Code to Add**:
```typescript
          <button
            type="button"
            onClick={handleShareThreads}
            className={cn(
              "h-8 w-8 rounded-full border-[1.5px] border-black",
              "flex items-center justify-center",
              "hover:bg-muted transition-colors",
              "focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none",
            )}
            aria-label="Share on Threads"
          >
            <svg
              role="img"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>{siThreads.title}</title>
              <path d={siThreads.path} />
            </svg>
          </button>
```

---

## Verification Steps

### 4. Test in ghost-blog Preview
**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/ghost-blog/src/app/main.tsx`
**Action**: Verify preview already renders TableContentComponent (confirmed at line 63)
**Test Plan**:
1. Run dev server: `pnpm dev` (in ghost-blog directory)
2. Navigate to main page preview
3. Verify Threads button appears after LinkedIn button
4. Click Threads button
5. Confirm popup opens with Threads intent URL
6. Verify pre-filled text includes article title + URL

---

## Technical Details

### Threads Web Intent URL Format
```
https://www.threads.net/intent/post?text={EncodedText}
```

### URL Encoding Strategy
- Title: `encodeURIComponent(getCurrentTitle())`
- URL: `encodeURIComponent(getCurrentUrl())`
- Combined: `${title}%20${url}` (space-separated via `%20`)

### Share Button Order (After Implementation)
1. Copy Link (Lucide icon)
2. X/Twitter (simple-icons)
3. Facebook (simple-icons)
4. LinkedIn (FontAwesome)
5. **Threads (simple-icons)** ← NEW

---

## Dependencies Check
- `simple-icons@15.22.0` - Already installed, includes `siThreads`
- No additional packages required

---

## Files Modified
1. `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/packages/ui/src/components/table-content-component.tsx`

---

## Status Markers
- [ ] Import siThreads icon
- [ ] Create handleShareThreads function
- [ ] Add Threads share button UI
- [ ] Test in ghost-blog preview
- [ ] Verify Threads intent URL opens correctly
- [ ] Confirm pre-filled text format

---

## Notes
- Preview environment already configured in ghost-blog main page
- No routing or environment variable changes needed
- Implementation follows existing share button pattern exactly
- Window popup dimensions consistent with other platforms (550x420)
