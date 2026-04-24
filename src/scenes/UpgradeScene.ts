import { Scene } from 'phaser';
import { CONFIG } from '../utils/constants';
import { loadSave, saveSave, getHealthUpgradeCost, getMagnetUpgradeCost } from '../utils/SaveData';

export class UpgradeScene extends Scene {
    private saveData: any;
    private totalPointsText!: Phaser.GameObjects.Text;

    constructor() {
        super('UpgradeScene');
    }

    create() {
        this.saveData = loadSave();

        // Fundo
        this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x0a0a2a).setOrigin(0);
        // Estrelas
        for (let i = 0; i < 100; i++) {
            this.add.circle(Phaser.Math.Between(0, CONFIG.WIDTH), Phaser.Math.Between(0, CONFIG.HEIGHT), 1, 0xffffff, 0.5);
        }

        this.totalPointsText = this.add.text(CONFIG.WIDTH - 20, 20, `💰 ${this.saveData.totalPoints}`, { fontSize: '28px', color: '#ffd966', backgroundColor: '#000000aa', padding: { x: 10, y: 5 } }).setOrigin(1, 0);
        this.add.text(CONFIG.WIDTH / 2, 50, 'LOJA DE UPGRADES', { fontSize: '42px', color: '#ffcc00' }).setOrigin(0.5);

        // Card Vida
        this.createUpgradeCard(
            180, '❤️ Vidas Extras', `Nível ${this.saveData.healthUpgradeLevel}/5`,
            getHealthUpgradeCost(this.saveData.healthUpgradeLevel),
            () => this.buyHealthUpgrade()
        );

        // Card Magnetismo
        this.createUpgradeCard(
            330, '🧲 Campo Magnético', `Nível ${this.saveData.magnetLevel}\nAtrai moedas (+2% de raio por nível)`,
            getMagnetUpgradeCost(this.saveData.magnetLevel),
            () => this.buyMagnetUpgrade()
        );

        // Botão voltar
        const backBtn = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 40, '← Voltar', { fontSize: '28px', color: '#fff', backgroundColor: '#333', padding: { x: 20, y: 8 } }).setOrigin(0.5).setInteractive();
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    private createUpgradeCard(y: number, title: string, desc: string, price: number, onBuy: () => void) {
        const cardX = CONFIG.WIDTH / 2;
        const cardWidth = 420;
        const cardHeight = 130;
        const bg = this.add.rectangle(cardX, y, cardWidth, cardHeight, 0x222244, 0.9).setOrigin(0.5);
        bg.setStrokeStyle(2, 0x88aaff);

        this.add.text(cardX - 190, y - 45, title, { fontSize: '26px', color: '#fff' });
        this.add.text(cardX - 190, y - 15, desc, { fontSize: '18px', color: '#ccc' });

        const priceText = price === -1 ? 'MAX' : `${price}💰`;
        const priceLabel = this.add.text(cardX + 190, y + 25, priceText, { fontSize: '24px', color: '#ffaa44' }).setOrigin(1, 0.5);

        const buyBtn = this.add.text(cardX + 190, y - 20, 'COMPRAR', { fontSize: '20px', color: '#0f0', backgroundColor: '#000', padding: { x: 12, y: 4 } }).setOrigin(1, 0.5).setInteractive();
        if (price === -1 || this.saveData.totalPoints < price) {
            buyBtn.setTint(0x888888);
            buyBtn.disableInteractive();
        } else {
            buyBtn.on('pointerdown', onBuy);
        }

        // Guardar referências se precisar
    }

    private buyHealthUpgrade() {
        const level = this.saveData.healthUpgradeLevel;
        if (level >= 5) return;
        const cost = getHealthUpgradeCost(level);
        if (this.saveData.totalPoints >= cost) {
            this.saveData.totalPoints -= cost;
            this.saveData.healthUpgradeLevel++;
            saveSave(this.saveData);
            this.scene.restart();
        } else {
            this.showMessage('Pontos insuficientes!');
        }
    }

    private buyMagnetUpgrade() {
        const level = this.saveData.magnetLevel;
        const cost = getMagnetUpgradeCost(level);
        if (this.saveData.totalPoints >= cost) {
            this.saveData.totalPoints -= cost;
            this.saveData.magnetLevel++;
            saveSave(this.saveData);
            this.scene.restart();
        } else {
            this.showMessage('Pontos insuficientes!');
        }
    }

    private showMessage(msg: string) {
        const m = this.add.text(CONFIG.WIDTH / 2, 550, msg, { fontSize: '26px', color: '#ff7777', backgroundColor: '#000', padding: { x: 10, y: 5 } }).setOrigin(0.5);
        this.time.delayedCall(1500, () => m.destroy());
    }
}