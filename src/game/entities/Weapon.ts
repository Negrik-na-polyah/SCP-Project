import Phaser from 'phaser';

export default class Weapon extends Phaser.Physics.Arcade.Sprite {
    private weaponType: string;
    private damage: number;
    private fireRate: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        weaponType: string
    ) {
        super(scene, x, y, 'weapon');
        scene.physics.world.enable(this);
        scene.add.existing(this);

        this.weaponType = weaponType;
        
        // Set weapon stats based on type
        switch(weaponType) {
            case 'pistol':
                this.damage = 25;
                this.fireRate = 500;
                break;
            case 'rifle':
                this.damage = 35;
                this.fireRate = 300;
                break;
            default:
                this.damage = 20;
                this.fireRate = 400;
        }
    }

    update() {
        // Weapon update logic
    }

    fire() {
        // Weapon firing logic
        return this.damage;
    }
}