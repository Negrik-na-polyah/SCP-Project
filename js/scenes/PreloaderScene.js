// Сцена предзагрузки ассетов PreloaderScene.js

export default class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
    }

    preload() {
        console.log('PreloaderScene: preload - Начало загрузки ассетов');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // --- Отображение прогресса загрузки ---
        // Фон для прогресс-бара
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

        // Сам прогресс-бар
        const progressBar = this.add.graphics();

        // Текст "Loading..."
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'ЗАГРУЗКА...',
            style: { font: '20px monospace', fill: '#ffffff' }
        }).setOrigin(0.5, 0.5);

        // Текст с процентами
        const percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: { font: '18px monospace', fill: '#ffffff' }
        }).setOrigin(0.5, 0.5);

        // Текст с именем загружаемого файла
        const assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: { font: '18px monospace', fill: '#ffffff' }
        }).setOrigin(0.5, 0.5);

        // --- Обработчики событий загрузки ---
        // Обновление прогресс-бара и процентов
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
        });

        // Обновление текста с именем файла
        this.load.on('fileprogress', (file) => {
            assetText.setText('Загрузка файла: ' + file.key);
        });

        // Завершение загрузки
        this.load.on('complete', () => {
            console.log('PreloaderScene: complete - Загрузка завершена');
            // Уничтожаем элементы интерфейса загрузки
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();

            // --- Проверка наличия звука в кэше ПЕРЕД запуском GameScene ---
            // ПЫТАЕМСЯ ДЕКОДИРОВАТЬ BINARY ДАННЫЕ
            const itemPickupData = this.cache.binary.get('item_pickup_data');
            if (itemPickupData) {
                console.log('[Preloader] Binary data for item_pickup found. Attempting to decode...');
                this.sound.decodeAudio('item_pickup', itemPickupData);
                // Добавляем небольшую задержку перед проверкой, т.к. декодирование может быть не мгновенным
                this.time.delayedCall(100, () => {
                     console.log(`[Preloader] Cache check for 'item_pickup' after decode attempt: ${this.cache.audio.exists('item_pickup')}`);
                     this.scene.start('GameScene');
                });
            } else {
                 console.error('[Preloader] Binary data for item_pickup NOT found!');
                 console.log(`[Preloader] Cache check for 'item_pickup' (binary failed): ${this.cache.audio.exists('item_pickup')}`);
                 this.scene.start('GameScene'); // Запускаем все равно, чтобы видеть другие ошибки
            }

            // Старый запуск:
            // console.log(`[Preloader] Cache check for 'item_pickup': ${this.cache.audio.exists('item_pickup')}`);
            // this.scene.start('GameScene');
        });

        // --- Загрузка Ассетов --- //
        // ВАЖНО: Пути к реальным ассетам нужно будет прописать позже
        // Используем data URI для placeholder'ов, чтобы игра запускалась без внешних файлов

        // --- ВРЕМЕННО КОММЕНТИРУЕМ ВСЕ ИЗОБРАЖЕНИЯ ДЛЯ ТЕСТА ЗВУКА ---
        // Placeholder для игрока (красный квадрат 32x32) - ОСТАВЛЯЕМ
        // this.load.image('player_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAABNJREFUeJztwQEBAAAAgiD/r25IQAEAAAAAAAAAAAAAAL8G4kgAAbK3wZAAAAAASUVORK5CYII=');
        // Placeholder для пули (белый прямоугольник 4x4)
        // this.load.image('bullet_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAB1JREFUGFdjZGBgYPj///8/AywAKQZGxAASMgAGAQEGAKEyAvyC+zGlAAAAAElFTkSuQmCC');
        // Placeholder для стены (серый квадрат 32x32)
        // this.load.image('wall_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADNJREFUeJztwTEBAAAAwqD1T20ND6AAAAAAAACA+wMIAAAAAAAAAABwN4A8AAHjCRK7AAAAAElFTkSuQmCC');
        // Placeholder для врага (зеленый квадрат 32x32)
        // this.load.image('enemy_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACVJREFUeJztwQEBAAAAgiD/r25IQAEAQADwUAIAAAAAAAAAAP8GswAAATkApkQAAAAASUVORK5CYII=');
        // Placeholder для SCP-173 (коричневый квадрат 32x32) - ИСПРАВЛЕН URI
        // this.load.image('scp173_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACVJREFUeJztwQEBAAAAgiD/r+4ICgDQOQEAAAAAAAAAAP8G/gAAAU8DSdYAAAAASUVORK5CYII=');
        // --- Текстуры SCP-объектов ---
        this.load.image('scp106', 'assets/images/scp106.png');
        this.load.image('scp173', 'assets/images/scp173.png');
        this.load.image('scp049', 'assets/images/scp049.png');
        this.load.image('scp096', 'assets/images/scp096.png');
        this.load.image('scp049_2', 'assets/images/scp049_2.png');
        this.load.image('scp914', 'assets/images/scp914.png');
        this.load.image('scp330', 'assets/images/scp330.png');
        
        // --- Текстуры объектов ---
        this.load.image('locker', 'assets/images/locker.png');
        // Аптечка (белый крест на красном)
        // this.load.image('medkit_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAHBJREFUeJztzsEJACAMRFH7XzN7uQNwk4kH4kP7fM4gAAAAAAAAAJyVpP0+9j+njwEAAIAAIAAIAAIAAIAAIAAIAAEAAgAAgAAgAAgAAgAAgAAQgAAQgAAQgAAQgAAQgAIgAADgB1y7BW2g3t9TAAAAAElFTkSuQmCC');
        // --- Placeholders для патронов ---
        // Пистолетные (желтый квадрат)
        // this.load.image('ammo_pistol_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABVJREFUOE9jZGBgZMAD/wMDIwMGBwBuqgAB6+A+7AAAAABJRU5ErkJggg==');
        // Винтовочные/SMG (оранжевый квадрат)
        // this.load.image('ammo_rifle_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABdJREFUOE9jZGD4/5+BgRH///8ZGBgGAQA1ogAB8o5q7wAAAABJRU5ErkJggg==');
        // Дробовик (красный квадрат)
        // this.load.image('ammo_shotgun_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABVJREFUOE9jZGD4DwZGhmAYDAwAGAQANogABaRcfJMAAAAASUVORK5CYII=');
        // Снайперские (темно-синий квадрат)
        // this.load.image('ammo_sniper_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABVJREFUOE9jZOD4/5+BgQEIwMDAAIAAAN4gABbN+fHYAAAAAElFTkSuQmCC');
        // --- Placeholders для оружия на полу ---
        // Glock 17 (светло-серый)
        // this.load.image('weapon_glock17_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACJJREFUeJztwAEBAAAAgqD+r26IwAEoQAUAAAAAAAAAAAAAAD4GsgABfUDAnQAAAABJRU5ErkJggg==');
        // AK-74 (темно-зеленый)
        // this.load.image('weapon_ak74_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACVJREFUeJztwQEBAAAAgqD+r+5wQAEAIAABAAAAAAAAAAAAAICXBmAAAQ1rCF8AAAAASUVORK5CYII=');
        // M870 (темно-коричневый)
        // this.load.image('weapon_m870_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACVJREFUeJztwQEBAAAAgqD+r+5wQAEAMNsBAAAAAAAAAAAA4EMgaAACG/LdIgAAAABJRU5ErkJggg==');
        // --- Placeholders для ключевых объектов ---
        // Генератор ВЫКЛ (темно-серый)
        // this.load.image('generator_off_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADNJREFUeJztwTEBAAAAwqD1T20ND6AAAAAAAACA+wMIAAAAAAAAAABwN4A8AAHjCRK7AAAAAElFTkSuQmCC');
        // Генератор ВКЛ (желтый)
        // this.load.image('generator_on_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAABVJREFUeJztwQEBAAAAgiD/r25IQAEAAMBqAQAAAAAAAAAAgX4BpgAAAd5fpYEAAAAASUVORK5CYII=');
        // Осколок карты О5 (маленький белый квадрат 16x16)
        // this.load.image('map_shard_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABNJREFUOE9jZGBgZAAAAAAA//8DAAUgAAHkUAMsAAAAAElFTkSuQmCC');
        // SCP-914 (оранжевый квадрат 32x32)
        // this.load.image('scp914_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAABdJREFUeJztwQEBAAAAgiD/r25IQAEAQL8DAAAAAAAAAACA+QEIZgAB5Q7WegAAAABJRU5ErkJggg==');
        // Шкафчик открытый (темно-серый с черной дырой)
        // this.load.image('locker_open_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADBJREFUeJztwTEBAAAAwqD1T20KP6AAAAAAAAAAAADg3wAnAAAAAAAAAAAAADgKAAAB+Qd89gAAAABJRU5ErkJggg==');
        // SCP-106 Placeholder (Черный квадрат) - ИСПРАВЛЕН URI
        // this.load.image('scp106_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAABNJREFUeJztwQEBAAAAgiD/r25IQAEAAAAAAAAAAAAAAL8G4kgAAbK3wZAAAAAASUVORK5CYII=');
        // SCP-049-2 Placeholder (зеленый квадрат - такой же как enemy_placeholder)
        // this.load.image('scp049_2_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACVJREFUeJztwQEBAAAAgiD/r25IQAEAQADwUAIAAAAAAAAAAP8GswAAATkApkQAAAAASUVORK5CYII=');

        // Загрузка тайлсета - УДАЛЕНО, будем рисовать фигуры
        // const tileSize = 32;
        // const tilesetWidth = tileSize * 2;
        // const tilesetHeight = tileSize;
        // this.load.image('placeholder_tileset', 'assets/images/placeholder_tileset.png');

        // --- Загрузка Звуков (плейсхолдеры) --- //
        // ПЫТАЕМСЯ ЗАГРУЗИТЬ ЧЕРЕЗ BINARY
        this.load.binary('item_pickup_data', 'assets/sounds/placeholders/pickup.ogg');
        // ОСТАВЛЯЕМ ТОЛЬКО ITEM_PICKUP
        // Выстрелы
        // this.load.audio('shoot_pistol', ['assets/sounds/placeholders/shoot_pistol.ogg', 'assets/sounds/placeholders/shoot_pistol.mp3']);
        // this.load.audio('shoot_shotgun', ['assets/sounds/placeholders/shoot_shotgun.ogg', 'assets/sounds/placeholders/shoot_shotgun.mp3']);
        // this.load.audio('shoot_rifle', ['assets/sounds/placeholders/shoot_rifle.ogg', 'assets/sounds/placeholders/shoot_rifle.mp3']);
        // // Перезарядка
        // this.load.audio('reload_weapon', ['assets/sounds/placeholders/reload.ogg', 'assets/sounds/placeholders/reload.mp3']);
        // // Игрок
        // this.load.audio('player_hurt', ['assets/sounds/placeholders/player_hurt.ogg', 'assets/sounds/placeholders/player_hurt.mp3']);
        // this.load.audio('player_death', ['assets/sounds/placeholders/player_death.ogg', 'assets/sounds/placeholders/player_death.mp3']);
        // // Предметы
        // this.load.audio('item_pickup', ['assets/sounds/placeholders/pickup.ogg', 'assets/sounds/placeholders/pickup.mp3']); // <<< ТОЛЬКО ЭТОТ ЗВУК
        // this.load.audio('generator_activate', ['assets/sounds/placeholders/generator.ogg', 'assets/sounds/placeholders/generator.mp3']);
        // // Конец игры
        // this.load.audio('game_win', ['assets/sounds/placeholders/win.ogg', 'assets/sounds/placeholders/win.mp3']);
        // this.load.audio('game_lose', ['assets/sounds/placeholders/lose.ogg', 'assets/sounds/placeholders/lose.mp3']);

        console.log('PreloaderScene: preload complete');

        // Сюда будем добавлять загрузку других ассетов:
        // - Спрайты врагов (SCP-173, 096, ...)
        // - Иконки оружия (Glock, MP5, ...)
        // - Спрайты SCP-объектов (330, 914, ...)
        // - Звуки (выстрелы, шаги, эмбиент, крики SCP)
        // - Тайлы для карты
        // - Шрифты (если нужны кастомные)

        // Пример загрузки тайлсета и карты:
        // this.load.image('tiles', 'assets/tileset.png');
        // this.load.tilemapTiledJSON('tilemap', 'assets/map.json');
    }

    create() {
        // Метод create в PreloaderScene обычно не используется,
        // так как переход на следующую сцену происходит в событии 'complete' загрузчика.
        console.log('PreloaderScene: create');
    }
} 