import { Game } from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UpgradeScene } from './scenes/UpgradeScene'; 
import { WeaponSelectScene } from './scenes/WeaponSelectScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: {x: 0, y: 0}, 
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, UpgradeScene, WeaponSelectScene],
    render: {
        pixelArt: true
    }
};

new Game(config);