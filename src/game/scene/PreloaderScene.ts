import Phaser from 'phaser';

export default class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
    }

    preload() {
        console.log('PreloaderScene: preload - Loading assets');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Loading progress UI
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

        const progressBar = this.add.graphics();
        
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'LOADING...',
            style: { font: '20px monospace', fill: '#ffffff' }
        }).setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: { font: '18px monospace', fill: '#ffffff' }
        }).setOrigin(0.5, 0.5);

        const assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: { font: '18px monospace', fill: '#ffffff' }
        }).setOrigin(0.5, 0.5);

        // Progress handlers
        this.load.on('progress', (value: number) => {
            percentText.setText(`${Math.round(value * 100)}%`);
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
        });

        this.load.on('fileprogress', (file: Phaser.Loader.File) => {
            assetText.setText(`Loading: ${file.key}`);
        });

        this.load.on('complete', () => {
            console.log('PreloaderScene: complete - Loading finished');
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
            this.scene.start('GameScene');
        });

        // Load placeholder assets
        this.load.image('player_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAABNJREFUeJztwQEBAAAAgiD/r25IQAEAAAAAAAAAAAAAAL8G4kgAAbK3wZAAAAAASUVORK5CYII=');
        this.load.image('bullet_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAB1JREFUGFdjZGBgYPj///8/AywAKQZGxAASMgAGAQEGAKEyAvyC+zGlAAAAAElFTkSuQmCC');
        this.load.image('wall_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADNJREFUeJztwTEBAAAAwqD1T20ND6AAAAAAAACA+wMIAAAAAAAAAABwN4A8AAHjCRK7AAAAAElFTkSuQmCC');
        this.load.image('enemy_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACVJREFUeJztwQEBAAAAgiD/r25IQAEAQADwUAIAAAAAAAAAAP8GswAAATkApkQAAAAASUVORK5CYII=');
        this.load.image('scp173_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACVJREFUeJztwQEBAAAAgiD/r+4ICgDQOQEAAAAAAAAAAP8G/gAAAU8DSdYAAAAAElFTkSuQmCC=');
        this.load.image('locker_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACJJREFUeJztwQEBAAAAgiD/r25IQAEAQLgDgAQAAAAAAAAAAORrYgABy9KoLwAAAABJRU5ErkJggg==');
        this.load.image('medkit_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAHBJREFUeJztzsEJACAMRFH7XzN7uQNwk4kH4kP7fM4gAAAAAAAAAJyVpP0+9j+njwEAAIAAIAAIAAIAAIAAIAAIAAEAAgAAgAAgAAgAAgAAgAAQgAAQgAAQgAAQgAAQgAIgAADgB1y7BW2g3t9TAAAAAElFTkSuQmCC');
        this.load.image('ammo_pistol_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABVJREFUOE9jZGBgZMAD/wMDIwMGBwBuqgAB6+A+7AAAAABJRU5ErkJggg==');
        this.load.image('ammo_rifle_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABdJREFUOE9jZGD4/5+BgRH///8ZGBgGAQA1ogAB8o5q7wAAAABJRU5ErkJggg==');
        this.load.image('ammo_shotgun_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABVJREFUOE9jZGD4DwZGhmAYDAwAGAQANogABaRcfJMAAAAASUVORK5CYII=');
        this.load.image('ammo_sniper_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABVJREFUOE9jZOD4/5+BgQEIwMDAAIAAAN4gABbN+fHYAAAAAElFTkSuQmCC');
        this.load.image('weapon_glock17_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACJJREFUeJztwAEBAAAAgqD+r26IwAEoQAUAAAAAAAAAAAAAAD4GsgABfUDAnQAAAABJRU5ErkJggg==');
        this.load.image('weapon_ak74_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACVJREFUeJztwQEBAAAAgqD+r+5wQAEAIAABAAAAAAAAAAAAAICXBmAAAQ1rCF8AAAAASUVORK5CYII=');
        this.load.image('weapon_m870_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACVJREFUeJztwQEBAAAAgqD+r+5wQAEAMNsBAAAAAAAAAAAA4EMgaAACG/LdIgAAAABJRU5ErkJggg==');
        this.load.image('generator_off_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADNJREFUeJztwTEBAAAAwqD1T20ND6AAAAAAAACA+wMIAAAAAAAAAABwN4A8AAHjCRK7AAAAAElFTkSuQmCC');
        this.load.image('generator_on_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAABVJREFUeJztwQEBAAAAgiD/r25IQAEAAMBqAQAAAAAAAAAAgX4BpgAAAd5fpYEAAAAASUVORK5CYII=');
        this.load.image('map_shard_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAABNJREFUOE9jZGBgZAAAAAAA//8DAAUgAAHkUAMsAAAAAElFTkSuQmCC');
        this.load.image('scp914_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAABdJREFUeJztwQEBAAAAgiD/r25IQAEAQL8DAAAAAAAAAACA+QEIZgAB5Q7WegAAAABJRU5ErkJggg==');
        this.load.image('locker_open_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADBJREFUeJztwTEBAAAAwqD1T20KP6AAAAAAAAAAAADg3wAnAAAAAAAAAAAAADgKAAAB+Qd89gAAAABJRU5ErkJggg==');
        this.load.image('scp106_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAABNJREFUeJztwQEBAAAAgiD/r25IQAEAQADwUAIAAAAAAAAAAP8GswAAATkApkQAAAAASUVORK5CYII=');
        this.load.image('scp049_2_placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAACVJREFUeJztwQEBAAAAgiD/r25IQAEAQADwUAIAAAAAAAAAAP8GswAAATkApkQAAAAASUVORK5CYII=');

        // Load sound placeholder
        this.load.audio('item_pickup', '/game/assets/sounds/placeholders/pickup.mp3');
    }

    create() {
        console.log('PreloaderScene: create');
    }
}