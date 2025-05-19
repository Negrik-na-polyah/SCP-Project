import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  private damage: number;
  private lifespan: number = 2000; // Время жизни снаряда в мс
  private spawnTime: number;
  private weaponType: string = '';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    damage: number,
    angle: number,
    speed: number,
    weaponType: string = ''
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.damage = damage;
    this.weaponType = weaponType;
    this.spawnTime = scene.time.now;

    // Настройка физики
    if (this.body) {
      this.body.setSize(8, 8);
    }

    // Установка скорости в зависимости от угла
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.setVelocity(vx, vy);

    // Поворот спрайта в направлении движения
    this.rotation = angle;

    // Добавляем в группу снарядов
    const projectiles = scene.registry.get('projectiles');
    if (projectiles) {
      projectiles.add(this);
    }

    // Специальные эффекты в зависимости от типа оружия
    this.applyWeaponEffects();
  }

  update() {
    // Проверяем время жизни снаряда
    if (this.scene.time.now > this.spawnTime + this.lifespan) {
      this.destroy();
    }
  }

  private applyWeaponEffects() {
    switch (this.weaponType) {
      case 'micro_hid':
        // Электрический эффект
        this.setTint(0x00ffff);
        this.scene.tweens.add({
          targets: this,
          alpha: 0.5,
          duration: 100,
          yoyo: true,
          repeat: -1
        });
        break;
      case 'plasma_rifle':
        // Плазменный эффект
        this.setTint(0xff00ff);
        this.setScale(1.5);
        break;
      case 'cryo_gun':
        // Ледяной эффект
        this.setTint(0x00ffff);
        break;
      case 'flamethrower':
        // Огненный эффект
        this.setTint(0xff6600);
        this.scene.tweens.add({
          targets: this,
          scale: 1.2,
          duration: 100,
          yoyo: true,
          repeat: -1
        });
        break;
    }
  }

  public getDamage(): number {
    return this.damage;
  }

  public getWeaponType(): string {
    return this.weaponType;
  }
}