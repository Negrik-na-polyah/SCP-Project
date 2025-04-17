// Класс для игрока Player.js
import WEAPON_DATA from '../config/weapons.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture = 'player_placeholder') {
        super(scene, x, y, texture);

        // Добавляем себя в сцену и физику
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // --- Основные параметры ---
        this.baseSpeed = 200; // Базовая скорость, сохраняем для буста
        this.speed = this.baseSpeed;
        this.health = 100; // Начальное здоровье
        this.maxHealth = 100;

        // --- Оружие/Инвентарь ---
        this.inventory = ['glock17', 'm870', 'ak74']; // Пример начального инвентаря
        this.currentWeaponKey = 'glock17';
        this.currentWeaponData = null; // Здесь будут характеристики текущего оружия
        this.bullets = null; // Ссылка на группу пуль

        // Убираем характеристики конкретного оружия отсюда
        // this.fireRate = 250;
        // this.magazineSize = 15;
        // this.reloadTime = 1500;

        // Патроны теперь зависят от типа оружия (нужна доработка для разных типов)
        // Пока оставим как есть, но нужно будет хранить патроны для каждого типа (pistol, rifle...)
        this.currentAmmo = 0;
        this.totalAmmo = {}; // Объект для хранения запаса патронов по типам
        this.lastFired = 0;
        this.isReloading = false;

        // --- Предметы для квестов ---
        this.questItems = {}; // <--- ИНИЦИАЛИЗАЦИЯ ДОБАВЛЕНА

        // --- Способности ---
        this.scanCooldown = 30000; // 30 секунд
        this.lastScanTime = -this.scanCooldown; // Доступно сразу
        this.scanDuration = 10000; // 10 секунд

        this.boostCooldown = 45000; // 45 секунд
        this.lastBoostTime = -this.boostCooldown; // Доступно сразу
        this.boostDuration = 500; // 0.5 секунды
        this.boostMultiplier = 5; // 500%
        this.isBoosting = false;

        // --- Управление ---
        this.cursors = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            scan: Phaser.Input.Keyboard.KeyCodes.Q,
            boost: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            interact: Phaser.Input.Keyboard.KeyCodes.E, // <--- Клавиша E для взаимодействия
            weapon1: Phaser.Input.Keyboard.KeyCodes.ONE,
            weapon2: Phaser.Input.Keyboard.KeyCodes.TWO,
            weapon3: Phaser.Input.Keyboard.KeyCodes.THREE
        });

        // --- Настройки физики ---
        this.setCollideWorldBounds(true); // Не выходить за границы мира
        this.body.setSize(this.width * 0.8, this.height * 0.8); // Можно уменьшить хитбокс
        // this.setDrag(0.9); // Можно добавить трение для остановки

        // Инициализируем патроны для стартового инвентаря
        this.initializeAmmo();
        // Экипируем стартовое оружие
        this.equipWeapon(this.currentWeaponKey);
    }

    // Метод для установки ссылки на группу пуль
    setBullets(bulletsGroup) {
        this.bullets = bulletsGroup;
    }

    // Метод update вызывается из update сцены
    update(time, delta) {
        if (this.health <= 0 || !this.active) return; // Не обновлять, если мертв или неактивен

        // Движение обрабатывается всегда (даже во время буста)
        this.handleMovement();
        // Поворот только если не перезаряжаемся (чтобы не мешать анимации перезарядки, если будет)
        if (!this.isReloading) {
            this.handleRotation();
        }
        // Обработка остального ввода
        this.handleInput(time);
    }

    handleMovement() {
        this.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.setVelocityX(-this.speed);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(this.speed);
        }
        if (this.cursors.up.isDown) {
            this.setVelocityY(-this.speed);
        } else if (this.cursors.down.isDown) {
            this.setVelocityY(this.speed);
        }

        // Нормализация
        const velocity = this.body.velocity;
        if (velocity.x !== 0 && velocity.y !== 0) {
            velocity.normalize().scale(this.speed);
        }
    }

    handleRotation() {
        const pointer = this.scene.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
        this.setRotation(angle);
    }

    // Переименовали handleShooting в handleInput
    handleInput(time) {
        // Перезарядка
        if (Phaser.Input.Keyboard.JustDown(this.cursors.reload)) {
            this.startReload();
        }
        // Смена оружия
        if (Phaser.Input.Keyboard.JustDown(this.cursors.weapon1) && this.inventory.length > 0) {
            this.equipWeapon(this.inventory[0]);
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.weapon2) && this.inventory.length > 1) {
            this.equipWeapon(this.inventory[1]);
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.weapon3) && this.inventory.length > 2) {
            this.equipWeapon(this.inventory[2]);
        }

        // --- Способности ---
        // Сканирование
        if (Phaser.Input.Keyboard.JustDown(this.cursors.scan)) {
            this.activateScan(time);
        }
        // Турбоускорение
        if (Phaser.Input.Keyboard.JustDown(this.cursors.boost)) {
            this.activateBoost(time);
        }
    }

    // Метод для выстрела (вызывается из сцены по клику)
    shoot(time) {
        if (!this.bullets || this.isReloading || this.health <= 0 || !this.currentWeaponData) return;

        // Проверка патронов
        if (this.currentAmmo <= 0) {
            this.startReload();
            return;
        }

        // Проверка скорострельности
        if (time < this.lastFired + this.fireRate) return;

        // --- Логика создания пули(ь) --- //
        const weaponType = this.currentWeaponData.type;
        const bulletData = this.currentWeaponData.bullet;
        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, this.scene.input.activePointer.worldX, this.scene.input.activePointer.worldY);

        if (weaponType === 'shotgun') {
            // Стрельба дробью
            const pellets = this.currentWeaponData.pellets || 1;
            const spread = this.currentWeaponData.spread || 0;
            for (let i = 0; i < pellets; i++) {
                const angleOffset = Phaser.Math.FloatBetween(-spread / 2, spread / 2);
                const pelletAngle = baseAngle + angleOffset;
                const bullet = this.bullets.get();
                if (bullet) {
                    bullet.configure(bulletData); // Передаем конфиг пули
                    bullet.setAngle(pelletAngle); // Устанавливаем угол поворота спрайта
                    bullet.fire(this, pelletAngle); // Стреляем под нужным углом
                }
            }
        } else {
            // Обычный выстрел
            const bullet = this.bullets.get();
            if (bullet) {
                bullet.configure(bulletData); // Передаем конфиг пули
                 bullet.setAngle(baseAngle); // Устанавливаем угол поворота спрайта
                bullet.fire(this, baseAngle); // Стреляем (угол возьмется из this)
            }
        }

        this.lastFired = time;
        this.currentAmmo--;
        this.scene.registry.set('playerCurrentAmmo', this.currentAmmo);

        // Воспроизведение звука выстрела
        let shootSoundKey = 'shoot_pistol'; // По умолчанию
        if (weaponType === 'shotgun') {
             shootSoundKey = 'shoot_shotgun';
        } else if (weaponType === 'rifle') {
             shootSoundKey = 'shoot_rifle';
        }
        // this.scene.sound.play(shootSoundKey, { volume: 0.5 }); // ВРЕМЕННО ОТКЛЮЧЕНО
    }

    // Начать процесс перезарядки
    startReload() {
        if (this.isReloading || !this.currentWeaponData) return;

        const ammoType = this.currentWeaponData.type;
        const reserve = this.totalAmmo[ammoType] || 0;
        // Не перезаряжать, если магазин полон или нет патронов в запасе
        if (this.currentAmmo === this.magazineSize || reserve <= 0) {
             console.log(`Cannot reload: ammo ${this.currentAmmo}/${reserve}`);
            return;
        }

        console.log('Reloading...');
        this.isReloading = true;
        this.scene.registry.set('playerIsReloading', true);

        // Воспроизведение звука перезарядки
        // this.scene.sound.play('reload_weapon', { volume: 0.6 }); // ВРЕМЕННО ОТКЛЮЧЕНО

        // Сохраняем таймер, чтобы можно было отменить при смене оружия
        this.reloadTimer = this.scene.time.delayedCall(this.reloadTime, this.finishReload, [], this);
    }

    // Завершить процесс перезарядки (вызывается по таймеру)
    finishReload() {
        if (!this.active || !this.currentWeaponData) return;

        const ammoType = this.currentWeaponData.type;
        const reserve = this.totalAmmo[ammoType] || 0;
        const ammoNeeded = this.magazineSize - this.currentAmmo;
        const ammoToTransfer = Math.min(ammoNeeded, reserve);

        if (ammoToTransfer > 0) {
            this.currentAmmo += ammoToTransfer;
            this.totalAmmo[ammoType] -= ammoToTransfer;

            this.scene.registry.set('playerCurrentAmmo', this.currentAmmo);
            this.scene.registry.set('playerTotalAmmo', this.totalAmmo[ammoType]);
            console.log(`Reload finished. Ammo: ${this.currentAmmo}/${this.totalAmmo[ammoType]}`);
        } else {
            console.log('No ammo in reserve to reload.');
        }

        this.isReloading = false;
        this.reloadTimer = null; // Сбрасываем таймер
        this.scene.registry.set('playerIsReloading', false);
    }

    // Метод получения урона
    takeDamage(amount) {
        if (this.health <= 0) return; // Не получать урон, если уже мертв

        this.health -= amount;
        this.health = Math.max(0, this.health);
        this.scene.registry.set('playerHealth', this.health);
        console.log(`Player took ${amount} damage. Current health: ${this.health}`);

        // Воспроизведение звука
        // this.scene.sound.play('player_hurt'); // ВРЕМЕННО ОТКЛЮЧЕНО

        if (this.health <= 0 && this.active) {
            this.die();
        }
    }

    // Метод "смерти" игрока
    die() {
        if (this.health <= 0 && this.active) {
            console.log('Player died! GAME OVER.');
            this.setActive(false);
            this.setVisible(false);
            this.body.enable = false;

            this.scene.registry.set('playerHealth', 0);
            this.scene.registry.set('gameOver', true); // <--- Устанавливаем флаг Game Over

            // Воспроизведение звука смерти
            // this.scene.sound.play('player_death'); // ВРЕМЕННО ОТКЛЮЧЕНО

            this.scene.cameras.main.stopFollow();

            // Убираем перезапуск сцены
            // this.scene.time.delayedCall(2000, () => {
            //     this.scene.scene.restart();
            //     if (this.scene.scene.isActive('UIScene')) {
            //         this.scene.scene.get('UIScene').scene.restart();
            //     }
            // });
        }
    }

    // Инициализация запаса патронов для оружия в инвентаре
    initializeAmmo() {
        for (const weaponKey of this.inventory) {
            const weaponData = WEAPON_DATA[weaponKey];
            if (weaponData && weaponData.type !== 'special' && weaponData.totalAmmoMax > 0) {
                // Используем тип оружия как ключ для хранения патронов
                if (!this.totalAmmo[weaponData.type]) {
                    this.totalAmmo[weaponData.type] = 0;
                }
                // Добавляем максимальный запас (можно изменить логику)
                this.totalAmmo[weaponData.type] = weaponData.totalAmmoMax;
            }
        }
        console.log('Initial ammo reserve:', this.totalAmmo);
    }

    // Экипировать оружие
    equipWeapon(weaponKey) {
        if (!this.inventory.includes(weaponKey) || this.isReloading) {
            console.log(`Cannot equip ${weaponKey}`);
            return;
        }

        console.log(`Equipping ${weaponKey}`);
        this.currentWeaponKey = weaponKey;
        this.currentWeaponData = WEAPON_DATA[weaponKey];

        // Устанавливаем характеристики игрока по данным оружия
        this.fireRate = this.currentWeaponData.fireRate;
        this.magazineSize = this.currentWeaponData.magazineSize;
        this.reloadTime = this.currentWeaponData.reloadTime;
        // this.damage = this.currentWeaponData.damage; // Урон будет у пули

        // Сбрасываем патроны в магазине (или нужно запоминать остаток?)
        // Пока сделаем сброс и полную перезарядку при смене
        this.currentAmmo = this.magazineSize; // Условно ставим полный магазин
        const ammoType = this.currentWeaponData.type;
        const reserve = this.totalAmmo[ammoType] || 0;
        const needed = this.magazineSize - this.currentAmmo;
        const canTake = Math.min(needed, reserve);
        // this.currentAmmo += canTake;
        // this.totalAmmo[ammoType] -= canTake;

        // Обновляем реестр для UI
        this.scene.registry.set('playerCurrentWeapon', this.currentWeaponData.name);
        this.scene.registry.set('playerCurrentAmmo', this.currentAmmo);
        this.scene.registry.set('playerMagazineSize', this.magazineSize);
        this.scene.registry.set('playerTotalAmmo', this.totalAmmo[ammoType] || 0);

        // Отменяем текущую перезарядку, если была
        if (this.reloadTimer) {
            this.reloadTimer.remove();
            this.isReloading = false;
            this.scene.registry.set('playerIsReloading', false);
        }
    }

    // Метод для удаления оружия из инвентаря
    removeWeapon(weaponKey) {
        const index = this.inventory.indexOf(weaponKey);
        if (index === -1) {
            console.warn(`Tried to remove weapon ${weaponKey} but it was not found in inventory.`);
            return;
        }

        console.log(`Removing ${weaponKey} from inventory.`);
        this.inventory.splice(index, 1);

        // Если удалили текущее оружие, экипируем следующее (или ничего)
        if (this.currentWeaponKey === weaponKey) {
            const nextWeapon = this.inventory.length > 0 ? this.inventory[0] : null;
            if (nextWeapon) {
                this.equipWeapon(nextWeapon);
            } else {
                 console.log("Inventory empty after removing weapon.");
                 this.currentWeaponKey = null;
                 this.currentWeaponData = null;
                 // Обновляем UI
                 this.scene.registry.set('playerCurrentWeapon', 'No Weapon');
                 this.scene.registry.set('playerCurrentAmmo', 0);
                 this.scene.registry.set('playerMagazineSize', 0);
                 this.scene.registry.set('playerTotalAmmo', 0);
            }
        }
         // TODO: Обновить UI, если есть отображение списка оружия
    }

    // --- Логика способностей ---
    activateScan(time) {
        if (time < this.lastScanTime + this.scanCooldown) {
            console.log(`Scan on cooldown. Remaining: ${((this.lastScanTime + this.scanCooldown) - time) / 1000}s`);
            return;
        }
        console.log('Activating Scan!');
        this.lastScanTime = time;
        this.scene.registry.set('playerLastScanTime', time); // Для UI

        // Вызываем метод в сцене для визуального эффекта
        if (this.scene.performScan) {
            this.scene.performScan(this.x, this.y, this.scanDuration);
        }
    }

    activateBoost(time) {
        if (this.isBoosting || time < this.lastBoostTime + this.boostCooldown) {
            console.log(`Boost on cooldown or active. Remaining: ${((this.lastBoostTime + this.boostCooldown) - time) / 1000}s`);
            return;
        }
        console.log('Activating Boost!');
        this.lastBoostTime = time;
        this.scene.registry.set('playerLastBoostTime', time);
        this.isBoosting = true;
        this.scene.registry.set('playerIsBoosting', true);

        // Увеличиваем скорость
        this.speed = this.baseSpeed * this.boostMultiplier;
        // Можно добавить визуальный эффект (трейл, цвет)
        this.setTint(0x00ffff); // Голубой цвет во время буста

        // Запускаем таймер для остановки буста
        this.scene.time.delayedCall(this.boostDuration, this.stopBoost, [], this);
    }

    stopBoost() {
        if (!this.isBoosting) return;
        console.log('Stopping Boost.');
        this.speed = this.baseSpeed; // Возвращаем базовую скорость
        this.isBoosting = false;
        this.scene.registry.set('playerIsBoosting', false);
        this.clearTint(); // Убираем эффект
    }

    // Метод для лечения игрока
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount); // Не лечить выше максимума
        console.log(`Player healed. Current health: ${this.health}`);
        // Обновляем реестр для UI
        this.scene.registry.set('playerHealth', this.health);
        // Можно добавить звук или эффект лечения
    }

    // Метод для добавления патронов в запас
    addAmmo(ammoType, amount) {
        if (!this.totalAmmo[ammoType]) {
            this.totalAmmo[ammoType] = 0;
        }
        this.totalAmmo[ammoType] += amount;
        console.log(`Picked up ${amount} ${ammoType} ammo. Total: ${this.totalAmmo[ammoType]}`);

        // Обновляем UI, если текущее оружие использует этот тип патронов
        if (this.currentWeaponData && this.currentWeaponData.type === ammoType) {
            this.scene.registry.set('playerTotalAmmo', this.totalAmmo[ammoType]);
        }
    }
} 