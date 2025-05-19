import Phaser from 'phaser';
import { Projectile } from './Projectile';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private health: number = 100;
  private maxHealth: number = 100;
  private speed: number = 150;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey: Phaser.Input.Keyboard.Key;
  private reloadKey: Phaser.Input.Keyboard.Key;
  private interactKey: Phaser.Input.Keyboard.Key;
  private weaponKey1: Phaser.Input.Keyboard.Key;
  private weaponKey2: Phaser.Input.Keyboard.Key;
  private weaponKey3: Phaser.Input.Keyboard.Key;
  private lastFired: number = 0;
  private isReloading: boolean = false;
  private reloadTime: number = 1500; // ms
  private reloadTimer: Phaser.Time.TimerEvent | null = null;

  // Оружие
  private currentWeapon: string = 'glock17';
  private inventory: string[] = ['glock17'];
  private weaponStats: { [key: string]: any } = {
    'glock17': { damage: 15, fireRate: 300, magazineSize: 15, reloadTime: 1500, projectileSpeed: 500, ammoType: 'pistol' },
    'deagle': { damage: 35, fireRate: 500, magazineSize: 7, reloadTime: 1800, projectileSpeed: 550, ammoType: 'pistol' },
    'mp5': { damage: 20, fireRate: 150, magazineSize: 30, reloadTime: 2000, projectileSpeed: 500, ammoType: 'smg' },
    'ak74': { damage: 25, fireRate: 200, magazineSize: 30, reloadTime: 2200, projectileSpeed: 600, ammoType: 'rifle' },
    'm870': { damage: 40, fireRate: 800, magazineSize: 5, reloadTime: 2500, projectileSpeed: 450, ammoType: 'shotgun' },
    'awp': { damage: 60, fireRate: 1200, magazineSize: 5, reloadTime: 3000, projectileSpeed: 700, ammoType: 'sniper' },
    'micro_hid': { damage: 100, fireRate: 1000, magazineSize: 2, reloadTime: 5000, projectileSpeed: 400, ammoType: 'special' },
    'plasma_rifle': { damage: 50, fireRate: 500, magazineSize: 10, reloadTime: 3000, projectileSpeed: 600, ammoType: 'special' },
    'cryo_gun': { damage: 30, fireRate: 300, magazineSize: 15, reloadTime: 2500, projectileSpeed: 350, ammoType: 'special' },
    'flamethrower': { damage: 40, fireRate: 100, magazineSize: 100, reloadTime: 4000, projectileSpeed: 300, ammoType: 'special' }
  };

  // Патроны
  private ammo: { [key: string]: number } = {
    'pistol': 60,
    'smg': 0,
    'rifle': 0,
    'shotgun': 0,
    'sniper': 0,
    'special': 0
  };
  private currentAmmo: number = 15; // Текущие патроны в магазине

  // Способности
  private scanCooldown: number = 30000; // 30 секунд
  private lastScanTime: number = 0;
  private boostCooldown: number = 45000; // 45 секунд
  private lastBoostTime: number = 0;
  private isBoosting: boolean = false;

  // Инвентарь квестовых предметов
  private questItems: { [key: string]: number } = {};

  // Эффекты
  private activeEffects: { [key: string]: { duration: number, startTime: number } } = {};

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);

    // Настройка управления
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.fireKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.reloadKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.interactKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.weaponKey1 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.weaponKey2 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.weaponKey3 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

    // Настройка способностей
    scene.input.keyboard.on('keydown-Q', this.useScanAbility, this);
    scene.input.keyboard.on('keydown-F', this.useBoostAbility, this);

    // Обновление UI
    this.updateUI();
  }

  update() {
    if (this.health <= 0) return;

    // Обновляем эффекты
    this.updateEffects();

    // Движение
    this.handleMovement();

    // Стрельба
    this.handleShooting();

    // Перезарядка
    this.handleReload();

    // Смена оружия
    this.handleWeaponSwitch();

    // Поворот к курсору
    this.handleRotation();
  }

  private updateEffects() {
    const time = this.scene.time.now;

    // Проверяем все активные эффекты
    for (const [effectType, effectData] of Object.entries(this.activeEffects)) {
      // Если эффект истек, удаляем его
      if (time > effectData.startTime + effectData.duration) {
        delete this.activeEffects[effectType];

        // Убираем визуальные эффекты
        if (effectType === 'poison') {
          this.clearTint();
        } else if (effectType === 'infection') {
          this.clearTint();
        } else if (effectType === 'slow') {
          // Восстанавливаем скорость
          this.speed = 150;
        }

        // Уведомляем игрока
        (this.scene as any).events.emit('updateStatus', `Эффект ${this.getEffectName(effectType)} закончился`);
      }
    }
  }

  private getEffectName(effectType: string): string {
    switch (effectType) {
      case 'poison':
        return 'Отравление';
      case 'infection':
        return 'Заражение';
      case 'slow':
        return 'Замедление';
      default:
        return effectType;
    }
  }

  private handleMovement() {
    // Сбрасываем скорость
    this.setVelocity(0);

    // Определяем множитель скорости (для ускорения)
    const speedMultiplier = this.isBoosting ? 5 : 1;

    // Движение по горизонтали
    if (this.cursors.left.isDown) {
      this.setVelocityX(-this.speed * speedMultiplier);
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(this.speed * speedMultiplier);
    }

    // Движение по вертикали
    if (this.cursors.up.isDown) {
      this.setVelocityY(-this.speed * speedMultiplier);
    } else if (this.cursors.down.isDown) {
      this.setVelocityY(this.speed * speedMultiplier);
    }

    // Нормализация диагонального движения
    if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
      this.body.velocity.normalize().scale(this.speed * speedMultiplier);
    }
  }

  private handleShooting() {
    if (this.fireKey.isDown && !this.isReloading && this.currentAmmo > 0) {
      const time = this.scene.time.now;
      const weaponData = this.weaponStats[this.currentWeapon];

      if (time > this.lastFired + weaponData.fireRate) {
        this.fire();
        this.lastFired = time;
      }
    }
  }

  private handleReload() {
    if (this.reloadKey.isDown && !this.isReloading && this.currentAmmo < this.weaponStats[this.currentWeapon].magazineSize) {
      this.reload();
    }
  }

  private handleWeaponSwitch() {
    if (this.weaponKey1.isDown && this.inventory.length >= 1) {
      this.equipWeapon(this.inventory[0]);
    } else if (this.weaponKey2.isDown && this.inventory.length >= 2) {
      this.equipWeapon(this.inventory[1]);
    } else if (this.weaponKey3.isDown && this.inventory.length >= 3) {
      this.equipWeapon(this.inventory[2]);
    }
  }

  private handleRotation() {
    // Поворот к курсору
    const pointer = this.scene.input.activePointer;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    this.rotation = angle;
  }

  private fire() {
    const weaponData = this.weaponStats[this.currentWeapon];

    // Создаем снаряд
    const projectile = new Projectile(
      this.scene,
      this.x,
      this.y,
      'bullet',
      weaponData.damage,
      this.rotation,
      weaponData.projectileSpeed,
      this.currentWeapon
    );

    // Добавляем снаряд в группу снарядов
    const projectiles = this.scene.registry.get('projectiles');
    if (projectiles) {
      projectiles.add(projectile);
    }

    // Уменьшаем патроны
    this.currentAmmo--;

    // Воспроизводим звук выстрела
    this.scene.sound.play('shoot');

    // Обновляем UI
    this.updateUI();

    // Автоматическая перезарядка при пустом магазине
    if (this.currentAmmo === 0) {
      this.reload();
    }
  }

  private reload() {
    const weaponData = this.weaponStats[this.currentWeapon];
    const ammoType = weaponData.ammoType;

    // Проверяем, есть ли патроны для перезарядки
    if (this.ammo[ammoType] <= 0) return;

    // Начинаем перезарядку
    this.isReloading = true;

    // Создаем таймер перезарядки
    this.reloadTimer = this.scene.time.delayedCall(
      weaponData.reloadTime,
      () => {
        // Вычисляем, сколько патронов нужно добавить
        const ammoNeeded = weaponData.magazineSize - this.currentAmmo;
        const ammoAvailable = Math.min(ammoNeeded, this.ammo[ammoType]);

        // Добавляем патроны в магазин и убираем из запаса
        this.currentAmmo += ammoAvailable;
        this.ammo[ammoType] -= ammoAvailable;

        // Завершаем перезарядку
        this.isReloading = false;
        this.reloadTimer = null;

        // Обновляем UI
        this.updateUI();
      },
      [],
      this
    );
  }

  public equipWeapon(weaponType: string) {
    if (!this.weaponStats[weaponType]) return;

    // Если оружие уже экипировано, ничего не делаем
    if (this.currentWeapon === weaponType) return;

    // Сохраняем текущие патроны в магазине
    if (this.currentWeapon) {
      // Отменяем перезарядку, если она идет
      if (this.isReloading && this.reloadTimer) {
        this.reloadTimer.remove();
        this.isReloading = false;
      }
    }

    // Устанавливаем новое оружие
    this.currentWeapon = weaponType;
    this.currentAmmo = Math.min(this.weaponStats[weaponType].magazineSize, this.ammo[this.weaponStats[weaponType].ammoType]);

    // Обновляем UI
    this.updateUI();
  }

  public addAmmo(ammoType: string, amount: number) {
    if (this.ammo[ammoType] !== undefined) {
      this.ammo[ammoType] += amount;
      this.updateUI();
    }
  }

  public takeDamage(amount: number) {
    this.health -= amount;

    // Проверка на смерть
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }

    // Воспроизводим звук получения урона
    this.scene.sound.play('hurt');

    // Обновляем UI
    this.updateUI();
  }

  public heal(amount: number) {
    this.health = Math.min(this.health + amount, this.maxHealth);
    this.updateUI();
  }

  private die() {
    // Останавливаем движение
    this.setVelocity(0);

    // Отключаем физику
    this.body.enable = false;

    // Показываем экран смерти
    const gameScene = this.scene as Phaser.Scene;
    gameScene.registry.set('gameOver', true);

    // Создаем текст "Game Over"
    const gameOverText = this.scene.add.text(400, 300, 'GAME OVER', { fontSize: '32px', color: '#ff0000' });
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);

    // Добавляем кнопку для перезапуска
    const restartButton = this.scene.add.text(400, 350, 'Играть снова', { fontSize: '24px', color: '#ffffff' });
    restartButton.setOrigin(0.5);
    restartButton.setScrollFactor(0);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on('pointerdown', () => {
      this.scene.scene.restart();
    });
  }

  private useScanAbility() {
    const time = this.scene.time.now;

    if (time > this.lastScanTime + this.scanCooldown) {
      // Активируем сканирование
      this.lastScanTime = time;

      // Находим всех SCP в радиусе и подсвечиваем их
      const scps = (this.scene as any).scps.getChildren();
      scps.forEach((scp: any) => {
        // Проверяем расстояние до SCP
        const distance = Phaser.Math.Distance.Between(this.x, this.y, scp.x, scp.y);
        if (distance < 500) { // 500 пикселей - радиус сканирования
          // Подсвечиваем SCP
          scp.setTint(0xff0000);

          // Через 10 секунд убираем подсветку
          this.scene.time.delayedCall(10000, () => {
            scp.clearTint();
          });
        }
      });

      // Показываем сообщение
      (this.scene as any).statusText.setText('Сканирование активировано!');
      this.scene.time.delayedCall(2000, () => {
        (this.scene as any).statusText.setText('');
      });
    } else {
      // Показываем сообщение о кулдауне
      const remainingTime = Math.ceil((this.lastScanTime + this.scanCooldown - time) / 1000);
      (this.scene as any).statusText.setText(`Сканирование перезаряжается: ${remainingTime} сек.`);
      this.scene.time.delayedCall(2000, () => {
        (this.scene as any).statusText.setText('');
      });
    }
  }

  private useBoostAbility() {
    const time = this.scene.time.now;

    if (time > this.lastBoostTime + this.boostCooldown) {
      // Активируем ускорение
      this.lastBoostTime = time;
      this.isBoosting = true;

      // Через 0.5 секунды отключаем ускорение
      this.scene.time.delayedCall(500, () => {
        this.isBoosting = false;
      });

      // Показываем сообщение
      (this.scene as any).statusText.setText('Ускорение активировано!');
      this.scene.time.delayedCall(2000, () => {
        (this.scene as any).statusText.setText('');
      });
    } else {
      // Показываем сообщение о кулдауне
      const remainingTime = Math.ceil((this.lastBoostTime + this.boostCooldown - time) / 1000);
      (this.scene as any).statusText.setText(`Ускорение перезаряжается: ${remainingTime} сек.`);
      this.scene.time.delayedCall(2000, () => {
        (this.scene as any).statusText.setText('');
      });
    }
  }

  private updateUI() {
    // Обновляем текст здоровья
    (this.scene as any).healthText?.setText(`Здоровье: ${this.health}/${this.maxHealth}`);

    // Обновляем текст патронов
    const ammoType = this.weaponStats[this.currentWeapon].ammoType;
    (this.scene as any).ammoText?.setText(`${this.currentWeapon}: ${this.currentAmmo}/${this.ammo[ammoType]}`);
  }

  // Геттеры для доступа к свойствам
  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getCurrentWeapon(): string {
    return this.currentWeapon;
  }

  public getCurrentAmmo(): number {
    return this.currentAmmo;
  }

  public getTotalAmmo(ammoType: string): number {
    return this.ammo[ammoType];
  }

  public getInventory(): string[] {
    return this.inventory;
  }

  public addQuestItem(itemKey: string) {
    if (!this.questItems[itemKey]) {
      this.questItems[itemKey] = 0;
    }
    this.questItems[itemKey]++;
  }

  public getQuestItems(): { [key: string]: number } {
    return this.questItems;
  }

  public applyEffect(effectType: string, duration: number) {
    // Применяем эффект к игроку
    this.activeEffects[effectType] = {
      duration,
      startTime: this.scene.time.now
    };

    // Применяем визуальные эффекты
    if (effectType === 'poison') {
      this.setTint(0x00ff00); // Зеленый цвет для отравления

      // Периодический урон от яда
      const poisonTimer = this.scene.time.addEvent({
        delay: 1000, // Каждую секунду
        callback: () => {
          // Наносим урон, если эффект еще активен
          if (this.activeEffects[effectType]) {
            this.takeDamage(5);
          } else {
            poisonTimer.destroy();
          }
        },
        repeat: Math.floor(duration / 1000)
      });
    } else if (effectType === 'infection') {
      this.setTint(0xff00ff); // Фиолетовый цвет для заражения

      // Периодический урон от заражения
      const infectionTimer = this.scene.time.addEvent({
        delay: 2000, // Каждые 2 секунды
        callback: () => {
          // Наносим урон, если эффект еще активен
          if (this.activeEffects[effectType]) {
            this.takeDamage(10);
          } else {
            infectionTimer.destroy();
          }
        },
        repeat: Math.floor(duration / 2000)
      });
    } else if (effectType === 'slow') {
      // Замедление
      this.speed = this.speed * 0.5;
    }

    // Уведомляем игрока
    (this.scene as any).events.emit('updateStatus', `Вы получили эффект: ${this.getEffectName(effectType)}`);
  }

  public hasEffect(effectType: string): boolean {
    return !!this.activeEffects[effectType];
  }
}