# DINKIssTyle GUI Design

DINKIssTyle GUI Design is a powerful, drag-and-drop interface builder designed to create modern, flat-style GUI layouts efficiently. Built with [Wails](https://wails.io/), it combines a high-performance Go backend with a flexible Vanilla JavaScript frontend.

Key focus is on providing an **AI-friendly** output structure, allowing Generative AI models to easily understand and replicate the designed layouts.

## 🚀 Key Features

### 1. Window & Component Architecture
- **Window (Root)**: Fully customizable root container with flexible sizing, background control, and AI context description.
- **Components**: Rich set of building blocks including Buttons, Inputs, Switches, Cards, Sections, Tabs, and Tables.
- **Drag & Drop**: Intuitive placement with smart snapping guides and auto-alignment.

### 2. Advanced Component Management
- **Properties Panel**: Detailed control over every aspect—position, size, colors, fonts, and styles.
- **Hierarchy System**: Components can be nested (e.g., Inputs inside Cards, Buttons inside Tabs).
- **Tab System**: Advanced tab controls with nested support, stretch alignment, and dark-mode aesthetic.
- **Table Editor**: Built-in editor for table cell contents.

### 3. AI-Ready Export
- **XML Export**: Generates a structured `<Window>` / `<Components>` XML file designed specifically for LLM context injection. Includes descriptions and hierarchical relationships.
- **JSON Export**: Full state export for saving/loading projects.

### 4. Developer Experience
- **History**: Robust Undo/Redo system.
- **Shortcuts**: 
  - `Ctrl + Z`: Undo
  - `Ctrl + Y`: Redo
  - `Ctrl + D`: Duplicate Selection
  - `Delete`: Remove Selection
  - `Ctrl + Scroll`: Zoom In/Out
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

---
Created by DINKIssTyle. Copyright (C) 2026 DINKI'ssTyle. All rights reserved.
