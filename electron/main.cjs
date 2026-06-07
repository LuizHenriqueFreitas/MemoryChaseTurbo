const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        useContentSize: true,   // largura/altura referem-se à área útil (o canvas)
        width: 804,             // 800 do jogo + 2px de borda de cada lado
        height: 604,
        resizable: false,
        autoHideMenuBar: true,
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.setMenuBarVisibility(false);

    // Carrega o bundle gerado pelo "npm run build" (pasta dist/)
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
