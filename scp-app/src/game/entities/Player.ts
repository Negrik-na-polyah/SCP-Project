import { Entity } from 'phaser';
import { Weapon } from './Weapon';

export class Player extends Entity {
  private health: number = 100;
  private weapon: Weapon;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    this.weapon = new Weapon(scene);
    this.setCollideWorldBounds(true);
  }

  update() {
    // Логика управления
  }

  takeDamage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  private die() {
    // Логика смерти
  }
}