import { Scene } from 'phaser';
import { Enemy } from './Enemy';

export class ShooterEnemy extends Enemy {
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'game_sprites', 5, Phaser.Math.Between(100, 180));
        this.hitPoints = 2;
        this.setScale(2.3);

        // Atira uma vez, 1 segundo após surgir
        scene.time.delayedCall(1000, () => {
            if (this.active) this.shootAtPlayer();
        });
    }

    private shootAtPlayer() {
        const player = this.scene.children.getByName('player');
        if (!player || !player.active) return;

        const bullets = (this.scene as any).enemyBullets as Phaser.Physics.Arcade.Group;
        if (!bullets) return;

        const bullet = bullets.create(this.x, this.y, 'enemyBullet');
        const angle = Phaser.Math.Angle.Between(this.x, this.y, (player as any).x, (player as any).y);
        const speed = 280;
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        bullet.setScale(0.6);
        bullet.body!.setSize(6, 6);
        bullet.setTint(0xff0000);
    }

    public updateBehavior(_player: Phaser.Physics.Arcade.Sprite): void {
        this.ensureMovement();
    }
}
