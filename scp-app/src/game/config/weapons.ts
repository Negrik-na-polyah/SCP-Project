export interface WeaponConfig {
  name: string;
  damage: number;
  fireRate: number;
  ammo: number;
  reloadTime: number;
}

export const WEAPONS: Record<string, WeaponConfig> = {
  PISTOL: {
    name: 'Pistol',
    damage: 10,
    fireRate: 0.5,
    ammo: 12,
    reloadTime: 1.5
  },
  RIFLE: {
    name: 'Rifle',
    damage: 20,
    fireRate: 0.2,
    ammo: 30,
    reloadTime: 2.0
  }
};