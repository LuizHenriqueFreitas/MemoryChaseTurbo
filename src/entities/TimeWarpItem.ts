import { Scene } from 'phaser';

export class TimeWarpItem extends Phaser.Physics.Arcade.Sprite {
    private moveDirection: number = 1;
    private speedX: number = 80;
    private speedY: number = 120;
    private switchTimer: number = 0;
    private switchInterval: number = 800;
    
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'game_sprites', 11);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setVelocity(this.speedX, this.speedY);
        this.setScale(1);
        this.body!.setSize(28, 28);
        this.setTint(0xff44ff); // Roxo/magenta para diferenciar
        
        console.log('⏰ TimeWarp item criado');
    }
    
    update() {
        if (!this.active) return;
        
        this.switchTimer += 16;
        
        if (this.switchTimer >= this.switchInterval) {
            this.switchTimer = 0;
            this.switchDirection();
        }
    }
    
    private switchDirection() {
        this.moveDirection *= -1;
        this.setVelocity(this.speedX * this.moveDirection, this.speedY);
        
        const spark = this.scene.add.circle(this.x, this.y, 8, 0xff44ff, 0.6);
        this.scene.tweens.add({
            targets: spark,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 200,
            onComplete: () => spark.destroy()
        });
    }
}