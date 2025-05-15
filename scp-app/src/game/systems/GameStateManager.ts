import Phaser from 'phaser';

export enum GameState {
    BOOT = 'BOOT',
    PRELOAD = 'PRELOAD',
    MAIN_MENU = 'MAIN_MENU',
    GAME = 'GAME',
    PAUSE = 'PAUSE',
    GAME_OVER = 'GAME_OVER',
    VICTORY = 'VICTORY'
}

export class GameStateManager {
    private currentState: GameState = GameState.BOOT;
    private game: Phaser.Game;

    constructor(game: Phaser.Game) {
        this.game = game;
    }

    public setState(newState: GameState): void {
        this.currentState = newState;
        this.handleStateChange();
    }

    public getState(): GameState {
        return this.currentState;
    }

    private handleStateChange(): void {
        switch (this.currentState) {
            case GameState.BOOT:
                this.game.scene.start('BootScene');
                break;
            case GameState.PRELOAD:
                this.game.scene.start('PreloadScene');
                break;
            case GameState.MAIN_MENU:
                this.game.scene.start('MainMenuScene');
                break;
            case GameState.GAME:
                this.game.scene.start('GameScene');
                break;
            case GameState.PAUSE:
                this.game.scene.pause('GameScene');
                this.game.scene.launch('PauseScene');
                break;
            case GameState.GAME_OVER:
                this.game.scene.stop('GameScene');
                this.game.scene.start('GameOverScene');
                break;
            case GameState.VICTORY:
                this.game.scene.stop('GameScene');
                this.game.scene.start('VictoryScene');
                break;
        }
    }
}