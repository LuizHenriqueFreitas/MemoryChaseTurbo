/**
 * ============================================================================
 *  WalkerEnemy.ts — INIMIGO BÁSICO ("ASTEROIDE")
 * ============================================================================
 *
 *  O inimigo mais simples: apenas DESCE em linha reta. Não atira nem persegue.
 *  Serve como ameaça de volume — vem em quantidade e o jogador deve desviar ou
 *  destruí-lo. Tem 1 ponto de vida (morre com um tiro).
 *
 *  Exemplo mínimo de subclasse: herda toda a mecânica de Enemy e só precisa
 *  fornecer um `updateBehavior` que mantém o movimento de descida.
 * ============================================================================
 */

import { Scene } from 'phaser';
import { Enemy } from './Enemy';

export class WalkerEnemy extends Enemy {
    constructor(scene: Scene, x: number, y: number) {
        // Frame 4 do spritesheet; velocidade de descida sorteada entre 120 e 200
        // para que nem todos caiam no mesmo ritmo (variedade visual).
        super(scene, x, y, 'game_sprites', 4, Phaser.Math.Between(120, 200));
        this.hitPoints = 1;
        this.setTint(0xdddddd);  // Tom acinzentado
        this.setScale(3.5);      // Grande — é o "asteroidão"
    }

    /** Comportamento: só garantir que continua descendo. */
    public updateBehavior(_player: Phaser.Physics.Arcade.Sprite): void {
        this.ensureMovement();
    }
}
