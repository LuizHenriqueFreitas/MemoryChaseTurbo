import { Scene } from 'phaser';
import { CONFIG } from '../utils/constants';
import { loadSave } from '../utils/SaveData';
import { AudioManager } from '../utils/AudioManager';

export class MenuScene extends Scene {
    private totalPointsText!: Phaser.GameObjects.Text;
    private saveData: any;
    private extraModal!: Phaser.GameObjects.Container;
    private audioManager!: AudioManager;
    private optionsModalContainer: Phaser.GameObjects.Container | null = null;

    constructor() {
        super('MenuScene');
    }

    create() {
        this.saveData = loadSave();
        
        // Inicializa o gerenciador de áudio
        this.audioManager = new AudioManager(this);
        
        // Reset do teclado ao entrar no menu
        if (this.input && this.input.keyboard) {
            this.input.keyboard.removeAllListeners();
            this.input.keyboard.resetKeys();
        }

        // Carteira no canto superior direito
        this.totalPointsText = this.add.text(CONFIG.WIDTH - 20, 20, `💰 ${this.saveData.totalPoints}`, { 
            fontSize: '28px', 
            color: '#ffd966', 
            backgroundColor: '#000000aa', 
            padding: { x: 10, y: 5 } 
        }).setOrigin(1, 0);
        
        // Título
        this.add.text(CONFIG.WIDTH / 2, 120, 'MEMORY CHASE TURBO', { 
            fontSize: '52px', 
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Instruções
        this.add.text(CONFIG.WIDTH / 2, 190, '← →  mover  |  [WASD] mover  |  [ESPAÇO] atirar', { 
            fontSize: '20px', 
            color: '#aaa' 
        }).setOrigin(0.5);
        
        this.add.text(CONFIG.WIDTH / 2, 230, 'Destrua asteroides, desvie dos tiros e colete moedas', { 
            fontSize: '16px', 
            color: '#ccc' 
        }).setOrigin(0.5);

        // ========== BOTÕES PRINCIPAIS ==========
        const centerX = CONFIG.WIDTH / 2;
        let currentY = 310;
        const spacing = 65;

        // Botão Iniciar Jogo
        const startBtn = this.add.text(centerX, currentY, '▶ INICIAR JOGO', { 
            fontSize: '32px', 
            color: '#0f0', 
            backgroundColor: '#000000aa', 
            padding: { x: 25, y: 12 } 
        }).setOrigin(0.5).setInteractive();
        startBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.scene.start('GameScene');
        });
        startBtn.on('pointerover', () => startBtn.setColor('#ff0'));
        startBtn.on('pointerout', () => startBtn.setColor('#0f0'));
        currentY += spacing;

        // Botão Armamento
        const weaponsBtn = this.add.text(centerX, currentY, '⚔️ ARMAMENTO', {
            fontSize: '28px',
            color: '#0af',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        weaponsBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.scene.start('WeaponSelectScene');
        });
        weaponsBtn.on('pointerover', () => weaponsBtn.setColor('#ff0'));
        weaponsBtn.on('pointerout', () => weaponsBtn.setColor('#0af'));
        currentY += spacing;

        // Botão Upgrades
        const upgradesBtn = this.add.text(centerX, currentY, '🛒 UPGRADES', { 
            fontSize: '28px', 
            color: '#0af', 
            backgroundColor: '#000000aa', 
            padding: { x: 20, y: 10 } 
        }).setOrigin(0.5).setInteractive();
        upgradesBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.scene.start('UpgradeScene');
        });
        upgradesBtn.on('pointerover', () => upgradesBtn.setColor('#ff0'));
        upgradesBtn.on('pointerout', () => upgradesBtn.setColor('#0af'));
        currentY += spacing;

        // Créditos / Versão
        this.add.text(centerX, CONFIG.HEIGHT - 70, 'v1.0.0 - Desenvolvido com Phaser', {
            fontSize: '14px',
            color: '#666'
        }).setOrigin(0.5);

        // Botão Extra (canto inferior esquerdo)
        const extraBtn = this.add.text(20, CONFIG.HEIGHT - 20, '📦 EXTRA', { 
            fontSize: '22px', 
            color: '#ddd', 
            backgroundColor: '#000000aa', 
            padding: { x: 12, y: 6 } 
        }).setOrigin(0, 1).setInteractive();
        extraBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.showExtraModal();
        });
        extraBtn.on('pointerover', () => extraBtn.setColor('#ffcc00'));
        extraBtn.on('pointerout', () => extraBtn.setColor('#ddd'));

        // Botão Opções (canto inferior direito)
        const optionsBtn = this.add.text(CONFIG.WIDTH - 20, CONFIG.HEIGHT - 20, '⚙️ Opções', { 
            fontSize: '22px', 
            color: '#ddd', 
            backgroundColor: '#000000aa', 
            padding: { x: 12, y: 6 } 
        }).setOrigin(1, 1).setInteractive();
        optionsBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.showOptionsModal();
        });
        optionsBtn.on('pointerover', () => optionsBtn.setColor('#ffcc00'));
        optionsBtn.on('pointerout', () => optionsBtn.setColor('#ddd'));

        // Criar o modal Extra (inicialmente invisível)
        this.createExtraModal();
    }

    private createExtraModal() {
        // Container principal do modal
        this.extraModal = this.add.container(0, 0);
        this.extraModal.setVisible(false);
        
        // Overlay escuro
        const overlay = this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.85);
        overlay.setOrigin(0);
        overlay.setInteractive();
        overlay.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.hideExtraModal();
        });
        this.extraModal.add(overlay);
        
        // Fundo do modal
        const modalBg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 500, 400, 0x1a2a3a, 0.98);
        modalBg.setStrokeStyle(3, 0x88aaff);
        modalBg.setOrigin(0.5);
        this.extraModal.add(modalBg);
        
        // Título
        const title = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 160, '📦 EXTRA', {
            fontSize: '32px',
            color: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.extraModal.add(title);
        
        // Linha divisória
        const line = this.add.line(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 130, 100, 0, CONFIG.WIDTH - 100, 0, 0x88aaff, 0.5);
        line.setOrigin(0.5);
        this.extraModal.add(line);
        
        // Botão Arte Conceitual
        const artBtn = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 50, '🎨 ARTE CONCEITUAL', {
            fontSize: '24px',
            color: '#ffaa44',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 12 }
        }).setOrigin(0.5).setInteractive();
        artBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.hideExtraModal();
            this.showConceptArt();
        });
        artBtn.on('pointerover', () => artBtn.setColor('#fff'));
        artBtn.on('pointerout', () => artBtn.setColor('#ffaa44'));
        this.extraModal.add(artBtn);
        
        // Botão Sobre o Jogo
        const aboutBtn = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 30, '📖 SOBRE O JOGO', {
            fontSize: '24px',
            color: '#ffaa44',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 12 }
        }).setOrigin(0.5).setInteractive();
        aboutBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.hideExtraModal();
            this.showAboutGame();
        });
        aboutBtn.on('pointerover', () => aboutBtn.setColor('#fff'));
        aboutBtn.on('pointerout', () => aboutBtn.setColor('#ffaa44'));
        this.extraModal.add(aboutBtn);
        
        // Botão Fechar
        const closeBtn = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 130, '✖ FECHAR', {
            fontSize: '20px',
            color: '#ff6666',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.hideExtraModal();
        });
        closeBtn.on('pointerover', () => closeBtn.setColor('#ff8888'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#ff6666'));
        this.extraModal.add(closeBtn);
    }

    private showExtraModal() {
        this.extraModal.setVisible(true);
    }

    private hideExtraModal() {
        this.extraModal.setVisible(false);
    }

    private showConceptArt() {
        // Container da arte conceitual
        const artContainer = this.add.container(0, 0);
        
        // Overlay
        const overlay = this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.9);
        overlay.setOrigin(0);
        overlay.setInteractive();
        overlay.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            artContainer.destroy();
        });
        artContainer.add(overlay);
        
        // Fundo do modal
        const modalBg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 650, 500, 0x1a2a3a, 0.98);
        modalBg.setStrokeStyle(3, 0x88aaff);
        modalBg.setOrigin(0.5);
        artContainer.add(modalBg);
        
        // Título
        const title = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 220, '🎨 ARTE CONCEITUAL', {
            fontSize: '28px',
            color: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        artContainer.add(title);
        
        // Área da imagem
        const conceptArt = this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'concept_art');
        conceptArt.setScale(0.5);
        artContainer.add(conceptArt);
        
        // Botão Voltar
        const backBtn = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 280, '← VOLTAR', {
            fontSize: '22px',
            color: '#fff',
            backgroundColor: '#333',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive();
        backBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            artContainer.destroy();
        });
        backBtn.on('pointerover', () => backBtn.setBackgroundColor('#555'));
        backBtn.on('pointerout', () => backBtn.setBackgroundColor('#333'));
        artContainer.add(backBtn);
    }

    private showAboutGame() {
        // Container do sobre
        const aboutContainer = this.add.container(0, 0);
        
        // Overlay
        const overlay = this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.9);
        overlay.setOrigin(0);
        overlay.setInteractive();
        overlay.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            aboutContainer.destroy();
        });
        aboutContainer.add(overlay);
        
        // Fundo do modal
        const modalBg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 600, 450, 0x1a2a3a, 0.98);
        modalBg.setStrokeStyle(3, 0x88aaff);
        modalBg.setOrigin(0.5);
        aboutContainer.add(modalBg);
        
        // Título
        const title = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 190, '📖 SOBRE O JOGO', {
            fontSize: '28px',
            color: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        aboutContainer.add(title);
        
        // Texto da história
        const storyText = `Com a crescente do uso de IA por grandes comporações no mundo todo, desde 2022 quando foi lançado ao público o chat GPT alcançando seu apse nos início de 2026, a especulação econômica sobre componentes e infraestrutura tecnologica alcançou seu pico, com grandes corporações esgotando estoques de memória RAM para construção de servidores dedicados ao processamento de modelos de linguagem - além de outros componentes, a memória RAM foi um dos principais afetados, quando gigantes como microsoft, apple e meta, entre outras, passaram a esgotar a oferta do componente, prejudicando milhares de consumidores menores e individuais.\n
        O protagonista dessa obra combate essas grandes empresas usando seu fiat uno voador num futuro distopico onde as empresas tem naves - todos buscam memórias para aprimorar a capacidade de processamento.`;

        const text = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 40, storyText, {
            fontSize: '14px',
            color: '#ccc',
            align: 'justify',
            wordWrap: { width: 500 }
        }).setOrigin(0.5);
        aboutContainer.add(text);
        
        // Informações do desenvolvedor
        const devText = `\nDev: Luiz Henrique Oliveira de Freitas\nContato: luiz.h.o.freitas@gmail.com\nAno: 2026  |  Versão: 1.0.0\n\nFeito com Phaser 3 e TypeScript`;
        
        const devInfo = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 128, devText, {
            fontSize: '12px',
            color: '#888',
            align: 'center'
        }).setOrigin(0.5);
        aboutContainer.add(devInfo);
        
        // Botão Voltar
        const backBtn = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 198, '← VOLTAR', {
            fontSize: '22px',
            color: '#fff',
            backgroundColor: '#333',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive();
        backBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            aboutContainer.destroy();
        });
        backBtn.on('pointerover', () => backBtn.setBackgroundColor('#555'));
        backBtn.on('pointerout', () => backBtn.setBackgroundColor('#333'));
        aboutContainer.add(backBtn);
    }

    private showOptionsModal() {
        // Fecha modal anterior se existir
        if (this.optionsModalContainer) {
            this.optionsModalContainer.destroy();
            this.optionsModalContainer = null;
        }
        
        this.optionsModalContainer = this.add.container(0, 0);
        
        // Overlay escuro
        const overlay = this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.85);
        overlay.setOrigin(0);
        overlay.setInteractive();
        overlay.on('pointerdown', () => this.closeOptionsModal());
        this.optionsModalContainer.add(overlay);
        
        // Fundo do modal
        const modalBg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 500, 400, 0x1a2a3a, 0.98);
        modalBg.setStrokeStyle(2, 0x88aaff);
        modalBg.setOrigin(0.5);
        this.optionsModalContainer.add(modalBg);
        
        // Título
        const title = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 160, '⚙️ CONFIGURAÇÕES', {
            fontSize: '28px',
            color: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.optionsModalContainer.add(title);
        
        // Linha divisória
        const line1 = this.add.line(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 130, 100, 0, CONFIG.WIDTH - 100, 0, 0x88aaff, 0.5);
        line1.setOrigin(0.5);
        this.optionsModalContainer.add(line1);
        
        // Efeitos Sonoros
        const sfxLabel = this.add.text(CONFIG.WIDTH / 2 - 220, CONFIG.HEIGHT / 2 - 70, '🔊 Efeitos Sonoros:', {
            fontSize: '20px',
            color: '#fff'
        }).setOrigin(0, 0.5);
        this.optionsModalContainer.add(sfxLabel);

        const sfxMuted = this.audioManager.isSfxMutedState();
        const sfxBtn = this.add.text(CONFIG.WIDTH / 2 + 220, CONFIG.HEIGHT / 2 - 70, sfxMuted ? 'DESLIGADO' : 'LIGADO', {
            fontSize: '20px',
            color: sfxMuted ? '#ff6666' : '#66ff66',
            backgroundColor: '#000',
            padding: { x: 15, y: 5 }
        }).setOrigin(1, 0.5).setInteractive();
        this.optionsModalContainer.add(sfxBtn);
        
        sfxBtn.on('pointerdown', () => {
            const newMuted = !this.audioManager.isSfxMutedState();
            this.audioManager.setSfxMuted(newMuted);
            sfxBtn.setText(newMuted ? 'DESLIGADO' : 'LIGADO');
            sfxBtn.setColor(newMuted ? '#ff6666' : '#66ff66');
            if (!newMuted) {
                this.audioManager.playSfx('click');
            }
        });
        
        // Música
        const musicLabel = this.add.text(CONFIG.WIDTH / 2 - 220, CONFIG.HEIGHT / 2 - 10, '🎵 Música de Fundo:', {
            fontSize: '20px',
            color: '#fff'
        }).setOrigin(0, 0.5);
        this.optionsModalContainer.add(musicLabel);

        const musicMuted = this.audioManager.isMusicMutedState();
        const musicBtn = this.add.text(CONFIG.WIDTH / 2 + 220, CONFIG.HEIGHT / 2 - 10, musicMuted ? 'DESLIGADO' : 'LIGADO', {
            fontSize: '20px',
            color: musicMuted ? '#ff6666' : '#66ff66',
            backgroundColor: '#000',
            padding: { x: 15, y: 5 }
        }).setOrigin(1, 0.5).setInteractive();
        this.optionsModalContainer.add(musicBtn);
        
        musicBtn.on('pointerdown', () => {
            const newMuted = !this.audioManager.isMusicMutedState();
            this.audioManager.setMusicMuted(newMuted);
            musicBtn.setText(newMuted ? 'DESLIGADO' : 'LIGADO');
            musicBtn.setColor(newMuted ? '#ff6666' : '#66ff66');
        });
        
        // Linha divisória
        const line2 = this.add.line(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 40, 100, 0, CONFIG.WIDTH - 100, 0, 0x88aaff, 0.5);
        line2.setOrigin(0.5);
        this.optionsModalContainer.add(line2);
        
        // Botão Limpar Save
        const clearSaveBtn = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 80, '🗑️ LIMPAR SAVE', {
            fontSize: '20px',
            color: '#ffaa44',
            backgroundColor: '#330000',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive();
        this.optionsModalContainer.add(clearSaveBtn);
        
        clearSaveBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.showClearSaveConfirm();
        });
        
        // Botão Fechar
        const closeBtn = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 150, 'FECHAR', {
            fontSize: '22px',
            color: '#fff',
            backgroundColor: '#333',
            padding: { x: 25, y: 8 }
        }).setOrigin(0.5).setInteractive();
        this.optionsModalContainer.add(closeBtn);
        
        closeBtn.on('pointerdown', () => this.closeOptionsModal());
    }

    private closeOptionsModal() {
        if (this.optionsModalContainer) {
            this.optionsModalContainer.destroy();
            this.optionsModalContainer = null;
        }
    }

    private showClearSaveConfirm() {
        // Fecha o modal de opções temporariamente
        this.closeOptionsModal();
        
        const confirmContainer = this.add.container(0, 0);
        
        const overlay = this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.9);
        overlay.setOrigin(0);
        overlay.setInteractive();
        confirmContainer.add(overlay);
        
        const confirmBg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 450, 200, 0x2a3a4a, 0.98);
        confirmBg.setStrokeStyle(2, 0xffaa44);
        confirmBg.setOrigin(0.5);
        confirmContainer.add(confirmBg);
        
        const warnText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 50, '⚠️ ATENÇÃO ⚠️', {
            fontSize: '24px',
            color: '#ffaa44'
        }).setOrigin(0.5);
        confirmContainer.add(warnText);
        
        const msgText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 10, 'Deseja realmente apagar todos os dados salvos?', {
            fontSize: '16px',
            color: '#fff'
        }).setOrigin(0.5);
        confirmContainer.add(msgText);
        
        const subText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 20, '(Progresso, upgrades e pontuação serão perdidos)', {
            fontSize: '14px',
            color: '#aaa'
        }).setOrigin(0.5);
        confirmContainer.add(subText);
        
        const confirmYes = this.add.text(CONFIG.WIDTH / 2 - 80, CONFIG.HEIGHT / 2 + 70, 'SIM', {
            fontSize: '20px',
            color: '#ff6666',
            backgroundColor: '#330000',
            padding: { x: 20, y: 5 }
        }).setOrigin(0.5).setInteractive();
        confirmContainer.add(confirmYes);
        
        const confirmNo = this.add.text(CONFIG.WIDTH / 2 + 80, CONFIG.HEIGHT / 2 + 70, 'NÃO', {
            fontSize: '20px',
            color: '#66ff66',
            backgroundColor: '#003300',
            padding: { x: 20, y: 5 }
        }).setOrigin(0.5).setInteractive();
        confirmContainer.add(confirmNo);
        
        const closeConfirm = () => {
            confirmContainer.destroy();
            // Reabre o modal de opções
            this.showOptionsModal();
        };
        
        confirmYes.on('pointerdown', () => {
            localStorage.removeItem('memoryChaseSave');
            localStorage.removeItem('sfxMuted');
            localStorage.removeItem('musicMuted');
            this.saveData = loadSave();
            this.totalPointsText.setText(`💰 ${this.saveData.totalPoints}`);
            closeConfirm();
        });
        
        confirmNo.on('pointerdown', () => {
            closeConfirm();
        });
    }
}