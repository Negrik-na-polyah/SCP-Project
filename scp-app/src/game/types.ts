export interface TextureConfig {
    id: string;
    path: string;
    frameWidth: number;
    frameHeight: number;
    frameCount?: number;
    frameRate?: number;
    loop?: boolean;
}

export interface WeaponConfig {
    id: string;
    name: string;
    type: 'pistol' | 'rifle' | 'shotgun' | 'sniper' | 'special' | 'smg';
    damage: number;
    fireRate: number; // ms between shots
    magazineSize: number;
    reloadTime: number; // ms
    spread: number; // degrees
    projectileSpeed: number;
    ammoType: string;
    texture: string;
    specialEffect?: 'stun' | 'burn' | 'freeze' | 'emp';
}

export interface PlayerState {
    health: number;
    maxHealth: number;
    currentWeapon: string;
    inventory: string[];
    ammo: Record<string, number>;
    questItems: Record<string, number>;
    abilities: {
        scan: boolean;
        turbo: boolean;
    };
}