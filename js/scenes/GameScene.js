// Основная игровая сцена GameScene.js

// Импортируем классы
import Player from '../entities/Player.js';
import Bullet from '../entities/Bullet.js';
import Enemy from '../entities/Enemy.js';
import DungeonGenerator from '../utils/DungeonGenerator.js';
import SCP049_2 from '../entities/SCP049_2.js';
import SCP173 from '../entities/SCP173.js';
import SCP106 from '../entities/SCP106.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.player = null;
        this.bullets = null;
        this.enemies = null;
        this.map = null;
        this.tileset = null;
        this.groundAndWallsLayer = null;
        this.interactiveObjects = null;
        this.pickups = null;
        this.interactionHint = null;
        this.objectToInteract = null;

        // Состояние для SCP-914
        this.isWaitingFor914Setting = false;
        this.interactingSCP914 = null;
    }

    preload() {
        console.log('GameScene: preload');
        // Загрузка уже происходит в PreloaderScene
    }

    create() {
        console.log('GameScene: create - Инициализация');

        // Устанавливаем белый фон для сцены, чтобы лучше видеть объекты
        this.cameras.main.setBackgroundColor('#ffffff');

        // --- Параметры Генерации --- //
        const mapWidth = 100;
        const mapHeight = 80;
        const maxRooms = 30;
        const minRoomSize = 8;
        const maxRoomSize = 15;
        const tileSize = 32;

        // --- Генерация Карты --- //
        const generator = new DungeonGenerator(this);
        const { mapData, rooms, objectsData } = generator.generate(
            mapWidth, mapHeight, maxRooms, minRoomSize, maxRoomSize
        );

        // --- Инициализация данных в реестре ---
        this.registry.set('playerHealth', 100);
        this.registry.set('playerMaxHealth', 100);
        const initialPlayer = new Player(this, -100, -100); // Временный
        this.registry.set('playerCurrentAmmo', initialPlayer.currentAmmo);
        this.registry.set('playerMagazineSize', initialPlayer.magazineSize);
        this.registry.set('playerTotalAmmo', initialPlayer.totalAmmo);
        this.registry.set('playerIsReloading', initialPlayer.isReloading);
        initialPlayer.destroy();
        this.registry.set('generatorsActivated', 0);
        this.registry.set('playerQuestItems', {});
        this.registry.set('playerHasCraftedMap', false);
        this.registry.set('gameWon', false);
        this.registry.set('gameOver', false);

        // --- Создание Карты (Вместо Tilemap рисуем фигуры) --- //
        // this.map = this.make.tilemap({ data: mapData, tileWidth: tileSize, tileHeight: tileSize, width: mapWidth, height: mapHeight });
        // this.tileset = this.map.addTilesetImage('placeholder_tileset', 'placeholder_tileset', tileSize, tileSize, 0, 0);
        // console.log('--- Tileset Check ---'); // Добавлено для диагностики
        // console.log('Tileset object:', this.tileset); // Добавлено для диагностики
        // if (!this.tileset) {
        //     console.error("Тайлсет 'placeholder_tileset' не был загружен или добавлен!");
        //     return; // Прерываем создание, если тайлсета нет
        // }

        // this.groundAndWallsLayer = this.map.createLayer(0, this.tileset, 0, 0);
        // if (!this.groundAndWallsLayer) {
        //     console.error(`Не удалось создать слой 0 из тайлсета ${this.tileset?.name || '(тайлсет не найден)'}. Существующие слои:`, this.map.layers.map(l => l.name));
        //     // Дополнительная диагностика
        //     console.log('Map data dimensions:', this.map.widthInPixels, 'x', this.map.heightInPixels);
        //     console.log('Tileset details:', this.tileset);
        //     return; // Прерываем, если слой не создан
        // }
        // this.groundAndWallsLayer.setDepth(0); // Устанавливаем глубину слоя карты

        // Рисуем карту прямоугольниками
        const mapWidthPixels = mapWidth * tileSize;
        const mapHeightPixels = mapHeight * tileSize;
        this.mapRects = this.add.group(); // Группа для хранения прямоугольников карты
        this.wallsLayer = this.physics.add.staticGroup(); // Инициализация группы стен
        console.log(`[DEBUG Collision] 1. wallsLayer created: ${!!this.wallsLayer}`); // ЛОГ 1
        let wallCount = 0; // Счетчик стен

        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const tileIndex = mapData[y][x];
                const worldX = x * tileSize + tileSize / 2; // Центр тайла
                const worldY = y * tileSize + tileSize / 2; // Центр тайла

                if (tileIndex === 1) { // Стена
                    const wall = this.add.rectangle(worldX, worldY, tileSize, tileSize, 0x404040); // Темно-серые стены
                    this.physics.add.existing(wall, true); // Добавляем в физику как статичный объект
                    this.wallsLayer.add(wall); // Добавляем в группу стен
                    wallCount++; // Увеличиваем счетчик
                } else if (tileIndex === 0) { // Пол
                     this.add.rectangle(worldX, worldY, tileSize, tileSize, 0x808080); // Серый пол
                }
                // Добавить другие типы тайлов при необходимости
            }
        }

        console.log(`[DEBUG Collision] 2. Total walls added to wallsLayer: ${wallCount}`); // ЛОГ 2
        console.log(`[DEBUG Collision] 3. wallsLayer.getLength(): ${this.wallsLayer.getLength()}`); // ЛОГ 3

        // --- Группы объектов --- //
        this.bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true, maxSize: 30 });
        this.bullets.children.iterate(bullet => { if (bullet) bullet.setActive(false).setVisible(false).body.enable = false; });
        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
        this.interactiveObjects = this.physics.add.group({ immovable: true });
        this.pickups = this.physics.add.group({});

        // --- Текст для подсказок (например, для подбора) ---
        this.pickupText = this.add.text(0, 0, '[E] Pickup', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#000000'
        }).setDepth(100).setVisible(false).setOrigin(0.5, 1.5); // Смещаем немного над объектом

        // --- Инициализация объектов из данных генератора ---
        this.initializeObjectsFromData(objectsData, mapWidth, mapHeight, tileSize); // Передаем размеры и тайлсайз
        console.log(`[DEBUG Pickup] Initial pickups group size: ${this.pickups.getLength()}`); // ЛОГ 7

        // --- Настройка Физики и Коллизий (ПОСЛЕ создания игрока и объектов) --- //
        if (this.player) {
             console.log('[DEBUG Collision] 4. Setting up Player vs Walls collision.'); // ЛОГ 4
             this.physics.add.collider(this.player, this.wallsLayer);
        } else {
            console.error('[DEBUG Collision] Player not created, cannot set up Player vs Walls collision!');
        }

        if (this.enemies.getLength() > 0) {
            console.log('[DEBUG Collision] 5. Setting up Enemies vs Walls collision.'); // ЛОГ 5
            this.physics.add.collider(this.enemies, this.wallsLayer);
        } else {
             console.log('[DEBUG Collision] No enemies created, skipping Enemies vs Walls collision.');
        }
         // --- Проверка коллизий пуль --- //
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletEnemyCollision, null, this);
        this.physics.add.collider(this.bullets, this.wallsLayer, this.handleBulletWallCollision, null, this);

        // --- Проверка коллизий врагов с игроком --- //
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

        // --- Проверка коллизий игрока с интерактивными объектами и пикапами --- //
        this.physics.add.overlap(this.player, this.pickups, this.handlePlayerPickupOverlap, null, this);
        this.physics.add.overlap(this.player, this.interactiveObjects, this.handlePlayerObjectCollision, null, this);
        console.log('[DEBUG Collision] 6. Collision setup complete.'); // ЛОГ 6
    } // <<< END OF create()

    update(time, delta) {
        const isGameOver = this.registry.get('gameOver');
        const isGameWon = this.registry.get('gameWon');

        if (this.player && this.player.active && !isGameOver && !isGameWon) {
            this.player.update(time, delta);
        }

        // Проверка взаимодействия по клавише E
        if (this.player && this.player.active && !isGameOver && !isGameWon && this.objectToInteract && Phaser.Input.Keyboard.JustDown(this.player.cursors.interact)) {
             // Проверка, не ждем ли мы ввода для 914
             if (!this.isWaitingFor914Setting) {
                console.log(`Interacting with ${this.objectToInteract.getData('objectType')}`);
                this.interactWithObject(this.player, this.objectToInteract);
             }
        }

        // Сброс объекта для взаимодействия
        if ((isGameOver || isGameWon || !this.physics.overlap(this.player, this.interactiveObjects)) && this.objectToInteract && !this.isWaitingFor914Setting) {
            if (this.interactionHint) { this.interactionHint.destroy(); this.interactionHint = null; }
            this.objectToInteract = null;
            // Сбрасываем состояние ожидания для 914 при отходе от объекта
            if (this.isWaitingFor914Setting) {
                 this.isWaitingFor914Setting = false;
                 this.events.emit('updateStatus', ''); // Очищаем статус
            }
        }

        // Остановка врагов при победе
        if (isGameWon) {
            this.enemies.children.each(enemy => {
                 if (enemy.active && enemy.body) {
                      enemy.body.stop();
                 }
             });
        }

        // Обновление врагов
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) {
                enemy.update(time, delta);
            }
        });

        // --- Логика SCP-106 (пример) ---
        // ... existing code ...

        // --- Обновление подсказки для подбора --- //
        // Скрываем подсказку по умолчанию в каждом кадре
        // Если игрок не перекрывает ни один предмет, она останется скрытой
        this.pickupText.setVisible(false);
        // Проверяем перекрытие снова, чтобы показать текст, если перекрытие есть
        // (handlePlayerPickupOverlap вызовется, если есть перекрытие, и покажет текст)
        this.physics.overlap(this.player, this.pickups, this.handlePlayerPickupOverlap, null, this);
    } // <<< END OF update()

     // Callback столкновения пули со стеной
    handleBulletWallCollision(bullet, wall) {
        if (bullet.active) {
            // console.log('Bullet hit wall');
            bullet.kill(); // Используем метод kill пули
        }
    }

    // Callback столкновения игрока с врагом
    handlePlayerEnemyCollision(player, enemy) {
        // Пока простой урон игроку
        // TODO: Добавить кулдаун урона
         if (player.active && enemy.active) {
             const damageAmount = enemy.damage || 10; // Урон по умолчанию
             player.takeDamage(damageAmount);
              // Отбрасывание?
              // const knockback = 100;
              // player.body.velocity.x = (player.x < enemy.x ? -knockback : knockback);
              // player.body.velocity.y = (player.y < enemy.y ? -knockback : knockback);
         }
    }

    // Callback столкновения пули с врагом
    handleBulletEnemyCollision(bullet, enemy) {
        if (bullet.active && enemy.active && enemy.isAlive) {
            enemy.takeDamage(bullet.damage); // Используем урон пули
            bullet.destroy(); // Уничтожаем пулю
        }
    }

     // Callback наведения на интерактивный объект
    handlePlayerObjectCollision(player, obj) {
        if (!player.active || this.isWaitingFor914Setting || this.registry.get('gameOver') || this.registry.get('gameWon')) {
             if (this.interactionHint) { this.interactionHint.destroy(); this.interactionHint = null; }
             this.objectToInteract = null;
            return;
        }
        
        const type = obj.getData('objectType');
        let canInteract = false;
        let hintText = '';

        if (type === 'generator' && !obj.getData('isActivated')) {
            canInteract = true;
            hintText = 'Activate Generator [E]';
        } else if (type === 'locker' && !obj.getData('searched')) {
            canInteract = true;
            hintText = 'Search Locker [E]';
        } else if (type === 'scp_914' && !player.getData('hasCraftedMap')) { 
            canInteract = true;
            const shards = player.questItems['map_shard'] || 0;
            if (shards >= 5) {
                hintText = `Refine Map (${shards}/5) [E] (Fine)`;
            } else {
                hintText = `Need Shards (${shards}/5) [E] (Fine)`;
            }
        } else if (type === 'medkit' && !obj.getData('used')) { // Если аптечка - интерактивный объект
            canInteract = true;
            hintText = 'Use Medkit [E]';
        }

        if (canInteract && this.objectToInteract !== obj) {
            this.objectToInteract = obj;
            if (!this.interactionHint) {
                 this.interactionHint = this.add.text(0, 0, hintText, {
                    font: '16px monospace', fill: '#ffffff', backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: { x: 5, y: 3 }
                }).setOrigin(0.5, 1); 
            }
             this.interactionHint.setText(hintText);
             this.interactionHint.setPosition(obj.x, obj.y - obj.height / 1.5); // Позиция над объектом
             this.interactionHint.setVisible(true);

        } else if (!canInteract && this.objectToInteract === obj) {
            this.objectToInteract = null;
            if (this.interactionHint) { this.interactionHint.setVisible(false); }
        }
    }

     // Метод взаимодействия с объектом (вызывается по клавише E)
    interactWithObject(player, obj) {
        if (!obj || !player || !player.active) return;

        const type = obj.getData('objectType');

        if (type === 'generator' && !obj.getData('isActivated')) {
            obj.setData('isActivated', true);
            let currentActivated = this.registry.get('generatorsActivated') || 0;
            this.registry.set('generatorsActivated', currentActivated + 1);
            if (this.interactionHint) { this.interactionHint.setVisible(false); }
            this.objectToInteract = null;
            obj.setTexture('generator_on_placeholder'); // Меняем текстуру
            this.sound.play('generator_activate');
        
        } else if (type === 'locker' && !obj.getData('searched')) {
            console.log('Searching locker...');
            obj.setTexture('locker_open_placeholder'); 
            obj.setData('searched', true);
            if (this.interactionHint) { this.interactionHint.setVisible(false); }
            this.objectToInteract = null;
            
            const lootTable = [
                { type: 'ammo_pistol', amount: [10, 15], chance: 0.30, texture: 'ammo_pistol_placeholder' },
                { type: 'ammo_shotgun', amount: [4, 6], chance: 0.20, texture: 'ammo_shotgun_placeholder' },
                { type: 'medkit', heal: 30, chance: 0.15, texture: 'medkit_placeholder' },
                { type: 'map_shard', questItemKey: 'map_shard', chance: 0.05, texture: 'map_shard_placeholder' },
                { type: 'nothing', chance: 0.30 }
            ];
            let random = Math.random();
            let cumulativeChance = 0;
            let spawnedLoot = null;
            for (const item of lootTable) {
                cumulativeChance += item.chance;
                if (random <= cumulativeChance && item.type !== 'nothing') {
                    spawnedLoot = item;
                    break;
                }
            }
            if (spawnedLoot) {
                 console.log(`Loot found: ${spawnedLoot.type}`);
                 const lootX = obj.x + Phaser.Math.Between(-10, 10);
                 const lootY = obj.y + obj.height / 2 + 10;
                 const lootSprite = this.pickups.create(lootX, lootY, spawnedLoot.texture);
                 lootSprite.setData('pickupType', spawnedLoot.type);
                 if (spawnedLoot.type.startsWith('ammo_')) {
                     const amount = Phaser.Math.Between(spawnedLoot.amount[0], spawnedLoot.amount[1]);
                     lootSprite.setData('amount', amount);
                 } else if (spawnedLoot.type === 'medkit') {
                     // Этот медкит будет пикапом, используем healAmount
                     lootSprite.setData('healAmount', spawnedLoot.heal);
                 } else if (spawnedLoot.type === 'map_shard') {
                     lootSprite.setData('questItemKey', spawnedLoot.questItemKey);
                     lootSprite.setScale(2); 
                 }
             } else {
                 console.log('Locker is empty.');
             }

        } else if (type === 'scp_914') {
            const currentShards = player.questItems['map_shard'] || 0;
            const hasMap = player.getData('hasCraftedMap');
             if (currentShards >= 5 && !hasMap) {
                 console.log("Using SCP-914 on 'Fine' setting for map shards.");
                 console.log('Refining map shards in SCP-914...');
                 player.questItems['map_shard'] = 0;
                 player.setData('hasCraftedMap', true);
                 this.registry.set('playerQuestItems', player.questItems);
                 this.registry.set('playerHasCraftedMap', true);
                 console.log('O5 Keycard Map created!');
                 obj.setTint(0x555555);
                 if (this.interactionHint) { this.interactionHint.setVisible(false); }
                 this.objectToInteract = null;
                 this.isWaitingFor914Setting = false;
                 this.interactingSCP914 = null;
                 // this.sound.play('scp914_refine_success'); 
             } else if (!hasMap) {
                 this.showTemporaryMessage(`SCP-914 Ready. Choose setting:\n[1] Rough [2] Coarse [3] 1:1 [4] Fine [5] Very Fine`, obj.x, obj.y - 60, 4000);
                 this.isWaitingFor914Setting = true;
                 this.interactingSCP914 = obj;
             } else {
                this.showTemporaryMessage(`SCP-914 inactive. Map already crafted.`, obj.x, obj.y - 60, 2000);
                if (this.interactionHint) { this.interactionHint.setVisible(false); }
                this.objectToInteract = null;
             }
        } else if (type === 'medkit' && !obj.getData('used')) { // Использование интерактивной аптечки
            const healAmount = obj.getData('healAmount') || 30;
            player.heal(healAmount);
            console.log(`Player used medkit for ${healAmount} HP.`);
            obj.setData('used', true);
            obj.setVisible(false); // Скрываем или уничтожаем
            // obj.destroy();
             if (this.interactionHint) { this.interactionHint.setVisible(false); }
            this.objectToInteract = null;
            this.sound.play('item_pickup'); // Звук использования/подбора
        }

    } // <<< END OF interactWithObject()

     // Callback для подбора предмета (пикапа)
    handlePlayerPickupOverlap(player, pickup) {
        console.log('[DEBUG Pickup] Overlap detected with:', pickup.getData('pickupType') || 'unknown pickup'); // ЛОГ 8
        // Показываем подсказку над предметом
        this.pickupText.setPosition(pickup.x, pickup.y);
        this.pickupText.setVisible(true);

        // Проверяем нажатие E
        if (Phaser.Input.Keyboard.JustDown(this.player.cursors.interact)) {
            this.handlePlayerPickupCollision(player, pickup);
            this.pickupText.setVisible(false); // Скрываем после подбора
        }
    }

    // Вызывается при столкновении игрока с пикапом (когда нажата E)
    handlePlayerPickupCollision(player, pickup) {
        if (!player.active || !pickup.active) return;
        
        const pickupType = pickup.getData('pickupType');
        console.log(`Player picked up: ${pickupType}`);
        let playSound = true;

        if (pickupType.startsWith('ammo_')) {
            const ammoType = pickupType.substring('ammo_'.length);
            const amount = pickup.getData('amount');
            player.addAmmo(ammoType, amount);
            pickup.destroy();
        } else if (pickupType.startsWith('weapon_') && player && typeof player.equipWeapon === 'function') {
            const weaponKey = pickup.getData('weaponKey');
            if (weaponKey) {
                console.log(`Picking up weapon: ${weaponKey}`);
                let message = '';
                // Добавляем в инвентарь, если его там нет и есть место
                if (!player.inventory.includes(weaponKey)) {
                    if (player.inventory.length < 3) {
                        player.inventory.push(weaponKey);
                    } else {
                        message = "Inventory full!";
                         console.log(message);
                         // Не подбираем, если инвентарь полон
                         // Не уничтожаем объект, можно вернуться
                         return; 
                    }
                }
                // --- ЭКИПИРУЕМ ОРУЖИЕ --- 
                player.equipWeapon(weaponKey); // <<< ЯВНЫЙ ВЫЗОВ equipWeapon
                message = `Equipped ${weaponKey}!`;
                pickup.destroy(); // Уничтожаем объект
                if (message) console.log(message);
            } else {
                console.warn("Weapon pickup has no weaponKey data!");
                pickup.destroy();
            }
        } else if (pickupType === 'map_shard') {
            const questItemKey = pickup.getData('questItemKey');
            if (!player.questItems[questItemKey]) {
                player.questItems[questItemKey] = 0;
            }
            player.questItems[questItemKey]++;
            console.log(`Player shards: ${player.questItems[questItemKey]}`);
            this.registry.set('playerQuestItems', player.questItems);
            pickup.destroy();
        } else if (pickupType === 'medkit') {
             const healAmount = pickup.getData('healAmount') || 30;
             player.heal(healAmount);
             console.log(`Player healed for ${healAmount} HP.`);
             pickup.destroy();
        } else {
            console.warn(`Unknown pickup type: ${pickupType}`);
             playSound = false;
        }

        if (playSound) {
            this.sound.play('item_pickup', { volume: 0.7 });
        }
    } // <<< END OF handlePlayerPickupCollision()

    // Отображение подсказки взаимодействия
    showInteractionHint(x, y, text) {
        if (!this.interactionHint) {
            this.interactionHint = this.add.text(x, y, text, {
                font: '16px monospace', fill: '#ffffff', backgroundColor: 'rgba(0,0,0,0.7)',
                padding: { x: 5, y: 3 }
            }).setOrigin(0.5, 1); // Верхняя точка по центру
        } else {
             this.interactionHint.setPosition(x, y).setText(text).setVisible(true);
        }
    }

     // Вспомогательная функция для отображения временных сообщений
    showTemporaryMessage(text, x, y, duration = 1500) {
        const messageText = this.add.text(x, y, text, {
            font: '16px monospace',
            fill: '#ffff00',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 5, y: 3 },
            align: 'center' // Для многострочных сообщений
        }).setOrigin(0.5);

        this.time.delayedCall(duration, () => {
            if (messageText) messageText.destroy();
        });
    }

     // Обработка выбора настройки для SCP-914
    handle914SettingChoice(settingNumber) {
        if (!this.isWaitingFor914Setting || !this.interactingSCP914) {
            return; 
        }

        let settingName = '';
        switch (settingNumber) {
            case 1: settingName = 'Rough'; break;
            case 2: settingName = 'Coarse'; break;
            case 3: settingName = '1:1'; break;
            case 4: settingName = 'Fine'; break;
            case 5: settingName = 'Very Fine'; break;
            default: return;
        }

        console.log(`SCP-914 Setting Chosen: ${settingName}`);
        const player = this.player;
        const currentWeaponKey = player.currentWeaponKey;
        let message = '';
        let processed = false;

        // --- Логика Рецептов --- //
        switch (settingName) {
            case 'Fine':
                if (currentWeaponKey === 'glock17' && !player.inventory.includes('ak74')) {
                    player.removeWeapon('glock17');
                    player.addWeapon('ak74');
                    message = 'Glock refined into AK-74!';
                    processed = true;
                }
                else if (player.totalAmmo['pistol'] >= 10) {
                    player.addAmmo('pistol', -10);
                    player.addAmmo('rifle', 5);
                    message = 'Pistol ammo refined into Rifle ammo!';
                     processed = true;
                }
                break;
            case '1:1':
                 if (currentWeaponKey === 'ak74' && !player.inventory.includes('glock17')) {
                     player.removeWeapon('ak74');
                     player.addWeapon('glock17');
                     message = 'AK-74 converted to Glock!';
                     processed = true;
                 }
                break;
            case 'Rough':
            case 'Coarse':
            case 'Very Fine': 
                if (currentWeaponKey) {
                     player.removeWeapon(currentWeaponKey);
                     message = `${currentWeaponKey} destroyed by SCP-914.`;
                     processed = true;
                }
                break;
        }

        if (!processed) {
            if (currentWeaponKey) {
                 player.removeWeapon(currentWeaponKey);
                 message = 'Nothing to process on this setting.';
            }
        }

        this.showTemporaryMessage(message, this.player.x, this.player.y - 60, 2500);

        this.isWaitingFor914Setting = false;
        this.interactingSCP914 = null;
         if (this.interactionHint) { this.interactionHint.setVisible(false); }
         this.objectToInteract = null;
    }

    // Проверка условия победы
    checkWinCondition() {
        const generatorsActivated = this.registry.get('generatorsActivated') || 0;
        const hasCraftedMap = this.registry.get('playerHasCraftedMap') || false;
        const isGameOver = this.registry.get('gameOver') || false;
        const isGameWon = this.registry.get('gameWon') || false;

        if (!isGameOver && !isGameWon) {
            if (generatorsActivated >= 5 && hasCraftedMap) {
                console.log('Win condition met!');
                this.registry.set('gameWon', true);
            }
        }
    }

    // --- Инициализация объектов из данных генератора ---
    initializeObjectsFromData(objectsData, mapWidth, mapHeight, tileSize) {
        console.log('[DEBUG Objects] Initializing objects from data:', objectsData);
        const mapWidthPixels = mapWidth * tileSize;
        const mapHeightPixels = mapHeight * tileSize;

        objectsData.forEach(objData => {
            // Используем тайл-координаты и tileSize для получения мировых координат
            const worldX = objData.x * tileSize + tileSize / 2;
            const worldY = objData.y * tileSize + tileSize / 2;

            console.log(`[DEBUG Objects] Processing object: type=${objData.type}, x=${worldX}, y=${worldY}`);

            // --- ПЕРЕКЛЮЧАТЕЛЬ ПО КОНКРЕТНЫМ ТИПАМ ОТ ГЕНЕРАТОРА --- //
            switch (objData.type) {
                case 'player_start':
                    if (!this.player) { // Создаем игрока только если его еще нет
                        this.player = new Player(this, worldX, worldY);
                        console.log(`[DEBUG Objects] Player created at ${worldX}, ${worldY}`);
                        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
                        this.cameras.main.setBounds(0, 0, mapWidthPixels, mapHeightPixels);
                        this.physics.world.setBounds(0, 0, mapWidthPixels, mapHeightPixels); // Физические границы мира
                    } else {
                        console.warn('[DEBUG Objects] Multiple player_start positions found, using the first one.');
                    }
                    break;

                // --- Враги ---
                case 'scp049_2':
                     const enemy049_2 = new SCP049_2(this, worldX, worldY);
                     this.enemies.add(enemy049_2);
                     console.log(`[DEBUG Objects] Enemy ${objData.type} created at ${worldX}, ${worldY}`);
                     break;
                 case 'scp173':
                     const enemy173 = new SCP173(this, worldX, worldY);
                     this.enemies.add(enemy173);
                     console.log(`[DEBUG Objects] Enemy ${objData.type} created at ${worldX}, ${worldY}`);
                     break;
                 case 'scp106':
                     const enemy106 = new SCP106(this, worldX, worldY);
                     this.enemies.add(enemy106);
                     console.log(`[DEBUG Objects] Enemy ${objData.type} created at ${worldX}, ${worldY}`);
                     break;

                // --- Пикапы --- //
                case 'ammo_pistol':
                case 'ammo_rifle':
                case 'ammo_shotgun':
                case 'weapon_ak74':
                case 'weapon_m870':
                case 'medkit': // Медкит как пикап
                case 'map_shard':
                    const pickupSprite = this.pickups.create(worldX, worldY, objData.texture || `${objData.type}_placeholder`); // Используем текстуру или дефолтную
                    pickupSprite.setData('pickupType', objData.type); // Тип пикапа совпадает с типом объекта
                    if (objData.amount) pickupSprite.setData('amount', objData.amount);
                    if (objData.healAmount) pickupSprite.setData('healAmount', objData.healAmount); // Для аптечек
                    if (objData.weaponKey) pickupSprite.setData('weaponKey', objData.weaponKey);
                    if (objData.questItemKey) pickupSprite.setData('questItemKey', objData.questItemKey);
                    console.log(`[DEBUG Objects] Pickup ${objData.type} created at ${worldX}, ${worldY}`);
                    if (objData.type === 'map_shard') pickupSprite.setScale(2); // Увеличиваем осколок
                    break;

                // --- Интерактивные объекты ---
                 case 'generator':
                 case 'locker':
                 case 'scp_914':
                     // Medkit как интерактивный объект может быть добавлен сюда, если нужно
                    const interactiveSprite = this.interactiveObjects.create(worldX, worldY, objData.texture || `${objData.type}_placeholder`);
                    interactiveSprite.setData('objectType', objData.type); // Тип интерактивного объекта
                    if (objData.type === 'generator') interactiveSprite.setData('isActivated', false);
                    if (objData.type === 'locker') interactiveSprite.setData('searched', false);
                    // if (objData.type === 'medkit') interactiveSprite.setData('used', false);
                    if (objData.type === 'scp_914') interactiveSprite.setImmovable(true); 
                    // if (objData.healAmount) interactiveSprite.setData('healAmount', objData.healAmount);
                    interactiveSprite.refreshBody(); // Обновляем физическое тело после создания
                    console.log(`[DEBUG Objects] Interactive ${objData.type} created at ${worldX}, ${worldY}`);
                    break;

                default:
                    console.warn(`[initializeObjectsFromData] Unknown object type: ${objData.type}`);
                    break;
            }
        });

        // Убедимся, что игрок был создан (на случай если 'player_start' не было в данных)
        if (!this.player) {
             console.error("[CRITICAL] Player start position not found in objectsData! Player cannot be created.");
             // Можно добавить создание игрока в дефолтной позиции, если это нужно
             // this.player = new Player(this, mapWidthPixels / 2, mapHeightPixels / 2);
             // this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
             // ... и т.д.
             // Но лучше остановить выполнение или показать ошибку
        }
    }
} // <<< END OF GameScene class