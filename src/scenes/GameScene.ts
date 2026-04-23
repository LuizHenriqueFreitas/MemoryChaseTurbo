import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Coin } from '../entities/Coin';

export class GameScene extends Scene {
    private player!: Player;
    private enemies!: Phaser.Physics.Arcade.Group;
    private coins!: Phaser.Physics.Arcade.Group;
    private enemyBullets!: Phaser.Physics.Arcade.Group;
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private healthText!: Phaser.GameObjects.Text;
    private gameOver: boolean = false;
    private isPaused: boolean = false;
    private pauseMenu!: Phaser.GameObjects.Container;
    private escKey!: Phaser.Input.Keyboard.Key;

    constructor() {
        super('GameScene');
    }

    preload() {
        console.log('🔧 GameScene preload iniciado');
        // Criar texturas com fallback
        this.createPlaceholder('player', 0x00ff00, 32, 32);
        this.createPlaceholder('enemy', 0xff3333, 32, 32);
        this.createPlaceholder('coin', 0xffcc00, 22, 22);
        this.createPlaceholder('bullet', 0xffffff, 8, 8);
        this.createPlaceholder('enemyBullet', 0xff8800, 8, 8);

        // Verificar se foram criadas
        console.log('✓ player texture:', this.textures.exists('player'));
        console.log('✓ enemy texture:', this.textures.exists('enemy'));
        console.log('✓ coin texture:', this.textures.exists('coin'));
    }

    private createPlaceholder(key: string, color: number, w: number, h: number) {
        if (this.textures.exists(key)) return;
        const g = this.add.graphics();
        g.fillStyle(0x000000, 0);
        g.fillRect(0, 0, w, h);
        g.fillStyle(color, 1);
        g.fillRect(2, 2, w - 4, h - 4);
        g.generateTexture(key, w, h);
        g.destroy();
        console.log(`🖌️ Textura ${key} criada`);
    }

    create() {
        console.log('🚀 GameScene create iniciado');
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;

        // Jogador
        this.player = new Player(this, 400, 500);
        this.player.setName('player');
        console.log('✅ Player criado');

        // Grupos de física
        this.enemies = this.physics.add.group();
        this.coins = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        (this as any).enemyBullets = this.enemyBullets;
        console.log('✅ Grupos de física criados');

        // UI
        this.scoreText = this.add.text(16, 16, `Score: 0`, { fontSize: '28px', color: '#fff' });
        this.healthText = this.add.text(16, 50, `Vidas: 3`, { fontSize: '28px', color: '#fff' });

        // Colisões
        this.physics.add.collider(this.player.bullets, this.enemies, (b, e) => this.hitEnemy(b, e), undefined, this);
        this.physics.add.overlap(this.player, this.coins, (p, c) => this.collectCoin(p, c), undefined, this);
        this.physics.add.collider(this.player, this.enemies, (p, e) => this.playerHit(p, e), undefined, this);
        this.physics.add.collider(this.player, this.enemyBullets, (p, b) => this.playerHitByBullet(p, b), undefined, this);

        // Spawners com arrow functions
        this.time.addEvent({ delay: 1200, callback: () => this.spawnEnemy(), loop: true });
        this.time.addEvent({ delay: 800, callback: () => this.spawnCoin(), loop: true });
        console.log('⏲️ Timers de spawn configurados');

        // Spawn de teste imediato (para garantir)
        this.time.delayedCall(100, () => {
            console.log('🧪 Spawn de teste');
            this.spawnEnemy();
            this.spawnCoin();
        });

        //verificação de fisica rodando
        console.log('Física pausada?', this.physics.world.isPaused);
        if (this.physics.world.isPaused) {
            this.physics.resume();
        }

        // Tecla ESC para pausa
        if (this.input.keyboard) {
            this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        }
        this.createPauseMenu();
    }

    private createPauseMenu() {
        this.pauseMenu = this.add.container(400, 300);
        this.pauseMenu.setVisible(false);
        const bg = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7).setOrigin(0.5);
        const title = this.add.text(0, -100, 'PAUSADO', { fontSize: '48px', color: '#fff' }).setOrigin(0.5);
        const continueBtn = this.add.text(0, 0, 'Continuar', { fontSize: '32px', color: '#0f0', backgroundColor: '#000', padding: { x: 15, y: 8 } }).setOrigin(0.5).setInteractive();
        const menuBtn = this.add.text(0, 80, 'Menu Principal', { fontSize: '32px', color: '#ff0', backgroundColor: '#000', padding: { x: 15, y: 8 } }).setOrigin(0.5).setInteractive();
        continueBtn.on('pointerdown', () => this.togglePause());
        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
            this.physics.resume();
        });
        this.pauseMenu.add([bg, title, continueBtn, menuBtn]);
    }

    private togglePause() {
        if (this.gameOver) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.pause();
            this.pauseMenu.setVisible(true);
        } else {
            this.physics.resume();
            this.pauseMenu.setVisible(false);
        }
    }

    update() {
        if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.togglePause();
        }
        if (this.gameOver || this.isPaused) return;
        this.player.update();

        // Limpeza de objetos fora da tela
        this.enemies.getChildren().forEach(obj => { if ((obj as any).y > 650) obj.destroy(); });
        this.coins.getChildren().forEach(obj => { if ((obj as any).y > 650) obj.destroy(); });
        this.enemyBullets.getChildren().forEach(obj => { if ((obj as any).y > 650 || (obj as any).y < -50) obj.destroy(); });
        this.player.bullets.getChildren().forEach(b => { if ((b as any).y < -50) b.destroy(); });
    }

    private spawnEnemy() {
        if (this.gameOver) return;
        const x = Phaser.Math.Between(40, 760);
        //console.log(`👾 Spawn inimigo em x=${x}`);
        const enemy = new Enemy(this, x, -30);
        this.enemies.add(enemy);
    }

    private spawnCoin() {
        if (this.gameOver) return;
        const x = Phaser.Math.Between(40, 760);
        //console.log(`🪙 Spawn moeda em x=${x}`);
        const coin = new Coin(this, x, -30);
        this.coins.add(coin);
    }

    private hitEnemy(bullet: any, enemy: any) {
        bullet.destroy();
        enemy.destroy();
        this.score += 20;
        this.scoreText.setText(`Score: ${this.score}`);
        //console.log(`💥 Inimigo destruído! Score: ${this.score}`);
    }

    private collectCoin(player: any, coin: any) {
        coin.destroy();
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
        //console.log(`🪙 Moeda coletada! Score: ${this.score}`);
    }

    private playerHit(player: any, enemy: any) {
        if (this.player.isInvincible) return;
        enemy.destroy();
        this.player.takeDamage();
        this.healthText.setText(`Vidas: ${this.player.health}`);
        if (this.player.health <= 0) this.endGame();
    }

    private playerHitByBullet(player: any, bullet: any) {
        if (this.player.isInvincible) return;
        bullet.destroy();
        this.player.takeDamage();
        this.healthText.setText(`Vidas: ${this.player.health}`);
        if (this.player.health <= 0) this.endGame();
    }

    private endGame() {
        this.gameOver = true;
        this.physics.pause();
        this.add.text(400, 280, 'GAME OVER', { fontSize: '56px', color: '#f00' }).setOrigin(0.5);
        const restartText = this.add.text(400, 380, 'Clique para reiniciar', { fontSize: '28px', color: '#fff' }).setOrigin(0.5).setInteractive();
        restartText.on('pointerdown', () => this.scene.restart());
    }
}