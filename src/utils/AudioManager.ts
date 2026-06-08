/**
 * ============================================================================
 *  AudioManager.ts — GERENCIADOR CENTRAL DE ÁUDIO
 * ============================================================================
 *
 *  Encapsula TODA a lógica de som do jogo numa única classe, evitando que cada
 *  cena/entidade chame `scene.sound.play(...)` diretamente. Responsabilidades:
 *
 *    • Tocar efeitos sonoros (SFX): tiro, explosão, moeda, dano, etc.
 *    • Tocar / pausar / retomar a música de fundo (BGM).
 *    • Lembrar a preferência do jogador (som ligado/desligado) entre sessões,
 *      guardando flags no `localStorage`.
 *
 *  Conceito-chave: cada cena cria seu PRÓPRIO AudioManager, mas a configuração
 *  de mudo é lida do `localStorage`, então a preferência é compartilhada — se
 *  o jogador desligou o som no menu, ele continua desligado no jogo.
 * ============================================================================
 */

import { Scene } from 'phaser';

export class AudioManager {
    private scene: Scene;                                    // Cena dona deste gerenciador
    private isSfxMuted: boolean = false;                     // Efeitos sonoros mutados?
    private isMusicMuted: boolean = false;                   // Música mutada?
    private currentMusic: Phaser.Sound.BaseSound | null = null; // Música tocando agora (se houver)

    constructor(scene: Scene) {
        this.scene = scene;
        // Ao nascer, já lê as preferências salvas do jogador.
        this.loadSettings();
    }

    /** Lê do localStorage se o jogador deixou SFX/música mutados. */
    private loadSettings() {
        this.isSfxMuted = localStorage.getItem('sfxMuted') === 'true';
        this.isMusicMuted = localStorage.getItem('musicMuted') === 'true';
    }

    /**
     * Toca um efeito sonoro pelo nome (chave carregada na BootScene).
     *
     * Detalhe: tentamos primeiro reaproveitar uma instância já existente do som
     * (`sound.get`); se não houver, criamos uma nova com `sound.play`. O bloco
     * try/catch protege o jogo de travar caso o áudio falhe (ex.: o navegador
     * ainda não liberou áudio antes da 1ª interação do usuário).
     */
    public playSfx(soundName: string, volume: number = 0.7) {
        if (this.isSfxMuted) return;

        try {
            const sound = this.scene.sound.get(soundName);
            if (sound) {
                sound.play({ volume });
            } else {
                this.scene.sound.play(soundName, { volume });
            }
        } catch (e) {
            // Silencia erros
        }
    }

    /**
     * Toca a música de fundo em loop.
     *
     * Guarda de idempotência: se a MESMA música já estiver tocando, não faz
     * nada (evita reiniciar a faixa toda vez que a função é chamada). Caso
     * contrário, para a música atual e inicia a nova — desde que não esteja
     * mutada.
     */
    public playMusic(musicName: string, volume: number = 0.5, loop: boolean = true) {
        // Se já tem a mesma música tocando, não faz nada
        if (this.currentMusic && this.currentMusic.key === musicName && this.currentMusic.isPlaying) {
            return;
        }

        // Para a música atual
        this.stopMusic();

        // Se não está mutado, toca a nova música
        if (!this.isMusicMuted) {
            this.currentMusic = this.scene.sound.add(musicName, { loop, volume });
            this.currentMusic.play();
        }
    }

    /** Para a música atual por completo e esquece a referência a ela. */
    public stopMusic() {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.stop();
        }
        this.currentMusic = null;
    }

    /** Pausa a música (mantém a posição) — usado ao pausar o jogo. */
    public pauseMusic() {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        }
    }

    /** Retoma a música pausada, desde que o jogador não a tenha mutado. */
    public resumeMusic() {
        if (this.currentMusic && this.currentMusic.isPaused && !this.isMusicMuted) {
            this.currentMusic.resume();
        }
    }

    /** Liga/desliga SFX e PERSISTE a escolha no localStorage. */
    public setSfxMuted(muted: boolean) {
        this.isSfxMuted = muted;
        localStorage.setItem('sfxMuted', String(muted));
    }

    /**
     * Liga/desliga a música e persiste a escolha. Diferente do SFX, aqui
     * agimos sobre a faixa que já está tocando: ao mutar, pausamos; ao
     * desmutar, retomamos de onde parou.
     */
    public setMusicMuted(muted: boolean) {
        this.isMusicMuted = muted;
        localStorage.setItem('musicMuted', String(muted));

        if (muted && this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        } else if (!muted && this.currentMusic && this.currentMusic.isPaused) {
            this.currentMusic.resume();
        }
    }

    /** Getter de estado: SFX está mutado? (usado pela tela de Opções) */
    public isSfxMutedState(): boolean {
        return this.isSfxMuted;
    }

    /** Getter de estado: música está mutada? (usado pela tela de Opções) */
    public isMusicMutedState(): boolean {
        return this.isMusicMuted;
    }
}
