# Active Context

## Current Status

**Date**: Post-MVP Phase  
**Timeline**: Day 2-3 of 7-day sprint  
**Phase**: Implementing core shape features before AI integration

## Documentation Standard: PR_PARTY 🎉

**New Practice** (Established this session):
- Every PR gets a comprehensive documentation file in `/PR_PARTY/`
- Format: `PRXX_FEATURE_NAME.md` (e.g., `PR11_LINE_SHAPES.md`)
- Contents: Complete implementation plan including:
  - Architecture & design decisions
  - Cross-platform considerations
  - Locking mechanisms
  - Future-proofing notes
  - Testing strategy
  - Success criteria
  - Risk assessment
  - Implementation checklist

**Benefits**:
- ✅ Comprehensive history of what we're building
- ✅ Best practices documented for each feature
- ✅ Easy reference for future PRs
- ✅ Clear handoff documentation
- ✅ AI-friendly context for future sessions

**Current PR Docs**:
- ✅ PR #11 (Line Shapes): `/PR_PARTY/PR11_LINE_SHAPES.md` - Complete
- ✅ PR #12 (Text Shapes): `/PR_PARTY/PR12_TEXT_SHAPES.md` - Planning Complete

---

## What We're Working On Right Now

### Immediate Focus: Complete Core Shape Types

**Current Sprint**: Preparing for AI integration by completing required shape types and transformations.

**Priority Order:**
1. ✅ **MVP Completed** - Rectangles, circles, real-time sync, multiplayer cursors
2. ✅ **PR #11 COMPLETED** - Line shapes (fully implemented with drag endpoints, locking, sync)
3. 📋 **Next** - PR #12: Text layers, rotation support
4. 🎯 **Critical** - AI service integration and command implementation

## Recent Changes

### Google OAuth Implementation (Current Session)
- ✅ Added Google sign-in functionality
  - Created `loginWithGoogle()` in auth service using Firebase `signInWithPopup`
  - Exposed method through useAuth hook
  - Added "Sign in with Google" button to Login component
  - Added "Sign up with Google" button to SignUp component
  - Included official Google logo SVG
  - Added auth divider ("OR") styling
  - Implemented btn-google styles with hover effects
  - Full dark/light mode support
  - Created comprehensive setup guide (GOOGLE_OAUTH_SETUP.md)
- ✅ Tested and verified working
- ✅ Committed and pushed to GitHub

### MVP Completion (Previous Session)
- ✅ Authentication working (email/password)
- ✅ Basic canvas with pan/zoom (5000x5000px bounded)
- ✅ Rectangle and circle creation
- ✅ Shape selection and movement
- ✅ Real-time sync via Firestore
- ✅ Multiplayer cursors via Realtime Database
- ✅ Presence awareness (who's online)
- ✅ Shape deletion (Delete/Backspace key)
- ✅ Shape locking during drag to prevent conflicts
- ✅ Deployed to Firebase Hosting

### Recent Optimizations
- React.memo on Shape components for performance
- Debounced Firestore writes during drag (300ms)
- Throttled cursor updates (50ms)
- Selection-first interaction pattern (click to select, then drag)
- Ghost shape prevention with pending updates tracking

### Documentation Created
- Comprehensive README with setup instructions
- Architecture diagram (architecture.md)
- Multiple PRD versions (prd.md, revisedPRD.md, postMVPprd.md)
- Task lists (task.md, revisedTask.md, postMVPtasklist.md)
- Firebase setup guides
- Performance optimization docs

## Next Steps (Immediate)

### Week 1, Day 2-3: Core Shapes & Transformations
**Goal**: Complete all required shape types and transformations to enable AI integration.

#### PR #11: Line Shape Support (Next)
- Add line type to constants
- Extend Shape component for line rendering
- Implement line creation mode (click-drag)
- Add strokeWidth property
- Improve hit detection for lines (wider hit area)
- Test real-time sync

**Estimated**: 2-3 hours

#### PR #12: Text Shape Support (READY TO IMPLEMENT)
- ✅ Complete planning and architecture documentation
- ✅ Click-to-place text creation
- ✅ Double-click inline editing with textarea overlay
- ✅ Font size, weight, color customization
- ✅ Auto-resize text box based on content
- ✅ Multi-line support with proper wrapping
- ✅ Edit locking (prevent simultaneous edits)
- ✅ Full locking mechanism integration
- ✅ Cross-platform support (desktop + mobile)
- ✅ Real-time sync testing

**Estimated**: 4-5 hours
**Status**: Planning Complete - Ready for Implementation

#### PR #13: Multi-Select Foundation
- Create useSelection hook
- Replace single selectedShapeId with selectedShapeIds array
- Implement shift-click multi-select
- Show combined bounding box for multiple shapes
- Implement group move
- Add Select All (Cmd+A) and Deselect (Esc)

**Estimated**: 2-3 hours

### Week 1, Day 3-4: Selection & Layers

#### PR #14: Drag-Select Box
- Create SelectionBox component
- Implement drag-to-select logic
- Add collision detection utility
- Style selection box (dashed blue border)

**Estimated**: 2 hours

#### PR #15: Duplicate & Keyboard Shortcuts
- Implement duplicate functionality
- Create keyboard shortcuts hook
- Add Cmd+D for duplicate
- Add tool shortcuts (V, M, D, R, C, L, T)
- Add arrow key nudging (1px, 10px with Shift)
- Disable shortcuts during text editing

**Estimated**: 2-3 hours

#### PR #16: Rotation Support
- Add rotation field to shape schema
- Update Shape component to apply rotation
- Enable Transformer rotation handles
- Implement group rotation
- Test sync

**Estimated**: 2 hours

#### PR #17: Layer Management
- Add zIndex field to shape schema
- Sort shapes by zIndex in rendering
- Create simple layers list component
- Add bring forward/backward operations
- Add keyboard shortcuts (Cmd+], Cmd+[)

**Estimated**: 2-3 hours

## Week 1, Day 4-6: AI Integration (Critical Phase)

### PR #18: AI Service Integration
- Choose AI provider (OpenAI GPT-4 recommended)
- Set up API credentials
- Create AI service layer
- Create Canvas API wrapper (unified interface)
- Define function calling schemas
- Create function registry
- Add error handling

**Estimated**: 4-5 hours

### PR #19: AI Chat Interface
- Create AIChat component (bottom-right panel)
- Create AICommandInput component
- Create AIHistory component
- Create AIFeedback component
- Create useAI hook for state management
- Add visual feedback for AI operations
- Style interface

**Estimated**: 3-4 hours

### PR #20: AI Basic Commands
- Implement shape creation functions (4 types)
- Implement manipulation functions (5 types)
- Implement query functions (3 types)
- Add function schemas
- Add parameter validation
- Test commands

**Estimated**: 4-5 hours

### PR #21: AI Selection Commands
- Implement selection by type, color, region, ID
- Add function schemas
- Integrate with multi-select
- Test commands

**Estimated**: 2-3 hours

### PR #22: AI Layout Commands
- Create geometry utilities
- Implement arrange horizontal/vertical
- Implement grid layout
- Implement distribute evenly
- Implement center operations
- Add batch update optimization
- Test commands

**Estimated**: 4-5 hours

### PR #23: AI Complex Operations
- Create complex commands service
- Implement createLoginForm
- Implement createNavigationBar
- Implement createCardLayout
- Implement createButtonGroup
- Add multi-step execution engine
- Add progress feedback
- Test commands

**Estimated**: 5-6 hours

### PR #24: AI Testing & Documentation
- Test all AI commands systematically
- Test multi-user AI scenarios
- Test error handling
- Test performance targets
- Create AI command reference
- Write AI Development Log (1 page)
- Record demo video (3-5 minutes)
- Update README

**Estimated**: 4-5 hours

## Active Decisions & Considerations

### Decision Pending: AI Provider Choice
**Options:**
1. **OpenAI GPT-4** (recommended)
   - Pros: Mature function calling, good documentation, reliable
   - Cons: Requires API key, costs per request

2. **Anthropic Claude**
   - Pros: Also supports function calling, alternative option
   - Cons: Less tested, similar costs

**Recommendation**: Start with OpenAI GPT-4 (more established for function calling).

### Decision Pending: AI API Call Location
**Options:**
1. **Client-side** (faster to implement)
   - Pros: No backend needed, simpler
   - Cons: API key exposed, no rate limiting

2. **Backend proxy** (production-ready)
   - Pros: Secure, rate limiting, monitoring
   - Cons: More complex, need Cloud Functions or backend server

**Recommendation**: Client-side for MVP/demo, document security gap.

### Decision Made: Canvas API Pattern
**Decision**: Create unified Canvas API wrapper that both manual and AI operations use.

**Rationale:**
- Ensures consistency
- Single place for validation and error handling
- Easier to test
- Clean separation of concerns

**Impact**: All PRs from #18 onward will use this pattern.

### Decision Made: AI Integration Architecture
**Architecture:**
```
User Input
  → AI Service (OpenAI)
  → Function Call Parsed
  → Function Registry
  → Canvas API
  → Firestore
  → Real-time Sync to All Users
```

**Benefits:**
- Clear data flow
- AI and manual operations identical after Canvas API
- Real-time sync automatic
- Testable at each layer

## Current Blockers & Risks

### No Blockers Currently
MVP is complete and stable. Foundation is solid for next phase.

### Risks to Monitor

**Risk 1: Timeline Pressure**
- **Issue**: 5 days remaining, AI integration is complex
- **Mitigation**: Clear prioritization, focus on required features first
- **Status**: On track if we execute systematically

**Risk 2: AI API Reliability**
- **Issue**: AI responses could be slow or fail
- **Mitigation**: Good error handling, clear user feedback
- **Status**: Will address in PR #18-20

**Risk 3: Performance with AI Operations**
- **Issue**: Creating many shapes at once could slow down
- **Mitigation**: Batch operations, optimize Firestore writes
- **Status**: Will implement in PR #22-23

**Risk 4: AI Command Complexity**
- **Issue**: Natural language is ambiguous, AI might misunderstand
- **Mitigation**: Clear function schemas, good prompts, helpful errors
- **Status**: Will refine through testing in PR #24

## Testing Strategy Going Forward

### Continuous Testing (Every PR)
1. **Multi-window testing**: Always test with 2+ browsers
2. **Performance monitoring**: Check FPS stays at 60
3. **Sync verification**: Ensure all changes sync <100ms
4. **Error handling**: Test edge cases and errors

### AI-Specific Testing (PRs #18-24)
1. **Command testing**: Test each AI command individually
2. **Multi-user AI testing**: Two users use AI simultaneously
3. **Performance testing**: Measure response times
4. **Error testing**: Invalid commands, missing parameters, etc.
5. **Integration testing**: Mix manual and AI operations

### Pre-Submission Testing (PR #24)
1. **Full feature walkthrough**: Test all required features
2. **Demo video rehearsal**: Practice full demo
3. **Load testing**: Create 500+ shapes, 5+ concurrent users
4. **Cross-browser testing**: Chrome, Firefox, Safari
5. **Documentation review**: Ensure all docs accurate and complete

## Code Quality Guidelines

### For All New Code
- **Hooks**: Extract business logic into custom hooks
- **Services**: Keep Firebase operations in service layer
- **Components**: Keep components focused and simple
- **Memoization**: Use React.memo for expensive renders
- **Error handling**: Always return user-friendly error messages
- **Comments**: Document complex logic, especially AI-related

### AI-Specific Guidelines
- **Function schemas**: Clear descriptions and parameter docs
- **Validation**: Validate all parameters before execution
- **Error messages**: AI should understand what went wrong
- **Composability**: Simple functions that combine for complex operations
- **Idempotency**: Operations should be safe to retry

## Communication & Documentation

### What to Document
- **Every AI function**: Description, parameters, examples
- **Every complex operation**: How it works, why this approach
- **Every performance optimization**: What it does, impact
- **Every known issue**: What it is, workaround if any

### AI Development Log (Due at End)
Track these throughout development:
1. **Tools used**: Cursor, Claude, ChatGPT, etc.
2. **Effective prompts**: What worked well
3. **AI-generated vs hand-written**: Rough percentages
4. **Strengths**: Where AI helped most
5. **Limitations**: Where AI struggled
6. **Key learnings**: Insights about AI-assisted development

## Current Work Environment

### Files Frequently Edited
- `src/components/Canvas/Canvas.jsx` - Main canvas logic
- `src/components/Canvas/Shape.jsx` - Shape rendering
- `src/hooks/useShapes.js` - Shape management logic
- `src/services/shapes.js` - Firestore operations
- `src/utils/constants.js` - Constants and enums

### Files To Be Created (AI Phase)
- `src/services/ai.js`
- `src/services/canvasAPI.js`
- `src/services/aiFunctions.js`
- `src/services/aiCommands.js`
- `src/components/AI/AIChat.jsx`
- `src/components/AI/AICommandInput.jsx`
- `src/components/AI/AIHistory.jsx`
- `src/components/AI/AIFeedback.jsx`
- `src/hooks/useAI.js`
- `src/hooks/useSelection.js`
- `src/hooks/useKeyboard.js`
- `src/utils/geometry.js`
- `src/utils/colors.js`

### Current Git Branch Status
- **Main branch**: MVP completed, stable
- **Next branch**: Should create `feat/line-shapes` for PR #11

## Success Criteria Tracker

### MVP Checkpoint ✅
- ✅ Basic canvas with pan/zoom
- ✅ At least one shape type (we have 2: rectangle, circle)
- ✅ Ability to create and move objects
- ✅ Real-time sync between 2+ users
- ✅ Multiplayer cursors with name labels
- ✅ Presence awareness
- ✅ User authentication
- ✅ Deployed and publicly accessible

### Final Submission Requirements
- ⏳ 4 shape types (have 2, need line + text)
- ⏳ All transformations (have move, need resize + rotate)
- ⏳ Multi-select
- ⏳ Layer management
- ⏳ Duplicate operation
- ❌ **AI agent with 6+ command types** (NOT STARTED - CRITICAL)
- ❌ AI real-time sync (NOT STARTED)
- ❌ AI performance targets (NOT STARTED)
- ⏳ 60 FPS with 500+ shapes (currently tested to ~100)
- ❌ Demo video (NOT STARTED)
- ❌ AI Development Log (NOT STARTED)
- ✅ Deployed and accessible

**Status**: ~40% complete. MVP done, core features in progress, AI phase not started.

**Critical Path**: Must complete AI integration (PRs #18-24) - this is the key differentiator.

## Notes for Next Session

### When Resuming Work
1. Read through all memory bank files (especially this one)
2. Review revisedTask.md for detailed PR breakdown
3. Check progress.md for what's done vs what's left
4. Start with PR #11: Line Shape Support
5. Work through PRs sequentially - each builds on previous
6. Keep AI integration in mind - design for programmability

### Quick Context Recovery
- **What we built**: Real-time collaborative canvas with shapes and cursors
- **What works**: MVP features all working and deployed
- **What's next**: Complete shape types, then AI integration
- **What's critical**: AI agent - this is what makes project unique
- **Timeline**: ~5 days remaining, need to move quickly

### Key Reminders
- AI agent is the differentiator - prioritize it
- Test with multiple browsers constantly
- Maintain 60 FPS - profile frequently
- Document as you go, especially AI functions
- Keep Canvas API design clean and simple
- Every operation should be AI-callable

