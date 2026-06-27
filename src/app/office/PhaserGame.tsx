'use client';

import { useEffect, useRef } from 'react';
import type { AgentData } from '../../game/OfficeScene';

interface Props {
  agents:       AgentData[];
  currentStage: number;
}

export default function PhaserGame({ agents, currentStage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<any>(null);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    // Phaser sometimes exports as default, sometimes as full module — handle both
    import('phaser').then((mod) => {
      const Phaser = mod.default || mod;

      if (!Phaser?.Scene) {
        console.error('[PhaserGame] Phaser failed to load:', mod);
        return;
      }

      import('../../game/OfficeScene').then(({ createOfficeScene }) => {
        // ── NULL GUARD (CRITICAL) ──────────────────────────────────────────
        // Both import() calls are async. Between the first useEffect check
        // (line 16 above) and this callback executing, the component may have
        // unmounted (React 18 StrictMode double-invoke, route navigation, etc.)
        // making containerRef.current null. The ! non-null assertion on lines
        // that follow would throw "Cannot read properties of null (clientWidth)".
        // This guard prevents that crash.
        if (gameRef.current || !containerRef.current) return;

        const OfficeScene = createOfficeScene(Phaser);

        const w = containerRef.current.clientWidth  || 900;
        const h = containerRef.current.clientHeight || 500;

        const config = {
          type:            Phaser.CANVAS,
          width:           w,
          height:          h,
          backgroundColor: '#020609',
          parent:          containerRef.current,
          scene:           [OfficeScene],
          antialias:       false,
          roundPixels:     true,
          pixelArt:        true,
          scale: {
            mode:       Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
        };

        gameRef.current = new Phaser.Game(config);
      });
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Bridge: push React state into Phaser registry on every update
  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.registry?.set('agents',       agents);
    gameRef.current.registry?.set('currentStage', currentStage);
  }, [agents, currentStage]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', backgroundColor: '#020609' }}
    />
  );
}
