import Phaser from 'phaser';
import Player from './Player';
import Projectile from './Projectile';

export default class RangedEnemy extends Phaser.Physics.Arcade.Sprite {
    declare body: Phaser.Physics.Arcade.Body;
    declare scene: Phaser.Scene;
    declare x: number;
    declare y: number;
    declare active: boolean;
    declare body: Phaser.Physics.Arcade.Body;
    declare scene: Phaser.Scene;
    private attackCooldown: number;
    private health: number;
    private player: Player;
    private color: number;

    constructor(scene: Phaser.Scene, x: number, y: number, player: Player, color: number = 0xff0000) {
        super(scene, x, y, 'ranged_enemy');
        this.player = player;
        this.health = 3;
        this.attackCooldown = 2000;
        this.color = color;
        
        scene.physics.world.enable(this);
        scene.add.existing(this);
        this.setTint(this.color);
        
        scene.time.addEvent({
            delay: this.attackCooldown,
            callback: this.attack,
            callbackScope: this,
            loop: true
        });
    }

    attack() {
        if (this.active && this.player.active) {
            const projectile = new Projectile(
                this.scene,
                this.x,
                this.y,
                this.player.x,
                this.player.y
            );
            projectile.setTint(this.color);
        }
    }

    takeDamage(amount: number = 1) {
        this.health -= amount;
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => this.setTint(this.color));
        
        if (this.health <= 0) {
            this.scene.events.emit('enemyDied', this);
            this.destroy();
        } else {
            this.scene.events.emit('enemyDamaged', this);
        }
    }

    update() {
        if (this.x < this.player.x) {
            this.setFlipX(false);
        } else {
            this.setFlipX(true);
        }
    }
}