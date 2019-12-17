const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const { Menu } = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

var AutoLaunch = require('auto-launch');
var minecraftAutoLauncher = new AutoLaunch({
    name: 'clock', //应用名称
    path: process.execPath, //应用绝对路径
    isHidden: false, //是否隐藏启动
    mac: {
        useLaunchAgent: false //是否启用代理启动，默认是AppleScript启动
    }
});
minecraftAutoLauncher.isEnabled().then(function (isEnabled) {
    if (isEnabled == false) {
        minecraftAutoLauncher.enable();
    }
});

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })

    //win.loadURL('file://index.html')

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'view/index.html'),
        protocol: 'file:',
        slashes: true
    }))
    win.maximize();

    Menu.setApplicationMenu(null);

    //pathname: path.join(__dirname, 'index.html'),
    // Open the DevTools.
    //win.webContents.openDevTools(false);

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
});
