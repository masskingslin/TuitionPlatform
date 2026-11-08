import { app, BrowserWindow, protocol, ipcMain, shell, session, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

// 1. Register privileged standard scheme BEFORE app ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

// 2. Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

function getWindowStatePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState(): { width: number; height: number; x?: number; y?: number; isMaximized?: boolean } {
  try {
    const statePath = getWindowStatePath();
    if (fs.existsSync(statePath)) {
      const data = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (typeof data.width === 'number' && typeof data.height === 'number') {
        return data;
      }
    }
  } catch (err) {
    console.warn('Could not load saved window state:', err);
  }
  return { width: 1280, height: 800 };
}

function saveWindowState(win: BrowserWindow): void {
  try {
    const bounds = win.getBounds();
    const data = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: win.isMaximized()
    };
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('Could not save window state:', err);
  }
}

function createWindow(): void {
  const windowState = loadWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.setMenu(null);

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Save window dimensions on move/resize/close
  mainWindow.on('resize', () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on('move', () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on('close', () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  // Handle external links (open in default OS browser)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('upi://') ||
      url.startsWith('intent://') ||
      url.startsWith('whatsapp://') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:')
    ) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://tuition')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Load app://tuition
  mainWindow.loadURL('app://tuition/');
}

// 3. Register custom protocol handler & CSP headers on ready
app.whenReady().then(() => {
  // Protocol handler for app://tuition
  protocol.handle('app', (request) => {
    try {
      const reqUrl = new URL(request.url);
      let relativePath = decodeURIComponent(reqUrl.pathname);
      if (relativePath.startsWith('/')) relativePath = relativePath.slice(1);

      const distDir = path.join(__dirname, '../dist');
      let filePath = path.join(distDir, relativePath);

      // SPA fallback to index.html if file doesn't exist or is a directory
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      return net.fetch(pathToFileURL(filePath).toString());
    } catch (err) {
      console.error('Protocol handler error:', err);
      const fallbackPath = path.join(__dirname, '../dist/index.html');
      return net.fetch(pathToFileURL(fallbackPath).toString());
    }
  });

  // Content Security Policy (CSP) Header configuration
  const rawApiUrl = process.env.VITE_API_BASE_URL?.trim() || '';
  let apiHost = '';
  if (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')) {
    try {
      apiHost = new URL(rawApiUrl).origin;
    } catch {
      // ignore
    }
  }

  const cspDirective = [
    "default-src 'self' app://tuition",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' app://tuition https://*.firebaseapp.com https://*.googleapis.com https://*.gstatic.com https://8x8.vc https://meet.jit.si",
    "style-src 'self' 'unsafe-inline' app://tuition https://fonts.googleapis.com",
    "font-src 'self' app://tuition https://fonts.gstatic.com data:",
    "img-src 'self' app://tuition data: blob: https:",
    `connect-src 'self' app://tuition https://*.firebaseio.com https://*.googleapis.com https://*.firebaseapp.com wss://*.firebaseio.com https://8x8.vc https://meet.jit.si ${apiHost}`.trim(),
    "frame-src 'self' app://tuition https://*.firebaseapp.com https://8x8.vc https://meet.jit.si",
    "media-src 'self' app://tuition blob: data:"
  ].join('; ');

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspDirective]
      }
    });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler for opening external links from renderer
ipcMain.on('open-external', (_event, url: string) => {
  if (url && typeof url === 'string') {
    shell.openExternal(url);
  }
});
