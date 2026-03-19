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
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 16, y: 14 } : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false,
  });

  // Inject CSS on every page load to pad content away from traffic lights
  const injectCSS = () => {
    if (!isMac || !mainWindow) return;
    mainWindow.webContents.insertCSS(`
      /* === Electron macOS: traffic light padding === */
      /* Welcome/Prejoin pages: push logo right */
      [class*="logo"] {
        margin-left: 64px !important;
      }
      /* Call screen topbar: push left content right */
      [class*="topbar"] {
        padding-left: 74px !important;
      }
      /* Make titlebar area draggable */
      [class*="topbar"],
      [class*="logo"] {
        -webkit-app-region: drag;
      }
      /* Exclude interactive elements from drag */
      button, a, input, select, textarea,
      [class*="Btn"], [class*="btn"], [class*="toggle"],
      [class*="Invite"], [class*="invite"],
      [class*="input"], [class*="select"] {
        -webkit-app-region: no-drag;
      }
    `).catch(() => {});
  };

  mainWindow.webContents.on('did-finish-load', injectCSS);
  mainWindow.webContents.on('did-navigate-in-page', injectCSS);

  // Grant camera/microphone/screen permissions automatically
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(['media', 'mediaKeySystem', 'clipboard-read',
      'clipboard-sanitized-write', 'notifications', 'display-capture'
    ].includes(permission));
  });

  // Screen sharing
  session.defaultSession.setDisplayMediaRequestHandler((_req, callback) => {
    callback({ video: true });
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Keep meet.quillon.ru links inside the app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Handle window.open / target=_blank
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) {
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
    for (const type of ['camera', 'microphone']) {
      if (systemPreferences.getMediaAccessStatus(type) !== 'granted') {
        await systemPreferences.askForMediaAccess(type);
      }
    }
  }
}

app.whenReady().then(async () => {
  await requestPermissions();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Deep links: quillonmeet://room/xxx
app.setAsDefaultProtocolClient('quillonmeet');
app.on('open-url', (event, url) => {
  event.preventDefault();
  const roomPath = url.replace('quillonmeet://', '');
  if (mainWindow) {
    mainWindow.loadURL(`${APP_URL}/${roomPath}`);
    mainWindow.focus();
  }
});
