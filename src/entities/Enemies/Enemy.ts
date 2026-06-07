// src/entities/Enemies/Enemy.ts
import { Scene } from 'phaser';

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
    protected speedY: number;
    public hitPoints: number;
    
    constructor(scene: Scene, x: number, y: number, textureKey: string, locale: integer, speedY: number = 120) {
        super(scene, x, y, textureKey, locale);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.speedY = speedY;
        this.hitPoints = 1;
        
        // GARANTE a velocidade vertical
        this.setVelocityY(speedY);
        this.setScale(0.7);
        this.body!.setSize(28, 28);
        
        console.log(`📦 ${textureKey} criado - velocidade Y: ${this.body?.velocity.y}`);
    }
    
    public abstract updateBehavior(player: Phaser.Physics.Arcade.Sprite): void;
    
    public takeDamage(): void {
        this.hitPoints--;
        if (this.hitPoints <= 0) {
            this.destroy();
        }
    }
    
    // Garante que a velocidade nunca seja zero durante o movimento
    protected ensureMovement() {
        if (this.body && this.body.velocity.y === 0 && this.active) {
            console.warn(`⚠️ ${this.texture.key} estava parado, reiniciando velocidade`);
            this.setVelocityY(this.speedY);
        }
    }
}