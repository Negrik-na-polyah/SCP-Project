import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { SCP } from '../entities/SCP';
import Enemy from '../entities/Enemy';
import { DungeonGenerator } from '../systems/DungeonGenerator';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private scps!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private items!: Phaser.Physics.Arcade.Group;
  private interactables!: Phaser.Physics.Arcade.Group;
  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private wallsLayer!: Phaser.Tilemaps.TilemapLayer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private generatorsActivated: number = 0;
  private mapShardsCollected: number = 0;
  private hasO5Card: boolean = false;
  private gameWon: boolean = false;
  private gameOver: boolean = false;
  private healthText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private interactionText!: Phaser.GameObjects.Text;
  private currentInteractable: any = null;

  constructor() {
    super('Game');
  }

  preload() {
    // Загрузка ассетов
    this.load.image('player', 'assets/player.png');
    this.load.image('enemy', 'assets/enemy.png');
    this.load.image('scp', 'assets/scp.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('medkit', 'assets/medkit.png');
    this.load.image('ammo', 'assets/ammo.png');
    this.load.image('generator', 'assets/generator.png');
    this.load.image('generator_on', 'assets/generator_on.png');
    this.load.image('locker', 'assets/locker.png');
    this.load.image('map_shard', 'assets/map_shard.png');
    this.load.image('o5_card', 'assets/o5_card.png');

    // Загрузка тайлсета для карты
    this.load.image('tiles', 'assets/tiles.png');

    // Загрузка SCP объектов
    this.load.image('scp173', 'assets/scp173.png');
    this.load.image('scp049', 'assets/scp049.png');
    this.load.image('scp049_2', 'assets/scp049_2.png');
    this.load.image('scp106', 'assets/scp106.png');
    this.load.image('scp096', 'assets/scp096.png');
    this.load.image('scp914', 'assets/scp914.png');

    // Загрузка оружия
    this.load.image('glock17', 'assets/glock17.png');
    this.load.image('deagle', 'assets/deagle.png');
    this.load.image('mp5', 'assets/mp5.png');
    this.load.image('ak74', 'assets/ak74.png');
    this.load.image('m870', 'assets/m870.png');
    this.load.image('awp', 'assets/awp.png');

    // Загрузка специального оружия
    this.load.image('micro_hid', 'assets/micro_hid.png');
    this.load.image('plasma_rifle', 'assets/plasma_rifle.png');
    this.load.image('cryo_gun', 'assets/cryo_gun.png');
    this.load.image('flamethrower', 'assets/flamethrower.png');

    // Загрузка звуков
    this.load.audio('shoot', 'assets/sounds/shoot.mp3');
    this.load.audio('pickup', 'assets/sounds/pickup.mp3');
    this.load.audio('hurt', 'assets/sounds/hurt.mp3');
    this.load.audio('generator_on', 'assets/sounds/generator_on.mp3');
  }

  create() {
    // Создание карты
    this.createMap();

    // Создание групп объектов
    this.enemies = this.physics.add.group({ classType: Enemy });
    this.scps = this.physics.add.group({ classType: SCP });
    this.projectiles = this.physics.add.group();
    this.items = this.physics.add.group();
    this.interactables = this.physics.add.group();

    // Создание игрока
    this.player = new Player(this, 100, 100);

    // Настройка камеры
    this.cameras.main.startFollow(this.player);

    // Создание управления
    this.cursors = this.input.keyboard.createCursorKeys();

    // Добавление коллизий
    this.physics.add.collider(this.player, this.wallsLayer);
    this.physics.add.collider(this.enemies, this.wallsLayer);
    this.physics.add.collider(this.scps, this.wallsLayer);
    this.physics.add.collider(this.projectiles, this.wallsLayer, this.handleBulletWallCollision, undefined, this);
    this.physics.add.overlap(this.projectiles, this.enemies, this.handleBulletEnemyCollision, undefined, this);
    this.physics.add.overlap(this.projectiles, this.scps, this.handleBulletSCPCollision, undefined, this);
    this.physics.add.overlap(this.player, this.items, this.handlePlayerItemOverlap, undefined, this);
    this.physics.add.overlap(this.player, this.interactables, this.handlePlayerInteractableOverlap, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyOverlap, undefined, this);
    this.physics.add.overlap(this.player, this.scps, this.handlePlayerSCPOverlap, undefined, this);

    // Создание UI
    this.createUI();

    // Создание объектов на карте
    this.spawnObjects();

    // Добавление клавиши взаимодействия (E)
    this.input.keyboard.on('keydown-E', () => {
      if (this.currentInteractable) {
        this.interactWithObject(this.currentInteractable);
      }
    });
  }

  update() {
    // Обновление игрока
    if (this.player && !this.gameOver && !this.gameWon) {
      this.player.update();
    }

    // Обновление врагов
    this.enemies.getChildren().forEach((enemy) => {
      (enemy as Enemy).update();
    });

    // Обновление SCP
    this.scps.getChildren().forEach((scp) => {
      (scp as SCP).update();
    });

    // Проверка условия победы
    this.checkWinCondition();
  }

  private createMap() {
    // Создание генератора подземелья
    const dungeonGenerator = new DungeonGenerator(this);
    const { map, tileset, groundLayer, wallsLayer } = dungeonGenerator.generateDungeon();

    this.map = map;
    this.tileset = tileset;
    this.groundLayer = groundLayer;
    this.wallsLayer = wallsLayer;

    // Настройка коллизий для стен
    this.wallsLayer.setCollisionByProperty({ collides: true });
  }

  private createUI() {
    // Создание текстовых элементов UI
    this.healthText = this.add.text(16, 16, 'Здоровье: 100', { fontSize: '18px', color: '#ffffff' });
    this.healthText.setScrollFactor(0);

    this.ammoText = this.add.text(16, 40, 'Патроны: 15/60', { fontSize: '18px', color: '#ffffff' });
    this.ammoText.setScrollFactor(0);

    this.statusText = this.add.text(400, 16, '', { fontSize: '18px', color: '#ffffff' });
    this.statusText.setScrollFactor(0);
    this.statusText.setOrigin(0.5, 0);

    this.interactionText = this.add.text(400, 500, '', { fontSize: '18px', color: '#ffffff' });
    this.interactionText.setScrollFactor(0);
    this.interactionText.setOrigin(0.5, 0);
    this.interactionText.setVisible(false);
  }

  private spawnObjects() {
    // Размещение объектов на карте будет реализовано в DungeonGenerator
  }

  private handleBulletWallCollision(bullet: Phaser.GameObjects.GameObject, wall: Phaser.GameObjects.GameObject) {
    bullet.destroy();
  }

  private handleBulletEnemyCollision(bullet: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject) {
    bullet.destroy();
    (enemy as Enemy).takeDamage(10);
  }

  private handleBulletSCPCollision(bullet: Phaser.GameObjects.GameObject, scp: Phaser.GameObjects.GameObject) {
    bullet.destroy();
    // Логика урона SCP будет реализована позже
  }

  private handlePlayerItemOverlap(player: Phaser.GameObjects.GameObject, item: Phaser.GameObjects.GameObject) {
    // Показываем подсказку для подбора
    this.interactionText.setText('[E] Подобрать ' + item.getData('type'));
    this.interactionText.setVisible(true);
    this.currentInteractable = item;
  }

  private handlePlayerInteractableOverlap(player: Phaser.GameObjects.GameObject, interactable: Phaser.GameObjects.GameObject) {
    // Показываем подсказку для взаимодействия
    this.interactionText.setText('[E] ' + this.getInteractionText(interactable));
    this.interactionText.setVisible(true);
    this.currentInteractable = interactable;
  }

  private getInteractionText(interactable: Phaser.GameObjects.GameObject): string {
    const type = interactable.getData('type');
    switch (type) {
      case 'generator':
        return 'Активировать генератор';
      case 'locker':
        return 'Обыскать шкафчик';
      case 'scp914':
        return 'Использовать SCP-914';
      default:
        return 'Взаимодействовать';
    }
  }

  private handlePlayerEnemyOverlap(player: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject) {
    // Игрок получает урон от врага
    (player as Player).takeDamage(10);
  }

  private handlePlayerSCPOverlap(player: Phaser.GameObjects.GameObject, scp: Phaser.GameObjects.GameObject) {
    // Логика взаимодействия с SCP будет реализована позже
  }

  private interactWithObject(object: Phaser.GameObjects.GameObject) {
    const type = object.getData('type');

    switch (type) {
      case 'generator':
        this.activateGenerator(object);
        break;
      case 'locker':
        this.searchLocker(object);
        break;
      case 'scp914':
        this.useSCP914(object);
        break;
      case 'medkit':
        this.useMedkit(object);
        break;
      case 'ammo':
        this.pickupAmmo(object);
        break;
      case 'map_shard':
        this.collectMapShard(object);
        break;
      case 'weapon':
        this.pickupWeapon(object);
        break;
    }

    // Сбрасываем текущий интерактивный объект
    this.currentInteractable = null;
    this.interactionText.setVisible(false);
  }

  private activateGenerator(generator: Phaser.GameObjects.GameObject) {
    if (!generator.getData('activated')) {
      generator.setData('activated', true);
      generator.setTexture('generator_on');
      this.generatorsActivated++;
      this.sound.play('generator_on');
      this.statusText.setText(`Генераторы: ${this.generatorsActivated}/5`);
    }
  }

  private searchLocker(locker: Phaser.GameObjects.GameObject) {
    // Логика обыска шкафчика будет реализована позже
  }

  private useSCP914(scp914: Phaser.GameObjects.GameObject) {
    // Логика использования SCP-914 будет реализована позже
  }

  private useMedkit(medkit: Phaser.GameObjects.GameObject) {
    (this.player as Player).heal(30);
    medkit.destroy();
    this.sound.play('pickup');
  }

  private pickupAmmo(ammo: Phaser.GameObjects.GameObject) {
    const ammoType = ammo.getData('ammoType');
    const amount = ammo.getData('amount');
    (this.player as Player).addAmmo(ammoType, amount);
    ammo.destroy();
    this.sound.play('pickup');
  }

  private collectMapShard(mapShard: Phaser.GameObjects.GameObject) {
    this.mapShardsCollected++;
    mapShard.destroy();
    this.sound.play('pickup');
    this.statusText.setText(`Осколки карты: ${this.mapShardsCollected}/5`);

    // Если собраны все осколки, создаем карту O5
    if (this.mapShardsCollected >= 5) {
      this.hasO5Card = true;
      this.statusText.setText('Карта O5 собрана!');
    }
  }

  private pickupWeapon(weapon: Phaser.GameObjects.GameObject) {
    const weaponType = weapon.getData('weaponType');
    (this.player as Player).equipWeapon(weaponType);
    weapon.destroy();
    this.sound.play('pickup');
  }

  private checkWinCondition() {
    if (this.generatorsActivated >= 5 && this.hasO5Card && !this.gameWon) {
      this.gameWon = true;
      this.showVictoryScreen();
    }
  }

  private showVictoryScreen() {
    // Отображение экрана победы
    const victoryText = this.add.text(400, 300, 'Вы победили!', { fontSize: '32px', color: '#ffffff' });
    victoryText.setOrigin(0.5);
    victoryText.setScrollFactor(0);

    // Добавляем кнопку для перезапуска игры
    const restartButton = this.add.text(400, 350, 'Играть снова', { fontSize: '24px', color: '#ffffff' });
    restartButton.setOrigin(0.5);
    restartButton.setScrollFactor(0);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on('pointerdown', () => {
      this.scene.restart();
    });
  }
}