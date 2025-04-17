// Класс для пули Bullet.js

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x = 0, y = 0, texture = 'bullet_placeholder') {
        super(scene, x, y, texture);

        // Добавляем в сцену (по умолчанию неактивна, будет активирована группой)
        // scene.add.existing(this);
        // scene.physics.add.existing(this);

        this.speed = 500;
        this.damage = 10; // Урон по умолчанию
        this.lifespan = 1000; // Время жизни в миллисекундах
        this.born = 0; // Время создания

        this.setDepth(0); // Пули под игроком/врагами
    }

    // Вызывается при получении пули из группы
    fire(shooter, angle) {
        this.born = this.scene.time.now;
        this.setPosition(shooter.x, shooter.y);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;

        // Устанавливаем скорость по углу
        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
        // Поворачиваем спрайт пули по направлению
        this.setRotation(angle);
    }

    // Вызывается при возврате пули в группу
    kill() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.body.stop(); // Останавливаем движение
    }

    // Метод для конфигурации пули по данным из оружия
    configure(bulletData) {
        this.speed = bulletData.speed || this.speed;
        this.damage = bulletData.damage || this.damage;
        this.lifespan = bulletData.lifespan || this.lifespan;
        // Можно добавить изменение текстуры, если нужно
        // this.setTexture(bulletData.texture || 'bullet_placeholder');
    }

    // Вызывается автоматически группой, если runChildUpdate: true
    update(time, delta) {
        if (time > this.born + this.lifespan) {
            this.kill();
        }
    }
} 