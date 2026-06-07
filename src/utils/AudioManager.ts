import { Scene } from 'phaser';

export class AudioManager {
    private scene: Scene;
    private isSfxMuted: boolean = false;
    private isMusicMuted: boolean = false;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.loadSettings();
    }
    
    private loadSettings() {
        this.isSfxMuted = localStorage.getItem('sfxMuted') === 'true';
        this.isMusicMuted = localStorage.getItem('musicMuted') === 'true';
    }
    
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
    
    public stopMusic() {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.stop();
        }
        this.currentMusic = null;
    }
    
    public pauseMusic() {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        }
    }
    
    public resumeMusic() {
        if (this.currentMusic && this.currentMusic.isPaused && !this.isMusicMuted) {
            this.currentMusic.resume();
        }
    }
    
    public setSfxMuted(muted: boolean) {
        this.isSfxMuted = muted;
        localStorage.setItem('sfxMuted', String(muted));
    }
    
    public setMusicMuted(muted: boolean) {
        this.isMusicMuted = muted;
        localStorage.setItem('musicMuted', String(muted));
        
        if (muted && this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        } else if (!muted && this.currentMusic && this.currentMusic.isPaused) {
            this.currentMusic.resume();
        }
    }
    
    public isSfxMutedState(): boolean {
        return this.isSfxMuted;
    }
    
    public isMusicMutedState(): boolean {
        return this.isMusicMuted;
    }
}