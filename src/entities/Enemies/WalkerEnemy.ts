import { Scene } from 'phaser';
import { Enemy } from './Enemy';

export class WalkerEnemy extends Enemy {
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'game_sprites', 4, Phaser.Math.Between(120, 200));
        this.hitPoints = 1;
        this.setTint(0xdddddd);
        this.setScale(3.5);  // ← 2x maior (era 0.7, agora 1.4)
        //this.body!.setSize(50, 50);  // Hitbox proporcional (antes 28, agora 50)
        //this.body!.setOffset(3, 3);  // Ajusta posição para centralizarconsole.log('⚪ Walker criado - TAMANHO 2x');
        console.log('⚪ Walker criado - TAMANHO 2x');
    }
    
    public updateBehavior(player: Phaser.Physics.Arcade.Sprite): void {
        this.ensureMovement();
    }
}