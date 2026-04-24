import { Scene } from 'phaser';
import { CONFIG } from '../utils/constants';
import { loadSave } from '../utils/SaveData';

export class MenuScene extends Scene {
    private totalPointsText!: Phaser.GameObjects.Text;
    private saveData: any;

    constructor() {
        super('MenuScene');
    }

    create() {
        this.saveData = loadSave();
        
        // Carteira no canto superior direito
        this.totalPointsText = this.add.text(CONFIG.WIDTH - 20, 20, `💰 ${this.saveData.totalPoints}`, { 
            fontSize: '28px', 
            color: '#ffd966', 
            backgroundColor: '#000000aa', 
            padding: { x: 10, y: 5 } 
        }).setOrigin(1, 0);
        
        // Título e instruções
        this.add.text(CONFIG.WIDTH / 2, 180, 'MEMORY CHASE TURBO', { fontSize: '52px', color: '#fff' }).setOrigin(0.5);
        this.add.text(CONFIG.WIDTH / 2, 260, '← →  mover |  [ESPAÇO] atirar', { fontSize: '22px', color: '#aaa' }).setOrigin(0.5);
        this.add.text(CONFIG.WIDTH / 2, 310, 'Destrua asteroides, desvie dos tiros e colete moedas', { fontSize: '18px', color: '#ccc' }).setOrigin(0.5);

        // Botão Iniciar Jogo
        const startBtn = this.add.text(CONFIG.WIDTH / 2, 410, '▶ INICIAR JOGO', { 
            fontSize: '34px', 
            color: '#0f0', 
            backgroundColor: '#000', 
            padding: { x: 20, y: 10 } 
        }).setOrigin(0.5).setInteractive();
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        // Botão Upgrades
        const upgradesBtn = this.add.text(CONFIG.WIDTH / 2, 480, '🛒 UPGRADES', { 
            fontSize: '28px', 
            color: '#0af', 
            backgroundColor: '#000', 
            padding: { x: 15, y: 8 } 
        }).setOrigin(0.5).setInteractive();
        upgradesBtn.on('pointerdown', () => this.scene.start('UpgradeScene'));

        // Botão Opções (canto inferior direito)
        const optionsBtn = this.add.text(CONFIG.WIDTH - 20, CONFIG.HEIGHT - 20, '⚙️ Opções', { 
            fontSize: '24px', 
            color: '#ddd', 
            backgroundColor: '#000000aa', 
            padding: { x: 10, y: 5 } 
        }).setOrigin(1, 1).setInteractive();
        optionsBtn.on('pointerdown', () => this.showOptionsModal());
    }

    private showOptionsModal() {
        // Overlay escuro
        const overlay = this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.8).setOrigin(0).setInteractive();
        
        // Fundo do modal
        const modalBg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 500, 250, 0x223344, 0.95).setOrigin(0.5);
        modalBg.setStrokeStyle(2, 0x88aaff);
        
        // Texto de confirmação
        const text = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 60, 
            'Apagar todos os dados salvos?\n(Progresso e upgrades serão perdidos)', 
            { fontSize: '22px', color: '#fff', align: 'center' }
        ).setOrigin(0.5);
        
        // Botão SIM
        const confirmBtn = this.add.text(CONFIG.WIDTH / 2 - 100, CONFIG.HEIGHT / 2 + 40, 'SIM', { 
            fontSize: '28px', 
            color: '#ff6666', 
            backgroundColor: '#330000', 
            padding: { x: 20, y: 6 } 
        }).setOrigin(0.5).setInteractive();
        
        // Botão NÃO
        const cancelBtn = this.add.text(CONFIG.WIDTH / 2 + 100, CONFIG.HEIGHT / 2 + 40, 'NÃO', { 
            fontSize: '28px', 
            color: '#66ff66', 
            backgroundColor: '#003300', 
            padding: { x: 20, y: 6 } 
        }).setOrigin(0.5).setInteractive();

        // Função para fechar o modal
        const closeModal = () => {
            overlay.destroy();
            modalBg.destroy();
            text.destroy();
            confirmBtn.destroy();
            cancelBtn.destroy();
        };

        // Ação do SIM: limpar save e atualizar UI
        confirmBtn.on('pointerdown', () => {
            localStorage.removeItem('memoryChaseSave');
            // Recarrega os dados padrão
            this.saveData = loadSave();
            // Atualiza o texto da carteira
            this.totalPointsText.setText(`💰 ${this.saveData.totalPoints}`);
            // Mensagem de confirmação
            const msg = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 130, 'Save apagado!', { 
                fontSize: '24px', 
                color: '#ffaa44' 
            }).setOrigin(0.5);
            this.time.delayedCall(1500, () => msg.destroy());
            closeModal();
        });

        // Ação do NÃO: apenas fecha
        cancelBtn.on('pointerdown', () => {
            closeModal();
        });
    }
}