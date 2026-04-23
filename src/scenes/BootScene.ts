import { Scene } from 'phaser';
import { CONFIG } from '../utils/constants';

export class BootScene extends Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        // Gera texturas simples (placeholders coloridos)
        this.createPlaceholder('player', 0x00ff00, 32, 32);
        this.createPlaceholder('enemy', 0xff3333, 32, 32);
        this.createPlaceholder('coin', 0xffcc00, 22, 22);
        this.createPlaceholder('bullet', 0xffffff, 8, 8);
        this.createPlaceholder('enemyBullet', 0xff8800, 8, 8);
        this.createPlaceholder('bg', 0x111122, CONFIG.WIDTH, CONFIG.HEIGHT);
    }

    private createPlaceholder(key: string, color: number, w: number, h: number) {
        const g = this.add.graphics();
        g.fillStyle(0x000000, 0);
        g.fillRect(0, 0, w, h);
        g.fillStyle(color, 1);
        g.fillRect(2, 2, w - 4, h - 4);
        g.generateTexture(key, w, h);
        g.destroy();
    }

    create() {
        this.scene.start('MenuScene');
    }
}