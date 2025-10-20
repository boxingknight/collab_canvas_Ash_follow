# Bug Tracking System

## Overview
This document establishes our bug tracking methodology for the PR_PARTY documentation system. Every PR should include a comprehensive bug analysis section.

## Bug Documentation Template

### For Each PR, Include:

1. **High-Level Bug Summary**
   - Total bugs encountered
   - Critical vs minor bugs
   - Root cause categories
   - Time spent debugging

2. **Detailed Bug Analysis**
   - Bug #1: [Name] (Severity)
   - Bug #2: [Name] (Severity)
   - etc.

3. **For Each Bug, Document:**
   - **Discovery**: When/how was it found?
   - **Symptoms**: What did the user see?
   - **Root Cause**: Technical explanation
   - **Failed Attempts**: What didn't work and why
   - **Solution**: What finally worked
   - **Prevention**: How to avoid in future
   - **Files Modified**: Which files were changed
   - **Time to Fix**: How long it took

4. **Lessons Learned**
   - Key insights gained
   - Patterns to watch for
   - Debugging strategies that worked
   - Best practices discovered

## Bug Severity Levels

- **CRITICAL**: Feature completely broken, blocks core functionality
- **HIGH**: Major functionality impaired, significant user impact
- **MEDIUM**: Minor functionality issues, workarounds available
- **LOW**: Cosmetic issues, edge cases

## Root Cause Categories

- **Data Flow**: Issues with data not reaching the right place
- **State Management**: React/Konva state synchronization
- **Event Handling**: Incorrect event propagation or handling
- **Architecture**: Wrong patterns or approaches
- **Configuration**: Missing or incorrect setup
- **Logic**: Algorithmic or business logic errors

## Benefits of This System

1. **Knowledge Preservation**: Future developers can learn from our mistakes
2. **Pattern Recognition**: Identify common bug types across PRs
3. **Debugging Efficiency**: Faster resolution of similar issues
4. **Quality Improvement**: Proactive prevention of known issues
5. **Documentation Value**: Comprehensive understanding of system behavior

---

**Last Updated**: October 20, 2025  
**Status**: Active  
**Next Review**: After critical bugs are resolved

---

## 🔥 CRITICAL BUG LOG

### Bug #1: Landing Page Self-Destruction (October 20, 2025)

**Severity**: CRITICAL 🔴  
**Status**: ✅ FIXED  
**Time to Debug**: 15 minutes  
**Time to Fix**: 1 minute  

#### Discovery
User reported: "AI built a landing page and then erased it element by element before failing"

#### Symptoms
1. User sends command: "create a landing page"
2. AI creates 26 shapes successfully (nav, hero, email signup, features, footer background)
3. All shapes appear on canvas
4. Suddenly shapes start disappearing ONE BY ONE
5. All shapes gone
6. Error message: "Failed to create landing page. Please try again."

#### Root Cause
**Missing `canvasId` property** in footer text shape (shape #27 of 27).

```javascript
// Shape 27 was missing canvasId:
const footerTextId = await addShape({
  type: 'text',
  // ... other properties
  rotation: 0  // ❌ Missing canvasId!
}, userId);
```

The `addShape()` function requires `canvasId` in the shapeData object. When shape #27 failed:
1. Error thrown
2. Catch block triggered
3. Cleanup loop deleted all 26 previous shapes **sequentially** with `await`
4. User watched shapes disappear one by one (visible because sequential)

#### Failed Attempts
None - bug was identified immediately upon investigation.

#### Solution
Added missing `, canvasId` property to footer text shape:

```diff
  rotation: 0,
+ canvasId
}, userId);
```

**File**: `collabcanvas/src/services/canvasAPI.js:2013-2014`

#### Prevention Strategies
1. **Input validation**: Add validation to `addShape()` to check for required fields
2. **TypeScript**: Use TypeScript to catch missing properties at compile time
3. **Parallel cleanup**: Use `Promise.all()` for faster, less visible cleanup
4. **Consistent patterns**: Use Prettier for consistent code formatting
5. **Edge case testing**: Always test first and last elements

#### Files Modified
- `collabcanvas/src/services/canvasAPI.js` (1 line added)

#### Lessons Learned
1. **Edge cases matter**: Bug was in the LAST shape of 27
2. **Sequential operations are visible**: Cleanup loop used `await` which made deletion visible
3. **Missing properties can cascade**: One missing property caused complete failure
4. **Cleanup should be fast**: Sequential cleanup created confusing UX
5. **Validation is critical**: Early validation prevents cascading failures

#### Documentation Created
- `BUG_REPORT_LANDING_PAGE.md` (comprehensive 400-line analysis)
- `BUG_FIX_SUMMARY.md` (quick reference)
- `BUG_VISUALIZATION.md` (visual flow diagrams)






