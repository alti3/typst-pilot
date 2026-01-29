

# Typst Editor with AI Assistant

A modern, dark-themed Typst editor with real-time PDF preview and AI-powered writing assistance.

## Overview

Build a browser-based Typst editor that compiles documents to PDF in real-time using WebAssembly. The editor features an integrated AI assistant that can help with Typst syntax, generate content, and edit documents. All files are stored locally for privacy and offline use.

---

## Layout & Structure

**Three-Panel Layout:**
- **Left Panel (20%)** - File explorer sidebar showing project files
- **Center Panel (40%)** - Monaco code editor with AI chat below
- **Right Panel (40%)** - Live PDF preview with compile button

---

## Core Features

### 1. File Management Sidebar
- Tree view of Typst files (.typ) in the project
- Create, rename, and delete files
- Click to open file in editor
- Files persist to browser localStorage

### 2. Monaco Code Editor
- Full-featured code editing with Typst syntax highlighting
- Auto-save to localStorage
- Standard keyboard shortcuts (save, undo, redo, find)
- Bottom 20% reserved for AI chat input

### 3. PDF Preview Panel
- Real-time preview of compiled Typst document
- Floating semi-transparent "Compile" button
- Scroll synchronization with editor (optional)
- Zoom controls for PDF viewing

### 4. Typst Compilation (WebAssembly)
- Client-side compilation using typst.ts library
- Automatic recompile on changes (debounced)
- Error display with line numbers when compilation fails

---

## AI Integration

### AI Chat Interface
- Chat input at bottom 20% of editor panel
- Conversation history within session
- Streaming responses for fluid interaction

### AI Capabilities
- **Code Assistance**: Help with Typst syntax, fix errors, explain formatting
- **Content Generation**: Generate text, summaries, tables, equations
- **Document Editing**: Apply AI suggestions directly to the document

### Settings Modal (BYOK)
- Choose LLM provider (OpenAI, Anthropic, Google, etc.)
- Select model from available options
- Secure API key input (stored in localStorage)
- Test connection button

---

## Design Style

**Dark Theme (VS Code-inspired):**
- Dark background with high-contrast syntax highlighting
- Monospace font for code editor
- Subtle borders separating panels
- Comfortable for long editing sessions

---

## Pages

1. **Main Editor** - The full three-panel editing experience
2. **Settings Modal** - Configure AI provider, model, and API key

