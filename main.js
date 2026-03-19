const { app, BrowserWindow, systemPreferences, session, shell } = require('electron');
const path = require('path');

const APP_URL = 'https://meet.quillon.ru';

let mainWindow;

function createWindow() {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Quillon Meet',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#080B14',
    // macOS: hidden title bar with inset traffic lights, pushed right
    // to avoid overlapping page content
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 12, y: 12 } : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  // Inject CSS to add left padding on macOS for traffic lights
  mainWindow.webContents.on('did-finish-load', () => {
    if (isMac) {
      mainWindow.webContents.insertCSS(`
        /* Push page content right so traffic lights don't overlap */
        body { -webkit-app-region: drag; }
        input, button, select, textarea, a, [role="button"] { -webkit-app-region: no-drag; }
      `);
    }
  });

  // Grant camera/microphone/screen permissions automatically
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = [
      'media',
      'mediaKeySystem',
      'clipboard-read',
      'clipboard-sanitized-write',
      'notifications',
      'display-capture',
    ];
    callback(allowed.includes(permission));
  });

  // Handle display-capture for screen sharing
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    callback({ video: true });
  });

  mainWindow.loadURL(APP_URL);

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Navigation handling: keep meet.quillon.ru links inside the app,
  // open everything else in the default browser
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL)) {
      event.preventDefault();
      shell.openExternal(url);
    }
    // meet.quillon.ru links navigate inside the app (default behavior)
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) {
      // Navigate in the same window instead of opening a new one
      mainWindow.loadURL(url);
    } else {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// macOS: request camera/mic permissions
async function requestPermissions() {
  if (process.platform === 'darwin') {
    const cameraStatus = systemPreferences.getMediaAccessStatus('camera');
    const micStatus = systemPreferences.getMediaAccessStatus('microphone');

    if (cameraStatus !== 'granted') {
      await systemPreferences.askForMediaAccess('camera');
    }
    if (micStatus !== 'granted') {
      await systemPreferences.askForMediaAccess('microphone');
    }
  }
}

app.whenReady().then(async () => {
  await requestPermissions();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle deep links: quillonmeet://room/xxx
app.setAsDefaultProtocolClient('quillonmeet');

app.on('open-url', (event, url) => {
  event.preventDefault();
  const roomPath = url.replace('quillonmeet://', '');
  if (mainWindow) {
    mainWindow.loadURL(`${APP_URL}/${roomPath}`);
    mainWindow.focus();
  }
});
