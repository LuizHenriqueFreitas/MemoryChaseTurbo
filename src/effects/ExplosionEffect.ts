import { Scene } from 'phaser';

export class ExplosionEffect {
    public static create(scene: Scene, x: number, y: number, radius: number = 40, color: number = 0xff6600, ignoreWalls: boolean = true): void {
        // Explosão principal
        const explosion = scene.add.circle(x, y, radius, color, 0.7);
        scene.tweens.add({
            targets: explosion,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
        
        // Anéis de choque
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
        
        // Partículas
        for (let i = 0; i < 15; i++) {
            const particle = scene.add.circle(x, y, 4, color, 0.9);
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 100;
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
        
        // Onda de choque que empurra objetos próximos (exceto paredes)
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
    
    public static createShockwave(scene: Scene, x: number, y: number, radius: number = 60, force: number = 300, ignoreWalls: boolean = true): void {
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
                const dist = Math.hypot(dx, dy);
                if (dist < radius && dist > 5) {
                    const angle = Math.atan2(dy, dx);
                    const pushForce = force * (1 - dist / radius);
                    enemy.setVelocity(
                        enemy.body.velocity.x + Math.cos(angle) * pushForce,
                        enemy.body.velocity.y + Math.sin(angle) * pushForce
                    );
                }
            });
        }
        
        // Empurra projéteis inimigos
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