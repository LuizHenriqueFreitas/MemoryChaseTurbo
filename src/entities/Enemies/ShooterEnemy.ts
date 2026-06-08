/**
 * ============================================================================
 *  ShooterEnemy.ts — INIMIGO ATIRADOR
 * ============================================================================
 *
 *  Inimigo que desce e, UMA vez, dispara um projétil MIRADO no jogador. Tem 2
 *  pontos de vida (aguenta um tiro a mais que o Walker). Obriga o jogador a se
 *  movimentar para desviar do tiro, não só dos corpos.
 *
 *  Conceito-chave (tiro mirado): usamos `Phaser.Math.Angle.Between` para achar
 *  o ângulo da reta entre o atirador e o jogador, e então `cos/sin` para
 *  transformar esse ângulo num vetor velocidade. Assim a bala viaja exatamente
 *  na direção em que o jogador ESTAVA no momento do disparo.
 * ============================================================================
 */

import { Scene } from 'phaser';
import { Enemy } from './Enemy';

export class ShooterEnemy extends Enemy {
    constructor(scene: Scene, x: number, y: number) {
        // Frame 5; desce um pouco mais devagar que o Walker (100..180).
        super(scene, x, y, 'game_sprites', 5, Phaser.Math.Between(100, 180));
        this.hitPoints = 2;
        this.setScale(2.3);

        // Atira uma vez, 1 segundo após surgir. O delayedCall agenda a ação;
        // verificamos `this.active` antes de atirar caso o inimigo já tenha
        // sido destruído nesse meio tempo.
        scene.time.delayedCall(1000, () => {
            if (this.active) this.shootAtPlayer();
        });
    }

    /**
     * Dispara um único projétil em direção à posição atual do jogador.
     * O jogador é localizado pelo nome ('player') registrado na GameScene, e a
     * bala é inserida no grupo `enemyBullets` da cena.
     */
    private shootAtPlayer() {
        const player = this.scene.children.getByName('player');
        if (!player || !player.active) return;

        const bullets = (this.scene as any).enemyBullets as Phaser.Physics.Arcade.Group;
        if (!bullets) return;

        const bullet = bullets.create(this.x, this.y, 'enemyBullet');
        // Ângulo da reta (atirador → jogador) e conversão para vetor velocidade.
        const angle = Phaser.Math.Angle.Between(this.x, this.y, (player as any).x, (player as any).y);
        const speed = 280;
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        bullet.setScale(0.6);
        bullet.body!.setSize(6, 6);
        bullet.setTint(0xff0000);  // Vermelho: sinaliza perigo ao jogador
    }

    /** Comportamento por frame: apenas manter a descida. */
    public updateBehavior(_player: Phaser.Physics.Arcade.Sprite): void {
        this.ensureMovement();
    }
}
