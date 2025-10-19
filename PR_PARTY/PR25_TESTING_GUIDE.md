# PR #25: Properties Panel - Testing Guide
## Comprehensive Test Plan for Figma-Style Inspector

**Date**: October 19, 2025  
**Feature**: Properties Panel & Alignment Tools  
**Scope**: 75+ Test Cases

---

## 🎯 Testing Strategy

### Testing Pyramid

```
        ┌──────────────┐
        │  E2E Tests   │  15 tests (Multi-user, Production)
        │   (Manual)   │
        ├──────────────┤
        │ Integration  │  30 tests (Component + Canvas)
        │    Tests     │
        ├──────────────┤
        │  Unit Tests  │  30 tests (Individual components)
        │ (Automated)  │
        └──────────────┘
```

### Test Categories
1. **Unit Tests**: Individual component behavior
2. **Integration Tests**: Panel + Canvas interaction
3. **Multi-User Tests**: Concurrent editing scenarios
4. **Performance Tests**: Responsiveness under load
5. **Edge Case Tests**: Boundary conditions, mixed types

---

## 📋 Test Cases

### Category 1: Panel Visibility & Selection (8 tests)

#### Test 1.1: Panel Appears on Shape Selection
**Setup**: No shapes selected  
**Action**: Click a rectangle  
**Expected**:
- ✅ Properties panel appears on right side
- ✅ Panel shows "Rectangle" as shape type
- ✅ All rectangle properties visible

#### Test 1.2: Panel Updates on Selection Change
**Setup**: Rectangle selected, panel open  
**Action**: Click a circle  
**Expected**:
- ✅ Panel updates to show "Circle" properties
- ✅ Radius field appears (not width/height)
- ✅ Transition is smooth (<100ms)

#### Test 1.3: Panel Shows Empty State When Nothing Selected
**Setup**: Rectangle selected, panel open  
**Action**: Press Escape (deselect)  
**Expected**:
- ✅ Panel shows "No Selection" message
- ✅ Helpful shortcuts displayed
- ✅ No input fields visible

#### Test 1.4: Panel Shows Multi-Select State
**Setup**: No selection  
**Action**: Shift-click 3 rectangles  
**Expected**:
- ✅ Panel shows "3 shapes selected"
- ✅ Common properties visible
- ✅ Position/size shows group bounds (read-only)

#### Test 1.5: Panel Persists Across Page Refresh
**Setup**: Rectangle selected, panel open  
**Action**: Refresh page (Cmd+R)  
**Expected**:
- ✅ Panel still open
- ✅ Same rectangle selected
- ✅ Properties populated correctly

#### Test 1.6: Panel Responds to Keyboard Selection
**Setup**: 5 shapes on canvas  
**Action**: Press Tab to cycle through shapes  
**Expected**:
- ✅ Panel updates as each shape selected
- ✅ Properties change correctly
- ✅ No lag or stutter

#### Test 1.7: Panel Handles Rapid Selection Changes
**Setup**: 10 shapes on canvas  
**Action**: Rapidly click different shapes (1 per second for 10 seconds)  
**Expected**:
- ✅ Panel updates every time
- ✅ No crashes or errors
- ✅ Values always match selected shape

#### Test 1.8: Panel Shows Mixed Values for Multi-Select
**Setup**: 3 rectangles with different colors (red, blue, green)  
**Action**: Select all 3 with shift-click  
**Expected**:
- ✅ Color field shows "Mixed" or multi-color indicator
- ✅ Changing color updates all 3 shapes
- ✅ Width/height shows "Mixed" if different

---

### Category 2: Position & Size Editing (12 tests)

#### Test 2.1: X Position Input Updates Shape
**Setup**: Rectangle at X: 1000  
**Action**: Type "1500" in X input, press Enter  
**Expected**:
- ✅ Rectangle moves to X: 1500
- ✅ Update syncs to Firebase
- ✅ Other users see movement

#### Test 2.2: Y Position Input Updates Shape
**Setup**: Rectangle at Y: 1000  
**Action**: Type "1500" in Y input, press Enter  
**Expected**:
- ✅ Rectangle moves to Y: 1500
- ✅ Canvas auto-pans if shape goes off-screen

#### Test 2.3: Width Input Resizes Shape
**Setup**: Rectangle width: 200  
**Action**: Type "400" in W input  
**Expected**:
- ✅ Rectangle width becomes 400
- ✅ Height stays same (no aspect ratio lock unless enabled)
- ✅ Position (top-left) stays same

#### Test 2.4: Height Input Resizes Shape
**Setup**: Rectangle height: 150  
**Action**: Type "300" in H input  
**Expected**:
- ✅ Rectangle height becomes 300
- ✅ Width stays same

#### Test 2.5: Rotation Input Rotates Shape
**Setup**: Rectangle rotation: 0°  
**Action**: Type "45" in R input  
**Expected**:
- ✅ Rectangle rotates 45°
- ✅ Position (center) stays same
- ✅ Konva transformer updates

#### Test 2.6: Input Validates Min/Max Ranges
**Setup**: Rectangle width: 200  
**Action**: Type "-100" in W input  
**Expected**:
- ✅ Input rejects negative value
- ✅ Shows validation error or clamps to min (e.g., 10)
- ✅ Shape doesn't break

#### Test 2.7: Input Rejects Non-Numeric Characters
**Setup**: Rectangle width: 200  
**Action**: Type "abc123" in W input  
**Expected**:
- ✅ Only "123" accepted
- ✅ Letters filtered out
- ✅ No NaN errors

#### Test 2.8: Debounced Updates Don't Lag
**Setup**: Rectangle width: 200  
**Action**: Rapidly type "3", "0", "0" (fast typing)  
**Expected**:
- ✅ Local state updates immediately (shows "300")
- ✅ Firebase update debounced (fires once after 300ms)
- ✅ No visual lag

#### Test 2.9: Updates Flush on Selection Change
**Setup**: Rectangle width: 200  
**Action**: Type "300", immediately click another shape (before 300ms)  
**Expected**:
- ✅ Width update still saves to "300"
- ✅ Debounce flushes on unmount
- ✅ No lost edits

#### Test 2.10: External Changes Update Panel
**Setup**: User A selects rectangle (width: 200), User B changes width to 400  
**Action**: Wait for Firebase sync  
**Expected**:
- ✅ User A's panel updates to show 400
- ✅ Update happens within 1 second
- ✅ No conflicts

#### Test 2.11: Circle Radius Input Works
**Setup**: Circle radius: 50  
**Action**: Type "100" in Radius input  
**Expected**:
- ✅ Circle grows to radius 100
- ✅ Center position stays same
- ✅ No width/height fields visible

#### Test 2.12: Multi-Select Position Shows Group Bounds
**Setup**: 3 rectangles selected (at different positions)  
**Action**: Look at position inputs  
**Expected**:
- ✅ X/Y shows bounding box top-left (read-only)
- ✅ W/H shows bounding box dimensions (read-only)
- ✅ Cannot edit position directly (grayed out)

---

### Category 3: Color & Appearance (10 tests)

#### Test 3.1: Color Picker Opens on Click
**Setup**: Rectangle selected (color: blue)  
**Action**: Click color swatch  
**Expected**:
- ✅ Color picker modal opens
- ✅ Current color (blue) is highlighted
- ✅ Modal positioned near swatch

#### Test 3.2: Hex Input Changes Color
**Setup**: Color picker open  
**Action**: Type "#FF0000" in hex input, press Enter  
**Expected**:
- ✅ Shape color changes to red
- ✅ Color picker updates to show red
- ✅ Recent colors updates

#### Test 3.3: Color Swatch Click Changes Color
**Setup**: Color picker open, palette visible  
**Action**: Click green swatch in palette  
**Expected**:
- ✅ Shape color changes to green
- ✅ Picker closes (or stays open, depends on UX choice)
- ✅ Recent colors adds green

#### Test 3.4: Recent Colors Saves Last 8
**Setup**: Pick 10 different colors  
**Action**: Open color picker  
**Expected**:
- ✅ Only last 8 colors shown in recent
- ✅ Most recent on left
- ✅ Saved to localStorage (persists on refresh)

#### Test 3.5: Recent Colors Removes Duplicates
**Setup**: Pick red, blue, red, green  
**Action**: Open color picker  
**Expected**:
- ✅ Recent shows: green, red, blue (red only once)
- ✅ Most recent pick comes first

#### Test 3.6: Color Picker Modal Doesn't Clip
**Setup**: Scroll properties panel to bottom  
**Action**: Click color swatch near bottom  
**Expected**:
- ✅ Modal opens above swatch (if no room below)
- ✅ Entire modal visible
- ✅ No clipping at viewport edge

#### Test 3.7: Color Changes Apply to Multi-Select
**Setup**: 5 rectangles selected (various colors)  
**Action**: Pick red from color picker  
**Expected**:
- ✅ All 5 rectangles turn red
- ✅ Color updates in one batch
- ✅ Other users see all changes

#### Test 3.8: Invalid Hex Shows Error
**Setup**: Color picker open  
**Action**: Type "ZZZZZZ" in hex input  
**Expected**:
- ✅ Validation error shown
- ✅ Shape color doesn't change
- ✅ Previous color preserved

#### Test 3.9: Color Picker Closes on Outside Click
**Setup**: Color picker open  
**Action**: Click anywhere on canvas  
**Expected**:
- ✅ Color picker closes
- ✅ Current color saved
- ✅ No errors

#### Test 3.10: Line Stroke Color Works
**Setup**: Line selected (color: black)  
**Action**: Change color to red  
**Expected**:
- ✅ Line color changes to red
- ✅ Label says "Stroke" not "Fill"
- ✅ Works same as shape fill

---

### Category 4: Alignment Tools (15 tests) ⭐ CRITICAL

#### Test 4.1: Align Left with Single Shape
**Setup**: Rectangle at X: 1500  
**Action**: Click "Align Left" button  
**Expected**:
- ✅ Rectangle moves to X: BOUNDARY_PADDING (e.g., 50)
- ✅ Y position unchanged
- ✅ Other properties unchanged

#### Test 4.2: Align Center Horizontal with Single Shape
**Setup**: Rectangle at X: 1000, width: 200  
**Action**: Click "Align Center H" button  
**Expected**:
- ✅ Rectangle moves to X: 2400 (2500 - 100)
- ✅ Rectangle visually centered on canvas
- ✅ Y position unchanged

#### Test 4.3: Align Right with Single Shape
**Setup**: Rectangle at X: 1000, width: 200  
**Action**: Click "Align Right" button  
**Expected**:
- ✅ Rectangle moves to X: 4750 (5000 - BOUNDARY_PADDING - 200)
- ✅ Right edge at canvas boundary
- ✅ Y position unchanged

#### Test 4.4: Align Top with Single Shape
**Setup**: Rectangle at Y: 1500  
**Action**: Click "Align Top" button  
**Expected**:
- ✅ Rectangle moves to Y: BOUNDARY_PADDING
- ✅ X position unchanged

#### Test 4.5: Align Middle Vertical with Single Shape
**Setup**: Rectangle at Y: 1000, height: 150  
**Action**: Click "Align Middle V" button  
**Expected**:
- ✅ Rectangle moves to Y: 2425 (2500 - 75)
- ✅ Rectangle visually centered vertically
- ✅ X position unchanged

#### Test 4.6: Align Bottom with Single Shape
**Setup**: Rectangle at Y: 1000, height: 150  
**Action**: Click "Align Bottom" button  
**Expected**:
- ✅ Rectangle moves to Y: 4800 (5000 - BOUNDARY_PADDING - 150)
- ✅ Bottom edge at canvas boundary

#### Test 4.7: Align Left with Multi-Select
**Setup**: 3 rectangles at X: 500, 1000, 1500  
**Action**: Select all 3, click "Align Left"  
**Expected**:
- ✅ All 3 rectangles move to X: 500 (leftmost)
- ✅ Vertical positions unchanged
- ✅ Relative spacing lost (stacked)

#### Test 4.8: Distribute Horizontally with 3+ Shapes
**Setup**: 4 rectangles at X: 100, 200, 1000, 4000  
**Action**: Select all 4, click "Distribute H"  
**Expected**:
- ✅ Shapes spaced evenly between leftmost and rightmost
- ✅ First and last shapes don't move
- ✅ Middle shapes repositioned for equal gaps

#### Test 4.9: Distribute Vertically with 3+ Shapes
**Setup**: 4 circles at Y: 100, 300, 2000, 4500  
**Action**: Select all 4, click "Distribute V"  
**Expected**:
- ✅ Shapes spaced evenly between topmost and bottommost
- ✅ First and last shapes don't move

#### Test 4.10: Distribute Disabled with <3 Shapes
**Setup**: 2 rectangles selected  
**Action**: Hover over "Distribute H" button  
**Expected**:
- ✅ Button is disabled (grayed out)
- ✅ Tooltip shows "Select 3+ shapes to distribute"
- ✅ Click does nothing

#### Test 4.11: Center on Canvas with Single Shape
**Setup**: Rectangle at X: 100, Y: 100, W: 200, H: 150  
**Action**: Click "Center on Canvas" button  
**Expected**:
- ✅ Rectangle moves to X: 2400, Y: 2425
- ✅ Rectangle visually centered on canvas
- ✅ Size unchanged

#### Test 4.12: Center on Canvas with Multi-Select
**Setup**: 3 rectangles forming a group  
**Action**: Select all 3, click "Center on Canvas"  
**Expected**:
- ✅ Group center moves to (2500, 2500)
- ✅ Relative positions within group preserved
- ✅ All shapes move together

#### Test 4.13: Alignment with Mixed Shape Types
**Setup**: 1 rectangle + 1 circle + 1 line selected  
**Action**: Click "Align Center H"  
**Expected**:
- ✅ All shapes align to canvas horizontal center
- ✅ Rectangle: X adjusted for width
- ✅ Circle: X set to center (already center-based)
- ✅ Line: X1 and X2 adjusted to center midpoint

#### Test 4.14: Alignment Near Canvas Boundaries
**Setup**: Rectangle at X: 5, Y: 5 (very close to edge)  
**Action**: Click "Align Left"  
**Expected**:
- ✅ Rectangle clamped to BOUNDARY_PADDING
- ✅ Doesn't go negative or off-canvas
- ✅ No errors

#### Test 4.15: Alignment Operations Sync to Other Users
**Setup**: User A selects 3 shapes  
**Action**: User A clicks "Align Center", User B watches  
**Expected**:
- ✅ User B sees all 3 shapes align smoothly
- ✅ Sync happens within 1 second
- ✅ No shape jumping or lag

---

### Category 5: Layer Controls (6 tests)

#### Test 5.1: Bring Forward Increases zIndex
**Setup**: 3 overlapping rectangles (zIndex: 1, 2, 3), middle one selected  
**Action**: Click "Bring Forward" button  
**Expected**:
- ✅ Selected shape's zIndex increases by 0.01
- ✅ Shape moves forward one visual layer
- ✅ Other users see change

#### Test 5.2: Send Backward Decreases zIndex
**Setup**: 3 overlapping rectangles, top one selected  
**Action**: Click "Send Backward"  
**Expected**:
- ✅ Selected shape's zIndex decreases by 0.01
- ✅ Shape moves back one visual layer

#### Test 5.3: Bring to Front Sets Highest zIndex
**Setup**: 10 overlapping shapes, bottom one selected  
**Action**: Click "Bring to Front"  
**Expected**:
- ✅ Selected shape zIndex = max zIndex + 1
- ✅ Shape is now topmost

#### Test 5.4: Send to Back Sets Lowest zIndex
**Setup**: 10 overlapping shapes, top one selected  
**Action**: Click "Send to Back"  
**Expected**:
- ✅ Selected shape zIndex = min zIndex - 1
- ✅ Shape is now bottommost

#### Test 5.5: Layer Controls Work with Multi-Select
**Setup**: 3 shapes selected (various zIndexes)  
**Action**: Click "Bring to Front"  
**Expected**:
- ✅ All 3 shapes move to front together
- ✅ Relative order within group preserved
- ✅ All above other shapes

#### Test 5.6: Layer Controls Match Context Menu
**Setup**: Shape selected  
**Action**: Use "Bring Forward" from properties panel, then right-click and use context menu  
**Expected**:
- ✅ Both methods work identically
- ✅ Same zIndex changes
- ✅ No conflicts

---

### Category 6: Text Properties (12 tests) ⭐

#### Test 6.1: Bold Toggle Works
**Setup**: Text selected (fontWeight: "normal")  
**Action**: Click Bold [B] button  
**Expected**:
- ✅ Text becomes bold (fontWeight: "bold")
- ✅ Button shows active state (highlighted)
- ✅ Text visually bolder on canvas

#### Test 6.2: Bold Toggle Off
**Setup**: Bold text selected (fontWeight: "bold")  
**Action**: Click Bold [B] button again  
**Expected**:
- ✅ Text becomes normal (fontWeight: "normal")
- ✅ Button inactive state
- ✅ Text visually normal

#### Test 6.3: Italic Toggle Works
**Setup**: Text selected (fontStyle: "normal")  
**Action**: Click Italic [I] button  
**Expected**:
- ✅ Text becomes italic (fontStyle: "italic")
- ✅ Button active state
- ✅ Text visually italicized

#### Test 6.4: Underline Toggle Works
**Setup**: Text selected (textDecoration: "none")  
**Action**: Click Underline [U] button  
**Expected**:
- ✅ Text gets underline (textDecoration: "underline")
- ✅ Button active state
- ✅ Underline visible on canvas

#### Test 6.5: Multiple Format Toggles Combine
**Setup**: Normal text selected  
**Action**: Click Bold, then Italic, then Underline  
**Expected**:
- ✅ Text is bold AND italic AND underlined
- ✅ All 3 buttons show active state
- ✅ Properties don't conflict

#### Test 6.6: Font Size Dropdown Changes Size
**Setup**: Text selected (fontSize: 16)  
**Action**: Select "24" from font size dropdown  
**Expected**:
- ✅ Text resizes to 24px
- ✅ Text box may auto-grow (if auto-size)
- ✅ Position stays same

#### Test 6.7: Font Size Custom Input
**Setup**: Text selected (fontSize: 16)  
**Action**: Type "17" in font size input  
**Expected**:
- ✅ Text resizes to 17px
- ✅ Dropdown shows "17" (custom)
- ✅ Works even if 17 not in presets

#### Test 6.8: Text Align Left
**Setup**: Text selected, multi-line text  
**Action**: Click Align Left [◀] button  
**Expected**:
- ✅ Text aligns left within its box (align: "left")
- ✅ Shape position doesn't move
- ✅ Only text alignment changes

#### Test 6.9: Text Align Center
**Setup**: Text selected, multi-line text  
**Action**: Click Align Center [▬] button  
**Expected**:
- ✅ Text aligns center within its box (align: "center")
- ✅ Shape position doesn't move

#### Test 6.10: Text Align Right
**Setup**: Text selected, multi-line text  
**Action**: Click Align Right [▶] button  
**Expected**:
- ✅ Text aligns right within its box (align: "right")

#### Test 6.11: Font Weight Dropdown
**Setup**: Text selected (fontWeight: "normal")  
**Action**: Select "bold" from weight dropdown  
**Expected**:
- ✅ Same as clicking Bold button
- ✅ Text becomes bold
- ✅ Bold button shows active

#### Test 6.12: Text Color Picker
**Setup**: Text selected (color: black)  
**Action**: Pick red from color picker  
**Expected**:
- ✅ Text color changes to red
- ✅ Works same as shape color picker
- ✅ Recent colors updates

---

### Category 7: Line Properties (5 tests)

#### Test 7.1: Line Start Point X1, Y1 Inputs
**Setup**: Line from (100, 100) to (500, 500)  
**Action**: Change X1 to 200  
**Expected**:
- ✅ Line start point moves to (200, 100)
- ✅ End point stays at (500, 500)
- ✅ Line redraws correctly

#### Test 7.2: Line End Point X2, Y2 Inputs
**Setup**: Line from (100, 100) to (500, 500)  
**Action**: Change Y2 to 300  
**Expected**:
- ✅ Line end point moves to (500, 300)
- ✅ Start point stays at (100, 100)

#### Test 7.3: Line Stroke Weight Slider
**Setup**: Line with strokeWidth: 2  
**Action**: Drag slider to 8  
**Expected**:
- ✅ Line thickness increases to 8px
- ✅ Line visually thicker on canvas
- ✅ Hit detection area increases

#### Test 7.4: Line Length Read-Only Calculation
**Setup**: Line from (0, 0) to (300, 400)  
**Action**: Look at Length field  
**Expected**:
- ✅ Shows "500px" (Pythagorean: √(300² + 400²))
- ✅ Field is read-only (cannot edit)
- ✅ Updates when endpoints change

#### Test 7.5: Line Color Changes Stroke
**Setup**: Line with color: black  
**Action**: Pick blue from color picker  
**Expected**:
- ✅ Line stroke changes to blue
- ✅ Label says "Stroke" not "Fill"
- ✅ Works correctly

---

### Category 8: Multi-User Scenarios (12 tests)

#### Test 8.1: Two Users Edit Different Properties
**Setup**: User A and B select same shape  
**Action**: User A changes X, User B changes color (simultaneously)  
**Expected**:
- ✅ Both changes apply
- ✅ No conflicts (Firestore merges)
- ✅ Both users see both changes

#### Test 8.2: Two Users Change Same Property
**Setup**: User A and B select same shape  
**Action**: User A sets width to 200, User B sets width to 300 (within 100ms)  
**Expected**:
- ✅ Last write wins (either 200 or 300)
- ✅ Both users see same final value
- ✅ No crashes or errors

#### Test 8.3: User A Edits While User B Deletes
**Setup**: User A editing shape properties, User B selects same shape  
**Action**: User B presses Delete  
**Expected**:
- ✅ Shape deleted (User B wins)
- ✅ User A's panel shows "No Selection"
- ✅ No errors from editing deleted shape

#### Test 8.4: Alignment Operations with Multi-User
**Setup**: User A selects 3 shapes  
**Action**: User A clicks "Align Center" while User B watches  
**Expected**:
- ✅ User B sees all 3 shapes align smoothly
- ✅ Sync within 1 second
- ✅ No shape duplication or ghosting

#### Test 8.5: Color Changes Propagate
**Setup**: User A edits shape color to red  
**Action**: User B has same shape selected, watches  
**Expected**:
- ✅ User B's color picker updates to show red
- ✅ User B's panel reflects new color
- ✅ Canvas updates for both

#### Test 8.6: Rapid Property Changes from Different Users
**Setup**: User A, B, C all select same shape  
**Action**: All 3 rapidly change different properties (X, Y, color, width, height)  
**Expected**:
- ✅ All changes eventually apply
- ✅ No lost updates
- ✅ Final state consistent for all users

#### Test 8.7: Property Panel State Stays Per-User
**Setup**: User A has panel open, User B has panel closed  
**Action**: User B selects shape  
**Expected**:
- ✅ User A's panel stays open (doesn't close)
- ✅ User B's panel opens (independent)
- ✅ Panel state is client-side only

#### Test 8.8: Selection is Independent Per User
**Setup**: User A selects rectangle  
**Action**: User B selects circle  
**Expected**:
- ✅ User A's panel shows rectangle properties
- ✅ User B's panel shows circle properties
- ✅ Selections don't conflict

#### Test 8.9: User A Edits While User B Moves
**Setup**: User A has properties panel open for shape  
**Action**: User B drags same shape across canvas  
**Expected**:
- ✅ User A's X/Y inputs update in real-time
- ✅ No conflicts between drag and input
- ✅ Smooth updates

#### Test 8.10: Format Changes Propagate
**Setup**: User A has text selected  
**Action**: User A clicks Bold, User B watches  
**Expected**:
- ✅ User B sees text become bold
- ✅ If User B selects same text, Bold button is active
- ✅ Sync within 1 second

#### Test 8.11: Alignment with Different Users Selecting Different Shapes
**Setup**: User A selects shapes 1,2,3. User B selects shapes 4,5,6.  
**Action**: User A aligns their selection, User B aligns theirs (simultaneously)  
**Expected**:
- ✅ Both alignment operations complete
- ✅ No interference
- ✅ Each user's selection aligns independently

#### Test 8.12: Network Interruption During Edit
**Setup**: User A editing shape properties  
**Action**: User A's network drops for 10 seconds, User A continues editing, network returns  
**Expected**:
- ✅ Edits queue locally
- ✅ On reconnect, edits sync to Firebase
- ✅ No data loss

---

### Category 9: Performance Tests (5 tests)

#### Test 9.1: Properties Panel with 500+ Shapes on Canvas
**Setup**: Generate 500 shapes using AI  
**Action**: Select one shape, edit properties  
**Expected**:
- ✅ Panel opens instantly (<100ms)
- ✅ No lag when typing in inputs
- ✅ Canvas maintains 60 FPS

#### Test 9.2: Rapid Property Changes
**Setup**: Shape selected  
**Action**: Rapidly change multiple properties (X, Y, W, H, color) within 5 seconds  
**Expected**:
- ✅ All changes apply
- ✅ No dropped updates
- ✅ Debouncing works correctly

#### Test 9.3: Alignment with 50+ Shapes
**Setup**: 50 rectangles scattered on canvas  
**Action**: Select all 50, click "Align Center"  
**Expected**:
- ✅ Operation completes within 2 seconds
- ✅ All 50 shapes align correctly
- ✅ No crashes or freezing

#### Test 9.4: Color Picker with Many Recent Colors
**Setup**: Pick 100 different colors over time  
**Action**: Open color picker  
**Expected**:
- ✅ Only last 8 colors shown (no overflow)
- ✅ Picker opens instantly
- ✅ No performance degradation

#### Test 9.5: Multi-User with Heavy Load
**Setup**: 5 users on same canvas with 300 shapes  
**Action**: All 5 users edit properties simultaneously  
**Expected**:
- ✅ All edits propagate within 2 seconds
- ✅ No conflicts or errors
- ✅ Canvas stays responsive for all users

---

## 🎯 Critical Path Tests (Must Pass)

### Before Deployment
These tests MUST pass before merging PR #25:

1. ✅ **Test 1.1** - Panel appears on selection
2. ✅ **Test 2.1** - X position input works
3. ✅ **Test 2.3** - Width input works
4. ✅ **Test 3.1** - Color picker opens
5. ✅ **Test 4.2** - Align Center H works
6. ✅ **Test 4.8** - Distribute Horizontally works
7. ✅ **Test 5.1** - Layer controls work
8. ✅ **Test 6.1** - Bold toggle works
9. ✅ **Test 6.8** - Text align left works
10. ✅ **Test 8.1** - Multi-user edits work

**Passing 10/10**: Deploy-ready  
**Passing 8-9/10**: Fix issues then deploy  
**Passing <8/10**: Do not deploy

---

## 📊 Test Results Template

```markdown
## Test Execution Results

**Date**: [Date]
**Branch**: feature/pr25-properties-panel
**Tester**: [Name]

### Summary
- Total Tests: 75
- Passed: __
- Failed: __
- Skipped: __
- Pass Rate: __%

### Category Results
| Category | Total | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| Panel Visibility | 8 | __ | __ | __% |
| Position & Size | 12 | __ | __ | __% |
| Color & Appearance | 10 | __ | __ | __% |
| Alignment Tools | 15 | __ | __ | __% |
| Layer Controls | 6 | __ | __ | __% |
| Text Properties | 12 | __ | __ | __% |
| Line Properties | 5 | __ | __ | __% |
| Multi-User | 12 | __ | __ | __% |
| Performance | 5 | __ | __ | __% |

### Failed Tests
1. [Test ID] - [Reason] - [Severity]
2. ...

### Notes
- [Any observations]
- [Performance metrics]
- [Browser compatibility]
```

---

## 🚀 Testing Checklist

### Pre-Implementation Testing
- [ ] Review all test cases
- [ ] Set up test environment (local + deployed)
- [ ] Prepare test data (various shapes)
- [ ] Open 2-3 browser windows for multi-user

### During Implementation Testing
- [ ] Unit test each component as built
- [ ] Integration test after each phase
- [ ] Test with real-time Firebase
- [ ] Fix bugs immediately

### Post-Implementation Testing
- [ ] Run all 75 test cases
- [ ] Document results
- [ ] Fix any critical failures
- [ ] Re-test fixed issues
- [ ] Get second tester to verify

### Pre-Deployment Testing
- [ ] Test on deployed environment
- [ ] Test with 3+ real users
- [ ] Performance test with 500+ shapes
- [ ] Cross-browser test (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness check

---

**END OF TESTING GUIDE**

📋 75 Test Cases | Ready for Comprehensive QA

