/**
 * ============================================================================
 *  WeaponSystem.ts — SISTEMA DE ARMAS
 * ============================================================================
 *
 *  Define as armas do jogo e COMO cada uma dispara. Este é um bom exemplo do
 *  padrão "estratégia" (strategy pattern) de forma leve: cada arma é um objeto
 *  que carrega seus próprios atributos E sua própria função `shoot()`.
 *
 *  Por que isso é elegante? O jogador (Player.ts) NÃO precisa saber como cada
 *  arma funciona. Ele apenas pede `weapon.shoot(...)` e a arma certa cuida do
 *  resto — seja disparar uma bala reta, três em cone, ou uma bala teleguiada.
 *  Para adicionar uma nova arma, basta acrescentar um item ao array WEAPONS.
 *
 *  Detalhe técnico: balas são criadas dentro de um GRUPO de física do Phaser
 *  (`bullets`). Usamos `setData(...)` para "pendurar" propriedades extras na
 *  bala (ex.: explosiva, teleguiada) que a GameScene lê depois para decidir o
 *  comportamento no impacto.
 * ============================================================================
 */

import { Scene } from 'phaser';

/**
 * Contrato de uma arma. Define atributos visuais/mecânicos e, crucialmente, a
 * função `shoot` que sabe instanciar o(s) projétil(eis) daquela arma.
 */
export interface Weapon {
    name: string;
    description: string;
    cooldown: number;       // Tempo mínimo entre disparos (ms) — quanto menor, mais rápido atira
    bulletSpeed: number;    // Velocidade do projétil (px/s)
    bulletSize: number;     // Escala visual do projétil
    bulletColor: number;    // Cor (hexadecimal) do projétil
    // A "estratégia" de disparo: recebe a cena, posição de origem, direção
    // (já normalizada) e o grupo onde a bala deve ser inserida.
    shoot: (scene: Scene, x: number, y: number, directionX: number, directionY: number, bullets: Phaser.Physics.Arcade.Group) => void;
}

export class WeaponSystem {
    /**
     * Catálogo de armas. O índice no array é o "nível"/id da arma salvo em
     * `weaponLevel`. Hoje há três:
     *   [0] Padrão  — tiro único, reto e EXPLOSIVO no impacto.
     *   [1] Cônica  — três tiros em leque (-15°, 0°, +15°), curto alcance.
     *   [2] Magnética — tiro único TELEGUIADO (homing) que persegue inimigos.
     */
    public static readonly WEAPONS: Weapon[] = [
        {
            name: '🔫 ARMA PADRÃO',
            description: 'Tiros retos e rápidos\nAlcance ilimitado\nDano: médio',
            cooldown: 250,
            bulletSpeed: 500,
            bulletSize: 1.2,
            bulletColor: 0xffff00,
            shoot: (scene, x, y, dirX, dirY, bullets) => {
                // Cria a bala um pouco acima da nave (y - 15) e a lança na direção.
                const bullet = bullets.create(x, y - 15, 'bullet');
                bullet.setVelocity(dirX * 500, dirY * 500);
                bullet.setScale(1.2);
                if (bullet.body) bullet.body.setSize(12, 24);
                // Rotaciona o sprite para apontar no sentido do movimento.
                bullet.rotation = Math.atan2(dirY, dirX);
                bullet.setTint(0xffff00);

                // Marca a bala como EXPLOSIVA. A GameScene lê estes dados no
                // impacto para criar a explosão e o "empurrão" (shockwave).
                bullet.setData('explosive', true);
                bullet.setData('explosionRadius', 35);
            }
        },
        {
            name: '💥 ARMA CÔNICA',
            description: 'Ataque em cone\nAlcance curto\nDano: alto',
            cooldown: 400,
            bulletSpeed: 350,
            bulletSize: 1.0,
            bulletColor: 0xff6600,
            shoot: (scene, x, y, dirX, dirY, bullets) => {
                // Três disparos: a direção central é deslocada por estes ângulos
                // (em radianos) para formar o leque/cone.
                const angles = [-0.3, 0, 0.3]; // -15°, 0°, +15°

                angles.forEach(angleOffset => {
                    // atan2 converte a direção (dirX,dirY) em ângulo; somamos o
                    // desvio e voltamos para vetor velocidade com cos/sin.
                    const angle = Math.atan2(dirY, dirX) + angleOffset;
                    const vx = Math.cos(angle) * 350;
                    const vy = Math.sin(angle) * 350;

                    const bullet = bullets.create(x, y - 15, 'bullet');
                    bullet.setVelocity(vx, vy);
                    bullet.setScale(0.9);
                    if (bullet.body) bullet.body.setSize(10, 20);
                    bullet.rotation = angle;
                    bullet.setTint(0xff6600);
                });
            }
        },
        {
            name: '🧲 ARMA MAGNÉTICA',
            description: 'Balas perseguidoras\nBuscam novos alvos\nDano: baixo',
            cooldown: 600,
            bulletSpeed: 400,
            bulletSize: 0.8,
            bulletColor: 0x44ff44,
            shoot: (scene, x, y, dirX, dirY, bullets) => {
                const bullet = bullets.create(x, y - 15, 'bullet');
                bullet.setVelocity(dirX * 400, dirY * 400);
                bullet.setScale(0.8);
                if (bullet.body) bullet.body.setSize(8, 16);
                bullet.rotation = Math.atan2(dirY, dirX);
                bullet.setTint(0x44ff44);

                // Marca como TELEGUIADA (homing). A correção de rota acontece a
                // cada frame no update() da GameScene, que procura o inimigo
                // mais próximo e curva a velocidade da bala em direção a ele.
                bullet.setData('homing', true);
                bullet.setData('target', null);
                bullet.setData('maxTargets', 2);
                bullet.setData('targetsHit', 0);
            }
        }
    ];

    /**
     * Devolve a arma do nível pedido. Se o índice for inválido (save corrompido
     * ou fora do alcance), cai com segurança na arma padrão [0].
     */
    public static getWeapon(level: number): Weapon {
        return this.WEAPONS[level] || this.WEAPONS[0];
    }
}
