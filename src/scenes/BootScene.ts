/**
 * ============================================================================
 *  BootScene.ts — CENA DE CARREGAMENTO (BOOT)
 * ============================================================================
 *
 *  É a PRIMEIRA cena a rodar. Sua única missão é preparar todos os RECURSOS
 *  (assets) do jogo ANTES de qualquer tela aparecer, e então pular direto para
 *  o menu. Pense nela como a "tela de loading" do jogo.
 *
 *  Por que separar isso numa cena própria? Porque o carregamento de imagens e
 *  áudios é ASSÍNCRONO. O método `preload()` do Phaser enfileira os downloads;
 *  o Phaser só chama `create()` quando TUDO terminou de carregar. Garantimos
 *  assim que nenhuma cena tente usar um sprite que ainda não chegou.
 * ============================================================================
 */

import { Scene } from 'phaser';

export class BootScene extends Scene {
    constructor() { super({ key: 'BootScene' }); }

    /**
     * preload(): enfileira o download de TODOS os assets. Cada arquivo recebe
     * uma "chave" (string) pela qual será referenciado no resto do jogo.
     */
    preload() {
        // Efeitos sonoros
        this.load.audio('click', 'assets/sfx/blipSelect.mp3');
        this.load.audio('explosion', 'assets/sfx/explosion.mp3');
        this.load.audio('hit', 'assets/sfx/hitHurt.mp3');
        this.load.audio('shoot', 'assets/sfx/laserShoot.mp3');
        this.load.audio('coin', 'assets/sfx/pickupCoin.mp3');
        this.load.audio('powerup', 'assets/sfx/powerUp.mp3');
        this.load.audio('bgm', 'assets/musicas/gameplaySong.wav');

        // Imagens
        this.load.image('concept_art', 'assets/imagemConceitual.png');
        this.load.image('background', 'assets/imagemFundoGameplay.png');
        // SPRITESHEET: uma única imagem que contém vários "frames" de 32x32.
        // Informamos as dimensões de cada frame para o Phaser saber recortá-los.
        // Cada índice de frame corresponde a um personagem/item do jogo.
        this.load.spritesheet('game_sprites', 'assets/spritesheet.png', {
            frameWidth: 32,
            frameHeight: 32,
            spacing: 0,
            margin: 0
        });

        this.createBulletTextures();
    }

    /**
     * Cria as texturas dos projéteis EM TEMPO DE EXECUÇÃO (runtime), pois elas
     * não fazem parte do spritesheet. Geramos dois quadradinhos coloridos.
     */
    private createBulletTextures() {
        this.createPlaceholder('bullet', 0xffffff, 8, 8);        // Bala do jogador (branca)
        this.createPlaceholder('enemyBullet', 0xff8800, 8, 8);   // Bala inimiga (laranja)
    }

    /**
     * Desenha uma textura simples usando a API <canvas> do navegador e a
     * registra no Phaser sob a chave informada.
     *
     * Técnica: criamos um elemento <canvas> "fantasma" (não anexado à página),
     * desenhamos nele (fundo preto, miolo colorido, borda branca) e entregamos
     * esse canvas ao Phaser via `textures.addCanvas`. É uma forma prática de
     * gerar gráficos sem precisar de um arquivo de imagem.
     *
     * Detalhe: `color.toString(16).padStart(6, '0')` converte o número da cor
     * (ex.: 0xff8800) para o texto hexadecimal de 6 dígitos que o CSS espera
     * (ex.: "ff8800"), preenchendo com zeros à esquerda se necessário.
     */
    private createPlaceholder(key: string, color: number, w: number, h: number) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
            ctx.fillRect(2, 2, w - 4, h - 4);
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(1, 1, w - 2, h - 2);
        }

        this.textures.addCanvas(key, canvas);
    }

    /** Tudo carregado: avança para o menu principal. */
    create() {
        this.scene.start('MenuScene');
    }
}
