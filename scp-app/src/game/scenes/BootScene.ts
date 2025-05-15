import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    // Phaser scene properties
    declare public load: Phaser.Loader.LoaderPlugin;
    declare public scene: Phaser.Scenes.SceneManager;

    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Загрузка ассетов, необходимых для PreloadScene
        this.load.image('logo', 'assets/logo.png');
    }

    create() {
        this.scene.start('PreloadScene');
    }
}