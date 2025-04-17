// Базовый класс для всех врагов Enemy.js

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture = 'enemy_placeholder', health = 100) {
        super(scene, x, y, texture);

        // Добавляем в сцену и физику
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // --- Параметры ---
        this.health = health;
        this.maxHealth = health;
        this.isAlive = true;

        // --- Настройки физики ---
        this.body.setSize(this.width, this.height);
        this.setCollideWorldBounds(true); // По умолчанию враги не выходят за мир
        // this.setImmovable(true); // Если враг не должен двигаться от столкновений
    }

    // Метод update вызывается из сцены или группы врагов
    update(time, delta) {
        if (!this.isAlive) return;
        // Базовый враг ничего не делает в update
        // Наследники переопределят этот метод для своей логики (движение, атака)
    }

    takeDamage(amount) {
        if (!this.isAlive) return;

        this.health -= amount;
        console.log(`${this.constructor.name} health: ${this.health}`);

        // Визуальный эффект получения урона (мигание)
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 80,
            yoyo: true,
            ease: 'Power1'
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    // Метод для выпадения лута (переопределяется наследниками)
    dropLoot() {
        // Базовый враг ничего не роняет
        // console.log(`${this.constructor.name} has no specific loot to drop.`);
    }

    die() {
        if (!this.isAlive) return;

        this.isAlive = false;
        console.log(`${this.constructor.name} died!`);

        // Попытка дропнуть лут ПЕРЕД исчезновением
        this.dropLoot();

        // Отключаем физику, делаем невидимым
        this.body.enable = false;
        this.setActive(false);
        this.setVisible(false);
        // Можно добавить анимацию смерти, звук, выпадение лута
        // this.scene.time.delayedCall(1000, () => this.destroy()); // Уничтожить объект через секунду
    }
} 