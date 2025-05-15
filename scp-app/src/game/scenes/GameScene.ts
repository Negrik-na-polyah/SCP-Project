import Phaser from 'phaser';
import Player from '../entities/Player';

export default class GameScene extends Phaser.Scene {
    // Phaser scene properties
    declare public load: Phaser.Loader.LoaderPlugin;
    declare public input: Phaser.Input.InputPlugin;
    
    private player!: Player;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('player', 'assets/player.png');
    }

    create() {
        this.player = new Player(this, 100, 100);
        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    update() {
        this.player.update(this.cursors);
    }
}