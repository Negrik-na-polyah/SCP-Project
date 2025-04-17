// Класс для SCP-049-2 (Чумной зомби)

import Enemy from './Enemy.js';

export default class SCP049_2 extends Enemy {
    constructor(scene, x, y) {
        // Вызываем конструктор родителя, передавая параметры SCP-049-2
        super(scene, x, y, 'enemy_placeholder', 100); // Уменьшено здоровье с 350 до 100

        this.speed = 40; // Уменьшено с 60. Скорость передвижения зомби
        this.attackDamage = 15; // Урон при атаке (пока используется урон от касания в GameScene)
        this.attackRange = 40; // Дистанция для атаки (пока не используется)
        // Можно добавить таймер для атаки, чтобы урон наносился не каждый кадр при касании
        // this.lastAttackTime = 0;
        // this.attackCooldown = 1000; // 1 секунда между атаками
    }

    update(time, delta) {
        // Вызываем update родителя (если там будет общая логика)
        super.update(time, delta);

        if (!this.isAlive) return;

        // --- Логика преследования игрока ---
        const player = this.scene.player; // Получаем игрока из сцены

        // Проверяем, существует ли игрок и жив ли он
        if (player && player.active && player.health > 0) {
            // Вычисляем направление к игроку
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

            // Двигаемся в сторону игрока
            this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);

            // Поворачиваем спрайт в сторону игрока (опционально)
            // this.setRotation(angle);

            // --- Логика атаки (пока не активна, используем коллизию) ---
            // const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            // if (distance < this.attackRange && time > this.lastAttackTime + this.attackCooldown) {
            //     console.log('SCP-049-2 attacks!');
            //     player.takeDamage(this.attackDamage);
            //     this.lastAttackTime = time;
            // }
        } else {
            // Если игрока нет или он мертв, останавливаемся
            this.setVelocity(0);
        }
    }

    // Переопределяем метод для выпадения лута
    dropLoot() {
        console.log(`Checking loot drop for ${this.constructor.name}`);
        const dropChance = 0.25; // 25% шанс

        if (Math.random() < dropChance) {
            const ammoAmount = Phaser.Math.Between(5, 10);
            const pickupType = 'ammo_pistol';
            const texture = 'ammo_pistol_placeholder';

            console.log(`Dropping ${ammoAmount} ${pickupType}`);

            // Получаем группу пикапов из сцены (GameScene)
            const pickupsGroup = this.scene.pickups;
            if (pickupsGroup) {
                const lootSprite = pickupsGroup.create(this.x, this.y, texture);
                lootSprite.setData('pickupType', pickupType);
                lootSprite.setData('amount', ammoAmount);
                 // Можно добавить небольшой случайный импульс, чтобы патроны "выпали"
                 const velocityX = Phaser.Math.Between(-50, 50);
                 const velocityY = Phaser.Math.Between(-50, 50);
                 lootSprite.body.setVelocity(velocityX, velocityY);
            } else {
                console.warn('Could not find pickups group in the scene to drop loot.');
            }
        } else {
            console.log('No loot dropped.');
        }
    }

    // Можно переопределить die(), если у 049-2 особая смерть (анимация, звук)
    // die() {
    //     super.die();
    //     // Дополнительная логика смерти 049-2
    // }
} 