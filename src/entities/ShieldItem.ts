import { Scene } from 'phaser';

export class ShieldItem extends Phaser.Physics.Arcade.Sprite {
    private moveDirection: number = 1;  // 1 = direita, -1 = esquerda
    private speedX: number = 80;
    private speedY: number = 120;
    private switchTimer: number = 0;
    private switchInterval: number = 800; // muda de direção a cada 800ms
    
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'game_sprites', 7);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Começa indo para diagonal direita (para baixo e direita)
        this.setVelocity(this.speedX, this.speedY);
        
        this.setScale(1);
        this.body!.setSize(28, 28);
        this.setTint(0x44ccff);
    }
    
    update() {
        if (!this.active) return;
        
        this.switchTimer += 16; // ~60fps
        
        if (this.switchTimer >= this.switchInterval) {
            this.switchTimer = 0;
            this.switchDirection();
        }
    }
    
    private switchDirection() {
        // Alterna a direção horizontal
        this.moveDirection *= -1;
        
        // Aplica nova velocidade (sempre descendo, lateral alternada)
        this.setVelocity(this.speedX * this.moveDirection, this.speedY);
        
        // Pequeno efeito visual ao mudar de direção
        const spark = this.scene.add.circle(this.x, this.y, 8, 0x44ccff, 0.6);
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