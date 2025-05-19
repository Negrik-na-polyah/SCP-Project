import Phaser from 'phaser';
import { Player } from './Player';

export class SCP extends Phaser.Physics.Arcade.Sprite {
  protected health: number = 1000;
  protected maxHealth: number = 1000;
  protected damage: number = 20;
  protected speed: number = 100;
  protected detectionRange: number = 300;
  protected attackRange: number = 50;
  protected attackCooldown: number = 1000;
  protected lastAttackTime: number = 0;
  protected scpType: string = 'unknown';
  protected player!: Player;
  protected isAggressive: boolean = false;
  protected isStunned: boolean = false;
  protected stunDuration: number = 0;
  protected stunTime: number = 0;
  protected weaknesses: string[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, type: string = '173') {
    super(scene, x, y, `scp${type}`);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.scpType = type;
    this.player = scene.registry.get('player');

    // Настройка параметров в зависимости от типа SCP
    this.setupSCPType();

    // Добавляем полоску здоровья
    this.createHealthBar();
  }

  update() {
    if (this.health <= 0) return;

    // Если оглушен, пропускаем обновление
    if (this.isStunned) {
      if (this.scene.time.now > this.stunTime + this.stunDuration) {
        this.isStunned = false;
        this.clearTint();
      } else {
        return;
      }
    }

    // Обновляем поведение в зависимости от типа SCP
    switch (this.scpType) {
      case '173':
        this.updateSCP173();
        break;
      case '096':
        this.updateSCP096();
        break;
      case '049':
        this.updateSCP049();
        break;
      case '610':
        this.updateSCP610();
        break;
      case '939':
        this.updateSCP939();
        break;
      case '106':
        this.updateSCP106();
        break;
      case '783':
        this.updateSCP783();
        break;
      default:
        this.updateGenericSCP();
        break;
    }

    // Обновляем полоску здоровья
    this.updateHealthBar();
  }

  private setupSCPType() {
    switch (this.scpType) {
      case '173':
        // SCP-173: Скульптура - двигается только когда не смотрят
        this.health = 5000;
        this.maxHealth = 5000;
        this.damage = 100; // Мгновенная смерть при атаке
        this.speed = 300;
        this.weaknesses = ['micro_hid'];
        break;
      case '096':
        // SCP-096: Застенчивый парень - атакует при взгляде
        this.health = 7000;
        this.maxHealth = 7000;
        this.damage = 50;
        this.speed = 250;
        this.weaknesses = ['micro_hid'];
        break;
      case '049':
        // SCP-049: Чумной доктор - отравляет, создает 049-2
        this.health = 2500;
        this.maxHealth = 2500;
        this.damage = 30;
        this.speed = 80;
        this.weaknesses = ['plasma_rifle'];
        break;
      case '610':
        // SCP-610: Мясная чума - заражает комнаты
        this.health = 3000;
        this.maxHealth = 3000;
        this.damage = 25;
        this.speed = 60;
        this.weaknesses = ['cryo_gun'];
        break;
      case '939':
        // SCP-939: С многими голосами - реагирует на звук
        this.health = 4500;
        this.maxHealth = 4500;
        this.damage = 40;
        this.speed = 150;
        this.weaknesses = ['flamethrower'];
        break;
      case '106':
        // SCP-106: Старик - телепортация
        this.health = 3000;
        this.maxHealth = 3000;
        this.damage = 35;
        this.speed = 70;
        this.weaknesses = ['cryo_gun', 'micro_hid'];
        break;
      case '783':
        // SCP-783: Засада
        this.health = 2000;
        this.maxHealth = 2000;
        this.damage = 45;
        this.speed = 200;
        this.weaknesses = ['cryo_gun', 'micro_hid'];
        break;
      case '049-2':
        // SCP-049-2: Зомби
        this.health = 350;
        this.maxHealth = 350;
        this.damage = 15;
        this.speed = 90;
        this.weaknesses = []; // Уязвим к обычному оружию
        break;
      case '610-2':
        // SCP-610-2: Зараженный
        this.health = 150;
        this.maxHealth = 150;
        this.damage = 10;
        this.speed = 70;
        this.weaknesses = []; // Уязвим к обычному оружию
        break;
    }
  }

  private updateSCP173() {
    // SCP-173 двигается только когда на него не смотрят
    const player = this.player;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // Проверяем, смотрит ли игрок на SCP-173
    const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y);
    const playerAngle = player.rotation;
    const angleDiff = Phaser.Math.Angle.Wrap(angle - playerAngle);

    // Если игрок не смотрит на SCP-173 (угол больше 45 градусов) или далеко
    if (Math.abs(angleDiff) > 0.8 || distance > this.detectionRange) {
      // Двигаемся к игроку
      this.scene.physics.moveToObject(this, player, this.speed);
    } else {
      // Останавливаемся, если игрок смотрит
      this.setVelocity(0);
    }

    // Атакуем, если близко и не смотрит
    if (distance < this.attackRange && Math.abs(angleDiff) > 0.8) {
      this.attackPlayer();
    }
  }

  private updateSCP096() {
    // SCP-096 атакует, если на него посмотрели
    const player = this.player;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // Проверяем, смотрит ли игрок на SCP-096
    const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y);
    const playerAngle = player.rotation;
    const angleDiff = Phaser.Math.Angle.Wrap(angle - playerAngle);

    // Если игрок смотрит на SCP-096 (угол меньше 45 градусов) и близко
    if (Math.abs(angleDiff) < 0.8 && distance < this.detectionRange) {
      // Становимся агрессивным
      this.isAggressive = true;
      this.setTint(0xff0000);
    }

    // Если агрессивен, преследуем игрока
    if (this.isAggressive) {
      this.scene.physics.moveToObject(this, player, this.speed);

      // Атакуем, если близко
      if (distance < this.attackRange) {
        this.attackPlayer();
      }
    } else {
      // Иначе стоим на месте
      this.setVelocity(0);
    }
  }

  private updateSCP049() {
    // SCP-049 преследует игрока и отравляет при атаке
    const player = this.player;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (distance < this.detectionRange) {
      // Двигаемся к игроку
      this.scene.physics.moveToObject(this, player, this.speed);

      // Атакуем, если близко
      if (distance < this.attackRange) {
        this.attackPlayer();

        // Шанс создать SCP-049-2 (зомби)
        if (Phaser.Math.Between(1, 100) <= 10) { // 10% шанс
          this.spawnSCP0492();
        }
      }
    } else {
      // Случайное движение
      this.moveRandomly();
    }
  }

  private updateSCP610() {
    // SCP-610 медленно двигается и заражает области
    const player = this.player;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (distance < this.detectionRange) {
      // Двигаемся к игроку
      this.scene.physics.moveToObject(this, player, this.speed);

      // Атакуем, если близко
      if (distance < this.attackRange) {
        this.attackPlayer();
      }
    } else {
      // Случайное движение
      this.moveRandomly();
    }

    // Периодически создаем SCP-610-2 (зараженных)
    if (Phaser.Math.Between(1, 1000) <= 5) { // 0.5% шанс каждый кадр
      this.spawnSCP6102();
    }
  }

  private updateSCP939() {
    // SCP-939 реагирует на звук (движение игрока)
    const player = this.player;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // Проверяем, двигается ли игрок (издает звук)
    const isPlayerMoving = player.body.velocity.length() > 0;

    if (isPlayerMoving && distance < this.detectionRange) {
      // Двигаемся к игроку
      this.scene.physics.moveToObject(this, player, this.speed);

      // Атакуем, если близко
      if (distance < this.attackRange) {
        this.attackPlayer();
      }
    } else {
      // Случайное движение
      this.moveRandomly();
    }
  }

  private updateSCP106() {
    // SCP-106 телепортируется и преследует игрока
    const player = this.player;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (distance < this.detectionRange) {
      // Шанс телепортации
      if (Phaser.Math.Between(1, 1000) <= 5) { // 0.5% шанс каждый кадр
        this.teleport();
      } else {
        // Двигаемся к игроку
        this.scene.physics.moveToObject(this, player, this.speed);
      }

      // Атакуем, если близко
      if (distance < this.attackRange) {
        this.attackPlayer();
      }
    } else {
      // Случайное движение
      this.moveRandomly();
    }
  }

  private updateSCP783() {
    // SCP-783 устраивает засады
    const player = this.player;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (distance < this.detectionRange) {
      // Если игрок близко, но не слишком близко, прячемся
      if (distance > this.attackRange * 2) {
        this.setAlpha(0.5); // Частично невидим
        this.moveRandomly();
      } else {
        // Если игрок очень близко, атакуем
        this.setAlpha(1);
        this.scene.physics.moveToObject(this, player, this.speed * 1.5); // Быстрая атака

        if (distance < this.attackRange) {
          this.attackPlayer();
        }
      }
    } else {
      // Случайное движение
      this.moveRandomly();
    }
  }

  private updateGenericSCP() {
    // Общее поведение для других SCP
    const player = this.player;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (distance < this.detectionRange) {
      // Двигаемся к игроку
      this.scene.physics.moveToObject(this, player, this.speed);

      // Атакуем, если близко
      if (distance < this.attackRange) {
        this.attackPlayer();
      }
    } else {
      // Случайное движение
      this.moveRandomly();
    }
  }

  private moveRandomly() {
    // Случайное движение с небольшой вероятностью изменения направления
    if (Phaser.Math.Between(1, 100) <= 5) { // 5% шанс изменить направление
      const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 360));
      const vx = Math.cos(angle) * this.speed * 0.5;
      const vy = Math.sin(angle) * this.speed * 0.5;
      this.setVelocity(vx, vy);
    }
  }

  private teleport() {
    // Телепортация SCP-106
    const player = this.player;
    const distance = Phaser.Math.Between(100, 200);
    const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 360));

    const newX = player.x + Math.cos(angle) * distance;
    const newY = player.y + Math.sin(angle) * distance;

    // Эффект телепортации
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.setPosition(newX, newY);
        this.scene.tweens.add({
          targets: this,
          alpha: 1,
          duration: 200
        });
      }
    });
  }

  private attackPlayer() {
    const time = this.scene.time.now;

    if (time > this.lastAttackTime + this.attackCooldown) {
      this.lastAttackTime = time;

      // Наносим урон игроку
      this.player.takeDamage(this.damage);

      // Специальные эффекты при атаке
      if (this.scpType === '049') {
        // SCP-049 отравляет
        this.player.applyEffect('poison', 5000);
      } else if (this.scpType === '610') {
        // SCP-610 заражает
        this.player.applyEffect('infection', 10000);
      } else if (this.scpType === '106') {
        // SCP-106 замедляет
        this.player.applyEffect('slow', 3000);
      }
    }
  }

  private spawnSCP0492() {
    // Создаем SCP-049-2 (зомби)
    const offsetX = Phaser.Math.Between(-50, 50);
    const offsetY = Phaser.Math.Between(-50, 50);

    this.scene.events.emit('createSCP', this.x + offsetX, this.y + offsetY, '049-2');
  }

  private spawnSCP6102() {
    // Создаем SCP-610-2 (зараженного)
    const offsetX = Phaser.Math.Between(-50, 50);
    const offsetY = Phaser.Math.Between(-50, 50);

    this.scene.events.emit('createSCP', this.x + offsetX, this.y + offsetY, '610-2');
  }

  public takeDamage(amount: number, weaponType: string = '') {
    // Проверяем, уязвим ли SCP к данному оружию
    let damageMultiplier = 1;

    if (this.weaknesses.includes(weaponType)) {
      damageMultiplier = 3; // Утроенный урон от слабости
      this.stun(1000); // Оглушаем на 1 секунду
    }

    // Наносим урон
    this.health -= amount * damageMultiplier;

    // Эффект получения урона
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true
    });

    // Проверка на смерть
    if (this.health <= 0) {
      this.die();
    }
  }

  private stun(duration: number) {
    this.isStunned = true;
    this.stunTime = this.scene.time.now;
    this.stunDuration = duration;
    this.setTint(0x0000ff);
    this.setVelocity(0);
  }

  private die() {
    // Останавливаем движение
    this.setVelocity(0);

    // Отключаем физику
    this.body.enable = false;

    // Эффект смерти
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        // Шанс дропа предмета
        this.dropItem();

        // Удаляем объект
        this.destroy();
      }
    });
  }

  private dropItem() {
    // Шанс дропа предмета при смерти SCP
    const dropChance = Phaser.Math.Between(1, 100);

    if (dropChance <= 30) { // 30% шанс дропа
      const itemTypes = ['medkit', 'ammo'];
      const randomItem = itemTypes[Phaser.Math.Between(0, itemTypes.length - 1)];

      this.scene.events.emit('createItem', this.x, this.y, randomItem);
    }
  }

  private createHealthBar() {
    // Создаем полоску здоровья как дочерний объект
    const healthBar = this.scene.add.graphics();
    healthBar.setDepth(1);

    // Добавляем в сцену как дочерний объект
    this.scene.add.existing(healthBar);

    // Сохраняем ссылку на полоску здоровья
    (this as any).healthBar = healthBar;
  }

  private updateHealthBar() {
    const healthBar = (this as any).healthBar;
    if (!healthBar) return;

    // Очищаем предыдущую отрисовку
    healthBar.clear();

    // Рисуем фон полоски здоровья
    healthBar.fillStyle(0x000000, 0.8);
    healthBar.fillRect(this.x - 20, this.y - 30, 40, 5);

    // Рисуем полоску здоровья
    const healthPercentage = this.health / this.maxHealth;
    const color = healthPercentage > 0.5 ? 0x00ff00 : healthPercentage > 0.25 ? 0xffff00 : 0xff0000;

    healthBar.fillStyle(color, 1);
    healthBar.fillRect(this.x - 20, this.y - 30, 40 * healthPercentage, 5);
  }

  // Геттеры для доступа к свойствам
  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getSCPType(): string {
    return this.scpType;
  }

  public getWeaknesses(): string[] {
    return this.weaknesses;
  }
}