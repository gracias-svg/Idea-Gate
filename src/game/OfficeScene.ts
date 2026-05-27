// src/game/OfficeScene.ts
//
// ⚠️  PURE PHASER — NO React, NO JSX, NO hooks, NO 'use client'
// ⚠️  The factory pattern is MANDATORY for Next.js SSR compatibility.
//     Never extend Phaser.Scene at module level — it will crash on server render.
//     createOfficeScene(Phaser) delays class definition to runtime, when Phaser exists.
//
// Responsibility: ALL canvas rendering — agents, desks, decorations, status sync.
// Does NOT own: React state, API polling, layout, Mission Control UI.
// Bridge: reads agent/stage updates via Phaser registry (set by PhaserGame.tsx).

export function createOfficeScene(Phaser: any) {
  return class OfficeScene extends Phaser.Scene {
    // ── Internal state ───────────────────────────────────────────────────────
    private agentDots   = new Map<string, any>(); // status indicator circles
    private agentBodies = new Map<string, any>(); // body rectangles for tinting
    private agentTweens = new Map<string, any>(); // active pulse tweens
    private g!: any;                               // shared graphics object

    // ── Agent definitions ────────────────────────────────────────────────────
    // Positions are expressed as fractions of canvas W/H — scale-safe.
    private readonly AGENTS = [
      { name: 'CO', role: 'Coordinator',      fx: 0.10, fy: 0.38, color: 0x22c55e },
      { name: 'PS', role: 'Product Strategy', fx: 0.22, fy: 0.38, color: 0xa78bfa },
      { name: 'RE', role: 'Research',          fx: 0.16, fy: 0.68, color: 0x38bdf8 },
      { name: 'UX', role: 'UX Design',         fx: 0.50, fy: 0.38, color: 0xf472b6 },
      { name: 'AR', role: 'Architect',          fx: 0.62, fy: 0.38, color: 0xfb923c },
      { name: 'QA', role: 'QA',                fx: 0.86, fy: 0.45, color: 0xfde047 },
    ];

    private readonly STATUS_COLORS: Record<string, number> = {
      idle:      0x475569,
      working:   0xf59e0b,
      reviewing: 0x818cf8,
      done:      0x22c55e,
      blocked:   0xf87171,
    };

    // ── Phaser lifecycle ─────────────────────────────────────────────────────
    constructor() {
      super({ key: 'OfficeScene' });
    }

    preload() {
      // Sprite sheets load here once pixel art assets are sourced.
      // Example (ready to uncomment when /public/sprites/ exists):
      //   this.load.spritesheet('agent-co', '/sprites/agent-co.png', { frameWidth: 32, frameHeight: 48 });
      // Current: agents are rendered as styled rectangles (functional, not pixel art).
    }

    create() {
      const W = this.scale.width;
      const H = this.scale.height;

      this.g = this.add.graphics();

      this.drawBackground(W, H);
      this.drawZoneLabels(W, H);
      this.drawDecorations(W, H);
      this.drawAgents(W, H);

      // Registry bridge: React → Phaser
      // PhaserGame.tsx calls gameRef.current.registry.set('agents', [...]) on every poll.
      this.registry.events.on('changedata', (_parent: any, key: string, value: any) => {
        if (key === 'agents') this.syncAgentStatuses(value);
      });

      // Sync initial state if registry was already populated before scene created
      const initial = this.registry.get('agents');
      if (Array.isArray(initial) && initial.length > 0) {
        this.syncAgentStatuses(initial);
      }
    }

    update(_time: number, _delta: number) {
      // Reserved for future: walk cycle animation, ambient particle tick, etc.
    }

    // ── Drawing: Background ──────────────────────────────────────────────────
    private drawBackground(W: number, H: number) {
      // Base fill
      this.add.rectangle(W / 2, H / 2, W, H, 0x020609);

      // Subtle grid
      const grid = this.add.graphics();
      grid.lineStyle(1, 0x050e08, 0.4);
      for (let x = 0; x <= W; x += 40) grid.lineBetween(x, 0, x, H);
      for (let y = 0; y <= H; y += 40) grid.lineBetween(0, y, W, y);

      // Zone separator lines
      grid.lineStyle(1, 0x0a2a14, 0.7);
      grid.lineBetween(W * 0.38, 8, W * 0.38, H - 8);
      grid.lineBetween(W * 0.73, 8, W * 0.73, H - 8);
    }

    // ── Drawing: Zone labels ─────────────────────────────────────────────────
    private drawZoneLabels(W: number, H: number) {
      const style = {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#0a2a14',
        letterSpacing: 5,
      };
      this.add.text(W * 0.19, 10, 'STRATEGY  ZONE',  style).setOrigin(0.5, 0);
      this.add.text(W * 0.55, 10, 'EXECUTION  ZONE', style).setOrigin(0.5, 0);
      this.add.text(W * 0.86, 10, 'QA  LAB',         style).setOrigin(0.5, 0);
    }

    // ── Drawing: Decorations ─────────────────────────────────────────────────
    private drawDecorations(W: number, H: number) {
      const g = this.g;

      // ── Sprint board (centre-left, between zones)
      const [bx, by] = [W * 0.395, H * 0.27];
      g.fillStyle(0x030f07, 1);   g.fillRect(bx - 28, by - 26, 56, 52);
      g.lineStyle(1, 0x0a3015); g.strokeRect(bx - 28, by - 26, 56, 52);
      this.add.text(bx, by - 18, 'SPRINT', {
        fontFamily: 'monospace', fontSize: '6px', color: '#0a3015',
      }).setOrigin(0.5);
      // sticky notes
      [[-13, -6], [0, -6], [13, -6], [-13, 8], [0, 8], [13, 8]].forEach(([dx, dy]) => {
        g.fillStyle(0x1a3a20, 0.5); g.fillRect(bx + dx - 5, by + dy - 4, 10, 9);
      });

      // ── Coffee station (strategy zone, lower)
      const [cx, cy] = [W * 0.10, H * 0.78];
      g.fillStyle(0x0c0800, 1); g.fillRect(cx - 22, cy - 16, 44, 30);
      g.lineStyle(1, 0x2a1800); g.strokeRect(cx - 22, cy - 16, 44, 30);
      this.add.text(cx, cy - 6, '☕',      { fontSize: '12px' }).setOrigin(0.5);
      this.add.text(cx, cy + 8, 'COFFEE',  {
        fontFamily: 'monospace', fontSize: '5px', color: '#2a1400',
      }).setOrigin(0.5);

      // ── Bookshelf (strategy zone, lower-right)
      const [shx, shy] = [W * 0.28, H * 0.78];
      g.fillStyle(0x0a0805, 1); g.fillRect(shx - 24, shy - 18, 48, 36);
      g.lineStyle(1, 0x1a1005); g.strokeRect(shx - 24, shy - 18, 48, 36);
      [0x4ade80, 0xa78bfa, 0x38bdf8, 0xf472b6, 0xfb923c].forEach((c, i) => {
        g.fillStyle(c, 0.3); g.fillRect(shx - 20 + i * 10, shy - 14, 8, 28);
      });

      // ── Ping pong table (execution zone, lower)
      const [px, py] = [W * 0.55, H * 0.80];
      g.fillStyle(0x003a14, 0.4); g.fillRect(px - 32, py - 10, 64, 20);
      g.lineStyle(1, 0x0a5020);   g.strokeRect(px - 32, py - 10, 64, 20);
      g.lineStyle(1, 0xffffff, 0.15);
      g.lineBetween(px, py - 10, px, py + 10);

      // ── Arcade machine (execution zone, lower-right)
      const [ax, ay] = [W * 0.70, H * 0.78];
      g.fillStyle(0x080020, 1); g.fillRect(ax - 14, ay - 24, 28, 48);
      g.lineStyle(1, 0x3b0088); g.strokeRect(ax - 14, ay - 24, 28, 48);
      g.fillStyle(0x1a0040, 1); g.fillRect(ax - 9, ay - 16, 18, 14);
      g.lineStyle(1, 0x818cf8, 0.35); g.strokeRect(ax - 9, ay - 16, 18, 14);
      this.add.text(ax, ay + 10, 'AI\nQUEST', {
        fontFamily: 'monospace', fontSize: '5px', color: '#3b0088', align: 'center',
      }).setOrigin(0.5);

      // ── Server rack (far-right edge)
      const [sx, sy] = [W * 0.965, H * 0.50];
      g.fillStyle(0x040a0a, 1); g.fillRect(sx - 18, sy - 48, 36, 96);
      g.lineStyle(1, 0x0a3020); g.strokeRect(sx - 18, sy - 48, 36, 96);
      [-28, -14, 0, 14, 28].forEach(dy => {
        g.fillStyle(0x0a1a10, 1); g.fillRect(sx - 12, sy + dy - 5, 24, 10);
        g.lineStyle(1, 0x22c55e, 0.15); g.strokeRect(sx - 12, sy + dy - 5, 24, 10);
        g.fillStyle(0x22c55e, 0.5); g.fillCircle(sx + 7, sy + dy, 2);
      });
      this.add.text(sx, sy - 56, 'SRV', {
        fontFamily: 'monospace', fontSize: '6px', color: '#0a3020',
      }).setOrigin(0.5);

      // ── Bean bags (QA zone)
      [[W * 0.80, H * 0.72], [W * 0.86, H * 0.76]].forEach(([bx2, by2]) => {
        g.fillStyle(0x1a3020, 0.4); g.fillEllipse(bx2, by2, 22, 16);
        g.lineStyle(1, 0x0a2a14, 0.6); g.strokeEllipse(bx2, by2, 22, 16);
      });
    }

    // ── Drawing: Agents + desks ──────────────────────────────────────────────
    private drawAgents(W: number, H: number) {
      const g = this.g;

      this.AGENTS.forEach(({ name, fx, fy, color }) => {
        const x = W * fx;
        const y = H * fy;

        // Desk surface
        g.fillStyle(color, 0.04);
        g.fillRect(x - 38, y - 8, 76, 34);
        g.lineStyle(1, color, 0.12);
        g.strokeRect(x - 38, y - 8, 76, 34);

        // Monitor screen (subtle glow)
        g.fillStyle(color, 0.07);
        g.fillRect(x - 20, y - 38, 40, 24);
        g.lineStyle(1, color, 0.22);
        g.strokeRect(x - 20, y - 38, 40, 24);

        // Monitor scanlines (detail)
        g.lineStyle(1, color, 0.04);
        for (let sy2 = y - 34; sy2 < y - 18; sy2 += 4) {
          g.lineBetween(x - 18, sy2, x + 18, sy2);
        }

        // Agent body (placeholder silhouette — sprite replaces this when assets land)
        g.fillStyle(color, 0.10);
        g.fillRect(x - 11, y - 70, 22, 28);
        g.lineStyle(1, color, 0.25);
        g.strokeRect(x - 11, y - 70, 22, 28);

        // Head
        g.fillStyle(color, 0.12);
        g.fillCircle(x, y - 82, 9);
        g.lineStyle(1, color, 0.2);
        g.strokeCircle(x, y - 82, 9);

        // Name tag below desk
        this.add.text(x, y + 34, name, {
          fontFamily: 'monospace',
          fontSize: '8px',
          color: `#${color.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5);

        // Status indicator dot (idle colour until registry sync)
        const dot = this.add.circle(x + 13, y - 90, 3.5, 0x475569);
        this.agentDots.set(name, dot);

        // Body reference (for future sprite tinting)
        this.agentBodies.set(name, { x, y, color });
      });
    }

    // ── Registry sync: agents → canvas ──────────────────────────────────────
    private syncAgentStatuses(agents: any[]) {
      agents.forEach((agent: any) => {
        const dot = this.agentDots.get(agent.name);
        if (!dot) return;

        const color = this.STATUS_COLORS[agent.status] ?? this.STATUS_COLORS.idle;
        dot.setFillStyle(color);

        // Cancel previous tween for this agent before starting a new one
        const existingTween = this.agentTweens.get(agent.name);
        if (existingTween) {
          existingTween.stop();
          this.agentTweens.delete(agent.name);
          dot.setScale(1);
        }

        // Pulse animation while working
        if (agent.status === 'working' || agent.status === 'reviewing') {
          const tween = this.tweens.add({
            targets: dot,
            scaleX: 2, scaleY: 2,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          this.agentTweens.set(agent.name, tween);
        }
      });
    }
  };
}
