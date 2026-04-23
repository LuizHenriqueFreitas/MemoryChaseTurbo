import { Scene } from 'phaser';

export class MenuScene extends Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.add.text(400, 200, 'Memory Chase Turbo', { fontSize: '48px', color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 300, 'Setas ← → para mover | ESPAÇO para atirar', { fontSize: '24px', color: '#aaa' }).setOrigin(0.5);
        
        const playButton = this.add.text(400, 450, '▶ Começar', { fontSize: '32px', color: '#0f0', backgroundColor: '#000', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive();
        playButton.on('pointerdown', () => this.scene.start('GameScene'));
    }
}