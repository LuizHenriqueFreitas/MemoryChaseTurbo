import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemies/Enemy';
import { WalkerEnemy } from '../entities/Enemies/WalkerEnemy';
import { ShooterEnemy } from '../entities/Enemies/ShooterEnemy';
import { ChaserEnemy } from '../entities/Enemies/ChaserEnemy';
import { Coin } from '../entities/Coin';
import { ShieldItem } from '../entities/ShieldItem';
import { loadSave, saveSave, getShieldSpawnChance, getShieldDuration,
    getTimeWarpDuration, getTimeWarpSpawnChance} from '../utils/SaveData';
import { TimeWarpItem } from '../entities/TimeWarpItem'; 
import { ExplosionEffect } from '../effects/ExplosionEffect';
import { CONFIG } from '../utils/constants';
import { AudioManager } from '../utils/AudioManager';

export class GameScene extends Scene {
    private player!: Player;
    private enemies!: Phaser.Physics.Arcade.Group;
    private coins!: Phaser.Physics.Arcade.Group;
    private shieldItems!: Phaser.Physics.Arcade.Group;
    private shieldTimeText!: Phaser.GameObjects.Text;
    private shieldBar!: Phaser.GameObjects.Rectangle;
    private shieldBarBg!: Phaser.GameObjects.Rectangle;
    private enemyBullets!: Phaser.Physics.Arcade.Group;
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private healthText!: Phaser.GameObjects.Text;
    private gameOver: boolean = false;
    private isPaused: boolean = false;
    private pauseMenu!: Phaser.GameObjects.Container;
    private escKey!: Phaser.Input.Keyboard.Key;
    private saveData: any;
    private timeWarpItems!: Phaser.Physics.Arcade.Group;
    private timeWarpText!: Phaser.GameObjects.Text;
    private timeWarpBar!: Phaser.GameObjects.Rectangle;
    private timeWarpBarBg!: Phaser.GameObjects.Rectangle;

    private gameTimer: number = 0;  // tempo em segundos
    private timerText!: Phaser.GameObjects.Text;
    private baseSpawnDelay: number = 1200;
    private currentSpawnDelay: number = 1200;
    private spawnTimer!: Phaser.Time.TimerEvent;
    private audioManager!: AudioManager;

    constructor() {
        super('GameScene');
    }

    init() {
        // Limpa o teclado ao (re)iniciar a cena
        if (this.input && this.input.keyboard) {
            this.input.keyboard.removeAllListeners();
            this.input.keyboard.resetKeys();
        }

        // Reseta variáveis de estado
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
    }
    
    create() {
        // ========== FUNDO ==========
        if (this.textures.exists('background')) {
            const bg = this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'background');
            bg.setDisplaySize(CONFIG.WIDTH, CONFIG.HEIGHT);
            bg.setAlpha(0.4);
            const darkOverlay = this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.3);
            darkOverlay.setOrigin(0);
        } else {
            const bg = this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x0a0a2a);
            bg.setOrigin(0);
        }

        // ========== INICIALIZAÇÕES ==========
        this.audioManager = new AudioManager(this);
        this.saveData = loadSave();
        
        const extraHealth = this.saveData.healthUpgradeLevel || 0;
        const totalHealth = 3 + extraHealth;
        const magnetLvl = this.saveData.magnetLevel || 0;
        const weaponLevel = this.saveData.weaponLevel || 0;

        // ========== PLAYER ==========
        this.player = new Player(this, 400, 500, totalHealth, magnetLvl, weaponLevel);
        this.player.setName('player');

        this.physics.world.setBounds(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.player.setCollideWorldBounds(true);

        // ========== GRUPOS ==========
        this.enemies = this.physics.add.group();
        this.coins = this.physics.add.group();
        this.shieldItems = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.timeWarpItems = this.physics.add.group();

        // ========== PAREDES LATERAIS (SÓLIDAS, INTRANSPONÍVEIS E INDESTRUTÍVEIS) ==========
        this.createSideWalls();

        // ========== OVERLAPS (COLETA DE ITENS) ==========
        this.physics.add.overlap(this.player, this.shieldItems, this.collectShield, undefined, this);
        this.physics.add.overlap(this.player, this.timeWarpItems, this.collectTimeWarp, undefined, this);
        this.physics.add.overlap(this.player, this.coins, (p, c) => this.collectCoin(p, c), undefined, this);

        // ========== UI DO ESCUDO ==========
        this.shieldTimeText = this.add.text(400, 30, '', { fontSize: '18px', color: '#44ccff' }).setOrigin(0.5).setVisible(false);
        this.shieldBarBg = this.add.rectangle(400, 55, 200, 12, 0x333333).setVisible(false);
        this.shieldBar = this.add.rectangle(400, 55, 200, 10, 0x44ccff).setVisible(false);
        
        // ========== UI DO TIMEWARP ==========
        this.timeWarpText = this.add.text(400, 85, '', { fontSize: '18px', color: '#ff44ff' }).setOrigin(0.5).setVisible(false);
        this.timeWarpBarBg = this.add.rectangle(400, 110, 200, 12, 0x333333).setVisible(false);
        this.timeWarpBar = this.add.rectangle(400, 110, 200, 10, 0xff44ff).setVisible(false);

        // ========== UI DE TEXTO ==========
        this.scoreText = this.add.text(16, 16, `Score: 0`, { fontSize: '28px', color: '#fff' });
        this.healthText = this.add.text(16, 50, `Vidas: ${this.player.health}`, { fontSize: '28px', color: '#fff' });

        // ========== TIMER DO JOGO ==========
        this.gameTimer = 0;
        this.timerText = this.add.text(780, 20, '00:00', {
            fontSize: '24px',
            color: '#fff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0);
        
        this.time.addEvent({
            delay: 1000,
            callback: () => this.updateGameTimer(),
            callbackScope: this,
            loop: true
        });
        
        // ========== DIFICULDADE ==========
        this.time.addEvent({
            delay: 60000,
            callback: () => this.increaseDifficulty(),
            callbackScope: this,
            loop: true
        });

        // ========== TIMERS DE SPAWN ==========
        this.currentSpawnDelay = this.baseSpawnDelay;
        this.spawnTimer = this.time.addEvent({
            delay: this.currentSpawnDelay,
            callback: () => this.spawnEnemy(),
            callbackScope: this,
            loop: true
        });
        this.time.addEvent({ delay: 800, callback: () => this.spawnCoin(), callbackScope: this, loop: true });

        // ========== COLISÕES ==========
        
        // Colisão entre inimigos
        this.physics.add.collider(this.enemies, this.enemies, (enemy1, enemy2) => this.enemyCollision(enemy1, enemy2), undefined, this);
        
        // Colisão entre balas do player e inimigos
        this.physics.add.collider(this.player.bullets, this.enemies, (b, e) => this.hitEnemy(b, e), undefined, this);
        
        // Colisão entre player e inimigos
        this.physics.add.collider(this.player, this.enemies, (p, e) => {
            const enemyObj = e as any;
            if (!enemyObj.markedForDeath) {
                this.playerHit(p, e);
            }
        }, undefined, this);
        
        // Colisão entre player e balas inimigas
        this.physics.add.collider(this.player, this.enemyBullets, (p, b) => this.playerHitByBullet(p, b), undefined, this);

        // ========== EVENTO DE BORDAS DO MUNDO ==========
        this.physics.world.on('worldbounds', (body: any) => {
            const obj = body.gameObject;
            if (obj && obj.active) {
                if (obj.texture?.key === 'bullet' || obj.texture?.key === 'enemyBullet') {
                    obj.destroy();
                }
                if (obj instanceof Enemy) {
                    obj.destroy();
                }
            }
        });

        // ========== TECLA ESC PARA PAUSA ==========
        if (this.input && this.input.keyboard) {
            this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        }
        
        // ========== MENU DE PAUSA ==========
        this.createPauseMenu();

        // ========== MÚSICA DE FUNDO ==========
        this.startBackgroundMusic();
    }

    private createSideWalls() {
        // Paredes laterais INVISÍVEIS, com a face interna exatamente no limite da janela
        // (x = 0 e x = CONFIG.WIDTH). Sólidas, intransponíveis e indestrutíveis.
        const thickness = 64; // espessa o bastante para nenhum corpo rápido atravessar

        const makeWall = (centerX: number) => {
            const wall = this.add.rectangle(centerX, CONFIG.HEIGHT / 2, thickness, CONFIG.HEIGHT);
            wall.setVisible(false);
            this.physics.add.existing(wall, true); // corpo estático (imóvel, indestrutível)
            return wall;
        };

        const walls = [
            makeWall(-thickness / 2),                // esquerda: face interna em x = 0
            makeWall(CONFIG.WIDTH + thickness / 2)   // direita: face interna em x = CONFIG.WIDTH
        ];

        // Player não atravessa as paredes.
        this.physics.add.collider(this.player, walls);

        // Inimigos batem nas paredes; o Chaser explode ao se chocar com elas.
        this.physics.add.collider(this.enemies, walls, (a, b) => {
            const chaser = a instanceof ChaserEnemy ? a : (b instanceof ChaserEnemy ? b : null);
            if (chaser && chaser.active) {
                chaser.destroyOnCollision();
            }
        }, undefined, this);

        // Balas (do player e dos inimigos) colidem com as paredes: a BALA é destruída,
        // nunca a parede. A ordem dos argumentos do callback não é garantida pelo Phaser
        // quando o segundo alvo é um array, então identificamos a bala como "o que não é parede".
        const onBulletHitsWall = (a: any, b: any) => {
            const bullet = walls.includes(a) ? b : a;
            if (!bullet || !bullet.active) return;
            this.explodeBulletIfNeeded(bullet);
            bullet.destroy();
        };
        this.physics.add.collider(this.player.bullets, walls, onBulletHitsWall, undefined, this);
        this.physics.add.collider(this.enemyBullets, walls, onBulletHitsWall, undefined, this);
    }

    // Detona a explosão da bala (arma padrão) no ponto de impacto, se ela for explosiva.
    private explodeBulletIfNeeded(bullet: any) {
        if (!bullet.getData || !bullet.getData('explosive')) return;
        const radius = bullet.getData('explosionRadius') || 35;
        ExplosionEffect.create(this, bullet.x, bullet.y, radius, 0xffaa44);
        ExplosionEffect.createShockwave(this, bullet.x, bullet.y, radius * 1.5, 250);
        this.audioManager.playSfx('explosion', 0.5);
    }

    private createPauseMenu() {
        this.pauseMenu = this.add.container(400, 300);
        this.pauseMenu.setVisible(false);
        const bg = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7).setOrigin(0.5);
        const title = this.add.text(0, -100, 'PAUSADO', { fontSize: '48px', color: '#fff' }).setOrigin(0.5);
        const continueBtn = this.add.text(0, 0, 'Continuar', { fontSize: '32px', color: '#0f0', backgroundColor: '#000', padding: { x: 15, y: 8 } }).setOrigin(0.5).setInteractive();
        const menuBtn = this.add.text(0, 80, 'Menu Principal', { fontSize: '32px', color: '#ff0', backgroundColor: '#000', padding: { x: 15, y: 8 } }).setOrigin(0.5).setInteractive();
        continueBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.togglePause();
        });
        menuBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
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
            this.pauseBackgroundMusic();  // Pausa música
        } else {
            this.physics.resume();
            this.pauseMenu.setVisible(false);
            this.resumeBackgroundMusic(); // Retoma música
        }
    }

    update() {
        if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.togglePause();
        }
        if (this.gameOver || this.isPaused) return;

        // Verifica se player existe e está ativo
        if (this.player && this.player.active && this.player.body) {
            this.player.update();
        } else {
            // Se player não existe ou está inativo, game over
            if (!this.gameOver) {
                this.endGame();
            }
            return;
        }

        // Atualiza barra de escudo
        if (this.player.hasShield) {
            const remaining = Math.max(0, this.player.shieldEndTime - this.time.now);
            const seconds = (remaining / 1000).toFixed(1);
            this.shieldTimeText.setText(`🛡️ ${seconds}s`);
            this.shieldTimeText.setVisible(true);
            this.shieldBarBg.setVisible(true);
            
            // Calcula duração máxima baseada no nível
            const shieldLevel = this.saveData.shieldLevel || 0;
            const maxDuration = getShieldDuration(shieldLevel) * 1000;
            const percent = remaining / maxDuration;
            this.shieldBar.width = 200 * percent;
            this.shieldBar.setVisible(true);
        } else {
            this.shieldTimeText.setVisible(false);
            this.shieldBarBg.setVisible(false);
            this.shieldBar.setVisible(false);
        }

        // Atualiza movimento dos itens escudo
        this.shieldItems.getChildren().forEach((item: any) => {
            if (item && item.update) item.update();
        });

        // Chama o comportamento específico de cada inimigo
        this.enemies.getChildren().forEach((enemy: any) => {
            if (enemy.updateBehavior) {
                enemy.updateBehavior(this.player);
            }
        });
        
        // Magnetismo: puxa moedas
        this.coins.getChildren().forEach((coin: any) => {
            if (!coin.active) return;
            const dx = this.player.x - coin.x;
            const dy = this.player.y - coin.y;
            const dist = Math.hypot(dx, dy);
            if (dist < this.player.magnetRadius && dist > 5) {
                const angle = Math.atan2(dy, dx);
                const pullForce = 350;
                coin.setVelocity(Math.cos(angle) * pullForce, Math.sin(angle) * pullForce);
            }
        });

        // Atualiza barra do TimeWarp
        if (this.player.isTimeWarpActive) {
            const remaining = Math.max(0, this.player.timeWarpEndTime - this.time.now);
            const seconds = (remaining / 1000).toFixed(1);
            this.timeWarpText.setText(`⏰ x5 ${seconds}s`);
            this.timeWarpText.setVisible(true);
            this.timeWarpBarBg.setVisible(true);
            
            const level = this.saveData.timeWarpLevel || 0;
            const maxDuration = getTimeWarpDuration(level) * 1000;
            const percent = remaining / maxDuration;
            this.timeWarpBar.width = 200 * percent;
            this.timeWarpBar.setVisible(true);
        } else {
            this.timeWarpText.setVisible(false);
            this.timeWarpBarBg.setVisible(false);
            this.timeWarpBar.setVisible(false);
        }

        // Atualiza movimento dos itens timewarp
        this.timeWarpItems.getChildren().forEach((item: any) => {
            if (item && item.update) item.update();
        });

        // Atualiza balas com homing (perseguição)
        this.player.bullets.getChildren().forEach((bullet: any) => {
            if (bullet.getData('homing')) {
                // Encontra o inimigo mais próximo
                let closestEnemy: any = null;
                let closestDist = 200; // Raio de detecção da bala
                
                this.enemies.getChildren().forEach((enemy: any) => {
                    if (!enemy.active) return;
                    const dx = enemy.x - bullet.x;
                    const dy = enemy.y - bullet.y;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestEnemy = enemy;
                    }
                });
                
                if (closestEnemy) {
                    // Calcula direção para o inimigo
                    const dx = closestEnemy.x - bullet.x;
                    const dy = closestEnemy.y - bullet.y;
                    const angle = Math.atan2(dy, dx);
                    
                    // Ajusta a velocidade gradualmente (não instantâneo)
                    const currentVel = bullet.body.velocity;
                    const targetVx = Math.cos(angle) * 400;
                    const targetVy = Math.sin(angle) * 400;
                    
                    // Suaviza a curva
                    bullet.body.velocity.x += (targetVx - currentVel.x) * 0.05;
                    bullet.body.velocity.y += (targetVy - currentVel.y) * 0.05;
                    
                    // Rotaciona a bala
                    bullet.rotation = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
                }
            }
        });

        // Limpeza de objetos fora da tela
        this.enemies.getChildren().forEach((obj: any) => { if (obj.y > 650 || obj.y < -100) obj.destroy(); });
        this.coins.getChildren().forEach((obj: any) => { if (obj.y > 650) obj.destroy(); });
        this.enemyBullets.getChildren().forEach((obj: any) => { if (obj.y > 650 || obj.y < -50) obj.destroy(); });
        this.player.bullets.getChildren().forEach((b: any) => { 
            if (b.y < -50 || b.y > 650 || b.x < -50 || b.x > 850) b.destroy(); 
        })
        this.shieldItems.getChildren().forEach((obj: any) => { if (obj && obj.y > 650) obj.destroy(); });
        this.timeWarpItems.getChildren().forEach((obj: any) => { if (obj && obj.y > 650) obj.destroy(); });
    }

    private spawnEnemy() {
        if (this.gameOver) return;

        const x = Phaser.Math.Between(40, 760);
        const enemyType = Math.floor(Math.random() * 3);

        let enemy: Enemy;
        switch (enemyType) {
            case 0: enemy = new WalkerEnemy(this, x, -30); break;
            case 1: enemy = new ShooterEnemy(this, x, -30); break;
            default: enemy = new ChaserEnemy(this, x, -30); break;
        }
        this.enemies.add(enemy);

        this.trySpawnTimeWarpItem();
        this.trySpawnShieldItem();
    }
    
    private spawnCoin() {
        if (this.gameOver) return;
        const x = Phaser.Math.Between(40, 760);
        const coin = new Coin(this, x, -30);
        this.coins.add(coin);
    }

    private trySpawnShieldItem() {
        const shieldLevel = this.saveData.shieldLevel || 0;
        const chance = getShieldSpawnChance(shieldLevel);
        
        if (chance === 0) return;
        
        // Gera número de 0 a 100
        const roll = Math.random() * 100;
        
        if (roll < chance) {
            const x = Phaser.Math.Between(60, 740);
            const shieldItem = new ShieldItem(this, x, -30);
            this.shieldItems.add(shieldItem);

            // Efeito visual de spawn
            const spawnEffect = this.add.circle(x, -30, 15, 0x44ccff, 0.6);
            this.tweens.add({
                targets: spawnEffect,
                alpha: 0,
                scaleX: 2,
                scaleY: 2,
                duration: 300,
                onComplete: () => spawnEffect.destroy()
            });
        }
    }

    private trySpawnTimeWarpItem() {
        const level = this.saveData.timeWarpLevel || 0;
        const chance = getTimeWarpSpawnChance(level);
        
        if (chance === 0) return;
        
        if (Math.random() * 100 < chance) {
            const x = Phaser.Math.Between(60, 740);
            const item = new TimeWarpItem(this, x, -30);
            this.timeWarpItems.add(item);
        }
    }

    private collectShield(_player: any, item: any) {
        item.destroy();
        
        const shieldLevel = this.saveData.shieldLevel || 0;
        const duration = getShieldDuration(shieldLevel);
        
        this.player.activateShield(duration);
        this.showFloatingScore(item.x, item.y, 0, '#44ccff');

        // Feedback visual da coleta
        const collectEffect = this.add.circle(item.x, item.y, 20, 0x44ccff, 0.6);
        this.tweens.add({
            targets: collectEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => collectEffect.destroy()
        });
        this.audioManager.playSfx('powerup', 0.8);
    }

    private collectTimeWarp(_player: any, item: any) {
        item.destroy();
        const level = this.saveData.timeWarpLevel || 0;
        const duration = getTimeWarpDuration(level);
        this.player.activateTimeWarp(duration);
        this.showFloatingScore(item.x, item.y, 0, '#ff44ff');
        this.audioManager.playSfx('powerup', 0.8);
    }

    private hitEnemy(bullet: any, enemy: any) {
        if (!bullet.active || !enemy.active) return;
        
        const multiplier = this.player.getScoreMultiplier();
        const baseScore = 20;
        const finalScore = baseScore * multiplier;
        
        // Salva posição para efeitos
        const hitX = enemy.x;
        const hitY = enemy.y;
        
        // Verifica se a bala é explosiva (lê antes de destruir)
        const isExplosive = bullet.getData('explosive');
        const explosionRadius = bullet.getData('explosionRadius') || 35;

        // Remove a bala
        bullet.destroy();
        
        // Aplica dano ao inimigo
        if (enemy instanceof ChaserEnemy) {
            // Chaser sempre explode
            ExplosionEffect.create(this, hitX, hitY, 50, 0xff4400);
            ExplosionEffect.createShockwave(this, hitX, hitY, 80, 350);
            enemy.destroyOnCollision();
            this.audioManager.playSfx('explosion', 0.8);
            this.score += finalScore;
            this.scoreText.setText(`Score: ${this.score}`);
            this.showFloatingScore(hitX, hitY, finalScore, multiplier > 1 ? '#ff44ff' : '#ff8844');
            return;
        }
        
        // Bala explosiva causa explosão
        if (isExplosive) {
            ExplosionEffect.create(this, hitX, hitY, explosionRadius, 0xffaa44);
            ExplosionEffect.createShockwave(this, hitX, hitY, explosionRadius * 1.5, 250);
        } else {
            // Pequeno efeito de impacto
            const spark = this.add.circle(hitX, hitY, 8, 0xffaa44, 0.8);
            this.tweens.add({
                targets: spark,
                alpha: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 150,
                onComplete: () => spark.destroy()
            });
        }
        
        // Inimigos normais morrem
        enemy.destroy();
        this.score += finalScore;
        this.scoreText.setText(`Score: ${this.score}`);
        this.showFloatingScore(hitX, hitY, finalScore, multiplier > 1 ? '#ff44ff' : '#ff8844');

        this.audioManager.playSfx('explosion', 0.6);
    }

    private enemyCollision(enemy1: any, enemy2: any) {
        if (!enemy1.active || !enemy2.active) return;
        
        const impactX = (enemy1.x + enemy2.x) / 2;
        const impactY = (enemy1.y + enemy2.y) / 2;
        
        // Chaser explode ao colidir
        if (enemy1 instanceof ChaserEnemy) {
            ExplosionEffect.create(this, enemy1.x, enemy1.y, 50, 0xff4400);
            ExplosionEffect.createShockwave(this, enemy1.x, enemy1.y, 80, 350);
            enemy1.destroyOnCollision();
            this.audioManager.playSfx('explosion', 0.7);
            return;
        }

        if (enemy2 instanceof ChaserEnemy) {
            ExplosionEffect.create(this, enemy2.x, enemy2.y, 50, 0xff4400);
            ExplosionEffect.createShockwave(this, enemy2.x, enemy2.y, 80, 350);
            enemy2.destroyOnCollision();
            this.audioManager.playSfx('explosion', 0.7);
            return;
        }

        // Para inimigos normais, pequena explosão e ricochete
        ExplosionEffect.create(this, impactX, impactY, 20, 0xffaa66);
        this.audioManager.playSfx('explosion', 0.4);
        
        const dx = enemy1.x - enemy2.x;
        const dy = enemy1.y - enemy2.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            const angle = Math.atan2(dy, dx);
            const pushForce = 150;
            
            enemy1.setVelocity(
                enemy1.body.velocity.x + Math.cos(angle) * pushForce,
                enemy1.body.velocity.y + Math.sin(angle) * pushForce
            );
            enemy2.setVelocity(
                enemy2.body.velocity.x - Math.cos(angle) * pushForce,
                enemy2.body.velocity.y - Math.sin(angle) * pushForce
            );
        }
    }

    private collectCoin(_player: any, coin: any) {
        coin.destroy();
        const multiplier = this.player.getScoreMultiplier();
        const finalScore = 10 * multiplier;
        this.score += finalScore;
        this.scoreText.setText(`Score: ${this.score}`);
        this.showFloatingScore(coin.x, coin.y, finalScore, multiplier > 1 ? '#ff44ff' : '#ffcc44');
        this.audioManager.playSfx('coin', 0.5);
    }

    private showFloatingScore(x: number, y: number, value: number, color: string = '#ffd966') {
        const text = this.add.text(x, y, `+${value}`, {
            fontSize: '24px',
            color: color,
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    private playerHit(player: any, enemy: any) {
        // CHASER: explode ao colidir com o player
        if (enemy instanceof ChaserEnemy) {
            if (this.player.isInvincible || !this.player.active) return;

            // Com escudo ativo: o chaser explode contra o escudo, mas o player não sofre dano.
            if (this.player.hasShield) {
                enemy.destroyOnCollision();
                this.audioManager.playSfx('explosion', 0.8);
                return;
            }

            // Dano + arremesso do player na direção contrária ao chaser
            this.player.takeDamage();
            this.healthText.setText(`Vidas: ${this.player.health}`);

            if (this.player.active && this.player.body) {
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                const pushForce = 400;
                this.player.setVelocity(Math.cos(angle) * pushForce, Math.sin(angle) * pushForce);

                this.player.setTint(0xff8888);
                this.time.delayedCall(300, () => {
                    if (this.player && this.player.active) this.player.clearTint();
                });
            }

            // Explode o chaser
            enemy.destroyOnCollision();
            this.audioManager.playSfx('explosion', 0.8);

            if (this.player.health <= 0) {
                this.endGame();
            }
            return;
        }

        // --- PARA INIMIGOS NORMAIS (Walker e Shooter) ---

        if (this.player.isInvincible) return;
        if (enemy.markedForDeath) return;
        if (!this.player || !this.player.active || !this.player.body) return;
        
        // Aplica dano ao jogador
        this.player.takeDamage();
        this.healthText.setText(`Vidas: ${this.player.health}`);
        
        // Verifica se o player ainda está vivo antes de arremessar
        if (this.player.active && this.player.body) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const angle = Math.atan2(dy, dx);
            const impactForce = Math.min(500, 150 + Math.hypot(player.body.velocity.x, player.body.velocity.y));
            
            // Arremessa o jogador na direção oposta
            const pushAngle = angle + Math.PI;
            this.player.setVelocity(
                Math.cos(pushAngle) * impactForce,
                Math.sin(pushAngle) * impactForce
            );
            
            // Arremessa o inimigo
            if (enemy.active && enemy.body) {
                enemy.setVelocity(
                    Math.cos(angle) * impactForce * 0.8,
                    Math.sin(angle) * impactForce * 0.8
                );
            }
        }
        
        // Marca o inimigo para morrer (mantém a aparência normal, sem escurecer/transparecer)
        enemy.markedForDeath = true;

        // Agenda destruição após 4 segundos
        this.time.delayedCall(4000, () => {
            if (enemy && enemy.active) {
                enemy.destroy();
            }
        });
        
        // Efeito visual no player
        if (this.player.active) {
            this.player.setTint(0xff8888);
            this.time.delayedCall(300, () => {
                if (this.player && this.player.active) this.player.clearTint();
            });
        }
        
        if (this.player.health <= 0) {
            this.endGame();
        }
    }

    private playerHitByBullet(_player: any, bullet: any) {
        if (this.player.isInvincible) return;

        // Verifica se o player tem escudo ativo
        if (this.player.hasShield) {
            this.player.reflectBullet(bullet);
            return;
        }

        bullet.destroy();
        this.player.takeDamage();
        this.healthText.setText(`Vidas: ${this.player.health}`);
        
        // Toca som de dano
        this.audioManager.playSfx('hit', 0.7);
        
        if (this.player.health <= 0) {
            this.endGame();
        }
    }

    private updateGameTimer() {
        if (this.gameOver || this.isPaused) return;
        this.gameTimer++;
        
        const minutes = Math.floor(this.gameTimer / 60);
        const seconds = this.gameTimer % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.timerText.setText(timeString);
    }

    private increaseDifficulty() {
        if (this.gameOver) return;
        
        // Aumenta a quantidade de inimigos em 5%
        const reduction = this.currentSpawnDelay * 0.05;  // reduz 5% do delay
        this.currentSpawnDelay = Math.max(400, this.currentSpawnDelay - reduction);
        
        // Reinicia o timer de spawn com o novo delay
        if (this.spawnTimer) {
            this.spawnTimer.remove();
        }
        
        this.spawnTimer = this.time.addEvent({
            delay: this.currentSpawnDelay,
            callback: () => this.spawnEnemy(),
            callbackScope: this,
            loop: true
        });

        // Feedback visual do aumento de dificuldade
        this.showDifficultyPopup();
    }

    private showDifficultyPopup() {
        const popup = this.add.text(400, 300, '⚡ DIFICULDADE AUMENTADA! ⚡', {
            fontSize: '28px',
            color: '#ff4444',
            fontStyle: 'bold',
            backgroundColor: '#000000aa',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: popup,
            alpha: 0,
            y: 250,
            duration: 1500,
            onComplete: () => popup.destroy()
        });
    }

    private startBackgroundMusic() {
        if (!this.sound) return;
        this.audioManager.playMusic('bgm', 0.5, true);
    }

    private stopBackgroundMusic() {
        this.audioManager.stopMusic();
    }

    private pauseBackgroundMusic() {
        this.audioManager.pauseMusic();
    }

    private resumeBackgroundMusic() {
        this.audioManager.resumeMusic();
    }

    shutdown() {
        this.stopBackgroundMusic();
        // Limpeza ao destruir a cena
        if (this.input && this.input.keyboard) {
            this.input.keyboard.removeAllListeners();
        }
        
        if (this.time) {
            this.time.removeAllEvents();
        }
    }

    private endGame() {
        if (this.gameOver) return;
        
        this.gameOver = true;

        this.stopBackgroundMusic();

        // Explosão final
        if (this.player && this.player.active) {
            ExplosionEffect.create(this, this.player.x, this.player.y, 70, 0xff0000);
            ExplosionEffect.createShockwave(this, this.player.x, this.player.y, 120, 600);
        }
        
        // Pausa a física
        if (this.physics && this.physics.world) {
            this.physics.pause();
        }
        
        // Remove todos os timers
        this.time.removeAllEvents();
        
        // Remove o player
        if (this.player && this.player.active) {
            this.player.destroy();
        }
        
        // Adiciona pontuação à carteira global
        if (this.saveData && this.score) {
            this.saveData.totalPoints += this.score;
            saveSave(this.saveData);
        }

        // Tela de game over
        this.add.text(400, 220, 'GAME OVER', { fontSize: '56px', color: '#f00', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 290, `Pontos: ${this.score}`, { fontSize: '28px', color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 340, `Total: ${this.saveData.totalPoints}`, { fontSize: '28px', color: '#ffd966' }).setOrigin(0.5);
        
        // Botão Recomeçar - USA restart() do Phaser
        const restartBtn = this.add.text(400, 420, '▶ JOGAR NOVAMENTE', { 
            fontSize: '28px', 
            color: '#0f0', 
            backgroundColor: '#000', 
            padding: { x: 15, y: 8 } 
        }).setOrigin(0.5).setInteractive();
        
        // Botão Menu Principal
        const menuBtn = this.add.text(400, 490, 'MENU PRINCIPAL', { 
            fontSize: '28px', 
            color: '#ff0', 
            backgroundColor: '#000', 
            padding: { x: 15, y: 8 } 
        }).setOrigin(0.5).setInteractive();
        
        // 🔴 CORREÇÃO: Usar restart() em vez de scene.restart()
        restartBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.scene.restart();
        });
                
        menuBtn.on('pointerdown', () => {
            this.audioManager.playSfx('click');
            this.scene.start('MenuScene');
        });
    }
}