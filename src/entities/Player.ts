/**
 * ============================================================================
 *  Player.ts — O JOGADOR (A NAVE / "FIAT UNO VOADOR")
 * ============================================================================
 *
 *  A entidade mais importante e rica do jogo. Concentra:
 *    • MOVIMENTO em 8 direções (setas + WASD), com normalização da diagonal.
 *    • TIRO direcional, delegando o "como atira" ao WeaponSystem.
 *    • PODERES temporários: Escudo (reflete balas) e Espaço-Tempo (x5 pontos).
 *    • MAGNETISMO: raio que atrai moedas (a atração em si roda na GameScene).
 *    • Sistema de DANO com invencibilidade temporária e feedback visual
 *      (troca de frame, tint vermelho e "piscar").
 *
 *  Os valores iniciais (vida, magnetismo, arma) vêm do save, refletindo os
 *  upgrades comprados na loja. Assim o progresso persistente "entra" no jogo.
 * ============================================================================
 */

import { Scene } from 'phaser';
import { WeaponSystem } from '../utils/WeaponSystem';
import { AudioManager } from '../utils/AudioManager';

export class Player extends Phaser.Physics.Arcade.Sprite {
    // ---- Estado público (lido pela GameScene para desenhar HUD e resolver colisões) ----
    public bullets: Phaser.Physics.Arcade.Group;  // Grupo com as balas disparadas
    public health: number;                         // Vida atual
    public maxHealth: number;                      // Vida máxima (3 + upgrades)
    public isInvincible: boolean;                  // Imune a dano agora?
    public magnetRadius: number;                   // Raio de atração de moedas (px)
    public magnetLevel: number;                    // Nível do magnetismo
    public hasShield: boolean = false;             // Escudo ativo?
    public shieldEndTime: number = 0;              // Instante (ms) em que o escudo acaba
    public isTimeWarpActive: boolean = false;      // Espaço-Tempo ativo?
    public timeWarpEndTime: number = 0;            // Instante (ms) em que o Espaço-Tempo acaba

    // ---- Estado interno ----
    private audioManager!: AudioManager;
    private currentWeaponLevel: number = 0;        // Índice da arma equipada
    private weaponCooldown: number = 0;            // (reservado) recarga da arma
    private shieldCircle: Phaser.GameObjects.Arc | null = null;       // Visual do escudo
    private timeWarpEffect: Phaser.GameObjects.Graphics | null = null; // Visual do Espaço-Tempo
    private lastShot: number;                       // Instante do último tiro (controla cadência)
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;  // Setas
    private wasd!: {                                            // Teclas WASD
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };
    private spaceKey!: Phaser.Input.Keyboard.Key;   // Espaço = atirar
    private baseMagnetRadius: number = 70;          // Raio de magnetismo sem upgrades

    private lastMoveDirection: number = 1;          // Última direção horizontal (-1 esq, 1 dir) — controla o flip
    private isMoving: boolean = false;              // Está se movendo neste frame?
    private isMovingBack: boolean = false;          // Está descendo (movendo "para trás")?

    // Sprites para diferentes estados
    private isDamaged: boolean = false;             // Está mostrando o visual de dano?
    private damageFrameActive: boolean = false;     // Frame de dano travado temporariamente?

    constructor(scene: Scene, x: number, y: number, maxHealth: number = 3, magnetLevel: number = 0, weaponLevel: number = 0) {
        super(scene, x, y, 'game_sprites', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Inicializa o AudioManager
        this.audioManager = new AudioManager(scene);

        this.setCollideWorldBounds(true);   // Não sai pelas bordas da tela
        this.setScale(2);
        this.body!.setSize(28, 28);

        // Aplica os atributos vindos do save (upgrades).
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.isInvincible = false;
        this.magnetLevel = magnetLevel;
        // Cada nível de magnetismo soma +2% ao raio base.
        this.magnetRadius = this.baseMagnetRadius * (1 + 0.02 * magnetLevel);
        this.currentWeaponLevel = weaponLevel;
        this.lastShot = 0;

        this.bullets = scene.physics.add.group();

        // Registra TODAS as teclas de controle. Suportamos setas e WASD ao
        // mesmo tempo para conforto do jogador.
        if (scene.input && scene.input.keyboard) {
            const keyboard = scene.input.keyboard;
            this.cursors = keyboard.createCursorKeys();
            this.wasd = {
                up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
            this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }
    }

    /**
     * Escolhe o FRAME de animação conforme o estado de movimento:
     *   • frame 2 → descendo ("de costas");
     *   • frame 1 → movendo-se lateralmente (com flip horizontal conforme a direção);
     *   • frame 0 → parado.
     * Se o spritesheet não tiver frames suficientes, cai num fallback por tint.
     */
    private updateAnimation() {
        // Enquanto o sprite de dano está visível, não deixa o movimento sobrescrever o frame
        if (this.damageFrameActive) return;

        const texture = this.scene.textures.get('game_sprites');

        if (!texture || texture.frameTotal < 3) {
            this.updateAnimationFallback();
            return;
        }

        let targetFrame = 0;

        if (this.isMovingBack) {
            targetFrame = 2;
        } else if (this.isMoving) {
            targetFrame = 1;
            // setFlipX espelha o sprite para "olhar" para a esquerda.
            if (this.lastMoveDirection === -1) {
                this.setFlipX(true);
            } else {
                this.setFlipX(false);
            }
        } else {
            this.setFlipX(false);
        }

        // Só troca o frame se for diferente do atual (micro-otimização).
        const currentFrame = parseInt(this.frame?.name || '0');
        if (currentFrame !== targetFrame) {
            this.setFrame(targetFrame);
        }
    }

    /** Plano B de animação quando não há frames extras: muda a cor (tint). */
    private updateAnimationFallback() {
        if (this.isMovingBack) {
            this.setTint(0x88aaff);
        } else if (this.isMoving) {
            this.setTint(0xffaa88);
        } else {
            this.clearTint();
        }

        if (this.isMoving && this.lastMoveDirection === -1) {
            this.setFlipX(true);
        } else if (!this.isMoving || this.lastMoveDirection === 1) {
            this.setFlipX(false);
        }
    }

    // ==================== SHIELD (ESCUDO) ====================

    /**
     * Ativa o escudo por `durationSeconds`. Guarda o INSTANTE de término
     * (tempo atual + duração) e cria o círculo azul ao redor da nave.
     */
    public activateShield(durationSeconds: number) {
        this.hasShield = true;
        this.shieldEndTime = this.scene.time.now + durationSeconds * 1000;

        if (this.shieldCircle) this.shieldCircle.destroy();
        this.shieldCircle = this.scene.add.circle(this.x, this.y, 32, 0x44ccff, 0.3);
        this.shieldCircle.setStrokeStyle(3, 0x44ccff);

        this.audioManager.playSfx('powerUp', 0.8);
    }

    /**
     * Mantém o círculo do escudo grudado na nave e o desativa quando o tempo
     * expira. Chamado a cada frame por update().
     */
    public updateShield() {
        if (!this.hasShield) return;

        if (this.shieldCircle) {
            this.shieldCircle.setPosition(this.x, this.y);
        }

        if (this.scene.time.now >= this.shieldEndTime) {
            this.deactivateShield();
        }
    }

    /** Remove o escudo e seu visual. */
    public deactivateShield() {
        this.hasShield = false;
        if (this.shieldCircle) {
            this.shieldCircle.destroy();
            this.shieldCircle = null;
        }
    }

    /**
     * REFLEXÃO de bala pelo escudo: inverte o vetor velocidade da bala
     * (multiplica X e Y por -1), fazendo-a voltar na direção de onde veio, e a
     * pinta de azul. Retorna true se houve reflexão (escudo ativo).
     */
    public reflectBullet(bullet: any) {
        if (!this.hasShield) return false;

        if (bullet.body) {
            bullet.setVelocity(-bullet.body.velocity.x, -bullet.body.velocity.y);
        }
        bullet.setTint(0x44ccff);

        return true;
    }

    // ==================== TIME WARP (ESPAÇO-TEMPO) ====================

    /** Ativa o multiplicador x5 por `durationSeconds` e cria o anel magenta. */
    public activateTimeWarp(durationSeconds: number) {
        this.isTimeWarpActive = true;
        this.timeWarpEndTime = this.scene.time.now + durationSeconds * 1000;

        if (this.timeWarpEffect) this.timeWarpEffect.destroy();
        this.timeWarpEffect = this.scene.add.graphics();
        this.timeWarpEffect.lineStyle(3, 0xff44ff, 0.8);
        this.timeWarpEffect.strokeCircle(0, 0, 38);

        this.audioManager.playSfx('powerUp', 0.8);
    }

    /** Mantém o anel grudado na nave e desativa o poder quando o tempo acaba. */
    public updateTimeWarp() {
        if (!this.isTimeWarpActive) return;

        if (this.timeWarpEffect) {
            this.timeWarpEffect.setPosition(this.x, this.y);
        }

        if (this.scene.time.now >= this.timeWarpEndTime) {
            this.deactivateTimeWarp();
        }
    }

    /** Desliga o Espaço-Tempo e remove o visual. */
    public deactivateTimeWarp() {
        this.isTimeWarpActive = false;
        if (this.timeWarpEffect) {
            this.timeWarpEffect.destroy();
            this.timeWarpEffect = null;
        }
    }

    /**
     * Multiplicador de pontos atual: 5 enquanto o Espaço-Tempo estiver ativo,
     * 1 caso contrário. A GameScene consulta isto ao somar pontos.
     */
    public getScoreMultiplier(): number {
        return this.isTimeWarpActive ? 5 : 1;
    }

    // ==================== MAGNET (MAGNETISMO) ====================

    /** Recalcula o raio de atração ao mudar o nível (+2% por nível). */
    public updateMagnetLevel(level: number) {
        this.magnetLevel = level;
        this.magnetRadius = this.baseMagnetRadius * (1 + 0.02 * level);
    }

    public getMagnetLevel(): number {
        return this.magnetLevel;
    }

    // ==================== UPDATE (LOOP POR FRAME) ====================

    /**
     * Chamado a cada frame pela GameScene. Orquestra, nesta ordem: poderes
     * ativos (escudo / espaço-tempo), movimento e tiro.
     */
    update() {
        if (!this.scene.input || !this.scene.input.keyboard) return;

        this.updateShield();
        this.updateTimeWarp();
        this.handleMovement();
        this.handleShoot();
    }

    // ==================== MOVEMENT (MOVIMENTO) ====================

    /**
     * Lê o teclado e define a velocidade da nave.
     *
     * Ponto técnico importante (DIAGONAL): se o jogador anda na diagonal
     * (X e Y ao mesmo tempo), multiplicamos ambas as componentes por ~0.707
     * (= 1/√2). Sem isso, o movimento diagonal seria mais RÁPIDO que o reto
     * (a soma de dois vetores de mesma magnitude tem comprimento √2 maior).
     * Essa correção mantém a velocidade constante em qualquer direção.
     */
    private handleMovement() {
        let vx = 0;
        let vy = 0;
        const speed = 320;

        this.isMoving = false;
        this.isMovingBack = false;

        if (this.cursors.left?.isDown || this.wasd.left.isDown) {
            vx = -speed;
            this.isMoving = true;
            this.lastMoveDirection = -1;
        } else if (this.cursors.right?.isDown || this.wasd.right.isDown) {
            vx = speed;
            this.isMoving = true;
            this.lastMoveDirection = 1;
        }

        if (this.cursors.up?.isDown || this.wasd.up.isDown) {
            vy = -speed;
            this.isMoving = true;
        } else if (this.cursors.down?.isDown || this.wasd.down.isDown) {
            vy = speed;
            this.isMoving = true;
            this.isMovingBack = true;
        }

        // Normalização da diagonal (ver explicação acima).
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.setVelocity(vx, vy);
        this.updateAnimation();
    }

    // ==================== SHOOT (TIRO) ====================

    /**
     * Verifica se deve atirar: tecla espaço pressionada E já passou o
     * "cooldown" (recarga) da arma desde o último tiro. O cooldown vem da
     * própria arma, então armas diferentes têm cadências diferentes.
     */
    private handleShoot() {
        const now = this.scene.time.now;
        const weapon = WeaponSystem.getWeapon(this.currentWeaponLevel);

        if (this.spaceKey?.isDown && now - this.lastShot > weapon.cooldown) {
            this.shoot();
            this.lastShot = now;
            this.audioManager.playSfx('shoot', 0.4);
        }
    }

    /**
     * Calcula a DIREÇÃO do tiro a partir das teclas pressionadas e delega o
     * disparo à arma equipada.
     *
     * Regras de mira (decididas para um bom "feel"):
     *   • Sem nada (ou descendo): atira para CIMA por padrão.
     *   • Esquerda/Direita: atira na horizontal; se também segurar Cima, vira
     *     diagonal para cima.
     *   • O vetor de direção é NORMALIZADO (dividido pelo comprimento) para que
     *     a velocidade do tiro não dependa de estar reto ou na diagonal.
     */
    private shoot() {
        let dirX = 0;
        let dirY = -1;

        const leftPressed = this.cursors.left?.isDown || this.wasd.left.isDown;
        const rightPressed = this.cursors.right?.isDown || this.wasd.right.isDown;
        const upPressed = this.cursors.up?.isDown || this.wasd.up.isDown;
        const downPressed = this.cursors.down?.isDown || this.wasd.down.isDown;

        if (downPressed) {
            // Mesmo descendo, o tiro vai para cima (mira "para frente").
            dirX = 0;
            dirY = -1;
        } else if (leftPressed && !rightPressed) {
            dirX = -1;
            dirY = upPressed ? -1 : 0;
        } else if (rightPressed && !leftPressed) {
            dirX = 1;
            dirY = upPressed ? -1 : 0;
        } else if (upPressed) {
            dirX = 0;
            dirY = -1;
        }

        // Normaliza o vetor (dirX, dirY). Se por acaso ficou (0,0), força "cima".
        let len = Math.hypot(dirX, dirY);
        if (len === 0) { dirX = 0; dirY = -1; len = 1; }
        dirX /= len;
        dirY /= len;

        // Delega ao WeaponSystem: a arma sabe criar o(s) projétil(eis).
        const weapon = WeaponSystem.getWeapon(this.currentWeaponLevel);
        weapon.shoot(this.scene, this.x, this.y, dirX, dirY, this.bullets);
    }

    // ==================== DAMAGE (DANO) ====================

    /**
     * Liga/desliga o "visual de dano". Tenta usar uma textura danificada
     * dedicada; se não existir, recorre a um tint avermelhado.
     */
    private setDamagedSprite(visible: boolean) {
        if (visible && !this.isDamaged) {
            // Tenta mudar para sprite danificado se existir
            if (this.scene.textures.exists('game_sprites_damaged')) {
                this.setTexture('game_sprites_damaged', 0);
            } else {
                this.setTint(0xff6666);
            }
            this.isDamaged = true;
        } else if (!visible && this.isDamaged) {
            if (this.scene.textures.exists('game_sprites')) {
                this.setTexture('game_sprites', 0);
            }
            this.clearTint();
            this.isDamaged = false;
        }
    }

    /** Mostra o visual danificado por um curto período e depois o remove. */
    public showDamagedSprite(duration: number = 200) {
        this.setDamagedSprite(true);
        this.scene.time.delayedCall(duration, () => {
            if (this.active) {
                this.setDamagedSprite(false);
            }
        });
    }

    /**
     * Aplica 1 de dano ao jogador — com várias proteções:
     *   • Ignora se estiver invencível ou com escudo.
     *   • Reduz a vida (sem deixar passar de 0).
     *   • Dispara feedback visual (frame de dano + tint) e som.
     *   • Se zerou a vida, destrói a nave; senão, entra em invencibilidade
     *     temporária para o jogador não levar dano em sequência ("i-frames").
     */
    public takeDamage() {
        if (this.isInvincible) return;
        if (this.hasShield) {
            return;
        }

        this.health = Math.max(0, this.health - 1);

        // Efeito visual imediato: sprite de dano (frame 8) + tint vermelho
        this.showDamageFrame();
        this.setTint(0xff8888);
        this.scene.time.delayedCall(200, () => {
            if (this.active) this.clearTint();
        });

        // Som de dano
        this.audioManager.playSfx('hit', 0.7);

        if (this.health <= 0) {
            this.destroy();
        } else {
            this.startInvincibility();
        }
    }

    /** Mostra o sprite de dano (frame 8) por um curto período como feedback visual */
    private showDamageFrame(duration: number = 250) {
        this.damageFrameActive = true;
        this.setFrame(8);
        this.scene.time.delayedCall(duration, () => {
            if (this.active) {
                this.damageFrameActive = false;
                this.setFrame(0);
            }
        });
    }

    /**
     * Janela de INVENCIBILIDADE ("invincibility frames"). Durante ~0,5s após
     * tomar dano, o jogador não pode ser atingido de novo, e a nave PISCA
     * (alternando o sprite danificado) para sinalizar esse estado.
     *
     * São três temporizadores trabalhando juntos:
     *   • Um evento repetido (a cada 150ms, 10 vezes) que faz o piscar.
     *   • Um delay de 100ms que aplica um tint avermelhado.
     *   • Um delay de 500ms que ENCERRA a invencibilidade e limpa os efeitos.
     */
    private startInvincibility() {
        this.isInvincible = true;

        // Pisca durante invencibilidade
        let blinkCount = 0;
        const blinkInterval = this.scene.time.addEvent({
            delay: 150,
            callback: () => {
                if (!this.active || !this.isInvincible) {
                    blinkInterval.remove();
                    return;
                }
                if (blinkCount % 2 === 0) {
                    this.setDamagedSprite(true);
                } else {
                    this.setDamagedSprite(false);
                }
                blinkCount++;
            },
            repeat: 9
        });

        this.scene.time.delayedCall(100, () => {
            if (this.active && this.isInvincible) {
                this.setTint(0xff6666);
            }
        });

        this.scene.time.delayedCall(500, () => {
            if (this.active) {
                this.isInvincible = false;
                this.clearTint();
                this.setDamagedSprite(false);
            }
        });
    }
}
