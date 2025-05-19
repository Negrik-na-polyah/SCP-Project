import { TextureConfig } from '../types';

export const TEXTURES: TextureConfig[] = [
    {
        id: 'player',
        path: 'assets/player.png',
        frameWidth: 32,
        frameHeight: 32,
        frameCount: 4,
        frameRate: 10,
        loop: true
    },
    {
        id: 'scp_173',
        path: 'assets/scp/scp_173.png',
        frameWidth: 32,
        frameHeight: 32,
        frameCount: 4,
        frameRate: 8,
        loop: true
    },
    {
        id: 'scp_096',
        path: 'assets/scp/scp_096.png',
        frameWidth: 32,
        frameHeight: 48,
        frameCount: 4,
        frameRate: 6,
        loop: true
    },
    {
        id: 'scp_106',
        path: 'assets/scp/scp_106.png',
        frameWidth: 32,
        frameHeight: 32,
        frameCount: 4,
        frameRate: 6,
        loop: true
    }
];