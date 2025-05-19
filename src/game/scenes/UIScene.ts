import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private interactionText!: Phaser.GameObjects.Text;
  private scanCooldownBar!: Phaser.GameObjects.Graphics;
  private boostCooldownBar!: Phaser.GameObjects.Graphics;
  private scanCooldownTime: number = 30000; // 30 секунд
  private boostCooldownTime: number = 45000; // 45 секунд
  private lastScanTime: number = 0;
  private lastBoostTime: number = 0;
  private gameScene!: Phaser.Scene;

  constructor() {
    super({ key: 'UI', active: true });
  }

  create() {
    // Получаем ссылку на игровую сцену
    this.gameScene = this.scene.get('Game');

    // Создаем элементы UI
    this.createUI();

    // Подписываемся на события от игровой сцены
    this.gameScene.events.on('updateHealth', this.updateHealth, this);
    this.gameScene.events.on('updateAmmo', this.updateAmmo, this);
    this.gameScene.events.on('updateStatus', this.updateStatus, this);
    this.gameScene.events.on('showInteraction', this.showInteraction, this);
    this.gameScene.events.on('hideInteraction', this.hideInteraction, this);
    this.gameScene.events.on('scanUsed', this.onScanUsed, this);
    this.gameScene.events.on('boostUsed', this.onBoostUsed, this);
    this.gameScene.events.on('gameOver', this.showGameOver, this);
    this.gameScene.events.on('victory', this.showVictory, this);
  }

  update() {
    // Обновляем полосы перезарядки способностей
    this.updateCooldownBars();
  }

  private createUI() {
    // Создаем текстовые элементы UI
    this.healthText = this.add.text(16, 16, 'Здоровье: 100/100', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    this.ammoText = this.add.text(16, 40, 'Патроны: 15/60', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    this.statusText = this.add.text(400, 16, '', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.statusText.setOrigin(0.5, 0);

    this.interactionText = this.add.text(400, 500, '', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.interactionText.setOrigin(0.5, 0);
    this.interactionText.setVisible(false);

    // Создаем полосы перезарядки способностей
    this.scanCooldownBar = this.add.graphics();
    this.boostCooldownBar = this.add.graphics();

    // Добавляем иконки способностей
    this.add.text(16, 70, 'Q: Сканирование', {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });

    this.add.text(16, 90, 'F: Ускорение', {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
  }

  private updateHealth(health: number, maxHealth: number) {
    this.healthText.setText(`Здоровье: ${health}/${maxHealth}`);
    
    // Меняем цвет в зависимости от количества здоровья
    if (health < maxHealth * 0.3) {
      this.healthText.setColor('#ff0000');
    } else if (health < maxHealth * 0.6) {
      this.healthText.setColor('#ffff00');
    } else {
      this.healthText.setColor('#ffffff');
    }
  }

  private updateAmmo(currentAmmo: number, totalAmmo: number, weaponName: string) {
    this.ammoText.setText(`${weaponName}: ${currentAmmo}/${totalAmmo}`);
    
    // Меняем цвет в зависимости от количества патронов
    if (currentAmmo === 0) {
      this.ammoText.setColor('#ff0000');
    } else if (currentAmmo < 5) {
      this.ammoText.setColor('#ffff00');
    } else {
      this.ammoText.setColor('#ffffff');
    }
  }

  private updateStatus(message: string, duration: number = 2000) {
    this.statusText.setText(message);
    this.statusText.setVisible(true);
    
    // Скрываем сообщение через указанное время
    this.time.delayedCall(duration, () => {
      this.statusText.setVisible(false);
    });
  }

  private showInteraction(text: string) {
    this.interactionText.setText(text);
    this.interactionText.setVisible(true);
  }

  private hideInteraction() {
    this.interactionText.setVisible(false);
  }

  private onScanUsed() {
    this.lastScanTime = this.time.now;
  }

  private onBoostUsed() {
    this.lastBoostTime = this.time.now;
  }

  private updateCooldownBars() {
    // Обновляем полосу перезарядки сканирования
    const scanElapsed = this.time.now - this.lastScanTime;
    const scanProgress = Math.min(scanElapsed / this.scanCooldownTime, 1);
    
    this.scanCooldownBar.clear();
    this.scanCooldownBar.fillStyle(0x666666);
    this.scanCooldownBar.fillRect(140, 75, 100, 10);
    this.scanCooldownBar.fillStyle(scanProgress >= 1 ? 0x00ff00 : 0xff6600);
    this.scanCooldownBar.fillRect(140, 75, 100 * scanProgress, 10);

    // Обновляем полосу перезарядки ускорения
    const boostElapsed = this.time.now - this.lastBoostTime;
    const boostProgress = Math.min(boostElapsed / this.boostCooldownTime, 1);
    
    this.boostCooldownBar.clear();
    this.boostCooldownBar.fillStyle(0x666666);
    this.boostCooldownBar.fillRect(140, 95, 100, 10);
    this.boostCooldownBar.fillStyle(boostProgress >= 1 ? 0x00ff00 : 0xff6600);
    this.boostCooldownBar.fillRect(140, 95, 100 * boostProgress, 10);
  }

  private showGameOver() {
    // Затемняем экран
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7);
    overlay.setOrigin(0);
    
    // Добавляем текст "Game Over"
    const gameOverText = this.add.text(400, 250, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 6
    });
    gameOverText.setOrigin(0.5);
    
    // Добавляем кнопку для перезапуска
    const restartButton = this.add.text(400, 350, 'Играть снова', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: '#222222',
      padding: {
        left: 20,
        right: 20,
        top: 10,
        bottom: 10
      }
    });
    restartButton.setOrigin(0.5);
    restartButton.setInteractive({ useHandCursor: true });
    
    // Эффект при наведении
    restartButton.on('pointerover', () => {
      restartButton.setColor('#ffff00');
    });
    
    restartButton.on('pointerout', () => {
      restartButton.setColor('#ffffff');
    });
    
    // Перезапуск игры при клике
    restartButton.on('pointerdown', () => {
      this.scene.stop('UI');
      this.scene.stop('Game');
      this.scene.start('Boot');
    });
  }

  private showVictory() {
    // Затемняем экран
    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7);
    overlay.setOrigin(0);
    
    // Добавляем текст победы
    const victoryText = this.add.text(400, 250, 'ПОБЕДА!', {
      fontSize: '48px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 6
    });
    victoryText.setOrigin(0.5);
    
    // Добавляем описание
    const descriptionText = this.add.text(400, 300, 'Вы сбежали из комплекса SCP!', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    descriptionText.setOrigin(0.5);
    
    // Добавляем кнопку для перезапуска
    const restartButton = this.add.text(400, 400, 'Играть снова', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: '#222222',
      padding: {
        left: 20,
        right: 20,
        top: 10,
        bottom: 10
      }
    });
    restartButton.setOrigin(0.5);
    restartButton.setInteractive({ useHandCursor: true });
    
    // Эффект при наведении
    restartButton.on('pointerover', () => {
      restartButton.setColor('#ffff00');
    });
    
    restartButton.on('pointerout', () => {
      restartButton.setColor('#ffffff');
    });
    
    // Перезапуск игры при клике
    restartButton.on('pointerdown', () => {
      this.scene.stop('UI');
      this.scene.stop('Game');
      this.scene.start('Boot');
    });
  }
}
