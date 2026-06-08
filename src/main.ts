/**
 * ============================================================================
 *  main.ts — PONTO DE ENTRADA DO JOGO
 * ============================================================================
 *
 *  Este é o primeiro arquivo executado quando o jogo carrega no navegador
 *  (ou dentro do Electron). Sua responsabilidade é simples, porém central:
 *  CRIAR a instância do motor Phaser com a configuração desejada.
 *
 *  Tudo o que o Phaser precisa saber para "ligar" o jogo está no objeto
 *  `config` abaixo: tamanho da tela, motor de física, ordem das cenas e
 *  como o desenho (render) deve ser feito.
 *
 *  Conceito-chave: em Phaser, o jogo é dividido em CENAS (Scene). Cada cena
 *  é uma "tela" independente (menu, gameplay, loja, etc.). O array `scene`
 *  define quais cenas existem e qual a ordem de carregamento — a PRIMEIRA
 *  da lista (BootScene) é a que inicia automaticamente.
 * ============================================================================
 */

import { Game } from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { WeaponSelectScene } from './scenes/WeaponSelectScene';

/**
 * Objeto de configuração global do Phaser.
 * É aqui que definimos as "regras da casa" para o motor do jogo.
 */
const config: Phaser.Types.Core.GameConfig = {
    // AUTO: deixa o Phaser escolher entre WebGL (mais rápido) e Canvas
    // (fallback), dependendo do que o navegador suporta.
    type: Phaser.AUTO,

    // Resolução interna do jogo, em pixels. Todas as coordenadas usadas
    // no código assumem este "palco" de 800x600.
    width: 800,
    height: 600,

    // Configuração do motor de física.
    physics: {
        // 'arcade' é o motor mais simples e leve do Phaser — ideal para jogos
        // 2D baseados em retângulos de colisão (caixas), como este.
        default: 'arcade',
        arcade: {
            // Sem gravidade: o jogo é visto "de cima" (top-down), então nada
            // cai sozinho. Cada objeto controla a própria velocidade.
            gravity: {x: 0, y: 0},
            // debug: true desenharia as caixas de colisão na tela. Útil ao
            // desenvolver; aqui fica desligado para a versão final.
            debug: false
        }
    },

    // Lista de TODAS as cenas do jogo. A ordem importa: a primeira (BootScene)
    // é iniciada automaticamente assim que o jogo liga.
    scene: [BootScene, MenuScene, GameScene, UpgradeScene, WeaponSelectScene],

    render: {
        // pixelArt: true desativa a suavização (anti-aliasing) das imagens.
        // Isso mantém os sprites com as bordas "quadradinhas", preservando o
        // visual retrô/pixelado característico do jogo.
        pixelArt: true
    }
};

// Cria e inicia o jogo. A partir daqui, o Phaser assume o controle do loop
// principal (atualizar -> desenhar -> repetir, ~60 vezes por segundo).
new Game(config);
