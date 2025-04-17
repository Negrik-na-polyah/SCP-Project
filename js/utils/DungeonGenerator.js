// Утилита для генерации подземелий DungeonGenerator.js

export default class DungeonGenerator {
    constructor(scene) {
        this.scene = scene;
        // Индексы тайлов (ПРИВЕДЕНЫ К СТАНДАРТУ 0-пол, 1-стена)
        this.tileIndexes = {
            floor: 0, // Индекс тайла пола
            wall: 1   // Индекс тайла стены
        };
    }

    /**
     * Генерирует данные карты, комнат и объектов.
     * @param {number} width - Ширина карты в тайлах.
     * @param {number} height - Высота карты в тайлах.
     * @param {number} maxRooms - Максимальное количество комнат.
     * @param {number} minRoomSize - Минимальный размер комнаты (ширина/высота).
     * @param {number} maxRoomSize - Максимальный размер комнаты.
     * @returns {{mapData: number[][], rooms: Phaser.Geom.Rectangle[], objectsData: {x: number, y: number, type: string}[]}} - Сгенерированная карта, список комнат и объектов.
     */
    generate(width, height, maxRooms, minRoomSize, maxRoomSize) {
        // 1. Инициализация карты стенами (индекс 1)
        const mapData = Array(height).fill(0).map(() => Array(width).fill(this.tileIndexes.wall)); // Используем wall (1)
        const rooms = [];

        for (let i = 0; i < maxRooms; i++) {
            // 2. Генерация размеров и позиции комнаты
            const roomWidth = Phaser.Math.Between(minRoomSize, maxRoomSize);
            const roomHeight = Phaser.Math.Between(minRoomSize, maxRoomSize);
            // -1 чтобы комната не прилегала к границе карты
            const x = Phaser.Math.Between(1, width - roomWidth - 1);
            const y = Phaser.Math.Between(1, height - roomHeight - 1);

            const newRoom = new Phaser.Geom.Rectangle(x, y, roomWidth, roomHeight);

            // 3. Проверка на пересечение с существующими комнатами
            let overlaps = false;
            for (const otherRoom of rooms) {
                // Проверяем пересечение с небольшим запасом (чтобы комнаты не соприкасались)
                // Возвращаем использование "надутого" прямоугольника
                const inflatedOtherRoom = new Phaser.Geom.Rectangle(otherRoom.x - 1, otherRoom.y - 1, otherRoom.width + 2, otherRoom.height + 2);
                if (Phaser.Geom.Intersects.RectangleToRectangle(newRoom, inflatedOtherRoom)) {
                // if (Phaser.Geom.Intersects.RectangleToRectangle(newRoom, otherRoom)) { // Старая проверка без запаса
                    overlaps = true;
                    break;
                }
            }

            // 4. Если не пересекается, "вырезаем" комнату и коридоры
            if (!overlaps) {
                this.createRoom(mapData, newRoom);

                // Соединяем с центром предыдущей комнаты (если она есть)
                if (rooms.length > 0) {
                    const prevRoom = rooms[rooms.length - 1];
                    if (prevRoom instanceof Phaser.Geom.Rectangle) { 
                        const prevRoomCenter = { x: prevRoom.centerX, y: prevRoom.centerY }; 
                        const newRoomCenter = { x: newRoom.centerX, y: newRoom.centerY };   
                        this.createCorridor(mapData, prevRoomCenter, newRoomCenter);
                    } else {
                        console.error("Ошибка генерации коридора: предыдущий объект в 'rooms' не является Phaser.Geom.Rectangle!", prevRoom);
                    }
                }

                rooms.push(newRoom);
            }
        }

        // 5. Размещение объектов
        const objectsData = this.placeObjectsInRooms(mapData, rooms);

        // --- ДОБАВЛЯЕМ СТАРТОВУЮ ПОЗИЦИЮ ИГРОКА --- //
        if (rooms.length > 0) {
            const firstRoom = rooms[0];
            const startX = Math.floor(firstRoom.centerX);
            const startY = Math.floor(firstRoom.centerY);
            if (startY >= 0 && startY < mapData.length && startX >= 0 && startX < mapData[0].length && mapData[startY][startX] === this.tileIndexes.floor) {
                objectsData.push({ x: startX, y: startY, type: 'player_start' });
                 console.log(`[Generator] Player Start placed at ${startX}, ${startY}`);
            } else {
                 console.error(`[Generator] Could not place player start in the center of the first room (${startX}, ${startY}) - tile is not floor or out of bounds.`);
                 // Попытка найти другую точку в первой комнате?
            }
        } else {
             console.error("[Generator] No rooms generated, cannot place player start!");
        }

        return { mapData, rooms, objectsData };
    }

    // Вырезает комнату в массиве карты (устанавливает пол - 0)
    createRoom(mapData, room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                if (y >= 0 && y < mapData.length && x >= 0 && x < mapData[0].length) {
                    mapData[y][x] = this.tileIndexes.floor; // Используем floor (0)
                }
            }
        }
    }

    // Вырезает L-образный коридор между центрами двух точек
    createCorridor(mapData, startPoint, endPoint) {
        const x1 = Math.floor(startPoint.x);
        const y1 = Math.floor(startPoint.y);
        const x2 = Math.floor(endPoint.x);
        const y2 = Math.floor(endPoint.y);

        // Случайный выбор: сначала горизонтальный или вертикальный коридор
        if (Phaser.Math.Between(0, 1) === 0) {
            this.createHorizontalTunnel(mapData, x1, x2, y1); // Использует floor (0)
            this.createVerticalTunnel(mapData, y1, y2, x2);   // Использует floor (0)
        } else {
            this.createVerticalTunnel(mapData, y1, y2, x1);     // Использует floor (0)
            this.createHorizontalTunnel(mapData, x1, x2, y2);   // Использует floor (0)
        }
    }

    createHorizontalTunnel(mapData, x1, x2, y) {
        const startX = Math.min(x1, x2);
        const endX = Math.max(x1, x2);
        // Рисуем коридор шириной 2 тайла по Y
        for (let tunnelY = y - 1; tunnelY <= y + 0; tunnelY++) { // Исправлено для ширины 2
            for (let x = startX; x <= endX; x++) {
                if (tunnelY >= 0 && tunnelY < mapData.length && x >= 0 && x < mapData[0].length) {
                    mapData[tunnelY][x] = this.tileIndexes.floor; // Используем floor (0)
                }
            }
        }
    }

    createVerticalTunnel(mapData, y1, y2, x) {
        const startY = Math.min(y1, y2);
        const endY = Math.max(y1, y2);
        // Рисуем коридор шириной 2 тайла по X
        for (let tunnelX = x - 1; tunnelX <= x + 0; tunnelX++) { // Исправлено для ширины 2
            for (let y = startY; y <= endY; y++) {
                if (y >= 0 && y < mapData.length && tunnelX >= 0 && tunnelX < mapData[0].length) {
                    mapData[y][tunnelX] = this.tileIndexes.floor; // Используем floor (0)
                }
            }
        }
    }

    /**
     * Размещает объекты (шкафчики, аптечки) в сгенерированных комнатах.
     * @param {number[][]} mapData - 2D массив карты.
     * @param {Phaser.Geom.Rectangle[]} rooms - Массив комнат.
     * @returns {{x: number, y: number, type: string}[]} - Массив данных о размещенных объектах.
     */
    placeObjectsInRooms(mapData, rooms) {
        const objects = [];
        // Отделяем генераторы
        const decorObjectTypes = ['locker', 'medkit'];
        const pickupObjectTypes = ['ammo_pistol', 'ammo_rifle', 'ammo_shotgun', 'weapon_ak74', 'weapon_m870'];
        const generatorType = 'generator';
        const requiredGenerators = 5;
        // Новые типы
        const shardType = 'map_shard';
        const requiredShards = 5;
        const scp914Type = 'scp_914';
        const requiredSCP914 = 1;

        // Типы врагов
        const enemyTypes = ['scp049_2', 'scp173', 'scp106']; // Добавляем SCP-106
        const maxEnemies = 10; // Общее максимальное количество врагов

        // Создаем список комнат, доступных для размещения (все, кроме первой)
        let availableRooms = rooms.slice(1);
        Phaser.Utils.Array.Shuffle(availableRooms); // Перемешиваем для случайности

        // --- Размещение Ключевых Объектов ---

        // 1. Генераторы
        let generatorsPlaced = 0;
        let roomsWithGenerators = []; // Запомним комнаты с генераторами
        availableRooms = availableRooms.filter(room => {
            if (generatorsPlaced < requiredGenerators) {
                if (this.tryPlaceObject(mapData, room, [generatorType], objects)) {
                    generatorsPlaced++;
                    roomsWithGenerators.push(room);
                    return false; // Убираем комнату из доступных для других ключевых объектов
                }
            }
            return true; // Оставляем комнату для других
        });
        if (generatorsPlaced < requiredGenerators) {
            console.warn(`Could only place ${generatorsPlaced} out of ${requiredGenerators} generators!`);
        }

        // 2. SCP-914
        let scp914Placed = 0;
        // Перемешиваем оставшиеся комнаты еще раз
        Phaser.Utils.Array.Shuffle(availableRooms);
        availableRooms = availableRooms.filter(room => {
            if (scp914Placed < requiredSCP914) {
                 // Пытаемся разместить SCP-914
                 if (this.tryPlaceObject(mapData, room, [scp914Type], objects)) {
                     scp914Placed++;
                     return false; // Убираем комнату из списка для осколков
                 }
            }
            return true;
        });
         if (scp914Placed < requiredSCP914) {
            console.warn(`Could not place SCP-914!`);
        }

        // 3. Осколки карты (можно размещать в оставшихся комнатах И комнатах с генераторами)
        let shardsPlaced = 0;
        // Собираем все комнаты кроме стартовой
        let shardPlacementRooms = rooms.slice(1);
        Phaser.Utils.Array.Shuffle(shardPlacementRooms);

        for (const room of shardPlacementRooms) {
            if (shardsPlaced >= requiredShards) break;
            // Пытаемся разместить осколок (можно несколько попыток на комнату, но пока 1)
            if (this.tryPlaceObject(mapData, room, [shardType], objects)) {
                shardsPlaced++;
            }
        }
        if (shardsPlaced < requiredShards) {
            console.warn(`Could only place ${shardsPlaced} out of ${requiredShards} map shards!`);
        }

        // --- Размещение Врагов ---
        let enemiesPlaced = 0;
        let roomsWithEnemies = []; // Комнаты, где уже есть враги
        let availableEnemyRooms = rooms.slice(1); // Комнаты для врагов (не стартовая)
        Phaser.Utils.Array.Shuffle(availableEnemyRooms);

        // Гарантированное размещение по одному каждого типа (если комнат хватает)
        let placed049_2 = false;
        let placed173 = false;
        let placed106 = false;

        availableEnemyRooms = availableEnemyRooms.filter(room => {
            if (!placed049_2 && this.tryPlaceEnemy(mapData, room, 'scp049_2', objects, roomsWithEnemies)) {
                placed049_2 = true;
                enemiesPlaced++;
                return false; // Убираем комнату
            }
            return true;
        });
        Phaser.Utils.Array.Shuffle(availableEnemyRooms); // Перемешиваем снова
        availableEnemyRooms = availableEnemyRooms.filter(room => {
             if (!placed173 && this.tryPlaceEnemy(mapData, room, 'scp173', objects, roomsWithEnemies)) {
                placed173 = true;
                enemiesPlaced++;
                return false;
            }
            return true;
        });
        Phaser.Utils.Array.Shuffle(availableEnemyRooms); // И еще раз
         availableEnemyRooms = availableEnemyRooms.filter(room => {
             if (!placed106 && this.tryPlaceEnemy(mapData, room, 'scp106', objects, roomsWithEnemies)) {
                placed106 = true;
                enemiesPlaced++;
                return false;
            }
            return true;
        });

        // Размещаем остальных случайных врагов до лимита
        Phaser.Utils.Array.Shuffle(availableEnemyRooms);
        for (const room of availableEnemyRooms) {
            if (enemiesPlaced >= maxEnemies) break;
            const enemyType = Phaser.Utils.Array.GetRandom(enemyTypes);
            if (this.tryPlaceEnemy(mapData, room, enemyType, objects, roomsWithEnemies)) {
                 enemiesPlaced++;
            }
             // Можно добавить шанс разместить второго врага в большой комнате
             // if (room.width * room.height > 100 && Math.random() < 0.3) { ... }
        }
        console.log(`Placed ${enemiesPlaced} enemies.`);

        // --- Размещение Декора и Обычных Пикапов ---
        // Используем ВСЕ комнаты, кроме стартовой, для декора и патронов
        const decorPickupRooms = rooms.slice(1);
        for (const room of decorPickupRooms) {
            // Размещаем декор
            const numDecor = Phaser.Math.Between(0, 1); // Меньше декора
            for (let j = 0; j < numDecor; j++) {
                this.tryPlaceObject(mapData, room, decorObjectTypes, objects);
            }
            // Размещаем патроны/оружие
            const numPickups = Phaser.Math.Between(1, 2); // Меньше пикапов
            for (let j = 0; j < numPickups; j++) {
                this.tryPlaceObject(mapData, room, pickupObjectTypes, objects);
            }
        }
        return objects;
    }

    // Вспомогательный метод для попытки размещения объекта
    tryPlaceObject(mapData, room, objectTypes, placedObjects) {
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
            // Немного уменьшим отступы, чтобы было больше места
            const x = Phaser.Math.Between(room.x + 1, room.right - 1);
            const y = Phaser.Math.Between(room.y + 1, room.bottom - 1);

            // Проверяем границы И что это пол (индекс 0)
            if (y >= 0 && y < mapData.length && x >= 0 && x < mapData[0].length && mapData[y][x] === this.tileIndexes.floor) { // Проверяем floor (0)
                // Проверяем, что на этой клетке ЕЩЕ НЕТ объекта
                if (!placedObjects.some(obj => obj.x === x && obj.y === y)) {
                    const type = Phaser.Utils.Array.GetRandom(objectTypes);
                    let amount = 0;
                    let weaponKey = null;
                    let questItemKey = null; // Для предметов квеста

                    if (type.startsWith('ammo_')) {
                        if (type === 'ammo_pistol') amount = Phaser.Math.Between(10, 20);
                        else if (type === 'ammo_rifle') amount = Phaser.Math.Between(15, 30);
                        else if (type === 'ammo_shotgun') amount = Phaser.Math.Between(4, 8);
                        else if (type === 'ammo_sniper') amount = Phaser.Math.Between(2, 5); // Добавим на всякий
                    } else if (type.startsWith('weapon_')) {
                        weaponKey = type.substring('weapon_'.length);
                    } else if (type === 'generator' || type === 'scp_914') {
                        // Этим объектам не нужны amount или ключи
                    } else if (type === 'map_shard') {
                        questItemKey = 'map_shard'; // Ключ для идентификации
                    }

                    // Добавляем объект в список
                    placedObjects.push({
                        x: x,
                        y: y,
                        type: type,
                        amount: amount, // Для патронов
                        weaponKey: weaponKey, // Для оружия
                        questItemKey: questItemKey // Для квестовых предметов
                    });
                    return true; // Успешно разместили
                }
            }
            attempts++;
        }
        return false; // Не удалось разместить
    }

    // Вспомогательный метод для попытки размещения ВРАГА
    tryPlaceEnemy(mapData, room, enemyType, placedObjects, roomsWithEnemies) {
         // Проверяем, не занята ли эта комната уже врагом (можно убрать, если нужно больше врагов на комнату)
         if (roomsWithEnemies.includes(room)) {
             return false;
         }

        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
            const x = Phaser.Math.Between(room.x + 1, room.right - 1);
            const y = Phaser.Math.Between(room.y + 1, room.bottom - 1);

            // Проверяем границы И что это пол (индекс 0)
            if (y >= 0 && y < mapData.length && x >= 0 && x < mapData[0].length && mapData[y][x] === this.tileIndexes.floor) { // Проверяем floor (0)
                 // Проверяем, что на этой клетке ЕЩЕ НЕТ объекта (включая других врагов)
                 if (!placedObjects.some(obj => obj.x === x && obj.y === y)) {
                     placedObjects.push({ x: x, y: y, type: enemyType });
                     roomsWithEnemies.push(room); // Помечаем комнату как занятую врагом
                     console.log(`Placed ${enemyType} in room at ${x},${y}`);
                    return true;
                }
            }
            attempts++;
        }
        console.warn(`Failed to place ${enemyType} in room ${room.id}`);
        return false;
    }
}