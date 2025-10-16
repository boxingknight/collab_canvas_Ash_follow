# PR #19: AI Chat Interface 💬🤖

**Branch**: `feat/ai-chat-interface`  
**Status**: Planning Complete - Ready for Implementation  
**Priority**: CRITICAL (Highest Priority)  
**Estimated Time**: 3-4 hours  
**Risk Level**: LOW (UI-focused, well-defined requirements)

---

## Overview

### Goal
Create a user-facing chat interface that allows users to interact with the AI service through natural language commands. This is the **gateway** to making all AI features accessible to users.

### Importance
**CRITICAL**: PR #18 deployed a fully functional AI service with 12 callable functions, but users currently have **no way to access it**. This PR creates the UI layer that makes AI features usable.

Without this PR, all AI work is invisible to users. This is the most important UI component of the entire project.

### Key Features
1. **Collapsible Chat Panel** - Bottom-right corner, expandable/collapsible
2. **Message History** - Conversation display (user messages + AI responses)
3. **Command Input** - Text field with natural language processing
4. **Visual Feedback** - Loading states, error messages, success indicators
5. **Example Commands** - Show helpful examples when chat is empty
6. **Keyboard Shortcuts** - Cmd+K or / to focus input
7. **AI Operation Highlighting** - Visual feedback when AI manipulates canvas
8. **Real-Time Sync** - AI changes visible to all users (already works via Canvas API)

### Time Estimate
- **Component Development**: 1.5 hours
- **useAI Hook**: 1 hour
- **Styling & Polish**: 1 hour
- **Testing**: 0.5 hours
- **Total**: 3-4 hours

### Risk Assessment
**LOW** - This is primarily UI work with clear requirements. The AI service backend is already deployed and tested.

---

## Architecture & Design Decisions

### 1. Component Architecture

```
AIChat (Main Container)
├── AIHeader (Collapsible header with minimize/maximize)
├── AIHistory (Message list, scrollable)
│   ├── UserMessage (User's command)
│   ├── AIMessage (AI's response)
│   └── SystemMessage (Errors, info)
├── AIFeedback (Loading/error indicators)
└── AICommandInput (Input field + submit button)
```

### 2. State Management Architecture

**Decision**: Create dedicated `useAI` hook for all AI-related state.

**Rationale**:
- Centralized AI logic (follows established pattern from useShapes, useSelection, etc.)
- Reusable across components
- Clean separation of concerns
- Easy to test and mock
- Consistent with project architecture

**State Structure**:
```javascript
{
  messages: [
    { id, role: 'user'|'assistant'|'system', content, timestamp },
    ...
  ],
  isProcessing: boolean,
  error: string | null,
  isExpanded: boolean,
  inputValue: string
}
```

### 3. Message History Management

**Decision**: Store messages in React state (not Firestore).

**Rationale**:
- Chat history is per-user, not collaborative
- No need to persist across sessions (MVP simplification)
- Reduces Firestore costs
- Faster performance (no network round-trips)
- Can add persistence later if needed

**Future Enhancement**: Add optional history persistence to Firestore for returning users.

### 4. AI Response Flow

```
User types command → Press Enter
  ↓
useAI.sendCommand(text)
  ↓
Set isProcessing = true
  ↓
Call aiService.sendMessage(text)
  ↓
AI processes + calls Canvas functions
  ↓
Canvas updates (via Canvas API)
  ↓
Firestore sync (shapes update)
  ↓
All users see changes (<100ms)
  ↓
AI returns text response
  ↓
Add to message history
  ↓
Set isProcessing = false
```

### 5. Visual Feedback Architecture

**Decision**: Multi-layer feedback system.

1. **Input-Level Feedback**:
   - Disabled input while processing
   - Loading spinner in submit button
   - Input auto-focuses after response

2. **Message-Level Feedback**:
   - Typing indicator while AI processes
   - Success/error message styling
   - Timestamp on each message

3. **Canvas-Level Feedback** (Future Enhancement):
   - Pulse/glow effect on shapes being created/modified
   - Highlighted shapes during AI operations
   - Visual trace of AI actions

**MVP Approach**: Focus on #1 and #2. Defer #3 to PR #24 (Polish) if time permits.

### 6. Panel Position & Behavior

**Decision**: Fixed bottom-right corner, collapsible, overlay.

**Rationale**:
- Bottom-right is traditional for chat interfaces (ChatGPT, Intercom, etc.)
- Doesn't block canvas workspace
- Collapsible for users who prefer manual operations
- Fixed position (doesn't scroll with canvas)
- z-index ensures always on top

**Dimensions**:
- Width: 400px (desktop), 90vw (mobile)
- Height (expanded): 500px
- Height (collapsed): 60px (header only)
- Max-height: 80vh (responsive)

### 7. Example Commands System

**Decision**: Show contextual examples when chat is empty.

**Examples to Show**:
```javascript
const EXAMPLE_COMMANDS = [
  "Create a blue rectangle at the center",
  "Make a red circle at position 1000, 1000",
  "Create a login form",
  "Arrange selected shapes in a horizontal row",
  "Change the selected shape to green",
  "Create a grid of 3x3 squares"
];
```

**Display**: 
- Show 3-4 random examples
- Clickable (clicking fills input field)
- Fade out when user starts typing
- Reappear when input is empty

---

## Cross-Platform Considerations

### Desktop Support
- **Primary target**: Desktop browsers (Chrome, Firefox, Safari)
- **Keyboard shortcuts**: Cmd+K (Mac), Ctrl+K (Windows/Linux)
- **Input**: Full keyboard, mouse, scroll wheel
- **Layout**: 400px fixed width panel

### Mobile/Tablet Support
- **Panel width**: 90vw (full width minus padding)
- **Touch interactions**: Tap to expand/collapse
- **Keyboard**: On-screen keyboard pushes panel up (iOS/Android)
- **Shortcuts**: / key still works, Cmd+K not available
- **Scroll**: Touch-friendly scrolling in message history

### Responsive Breakpoints
```css
/* Desktop (default) */
width: 400px;
right: 20px;
bottom: 20px;

/* Tablet (< 768px) */
width: 90vw;
right: 5vw;
bottom: 20px;

/* Mobile (< 480px) */
width: 95vw;
right: 2.5vw;
bottom: 10px;
max-height: 70vh;
```

### Browser Compatibility
- **Target**: Modern browsers (ES6+, last 2 versions)
- **Flexbox**: Supported in all target browsers
- **CSS Grid**: Optional enhancement
- **Animations**: CSS transitions (60 FPS)
- **No IE11 support required** (project is modern React)

---

## Integration with Existing Systems

### 1. Integration with AI Service (`ai.js`)

**Already Built** (PR #18):
- `aiService.sendMessage(text)` - Send command, receive response
- `aiService.clearHistory()` - Reset conversation
- Function calling automatic (handled by OpenAI)
- Canvas API integration complete

**Usage in useAI Hook**:
```javascript
async function sendCommand(text) {
  try {
    setIsProcessing(true);
    
    // Add user message to history
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Send to AI service
    const response = await aiService.sendMessage(text);
    
    // Add AI response to history
    const aiMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMessage]);
    
    setIsProcessing(false);
    setError(null);
  } catch (error) {
    console.error('AI command error:', error);
    setError(error.message);
    setIsProcessing(false);
  }
}
```

### 2. Integration with Canvas

**Automatic Integration**:
- AI service calls Canvas API functions (already works)
- Canvas API updates Firestore (already works)
- Firestore syncs to all users (already works)
- No additional integration needed

**Optional Enhancement** (Future):
- Highlight shapes being created/modified by AI
- Show visual trace of AI operations
- Deferred to PR #24 (Polish)

### 3. Integration with Authentication

**Required**: AI commands must use authenticated user.

```javascript
// In useAI hook
const { user } = useAuth();

// Pass to AI service
const response = await aiService.sendMessage(text, user);
```

**Already Handled**: AI service already uses `auth.currentUser` from Firebase.

### 4. Integration with AppLayout

**Placement**: AIChat component should be rendered in `AppLayout.jsx`.

**Approach**:
```jsx
// AppLayout.jsx
import AIChat from '../AI/AIChat';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        {children}
      </main>
      <AIChat /> {/* Fixed position, always visible */}
    </div>
  );
}
```

**z-index Management**:
- Canvas: z-index 1
- Navbar: z-index 10
- AIChat: z-index 20 (always on top)

### 5. Integration with Keyboard Shortcuts

**Conflict Prevention**:
- Check existing keyboard shortcuts in `useKeyboard.js`
- Ensure Cmd+K and / don't conflict
- Disable AI shortcuts when text input is focused (already handled)

**Implementation**:
```javascript
// In AIChat component
useEffect(() => {
  function handleGlobalShortcut(e) {
    // Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsExpanded(true);
      inputRef.current?.focus();
    }
    // / key (only if not in text input)
    if (e.key === '/' && !isTyping) {
      e.preventDefault();
      setIsExpanded(true);
      inputRef.current?.focus();
    }
  }
  
  window.addEventListener('keydown', handleGlobalShortcut);
  return () => window.removeEventListener('keydown', handleGlobalShortcut);
}, [isTyping]);
```

---

## Future-Proofing

### Extensibility Points

1. **Message History Persistence**
   - Currently: In-memory React state
   - Future: Add Firestore persistence per user
   - Implementation: Add `saveMessageHistory(userId, messages)` to AI service

2. **Collaborative AI Chat**
   - Currently: Per-user chat (messages not shared)
   - Future: Optionally share chat history across all users
   - Use case: Team sees what AI commands others are running
   - Implementation: Store messages in Firestore with canvasId

3. **AI Command Suggestions**
   - Currently: Static examples
   - Future: Context-aware suggestions based on canvas state
   - Example: If 5 shapes selected, suggest "Arrange in a grid"
   - Implementation: Add `getSuggestions(canvasState)` utility

4. **AI Voice Input**
   - Currently: Text input only
   - Future: Add microphone button for voice commands
   - Implementation: Web Speech API + speech-to-text

5. **AI Command History Autocomplete**
   - Currently: No autocomplete
   - Future: Show previous commands as user types
   - Implementation: Store command history, filter on input change

6. **Multi-Turn Conversations**
   - Currently: Each command is independent
   - Future: AI remembers conversation context
   - Already Supported: aiService maintains message history

7. **Command Macros**
   - Currently: No saved commands
   - Future: Save frequently used commands
   - Implementation: Add "Save as Macro" button, store in localStorage

### Design Decisions for Future Features

- **Message Format**: Using standard OpenAI message format (role + content) makes adding conversation history easy
- **Component Structure**: Modular design allows swapping AICommandInput for voice input
- **Hook Pattern**: useAI hook can be extended with new methods without changing components
- **Canvas API**: Already supports all operations, no changes needed for new AI features

---

## Implementation Details

### Files to Create

#### 1. `src/components/AI/AIChat.jsx` (Main Container)
**Purpose**: Main chat panel container, handles expand/collapse, renders all subcomponents.

**Props**: None (manages own state via useAI hook)

**Structure**:
```jsx
import { useState, useRef, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import AIHeader from './AIHeader';
import AIHistory from './AIHistory';
import AIFeedback from './AIFeedback';
import AICommandInput from './AICommandInput';

export default function AIChat() {
  const {
    messages,
    isProcessing,
    error,
    isExpanded,
    toggleExpanded,
    sendCommand,
    clearHistory
  } = useAI();
  
  const chatRef = useRef(null);
  
  // Keyboard shortcut handling
  useEffect(() => {
    function handleShortcut(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleExpanded();
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [toggleExpanded]);
  
  return (
    <div 
      ref={chatRef}
      className={`ai-chat ${isExpanded ? 'expanded' : 'collapsed'}`}
    >
      <AIHeader 
        isExpanded={isExpanded}
        onToggle={toggleExpanded}
        onClear={clearHistory}
      />
      
      {isExpanded && (
        <>
          <AIHistory messages={messages} />
          <AIFeedback 
            isProcessing={isProcessing}
            error={error}
          />
          <AICommandInput 
            onSubmit={sendCommand}
            disabled={isProcessing}
          />
        </>
      )}
    </div>
  );
}
```

**Estimated Lines**: ~120 lines

---

#### 2. `src/components/AI/AIHeader.jsx`
**Purpose**: Collapsible header with title, minimize/maximize button, clear history button.

**Props**:
- `isExpanded: boolean`
- `onToggle: () => void`
- `onClear: () => void`

**Structure**:
```jsx
export default function AIHeader({ isExpanded, onToggle, onClear }) {
  return (
    <div className="ai-header">
      <div className="ai-header-left">
        <div className="ai-icon">🤖</div>
        <h3 className="ai-title">AI Assistant</h3>
      </div>
      
      <div className="ai-header-actions">
        {isExpanded && (
          <button 
            className="ai-clear-btn"
            onClick={onClear}
            title="Clear history"
          >
            🗑️
          </button>
        )}
        <button 
          className="ai-toggle-btn"
          onClick={onToggle}
          aria-label={isExpanded ? 'Minimize' : 'Expand'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
    </div>
  );
}
```

**Estimated Lines**: ~50 lines

---

#### 3. `src/components/AI/AIHistory.jsx`
**Purpose**: Scrollable message history display.

**Props**:
- `messages: Array<{ id, role, content, timestamp }>`

**Structure**:
```jsx
import { useEffect, useRef } from 'react';

export default function AIHistory({ messages }) {
  const historyRef = useRef(null);
  
  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages]);
  
  if (messages.length === 0) {
    return (
      <div className="ai-history empty">
        <AIExamples />
      </div>
    );
  }
  
  return (
    <div ref={historyRef} className="ai-history">
      {messages.map(message => (
        <AIMessage 
          key={message.id}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
        />
      ))}
    </div>
  );
}

function AIMessage({ role, content, timestamp }) {
  return (
    <div className={`ai-message ${role}`}>
      <div className="ai-message-content">
        {content}
      </div>
      <div className="ai-message-timestamp">
        {timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
}

function AIExamples() {
  const examples = [
    "Create a blue rectangle at the center",
    "Make a red circle at position 1000, 1000",
    "Create a login form",
    "Arrange selected shapes in a horizontal row"
  ];
  
  return (
    <div className="ai-examples">
      <p className="ai-examples-title">Try asking me to:</p>
      <ul className="ai-examples-list">
        {examples.map((example, i) => (
          <li key={i} className="ai-example-item">
            "{example}"
          </li>
        ))}
      </ul>
      <p className="ai-examples-hint">
        Tip: Press <kbd>Cmd+K</kbd> or <kbd>/</kbd> to focus input
      </p>
    </div>
  );
}
```

**Estimated Lines**: ~100 lines

---

#### 4. `src/components/AI/AICommandInput.jsx`
**Purpose**: Text input field with submit button.

**Props**:
- `onSubmit: (text: string) => void`
- `disabled: boolean`

**Structure**:
```jsx
import { useState, useRef, useEffect } from 'react';

export default function AICommandInput({ onSubmit, disabled }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  
  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    
    onSubmit(trimmed);
    setValue('');
    inputRef.current?.focus();
  }
  
  function handleKeyDown(e) {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }
  
  // Auto-focus when enabled
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);
  
  return (
    <form className="ai-command-input" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        className="ai-input"
        placeholder="Ask AI to create or modify shapes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        type="submit"
        className="ai-submit-btn"
        disabled={disabled || !value.trim()}
      >
        {disabled ? '⏳' : '→'}
      </button>
    </form>
  );
}
```

**Estimated Lines**: ~60 lines

---

#### 5. `src/components/AI/AIFeedback.jsx`
**Purpose**: Show loading indicator and error messages.

**Props**:
- `isProcessing: boolean`
- `error: string | null`

**Structure**:
```jsx
export default function AIFeedback({ isProcessing, error }) {
  if (!isProcessing && !error) return null;
  
  return (
    <div className="ai-feedback">
      {isProcessing && (
        <div className="ai-loading">
          <div className="ai-loading-spinner"></div>
          <span>AI is thinking...</span>
        </div>
      )}
      
      {error && (
        <div className="ai-error">
          <span className="ai-error-icon">⚠️</span>
          <span className="ai-error-message">{error}</span>
        </div>
      )}
    </div>
  );
}
```

**Estimated Lines**: ~30 lines

---

#### 6. `src/hooks/useAI.js` (Core Hook)
**Purpose**: Centralized AI state management and logic.

**Structure**:
```javascript
import { useState, useCallback } from 'react';
import { aiService } from '../services/ai';

export function useAI() {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  const sendCommand = useCallback(async (text) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Add user message
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Send to AI service
      const response = await aiService.sendMessage(text);
      
      // Add AI response
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      setIsProcessing(false);
    } catch (err) {
      console.error('AI command error:', err);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Error: ${err.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setError(err.message);
      setIsProcessing(false);
    }
  }, []);
  
  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    aiService.clearHistory();
  }, []);
  
  return {
    messages,
    isProcessing,
    error,
    isExpanded,
    toggleExpanded,
    sendCommand,
    clearHistory
  };
}
```

**Estimated Lines**: ~80 lines

---

### Files to Modify

#### 1. `src/components/Layout/AppLayout.jsx`
**Changes**: Add AIChat component

```jsx
// Add import
import AIChat from '../AI/AIChat';

// Add component (after main content)
<AIChat />
```

**Lines Changed**: +3 lines

---

#### 2. `src/index.css`
**Changes**: Add AI chat styles

```css
/* AI Chat Styles */
.ai-chat {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 20;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-chat.collapsed {
  height: 60px;
}

.ai-chat.expanded {
  height: 500px;
  max-height: 80vh;
}

/* AI Header */
.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.ai-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-icon {
  font-size: 24px;
}

.ai-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.ai-header-actions {
  display: flex;
  gap: 8px;
}

.ai-clear-btn,
.ai-toggle-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.ai-clear-btn:hover,
.ai-toggle-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* AI History */
.ai-history {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-history.empty {
  justify-content: center;
  align-items: center;
}

/* AI Message */
.ai-message {
  padding: 12px;
  border-radius: 8px;
  max-width: 90%;
}

.ai-message.user {
  align-self: flex-end;
  background: var(--primary-color);
  color: white;
  margin-left: auto;
}

.ai-message.assistant {
  align-self: flex-start;
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.ai-message.system {
  align-self: center;
  background: var(--error-bg);
  color: var(--error-color);
  font-size: 14px;
  max-width: 100%;
}

.ai-message-content {
  margin-bottom: 4px;
}

.ai-message-timestamp {
  font-size: 11px;
  opacity: 0.6;
  text-align: right;
}

/* AI Examples */
.ai-examples {
  text-align: center;
  color: var(--text-secondary);
}

.ai-examples-title {
  margin-bottom: 16px;
  font-weight: 500;
}

.ai-examples-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
}

.ai-example-item {
  margin: 8px 0;
  padding: 8px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-example-item:hover {
  background: var(--bg-hover);
  transform: translateX(4px);
}

.ai-examples-hint {
  font-size: 12px;
  opacity: 0.7;
}

.ai-examples-hint kbd {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

/* AI Feedback */
.ai-feedback {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.ai-loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ai-error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--error-color);
  font-size: 14px;
}

.ai-error-icon {
  font-size: 18px;
}

/* AI Command Input */
.ai-command-input {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.ai-input {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.ai-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ai-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-submit-btn {
  background: var(--primary-color);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.ai-submit-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.ai-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .ai-chat {
    width: 90vw;
    right: 5vw;
  }
  
  .ai-chat.expanded {
    max-height: 70vh;
  }
}

@media (max-width: 480px) {
  .ai-chat {
    width: 95vw;
    right: 2.5vw;
    bottom: 10px;
  }
}
```

**Lines Added**: ~350 lines

---

## Testing Strategy

### Manual Testing Checklist

#### Component Functionality
- [ ] Chat panel renders in bottom-right corner
- [ ] Panel expands on header click
- [ ] Panel collapses on header click
- [ ] Expand/collapse animation smooth (300ms transition)
- [ ] Clear history button works
- [ ] Panel maintains state during expand/collapse

#### Input & Commands
- [ ] Text input accepts typing
- [ ] Input placeholder shows correctly
- [ ] Submit button enabled when text present
- [ ] Submit button disabled when text empty
- [ ] Submit button disabled while processing
- [ ] Enter key submits command
- [ ] Shift+Enter does NOT submit (for multi-line, if supported)
- [ ] Input clears after submit
- [ ] Input auto-focuses after response

#### Message History
- [ ] User messages display on right (blue background)
- [ ] AI responses display on left (gray background)
- [ ] Timestamps show correctly
- [ ] Messages auto-scroll to bottom
- [ ] Empty state shows examples
- [ ] Examples are helpful and clear

#### AI Integration
- [ ] Simple command: "Create a blue rectangle at 100, 100"
- [ ] AI response appears in chat
- [ ] Rectangle appears on canvas (all users see it)
- [ ] Complex command: "Create a login form"
- [ ] AI executes multi-step operation
- [ ] All shapes appear on canvas
- [ ] Error handling: Invalid command shows error message

#### Keyboard Shortcuts
- [ ] Cmd+K (Mac) opens and focuses chat
- [ ] Ctrl+K (Windows) opens and focuses chat
- [ ] / key opens and focuses chat (if not typing)
- [ ] Shortcuts work from anywhere in app
- [ ] Shortcuts don't fire during text editing

#### Loading States
- [ ] Loading spinner shows while processing
- [ ] "AI is thinking..." text displays
- [ ] Input disabled while processing
- [ ] Submit button shows ⏳ emoji while processing

#### Error Handling
- [ ] Network error shows error message
- [ ] Invalid command shows error message
- [ ] Error messages clear on next successful command
- [ ] Error messages are user-friendly

#### Visual Polish
- [ ] Panel has subtle shadow
- [ ] Hover effects work on buttons
- [ ] Transitions smooth (300ms ease)
- [ ] Colors match app theme
- [ ] Typography consistent with app
- [ ] No layout shift when expanding/collapsing

#### Responsive Design
- [ ] Desktop (>768px): 400px width
- [ ] Tablet (481-768px): 90vw width
- [ ] Mobile (<480px): 95vw width
- [ ] Touch interactions work on mobile
- [ ] On-screen keyboard doesn't cover input
- [ ] Scrolling works on touch devices

#### Multi-User Testing
- [ ] Open 2 browser windows
- [ ] User A sends AI command
- [ ] User B sees shapes appear on canvas
- [ ] User B sends different AI command
- [ ] Both users see all AI-generated shapes
- [ ] No race conditions or conflicts

#### Performance
- [ ] Panel opens/closes without lag
- [ ] Typing has no input delay
- [ ] Scrolling message history smooth
- [ ] AI response under 2 seconds for simple commands
- [ ] No memory leaks (check after 50+ messages)

---

### Automated Testing (Future)

```javascript
// Future test suite structure
describe('AIChat', () => {
  describe('Panel Behavior', () => {
    test('renders collapsed by default');
    test('expands on header click');
    test('collapses on second header click');
  });
  
  describe('Message Handling', () => {
    test('adds user message on submit');
    test('adds AI response after processing');
    test('displays error on API failure');
    test('clears history on clear button click');
  });
  
  describe('Keyboard Shortcuts', () => {
    test('Cmd+K focuses input and expands panel');
    test('Ctrl+K focuses input and expands panel');
    test('/ key focuses input');
  });
  
  describe('AI Integration', () => {
    test('calls aiService.sendMessage with user text');
    test('handles function call responses');
    test('updates canvas via Canvas API');
  });
});
```

---

## Rollout Plan

### Phase 1: Create Component Structure (30 min)
1. Create directory: `src/components/AI/`
2. Create files:
   - `AIChat.jsx` (shell component)
   - `AIHeader.jsx`
   - `AIHistory.jsx`
   - `AICommandInput.jsx`
   - `AIFeedback.jsx`
3. Add basic JSX structure (no logic yet)
4. Add prop types and comments

**Checkpoint**: All components render without errors (even if empty).

---

### Phase 2: Create useAI Hook (30 min)
1. Create `src/hooks/useAI.js`
2. Implement state management:
   - `messages` state (array)
   - `isProcessing` state (boolean)
   - `error` state (string | null)
   - `isExpanded` state (boolean)
3. Implement methods:
   - `sendCommand(text)` - Main AI interaction
   - `clearHistory()` - Reset chat
   - `toggleExpanded()` - Show/hide panel
4. Connect to existing aiService

**Checkpoint**: Hook compiles, can be imported, state works.

---

### Phase 3: Implement Core Components (45 min)
1. **AIChat.jsx**:
   - Wire up useAI hook
   - Add expand/collapse logic
   - Add keyboard shortcut handlers
   - Render all subcomponents

2. **AIHeader.jsx**:
   - Add expand/collapse button
   - Add clear history button
   - Add icons and title

3. **AICommandInput.jsx**:
   - Add text input with state
   - Add submit button
   - Add Enter key handling
   - Add disabled states

4. **AIHistory.jsx**:
   - Add message rendering
   - Add auto-scroll logic
   - Add empty state with examples

5. **AIFeedback.jsx**:
   - Add loading spinner
   - Add error display

**Checkpoint**: All components functional, can type and "submit" (even if AI doesn't respond yet).

---

### Phase 4: AI Service Integration (30 min)
1. Connect sendCommand to aiService.sendMessage
2. Handle responses and update message history
3. Handle errors gracefully
4. Test simple commands:
   - "Create a blue rectangle at 100, 100"
   - "Make a red circle at 500, 500"
5. Verify shapes appear on canvas
6. Test error handling with invalid commands

**Checkpoint**: AI commands work end-to-end, shapes appear on canvas.

---

### Phase 5: Styling (45 min)
1. Add all AI chat styles to `src/index.css`
2. Match existing app theme:
   - Dark background
   - Blue primary color
   - Subtle borders and shadows
3. Add transitions and animations
4. Add hover effects
5. Test responsive breakpoints:
   - Desktop: 400px width
   - Tablet: 90vw width
   - Mobile: 95vw width
6. Polish typography and spacing

**Checkpoint**: Chat panel looks professional and matches app design.

---

### Phase 6: Integration & Polish (30 min)
1. Add AIChat to AppLayout.jsx
2. Test z-index (should be above canvas)
3. Test keyboard shortcuts don't conflict
4. Add keyboard shortcut hints to examples
5. Test on multiple browsers:
   - Chrome
   - Firefox
   - Safari
6. Test on mobile (responsive design)

**Checkpoint**: Fully integrated, no visual or functional issues.

---

### Phase 7: Multi-User Testing (15 min)
1. Deploy to Firebase
2. Open in 2 browser windows
3. User A: Send AI command "Create a red square at 1000, 1000"
4. User B: Verify square appears on canvas
5. User B: Send AI command "Create a blue circle at 1500, 1500"
6. User A: Verify circle appears
7. Test simultaneous commands
8. Verify no race conditions

**Checkpoint**: Real-time sync works perfectly with AI commands.

---

### Phase 8: Documentation & Commit (15 min)
1. Add JSDoc comments to useAI hook
2. Add code comments to complex logic
3. Update memory bank:
   - Mark PR #19 as complete in activeContext.md
   - Update progress.md with features delivered
4. Git workflow:
   ```bash
   git checkout -b feat/ai-chat-interface
   git add .
   git commit -m "feat: Add AI chat interface (PR #19)
   
   - Created AIChat, AIHeader, AIHistory, AICommandInput, AIFeedback components
   - Created useAI hook for state management
   - Integrated with existing AI service (PR #18)
   - Added keyboard shortcuts (Cmd+K, /)
   - Added responsive design (mobile, tablet, desktop)
   - Real-time sync working perfectly
   
   Components: 5 new components, ~400 lines
   Hook: useAI.js, ~80 lines
   Styles: ~350 lines CSS
   Total: ~830 lines added"
   
   git push origin feat/ai-chat-interface
   ```
5. Deploy to Firebase: `firebase deploy`
6. Test production deployment

**Checkpoint**: PR #19 complete, deployed, documented.

---

## Success Criteria

### Must Have (Required)
- [x] Chat panel renders in bottom-right corner
- [x] Panel expands and collapses smoothly
- [x] Text input accepts commands
- [x] Submit button sends commands to AI
- [x] User messages display in chat history
- [x] AI responses display in chat history
- [x] AI commands execute and shapes appear on canvas
- [x] Real-time sync works (all users see AI-generated shapes)
- [x] Loading indicator shows while processing
- [x] Error messages display on failures
- [x] Keyboard shortcuts work (Cmd+K, /)
- [x] Responsive design (mobile, tablet, desktop)
- [x] Empty state shows example commands
- [x] Clear history button works

### Nice to Have (Optional)
- [ ] Clickable example commands (fills input on click)
- [ ] Timestamp display for each message
- [ ] Message history persists across page refresh (localStorage)
- [ ] Animated typing indicator while AI thinks
- [ ] Sound notification on AI response (optional, off by default)
- [ ] Highlight shapes on canvas while AI creates them
- [ ] Command autocomplete (previous commands)
- [ ] Export chat history

### Out of Scope (Deferred)
- ❌ Voice input (future enhancement)
- ❌ Collaborative chat history (all users see same chat)
- ❌ AI command macros/saved commands
- ❌ Context-aware suggestions
- ❌ Message editing or deletion
- ❌ Message reactions or threading
- ❌ File/image upload
- ❌ Code syntax highlighting in messages

---

## Risk Assessment

### Technical Risks

#### Risk 1: AI Service Integration Issues
**Likelihood**: LOW  
**Impact**: HIGH  
**Mitigation**: AI service already deployed and tested (PR #18). Simple integration via aiService.sendMessage().  
**Contingency**: If issues arise, add error boundary and fallback UI.

#### Risk 2: Keyboard Shortcut Conflicts
**Likelihood**: MEDIUM  
**Impact**: MEDIUM  
**Mitigation**: Check existing shortcuts in useKeyboard.js, test thoroughly.  
**Contingency**: Use different shortcuts if conflicts found (Cmd+/ instead of Cmd+K).

#### Risk 3: Mobile Keyboard Issues
**Likelihood**: MEDIUM  
**Impact**: MEDIUM  
**Mitigation**: Test on iOS and Android, use proper input attributes.  
**Contingency**: Adjust panel positioning when keyboard appears, or reduce max-height.

#### Risk 4: Message History Memory Leak
**Likelihood**: LOW  
**Impact**: MEDIUM  
**Mitigation**: Keep messages in React state (auto-cleanup on unmount).  
**Contingency**: Add message limit (e.g., max 100 messages, drop oldest).

### Project Risks

#### Risk 1: Scope Creep
**Likelihood**: MEDIUM  
**Impact**: HIGH  
**Mitigation**: Strict adherence to success criteria, defer "nice to have" features.  
**Contingency**: If over 4 hours, cut optional features and ship MVP version.

#### Risk 2: Styling Time Sink
**Likelihood**: MEDIUM  
**Impact**: MEDIUM  
**Mitigation**: Use existing CSS patterns from app, copy-paste where possible.  
**Contingency**: Ship with minimal styling if time runs out, polish in PR #24.

---

## Implementation Checklist

### Pre-Implementation
- [x] Read through entire PR document
- [x] Review AI service code from PR #18
- [x] Check existing keyboard shortcuts
- [x] Create new branch: `feat/ai-chat-interface`

### Component Development
- [ ] Create `src/components/AI/` directory
- [ ] Create AIChat.jsx (main container)
- [ ] Create AIHeader.jsx (collapsible header)
- [ ] Create AIHistory.jsx (message display)
- [ ] Create AICommandInput.jsx (text input)
- [ ] Create AIFeedback.jsx (loading/error states)

### Hook Development
- [ ] Create `src/hooks/useAI.js`
- [ ] Implement state management (messages, isProcessing, error, isExpanded)
- [ ] Implement sendCommand method
- [ ] Implement clearHistory method
- [ ] Implement toggleExpanded method
- [ ] Connect to aiService from PR #18

### Styling
- [ ] Add AI chat base styles
- [ ] Add AI header styles
- [ ] Add AI history/message styles
- [ ] Add AI input styles
- [ ] Add AI feedback styles
- [ ] Add responsive breakpoints
- [ ] Add animations and transitions
- [ ] Test on multiple browsers

### Integration
- [ ] Add AIChat to AppLayout.jsx
- [ ] Test z-index layering
- [ ] Add keyboard shortcuts (Cmd+K, /)
- [ ] Test shortcut conflicts
- [ ] Verify AI service connection
- [ ] Test simple AI commands

### Testing
- [ ] Test expand/collapse
- [ ] Test message display
- [ ] Test command submission
- [ ] Test loading states
- [ ] Test error handling
- [ ] Test keyboard shortcuts
- [ ] Test responsive design
- [ ] Test multi-user sync (2 browsers)
- [ ] Test on mobile device
- [ ] Test performance (50+ messages)

### Documentation & Deployment
- [ ] Add JSDoc comments
- [ ] Add inline code comments
- [ ] Update activeContext.md
- [ ] Update progress.md
- [ ] Commit and push
- [ ] Deploy to Firebase
- [ ] Test production deployment
- [ ] Mark PR #19 complete

---

## Time Tracking

**Planned**: 3-4 hours  
**Actual**: _To be filled during implementation_

**Breakdown**:
- Component structure: ___ min
- useAI hook: ___ min
- Core implementation: ___ min
- AI integration: ___ min
- Styling: ___ min
- Integration & polish: ___ min
- Testing: ___ min
- Documentation: ___ min

**Bugs Encountered**: ___ (to be documented if significant)

---

## Notes & Learnings

_To be filled during and after implementation_

### Key Decisions Made
- 

### Challenges Encountered
- 

### What Went Well
- 

### What Could Be Improved
- 

### Patterns to Reuse
- 

---

**Status**: ✅ Ready for Implementation  
**Last Updated**: December 2024  
**Next Steps**: Create branch, implement components, test, deploy


