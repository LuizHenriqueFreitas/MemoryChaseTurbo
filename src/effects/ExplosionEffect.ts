/**
 * ============================================================================
 *  ExplosionEffect.ts — EFEITOS VISUAIS DE EXPLOSÃO E ONDA DE CHOQUE
 * ============================================================================
 *
 *  Classe utilitária 100% ESTÁTICA: não se cria um "objeto explosão", apenas
 *  chama-se `ExplosionEffect.create(...)`. Centraliza o visual de explosões
 *  para que todo o jogo tenha um efeito consistente e reaproveitável.
 *
 *  Duas funções principais:
 *    • create()         → a parte VISUAL (clarão, anéis, partículas voando).
 *    • createShockwave() → a parte FÍSICA: além do anel visual, EMPURRA os
 *                          inimigos e as balas inimigas que estiverem por perto.
 *
 *  Técnica recorrente aqui: TWEENS. Um tween é uma animação interpolada — o
 *  Phaser muda uma propriedade (escala, alpha) suavemente de um valor a outro
 *  ao longo de um tempo. Ao terminar (`onComplete`), destruímos o objeto para
 *  não acumular lixo na cena.
 * ============================================================================
 */

import { Scene } from 'phaser';

export class ExplosionEffect {
    /**
     * Cria o efeito VISUAL de uma explosão na posição (x, y).
     * Combina quatro camadas para dar sensação de impacto:
     *   1. Um círculo central que cresce e some (o "bolo" da explosão).
     *   2. Três anéis de choque concêntricos, com leve atraso entre si.
     *   3. 15 partículas que voam em direções aleatórias (estilhaços).
     *   4. Um clarão branco rápido no centro.
     */
    public static create(scene: Scene, x: number, y: number, radius: number = 40, color: number = 0xff6600): void {
        // 1) Explosão principal: cresce até 2x e desaparece.
        const explosion = scene.add.circle(x, y, radius, color, 0.7);
        scene.tweens.add({
            targets: explosion,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy()
        });

        // 2) Anéis de choque: cada anel cresce um pouco mais que o anterior e
        //    começa um pouquinho depois (delay = i*50ms), criando o efeito de
        //    ondas se propagando.
        for (let i = 0; i < 3; i++) {
            const ring = scene.add.circle(x, y, 10, color, 0.6);
            scene.tweens.add({
                targets: ring,
                scaleX: 3 + i,
                scaleY: 3 + i,
                alpha: 0,
                duration: 400,
                delay: i * 50,
                onComplete: () => ring.destroy()
            });
        }

        // 3) Partículas (estilhaços): para cada uma, sorteamos um ÂNGULO e uma
        //    VELOCIDADE aleatórios e calculamos o deslocamento (vx, vy) com
        //    cos/sin. A partícula então "voa" para esse ponto enquanto some.
        for (let i = 0; i < 15; i++) {
            const particle = scene.add.circle(x, y, 4, color, 0.9);
            const angle = Math.random() * Math.PI * 2;          // 0..360° em radianos
            const speed = Math.random() * 200 + 100;            // 100..300 de "alcance"
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            scene.tweens.add({
                targets: particle,
                x: particle.x + vx,
                y: particle.y + vy,
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }

        // 4) Clarão central da explosão: um flash branco bem rápido.
        const shockwave = scene.add.circle(x, y, 5, 0xffffff, 0.5);
        scene.tweens.add({
            targets: shockwave,
            scaleX: radius * 0.15,
            scaleY: radius * 0.15,
            alpha: 0,
            duration: 200,
            onComplete: () => shockwave.destroy()
        });
    }

    /**
     * Cria uma ONDA DE CHOQUE com efeito físico: além do anel visual, varre os
     * objetos próximos e os empurra para LONGE do centro (x, y).
     *
     * Como o empurrão é calculado:
     *   • Para cada objeto, medimos a distância `dist` até o centro.
     *   • Se estiver dentro do `radius`, calculamos o ângulo do centro até o
     *     objeto (atan2) — essa é a direção do empurrão (para fora).
     *   • A força é PROPORCIONAL à proximidade: `force * (1 - dist/radius)`.
     *     Ou seja, quem está bem no centro leva o empurrão máximo; quem está
     *     na borda quase não sente. Esse "decaimento" dá realismo.
     *   • Somamos o vetor de empurrão à velocidade ATUAL (não a substituímos),
     *     preservando o momento que o objeto já tinha.
     *
     * Detalhe importante: a função acessa `scene.enemies` e `scene.enemyBullets`
     * via cast `(scene as any)`. Isso funciona porque a GameScene guarda esses
     * grupos como propriedades suas — é um acoplamento proposital para que o
     * efeito consiga "alcançar" os objetos do jogo.
     */
    public static createShockwave(scene: Scene, x: number, y: number, radius: number = 60, force: number = 300): void {
        // Efeito visual da onda
        const wave = scene.add.circle(x, y, 10, 0x44aaff, 0.4);
        scene.tweens.add({
            targets: wave,
            scaleX: radius / 5,
            scaleY: radius / 5,
            alpha: 0,
            duration: 300,
            onComplete: () => wave.destroy()
        });

        // Empurra inimigos próximos
        const enemies = (scene as any).enemies as Phaser.Physics.Arcade.Group;
        if (enemies) {
            enemies.getChildren().forEach((enemy: any) => {
                if (!enemy.active) return;
                const dx = enemy.x - x;
                const dy = enemy.y - y;
                const dist = Math.hypot(dx, dy);                 // distância euclidiana
                if (dist < radius && dist > 5) {
                    const angle = Math.atan2(dy, dx);
                    const pushForce = force * (1 - dist / radius); // força decai com a distância
                    enemy.setVelocity(
                        enemy.body.velocity.x + Math.cos(angle) * pushForce,
                        enemy.body.velocity.y + Math.sin(angle) * pushForce
                    );
                }
            });
        }

        // Empurra projéteis inimigos (com metade da força — são mais leves).
        const bullets = (scene as any).enemyBullets as Phaser.Physics.Arcade.Group;
        if (bullets) {
            bullets.getChildren().forEach((bullet: any) => {
                if (!bullet.active) return;
                const dx = bullet.x - x;
                const dy = bullet.y - y;
                const dist = Math.hypot(dx, dy);
                if (dist < radius && dist > 5) {
                    const angle = Math.atan2(dy, dx);
                    const pushForce = force * 0.5 * (1 - dist / radius);
                    bullet.setVelocity(
                        bullet.body.velocity.x + Math.cos(angle) * pushForce,
                        bullet.body.velocity.y + Math.sin(angle) * pushForce
                    );
                }
            });
        }
    }
}
