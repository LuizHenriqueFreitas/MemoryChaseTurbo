/**
 * ============================================================================
 *  ShieldItem.ts — ITEM DE ESCUDO (POWER-UP)
 * ============================================================================
 *
 *  Power-up que, ao ser coletado, ativa um escudo temporário no jogador
 *  (que reflete balas e bloqueia dano). Diferente da moeda, este item se move
 *  em ZIGUEZAGUE: desce sempre, mas alterna a direção horizontal a cada
 *  intervalo, tornando-o mais difícil/divertido de pegar.
 *
 *  A frequência de surgimento e a duração do escudo dependem do nível comprado
 *  na loja (ver getShieldSpawnChance / getShieldDuration em SaveData.ts).
 * ============================================================================
 */

import { Scene } from 'phaser';

export class ShieldItem extends Phaser.Physics.Arcade.Sprite {
    private moveDirection: number = 1;     // 1 = direita, -1 = esquerda
    private speedX: number = 80;           // Velocidade horizontal (px/s)
    private speedY: number = 120;          // Velocidade de queda (px/s)
    private switchTimer: number = 0;       // Acumulador de tempo desde a última troca
    private switchInterval: number = 800;  // muda de direção a cada 800ms

    constructor(scene: Scene, x: number, y: number) {
        // Frame 7 do spritesheet representa o item de escudo.
        super(scene, x, y, 'game_sprites', 7);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Começa indo para diagonal direita (para baixo e direita)
        this.setVelocity(this.speedX, this.speedY);

        this.setScale(1);
        this.body!.setSize(28, 28);
        this.setTint(0x44ccff);  // Tom azul-ciano, cor temática do escudo
    }

    /**
     * Chamado a cada frame pela GameScene. Conta o tempo e, ao atingir o
     * intervalo, dispara a troca de direção.
     *
     * Nota didática: somamos um valor FIXO (~16ms, equivalente a 1 frame a
     * 60fps) por simplicidade. É uma aproximação — não usa o `delta` real —
     * mas suficiente para o efeito de ziguezague.
     */
    update() {
        if (!this.active) return;

        this.switchTimer += 16; // ~60fps

        if (this.switchTimer >= this.switchInterval) {
            this.switchTimer = 0;
            this.switchDirection();
        }
    }

    /** Inverte a direção horizontal e emite um pequeno "brilho" visual. */
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
