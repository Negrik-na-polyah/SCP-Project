import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Load assets needed for the preloader
    this.load.image('logo', 'assets/logo.png');
  }

  create() {
    this.scene.start('Game');
  }
}