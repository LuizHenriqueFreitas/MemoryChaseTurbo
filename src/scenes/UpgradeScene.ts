/**
 * ============================================================================
 *  UpgradeScene.ts — LOJA DE UPGRADES
 * ============================================================================
 *
 *  Onde o jogador GASTA os pontos acumulados (totalPoints) para comprar
 *  melhorias permanentes: vidas extras, campo magnético, escudo e Espaço-Tempo.
 *  Os custos e benefícios vêm todos das funções de SaveData.ts (a "economia").
 *
 *  Destaques de implementação:
 *    • SCROLL próprio: os cards ficam num container que pode ser rolado tanto
 *      pela roda do mouse quanto por arraste (drag), pois podem ultrapassar a
 *      altura da tela.
 *    • Compra → grava o save e dá `scene.restart()` para redesenhar preços e
 *      níveis. Um pequeno truque restaura a posição do scroll após o restart,
 *      para o jogador não "voltar ao topo" a cada compra.
 * ============================================================================
 */

import { Scene } from 'phaser';
import { CONFIG } from '../utils/constants';
import {
    loadSave,
    saveSave, 
    getHealthUpgradeCost, 
    getMagnetUpgradeCost, 
    getShieldUpgradeCost, 
    getShieldDuration,
    getShieldSpawnChance,
    getTimeWarpUpgradeCost,
    getTimeWarpDuration,
    getTimeWarpSpawnChance
} from '../utils/SaveData';

export class UpgradeScene extends Scene {
    private saveData: any;
    private totalPointsText!: Phaser.GameObjects.Text;
    private container!: Phaser.GameObjects.Container;
    private scrollY: number = 0;
    private maxScroll: number = 0;
    private isDragging: boolean = false;
    private dragStartY: number = 0;
    private containerStartY: number = 0;

    constructor() {
        super('UpgradeScene');
    }

    /**
     * Monta a loja: fundo estrelado, título, carteira, os cards de upgrade
     * dentro de um container rolável, e configura os controles de scroll
     * (roda do mouse + arraste) e o botão Voltar.
     */
    create() {
        this.saveData = loadSave();

        // Fundo escuro com estrelas
        this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x0a0a2a).setOrigin(0);
        for (let i = 0; i < 100; i++) {
            this.add.circle(Phaser.Math.Between(0, CONFIG.WIDTH), Phaser.Math.Between(0, CONFIG.HEIGHT), 1, 0xffffff, 0.5);
        }

        // Título
        this.add.text(CONFIG.WIDTH / 2, 50, '🛒 LOJA DE UPGRADES', { 
            fontSize: '42px', 
            color: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Carteira no canto superior direito
        this.totalPointsText = this.add.text(CONFIG.WIDTH - 20, 20, `💰 ${this.saveData.totalPoints}`, { 
            fontSize: '28px', 
            color: '#ffd966', 
            backgroundColor: '#000000aa', 
            padding: { x: 10, y: 5 } 
        }).setOrigin(1, 0);

        // Container para os cards
        this.container = this.add.container(0, 120);
        
        // Criar todos os cards
        this.createUpgradeCards();
        
        // Configurar scroll com mouse wheel.
        // `scrollY` é limitado ao intervalo [0, maxScroll] com Math.max/min
        // (técnica de "clamp"), e a posição do container é ajustada a partir
        // dele. 120 é o deslocamento inicial (espaço para título/carteira).
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            this.scrollY += deltaY * 0.5;
            this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScroll));
            this.container.y = 120 - this.scrollY;
        });
        
        // Configurar drag para scroll
        this.input.on('pointerdown', (pointer: any) => {
            this.isDragging = true;
            this.dragStartY = pointer.y;
            this.containerStartY = this.container.y;
        });
        
        this.input.on('pointermove', (pointer: any) => {
            if (this.isDragging) {
                const deltaY = pointer.y - this.dragStartY;
                let newY = this.containerStartY + deltaY;
                newY = Math.max(120 - this.maxScroll, Math.min(120, newY));
                this.container.y = newY;
                this.scrollY = 120 - newY;
            }
        });
        
        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        // Botão voltar
        const backBtn = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 30, '← VOLTAR AO MENU', { 
            fontSize: '28px', 
            color: '#fff', 
            backgroundColor: '#333', 
            padding: { x: 20, y: 10 } 
        }).setOrigin(0.5).setInteractive();
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    /**
     * Cria os quatro cards de upgrade, empilhados verticalmente. Cada card
     * consulta o nível atual no save e as funções de custo/benefício de
     * SaveData.ts. Ao final, calcula a altura total e o `maxScroll` (o quanto
     * dá para rolar) com base no conteúdo que excede a área visível.
     */
    private createUpgradeCards() {
        let currentY = 0;
        const spacing = 120; // ← REDUZIDO de 150 para 120 (gap menor)
        
        // 1. CARD - Vidas Extras
        this.createUpgradeCard(
            currentY,
            '❤️ VIDAS EXTRAS',
            `Nível ${this.saveData.healthUpgradeLevel}/5`,
            `+1 vida por nível`,
            getHealthUpgradeCost(this.saveData.healthUpgradeLevel),
            () => this.buyHealthUpgrade()
        );
        currentY += spacing;
        
        // 2. CARD - Magnetismo
        this.createUpgradeCard(
            currentY,
            '🧲 CAMPO MAGNÉTICO',
            `Nível ${this.saveData.magnetLevel}/4`,
            `+2% de raio de atração por nível`,
            getMagnetUpgradeCost(this.saveData.magnetLevel),
            () => this.buyMagnetUpgrade()
        );
        currentY += spacing;
        
        // 3. CARD - Escudo
        const shieldChance = getShieldSpawnChance(this.saveData.shieldLevel);
        const shieldDuration = getShieldDuration(this.saveData.shieldLevel);
        this.createUpgradeCard(
            currentY,
            '🛡️ ESCUDO PROTETOR',
            `Nível ${this.saveData.shieldLevel}/3`,
            `📊 Chance: ${shieldChance}%\n⏱️ Duração: ${shieldDuration}s`,
            getShieldUpgradeCost(this.saveData.shieldLevel),
            () => this.buyShieldUpgrade()
        );
        currentY += spacing;
        
        // 4. CARD - TimeWarp (Espaço-Tempo)
        const timeWarpChance = getTimeWarpSpawnChance(this.saveData.timeWarpLevel);
        const timeWarpDuration = getTimeWarpDuration(this.saveData.timeWarpLevel);
        this.createUpgradeCard(
            currentY,
            '⏰ ESPAÇO-TEMPO',
            `Nível ${this.saveData.timeWarpLevel}/3`,
            `📊 Chance: ${timeWarpChance}%\n⏱️ Duração: ${timeWarpDuration}s\n⭐ Multiplicador: x5 pontos`,
            getTimeWarpUpgradeCost(this.saveData.timeWarpLevel),
            () => this.buyTimeWarpUpgrade()
        );
        currentY += spacing + 50;
        
        // Atualiza altura do container
        this.container.height = currentY;
        
        // Atualiza maxScroll
        this.maxScroll = Math.max(0, this.container.height - (CONFIG.HEIGHT - 180));
    }

    /**
     * Fábrica genérica de um card de upgrade. Recebe o conteúdo (título, nível,
     * descrição, preço) e um callback `onBuy` executado ao clicar em COMPRAR.
     *
     * Lógica de estado do botão:
     *   • price === -1  → nível MÁXIMO: mostra "MAXIMIZADO" (sem botão).
     *   • pode pagar    → botão verde e clicável.
     *   • não pode pagar→ botão acinzentado e desativado.
     * `canAfford` cruza o preço com a carteira para decidir isso.
     */
    private createUpgradeCard(
        y: number,
        title: string,
        levelText: string,
        description: string,
        price: number,
        onBuy: () => void
    ) {
        const cardWidth = 520;
        const cardHeight = 110; // ← REDUZIDO de 130 para 110
        const cardX = CONFIG.WIDTH / 2 - cardWidth / 2;
        
        // Fundo do card
        const bg = this.add.rectangle(cardX, y, cardWidth, cardHeight, 0x1a1a3a, 0.95);
        bg.setStrokeStyle(2, 0x88aaff);
        bg.setOrigin(0, 0);
        this.container.add(bg);
        
        // Ícone e título
        const titleText = this.add.text(cardX + 20, y + 12, title, { 
            fontSize: '24px', 
            color: '#ffaa44',
            fontStyle: 'bold'
        });
        this.container.add(titleText);
        
        // Nível
        const level = this.add.text(cardX + 20, y + 42, levelText, { 
            fontSize: '16px', 
            color: '#ccc' 
        });
        this.container.add(level);
        
        // Descrição
        const desc = this.add.text(cardX + 20, y + 68, description, { 
            fontSize: '13px', 
            color: '#aaa',
            wordWrap: { width: 280 }
        });
        this.container.add(desc);
        
        // Preço
        const canAfford = price !== -1 && this.saveData.totalPoints >= price;
        const priceColor = price === -1 ? '#ffaa44' : (canAfford ? '#44ff44' : '#ff4444');
        const priceText = price === -1 ? 'MAX' : `${price}💰`;
        const priceLabel = this.add.text(cardX + cardWidth - 20, y + 35, priceText, { 
            fontSize: '22px', 
            color: priceColor,
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        this.container.add(priceLabel);
        
        // Botão Comprar
        if (price !== -1 && price > 0) {
            const buyBtn = this.add.text(cardX + cardWidth - 20, y + 75, 'COMPRAR', { 
                fontSize: '18px', 
                color: canAfford ? '#0f0' : '#888', 
                backgroundColor: '#000', 
                padding: { x: 12, y: 4 } 
            }).setOrigin(1, 0.5).setInteractive();
            
            if (canAfford) {
                buyBtn.on('pointerdown', () => {
                    onBuy();
                });
            } else {
                buyBtn.disableInteractive();
            }
            this.container.add(buyBtn);
        } else if (price === -1) {
            const maxText = this.add.text(cardX + cardWidth - 20, y + 75, 'MAXIMIZADO', { 
                fontSize: '16px', 
                color: '#ffaa44' 
            }).setOrigin(1, 0.5);
            this.container.add(maxText);
        }
    }

    /** Exibe uma mensagem temporária (ex.: "Pontos insuficientes!") por 2s. */
    private showMessage(msg: string) {
        const message = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 80, msg, { 
            fontSize: '24px', 
            color: '#ffaa44', 
            backgroundColor: '#000', 
            padding: { x: 15, y: 8 } 
        }).setOrigin(0.5);
        this.time.delayedCall(2000, () => message.destroy());
    }

    /**
     * Compra de "vidas extras". É o MODELO seguido pelas demais compras:
     *   1. Bloqueia se já estiver no nível máximo.
     *   2. Verifica se há pontos suficientes; senão, avisa.
     *   3. Debita o custo, incrementa o nível e SALVA.
     *   4. Reinicia a cena para redesenhar, restaurando a posição do scroll
     *      logo depois (delayedCall de 50ms), para a experiência não "saltar".
     */
    private buyHealthUpgrade() {
        const level = this.saveData.healthUpgradeLevel;
        if (level >= 5) {
            this.showMessage('Nível máximo atingido!');
            return;
        }
        const cost = getHealthUpgradeCost(level);
        if (this.saveData.totalPoints >= cost) {
            this.saveData.totalPoints -= cost;
            this.saveData.healthUpgradeLevel++;
            saveSave(this.saveData);
            // ✅ MANTÉM A POSIÇÃO DO SCROLL
            const currentScrollY = this.scrollY;
            this.scene.restart();
            // Pequeno delay para restaurar o scroll após reiniciar
            this.time.delayedCall(50, () => {
                if (this.container) {
                    this.scrollY = currentScrollY;
                    this.container.y = 120 - currentScrollY;
                }
            });
        } else {
            this.showMessage('Pontos insuficientes!');
        }
    }

    /** Compra do campo magnético (mesmo fluxo de buyHealthUpgrade). */
    private buyMagnetUpgrade() {
        const level = this.saveData.magnetLevel;
        const cost = getMagnetUpgradeCost(level);
        if (this.saveData.totalPoints >= cost) {
            this.saveData.totalPoints -= cost;
            this.saveData.magnetLevel++;
            saveSave(this.saveData);
            const currentScrollY = this.scrollY;
            this.scene.restart();
            this.time.delayedCall(50, () => {
                if (this.container) {
                    this.scrollY = currentScrollY;
                    this.container.y = 120 - currentScrollY;
                }
            });
        } else {
            this.showMessage('Pontos insuficientes!');
        }
    }

    /** Compra do escudo (mesmo fluxo, com teto no nível 3). */
    private buyShieldUpgrade() {
        const level = this.saveData.shieldLevel;
        if (level >= 3) {
            this.showMessage('Nível máximo atingido!');
            return;
        }
        const cost = getShieldUpgradeCost(level);
        if (this.saveData.totalPoints >= cost) {
            this.saveData.totalPoints -= cost;
            this.saveData.shieldLevel++;
            saveSave(this.saveData);
            const currentScrollY = this.scrollY;
            this.scene.restart();
            this.time.delayedCall(50, () => {
                if (this.container) {
                    this.scrollY = currentScrollY;
                    this.container.y = 120 - currentScrollY;
                }
            });
        } else {
            this.showMessage('Pontos insuficientes!');
        }
    }

    /** Compra do Espaço-Tempo (mesmo fluxo, com teto no nível 3). */
    private buyTimeWarpUpgrade() {
        const level = this.saveData.timeWarpLevel;
        if (level >= 3) {
            this.showMessage('Nível máximo atingido!');
            return;
        }
        const cost = getTimeWarpUpgradeCost(level);

        if (this.saveData.totalPoints >= cost) {
            this.saveData.totalPoints -= cost;
            this.saveData.timeWarpLevel++;
            saveSave(this.saveData);
            const currentScrollY = this.scrollY;
            this.scene.restart();
            this.time.delayedCall(50, () => {
                if (this.container) {
                    this.scrollY = currentScrollY;
                    this.container.y = 120 - currentScrollY;
                }
            });
        } else {
            this.showMessage(`Pontos insuficientes! Necessário: ${cost} pontos`);
        }
    }
}