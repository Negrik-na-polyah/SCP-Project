import Enemy from './Enemy.js';

export default class SCP106 extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'scp106_placeholder', 120); // Уменьшено здоровье с 250 до 120

        this.speed = 50; // Медленнее, чем другие
        this.isPhasing = false;
        this.phaseTimer = null;
        this.phaseDuration = 3000; // Длительность фазы прохода сквозь стены (3 сек)
        this.phaseCooldown = 8000; // Кулдаун между фазами (8 сек)
        this.nextPhaseTime = 0;

        // Визуальный эффект коррозии (пока просто затемнение)
        // Можно добавить сюда частицы или шейдер позже
    }

    update(time, delta) {
        if (!this.isAlive || !this.scene || !this.scene.player) return;

        const player = this.scene.player;

        // Проверка возможности начать фазу прохода сквозь стены
        if (!this.isPhasing && time > this.nextPhaseTime) {
            this.startPhasing(time);
        }

        // Преследование игрока
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);

        // Если в фазе, проверяем окончание
        // (Таймер Phaser сделает это надежнее)
    }

    startPhasing(time) {
        if (this.isPhasing || !this.isAlive) return;

        console.log('SCP-106: Starting phase...');
        this.isPhasing = true;
        this.setAlpha(0.5); // Делаем полупрозрачным
        this.body.checkCollision.none = true; // Отключаем все коллизии

        // Таймер для завершения фазы
        this.phaseTimer = this.scene.time.delayedCall(this.phaseDuration, this.stopPhasing, [time], this);

        // Можно добавить звук "бульканья" или эффект коррозии
    }

    stopPhasing(startTime) {
        if (!this.isPhasing || !this.isAlive) return;

        console.log('SCP-106: Stopping phase...');
        this.isPhasing = false;
        this.setAlpha(1); // Возвращаем нормальную прозрачность
        this.body.checkCollision.none = false; // Включаем коллизии обратно
        // Убедимся, что коллизия со стенами работает (если сцена использует слой)
         if (this.scene.wallsLayer) {
            this.scene.physics.world.collide(this, this.scene.wallsLayer);
         }

        this.nextPhaseTime = startTime + this.phaseCooldown; // Устанавливаем время следующей возможной фазы
        this.phaseTimer = null; // Сбрасываем таймер

        // Возможно, нужно проверить, не застрял ли он в стене, и вытолкнуть
        // TODO: Add logic to push out of walls if stuck
    }

    // Переопределяем die, чтобы остановить таймеры
    die() {
        if (this.phaseTimer) {
            this.phaseTimer.remove(); // Останавливаем таймер фазы, если он был активен
            this.phaseTimer = null;
        }
        this.isPhasing = false; // Убеждаемся, что флаг сброшен

        super.die(); // Вызываем родительский метод die
        // SCP-106 пока ничего не дропает
    }
} 