import Enemy from './Enemy.js';

export default class SCP106 extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'scp106_placeholder', 120); // Уменьшено здоровье с 250 до 120
        this.lastDamageTime = 0;

        this.speed = 50; // Медленнее, чем другие
        this.isPhasing = false;
        this.phaseTimer = null;
        this.phaseDuration = 3000; // Длительность фазы прохода сквозь стены (3 сек)
        this.phaseCooldown = 8000; // Кулдаун между фазами (8 сек)
        this.nextPhaseTime = 0;

        // Эффект коррозии
        this.corrosionParticles = this.scene.add.particles('corrosion_particle');
        this.corrosionEmitter = this.corrosionParticles.createEmitter({
            frame: 0,
            x: 0,
            y: 0,
            lifespan: 1000,
            speed: { min: 10, max: 30 },
            scale: { start: 0.5, end: 0 },
            quantity: 1,
            frequency: 100,
            blendMode: 'ADD',
            follow: this,
            followOffset: { x: 0, y: 0 }
        });
        this.corrosionEmitter.stop();

        // Зона урона при приближении
        this.damageZone = this.scene.add.circle(this.x, this.y, 80, 0x000000, 0);
        this.scene.physics.add.existing(this.damageZone);
        this.damageZone.body.setCircle(80);
    }

    update(time, delta) {
        if (!this.isAlive || !this.scene || !this.scene.player) return;

        const player = this.scene.player;
        
        // Обновляем позицию зоны урона
        this.damageZone.x = this.x;
        this.damageZone.y = this.y;

        // Проверяем расстояние до игрока
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (distance < 150) {
            if (!this.corrosionEmitter.on) {
                this.corrosionEmitter.start();
            }
            
            // Урон игроку при близком нахождении
            if (distance < 100 && time > this.lastDamageTime + 1000) {
                player.takeDamage(5);
                this.lastDamageTime = time;
            }
        } else if (this.corrosionEmitter.on) {
            this.corrosionEmitter.stop();
        }

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