import { Scene } from 'phaser';
import { Enemy } from './Enemy';

export class WalkerEnemy extends Enemy {
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'game_sprites', 4, Phaser.Math.Between(120, 200));
        this.hitPoints = 1;
        this.setTint(0xdddddd);
        this.setScale(3.5);
    }

    public updateBehavior(_player: Phaser.Physics.Arcade.Sprite): void {
        this.ensureMovement();
    }
}
