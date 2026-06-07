import { Scene } from 'phaser';

export class Coin extends Phaser.Physics.Arcade.Sprite {
    private speedY: number = 180;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'game_sprites', 3);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(1.6);
        this.body!.setSize(18, 18);
        this.setVelocityY(this.speedY);
        
        // Garantia extra após 1 frame
        scene.time.delayedCall(10, () => {
            if (this.body) {
                this.setVelocityY(this.speedY);
                console.log(`Moeda velocidade após delay: ${this.body.velocity.y}`);
            }
        });
        
        console.log(`🪙 Coin spawn: pos=(${x}, ${y})`);
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        if (this.body && this.body.velocity.y === 0 && this.active) {
            this.setVelocityY(this.speedY);
        }
    }
}