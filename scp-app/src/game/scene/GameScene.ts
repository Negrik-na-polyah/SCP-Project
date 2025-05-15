import Phaser from 'phaser';
import Player from '../entities/Player';
import Weapon from '../entities/Weapon';
import Enemy from '../entities/Enemy';
import RangedEnemy from '../entities/RangedEnemy';
import { GameState, GameStateManager } from '../systems/GameStateManager';

export default class GameScene extends Phaser.Scene {
    private gameStateManager!: GameStateManager;
    // Phaser scene properties
    declare public add: Phaser.GameObjects.GameObjectFactory;
    declare public physics: Phaser.Physics.Arcade.ArcadePhysics;
    declare public input: Phaser.Input.InputPlugin;
    declare public load: Phaser.Loader.LoaderPlugin;
    declare public time: Phaser.Time.Clock;
    declare public cameras: Phaser.Cameras.Scene2D.CameraManager;
    declare public scene: Phaser.Scenes.SceneManager;

    private player!: Player;
    private weapons: Weapon[] = [];
    private enemies: Enemy[] = [];
    private rangedEnemies: RangedEnemy[] = [];
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('player', 'assets/player.png');
        this.load.image('weapon', 'assets/weapon.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('ranged_enemy', 'assets/ranged_enemy.png');
        this.load.image('projectile', 'assets/projectile.png');
    }

    create() {
        this.gameStateManager = new GameStateManager(this.game);
        this.player = new Player(this, 100, 100);
        this.cursors = this.input.keyboard!.createCursorKeys();

        this.weapons.push(new Weapon(this, 200, 100, 'pistol'));
        this.weapons.push(new Weapon(this, 300, 100, 'rifle'));

        this.enemies.push(new Enemy(this, 400, 200, 'enemy1'));
        this.enemies.push(new Enemy(this, 500, 200, 'enemy2'));

        this.rangedEnemies.push(new RangedEnemy(this, 600, 300, this.player));
        this.rangedEnemies.push(new RangedEnemy(this, 700, 300, this.player));

        this.physics.add.collider(
            this.player,
            this.enemies,
            (player: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject) => {
                (player as Player).takeDamage(10);
            }
        );

        this.physics.add.collider(
            this.player,
            this.rangedEnemies,
            (player: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject) => {
                (player as Player).takeDamage(15);
            }
        );

        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontSize: '32px',
            color: '#ffffff'
        });
    }

    update() {
        if (this.gameStateManager.getState() !== GameState.GAME) {
            return;
        }
        this.player.update(this.cursors);
        this.weapons.forEach(w => w.update());
        this.enemies.forEach(e => e.update());
        this.rangedEnemies.forEach(re => re.update());

        if (this.player.health <= 0) {
            this.scene.start('GameOverScene', { score: this.score });
        }
    }

    addScore(points: number) {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
    }
}