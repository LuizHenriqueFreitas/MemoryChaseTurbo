/**
 * ============================================================================
 *  TimeWarpItem.ts — ITEM ESPAÇO-TEMPO (POWER-UP)
 * ============================================================================
 *
 *  Power-up que, ao ser coletado, ativa o poder "Espaço-Tempo": enquanto
 *  ativo, TODA pontuação ganha é multiplicada por 5 (ver getScoreMultiplier
 *  em Player.ts). É a principal forma de fazer a pontuação disparar.
 *
 *  Mecanicamente ele é quase idêntico ao ShieldItem (desce em ziguezague),
 *  mudando o frame do sprite, a cor (magenta) e o efeito que dispara ao ser
 *  coletado. Manter as duas classes separadas deixa cada power-up livre para
 *  evoluir de forma independente no futuro.
 * ============================================================================
 */

import { Scene } from 'phaser';

export class TimeWarpItem extends Phaser.Physics.Arcade.Sprite {
    private moveDirection: number = 1;     // 1 = direita, -1 = esquerda
    private speedX: number = 80;           // Velocidade horizontal (px/s)
    private speedY: number = 120;          // Velocidade de queda (px/s)
    private switchTimer: number = 0;       // Acumulador de tempo desde a última troca
    private switchInterval: number = 800;  // Troca de direção a cada 800ms

    constructor(scene: Scene, x: number, y: number) {
        // Frame 11 do spritesheet representa o item Espaço-Tempo.
        super(scene, x, y, 'game_sprites', 11);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setVelocity(this.speedX, this.speedY);
        this.setScale(1);
        this.body!.setSize(28, 28);
        this.setTint(0xff44ff); // Roxo/magenta para diferenciar
    }

    /** A cada frame, conta o tempo e alterna a direção quando necessário. */
    update() {
        if (!this.active) return;

        this.switchTimer += 16;

        if (this.switchTimer >= this.switchInterval) {
            this.switchTimer = 0;
            this.switchDirection();
        }
    }

    /** Inverte a direção horizontal e emite um brilho magenta. */
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
