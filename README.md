# DINKIssTyle GUI Design

DINKIssTyle GUI Design is a powerful, drag-and-drop interface builder designed to create modern, flat-style GUI layouts efficiently. Built with [Wails](https://wails.io/), it combines a high-performance Go backend with a flexible Vanilla JavaScript frontend.

Key focus is on providing an **AI-friendly** output structure, allowing Generative AI models to easily understand and replicate the designed layouts.

## 🚀 Key Features

### 1. Window & Component Architecture
- **Window (Root)**: Fully customizable root container with flexible sizing, background control, and AI context description.
- **Components**: Rich set of building blocks including Buttons, Inputs, Switches, Cards, Sections, Tabs, Tables, Dividers, and more.
- **Drag & Drop**: Intuitive placement with smart snapping guides and auto-alignment.

### 2. Advanced Component Management
- **Properties Panel**: Detailed control over every aspect—position, size, colors, fonts, and styles.
- **Hierarchy System**: Components can be nested (e.g., Inputs inside Cards, Buttons inside Tabs).
- **Tab System**: Advanced tab controls with per-tab child visibility and stretch alignment.
- **Table Editor**: Built-in editor for table cell contents.
- **Layer Controls**: Front, Forward, Backward, Back controls for single and multi-selection.

### 3. AI-Ready Export
- **XML Export**: Generates a structured `<Window>` / `<Components>` XML file designed specifically for LLM context injection. Includes descriptions and hierarchical relationships.
- **JSON Export**: Full state export for saving/loading projects.
- **Dynamic Filenames**: Export/Save dialogs suggest filenames based on project title.

### 4. Developer Experience
- **History**: Robust Undo/Redo system with proper state management.
- **Responsive Toolbar**: Scroll arrows appear when window is narrow, ensuring all buttons are accessible.
- **Native Dialogs**: Cross-platform confirmation dialogs via Wails runtime (macOS compatible).
- **Custom Color Palette**: User-defined color presets saved per project.
- **Shortcuts**: 
  - `Ctrl + Z`: Undo
  - `Ctrl + Y`: Redo
  - `Ctrl + D`: Duplicate Selection
  - `Delete`: Remove Selection
  - `Ctrl + Scroll`: Zoom In/Out
  - Arrow Keys: Move selected elements (blocked during text input)
- **Zoom**: Canvas zoom support (25% - 200%).

## 🛠 Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (No heavy frameworks)
- **Backend**: Go (Golang)
- **Framework**: Wails v2

## 📦 Build & Run
To run in live development mode:
```bash
wails dev
```

To build for production:
```bash
wails build
```

## 📋 Recent Updates (2026.01)
- Fixed parent-child relationship preservation for Tab children on load
- Added responsive toolbar scroll navigation with left/right arrows
- Implemented native confirmation dialogs for macOS compatibility
- Layer controls now available in single-selection mode
- Custom color palette management in project settings
- Arrow key blocking during text input to prevent accidental element movement

---
Created by DINKIssTyle. Copyright (C) 2026 DINKI'ssTyle. All rights reserved.
