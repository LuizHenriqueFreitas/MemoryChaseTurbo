import { Scene } from 'phaser';

export class BootScene extends Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        // Efeitos sonoros
        this.load.audio('click', 'assets/sfx/blipSelect.mp3');
        this.load.audio('explosion', 'assets/sfx/explosion.mp3');
        this.load.audio('hit', 'assets/sfx/hitHurt.mp3');
        this.load.audio('shoot', 'assets/sfx/laserShoot.mp3');
        this.load.audio('coin', 'assets/sfx/pickupCoin.mp3');
        this.load.audio('powerup', 'assets/sfx/powerUp.mp3');
        this.load.audio('bgm', 'assets/musicas/gameplaySong.wav');

        // Imagens
        this.load.image('concept_art', 'assets/imagemConceitual.png');
        this.load.image('background', 'assets/imagemFundoGameplay.png');
        this.load.spritesheet('game_sprites', 'assets/spritesheet.png', {
            frameWidth: 32,
            frameHeight: 32,
            spacing: 0,
            margin: 0
        });

        this.createBulletTextures();
    }

    // Texturas geradas em runtime para os projéteis (não fazem parte do spritesheet)
    private createBulletTextures() {
        this.createPlaceholder('bullet', 0xffffff, 8, 8);
        this.createPlaceholder('enemyBullet', 0xff8800, 8, 8);
    }

    private createPlaceholder(key: string, color: number, w: number, h: number) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
            ctx.fillRect(2, 2, w - 4, h - 4);
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(1, 1, w - 2, h - 2);
        }

        this.textures.addCanvas(key, canvas);
    }

    create() {
        this.scene.start('MenuScene');
    }
}
