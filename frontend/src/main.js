// Created by DINKIssTyle on 2026.
// Copyright (C) 2026 DINKI'ssTyle. All rights reserved.

// ===== State Management =====
const state = {
    design: {
        canvas: {
            width: 800,
            height: 600,
            flexible: false,
            title: 'New Design',
            bgColor: '#2a2a3e'
        },
        elements: []
    },
    selectedElement: null,
    isDragging: false,
    isResizing: false,
    dragOffset: { x: 0, y: 0 },
    elementCounter: 0,
    zIndexCounter: 100,
    // Zoom
    zoom: 1.0,
    // Undo/Redo
    history: [],
    historyIndex: -1,
    maxHistory: 50
};

// ===== DOM Elements =====
const dom = {
    canvas: null,
    guideH: null,
    guideV: null,
    statusText: null,
    canvasSize: null,
    canvasMode: null
};

// ===== Component Definitions =====
const componentDefaults = {
    button: { width: 100, height: 36, text: '버튼' },
    label: { width: 80, height: 24, text: '레이블' },
    input: { width: 200, height: 36, text: '입력...' },
    textarea: { width: 200, height: 100, text: '멀티라인\n텍스트 입력...' },
    dropdown: { width: 150, height: 36, text: '선택하세요' },
    checkbox: { width: 120, height: 24, text: '☐ 체크박스' },
    radio: { width: 120, height: 24, text: '○ 라디오' },
    switch: { width: 100, height: 30, text: '스위치', switchOn: false },
    tab: {
        width: 400,
        height: 300,
        text: '',
        tabs: [
            { id: 't1', label: '탭1' },
            { id: 't2', label: '탭2' },
            { id: 't3', label: '탭3' }
        ],
        activeTab: 0,
        isContainer: true
    },
    table: { width: 250, height: 120, text: '', rows: 3, cols: 3 },
    section: { width: 250, height: 180, text: '섹션', isContainer: true },
    card: { width: 200, height: 150, text: '카드', isContainer: true },
    image: { width: 150, height: 100, text: '🖼️ 이미지' },
    slider: { width: 200, height: 20, text: '━━━━●━━━━' },
    progress: { width: 200, height: 20, text: '▓▓▓▓▓░░░░░ 50%' },
    divider: { width: 200, height: 10, text: '' }
};

// Container types that can have children
const containerTypes = ['section', 'card', 'tab'];

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Cache DOM elements
    dom.canvas = document.getElementById('canvas');
    dom.guideH = document.getElementById('guide-h');
    dom.guideV = document.getElementById('guide-v');
    dom.statusText = document.getElementById('status-text');
    dom.canvasSize = document.getElementById('canvas-size');
    dom.canvasMode = document.getElementById('canvas-mode');

    // Initialize canvas
    updateCanvasSize();

    // Setup event listeners
    setupToolbarEvents();
    setupPaletteEvents();
    setupCanvasEvents();
    setupPropertyEvents();
    setupZoomEvents();

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);

    // Initialize history
    saveToHistory();
    updateUndoRedoButtons();

    setStatus('준비됨');
}

function handleKeyDown(e) {
    // Ctrl+Z = Undo
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    // Ctrl+Y = Redo
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
    }
    // Delete = Delete element
    if (e.key === 'Delete' && state.selectedElement) {
        deleteElement(state.selectedElement);
    }
    // Ctrl+D = Duplicate element
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateElement();
    }
}

// ===== Toolbar Events =====
function setupToolbarEvents() {
    document.getElementById('btn-new').addEventListener('click', newDesign);
    document.getElementById('btn-save').addEventListener('click', saveDesign);
    document.getElementById('btn-load').addEventListener('click', loadDesign);
    document.getElementById('btn-export-json').addEventListener('click', exportJSON);
    document.getElementById('btn-export-xml').addEventListener('click', exportXML);
    document.getElementById('btn-undo').addEventListener('click', undo);
    document.getElementById('btn-redo').addEventListener('click', redo);
}

async function newDesign() {
    if (state.design.elements.length > 0) {
        if (!confirm('현재 디자인을 버리고 새로 시작하시겠습니까?')) return;
    }

    // Reset state locally
    state.design = {
        canvas: {
            width: 800,
            height: 600,
            flexible: false,
            title: 'New Design'
        },
        elements: []
    };
    state.selectedElement = null;
    state.elementCounter = 0;
    clearCanvas();
    updateCanvasFromState();
    setStatus('새 디자인 생성됨');

    // Sync to backend if available
    if (window.go?.main?.App?.NewDesign) {
        try {
            await window.go.main.App.NewDesign();
        } catch (e) {
            console.log('Backend sync skipped');
        }
    }
}

async function saveDesign() {
    syncDesignToBackend();

    // Try Wails backend first
    if (window.go?.main?.App?.SaveDesign) {
        try {
            const path = await window.go.main.App.SaveDesign();
            if (path) {
                setStatus('저장됨: ' + path.split('/').pop());
                return;
            }
        } catch (e) {
            console.log('Backend save failed, using browser download');
        }
    }

    // Browser fallback - download as file
    downloadFile(JSON.stringify(state.design, null, 2), 'design.guidesign', 'application/json');
    setStatus('저장됨 (다운로드)');
}

async function loadDesign() {
    // Try Wails backend first
    if (window.go?.main?.App?.LoadDesign) {
        try {
            const design = await window.go.main.App.LoadDesign();
            if (design) {
                applyLoadedDesign(design);
                return;
            }
        } catch (e) {
            console.log('Backend load failed, using browser upload');
        }
    }

    // Browser fallback - file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.guidesign,.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const design = JSON.parse(text);
            applyLoadedDesign(design);
        } catch (err) {
            setStatus('불러오기 실패: 잘못된 파일 형식');
            console.error('Load error:', err);
        }
    };
    input.click();
}

function applyLoadedDesign(design) {
    state.design = design;
    state.selectedElement = null;
    state.elementCounter = design.elements?.length || 0;
    clearCanvas();
    renderElementsFromState();
    updateCanvasFromState();
    setStatus('불러오기 완료');
}

async function exportJSON() {
    syncDesignToBackend();

    // Try Wails backend first
    if (window.go?.main?.App?.ExportJSON) {
        try {
            const path = await window.go.main.App.ExportJSON();
            if (path) {
                setStatus('JSON 내보내기 완료');
                return;
            }
        } catch (e) {
            console.log('Backend export failed, using browser download');
        }
    }

    // Browser fallback
    downloadFile(JSON.stringify(state.design, null, 2), 'gui_design.json', 'application/json');
    setStatus('JSON 내보내기 완료 (다운로드)');
}

async function exportXML() {
    syncDesignToBackend();

    // Try Wails backend first
    if (window.go?.main?.App?.ExportXML) {
        try {
            const path = await window.go.main.App.ExportXML();
            if (path) {
                setStatus('XML 내보내기 완료');
                return;
            }
        } catch (e) {
            console.log('Backend export failed, using browser download');
        }
    }

    // Browser fallback
    const xml = designToXML(state.design);
    downloadFile(xml, 'gui_design.xml', 'application/xml');
    setStatus('XML 내보내기 완료 (다운로드)');
}

function designToXML(design) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Window>\n';

    // Window Properties
    xml += '  <Properties>\n';
    xml += `    <Title>${escapeXml(design.canvas.title)}</Title>\n`;
    xml += `    <Description>${escapeXml(design.canvas.description || '')}</Description>\n`;
    xml += `    <Width>${design.canvas.width}</Width>\n`;
    xml += `    <Height>${design.canvas.height}</Height>\n`;
    xml += `    <Flexible>${design.canvas.flexible}</Flexible>\n`;
    xml += `    <BgColor>${design.canvas.bgColor}</BgColor>\n`;
    xml += '  </Properties>\n';

    // Components - build hierarchy
    const rootElements = design.elements.filter(el => !el.parentId);
    xml += '  <Components>\n';

    function renderElement(el, indent = '    ') {
        let result = `${indent}<Component id="${el.id}">\n`;
        result += `${indent}  <Type>${el.type}</Type>\n`;
        result += `${indent}  <Name>${escapeXml(el.name)}</Name>\n`;
        result += `${indent}  <Description>${escapeXml(el.description || '')}</Description>\n`;
        result += `${indent}  <X>${el.x}</X>\n`;
        result += `${indent}  <Y>${el.y}</Y>\n`;
        result += `${indent}  <Width>${el.width}</Width>\n`;
        result += `${indent}  <Height>${el.height}</Height>\n`;
        result += `${indent}  <Properties>\n`;
        result += `${indent}    <Text>${escapeXml(el.properties?.text || '')}</Text>\n`;
        result += `${indent}    <Style>${el.properties?.style || 'default'}</Style>\n`;
        result += `${indent}    <TextAlign>${el.properties?.textAlign || 'center'}</TextAlign>\n`;

        // Font properties
        if (el.properties?.fontSize) result += `${indent}    <fontSize>${el.properties.fontSize}</fontSize>\n`;
        if (el.properties?.fontColor) result += `${indent}    <fontColor>${el.properties.fontColor}</fontColor>\n`;
        if (el.properties?.fontBold) result += `${indent}    <fontBold>true</fontBold>\n`;
        if (el.properties?.fontItalic) result += `${indent}    <fontItalic>true</fontItalic>\n`;

        // Background
        if (el.properties?.bgColor) result += `${indent}    <bgColor>${el.properties.bgColor}</bgColor>\n`;
        if (el.properties?.bgNone) result += `${indent}    <bgNone>true</bgNone>\n`;

        // Parent/Tab relationship (for AI understanding)
        if (el.parentId) {
            result += `${indent}    <parentId>${el.parentId}</parentId>\n`;
            if (el.parentTabIndex !== undefined) {
                result += `${indent}    <parentTabIndex>${el.parentTabIndex}</parentTabIndex>\n`;
            }
        }

        // Section-specific: full width
        if (el.type === 'section' && el.properties?.fullWidth) {
            result += `${indent}    <fullWidth>true</fullWidth>\n`;
        }

        // Table-specific
        if (el.type === 'table' && el.properties?.cells) {
            result += `${indent}    <rows>${el.properties.rows || 3}</rows>\n`;
            result += `${indent}    <cols>${el.properties.cols || 3}</cols>\n`;
            result += `${indent}    <cells>\n`;
            el.properties.cells.forEach((row, r) => {
                result += `${indent}      <row index="${r}">\n`;
                row.forEach((cell, c) => {
                    result += `${indent}        <cell col="${c}">${escapeXml(cell)}</cell>\n`;
                });
                result += `${indent}      </row>\n`;
            });
            result += `${indent}    </cells>\n`;
        }

        // Tab-specific (corrected structure)
        if (el.type === 'tab' && el.properties?.tabs) {
            result += `${indent}    <tabAlign>${el.properties.tabAlign || 'left'}</tabAlign>\n`;
            result += `${indent}    <activeTab>${el.properties.activeTab || 0}</activeTab>\n`;
            result += `${indent}    <tabs>\n`;
            el.properties.tabs.forEach((tab, i) => {
                result += `${indent}      <tab index="${i}" id="${tab.id || ''}">${escapeXml(tab.label)}</tab>\n`;
            });
            result += `${indent}    </tabs>\n`;
            // Tab styling
            if (el.properties.tabActiveColor) result += `${indent}    <tabActiveColor>${el.properties.tabActiveColor}</tabActiveColor>\n`;
            if (el.properties.tabInactiveColor) result += `${indent}    <tabInactiveColor>${el.properties.tabInactiveColor}</tabInactiveColor>\n`;
        }

        // Switch-specific
        if (el.type === 'switch' && el.properties?.switchOn !== undefined) {
            result += `${indent}    <switchOn>${el.properties.switchOn}</switchOn>\n`;
        }

        // Divider-specific
        if (el.type === 'divider') {
            result += `${indent}    <Orientation>${el.properties.orientation || 'horizontal'}</Orientation>\n`;
            if (el.properties.fullWidth) result += `${indent}    <FullSize>true</FullSize>\n`;
        }

        result += `${indent}  </properties>\n`;

        // Children (hierarchy)
        if (el.children && el.children.length > 0) {
            result += `${indent}  <children>\n`;
            el.children.forEach(childId => {
                const child = design.elements.find(e => e.id === childId);
                if (child) {
                    result += renderElement(child, indent + '    ');
                }
            });
            result += `${indent}  </children>\n`;
        }

        result += `${indent}  </Properties>\n`;

        // Children (hierarchy)
        if (el.children && el.children.length > 0) {
            result += `${indent}  <Children>\n`;
            el.children.forEach(childId => {
                const child = design.elements.find(e => e.id === childId);
                if (child) {
                    result += renderElement(child, indent + '    ');
                }
            });
            result += `${indent}  </Children>\n`;
        }

        result += `${indent}</Component>\n`;
        return result;
    }

    rootElements.forEach(el => {
        xml += renderElement(el);
    });

    rootElements.forEach(el => {
        xml += renderElement(el);
    });

    xml += '  </Components>\n';
    xml += '</Window>';

    return xml;
}

function escapeXml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function syncDesignToBackend() {
    // Sync current state to backend if available
    if (window.go?.main?.App?.SetDesign) {
        window.go.main.App.SetDesign(state.design);
    }
}

// ===== Palette Events =====
function setupPaletteEvents() {
    const paletteItems = document.querySelectorAll('.palette-item');

    paletteItems.forEach(item => {
        // Drag events
        item.addEventListener('dragstart', handlePaletteDragStart);
        item.addEventListener('dragend', handlePaletteDragEnd);

        // Click to add
        item.addEventListener('click', () => {
            const type = item.dataset.type;
            addElementToCanvas(type,
                Math.random() * (state.design.canvas.width - 100) + 50,
                Math.random() * (state.design.canvas.height - 100) + 50
            );
        });
    });
}

function handlePaletteDragStart(e) {
    e.dataTransfer.setData('componentType', e.target.dataset.type);
    e.target.classList.add('dragging');
}

function handlePaletteDragEnd(e) {
    e.target.classList.remove('dragging');
}

// ===== Canvas Events =====
function setupCanvasEvents() {
    // Drop events
    dom.canvas.addEventListener('dragover', handleCanvasDragOver);
    dom.canvas.addEventListener('dragleave', handleCanvasDragLeave);
    dom.canvas.addEventListener('drop', handleCanvasDrop);

    // Click to deselect
    dom.canvas.addEventListener('click', (e) => {
        if (e.target === dom.canvas) {
            deselectElement();
        }
    });

    // Global mouse events for dragging
    document.addEventListener('mousemove', handleElementDrag);
    document.addEventListener('mouseup', handleElementDragEnd);
}

function handleCanvasDragOver(e) {
    e.preventDefault();
    dom.canvas.classList.add('drag-over');
}

function handleCanvasDragLeave(e) {
    dom.canvas.classList.remove('drag-over');
}

function handleCanvasDrop(e) {
    e.preventDefault();
    dom.canvas.classList.remove('drag-over');

    const componentType = e.dataTransfer.getData('componentType');
    if (!componentType) return;

    const rect = dom.canvas.getBoundingClientRect();
    // Apply zoom correction to mouse coordinates
    const x = (e.clientX - rect.left) / state.zoom;
    const y = (e.clientY - rect.top) / state.zoom;

    addElementToCanvas(componentType, x, y);
}

// ===== Element Management =====
function addElementToCanvas(type, x, y, parentId = null) {
    const defaults = componentDefaults[type] || { width: 100, height: 40, text: type };
    const id = `elem_${++state.elementCounter}`;

    // Center the element on drop position
    const canvasWidth = state.design.canvas.flexible ? dom.canvas.offsetWidth : state.design.canvas.width;
    const canvasHeight = state.design.canvas.flexible ? dom.canvas.offsetHeight : state.design.canvas.height;
    x = Math.max(0, Math.min(x - defaults.width / 2, canvasWidth - defaults.width));
    y = Math.max(0, Math.min(y - defaults.height / 2, canvasHeight - defaults.height));

    // Determine parent if not provided (check for containers at drop location)
    if (!parentId) {
        // Find topmost container at x, y
        // We iterate in reverse order (topmost first) but z-index matters.
        // Simple check: iterate all elements, filter containers, check bounds, pick highest z-index.
        const containers = state.design.elements.filter(el =>
            containerTypes.includes(el.type) &&
            x >= el.x && x <= el.x + el.width &&
            y >= el.y && y <= el.y + el.height
        );

        if (containers.length > 0) {
            // Sort by z-index descending
            containers.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
            parentId = containers[0].id;
        }
    }

    // Assign z-index (containers get lower, children get higher)
    let zIndex = ++state.zIndexCounter;
    if (containerTypes.includes(type)) {
        zIndex = 50 + state.elementCounter; // Containers have lower z-index
    }

    // Determine parentTabIndex if parent is a Tab
    let parentTabIndex = undefined;
    if (parentId) {
        const parent = getElementData(parentId);
        if (parent && parent.type === 'tab') {
            parentTabIndex = parent.properties.activeTab || 0;
            // Also adjust X, Y relative to parent? No, we use absolute coordinates on canvas.
            // But we might want to ensure it's inside parent body. Mouse drop handles that.
        }
    }

    const element = {
        id: id,
        type: type,
        name: `${type}_${state.elementCounter}`,
        description: '',
        parentId: parentId || null,
        parentTabIndex: parentTabIndex,
        x: Math.round(x),
        y: Math.round(y),
        width: defaults.width,
        height: defaults.height,
        zIndex: zIndex,
        properties: {
            text: defaults.text,
            style: 'default',
            textAlign: 'center',
            // Font properties
            fontSize: 14,
            fontColor: '#e8e8f0',
            fontBold: false,
            fontItalic: false,
            // Background color
            bgColor: null,
            // Table-specific
            rows: defaults.rows || 3,
            cols: defaults.cols || 3,
            cells: type === 'table' ? generateDefaultCells(defaults.rows || 3, defaults.cols || 3) : null,
            // Tab-specific
            tabs: defaults.tabs ? JSON.parse(JSON.stringify(defaults.tabs)) : undefined, // Deep copy
            activeTab: defaults.activeTab !== undefined ? defaults.activeTab : 0,
            // Switch-specific
            switchOn: defaults.switchOn || false
        },
        children: []
    };

    state.design.elements.push(element);
    createElementDOM(element);

    // If parent is Tab, update visibility immediately
    if (parentId && parentTabIndex !== undefined) {
        updateTabChildrenVisibility(parentId);
    }

    selectElement(id);
    saveToHistory();
    setStatus(`${type} 추가됨`);
}

function generateDefaultCells(rows, cols) {
    const cells = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push(r === 0 ? `열${c + 1}` : '');
        }
        cells.push(row);
    }
    return cells;
}

function createElementDOM(element) {
    const el = document.createElement('div');
    el.className = 'canvas-element';
    el.id = element.id;
    el.dataset.type = element.type;
    el.style.left = element.x + 'px';
    el.style.top = element.y + 'px';
    el.style.width = element.width + 'px';
    el.style.height = element.height + 'px';
    el.style.zIndex = element.zIndex || 100;

    // Apply text alignment
    const align = element.properties?.textAlign || 'center';
    el.classList.add('align-' + align);

    // Apply style class
    if (element.properties?.style && element.properties.style !== 'default') {
        el.classList.add('style-' + element.properties.style);
    }

    // Apply font styles
    applyFontStyles(el, element);

    // Apply background color
    if (element.properties?.bgColor) {
        el.style.backgroundColor = element.properties.bgColor;
    }

    // Tab element (special handling - must be before container check)
    if (element.type === 'tab') {
        el.classList.add('is-container');
        renderTabContent(el, element);
    }
    // Container elements (section, card)
    else if (containerTypes.includes(element.type) && element.type !== 'tab') {
        el.classList.add('is-container');
        const label = document.createElement('span');
        label.className = 'container-label';
        label.textContent = element.properties?.text || element.type;
        el.appendChild(label);
    }
    // Table element
    else if (element.type === 'table') {
        renderTableContent(el, element);
    }
    // Switch element
    else if (element.type === 'switch') {
        renderSwitchContent(el, element);
    }
    // Divider element
    else if (element.type === 'divider') {
        renderDividerContent(el, element);
    }
    // Regular elements
    else {
        el.textContent = element.properties?.text || element.type;
    }

    // Mouse events
    el.addEventListener('mousedown', handleElementMouseDown);
    el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(element.id);
    });

    dom.canvas.appendChild(el);

    return el;
}

function renderTableContent(el, element) {
    el.innerHTML = '';
    const props = element.properties || {};
    const rows = props.rows || 3;
    const cols = props.cols || 3;
    const cells = props.cells || generateDefaultCells(rows, cols);

    const grid = document.createElement('div');
    grid.className = 'table-grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'table-cell';
            if (r === 0) cell.classList.add('header');
            cell.textContent = cells[r]?.[c] || '';
            grid.appendChild(cell);
        }
    }

    el.appendChild(grid);
}

function renderTabContent(el, element) {
    el.innerHTML = '';
    const props = element.properties || {};
    const tabs = props.tabs || [
        { id: 't1', label: '탭1' },
        { id: 't2', label: '탭2' },
        { id: 't3', label: '탭3' }
    ];
    const activeTab = props.activeTab || 0;

    // Header
    const header = document.createElement('div');
    header.className = 'tab-header';

    // Tab alignment (default: left)
    const tabAlign = props.tabAlign || 'left';
    if (tabAlign === 'center') header.style.justifyContent = 'center';
    else if (tabAlign === 'right') header.style.justifyContent = 'flex-end';
    else if (tabAlign === 'stretch') header.style.justifyContent = 'stretch';
    else header.style.justifyContent = 'flex-start';

    // Body
    const body = document.createElement('div');
    body.className = 'tab-body';

    tabs.forEach((tabInfo, idx) => {
        const tab = document.createElement('div');
        tab.className = 'tab-item';
        if (idx === activeTab) {
            tab.classList.add('active');

            // Active Tab Styles
            if (props.tabActiveColor) tab.style.backgroundColor = props.tabActiveColor;
            if (props.fontActiveColor) tab.style.color = props.fontActiveColor;
            if (props.fontActiveSize) tab.style.fontSize = props.fontActiveSize + 'px';
            if (props.fontActiveBold) tab.style.fontWeight = 'bold';
        } else {
            // Inactive Tab Styles
            if (props.tabInactiveColor) tab.style.backgroundColor = props.tabInactiveColor;
            if (props.fontInactiveColor) tab.style.color = props.fontInactiveColor;
            if (props.fontInactiveSize) tab.style.fontSize = props.fontInactiveSize + 'px';
        }

        tab.textContent = tabInfo.label;

        // Stretch mode: make tabs fill the entire width
        if (tabAlign === 'stretch') {
            tab.style.flex = '1';
            tab.style.textAlign = 'center';
        }

        // Click to switch tab
        tab.addEventListener('mousedown', (e) => {
            // Prevent drag of the whole component if strictly clicking a tab (optional, but good for UX)
            // But we might want to select it.
            // Let's just switch tab. Selection happens via bubbling to handleElementMouseDown.
            if (activeTab !== idx) {
                switchTab(element.id, idx);
            }
        });

        header.appendChild(tab);
    });

    el.appendChild(header);
    el.appendChild(body);
}

function switchTab(elementId, index) {
    const element = getElementData(elementId);
    if (!element) return;

    element.properties = element.properties || {};
    element.properties.activeTab = index;

    updateElementDOM(element);
    updateTabChildrenVisibility(elementId);
    saveToHistory();
}

function updateTabChildrenVisibility(parentId) {
    const parent = getElementData(parentId);
    if (!parent || parent.type !== 'tab') return;

    const activeIndex = parent.properties.activeTab || 0;

    state.design.elements.forEach(el => {
        if (el.parentId === parentId) {
            const elDOM = document.getElementById(el.id);
            if (elDOM) {
                // Default to tab 0 if undefined
                const childTabIndex = el.parentTabIndex !== undefined ? el.parentTabIndex : 0;

                if (childTabIndex === activeIndex) {
                    elDOM.style.display = 'flex';
                } else {
                    elDOM.style.display = 'none';
                }
            }
        }
    });
}



function renderSwitchContent(el, element) {
    el.innerHTML = '';
    const props = element.properties || {};
    const isOn = props.switchOn || false;

    const track = document.createElement('div');
    track.className = 'switch-track' + (isOn ? ' on' : '');

    const thumb = document.createElement('div');
    thumb.className = 'switch-thumb';
    track.appendChild(thumb);

    const label = document.createElement('span');
    label.className = 'switch-label';
    label.textContent = props.text || '스위치';

    el.appendChild(track);
    el.appendChild(label);
}

function renderDividerContent(el, element) {
    el.innerHTML = '';
    const orientation = element.properties.orientation || 'horizontal';

    el.classList.remove('divider-horizontal', 'divider-vertical');
    el.classList.add('divider-' + orientation);

    const inner = document.createElement('div');
    inner.className = 'divider-inner';
    el.appendChild(inner);
}

function applyFontStyles(el, element) {
    const props = element.properties || {};

    if (props.fontSize) {
        el.style.fontSize = props.fontSize + 'px';
    }
    if (props.fontColor) {
        el.style.color = props.fontColor;
    }
    el.style.fontWeight = props.fontBold ? 'bold' : 'normal';
    el.style.fontStyle = props.fontItalic ? 'italic' : 'normal';
}

function updateElementDOM(element) {
    const el = document.getElementById(element.id);
    if (!el) return;

    if (element.properties?.fullWidth && element.type === 'section') {
        el.style.left = '0';
        el.style.width = '100%';
    } else {
        el.style.left = element.x + 'px';
        el.style.width = element.width + 'px';
    }

    el.style.top = element.y + 'px';
    el.style.height = element.height + 'px';
    el.style.zIndex = element.zIndex || 100;

    // Update alignment
    el.classList.remove('align-left', 'align-center', 'align-right');
    el.classList.add('align-' + (element.properties?.textAlign || 'center'));

    // Update style
    el.className = el.className.replace(/style-\w+/g, '');
    if (element.properties?.style && element.properties.style !== 'default') {
        el.classList.add('style-' + element.properties.style);
    }

    // Apply font styles
    applyFontStyles(el, element);

    // Apply background color
    if (element.properties?.bgNone) {
        el.style.backgroundColor = 'transparent';
    } else if (element.properties?.bgColor) {
        el.style.backgroundColor = element.properties.bgColor;
    }

    // Re-render content based on type
    if (element.type === 'table') {
        renderTableContent(el, element);
    } else if (element.type === 'tab') {
        renderTabContent(el, element);
    } else if (element.type === 'switch') {
        renderSwitchContent(el, element);
    } else if (containerTypes.includes(element.type)) {
        const label = el.querySelector('.container-label');
        if (label) label.textContent = element.properties?.text || element.type;
    } else {
        el.textContent = element.properties?.text || element.type;
    }
}

function handleElementMouseDown(e) {
    // Handle resize handle clicks separately
    if (e.target.classList.contains('resize-handle')) return;

    e.preventDefault();
    e.stopPropagation();

    // Get the actual element (not resize handle)
    const el = e.target.closest('.canvas-element');
    if (!el) return;

    const id = el.id;
    selectElement(id);

    const element = getElementData(id);
    if (!element) return;

    const canvasRect = dom.canvas.getBoundingClientRect();

    state.isDragging = true;
    // Store offset from element's top-left corner (with zoom correction)
    state.dragOffset.x = (e.clientX - canvasRect.left) / state.zoom - element.x;
    state.dragOffset.y = (e.clientY - canvasRect.top) / state.zoom - element.y;

    el.classList.add('dragging');
}

function handleElementDrag(e) {
    if (!state.isDragging || !state.selectedElement) return;

    const element = getElementData(state.selectedElement);
    if (!element) return;

    const canvasRect = dom.canvas.getBoundingClientRect();
    // Apply zoom correction to mouse coordinates
    let newX = (e.clientX - canvasRect.left) / state.zoom - state.dragOffset.x;
    let newY = (e.clientY - canvasRect.top) / state.zoom - state.dragOffset.y;

    // Snap to alignment guides
    const snapResult = snapToGuides(newX, newY, element.width, element.height);
    newX = snapResult.x;
    newY = snapResult.y;

    // Constrain to canvas bounds (use actual canvas size in flexible mode)
    const canvasWidth = state.design.canvas.flexible ? dom.canvas.offsetWidth : state.design.canvas.width;
    const canvasHeight = state.design.canvas.flexible ? dom.canvas.offsetHeight : state.design.canvas.height;
    newX = Math.max(0, Math.min(newX, canvasWidth - element.width));
    newY = Math.max(0, Math.min(newY, canvasHeight - element.height));

    // Calculate delta for moving children
    const dx = Math.round(newX) - element.x;
    const dy = Math.round(newY) - element.y;

    element.x = Math.round(newX);
    element.y = Math.round(newY);

    const domEl = document.getElementById(state.selectedElement);
    if (domEl) {
        domEl.style.left = element.x + 'px';
        domEl.style.top = element.y + 'px';
    }

    // Move children with parent (for containers)
    if (containerTypes.includes(element.type) && (dx !== 0 || dy !== 0)) {
        moveChildrenWithParent(element.id, dx, dy);
    }

    updateElementProperties();
}

function handleElementDragEnd(e) {
    if (!state.isDragging) return;

    state.isDragging = false;
    hideGuides();

    if (state.selectedElement) {
        const domEl = document.getElementById(state.selectedElement);
        if (domEl) {
            domEl.classList.remove('dragging');
        }
        // Save to history after drag completes
        saveToHistory();
    }
}

function selectElement(id) {
    // Deselect previous
    if (state.selectedElement) {
        const prevEl = document.getElementById(state.selectedElement);
        if (prevEl) {
            prevEl.classList.remove('selected');
            removeResizeHandles(prevEl);
        }
    }

    state.selectedElement = id;

    const el = document.getElementById(id);
    if (el) {
        el.classList.add('selected');
        addResizeHandles(el);
    }

    showElementProperties();
}

function deselectElement() {
    if (state.selectedElement) {
        const el = document.getElementById(state.selectedElement);
        if (el) {
            el.classList.remove('selected');
            removeResizeHandles(el);
        }
    }
    state.selectedElement = null;
    hideElementProperties();
}

function deleteElement(id) {
    // Remove from DOM
    const el = document.getElementById(id);
    if (el) el.remove();

    // Remove from state
    const idx = state.design.elements.findIndex(e => e.id === id);
    if (idx !== -1) {
        state.design.elements.splice(idx, 1);
    }

    deselectElement();
    setStatus('요소 삭제됨');
}

function duplicateElement() {
    if (!state.selectedElement) return;
    const original = getElementData(state.selectedElement);
    if (!original) return;

    // Deep copy the element
    const id = `elem_${++state.elementCounter}`;
    const duplicate = JSON.parse(JSON.stringify(original));

    duplicate.id = id;
    duplicate.name = `${original.name || original.type}_copy`;
    duplicate.x = original.x + 20;
    duplicate.y = original.y + 20;
    duplicate.zIndex = ++state.zIndexCounter;

    // Add to state
    state.design.elements.push(duplicate);

    // Create DOM
    createElementDOM(duplicate);

    // Select the duplicate
    selectElement(id);

    setStatus('요소 복제됨');
    saveToHistory();
}

function getElementData(id) {
    return state.design.elements.find(e => e.id === id);
}

// ===== Resize Handles =====
function addResizeHandles(el) {
    const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    positions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${pos}`;
        handle.addEventListener('mousedown', (e) => handleResizeStart(e, pos));
        el.appendChild(handle);
    });
}

function removeResizeHandles(el) {
    el.querySelectorAll('.resize-handle').forEach(h => h.remove());
}

function handleResizeStart(e, position) {
    e.preventDefault();
    e.stopPropagation();

    state.isResizing = true;
    state.resizePosition = position;
    state.resizeStart = { x: e.clientX, y: e.clientY };

    const element = getElementData(state.selectedElement);
    if (element) {
        state.resizeOriginal = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height
        };
    }

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
}

function handleResize(e) {
    if (!state.isResizing || !state.selectedElement) return;

    const element = getElementData(state.selectedElement);
    if (!element) return;

    const dx = e.clientX - state.resizeStart.x;
    const dy = e.clientY - state.resizeStart.y;
    const pos = state.resizePosition;
    const orig = state.resizeOriginal;

    let newX = orig.x, newY = orig.y, newW = orig.width, newH = orig.height;

    if (pos.includes('e')) newW = Math.max(20, orig.width + dx);
    if (pos.includes('w')) { newW = Math.max(20, orig.width - dx); newX = orig.x + dx; }
    if (pos.includes('s')) newH = Math.max(20, orig.height + dy);
    if (pos.includes('n')) { newH = Math.max(20, orig.height - dy); newY = orig.y + dy; }

    element.x = Math.round(newX);
    element.y = Math.round(newY);
    element.width = Math.round(newW);
    element.height = Math.round(newH);

    const domEl = document.getElementById(state.selectedElement);
    if (domEl) {
        domEl.style.left = element.x + 'px';
        domEl.style.top = element.y + 'px';
        domEl.style.width = element.width + 'px';
        domEl.style.height = element.height + 'px';
    }

    updateElementProperties();
}

function handleResizeEnd() {
    state.isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
}

// ===== Smart Alignment =====
function snapToGuides(x, y, width, height) {
    const threshold = 10;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Canvas center
    const canvasCenterX = state.design.canvas.width / 2;
    const canvasCenterY = state.design.canvas.height / 2;

    let showH = false, showV = false;

    // Snap to canvas center
    if (Math.abs(centerX - canvasCenterX) < threshold) {
        x = canvasCenterX - width / 2;
        dom.guideV.style.left = canvasCenterX + 'px';
        showV = true;
    }

    if (Math.abs(centerY - canvasCenterY) < threshold) {
        y = canvasCenterY - height / 2;
        dom.guideH.style.top = canvasCenterY + 'px';
        showH = true;
    }

    // Snap to other elements
    state.design.elements.forEach(other => {
        if (other.id === state.selectedElement) return;

        const otherCenterX = other.x + other.width / 2;
        const otherCenterY = other.y + other.height / 2;

        // Vertical alignment (center)
        if (Math.abs(centerX - otherCenterX) < threshold) {
            x = otherCenterX - width / 2;
            dom.guideV.style.left = otherCenterX + 'px';
            showV = true;
        }

        // Horizontal alignment (center)
        if (Math.abs(centerY - otherCenterY) < threshold) {
            y = otherCenterY - height / 2;
            dom.guideH.style.top = otherCenterY + 'px';
            showH = true;
        }

        // Edge alignments
        if (Math.abs(x - other.x) < threshold) {
            x = other.x;
            dom.guideV.style.left = other.x + 'px';
            showV = true;
        }
        if (Math.abs(x + width - other.x - other.width) < threshold) {
            x = other.x + other.width - width;
            dom.guideV.style.left = (other.x + other.width) + 'px';
            showV = true;
        }
    });

    dom.guideH.classList.toggle('show', showH);
    dom.guideV.classList.toggle('show', showV);

    return { x, y };
}

function hideGuides() {
    dom.guideH.classList.remove('show');
    dom.guideV.classList.remove('show');
}

// ===== Properties Panel =====
function setupPropertyEvents() {
    // Canvas properties
    document.getElementById('canvas-title').addEventListener('input', updateCanvasFromInput);
    document.getElementById('canvas-description').addEventListener('input', updateCanvasFromInput);
    document.getElementById('canvas-width').addEventListener('input', updateCanvasFromInput);
    document.getElementById('canvas-height').addEventListener('input', updateCanvasFromInput);
    document.getElementById('canvas-flexible').addEventListener('change', updateCanvasFromInput);
    document.getElementById('canvas-bgcolor').addEventListener('input', updateCanvasBgColor);

    // Element properties
    document.getElementById('elem-name').addEventListener('input', updateElementFromInput);
    document.getElementById('elem-description').addEventListener('input', updateElementFromInput);
    document.getElementById('elem-x').addEventListener('input', updateElementFromInput);
    document.getElementById('elem-y').addEventListener('input', updateElementFromInput);
    document.getElementById('elem-width').addEventListener('input', updateElementFromInput);
    document.getElementById('elem-height').addEventListener('input', updateElementFromInput);
    document.getElementById('elem-text').addEventListener('input', updateElementFromInput);
    document.getElementById('elem-text-multi').addEventListener('input', updateElementFromInput);
    document.getElementById('elem-style').addEventListener('change', updateElementFromInput);

    // Text alignment buttons
    document.querySelectorAll('.btn-align').forEach(btn => {
        btn.addEventListener('click', () => {
            const align = btn.dataset.align;
            setTextAlignment(align);
        });
    });

    // Font properties
    document.getElementById('font-size').addEventListener('input', updateFontProperties);
    document.getElementById('font-color').addEventListener('input', updateFontProperties);
    document.getElementById('btn-bold').addEventListener('click', toggleBold);
    document.getElementById('btn-italic').addEventListener('click', toggleItalic);

    // Background color
    document.getElementById('elem-bgcolor').addEventListener('input', updateBackgroundColor);
    document.getElementById('elem-bgcolor-none').addEventListener('change', toggleBackgroundNone);

    // Tab Management & Styling
    document.getElementById('btn-add-tab').addEventListener('click', addTab);

    // Tab Styling Inputs
    const tabStyleInputs = {
        'tab-active-bg': 'tabActiveColor',
        'tab-active-font-color': 'fontActiveColor',
        'tab-active-font-size': 'fontActiveSize',
        'tab-inactive-bg': 'tabInactiveColor',
        'tab-inactive-font-color': 'fontInactiveColor',
        'tab-inactive-font-size': 'fontInactiveSize'
    };

    for (const [id, prop] of Object.entries(tabStyleInputs)) {
        document.getElementById(id).addEventListener('input', (e) => {
            updateTabStyle(prop, e.target.value);
        });
    }

    // Tab Bar Alignment Buttons
    document.querySelectorAll('.tab-align').forEach(btn => {
        btn.addEventListener('click', () => {
            const align = btn.dataset.align;
            setTabAlignment(align);
        });
    });

    // Legacy or direct color inputs (if needed, but we replaced HTML)
    // document.getElementById('tab-active-color').addEventListener('input', updateTabColors);
    // document.getElementById('tab-inactive-color').addEventListener('input', updateTabColors);

    // Section Full Width
    const sectionFullWidth = document.getElementById('section-full-width');
    if (sectionFullWidth) {
        sectionFullWidth.addEventListener('change', updateSectionFullWidth);
    }

    // Parent element selector
    document.getElementById('elem-parent').addEventListener('change', updateElementParent);

    // Table properties
    document.getElementById('table-rows').addEventListener('input', updateTableSize);
    document.getElementById('table-cols').addEventListener('input', updateTableSize);
    document.getElementById('btn-edit-table').addEventListener('click', openTableEditor);

    // Duplicate button
    document.getElementById('btn-duplicate-element').addEventListener('click', duplicateElement);

    // Delete button
    document.getElementById('btn-delete-element').addEventListener('click', () => {
        if (state.selectedElement) {
            deleteElement(state.selectedElement);
        }
    });

    // Divider properties
    document.getElementById('divider-orientation').addEventListener('change', updateDividerProperties);
    document.getElementById('divider-full-size').addEventListener('change', updateDividerProperties);
}

function updateFontProperties() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element) return;

    element.properties = element.properties || {};
    element.properties.fontSize = parseInt(document.getElementById('font-size').value) || 14;
    element.properties.fontColor = document.getElementById('font-color').value || '#e8e8f0';

    updateElementDOM(element);
}

function toggleBold() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element) return;

    element.properties = element.properties || {};
    element.properties.fontBold = !element.properties.fontBold;

    const btn = document.getElementById('btn-bold');
    btn.classList.toggle('active', element.properties.fontBold);

    updateElementDOM(element);
    saveToHistory();
}

function toggleItalic() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element) return;

    element.properties = element.properties || {};
    element.properties.fontItalic = !element.properties.fontItalic;

    const btn = document.getElementById('btn-italic');
    btn.classList.toggle('active', element.properties.fontItalic);

    updateElementDOM(element);
    saveToHistory();
}

function updateBackgroundColor() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element) return;

    element.properties = element.properties || {};
    element.properties.bgColor = document.getElementById('elem-bgcolor').value;
    element.properties.bgNone = false;
    document.getElementById('elem-bgcolor-none').checked = false;

    updateElementDOM(element);
}

function toggleBackgroundNone() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element) return;

    element.properties = element.properties || {};
    element.properties.bgNone = document.getElementById('elem-bgcolor-none').checked;

    updateElementDOM(element);
}

function updateTabColors() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element || element.type !== 'tab') return;

    element.properties = element.properties || {};
    element.properties.tabActiveColor = document.getElementById('tab-active-color').value;
    element.properties.tabInactiveColor = document.getElementById('tab-inactive-color').value;

    updateElementDOM(element);
}

function updateCanvasBgColor() {
    state.design.canvas.bgColor = document.getElementById('canvas-bgcolor').value;
    dom.canvas.style.backgroundColor = state.design.canvas.bgColor;
}

function setTextAlignment(align) {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element) return;

    element.properties = element.properties || {};
    element.properties.textAlign = align;

    // Update button states
    document.querySelectorAll('.btn-align').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.align === align);
    });

    updateElementDOM(element);
}

function updateDividerProperties() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element || element.type !== 'divider') return;

    element.properties = element.properties || {};
    const oldOrientation = element.properties.orientation || 'horizontal';
    const newOrientation = document.getElementById('divider-orientation').value;

    element.properties.orientation = newOrientation;
    element.properties.fullWidth = document.getElementById('divider-full-size').checked;

    if (oldOrientation !== newOrientation) {
        if (newOrientation === 'horizontal') {
            element.height = 10;
            element.width = Math.max(100, element.height);
        } else {
            element.width = 10;
            element.height = Math.max(100, element.width);
        }
    }

    if (element.properties.fullWidth) {
        if (newOrientation === 'horizontal') {
            const canvasWidth = state.design.canvas.flexible ? dom.canvas.offsetWidth : state.design.canvas.width;
            element.width = canvasWidth;
            element.x = 0;
            document.getElementById('elem-width').value = element.width;
            document.getElementById('elem-x').value = 0;
        } else {
            const canvasHeight = state.design.canvas.flexible ? dom.canvas.offsetHeight : state.design.canvas.height;
            element.height = canvasHeight;
            element.y = 0;
            document.getElementById('elem-height').value = element.height;
            document.getElementById('elem-y').value = 0;
        }
    }

    updateElementDOM(element);
    saveToHistory();
}

function updateTableSize() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element || element.type !== 'table') return;

    const rows = parseInt(document.getElementById('table-rows').value) || 3;
    const cols = parseInt(document.getElementById('table-cols').value) || 3;

    element.properties = element.properties || {};
    element.properties.rows = rows;
    element.properties.cols = cols;

    // Resize cells array
    const oldCells = element.properties.cells || [];
    const newCells = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push(oldCells[r]?.[c] || (r === 0 ? `열${c + 1}` : ''));
        }
        newCells.push(row);
    }
    element.properties.cells = newCells;

    updateElementDOM(element);
}

function openTableEditor() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element || element.type !== 'table') return;

    const props = element.properties || {};
    const rows = props.rows || 3;
    const cols = props.cols || 3;
    const cells = props.cells || generateDefaultCells(rows, cols);

    // Create modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>테이블 셀 편집</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <table class="modal-table" id="cell-editor">
                    ${cells.map((row, r) => `
                        <tr>
                            ${row.map((cell, c) => `
                                <td>
                                    <input type="text" value="${escapeHtml(cell)}" data-row="${r}" data-col="${c}" />
                                </td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="modal-cancel">취소</button>
                <button class="toolbar-btn export-btn" id="modal-save">저장</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Event handlers
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#modal-save').addEventListener('click', () => {
        const inputs = overlay.querySelectorAll('#cell-editor input');
        inputs.forEach(input => {
            const r = parseInt(input.dataset.row);
            const c = parseInt(input.dataset.col);
            if (!element.properties.cells[r]) element.properties.cells[r] = [];
            element.properties.cells[r][c] = input.value;
        });
        updateElementDOM(element);
        overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function updateParentSelector() {
    const select = document.getElementById('elem-parent');
    const currentId = state.selectedElement;

    // Clear options
    select.innerHTML = '<option value="">(없음 - 윈도우 직속)</option>';

    // Add container elements as options
    state.design.elements.forEach(el => {
        if (containerTypes.includes(el.type) && el.id !== currentId) {
            if (el.type === 'tab') {
                // Tab: list each tab separately
                const tabs = el.properties?.tabs || [{ label: '탭1' }, { label: '탭2' }, { label: '탭3' }];
                tabs.forEach((tab, index) => {
                    const option = document.createElement('option');
                    option.value = `${el.id}:${index}`; // "elementId:tabIndex" format
                    option.textContent = `${el.name || 'tab'}(${index + 1})`;
                    select.appendChild(option);
                });
            } else {
                // Other containers: list as-is
                const option = document.createElement('option');
                option.value = el.id;
                option.textContent = `${el.name || el.type} (${el.type})`;
                select.appendChild(option);
            }
        }
    });

    // Set current value
    const element = getElementData(currentId);
    if (element) {
        if (element.parentId && element.parentTabIndex !== undefined) {
            select.value = `${element.parentId}:${element.parentTabIndex}`;
        } else {
            select.value = element.parentId || '';
        }
    }
}

function updateElementParent(e) {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element) return;

    const value = e.target.value;

    if (value === '') {
        // No parent
        element.parentId = null;
        element.parentTabIndex = undefined;
    } else if (value.includes(':')) {
        // Tab format: "elementId:tabIndex"
        const [parentId, tabIndex] = value.split(':');
        element.parentId = parentId;
        element.parentTabIndex = parseInt(tabIndex);
    } else {
        // Regular container
        element.parentId = value;
        element.parentTabIndex = undefined;
    }

    // Update visibility if parent is a tab
    if (element.parentId) {
        const parent = getElementData(element.parentId);
        if (parent && parent.type === 'tab') {
            updateTabChildrenVisibility(element.parentId);
        }
    }

    updateElementDOM(element);
    saveToHistory();
}



function updateCanvasFromInput() {
    state.design.canvas.title = document.getElementById('canvas-title').value;
    state.design.canvas.description = document.getElementById('canvas-description').value; // Add description
    state.design.canvas.width = parseInt(document.getElementById('canvas-width').value) || 800;
    state.design.canvas.height = parseInt(document.getElementById('canvas-height').value) || 600;
    state.design.canvas.flexible = document.getElementById('canvas-flexible').checked;
    state.design.canvas.bgColor = document.getElementById('canvas-bgcolor').value; // Ensure background color is saved

    updateCanvasSize();
}

function updateCanvasSize() {
    const { width, height, flexible } = state.design.canvas;

    if (flexible) {
        dom.canvas.classList.add('flexible');
        dom.canvas.style.width = '';
        dom.canvas.style.height = '';
        dom.canvasMode.textContent = '플렉시블';
    } else {
        dom.canvas.classList.remove('flexible');
        dom.canvas.style.width = width + 'px';
        dom.canvas.style.height = height + 'px';
        dom.canvasMode.textContent = '고정 크기';
    }

    dom.canvasSize.textContent = `${width} × ${height}`;
}

function updateCanvasFromState() {
    document.getElementById('canvas-title').value = state.design.canvas.title || '';
    document.getElementById('canvas-width').value = state.design.canvas.width;
    document.getElementById('canvas-height').value = state.design.canvas.height;
    document.getElementById('canvas-flexible').checked = state.design.canvas.flexible;
    updateCanvasSize();
}

function showElementProperties() {
    const element = getElementData(state.selectedElement);
    if (!element) return;

    document.getElementById('canvas-properties').style.display = 'none';
    document.getElementById('element-properties').style.display = 'block';

    document.getElementById('elem-id').value = element.id;
    document.getElementById('elem-type').value = element.type;
    document.getElementById('elem-name').value = element.name || '';
    document.getElementById('elem-description').value = element.description || '';
    document.getElementById('elem-x').value = element.x;
    document.getElementById('elem-y').value = element.y;
    document.getElementById('elem-width').value = element.width;
    document.getElementById('elem-height').value = element.height;

    // Toggle Text Input / Textarea
    const isTextarea = element.type === 'textarea';
    const textInput = document.getElementById('elem-text');
    const textArea = document.getElementById('elem-text-multi');

    if (isTextarea) {
        textInput.style.display = 'none';
        textArea.style.display = 'block';
        textArea.value = element.properties?.text || '';
    } else {
        textInput.style.display = 'block';
        textArea.style.display = 'none';
        textInput.value = element.properties?.text || '';
    }

    document.getElementById('elem-style').value = element.properties?.style || 'default';

    // Font properties
    document.getElementById('font-size').value = element.properties?.fontSize || 14;
    document.getElementById('font-color').value = element.properties?.fontColor || '#e8e8f0';
    document.getElementById('btn-bold').classList.toggle('active', element.properties?.fontBold || false);
    document.getElementById('btn-italic').classList.toggle('active', element.properties?.fontItalic || false);

    // Background color
    document.getElementById('elem-bgcolor').value = element.properties?.bgColor || '#1e1e32';
    document.getElementById('elem-bgcolor-none').checked = element.properties?.bgNone || false;

    // Tab Management & Appearance
    const tabMgmt = document.getElementById('tab-management');
    const tabAppear = document.getElementById('tab-appearance');
    const fontProps = document.getElementById('font-properties');
    const textInputRow = document.getElementById('elem-text').closest('.property-row');

    if (element.type === 'tab') {
        if (tabMgmt) tabMgmt.style.display = 'block';
        if (tabAppear) tabAppear.style.display = 'block';
        if (fontProps) fontProps.style.display = 'none';
        if (textInputRow) textInputRow.style.display = 'none';

        renderTabList(element);

        // Populate inputs
        document.getElementById('tab-active-bg').value = element.properties?.tabActiveColor || '#667eea';
        document.getElementById('tab-active-font-color').value = element.properties?.fontActiveColor || '#ffffff';
        document.getElementById('tab-active-font-size').value = element.properties?.fontActiveSize || 13;

        document.getElementById('tab-inactive-bg').value = element.properties?.tabInactiveColor || '#16213e';
        document.getElementById('tab-inactive-font-color').value = element.properties?.fontInactiveColor || '#cccccc';
        document.getElementById('tab-inactive-font-size').value = element.properties?.fontInactiveSize || 13;

        // Tab bar alignment buttons
        const tabAlign = element.properties?.tabAlign || 'left';
        document.querySelectorAll('.tab-align').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === tabAlign);
        });

    } else {
        if (tabMgmt) tabMgmt.style.display = 'none';
        if (tabAppear) tabAppear.style.display = 'none';
        if (fontProps) fontProps.style.display = 'block';
        if (textInputRow) textInputRow.style.display = ''; // Revert to CSS default
    }

    // Section Properties
    const sectionProps = document.getElementById('section-properties');
    if (element.type === 'section') {
        if (sectionProps) sectionProps.style.display = 'block';
        const isFull = element.properties?.fullWidth || false;
        const widthCheck = document.getElementById('section-full-width');
        if (widthCheck) widthCheck.checked = isFull;

        document.getElementById('elem-x').disabled = isFull;
        document.getElementById('elem-width').disabled = isFull;
    } else {
        if (sectionProps) sectionProps.style.display = 'none';
        document.getElementById('elem-x').disabled = false;
        document.getElementById('elem-width').disabled = false;
    }

    // Text alignment buttons
    const align = element.properties?.textAlign || 'center';
    document.querySelectorAll('.btn-align').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.align === align);
    });

    // Parent selector
    updateParentSelector();

    // Table properties
    const tableProps = document.getElementById('table-properties');
    if (element.type === 'table') {
        tableProps.style.display = 'block';
        document.getElementById('table-rows').value = element.properties?.rows || 3;
        document.getElementById('table-cols').value = element.properties?.cols || 3;
    } else {
        tableProps.style.display = 'none';
    }

    // Divider properties
    const dividerProps = document.getElementById('divider-properties');
    if (element.type === 'divider') {
        dividerProps.style.display = 'block';
        document.getElementById('divider-orientation').value = element.properties?.orientation || 'horizontal';
        document.getElementById('divider-full-size').checked = element.properties?.fullWidth || false;
    } else {
        dividerProps.style.display = 'none';
    }
}

function hideElementProperties() {
    document.getElementById('canvas-properties').style.display = 'block';
    document.getElementById('element-properties').style.display = 'none';
}

function updateElementProperties() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element) return;

    document.getElementById('elem-x').value = element.x;
    document.getElementById('elem-y').value = element.y;
    document.getElementById('elem-width').value = element.width;
    document.getElementById('elem-height').value = element.height;
}

function updateElementFromInput() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element) return;

    element.name = document.getElementById('elem-name').value;
    element.description = document.getElementById('elem-description').value;
    element.x = parseInt(document.getElementById('elem-x').value) || 0;
    element.y = parseInt(document.getElementById('elem-y').value) || 0;
    element.width = parseInt(document.getElementById('elem-width').value) || 100;
    element.height = parseInt(document.getElementById('elem-height').value) || 40;
    element.properties = element.properties || {};

    const isTextarea = element.type === 'textarea';
    if (isTextarea) {
        element.properties.text = document.getElementById('elem-text-multi').value;
    } else {
        element.properties.text = document.getElementById('elem-text').value;
    }

    element.properties.style = document.getElementById('elem-style').value;

    // Update DOM using the centralized function
    updateElementDOM(element);

    // Re-add resize handles if selected
    const domEl = document.getElementById(state.selectedElement);
    if (domEl) {
        domEl.classList.add('selected');
        removeResizeHandles(domEl);
        addResizeHandles(domEl);
    }
}

// ===== Utilities =====
function clearCanvas() {
    dom.canvas.querySelectorAll('.canvas-element').forEach(el => el.remove());
}

function renderElementsFromState() {
    state.design.elements.forEach(element => {
        createElementDOM(element);
    });

    // Update Tab Visibility initially
    state.design.elements.forEach(element => {
        if (element.type === 'tab') {
            updateTabChildrenVisibility(element.id);
        }
    });
}

function setStatus(text) {
    if (dom.statusText) {
        dom.statusText.textContent = text;
    }
}

// ===== Zoom Functions =====
function setZoom(level) {
    state.zoom = Math.max(0.25, Math.min(2.0, level));
    dom.canvas.style.transform = `scale(${state.zoom})`;
    dom.canvas.style.transformOrigin = 'top left';
    updateZoomDisplay();
}

function zoomIn() {
    setZoom(state.zoom + 0.1);
}

function zoomOut() {
    setZoom(state.zoom - 0.1);
}

function resetZoom() {
    setZoom(1.0);
}

function updateZoomDisplay() {
    const display = document.getElementById('zoom-level');
    if (display) display.textContent = Math.round(state.zoom * 100) + '%';
}

function setupZoomEvents() {
    const zoomInBtn = document.getElementById('btn-zoom-in');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const zoomResetBtn = document.getElementById('btn-zoom-reset');

    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);

    // Mouse wheel zoom (Ctrl + scroll)
    dom.canvas?.parentElement?.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                zoomIn();
            } else {
                zoomOut();
            }
        }
    }, { passive: false });
}

// ===== History (Undo/Redo) =====
function saveToHistory() {
    // Remove future history if we're not at the end
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }

    // Deep clone the design
    const snapshot = JSON.parse(JSON.stringify(state.design));
    state.history.push(snapshot);

    // Limit history size
    if (state.history.length > state.maxHistory) {
        state.history.shift();
    } else {
        state.historyIndex++;
    }

    updateUndoRedoButtons();
}

function undo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        restoreFromHistory();
        setStatus('실행 취소');
    }
}

function redo() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        restoreFromHistory();
        setStatus('다시 실행');
    }
}

function restoreFromHistory() {
    const snapshot = state.history[state.historyIndex];
    if (!snapshot) return;

    state.design = JSON.parse(JSON.stringify(snapshot));
    state.selectedElement = null;
    clearCanvas();
    renderElementsFromState();
    updateCanvasFromState();
    hideElementProperties();
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');

    if (undoBtn) {
        undoBtn.disabled = state.historyIndex <= 0;
    }
    if (redoBtn) {
        redoBtn.disabled = state.historyIndex >= state.history.length - 1;
    }
}

// ===== Get Children Elements =====
function getChildrenElements(parentId) {
    return state.design.elements.filter(el => el.parentId === parentId);
}

// ===== Move Children with Parent =====
function moveChildrenWithParent(parentId, dx, dy) {
    const children = getChildrenElements(parentId);
    children.forEach(child => {
        child.x += dx;
        child.y += dy;

        const childDom = document.getElementById(child.id);
        if (childDom) {
            childDom.style.left = child.x + 'px';
            childDom.style.top = child.y + 'px';
        }

        // Recursively move grandchildren
        if (child.children && child.children.length > 0) {
            moveChildrenWithParent(child.id, dx, dy);
        }
    });
}


// ===== Tab Management =====
function renderTabList(element) {
    const container = document.getElementById('tab-list-container');
    container.innerHTML = '';

    if (!element.properties.tabs) return;

    element.properties.tabs.forEach((tab, index) => {
        const row = document.createElement('div');
        row.className = 'tab-list-item';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = tab.label;
        input.addEventListener('input', (e) => {
            tab.label = e.target.value;
            updateElementDOM(element);
        });
        input.addEventListener('change', saveToHistory);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon-small';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = () => removeTab(element.id, index);

        row.appendChild(input);
        row.appendChild(deleteBtn);
        container.appendChild(row);
    });
}

function addTab() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element || element.type !== 'tab') return;

    element.properties.tabs = element.properties.tabs || [];
    const newId = 't' + (element.properties.tabs.length + 1) + '_' + Date.now().toString(36);
    element.properties.tabs.push({ id: newId, label: `탭 ${element.properties.tabs.length + 1}` });

    renderTabList(element);
    updateElementDOM(element);
    updateTabChildrenVisibility(element.id);
    saveToHistory();
}

function removeTab(elementId, index) {
    const element = getElementData(elementId);
    if (!element || !element.properties.tabs || element.properties.tabs.length <= 1) {
        alert('최소 하나의 탭은 있어야 합니다.');
        return;
    }

    element.properties.tabs.splice(index, 1);

    // Adjust activeTab if needed
    if (element.properties.activeTab >= index) {
        element.properties.activeTab = Math.max(0, element.properties.activeTab - 1);
    }

    renderTabList(element);
    updateElementDOM(element);
    updateTabChildrenVisibility(elementId);
    saveToHistory();
}

function updateTabStyle(prop, value) {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element) return;

    element.properties = element.properties || {};
    element.properties[prop] = value;

    updateElementDOM(element);
}

function setTabAlignment(align) {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element || element.type !== 'tab') return;

    element.properties = element.properties || {};
    element.properties.tabAlign = align;

    // Update button states
    document.querySelectorAll('.tab-align').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.align === align);
    });

    updateElementDOM(element);
    saveToHistory();
}

function updateSectionFullWidth() {
    if (!state.selectedElement) return;
    const element = getElementData(state.selectedElement);
    if (!element || element.type !== 'section') return;

    element.properties = element.properties || {};
    const isFull = document.getElementById('section-full-width').checked;
    element.properties.fullWidth = isFull;

    if (isFull) {
        // Update model to match canvas (optional, but good for export)
        // But mainly we rely on CSS for live behavior
        element.x = 0;
        element.width = state.design.canvas.width;

        // Update inputs
        document.getElementById('elem-x').value = 0;
        document.getElementById('elem-width').value = state.design.canvas.width;
        document.getElementById('elem-x').disabled = true;
        document.getElementById('elem-width').disabled = true;
    } else {
        document.getElementById('elem-x').disabled = false;
        document.getElementById('elem-width').disabled = false;
    }

    updateElementDOM(element);
    saveToHistory();
}
