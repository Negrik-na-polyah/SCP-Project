// Импорт будущих сцен
import BootScene from './scenes/BootScene.js';
import PreloaderScene from './scenes/PreloaderScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
// import UIScene from './scenes/UIScene.js'; // (Задел на будущее)

// Базовая конфигурация игры Phaser
const config = {
    type: Phaser.AUTO, // Автовыбор рендера (WebGL/Canvas)
    width: 800,        // Ширина игрового поля
    height: 600,       // Высота игрового поля
    parent: 'game-container', // ID контейнера в HTML
    pixelArt: true,     // Четкие пиксели
    // Добавляем настройки рендеринга
    render: {
        pixelArt: true, // Дублируем на всякий случай, хотя выше уже есть
        antialias: false, // Отключаем сглаживание
        mipmapFilter: 'NEAREST' // Отключаем генерацию mipmap для WebGL
    },
    physics: {
        default: 'arcade', // Используем аркадную физику
        arcade: {
            gravity: { y: 0 }, // Гравитации нет (вид сверху)
            // debug: true // Включить для отладки физики (показывает хитбоксы)
            debug: false
        }
    },
    // Список сцен игры и порядок их запуска
    scene: [
        BootScene,
        PreloaderScene,
        GameScene,
        UIScene,
        // UIScene // (Задел на будущее)
    ]
};

// Инициализация игры
const game = new Phaser.Game(config); 