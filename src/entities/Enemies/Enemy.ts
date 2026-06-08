// src/entities/Enemies/Enemy.ts
/**
 * ============================================================================
 *  Enemy.ts — CLASSE-BASE ABSTRATA DE TODOS OS INIMIGOS
 * ============================================================================
 *
 *  Este é o coração da HERANÇA no projeto. `Enemy` é uma classe ABSTRATA:
 *  ela não pode ser instanciada diretamente (não existe "um inimigo genérico"),
 *  mas define tudo o que TODO inimigo tem em comum:
 *    • um corpo de física e um sprite;
 *    • velocidade de descida (speedY);
 *    • pontos de vida (hitPoints);
 *    • como tomar dano (takeDamage).
 *
 *  O que ela NÃO define é o COMPORTAMENTO específico de cada inimigo — isso é
 *  deixado como o método abstrato `updateBehavior`, que CADA subclasse é
 *  OBRIGADA a implementar. Esse é o padrão "Template Method": a base fornece a
 *  estrutura comum e delega os detalhes às filhas.
 *
 *  Subclasses:
 *    • WalkerEnemy  → apenas desce (o "asteroide" básico).
 *    • ShooterEnemy → desce e atira no jogador.
 *    • ChaserEnemy  → detecta o jogador, trava a mira e mergulha explodindo.
 * ============================================================================
 */

import { Scene } from 'phaser';

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
    protected speedY: number;   // Velocidade vertical de descida (protegida: filhas acessam)
    public hitPoints: number;   // Vida atual; ao chegar a 0, o inimigo morre

    constructor(scene: Scene, x: number, y: number, textureKey: string, locale: integer, speedY: number = 120) {
        // `locale` é o índice do frame no spritesheet — cada tipo de inimigo
        // usa um frame diferente para ter aparência própria.
        super(scene, x, y, textureKey, locale);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speedY = speedY;
        this.hitPoints = 1;       // Valor padrão; subclasses costumam sobrescrever

        // GARANTE a velocidade vertical
        this.setVelocityY(speedY);
        this.setScale(0.7);
        this.body!.setSize(28, 28);
    }

    /**
     * Comportamento por frame, ESPECÍFICO de cada inimigo. Por ser abstrato,
     * toda subclasse precisa fornecer sua própria versão. A GameScene chama
     * este método para cada inimigo a cada frame, passando o jogador como alvo.
     */
    public abstract updateBehavior(player: Phaser.Physics.Arcade.Sprite): void;

    /**
     * Aplica 1 de dano. Quando a vida zera, o inimigo é destruído.
     * (O ChaserEnemy sobrescreve este método para explodir em vez de só sumir.)
     */
    public takeDamage(): void {
        this.hitPoints--;
        if (this.hitPoints <= 0) {
            this.destroy();
        }
    }

    /**
     * Rede de segurança contra "inimigos parados": se uma colisão zerou a
     * velocidade vertical, reativamos a descida. Chamado pelas subclasses
     * dentro de updateBehavior().
     */
    protected ensureMovement() {
        if (this.body && this.body.velocity.y === 0 && this.active) {
            this.setVelocityY(this.speedY);
        }
    }
}
