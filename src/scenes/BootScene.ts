import { Scene } from 'phaser';
import { CONFIG } from '../utils/constants';

export class BootScene extends Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload(){
        console.log('🎵 Iniciando carregamento de áudios...');
        
        // Carrega os efeitos sonoros
        this.load.audio('click', 'assets/sfx/blipSelect.mp3');
        this.load.audio('explosion', 'assets/sfx/explosion.mp3');
        this.load.audio('hit', 'assets/sfx/hitHurt.mp3');
        this.load.audio('shoot', 'assets/sfx/laserShoot.mp3');
        this.load.audio('coin', 'assets/sfx/pickupCoin.mp3');
        this.load.audio('powerup', 'assets/sfx/powerUp.mp3');
        this.load.audio('bgm', 'assets/musicas/gameplaySong.wav');
        
        // Monitora cada arquivo carregado
        this.load.on('load', (file: any) => {
            if (file.type === 'audio') {
                console.log(`✅ Áudio carregado: ${file.key} - ${file.url}`);
            }
        });
        
        // Monitora erros de carregamento
        this.load.on('loaderror', (file: any) => {
            if (file.type === 'audio') {
                console.error(`❌ ERRO ao carregar áudio: ${file.key} - ${file.url}`);
            }
        });
        
        // Quando todos os arquivos terminarem
        this.load.on('complete', () => {
            console.log('📋 Todos os arquivos carregados!');
        });
        this.load.image('concept_art', 'assets/imagemConceitual.png');
        this.load.image('background', 'assets/imagemFundoGameplay.png');
        this.load.spritesheet('game_sprites', 'assets/spritesheet.png',{
            frameWidth: 32,
            frameHeight: 32,
            spacing: 0,
            margin: 0
        });

        this.createFallbackTextures();
    }

    private createFallbackTextures() {
        // Gera texturas simples (placeholders coloridos)
        this.createPlaceholder('player', 0x00ff00, 32, 32);
        this.createPlaceholder('player_white', 0xffffff, 32, 32);  // para efeito de dano
        // Inimigos (um para cada tipo)
        this.createPlaceholder('enemy_walker', 0xdddddd, 32, 32);   // branco/cinza
        this.createPlaceholder('enemy_shooter', 0xff4444, 32, 32);  // vermelho
        this.createPlaceholder('enemy_chaser', 0xff8800, 32, 32);   // laranja

        //coletaveis
        this.createPlaceholder('coin', 0xffcc00, 22, 22);
        this.createPlaceholder('shield_item', 0x44ccff, 32, 32);
        this.createPlaceholder('shield_border', 0x44ccff, 36, 36);
        this.createPlaceholder('timewarp_item', 0xff44ff, 32, 32);
        this.createPlaceholder('bullet', 0xffffff, 8, 8);
        this.createPlaceholder('enemyBullet', 0xff8800, 8, 8);
        this.createPlaceholder('bg', 0x111122, CONFIG.WIDTH, CONFIG.HEIGHT);
    }

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

    create() {
        if (this.textures.exists('game_sprites')) {
            console.log('✅ Spritesheet carregado com sucesso!');
        } else {
            console.warn('⚠️ Spritesheet não encontrado, usando fallbacks');
        }

        this.scene.start('MenuScene');
    }
}