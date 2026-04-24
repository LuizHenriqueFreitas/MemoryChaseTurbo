import { Scene } from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    public bullets: Phaser.Physics.Arcade.Group;
    public health: number;
    public maxHealth: number;
    public isInvincible: boolean;
    public magnetRadius: number;
    private magnetLevel: number;
    private lastShot: number;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };
    private spaceKey: Phaser.Input.Keyboard.Key;
    private baseMagnetRadius: number = 70;

    constructor(scene: Scene, x: number, y: number, maxHealth: number = 3, magnetLevel: number = 0) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setScale(0.9);
        this.body!.setSize(28, 28);

        this.maxHealth = maxHealth;
        this.health = maxHealth;   // ← corrigido: vida inicial igual à máxima
        this.isInvincible = false;
        this.magnetLevel = magnetLevel;
        this.magnetRadius = this.baseMagnetRadius * (1 + 0.02 * magnetLevel);
        this.lastShot = 0;

        this.bullets = scene.physics.add.group();
        const keyboard = scene.input.keyboard!;
        this.cursors = keyboard.createCursorKeys();
        this.wasd = {
            up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    public updateMagnetLevel(level: number) {
        this.magnetLevel = level;
        this.magnetRadius = this.baseMagnetRadius * (1 + 0.02 * level);
    }

    update() {
        this.handleMovement();
        this.handleShoot();
    }

    private handleMovement() {
        let vx = 0;
        let vy = 0;
        const speed = 320;

        if (this.cursors.left?.isDown || this.wasd.left.isDown) vx = -speed;
        else if (this.cursors.right?.isDown || this.wasd.right.isDown) vx = speed;

        if (this.cursors.up?.isDown || this.wasd.up.isDown) vy = -speed;
        else if (this.cursors.down?.isDown || this.wasd.down.isDown) vy = speed;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.setVelocity(vx, vy);
    }

    private handleShoot() {
        const now = this.scene.time.now;
        if (this.spaceKey?.isDown && now - this.lastShot > 250) {
            this.shoot();
            this.lastShot = now;
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

        const bulletSpeed = 500;
        const bullet = this.bullets.create(this.x, this.y - 15, 'bullet');
        bullet.setVelocity(dirX * bulletSpeed, dirY * bulletSpeed);
        bullet.setScale(1.2);
        bullet.body!.setSize(12, 24);
        bullet.rotation = Math.atan2(dirY, dirX);
    }

    public takeDamage() {
        if (this.isInvincible) return;
        this.health = Math.max(0, this.health - 1);
        if (this.health <= 0) {
            this.destroy();
        } else {
            this.startInvincibility();
        }
    }

    private startInvincibility() {
        this.isInvincible = true;
        this.setTint(0xff6666);
        this.scene.time.delayedCall(1500, () => {
            this.isInvincible = false;
            this.clearTint();
        });
    }
}