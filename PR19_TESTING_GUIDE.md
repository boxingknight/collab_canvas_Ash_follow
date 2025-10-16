# PR #19: AI Chat Interface - Testing Guide 🧪

## Build Complete! ✅

All components have been implemented and integrated. The dev server is now running.

---

## What Was Built

### Components Created (5 files)
1. **AIChat.jsx** - Main container with keyboard shortcuts
2. **AIHeader.jsx** - Collapsible header with clear button
3. **AIHistory.jsx** - Scrollable message display with examples
4. **AICommandInput.jsx** - Text input with auto-focus
5. **AIFeedback.jsx** - Loading and error indicators

### Hook Created
- **useAI.js** - State management for messages, processing, errors, expand/collapse

### Styling Added
- **500+ lines of CSS** in `index.css`
- Responsive design (desktop, tablet, mobile)
- Light/dark mode support
- Smooth animations and transitions

### Integration
- ✅ Integrated into AppLayout.jsx
- ✅ Fixed bottom-right corner (z-index 20)
- ✅ No linting errors

---

## Manual Testing Checklist

### Basic Functionality

#### Panel Behavior
- [ ] Chat panel appears in bottom-right corner
- [ ] Panel is collapsed by default (60px height)
- [ ] Clicking header expands panel smoothly
- [ ] Clicking header again collapses panel
- [ ] Panel shows examples when empty

#### Visual Design
- [ ] Panel has rounded corners and shadow
- [ ] Header shows 🤖 icon and "AI Assistant" title
- [ ] Clear button (🗑️) visible when expanded
- [ ] Minimize button (−/+) works correctly
- [ ] Colors match app theme (dark mode)

#### Keyboard Shortcuts
- [ ] **Cmd+K** (Mac) or **Ctrl+K** (Windows) expands panel and focuses input
- [ ] **/** key expands panel and focuses input
- [ ] Shortcuts work from anywhere in app
- [ ] Shortcuts don't fire during text editing on canvas

---

### AI Command Testing

#### Simple Commands (Creation)
Test these commands one by one:

1. **Rectangle Creation**
   ```
   Create a blue rectangle at 100, 100
   ```
   - [ ] User message appears (blue bubble, right side)
   - [ ] Loading indicator shows "AI is thinking..."
   - [ ] AI response appears (gray bubble, left side)
   - [ ] Blue rectangle appears on canvas at position 100, 100
   - [ ] Other users see the rectangle (test in 2nd browser)

2. **Circle Creation**
   ```
   Make a red circle at position 1000, 1000
   ```
   - [ ] Red circle appears on canvas
   - [ ] Real-time sync works (other users see it)

3. **Line Creation**
   ```
   Create a green line from 500, 500 to 800, 600
   ```
   - [ ] Green line appears
   - [ ] Endpoints are correct

4. **Text Creation**
   ```
   Add text that says "Hello World" at 1500, 500
   ```
   - [ ] Text appears on canvas
   - [ ] Text is editable (double-click)

#### Manipulation Commands

5. **Move Shape** (select a shape first)
   ```
   Move the selected shape to 2000, 2000
   ```
   - [ ] Selected shape moves to new position
   - [ ] Movement syncs to other users

6. **Change Color** (select a shape first)
   ```
   Change the selected shape to purple
   ```
   - [ ] Shape color changes
   - [ ] Color syncs to other users

7. **Delete Shape** (select a shape first)
   ```
   Delete the selected shape
   ```
   - [ ] Shape disappears
   - [ ] Deletion syncs to other users

#### Query Commands

8. **Get Canvas State**
   ```
   What shapes are on the canvas?
   ```
   - [ ] AI lists all shapes with properties
   - [ ] Response is accurate

9. **Get Canvas Center**
   ```
   What's the center of the canvas?
   ```
   - [ ] AI responds with coordinates (2500, 2500)

#### Complex Commands (if implemented)

10. **Login Form**
    ```
    Create a login form
    ```
    - [ ] Multiple shapes created (labels, inputs, button)
    - [ ] Shapes arranged vertically
    - [ ] All shapes sync to other users

---

### Error Handling

11. **Invalid Command**
    ```
    Make a flying unicorn
    ```
    - [ ] Error message shows in chat (red background)
    - [ ] Error is user-friendly
    - [ ] Can recover with next valid command

12. **Network Error** (turn off internet temporarily)
    ```
    Create a blue square
    ```
    - [ ] Error message appears
    - [ ] Loading indicator stops
    - [ ] Input becomes enabled again

---

### Message History

- [ ] Messages display in order (oldest to newest)
- [ ] Auto-scroll to bottom on new message
- [ ] User messages on right (blue)
- [ ] AI messages on left (gray)
- [ ] Error messages in center (red)
- [ ] Timestamps show correctly
- [ ] Clear history button removes all messages
- [ ] Examples reappear after clearing

---

### Input Behavior

- [ ] Placeholder text shows: "Ask AI to create or modify shapes..."
- [ ] Typing updates input value
- [ ] Enter key submits command
- [ ] Input clears after submit
- [ ] Input auto-focuses after AI response
- [ ] Submit button disabled when empty
- [ ] Submit button shows ⏳ while processing
- [ ] Input disabled while processing

---

### Real-Time Multi-User Testing

**Setup**: Open 2 browser windows, login as different users

#### User A Actions:
1. Send command: "Create a blue rectangle at 500, 500"
2. Wait for shape to appear

#### User B Verification:
- [ ] User B sees the blue rectangle appear on their canvas
- [ ] Shape appears within <100ms
- [ ] Position and color are correct

#### User B Actions:
1. Send command: "Create a red circle at 1000, 1000"

#### User A Verification:
- [ ] User A sees the red circle appear
- [ ] Real-time sync works both ways

#### Simultaneous Commands:
- [ ] Both users can use AI at the same time
- [ ] No race conditions or conflicts
- [ ] All shapes sync correctly

---

### Responsive Design

#### Desktop (>768px)
- [ ] Panel width is 400px
- [ ] All buttons and text clearly visible
- [ ] Hover effects work

#### Tablet (481-768px)
- [ ] Panel width is 90vw
- [ ] Layout adjusts appropriately
- [ ] Touch interactions work

#### Mobile (<480px)
- [ ] Panel width is 95vw
- [ ] Text is readable
- [ ] Touch interactions work
- [ ] On-screen keyboard doesn't cover input

---

### Performance Testing

- [ ] Panel opens/closes without lag
- [ ] No input delay when typing
- [ ] Smooth scrolling in message history
- [ ] AI response under 2 seconds for simple commands
- [ ] No frame rate drops during AI operations
- [ ] Canvas maintains 60 FPS

#### Stress Test:
1. Send 20+ commands rapidly
- [ ] All messages display correctly
- [ ] No memory leaks
- [ ] Scrolling remains smooth
- [ ] No crashes

---

### Edge Cases

#### Empty State
- [ ] Examples show when no messages
- [ ] Examples include helpful commands
- [ ] Keyboard shortcut hint visible

#### Long Messages
- [ ] Long AI responses wrap correctly
- [ ] No horizontal overflow
- [ ] Readable on all screen sizes

#### Special Characters
```
Create a text that says "Hello 🎨 World!!! @#$%"
```
- [ ] Special characters handled correctly
- [ ] Emojis display properly

#### Rapid Commands
1. Type "Create a blue rectangle"
2. Press Enter
3. Immediately type another command
- [ ] Both commands process correctly
- [ ] No lost messages
- [ ] Order preserved

---

## Known Issues to Watch For

### Potential Problems:

1. **API Key Missing**
   - Symptom: "OpenAI API key not configured" error
   - Fix: Check `.env.local` has `VITE_OPENAI_API_KEY`

2. **AI Service Not Found**
   - Symptom: Import error for `aiService`
   - Fix: Verify `src/services/ai.js` exists from PR #18

3. **Firestore Permission Error**
   - Symptom: Shapes don't save, permission denied
   - Fix: Check Firestore rules, ensure user is authenticated

4. **Keyboard Shortcut Conflicts**
   - Symptom: Browser action fires instead of chat opening
   - Fix: May need to adjust shortcuts

5. **Panel Hidden Behind Canvas**
   - Symptom: Can't see chat panel
   - Fix: Check z-index (should be 20)

---

## Success Criteria

### Must Work ✅
- [x] Panel renders in bottom-right corner
- [x] Expand/collapse functionality
- [x] Text input accepts commands
- [ ] AI commands execute successfully
- [ ] Shapes appear on canvas
- [ ] Real-time sync to all users
- [ ] Loading states show correctly
- [ ] Error messages display properly
- [ ] Keyboard shortcuts work

### If These Work, PR #19 is Complete! 🎉

---

## Testing Priority

**Test in this order:**

1. **Visual/UI** (5 min)
   - Panel appears, expands, collapses
   - Styling looks good
   - No console errors

2. **Basic AI Commands** (10 min)
   - Create rectangle
   - Create circle
   - Create line
   - Create text

3. **Real-Time Sync** (5 min)
   - Open 2 browsers
   - Verify shapes sync

4. **Error Handling** (5 min)
   - Invalid command
   - Network error
   - Recovery

5. **Polish** (5 min)
   - Keyboard shortcuts
   - Responsive design
   - Message history

**Total Testing Time**: ~30 minutes

---

## Report Issues

If you find bugs, note:
1. What command you sent
2. What you expected
3. What actually happened
4. Browser and OS
5. Console error messages (if any)

---

## Next Steps After Testing

**If All Tests Pass:**
1. Commit changes
2. Push to GitHub
3. Deploy to Firebase
4. Mark PR #19 complete in memory bank
5. Move to PR #20 (AI Selection Commands)

**If Issues Found:**
1. Document bugs
2. Fix critical issues
3. Re-test
4. Then proceed to commit/deploy

---

**Dev Server**: Running at http://localhost:5173
**Ready to Test!** 🚀


