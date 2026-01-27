
# Goals/Preferences Page Mobile Overlay Audit & Debug Mode

## Summary
After a thorough code audit, I've identified several areas where full-screen overlays or backdrops could potentially block touch interactions on mobile devices. The plan includes adding safety measures to existing overlay components and introducing a debug mode to visually identify any invisible blockers.

## Findings from Audit

### Overlay Components Identified
1. **DialogOverlay** (`src/components/ui/dialog.tsx`) - Uses `fixed inset-0 z-50 bg-black/80`
2. **DrawerOverlay** (`src/components/ui/drawer.tsx`) - Uses `fixed inset-0 z-50 bg-black/80`
3. **SheetOverlay** (`src/components/ui/sheet.tsx`) - Uses `fixed inset-0 z-50 bg-black/80`
4. **AlertDialogOverlay** (`src/components/ui/alert-dialog.tsx`) - Uses `fixed inset-0 z-50 bg-black/80`
5. **IntroTour** (`src/components/onboarding/IntroTour.tsx`) - Uses custom `fixed inset-0 z-50` wrapper
6. **ImageOverlay** (`src/components/ui/image-overlay.tsx`) - Already correctly uses `pointer-events-none`
7. **Image overlay CSS classes** (`src/index.css`) - Already correctly uses `pointer-events-none`

### Potential Issues Found
- **IntroTour component**: Has a `fixed inset-0 z-50` div that wraps content but doesn't use `pointer-events-none` when closed - however, it's controlled by Dialog open state so should unmount correctly
- **Radix UI components** (Dialog, Drawer, Sheet, AlertDialog): These correctly use portals and only render when open, so they should unmount properly when closed

### No Critical Issues Detected
The existing implementation appears sound because:
- All Dialog/Drawer/Sheet overlays use Radix Portals which only render content when `open={true}`
- The overlays are properly removed from DOM when dialogs close
- Image overlays already have `pointer-events-none` applied

## Implementation Plan

### 1. Add Debug Mode CSS for Mobile Overlay Detection
Add a debug utility class that can be toggled to visually highlight any `fixed inset-0` elements, making invisible blockers obvious.

**File: `src/index.css`**
- Add a `.debug-overlays` utility class that applies visible outlines to any fixed/absolute full-screen positioned elements
- This will help identify any rogue overlays that may exist

### 2. Add pointer-events Safety to IntroTour Wrapper
The IntroTour component has a wrapper div with `fixed inset-0` - while it should unmount when closed, adding explicit pointer-events handling ensures safety.

**File: `src/components/onboarding/IntroTour.tsx`**
- No change needed - the Dialog component controls rendering via `open` prop

### 3. Add Defensive Overlay Styles
Add `pointer-events-none` fallback to overlay pseudo-elements in CSS classes that create visual overlays (already done in image-overlay, but document the pattern).

**File: `src/index.css`**
- Verify existing `.image-overlay::after` has `pointer-events-none` (already present)
- Add documentation comment about overlay safety

### 4. Create Debug Toggle Component (Optional)
Create a development-only debug panel that can be enabled to show overlay outlines on mobile.

**File: `src/components/debug/OverlayDebugPanel.tsx` (new)**
- Adds a toggle button (only visible in development)
- When enabled, applies the `.debug-overlays` class to body
- Shows red outlines around any `fixed` or `absolute` positioned elements that cover significant screen area

### 5. Review and Update Settings Modal Behavior
Ensure the Edit Profile modal on the Settings page (Goals tab) properly unmounts its overlay.

**File: `src/pages/Settings.tsx`**
- Verify Dialog components use `onOpenChange` to properly close
- Already correctly implemented with controlled open state

---

## Technical Details

### Debug CSS Implementation
```css
/* Debug mode for overlay detection - add to body class to enable */
.debug-overlays [class*="fixed"][class*="inset-0"],
.debug-overlays [class*="absolute"][class*="inset-0"] {
  outline: 3px dashed red !important;
  outline-offset: -3px;
  background-color: rgba(255, 0, 0, 0.1) !important;
}

.debug-overlays .image-overlay::after,
.debug-overlays .image-overlay-dark::after,
.debug-overlays .image-overlay-subtle::after {
  outline: 2px dashed orange !important;
}
```

### OverlayDebugPanel Component
- Only renders in development mode (`import.meta.env.DEV`)
- Floating button in bottom-right corner
- Toggles body class for debug visualization
- Provides clear visual feedback for any overlay elements

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/index.css` | Modify | Add debug overlay CSS utility classes |
| `src/components/debug/OverlayDebugPanel.tsx` | Create | Debug toggle component for development |
| `src/App.tsx` | Modify | Conditionally render OverlayDebugPanel in dev mode |

## Risk Assessment
- **Low risk**: Changes are additive (CSS utilities and dev-only components)
- **No production impact**: Debug panel only renders in development
- **Existing overlays verified**: All current overlays use proper unmounting via Radix UI

## Verification Steps
After implementation:
1. Enable debug mode on mobile viewport
2. Navigate through Goals/Preferences sections
3. Open/close all dialogs and verify overlays unmount
4. Confirm no red outlines persist when dialogs are closed
5. Test touch interactions throughout the flow
