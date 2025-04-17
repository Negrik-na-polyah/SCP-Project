// Класс для SCP-173 (Скульптура)

import Enemy from './Enemy.js';

export default class SCP173 extends Enemy {
    constructor(scene, x, y) {
        // Вызываем конструктор родителя
        super(scene, x, y, 'scp173_placeholder', 150); // Уменьшено здоровье с 5000 до 150

        this.speed = 180; // Уменьшено с 450. Скорость движения, когда его не видят
        this.attackDamage = 5000; // Мгновенное убийство
        this.attackRange = 50; // Дистанция для атаки "свернуть шею"

        // Флаг, видит ли игрок SCP-173
        this.isSeenByPlayer = false;

        // Таймер для проверки видимости, чтобы не делать это каждый кадр
        this.visibilityCheckTimer = null;
        this.visibilityCheckInterval = 100; // Проверять каждые 100 мс

        this.setupVisibilityCheck(); // <<< РАСКОММЕНТИРОВАНО

        // SCP-173 должен быть неподвижным при столкновении с игроком
        this.setImmovable(true);
    }

    // Настройка периодической проверки видимости
    setupVisibilityCheck() {
        if (this.visibilityCheckTimer) {
            this.visibilityCheckTimer.remove();
        }
        this.visibilityCheckTimer = this.scene.time.addEvent({
            delay: this.visibilityCheckInterval,
            callback: this.checkPlayerVisibility,
            callbackScope: this,
            loop: true
        });
    }

    // Проверка, видит ли игрок SCP-173
    checkPlayerVisibility() {
        // ВРЕМЕННО ОТКЛЮЧЕНО - УБИРАЕМ ОТКЛЮЧЕНИЕ
        // this.isSeenByPlayer = false; // По умолчанию считаем, что не видит
        // return;
        // --- Начало раскомментированного кода --- 
        if (!this.isAlive || !this.scene.player || !this.scene.player.active) {
            this.isSeenByPlayer = false; // Считаем невидимым, если игрок мертв/неактивен
            return;
        }

        const player = this.scene.player;
        const scene = this.scene;

        // 1. Проверка нахождения в поле зрения камеры
        if (!scene.cameras.main.worldView.contains(this.x, this.y)) {
            this.isSeenByPlayer = false;
            // console.log('SCP-173 not in camera view'); // Debug
            return;
        }

        // 2. Проверка линии видимости (вместо raycast используем итерацию и LineToRectangle)
        const line = new Phaser.Geom.Line(player.x, player.y, this.x, this.y);
        const wallLayer = scene.wallsLayer;

        if (!wallLayer) {
            this.isSeenByPlayer = false;
            console.warn('SCP-173 Visibility Check: No wallsLayer found!'); // Debug
            return;
        }

        let wallDetected = false;
        const walls = wallLayer.getChildren(); // Получаем массив стен
        for (const wall of walls) {
            // Проверяем пересечение линии видимости с границами текущей стены
            if (Phaser.Geom.Intersects.LineToRectangle(line, wall.getBounds())) {
                wallDetected = true;
                break; // Нашли стену на пути, дальше проверять не нужно
            }
        }

        if (wallDetected) {
            // console.log('SCP-173 Visibility Check: Wall detected between player and SCP-173'); // Debug
            this.isSeenByPlayer = false;
        } else {
            // console.log('SCP-173 Visibility Check: No wall detected.'); // Debug
            // Если дошли сюда, то SCP-173 в камере и нет стен на пути - игрок видит
            this.isSeenByPlayer = true;
        }
        // console.log(`SCP-173 isSeenByPlayer: ${this.isSeenByPlayer}`); // Debug 
        // --- Конец раскомментированного кода ---
    }

    update(time, delta) {
        super.update(time, delta);
        if (!this.isAlive) return;

        const player = this.scene.player;

        // Если игрок не видит SCP-173, двигаемся к нему
        if (!this.isSeenByPlayer && player && player.active && player.health > 0) {
            // Проверяем дистанцию для атаки
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

            if (distance < this.attackRange) {
                // Атака - мгновенное убийство
                console.log('SCP-173 snaps neck!');
                player.takeDamage(this.attackDamage);
                this.setVelocity(0); // Останавливаемся после атаки
            } else {
                // Движение к игроку
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            }
        } else {
            // Если игрок видит SCP-173 (или игрок мертв), останавливаемся
            this.setVelocity(0);
        }
    }

    // Переопределяем takeDamage, т.к. 173 уязвим только к спец. оружию (пока игнорируем)
    takeDamage(amount, weaponType = 'default') {
        // TODO: Добавить проверку на слабости (Micro HID)
        console.log(`SCP-173 hit, but is resistant to ${weaponType}`);
        // Небольшой урон все же наносим для обратной связи
        // super.takeDamage(amount * 0.01);
        // Пока оставим стандартный урон для теста
         super.takeDamage(amount);
    }

    die() {
        if (this.visibilityCheckTimer) {
            this.visibilityCheckTimer.remove();
            this.visibilityCheckTimer = null;
        }
        super.die();
        // Доп. эффекты смерти 173?
    }
} 