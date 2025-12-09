# UX Recommendations: Simplifying Printful EDM Case Selection

**Date:** December 8, 2025  
**Issue:** Printful EDM iframe allows multiple phone case selection via checkboxes, creating user confusion  
**Expertise:** CX/UX + Printful EDM API v2

## Problem Statement

The Printful EDM iframe currently exposes checkboxes that allow users to select multiple phone cases simultaneously. This creates confusion because:
- Users don't understand what selecting multiple cases means
- The mental model is unclear (are they ordering multiple? designing for multiple?)
- It adds cognitive load without clear value
- It conflicts with SnapCase's single-case design flow

## Recommended Solutions (Ranked by Simplicity)

### ✅ **Option 1: Disable Variant Selection Entirely (RECOMMENDED)**

**Complexity:** Low  
**Implementation:** Update Printful config to set `isVariantSelectionDisabled: true`

**Why this works:**
- SnapCase already handles device selection in Step 1 (before EDM loads)
- Printful picker becomes redundant since we pre-select the variant
- Eliminates confusion completely
- Aligns with your "Printful owns picker; SnapCase sets defaults" architecture

**Implementation:**
```typescript
// In buildPrintfulConfig or edm-editor.tsx
isVariantSelectionDisabled: true,
```

**UX Impact:**
- ✅ Zero confusion - picker is hidden
- ✅ Cleaner interface
- ✅ Single source of truth (SnapCase device picker)
- ⚠️ Users must return to Step 1 to change devices (already your design)

**Trade-offs:**
- Users can't change devices within the EDM (but this matches your current flow)
- Requires clear helper text: "Device locked to your SnapCase selection. Change in Step 1."

---

### ✅ **Option 2: Lock to Single Variant with Visual Feedback**

**Complexity:** Low-Medium  
**Implementation:** Use `preselectedVariants` + `isVariantSelectionDisabled: true`

**Why this works:**
- Shows the selected variant visually
- Prevents any multi-selection
- Maintains Printful's visual preview of the selected case

**Implementation:**
```typescript
isVariantSelectionDisabled: true,
preselectedVariants: [variantId], // Array with single variant
```

**UX Impact:**
- ✅ Clear visual indication of selected case
- ✅ No multi-selection possible
- ✅ Still requires Step 1 to change (maintains flow)

---

### ✅ **Option 3: Single-Selection Mode (Radio Button Behavior)**

**Complexity:** Medium  
**Implementation:** Use `allowOnlyOneColorToBeSelected: true` + `allowOnlyOneSizeToBeSelected: true` (if applicable)

**Why this works:**
- Forces single selection at the variant level
- Printful may still show checkboxes, but only one can be selected
- Less ideal than Option 1, but works if you can't fully disable

**Implementation:**
```typescript
allowOnlyOneColorToBeSelected: true,
allowOnlyOneSizeToBeSelected: true,
// Note: These control color/size selection, not variant selection
```

**UX Impact:**
- ⚠️ Checkboxes may still appear (confusing)
- ✅ Only one selection allowed
- ⚠️ Less clean than Option 1

---

### ⚠️ **Option 4: CSS Overlay Enhancement (Current Partial Solution)**

**Complexity:** Low (already partially implemented)  
**Current State:** You have a gradient mask at the top of the iframe

**Enhancement:**
- Extend the mask to cover the entire variant picker area
- Add a clear message: "Device selection locked. Change in Step 1 above."
- Make the overlay more prominent

**UX Impact:**
- ✅ Visual blocking of picker
- ⚠️ Still shows checkboxes (may confuse)
- ⚠️ Requires maintenance if Printful UI changes

---

## Recommended Approach: **Option 1 + Enhanced Helper Text**

### Implementation Plan

1. **Disable variant selection in Printful config:**
   ```typescript
   isVariantSelectionDisabled: true
   ```

2. **Enhance helper pill messaging:**
   - Current: "Variant locked to your SnapCase selection"
   - Enhanced: "Device locked to your selection. Change device in Step 1 above."
   - Add visual indicator (lock icon)

3. **Update CTA helper text when variant mismatch detected:**
   - "Device changed in Printful. Please reselect in Step 1."

4. **Add tooltip/help text:**
   - "You selected [Device Name] in Step 1. To change, go back to device selection."

### Code Changes Needed

**File:** `src/components/editor/edm-editor.tsx` (or wherever `buildPrintfulConfig` is defined)

```typescript
// In buildPrintfulConfig call:
{
  // ... existing config
  isVariantSelectionDisabled: true, // Add this
  lockVariant: true, // Change from false to true
}
```

**File:** `src/app/design/page.tsx`

```typescript
// Enhance helper pill:
<div className="helper-pill">
  <LockIcon />
  <span>Device locked to your selection. Change in Step 1 above.</span>
</div>
```

---

## Alternative: If Printful Doesn't Support Full Disable

If `isVariantSelectionDisabled` doesn't fully hide the picker:

1. **Use CSS overlay** (enhance current mask):
   ```css
   /* Extend current mask to cover picker area */
   .printful-picker-mask {
     height: 120px; /* Cover entire picker */
     z-index: 10;
     pointer-events: none;
   }
   ```

2. **Add informational banner inside iframe area:**
   - "Your device is locked. To change, use the device selector above."

3. **Monitor Printful API updates** for better picker control options

---

## User Testing Recommendations

After implementing Option 1, test with users:

1. **Task:** "Change your phone case to a different model"
   - Expected: User goes to Step 1, not confused by hidden picker
   - Success: 90%+ complete task without confusion

2. **Task:** "Design a case for your current selection"
   - Expected: User proceeds directly to design
   - Success: No hesitation or confusion about selection

3. **Question:** "Can you select multiple cases?"
   - Expected: "No, I select one device first"
   - Success: Clear understanding of flow

---

## Printful API v2 Reference

Based on Printful EDM API v2 documentation:
- `isVariantSelectionDisabled`: Boolean - Hides/disables variant picker
- `preselectedVariants`: Array - Pre-selects specific variants
- `lockVariant`: Custom flag (may need verification with Printful)

**Next Steps:**
1. Verify `isVariantSelectionDisabled` behavior with Printful support
2. Test in dev environment
3. Implement Option 1
4. Update helper text
5. User test

---

## Summary

**Best Solution:** Option 1 (Disable variant selection entirely)
- Simplest implementation
- Clearest UX
- Aligns with your architecture
- Minimal code changes

**Fallback:** Option 4 (Enhanced CSS overlay) if Printful doesn't support full disable

**Key Principle:** Single source of truth for device selection = SnapCase Step 1. Printful EDM should focus on design, not device selection.

