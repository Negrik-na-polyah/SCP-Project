"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import BootScene from "../game/scenes/BootScene";
import PreloaderScene from "../game/scenes/PreloaderScene";
import GameScene from "../game/scenes/GameScene";
import UIScene from "../game/scenes/UIScene";

export default function GameContainer() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameContainerRef.current && !gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: gameContainerRef.current,
        pixelArt: true,
        render: {
          pixelArt: true,
          antialias: false,
          mipmapFilter: "NEAREST",
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { y: 0 },
            debug: false,
          },
        },
        scene: [BootScene, PreloaderScene, GameScene, UIScene],
      };

      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div ref={gameContainerRef} className="game-container" />;
}