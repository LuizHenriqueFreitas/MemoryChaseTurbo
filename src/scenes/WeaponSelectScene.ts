/**
 * ============================================================================
 *  WeaponSelectScene.ts — TELA DE SELEÇÃO DE ARMA
 * ============================================================================
 *
 *  Permite escolher qual das armas do WeaponSystem o jogador levará para a
 *  partida. A escolha é gravada em `weaponLevel` no save, então persiste entre
 *  sessões e é lida pelo Player ao iniciar o jogo.
 *
 *  Para cada arma do catálogo, monta-se um "card" com nome, descrição, uma
 *  prévia animada do projétil e um botão Equipar. O card da arma atualmente
 *  equipada aparece destacado (verde) e com o botão desativado.
 * ============================================================================
 */

import { Scene } from 'phaser';
import { CONFIG } from '../utils/constants';
import { WeaponSystem } from '../utils/WeaponSystem';
import { loadSave, saveSave } from '../utils/SaveData';

export class WeaponSelectScene extends Scene {
    private saveData: any;
    private selectedWeapon: number = 0;  // Índice da arma atualmente equipada

    constructor() {
        super('WeaponSelectScene');
    }

    /** Monta o fundo estrelado, o título, os cards de arma e o botão Voltar. */
    create() {
        this.saveData = loadSave();
        this.selectedWeapon = this.saveData.weaponLevel || 0;

        // Fundo
        this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x0a0a2a).setOrigin(0);
        
        // Estrelas de fundo
        for (let i = 0; i < 100; i++) {
            this.add.circle(Phaser.Math.Between(0, CONFIG.WIDTH), Phaser.Math.Between(0, CONFIG.HEIGHT), 1, 0xffffff, 0.3);
        }

        // Título
        this.add.text(CONFIG.WIDTH / 2, 35, '⚔️ SELECIONE SUA ARMA ⚔️', {
            fontSize: '32px',
            color: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Linha divisória
        this.add.line(CONFIG.WIDTH / 2, 70, 150, 0, CONFIG.WIDTH - 150, 0, 0x88aaff, 0.5).setOrigin(0.5);

        // Criar cards
        this.createWeaponCards();

        // Botão voltar
        const backBtn = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 35, '← VOLTAR AO MENU', {
            fontSize: '24px',
            color: '#fff',
            backgroundColor: '#000000aa',
            padding: { x: 25, y: 10 }
        }).setOrigin(0.5).setInteractive();
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
        backBtn.on('pointerover', () => backBtn.setColor('#ffcc00'));
        backBtn.on('pointerout', () => backBtn.setColor('#ffffff'));
    }

    /**
     * Gera um card para cada arma do catálogo (WeaponSystem.WEAPONS).
     *
     * Pontos de interesse:
     *   • `isSelected` controla o destaque visual (cor da borda/fundo, seta
     *     indicadora e o texto "✓ EQUIPADO" no botão).
     *   • A prévia do projétil (círculo + ícone) recebe um tween em loop
     *     infinito (`repeat: -1`, `yoyo: true`) para "pulsar" continuamente.
     *   • Ao Equipar, gravamos o índice em `weaponLevel` e damos `scene.restart()`
     *     para redesenhar a tela com o novo destaque.
     */
    private createWeaponCards() {
        const startY = 90;
        const spacing = 125;
        const cardWidth = 560;
        const cardHeight = 110;

        // Descrições atualizadas para refletir as novas funcionalidades
        const weaponDescriptions = [
            '🔫 ARMA PADRÃO\nTiros retos e rápidos\n⏱️ Cooldown: 250ms',
            '💥 ARMA CÔNICA\nAtaque em cone (3 tiros)\n⏱️ Cooldown: 400ms',
            '🧲 ARMA MAGNÉTICA\nBalas perseguidoras\n⏱️ Cooldown: 600ms'
        ];

        WeaponSystem.WEAPONS.forEach((weapon, index) => {
            const isSelected = this.selectedWeapon === index;
            const cardX = CONFIG.WIDTH / 2 - cardWidth / 2;
            const cardY = startY + (index * spacing);
            
            // Fundo do card
            const bg = this.add.rectangle(cardX, cardY, cardWidth, cardHeight, isSelected ? 0x2a4a2a : 0x1a1a3a, 0.95);
            bg.setStrokeStyle(2, isSelected ? 0x44ff44 : 0x88aaff);
            bg.setOrigin(0, 0);
            
            // Indicador de seleção (canto esquerdo)
            if (isSelected) {
                const selector = this.add.triangle(cardX + 12, cardY + cardHeight / 2, 0, -10, 16, 0, 0, 10, 0x44ff44, 1);
                selector.setOrigin(0, 0.5);
            }
            
            // Nome da arma
            this.add.text(cardX + 30, cardY + 14, weapon.name, {
                fontSize: '20px',
                color: '#ffaa44',
                fontStyle: 'bold'
            }).setOrigin(0, 0);
            
            // Descrição (usando as novas descrições)
            const descLines = weaponDescriptions[index].split('\n');
            let descY = cardY + 44;
            descLines.forEach(line => {
                const color = line.includes('💥') ? '#ffaa44' : (line.includes('🧲') ? '#44ff44' : '#ccc');
                this.add.text(cardX + 30, descY, line, {
                    fontSize: '11px',
                    color: color
                }).setOrigin(0, 0);
                descY += 16;
            });
            
            // Preview do tiro - círculo
            const previewCircle = this.add.circle(cardX + cardWidth - 55, cardY + 35, 22, weapon.bulletColor, 0.15);
            previewCircle.setStrokeStyle(2, weapon.bulletColor);
            
            // Preview do tiro - ícone
            let previewIcon = '';
            let previewIconSize = 20;
            if (index === 0) previewIcon = '💥';
            if (index === 1) previewIcon = '⋰';
            if (index === 2) previewIcon = '🎯';
            
            const previewText = this.add.text(cardX + cardWidth - 55, cardY + 33, previewIcon, {
                fontSize: `${previewIconSize}px`,
                color: '#fff'
            }).setOrigin(0.5);
            
            // Animação do preview
            this.tweens.add({
                targets: [previewCircle, previewText],
                scaleX: 1.15,
                scaleY: 1.15,
                alpha: 0.8,
                duration: 600,
                yoyo: true,
                repeat: -1
            });
            
            // Botão Equipar
            const btnX = cardX + cardWidth - 70;
            const btnY = cardY + cardHeight - 28;
            
            const equipBtn = this.add.text(btnX, btnY, isSelected ? '✓ EQUIPADO' : 'EQUIPAR', {
                fontSize: '14px',
                color: isSelected ? '#0f0' : '#ff0',
                backgroundColor: '#000000aa',
                padding: { x: 14, y: 6 }
            }).setOrigin(0.5).setInteractive();
            
            if (!isSelected) {
                equipBtn.on('pointerover', () => equipBtn.setBackgroundColor('#333333'));
                equipBtn.on('pointerout', () => equipBtn.setBackgroundColor('#000000aa'));
                equipBtn.on('pointerdown', () => {
                    this.selectedWeapon = index;
                    this.saveData.weaponLevel = index;
                    saveSave(this.saveData);
                    this.scene.restart();
                });
            } else {
                equipBtn.disableInteractive();
            }
        });
    }
}