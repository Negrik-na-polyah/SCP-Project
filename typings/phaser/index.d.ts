// Basic Phaser 3 TypeScript declarations
declare module 'phaser' {
    export class Scene {
        constructor(config?: object);
        load: LoaderPlugin;
        add: GameObjectsFactory;
    }

    export class Game {
        constructor(config: GameConfig);
    }

    interface GameConfig {
        width?: number;
        height?: number;
        scene?: typeof Scene;
    }

    export class LoaderPlugin {
        image(key: string, url?: string): void;
    }

    export class GameObjectsFactory {
        image(x: number, y: number, key: string): GameObject;
    }

    export class GameObject {
        setPosition(x: number, y: number): this;
    }
}