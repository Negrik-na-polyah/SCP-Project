import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    private enemyType: string;
    private health: number;
    private speed: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        enemyType: string
    ) {
        super(scene, x, y, 'enemy');
        scene.physics.world.enable(this);
        scene.add.existing(this);

        this.enemyType = enemyType;
        
        // Set enemy stats based on type
        switch(enemyType) {
            case 'enemy1':
                this.health = 100;
                this.speed = 100;
                break;
            case 'enemy2':
                this.health = 150;
                this.speed = 80;
                break;
            default:
                this.health = 80;
                this.speed = 120;
        }
    }

    update() {
        // Enemy AI logic
    }

    takeDamage(damage: number) {
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
        }
    }
}