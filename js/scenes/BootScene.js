// Сцена начальной загрузки BootScene.js

export default class BootScene extends Phaser.Scene {
    constructor() {
        // Вызываем конструктор родительского класса Phaser.Scene
        // и передаем ключ для этой сцены
        super({ key: 'BootScene' });
    }

    // Метод preload вызывается первым для загрузки минимально необходимых ассетов
    preload() {
        console.log('BootScene: preload');
        // На этой сцене обычно ничего не загружают,
        // так как она нужна только для старта следующей сцены (Preloader).
        // Но можно загрузить, например, логотип игры, если он нужен до основной загрузки.
    }

    // Метод create вызывается после preload
    create() {
        console.log('BootScene: create - Запуск PreloaderScene');
        // Запускаем сцену PreloaderScene, которая будет отвечать за загрузку всех ассетов игры
        this.scene.start('PreloaderScene');
    }
} 