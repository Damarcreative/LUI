# Application Development Guide (LUI)

The **LUI App System** is designed to be lightweight, modular, and easy to extend. Applications in LinuxUI are essentially **Static Classes** that manage their own window instances, state, and event listeners.

## 📁 Directory Structure

All applications reside in `src/apps/`. Each application has its own directory containing the main logic and styles.

```text
src/apps/
└── MyApp/
    ├── MyApp.js        # Main Application Logic
    └── style.css       # Application-specific styles
```

## 🏗️ The App Pattern

Applications follow a strict **Static Class** pattern. They are not instantiated with `new App()`; instead, they provide static methods to manage unique window instances.

### Basic Template (`MyApp.js`)

```javascript
import './style.css';
import { WindowManager } from '../../system/components/WindowManager/WindowManager.js';

export class MyApp {
    // State management for multiple windows
    static instances = new Map();

    /**
     * Entry Point: Creates a new window
     * @param {Object} options - Launch options (args, file paths, etc.)
     */
    static createNewInstance(options = {}) {
        const windowId = WindowManager.createWindow('myapp', {
            title: 'My Application',
            width: 600,
            height: 400,
            icon: '<i class="ph ph-rocket"></i>',
            content: this.getWindowContent()
        });

        // Initialize state for this specific window
        this.instances.set(windowId, {
            activeTab: 'home',
            data: []
        });

        // Attach event listeners
        this.initInstance(windowId);

        return windowId;
    }

    /**
     * Returns the HTML structure for the window body
     */
    static getWindowContent() {
        return `
            <div class="myapp-container">
                <div class="toolbar">
                    <button id="btn-action">Click Me</button>
                </div>
                <div class="content-area">
                    Welcome to My App!
                </div>
            </div>
        `;
    }

    /**
     * Attaches DOM event listeners to the window
     */
    static initInstance(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        // Scoped query selection
        const btn = win.querySelector('#btn-action');
        
        btn.addEventListener('click', () => {
             this.handleAction(windowId);
        });
    }

    /**
     * Handle application logic
     */
    static handleAction(windowId) {
        const state = this.instances.get(windowId);
        alert(`Action performed in window ${windowId}`);
    }
}
```

## 🧩 Key Concepts

### 1. WindowManager Integration
Interaction with the window system is done via `WindowManager`.
- `WindowManager.createWindow(appId, options)`: Opens a new window.
- `WindowManager.closeWindow(windowId)`: Programmatically closes a window.

### 2. Multi-Instance Support
Since the class is static, specific state for an open window must be stored in a Map, keyed by `windowId`.
```javascript
static instances = new Map();
// ...
this.instances.get(windowId).someState;
```
Always pass `windowId` to your handler methods to ensure you are modifying the correct window.

### 3. Styling (`style.css`)
Styles should be scoped to prevent leaking into other apps or the system. Use a unique class prefix.

```css
/* Good */
.myapp-container .toolbar { background: #eee; }

/* Bad - might affect other apps */
.toolbar { background: #eee; }
```

### 4. System APIs
Access system resources through helper services:
*   **FileSystem**: `import { FileSystem } from '../../system/lib/FileSystem.js'`
*   **AppRegistry**: `import { AppRegistry } from '../../system/lib/AppRegistry.js'`

## � Backend API Integration

LUI supports a **File-System Based API** system. Each app can define its own backend routes that are automatically discovered by the build system.

### Integration Steps

1.  Create an `api/` folder inside your app directory.
2.  Create `index.js` inside that folder.
3.  Export a default object mapping route patterns to handler functions.

**Structure:**
```text
src/apps/MyApp/
├── api/
│   └── index.js    # Backend Routes
```

### Route Definition (`api/index.js`)

The system uses a simple key-based routing format: `'METHOD /path'`.

```javascript
// src/apps/MyApp/api/index.js

export default {
    /**
     * Simple GET request
     * Accessible at: /api/myapp/hello
     */
    'GET /hello': async (req) => {
        return { message: 'Hello from Backend!' };
    },

    /**
     * Route with parameters
     * Accessible at: /api/myapp/user/123
     */
    'GET /user/:id': async (req) => {
        const userId = req.params.id;
        return { success: true, userId };
    },

    /**
     * POST request with body
     */
    'POST /data': async (req) => {
        const { title, content } = req.body;
        
        // Simulating DB operation
        console.log('Saving:', title);
        
        return { success: true, id: Date.now() };
    }
};
```

### Consuming the API (`MyApp.js`)

In your frontend code, you can call these endpoints using standard `fetch`:

```javascript
async fetchData() {
    try {
        const response = await fetch('/api/myapp/hello');
        const data = await response.json();
        console.log(data);
    } catch (err) {
        console.error('API Error:', err);
    }
}
```

## 🚀 Registering Your App

To make your app visible in the Start Menu:

1.  **Import & Register** in `src/main.js` (or via AppRegistry auto-discovery).
2.  **Manifest Properties**:
    *   `id`: Unique identifier (e.g. `myapp`)
    *   `name`: Display name
    *   `icon`: SVG or Font Icon HTML
    *   `createInstance`: Reference to your static method

## 💡 Best Practices

*   **State Management**: Use `this.instances` Map to store state for each window `windowId`.
*   **Cleanup**: Remove listeners and intervals when the window is closed.
*   **Scoped Styling**: Always use specific class prefixes (e.g., `.myapp-container`) to avoid conflicting with other apps.

