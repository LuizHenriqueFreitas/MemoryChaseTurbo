import { Scene } from 'phaser';
import { Enemy } from './Enemy';

export class ChaserEnemy extends Enemy {
    private explosionRadius: number = 60;
    private normalSpeed: number = 100;      // velocidade normal descendo
    private chaseSpeed: number = 450;       // velocidade máxima ao perseguir
    private detectionRadius: number = 250;  // raio de detecção do player
    private isChasing: boolean = false;
    private hasTarget: boolean = false;
    private targetX: number = 0;
    private targetY: number = 0;
    private directionX: number = 0;
    private directionY: number = 0;
    private hasLockedDirection: boolean = false;
    
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'game_sprites', 6, 100);
        this.hitPoints = 3;
        this.setScale(0.9);
        this.body!.setSize(16, 16);
        console.log('🟠 Chaser criado');
    }
    
    public updateBehavior(player: Phaser.Physics.Arcade.Sprite): void {
        if (!player || !player.active) return;
        
        // Se já travou a direção (após perseguição), segue em linha reta para sempre
        if (this.hasLockedDirection) {
            this.setVelocity(this.directionX * this.chaseSpeed, this.directionY * this.chaseSpeed);
            return;
        }
        
        // Se já está perseguindo o alvo
        if (this.isChasing && this.hasTarget) {
            this.moveToTarget();
            return;
        }
        
        // Calcula distância até o player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        // Detectou o player dentro do raio
        if (!this.isChasing && distance < this.detectionRadius) {
            // TRAVA O ALVO na posição atual do player
            this.targetX = player.x;
            this.targetY = player.y;
            this.hasTarget = true;
            this.isChasing = true;
            console.log(`🟠 Chaser DETECTOU! Alvo: (${this.targetX}, ${this.targetY})`);
            return;
        }
        
        // Comportamento normal: desce reto
        if (!this.isChasing && !this.hasLockedDirection) {
            if (this.body && this.body.velocity.y !== this.normalSpeed) {
                this.setVelocity(0, this.normalSpeed);
            }
        }
    }
    
    private moveToTarget() {
        // Calcula direção para o alvo
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.hypot(dx, dy);
        
        // Se chegou no alvo ou passou dele
        if (distance < 30 || (dy > 0 && this.y > this.targetY)) {
            // TRAVA A DIREÇÃO ATUAL (continua em linha reta com velocidade máxima)
            this.hasLockedDirection = true;
            this.isChasing = false;
            this.hasTarget = false;
            
            // Usa a última direção de movimento (para onde estava indo)
            // Se por acaso não tiver direção, usa para baixo
            if (this.directionX === 0 && this.directionY === 0) {
                this.directionX = 0;
                this.directionY = 1;
            }
            
            this.setVelocity(this.directionX * this.chaseSpeed, this.directionY * this.chaseSpeed);
            console.log(`🟠 Chaser: alvo atingido! Seguindo reto (${this.directionX}, ${this.directionY})`);
            return;
        }
        
        // Normaliza a direção para o alvo
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Guarda a direção atual (para usar depois)
        this.directionX = dirX;
        this.directionY = dirY;
        
        // Move em direção ao alvo com velocidade máxima
        this.setVelocity(dirX * this.chaseSpeed, dirY * this.chaseSpeed);
        
        // Efeito visual de rastro
        if (Math.random() < 0.1) {
            this.showTrail();
        }
    }
    
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
    
    public override takeDamage(): void {
        this.hitPoints--;
        if (this.hitPoints <= 0) {
            this.explode();
        }
    }
    
    public explode(): void {
        // Explosão maior para o Chaser
        const explosion = this.scene.add.circle(this.x, this.y, this.explosionRadius, 0xff4400, 0.7);
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 350,
            onComplete: () => explosion.destroy()
        });
        
        // Partículas de fogo
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
        
        // Dano em área ao player (com arremesso)
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
        
        // Dano em outros inimigos próximos
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

    public destroyOnCollision(): void {
        if (!this.active) return;
        
        // Efeito visual de colisão/explosão
        this.createCollisionEffect();
        
        // Destroi o Chaser
        this.destroy();
    }

    private createCollisionEffect(): void {
        // Explosão laranja/vermelha
        const explosion = this.scene.add.circle(this.x, this.y, 25, 0xff4400, 0.8);
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
        
        // Partículas de fogo
        for (let i = 0; i < 12; i++) {
            const particle = this.scene.add.circle(this.x, this.y, 4, 0xff6600, 0.9);
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + vx,
                y: particle.y + vy,
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }
        
        // Som de explosão (se você tiver áudio)
        // this.scene.sound.play('explosion');
    }
}