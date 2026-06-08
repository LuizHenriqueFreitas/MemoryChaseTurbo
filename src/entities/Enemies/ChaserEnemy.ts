/**
 * ============================================================================
 *  ChaserEnemy.ts — INIMIGO PERSEGUIDOR "KAMIKAZE"
 * ============================================================================
 *
 *  O inimigo mais perigoso e complexo do jogo. Comportamento em duas fases:
 *
 *    FASE 1 — PATRULHA: desce devagar e reto enquanto não "vê" o jogador.
 *    FASE 2 — MERGULHO: quando o jogador entra no raio de detecção, ele TRAVA
 *             a direção rumo à posição atual do jogador e DISPARA em linha reta
 *             naquele sentido, em alta velocidade — como um kamikaze.
 *
 *  Detalhe importante de DESIGN: a direção é travada UMA vez (`hasLockedDirection`).
 *  Depois disso, o chaser NÃO corrige o rumo. Isso é proposital: dá ao jogador
 *  a chance de desviar no último instante. Um inimigo que corrigisse a mira
 *  para sempre seria praticamente impossível de evitar.
 *
 *  Ao morrer (por tiro, colisão ou ao bater nas paredes), ele EXPLODE causando
 *  dano em área — tanto no jogador quanto em outros inimigos próximos.
 * ============================================================================
 */

import { Scene } from 'phaser';
import { Enemy } from './Enemy';

export class ChaserEnemy extends Enemy {
    private explosionRadius: number = 60;   // Raio do dano em área ao explodir
    private normalSpeed: number = 100;      // velocidade normal descendo
    private chaseSpeed: number = 450;       // velocidade máxima ao perseguir
    private detectionRadius: number = 250;  // raio de detecção do player
    private directionX: number = 0;         // Componente X da direção travada
    private directionY: number = 0;         // Componente Y da direção travada
    private hasLockedDirection: boolean = false;  // Já travou a mira no jogador?

    constructor(scene: Scene, x: number, y: number) {
        // Frame 6; tem 3 pontos de vida — o mais resistente dos inimigos.
        super(scene, x, y, 'game_sprites', 6, 100);
        this.hitPoints = 3;
        this.setScale(0.9);
        this.body!.setSize(16, 16);
    }

    /**
     * Máquina de estados do perseguidor, avaliada a cada frame.
     */
    public updateBehavior(player: Phaser.Physics.Arcade.Sprite): void {
        if (!player || !player.active) return;

        // Direção já travada: dispara em LINHA RETA para sempre (até bater ou sair do mapa).
        // Mesmo que o player desvie, o chaser não corrige o rumo.
        if (this.hasLockedDirection) {
            this.setVelocity(this.directionX * this.chaseSpeed, this.directionY * this.chaseSpeed);
            // 20% de chance por frame de deixar um "rastro" visual — dá a
            // sensação de velocidade sem desenhar um rastro a cada frame.
            if (Math.random() < 0.2) this.showTrail();
            return;
        }

        // Mede a distância até o jogador (teorema de Pitágoras via Math.hypot).
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.hypot(dx, dy);

        // Detectou o player: trava a direção rumo à posição ATUAL dele e dispara reto.
        // Normalizamos (dividindo pela distância) para obter um vetor unitário —
        // só a DIREÇÃO —, e a velocidade vem do chaseSpeed.
        if (distance < this.detectionRadius) {
            this.directionX = dx / distance;
            this.directionY = dy / distance;
            this.hasLockedDirection = true;
            this.setVelocity(this.directionX * this.chaseSpeed, this.directionY * this.chaseSpeed);
            return;
        }

        // Ainda não detectou: desce reto.
        this.setVelocity(0, this.normalSpeed);
    }

    /** Pequena fagulha laranja que some rapidamente — o "rastro" do mergulho. */
    private showTrail() {
        const trail = this.scene.add.circle(this.x, this.y, 5, 0xff8800, 0.6);
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 200,
            onComplete: () => trail.destroy()
        });
    }

    /**
     * Sobrescreve o takeDamage da base: em vez de simplesmente desaparecer ao
     * morrer, o chaser detona uma EXPLOSÃO com dano em área.
     */
    public override takeDamage(): void {
        this.hitPoints--;
        if (this.hitPoints <= 0) {
            this.explode();
        }
    }

    /**
     * EXPLOSÃO COMPLETA do perseguidor (visual + dano em área).
     *
     * Etapas:
     *   1. Círculo de fogo central que cresce e some.
     *   2. 20 partículas de fogo voando em direções aleatórias.
     *   3. DANO ao jogador, se ele estiver dentro do raio — e ainda o ARREMESSA
     *      para longe (empurrão na direção oposta à explosão).
     *   4. DANO em cadeia: outros inimigos dentro do raio também levam dano,
     *      o que pode disparar reações em cadeia entre vários chasers.
     */
    public explode(): void {
        // 1) Explosão maior para o Chaser
        const explosion = this.scene.add.circle(this.x, this.y, this.explosionRadius, 0xff4400, 0.7);
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 350,
            onComplete: () => explosion.destroy()
        });

        // 2) Partículas de fogo
        for (let i = 0; i < 20; i++) {
            const fire = this.scene.add.circle(this.x, this.y, 5, 0xff6600, 0.8);
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            this.scene.tweens.add({
                targets: fire,
                x: fire.x + vx,
                y: fire.y + vy,
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 400,
                onComplete: () => fire.destroy()
            });
        }

        // 3) Dano em área ao player (com arremesso)
        const player = this.scene.children.getByName('player') as any;
        if (player && player.active) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.hypot(dx, dy);
            if (distance < this.explosionRadius) {
                // Aplica dano
                player.takeDamage();

                // Arremessa o player para longe da explosão
                const angle = Math.atan2(dy, dx);
                const pushForce = 400;
                const pushX = Math.cos(angle) * pushForce;
                const pushY = Math.sin(angle) * pushForce;
                player.setVelocity(pushX, pushY);
            }
        }

        // 4) Dano em outros inimigos próximos (reação em cadeia possível)
        const enemies = (this.scene as any).enemies as Phaser.Physics.Arcade.Group;
        if (enemies) {
            enemies.getChildren().forEach((enemy: any) => {
                if (enemy !== this && enemy.active) {
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance < this.explosionRadius) {
                        enemy.takeDamage();
                    }
                }
            });
        }

        this.destroy();
    }

    /**
     * Versão "enxuta" da explosão, usada quando o chaser COLIDE com algo
     * (parede, outro inimigo, ou o jogador) — situações em que a GameScene já
     * cuida do dano. Aqui só fazemos o efeito visual e destruímos o inimigo,
     * evitando aplicar o dano em área duas vezes.
     */
    public destroyOnCollision(): void {
        if (!this.active) return;

        // Efeito visual de explosão
        const explosion = this.scene.add.circle(this.x, this.y, 30, 0xff4400, 0.8);
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 250,
            onComplete: () => explosion.destroy()
        });

        // Anéis de choque
        for (let i = 0; i < 3; i++) {
            const ring = this.scene.add.circle(this.x, this.y, 10, 0xffaa44, 0.6);
            this.scene.tweens.add({
                targets: ring,
                scaleX: 3,
                scaleY: 3,
                alpha: 0,
                duration: 300,
                delay: i * 50,
                onComplete: () => ring.destroy()
            });
        }

        this.destroy();
    }
}
