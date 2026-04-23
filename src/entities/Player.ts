import { Scene } from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    public bullets: Phaser.Physics.Arcade.Group;
    public health: number;
    public isInvincible: boolean;
    private lastShot: number;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };
    private spaceKey: Phaser.Input.Keyboard.Key;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setScale(0.9);
        this.body!.setSize(28, 28);

        this.health = 3;
        this.isInvincible = false;
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

        // Normaliza diagonal
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
        const vel = this.body!.velocity;
        let dirX = 0;
        let dirY = -1; // sempre aponta para cima (negativo)

        // Se o jogador está se movendo horizontalmente, adiciona componente X na direção do movimento
        if (vel.x !== 0) {
            dirX = Math.sign(vel.x); // -1 para esquerda, 1 para direita
        }

        // Nota: Não usamos a componente vertical do movimento para alterar dirY,
        // pois queremos que o tiro sempre tenha componente Y para cima (nunca para baixo).
        // Assim, se o jogador move para baixo, ainda assim atira para cima.
        // Se move para cima, também atira para cima (reto ou diagonal, dependendo do X).

        // Normaliza o vetor para que a velocidade do tiro seja constante em qualquer direção
        let length = Math.sqrt(dirX * dirX + dirY * dirY);
        if (length === 0) {
            dirX = 0;
            dirY = -1;
            length = 1;
        }
        dirX /= length;
        dirY /= length;

        const bulletSpeed = 500;
        const bullet = this.bullets.create(this.x, this.y - 15, 'bullet');
        bullet.setVelocity(dirX * bulletSpeed, dirY * bulletSpeed);
        
        // Aumenta o tamanho da bala (antes scale 0.6, agora 1.2)
        bullet.setScale(1.2);
        // Ajusta o corpo de colisão para ficar proporcional
        bullet.body!.setSize(12, 24);
        
        // Rotaciona o sprite da bala para apontar na direção do tiro (efeito visual)
        bullet.rotation = Math.atan2(dirY, dirX);
    }

    public takeDamage() {
        if (this.isInvincible) return;
        this.health--;
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