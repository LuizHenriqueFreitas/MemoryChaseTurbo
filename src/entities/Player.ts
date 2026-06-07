import { Scene } from 'phaser';
import { WeaponSystem } from '../utils/WeaponSystem';
import { AudioManager } from '../utils/AudioManager';

export class Player extends Phaser.Physics.Arcade.Sprite {
    public bullets: Phaser.Physics.Arcade.Group;
    public health: number;
    public maxHealth: number;
    public isInvincible: boolean;
    public magnetRadius: number;
    public magnetLevel: number;
    public hasShield: boolean = false;
    public shieldEndTime: number = 0;
    public isTimeWarpActive: boolean = false;
    public timeWarpEndTime: number = 0;

    private audioManager!: AudioManager;
    private currentWeaponLevel: number = 0;
    private weaponCooldown: number = 0;
    private shieldCircle: Phaser.GameObjects.Arc | null = null;
    private timeWarpEffect: Phaser.GameObjects.Graphics | null = null;
    private lastShot: number;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private baseMagnetRadius: number = 70;

    private lastMoveDirection: number = 1;
    private isMoving: boolean = false;
    private isMovingBack: boolean = false;

    // Sprites para diferentes estados
    private isDamaged: boolean = false;
    private damageFrameActive: boolean = false;

    constructor(scene: Scene, x: number, y: number, maxHealth: number = 3, magnetLevel: number = 0, weaponLevel: number = 0) {
        super(scene, x, y, 'game_sprites', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Inicializa o AudioManager
        this.audioManager = new AudioManager(scene);
        
        this.setCollideWorldBounds(true);
        this.setScale(2);
        this.body!.setSize(28, 28);

        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.isInvincible = false;
        this.magnetLevel = magnetLevel;
        this.magnetRadius = this.baseMagnetRadius * (1 + 0.02 * magnetLevel);
        this.currentWeaponLevel = weaponLevel;
        this.lastShot = 0;

        this.bullets = scene.physics.add.group();
        
        if (scene.input && scene.input.keyboard) {
            const keyboard = scene.input.keyboard;
            this.cursors = keyboard.createCursorKeys();
            this.wasd = {
                up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
            this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }
    }

    private updateAnimation() {
        // Enquanto o sprite de dano está visível, não deixa o movimento sobrescrever o frame
        if (this.damageFrameActive) return;

        const texture = this.scene.textures.get('game_sprites');

        if (!texture || texture.frameTotal < 3) {
            this.updateAnimationFallback();
            return;
        }
        
        let targetFrame = 0;
        
        if (this.isMovingBack) {
            targetFrame = 2;
        } else if (this.isMoving) {
            targetFrame = 1;
            if (this.lastMoveDirection === -1) {
                this.setFlipX(true);
            } else {
                this.setFlipX(false);
            }
        } else {
            this.setFlipX(false);
        }
        
        const currentFrame = parseInt(this.frame?.name || '0');
        if (currentFrame !== targetFrame) {
            this.setFrame(targetFrame);
        }
    }
    
    private updateAnimationFallback() {
        if (this.isMovingBack) {
            this.setTint(0x88aaff);
        } else if (this.isMoving) {
            this.setTint(0xffaa88);
        } else {
            this.clearTint();
        }
        
        if (this.isMoving && this.lastMoveDirection === -1) {
            this.setFlipX(true);
        } else if (!this.isMoving || this.lastMoveDirection === 1) {
            this.setFlipX(false);
        }
    }

    // ==================== SHIELD ====================
    
    public activateShield(durationSeconds: number) {
        this.hasShield = true;
        this.shieldEndTime = this.scene.time.now + durationSeconds * 1000;
        
        if (this.shieldCircle) this.shieldCircle.destroy();
        this.shieldCircle = this.scene.add.circle(this.x, this.y, 32, 0x44ccff, 0.3);
        this.shieldCircle.setStrokeStyle(3, 0x44ccff);

        this.audioManager.playSfx('powerUp', 0.8);
    }
    
    public updateShield() {
        if (!this.hasShield) return;
        
        if (this.shieldCircle) {
            this.shieldCircle.setPosition(this.x, this.y);
        }
        
        if (this.scene.time.now >= this.shieldEndTime) {
            this.deactivateShield();
        }
    }
    
    public deactivateShield() {
        this.hasShield = false;
        if (this.shieldCircle) {
            this.shieldCircle.destroy();
            this.shieldCircle = null;
        }
    }
    
    public reflectBullet(bullet: any) {
        if (!this.hasShield) return false;
        
        if (bullet.body) {
            bullet.setVelocity(-bullet.body.velocity.x, -bullet.body.velocity.y);
        }
        bullet.setTint(0x44ccff);
        
        return true;
    }

    // ==================== TIME WARP ====================
    
    public activateTimeWarp(durationSeconds: number) {
        this.isTimeWarpActive = true;
        this.timeWarpEndTime = this.scene.time.now + durationSeconds * 1000;
        
        if (this.timeWarpEffect) this.timeWarpEffect.destroy();
        this.timeWarpEffect = this.scene.add.graphics();
        this.timeWarpEffect.lineStyle(3, 0xff44ff, 0.8);
        this.timeWarpEffect.strokeCircle(0, 0, 38);
        
        this.audioManager.playSfx('powerUp', 0.8);
    }
    
    public updateTimeWarp() {
        if (!this.isTimeWarpActive) return;
        
        if (this.timeWarpEffect) {
            this.timeWarpEffect.setPosition(this.x, this.y);
        }
        
        if (this.scene.time.now >= this.timeWarpEndTime) {
            this.deactivateTimeWarp();
        }
    }
    
    public deactivateTimeWarp() {
        this.isTimeWarpActive = false;
        if (this.timeWarpEffect) {
            this.timeWarpEffect.destroy();
            this.timeWarpEffect = null;
        }
    }
    
    public getScoreMultiplier(): number {
        return this.isTimeWarpActive ? 5 : 1;
    }

    // ==================== MAGNET ====================

    public updateMagnetLevel(level: number) {
        this.magnetLevel = level;
        this.magnetRadius = this.baseMagnetRadius * (1 + 0.02 * level);
    }

    public getMagnetLevel(): number {
        return this.magnetLevel;
    }

    // ==================== UPDATE ====================
    
    update() {
        if (!this.scene.input || !this.scene.input.keyboard) return;
        
        this.updateShield();
        this.updateTimeWarp();
        this.handleMovement();
        this.handleShoot();
    }

    // ==================== MOVEMENT ====================
    
    private handleMovement() {
        let vx = 0;
        let vy = 0;
        const speed = 320;
        
        this.isMoving = false;
        this.isMovingBack = false;

        if (this.cursors.left?.isDown || this.wasd.left.isDown) {
            vx = -speed;
            this.isMoving = true;
            this.lastMoveDirection = -1;
        } else if (this.cursors.right?.isDown || this.wasd.right.isDown) {
            vx = speed;
            this.isMoving = true;
            this.lastMoveDirection = 1;
        }

        if (this.cursors.up?.isDown || this.wasd.up.isDown) {
            vy = -speed;
            this.isMoving = true;
        } else if (this.cursors.down?.isDown || this.wasd.down.isDown) {
            vy = speed;
            this.isMoving = true;
            this.isMovingBack = true;
        }

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.setVelocity(vx, vy);
        this.updateAnimation();
    }

    // ==================== SHOOT ====================
    
    private handleShoot() {
        const now = this.scene.time.now;
        const weapon = WeaponSystem.getWeapon(this.currentWeaponLevel);
        
        if (this.spaceKey?.isDown && now - this.lastShot > weapon.cooldown) {
            this.shoot();
            this.lastShot = now;
            this.audioManager.playSfx('shoot', 0.4);
        }
    }

    private shoot() {
        let dirX = 0;
        let dirY = -1;

        const leftPressed = this.cursors.left?.isDown || this.wasd.left.isDown;
        const rightPressed = this.cursors.right?.isDown || this.wasd.right.isDown;
        const upPressed = this.cursors.up?.isDown || this.wasd.up.isDown;
        const downPressed = this.cursors.down?.isDown || this.wasd.down.isDown;

        if (downPressed) {
            dirX = 0;
            dirY = -1;
        } else if (leftPressed && !rightPressed) {
            dirX = -1;
            dirY = upPressed ? -1 : 0;
        } else if (rightPressed && !leftPressed) {
            dirX = 1;
            dirY = upPressed ? -1 : 0;
        } else if (upPressed) {
            dirX = 0;
            dirY = -1;
        }

        let len = Math.hypot(dirX, dirY);
        if (len === 0) { dirX = 0; dirY = -1; len = 1; }
        dirX /= len;
        dirY /= len;

        const weapon = WeaponSystem.getWeapon(this.currentWeaponLevel);
        weapon.shoot(this.scene, this.x, this.y, dirX, dirY, this.bullets);
    }

    // ==================== DAMAGE ====================
    
    private setDamagedSprite(visible: boolean) {
        if (visible && !this.isDamaged) {
            // Tenta mudar para sprite danificado se existir
            if (this.scene.textures.exists('game_sprites_damaged')) {
                this.setTexture('game_sprites_damaged', 0);
            } else {
                this.setTint(0xff6666);
            }
            this.isDamaged = true;
        } else if (!visible && this.isDamaged) {
            if (this.scene.textures.exists('game_sprites')) {
                this.setTexture('game_sprites', 0);
            }
            this.clearTint();
            this.isDamaged = false;
        }
    }

    public showDamagedSprite(duration: number = 200) {
        this.setDamagedSprite(true);
        this.scene.time.delayedCall(duration, () => {
            if (this.active) {
                this.setDamagedSprite(false);
            }
        });
    }

    public takeDamage() {
        if (this.isInvincible) return;
        if (this.hasShield) {
            return;
        }

        this.health = Math.max(0, this.health - 1);

        // Efeito visual imediato: sprite de dano (frame 8) + tint vermelho
        this.showDamageFrame();
        this.setTint(0xff8888);
        this.scene.time.delayedCall(200, () => {
            if (this.active) this.clearTint();
        });

        // Som de dano
        this.audioManager.playSfx('hit', 0.7);
        
        if (this.health <= 0) {
            this.destroy();
        } else {
            this.startInvincibility();
        }
    }

    // Mostra o sprite de dano (frame 8) por um curto período como feedback visual
    private showDamageFrame(duration: number = 250) {
        this.damageFrameActive = true;
        this.setFrame(8);
        this.scene.time.delayedCall(duration, () => {
            if (this.active) {
                this.damageFrameActive = false;
                this.setFrame(0);
            }
        });
    }

    private startInvincibility() {
        this.isInvincible = true;
        
        // Pisca durante invencibilidade
        let blinkCount = 0;
        const blinkInterval = this.scene.time.addEvent({
            delay: 150,
            callback: () => {
                if (!this.active || !this.isInvincible) {
                    blinkInterval.remove();
                    return;
                }
                if (blinkCount % 2 === 0) {
                    this.setDamagedSprite(true);
                } else {
                    this.setDamagedSprite(false);
                }
                blinkCount++;
            },
            repeat: 9
        });
        
        this.scene.time.delayedCall(100, () => {
            if (this.active && this.isInvincible) {
                this.setTint(0xff6666);
            }
        });
        
        this.scene.time.delayedCall(500, () => {
            if (this.active) {
                this.isInvincible = false;
                this.clearTint();
                this.setDamagedSprite(false);
            }
        });
    }
}