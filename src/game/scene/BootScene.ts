// Boot scene for the game
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        console.log('BootScene: preload');
    }

    create() {
        console.log('BootScene: create - Starting PreloaderScene');
        this.scene.start('PreloaderScene');
    }
}