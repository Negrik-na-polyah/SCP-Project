// Сцена для пользовательского интерфейса UIScene.js

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });

        this.healthBar = null;    // Графика для полоски здоровья
        this.healthText = null;   // Текст для здоровья
        this.maxHealth = 100;   // Макс. здоровье (получим из GameScene)
        this.currentHealth = 100; // Текущее здоровье (получим из GameScene)

        // Переменные для патронов
        this.ammoText = null;
        this.currentAmmo = 0;
        this.totalAmmo = 0;
        this.magazineSize = 0;

        // Индикатор перезарядки
        this.reloadIndicator = null;
        this.isReloading = false;

        // Название оружия
        this.weaponText = null;
        this.currentWeaponName = '';

        // Game Over
        this.gameOverText = null;

        // Генераторы
        this.generatorText = null;
        this.generatorsActivated = 0;

        // Осколки карты
        this.mapShardText = null;
        this.mapShardsCollected = {}; // Будет объектом, как в реестре

        // Win Text
        this.winText = null;

        // --- Способности --- //
        this.scanStatusText = null;
        this.boostStatusText = null;
        this.scanCooldown = 30000;
        this.lastScanTime = -this.scanCooldown;
        this.boostCooldown = 45000;
        this.lastBoostTime = -this.boostCooldown;
        this.isBoosting = false;
        this.abilityUpdateTimer = null; // Ссылка на таймер способностей
    }

    create() {
        console.log('UIScene: create');

        // --- Получаем ссылку на GameScene и ее реестр ---
        const gameScene = this.scene.get('GameScene');
        if (!gameScene) {
            console.error('UIScene: GameScene not found!');
            return;
        }
        const registry = gameScene.registry;

        // --- Инициализация здоровья из реестра ---
        this.maxHealth = registry.get('playerMaxHealth') || 100;
        this.currentHealth = registry.get('playerHealth') || 100;

        // --- Инициализация патронов ---
        this.currentAmmo = registry.get('playerCurrentAmmo') || 0;
        this.magazineSize = registry.get('playerMagazineSize') || 0;
        this.totalAmmo = registry.get('playerTotalAmmo') || 0;
        this.isReloading = registry.get('playerIsReloading') || false;
        // Инициализация названия оружия
        this.currentWeaponName = registry.get('playerCurrentWeapon') || 'No Weapon';

        // --- Инициализация способностей и генераторов ---
        this.lastScanTime = registry.get('playerLastScanTime') || -this.scanCooldown;
        this.lastBoostTime = registry.get('playerLastBoostTime') || -this.boostCooldown;
        this.isBoosting = registry.get('playerIsBoosting') || false;
        this.generatorsActivated = registry.get('generatorsActivated') || 0;

        // --- Инициализация квестовых предметов ---
        this.mapShardsCollected = registry.get('playerQuestItems') || {};

        // --- Создание элементов UI ---
        const barWidth = 200;
        const barHeight = 20;
        const margin = 10;

        // Полоска здоровья (фон + текущее значение)
        this.healthBar = this.add.graphics();

        // Текст здоровья
        this.healthText = this.add.text(
            margin + barWidth / 2, // Центрируем под полоской
            margin + barHeight + 5, // Ниже полоски
            'HP: ...', // Обновится сразу
            { fontSize: '16px', fill: '#ffffff' }
        ).setOrigin(0.5, 0);

        // --- Патроны --- //
        const ammoTextY = margin + barHeight + 30; // Позиция ниже здоровья
        this.ammoText = this.add.text(
            margin,
            ammoTextY,
            'AMMO: ...',
            { fontSize: '20px', fill: '#ffff00' } // Желтый цвет для патронов
        ).setOrigin(0, 0);

        // --- Название оружия --- //
        const weaponTextY = ammoTextY + 25; // Ниже патронов
        this.weaponText = this.add.text(
            margin,
            weaponTextY,
            'WEAPON: ...',
            { fontSize: '16px', fill: '#cccccc' }
        ).setOrigin(0, 0);
        this.updateWeaponDisplay(); // Обновляем сразу

        // --- Способности UI --- //
        const abilityStartY = weaponTextY + 25; // Ниже оружия
        this.scanStatusText = this.add.text(
            margin,
            abilityStartY,
            'SCAN (Q): ...',
            { fontSize: '16px', fill: '#00ff00' } // Зеленый цвет
        ).setOrigin(0, 0);

        this.boostStatusText = this.add.text(
            margin,
            abilityStartY + 20, // Ниже скана
            'BOOST (Shift): ...',
            { fontSize: '16px', fill: '#00ffff' } // Голубой цвет
        ).setOrigin(0, 0);

        // --- Генераторы UI --- //
        const generatorTextY = abilityStartY + 45; // Ниже способностей
        this.generatorText = this.add.text(
            margin,
            generatorTextY,
            'GENERATORS: ...',
            { fontSize: '16px', fill: '#00ffff' } // Бирюзовый цвет
        ).setOrigin(0, 0);
        this.updateGeneratorDisplay(); // Обновляем сразу

        // --- Осколки карты UI --- //
        const mapShardTextY = generatorTextY + 20; // Ниже генераторов
        this.mapShardText = this.add.text(
            margin,
            mapShardTextY,
            'SHARDS: ...',
            { fontSize: '16px', fill: '#ffffff' } // Белый цвет
        ).setOrigin(0, 0);
        this.updateMapShardDisplay(); // Обновляем сразу

        this.updateAbilityStatus(); // Первоначальное обновление

        // --- Индикатор перезарядки --- //
        this.reloadIndicator = this.add.text(
            this.cameras.main.width / 2, // По центру экрана
            this.cameras.main.height - 50, // Внизу
            'ПЕРЕЗАРЯДКА...',
            { fontSize: '24px', fill: '#ff0000', backgroundColor: '#00000080' }
        ).setOrigin(0.5).setVisible(this.isReloading); // Сразу установить видимость

        // --- Game Over Текст --- // (Поверх всего)
        this.gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'GAME OVER',
            { fontSize: '64px', fill: '#ff0000', stroke: '#000000', strokeThickness: 4 }
        ).setOrigin(0.5).setVisible(false); // Изначально скрыт

        // --- Win Текст --- // (Поверх всего, включая Game Over?)
        this.winText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'YOU WIN!',
            { fontSize: '64px', fill: '#00ff00', stroke: '#000000', strokeThickness: 4 }
        ).setOrigin(0.5).setVisible(false); // Изначально скрыт

        // --- Обновление отображения здоровья ---
        this.updateHealthDisplay();
        this.updateAmmoDisplay();

        // --- Подписка на событие изменения здоровья в реестре ---
        const registryEvents = this.registry.events;
        registryEvents.on('changedata-playerHealth', this.handleHealthChange, this);
        // Также подпишемся на изменение максимального здоровья (на всякий случай)
        registryEvents.on('changedata-playerMaxHealth', this.handleMaxHealthChange, this);
        // Патроны
        registryEvents.on('changedata-playerCurrentAmmo', this.handleAmmoChange, this);
        registryEvents.on('changedata-playerTotalAmmo', this.handleAmmoChange, this);
        // Перезарядка
        registryEvents.on('changedata-playerIsReloading', this.handleReloadingChange, this);
        // Оружие
        registryEvents.on('changedata-playerCurrentWeapon', this.handleWeaponChange, this);
        // Способности
        registryEvents.on('changedata-playerLastScanTime', (parent, value) => { this.lastScanTime = value; }, this);
        registryEvents.on('changedata-playerLastBoostTime', (parent, value) => { this.lastBoostTime = value; }, this);
        registryEvents.on('changedata-playerIsBoosting', (parent, value) => { this.isBoosting = value; }, this);
        // Генераторы
        registryEvents.on('changedata-generatorsActivated', (parent, value) => {
            this.generatorsActivated = value;
            this.updateGeneratorDisplay();
        }, this);
        // Game Over
        registryEvents.on('changedata-gameOver', (parent, value) => {
            if (value === true) {
                this.gameOverText.setVisible(true);
                // Можно добавить кнопку перезапуска?
                // this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 50, 'Click to Restart', {...}).setOrigin(0.5).setInteractive().on('pointerdown', () => window.location.reload());

                // Звук поражения
                // this.sound.play('game_lose'); // ВРЕМЕННО ОТКЛЮЧЕНО
            }
        }, this);
        // Осколки карты
        registryEvents.on('changedata-playerQuestItems', (parent, value) => {
            this.mapShardsCollected = value || {}; // Обновляем локальный объект
            this.updateMapShardDisplay();
        }, this);

        // Убедимся, что UI отрисовывается поверх GameScene
        this.scene.bringToTop();

        // Таймер для обновления кулдаунов в UI каждую секунду
        this.abilityUpdateTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateAbilityStatus,
            callbackScope: this,
            loop: true
        });

        // Подписка на событие победы
        registryEvents.on('changedata-gameWon', (parent, value) => {
            if (value === true) {
                this.winText.setVisible(true);
                // Останавливаем таймер обновления способностей
                if (this.abilityUpdateTimer) {
                    this.abilityUpdateTimer.remove();
                    console.log('UIScene: Ability timer stopped due to win.');
                }
                // Можно скрыть другие элементы UI, если нужно
                 this.gameOverText.setVisible(false); // Скрыть Game Over на всякий случай

                 // Звук победы
                 // this.sound.play('game_win'); // ВРЕМЕННО ОТКЛЮЧЕНО
            }
        }, this);
    }

    // Обработчик изменения текущего здоровья
    handleHealthChange(parent, value, previousValue) {
        // console.log(`UIScene: Health changed to ${value}`);
        this.currentHealth = value;
        this.updateHealthDisplay();
    }

    // Обработчик изменения максимального здоровья
    handleMaxHealthChange(parent, value, previousValue) {
        // console.log(`UIScene: Max Health changed to ${value}`);
        this.maxHealth = value;
        this.updateHealthDisplay();
    }

    // Обработчик изменения патронов (текущих или общих)
    handleAmmoChange(parent, value, previousValue) {
        // Обновляем соответствующее значение
        if (parent.key === 'playerCurrentAmmo') {
            this.currentAmmo = value;
        } else if (parent.key === 'playerTotalAmmo') {
            this.totalAmmo = value;
        }
        this.updateAmmoDisplay();
    }

    // Обработчик изменения статуса перезарядки
    handleReloadingChange(parent, value, previousValue) {
        this.isReloading = value;
        this.updateReloadIndicator();
    }

    // Обработчик смены оружия
    handleWeaponChange(parent, value, previousValue) {
        this.currentWeaponName = value;
        this.updateWeaponDisplay();
        // Также нужно обновить патроны, так как magazineSize мог измениться
        this.currentAmmo = this.registry.get('playerCurrentAmmo');
        this.totalAmmo = this.registry.get('playerTotalAmmo');
        this.updateAmmoDisplay();
    }

    // Функция для отрисовки/обновления полоски и текста здоровья
    updateHealthDisplay() {
        const barWidth = 200;
        const barHeight = 20;
        const margin = 10;
        const healthPercentage = Math.max(0, this.currentHealth) / this.maxHealth;

        this.healthBar.clear();

        // Фон полоски (темно-красный)
        this.healthBar.fillStyle(0x800000, 0.8);
        this.healthBar.fillRect(margin, margin, barWidth, barHeight);

        // Текущее здоровье (ярко-красный)
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(margin, margin, barWidth * healthPercentage, barHeight);

        // Рамка
        this.healthBar.lineStyle(2, 0xffffff, 0.9);
        this.healthBar.strokeRect(margin, margin, barWidth, barHeight);

        // Обновляем текст
        this.healthText.setText(`HP: ${Math.max(0, this.currentHealth)} / ${this.maxHealth}`);
    }

    // Функция для обновления текста патронов
    updateAmmoDisplay() {
        if (this.ammoText) {
            this.ammoText.setText(`AMMO: ${this.currentAmmo} / ${this.totalAmmo}`);
            // Можно менять цвет, если патроны кончаются
            this.ammoText.setFill(this.currentAmmo > 0 ? '#ffff00' : '#ff0000');
        }
    }

    // Функция для показа/скрытия индикатора перезарядки
    updateReloadIndicator() {
        if (this.reloadIndicator) {
            this.reloadIndicator.setVisible(this.isReloading);
        }
    }

    // Функция для обновления текста оружия
    updateWeaponDisplay() {
        if (this.weaponText) {
            this.weaponText.setText(`WEAPON: ${this.currentWeaponName}`);
        }
    }

    // Обновление статуса способностей (вызывается по таймеру)
    updateAbilityStatus() {
        // Добавим проверку, активен ли таймер (на случай остановки)
        if (!this.abilityUpdateTimer || this.abilityUpdateTimer.paused) {
            return;
        }
        const now = this.time.now;

        // Скан
        const scanCooldownRemaining = Math.max(0, (this.lastScanTime + this.scanCooldown) - now);
        if (scanCooldownRemaining > 0) {
            this.scanStatusText.setText(`SCAN (Q): CD ${Math.ceil(scanCooldownRemaining / 1000)}s`);
            this.scanStatusText.setFill('#ff0000'); // Красный во время кд
        } else {
            this.scanStatusText.setText('SCAN (Q): READY');
            this.scanStatusText.setFill('#00ff00'); // Зеленый когда готов
        }

        // Буст
        const boostCooldownRemaining = Math.max(0, (this.lastBoostTime + this.boostCooldown) - now);
        if (this.isBoosting) {
            this.boostStatusText.setText('BOOST (Shift): ACTIVE');
            this.boostStatusText.setFill('#ffffff'); // Белый во время активации
        } else if (boostCooldownRemaining > 0) {
            this.boostStatusText.setText(`BOOST (Shift): CD ${Math.ceil(boostCooldownRemaining / 1000)}s`);
            this.boostStatusText.setFill('#ff0000');
        } else {
            this.boostStatusText.setText('BOOST (Shift): READY');
            this.boostStatusText.setFill('#00ffff');
        }
    }

    // Функция для обновления отображения генераторов
    updateGeneratorDisplay() {
        const requiredGenerators = 5; // Получать из GameScene?
        const color = this.generatorsActivated >= requiredGenerators ? '#00ff00' : '#00ffff'; // Зеленый, если все активны
        if (this.generatorText) {
            this.generatorText.setText(`GENERATORS: ${this.generatorsActivated} / ${requiredGenerators}`)
                              .setColor(color);
        }
    }

    // Функция для обновления отображения осколков карты
    updateMapShardDisplay() {
        const requiredShards = 5;
        const currentShards = this.mapShardsCollected['map_shard'] || 0;
        const color = currentShards >= requiredShards ? '#00ff00' : '#ffffff'; // Зеленый, если собраны все
        if (this.mapShardText) {
            this.mapShardText.setText(`SHARDS: ${currentShards} / ${requiredShards}`)
                             .setColor(color);
        }
    }
} 