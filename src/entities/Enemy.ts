import { Scene } from 'phaser';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    private speedY: number;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'enemy');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.speedY = Phaser.Math.Between(120, 220);
        this.setScale(0.7);
        this.body!.setSize(28, 28);
        
        // Força a velocidade após a criação e depois de 1 frame
        this.setVelocityY(this.speedY);
        
        // Garantia extra: depois de 1 frame, reforce a velocidade
        scene.time.delayedCall(10, () => {
            if (this.body) {
                this.setVelocityY(this.speedY);
                console.log(`Enemy velocidade após delay: ${this.body.velocity.y}`);
            }
        });

        // Mostra no console para debug
        console.log(`👾 Enemy spawn: speedY=${this.speedY}, pos=(${x}, ${y})`);
        
        // Agendar tiro
        scene.time.delayedCall(1000, () => {
            if (this.active) this.shootAtPlayer();
        });
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        // Se por algum motivo a velocidade zerar, reinicia
        if (this.body && this.body.velocity.y === 0 && this.active) {
            this.setVelocityY(this.speedY);
        }
    }

    private shootAtPlayer() {
        const player = this.scene.children.getByName('player');
        if (!player || !player.active) return;

        const bullets = (this.scene as any).enemyBullets as Phaser.Physics.Arcade.Group;
        if (!bullets) return;

        const bullet = bullets.create(this.x, this.y, 'enemyBullet');
        const angle = Phaser.Math.Angle.Between(this.x, this.y, (player as any).x, (player as any).y);
        const speed = 280;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        bullet.setVelocity(vx, vy);
        bullet.setScale(0.6);
        bullet.body!.setSize(6, 6);
        bullet.setTint(0xff6600);
    }
}