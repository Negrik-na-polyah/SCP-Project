import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { SCP } from '../entities/SCP';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private scp!: SCP;

  constructor() {
    super('Game');
  }

  preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('player', 'assets/player.png');
    this.load.image('scp', 'assets/scp.png');
  }

  create() {
    this.add.image(400, 300, 'background');
    this.player = new Player(this, 100, 100);
    this.scp = new SCP(this, 600, 400);
  }

  update() {
    this.player.update();
    this.scp.update();
  }
}