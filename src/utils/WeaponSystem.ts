import { Scene } from 'phaser';

export interface Weapon {
    name: string;
    description: string;
    cooldown: number;
    bulletSpeed: number;
    bulletSize: number;
    bulletColor: number;
    shoot: (scene: Scene, x: number, y: number, directionX: number, directionY: number, bullets: Phaser.Physics.Arcade.Group) => void;
}

export class WeaponSystem {
    public static readonly WEAPONS: Weapon[] = [
        {
            name: '🔫 ARMA PADRÃO',
            description: 'Tiros retos e rápidos\nAlcance ilimitado\nDano: médio',
            cooldown: 250,
            bulletSpeed: 500,
            bulletSize: 1.2,
            bulletColor: 0xffff00,
            shoot: (scene, x, y, dirX, dirY, bullets) => {
                const bullet = bullets.create(x, y - 15, 'bullet');
                bullet.setVelocity(dirX * 500, dirY * 500);
                bullet.setScale(1.2);
                if (bullet.body) bullet.body.setSize(12, 24);
                bullet.rotation = Math.atan2(dirY, dirX);
                bullet.setTint(0xffff00);
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
                // Ângulo base para o cone (30 graus para cada lado)
                const angles = [-0.3, 0, 0.3]; // -15°, 0°, +15°
                
                angles.forEach(angleOffset => {
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
                
                // Adiciona propriedade de perseguição
                bullet.setData('homing', true);
                bullet.setData('target', null);
                bullet.setData('maxTargets', 2);
                bullet.setData('targetsHit', 0);
            }
        }
    ];

    public static getWeapon(level: number): Weapon {
        return this.WEAPONS[level] || this.WEAPONS[0];
    }
}