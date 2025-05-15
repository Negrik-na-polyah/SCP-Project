import Phaser from 'phaser';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, targetX: number, targetY: number) {
        super(scene, x, y, 'projectile');
        scene.physics.world.enable(this);
        scene.add.existing(this);
        
        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        this.setVelocity(
            Math.cos(angle) * 200,
            Math.sin(angle) * 200
        );
        
        // Destroy projectile after 2 seconds
        scene.time.delayedCall(2000, () => this.destroy(), [], this);
    }
}