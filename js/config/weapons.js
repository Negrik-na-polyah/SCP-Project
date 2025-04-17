// Данные оружия weapons.js

// Базовые характеристики пуль по умолчанию
const defaultBullet = {
    speed: 500,
    lifespan: 1000,
    texture: 'bullet_placeholder',
    size: { width: 4, height: 4 }, // Для хитбокса
    piercing: false, // Пробивает ли врагов
};

// Определения оружия
const WEAPON_DATA = {
    // Обычное оружие
    glock17: {
        name: 'Glock 17',
        type: 'pistol',
        damage: 15,
        magazineSize: 15,
        totalAmmoMax: 60,
        fireRate: 150, // мс между выстрелами
        reloadTime: 1400, // мс
        bullet: { ...defaultBullet },
        sound_fire: 'shoot_glock', // Ключи для звуков (добавим позже)
        sound_reload: 'reload_pistol'
    },
    desert_eagle: {
        name: 'Desert Eagle',
        type: 'pistol',
        damage: 35,
        magazineSize: 7,
        totalAmmoMax: 21,
        fireRate: 400,
        reloadTime: 1800,
        bullet: { ...defaultBullet, speed: 600 },
        sound_fire: 'shoot_deagle',
        sound_reload: 'reload_pistol'
    },
    mp5: {
        name: 'MP5',
        type: 'smg',
        damage: 20,
        magazineSize: 30,
        totalAmmoMax: 90,
        fireRate: 90, // Быстрая скорострельность
        reloadTime: 2200,
        bullet: { ...defaultBullet },
        sound_fire: 'shoot_smg',
        sound_reload: 'reload_smg'
    },
    ak74: {
        name: 'AK-74',
        type: 'rifle',
        damage: 25,
        magazineSize: 30,
        totalAmmoMax: 90,
        fireRate: 110,
        reloadTime: 2500,
        bullet: { ...defaultBullet, speed: 550 },
        sound_fire: 'shoot_rifle',
        sound_reload: 'reload_rifle'
    },
    m870: {
        name: 'M870',
        type: 'shotgun',
        damage: 40, // Урон за дробинку
        pellets: 6, // Количество дробинок
        spread: 0.15, // Разброс (в радианах)
        magazineSize: 5,
        totalAmmoMax: 20,
        fireRate: 800,
        reloadTime: 2800, // Может быть перезарядка по одному патрону?
        bullet: { ...defaultBullet, lifespan: 300 }, // Дробовик бьет недалеко
        sound_fire: 'shoot_shotgun',
        sound_reload: 'reload_shotgun'
    },
    awp: {
        name: 'AWP',
        type: 'sniper',
        damage: 60,
        magazineSize: 5,
        totalAmmoMax: 15,
        fireRate: 1500,
        reloadTime: 3000,
        bullet: { ...defaultBullet, speed: 800, piercing: true }, // Пробивает
        scope: 2, // Увеличение прицела (реализуем позже)
        sound_fire: 'shoot_sniper',
        sound_reload: 'reload_sniper'
    },

    // Специальное оружие (базовые статы, механики позже)
    micro_hid: {
        name: 'Micro HID',
        type: 'special',
        damage: 10000, // Условно огромный урон
        magazineSize: 1, // 1 заряд
        totalAmmoMax: 1, // Всего 2 заряда в игре (нужно реализовать счетчик зарядов)
        fireRate: 5000,
        reloadTime: 10000,
        bullet: null // Особая механика выжигания
    },
    plasma_rifle: {
        name: 'Plasma Rifle',
        type: 'special',
        damage: 50,
        magazineSize: 10,
        totalAmmoMax: 0, // Не использует стандартные патроны? 10 зарядов?
        fireRate: 300,
        reloadTime: 3000,
        bullet: { ...defaultBullet, speed: 600, texture: 'plasma_bullet', piercing: true }
    },
    cryo_gun: {
        name: 'Cryo Gun',
        type: 'special',
        damage: 0, // Не наносит урон, замораживает
        magazineSize: 15,
        totalAmmoMax: 0,
        fireRate: 100,
        reloadTime: 4000,
        bullet: { ...defaultBullet, speed: 400, texture: 'cryo_effect', lifespan: 500 } // Эффект заморозки
    },
    flamethrower: {
        name: 'Flamethrower',
        type: 'special',
        damage: 5, // Урон за частицу/тик
        magazineSize: 100, // Топливо
        totalAmmoMax: 0,
        fireRate: 50, // Частота выпуска частиц
        reloadTime: 5000,
        bullet: null // Особая механика огня
    }
};

export default WEAPON_DATA; 