/**
 * ============================================================================
 *  electron/main.cjs — PROCESSO PRINCIPAL DO ELECTRON (APP DE DESKTOP)
 * ============================================================================
 *
 *  O jogo é, na essência, uma aplicação WEB (roda no navegador). O Electron
 *  permite EMPACOTÁ-LO como um programa de desktop (Windows/Linux), abrindo o
 *  jogo dentro de uma janela própria que embute o motor do Chromium.
 *
 *  Este arquivo é o "processo principal" do Electron: ele cria a janela e
 *  carrega o bundle de produção gerado pelo Vite (a pasta dist/). É o
 *  equivalente, no desktop, ao papel que o index.html cumpre no navegador.
 *
 *  Observação: é um arquivo .cjs (CommonJS) — usa `require(...)` em vez de
 *  `import`, pois o processo principal do Electron roda em ambiente Node.
 * ============================================================================
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

/** Cria a janela do jogo com tamanho fixo e sem barra de menu. */
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

// Quando o Electron termina de inicializar, cria a janela. O evento 'activate'
// recria a janela no macOS quando o ícone do dock é clicado e não há janelas.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Encerra o app quando todas as janelas fecham — exceto no macOS ('darwin'),
// onde é convenção o app continuar ativo até o usuário sair explicitamente.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
