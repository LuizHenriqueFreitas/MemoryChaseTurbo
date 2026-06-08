/**
 * ============================================================================
 *  Coin.ts — MOEDA COLETÁVEL
 * ============================================================================
 *
 *  Representa a "memória RAM" (a moeda do jogo, conforme a história). É um
 *  objeto simples que apenas cai do topo para a base da tela. Quando o jogador
 *  encosta nela (overlap, tratado na GameScene), vira pontos.
 *
 *  Conceito-chave: esta classe ESTENDE `Phaser.Physics.Arcade.Sprite`. Ao
 *  herdar de Sprite com física, a moeda ganha "de graça" posição, velocidade,
 *  corpo de colisão e integração com o motor — só precisamos configurar.
 * ============================================================================
 */

import { Scene } from 'phaser';

export class Coin extends Phaser.Physics.Arcade.Sprite {
    private speedY: number = 180;  // Velocidade de queda (px/s)

    constructor(scene: Scene, x: number, y: number) {
        // Frame 3 do spritesheet é a imagem da moeda.
        super(scene, x, y, 'game_sprites', 3);
        // Dois registros obrigatórios: na lista de desenho e no motor de física.
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1.6);
        this.body!.setSize(18, 18);     // Caixa de colisão um pouco menor que o sprite
        this.setVelocityY(this.speedY); // Começa caindo
    }

    /**
     * preUpdate é chamado automaticamente pelo Phaser a cada frame para este
     * sprite. Aqui ele serve de "rede de segurança": se por algum motivo
     * (ex.: efeito do magnetismo / colisão) a moeda perder a velocidade
     * vertical, reativamos a queda para que ela nunca fique parada no ar.
     */
    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        if (this.body && this.body.velocity.y === 0 && this.active) {
            this.setVelocityY(this.speedY);
        }
    }
}
