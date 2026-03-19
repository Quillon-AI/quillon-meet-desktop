const { app, BrowserWindow, systemPreferences, session } = require('electron');
const path = require('path');

const APP_URL = 'https://meet.quillon.ru';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Quillon Meet',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#080B14',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Enable media features
      webSecurity: true,
    },
    show: false,
  });

  // Grant camera/microphone/screen permissions automatically
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = [
      'media',
      'mediaKeySystem',
      'clipboard-read',
      'clipboard-sanitized-write',
      'notifications',
    ];
    callback(allowed.includes(permission));
  });

  // Handle display-capture for screen sharing
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    // Allow screen share without picker for simplicity, or use desktopCapturer
    callback({ video: true });
  });

  mainWindow.loadURL(APP_URL);

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
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

// Handle deep links
app.setAsDefaultProtocolClient('quillonmeet');

app.on('open-url', (event, url) => {
  event.preventDefault();
  // quillonmeet://room/xxx -> https://meet.quillon.ru/room/xxx
  const roomPath = url.replace('quillonmeet://', '');
  if (mainWindow) {
    mainWindow.loadURL(`${APP_URL}/${roomPath}`);
    mainWindow.focus();
  }
});
