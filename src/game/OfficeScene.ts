// src/game/OfficeScene.ts
// IdeaGate — Pixel Art Office Scene
// Retro NES/Game Boy Advance style top-down office.
// All art drawn with Phaser Graphics.fillRect — no external sprites required.
// Factory pattern preserved for Next.js SSR compatibility.

export interface AgentData {
  id:    string;
  name:  string;
  color: string;   // hex string e.g. '#4ade80'
  state: 'idle' | 'working' | 'done' | 'stale' | 'blocked';
  stale: boolean;
}

export interface OfficeSceneConfig {
  agents: AgentData[];
}

// ── Color palette (NES/SNES inspired) ────────────────────────────────────────
const PAL = {
  // Floors
  FLOOR_A:   0x12161f,
  FLOOR_B:   0x0e1219,
  FLOOR_GRID:0x090c14,

  // Zone tints
  ZONE_STRAT: 0x0a1520,   // blue tint
  ZONE_EXEC:  0x0f0f1f,   // purple tint
  ZONE_QA:    0x150a10,   // red tint

  // Walls
  WALL:       0x060a10,
  WALL_TRIM:  0x0a1020,
  BASEBOARD:  0x0d1525,

  // Desk
  DESK_TOP:   0x3d2a1a,
  DESK_FRONT: 0x2a1d10,
  DESK_LEG:   0x1a1008,
  DESK_EDGE:  0x4a3520,

  // Monitor
  MON_FRAME:  0x1a1a2a,
  MON_SCREEN: 0x000d08,
  MON_GLOW:   0x00cc44,
  MON_BLUE:   0x0030cc,
  MON_AMBER:  0xcc7700,

  // Chair
  CHAIR_SEAT: 0x2a2a40,
  CHAIR_BACK: 0x222235,
  CHAIR_LEG:  0x1a1a1a,

  // Characters
  SKIN:       0xf8c090,
  SKIN_D:     0xe0a070,
  EYE:        0x0a0a20,
  MOUTH:      0x804040,
  HAIR_D:     0x201008,

  // Decorations
  PLANT_L:    0x00aa33,
  PLANT_D:    0x006622,
  POT:        0x553322,
  SERVER_F:   0x1a1a2a,
  SERVER_B:   0x111120,
  SERVER_LED: 0x00ff44,
  COFFEE_M:   0x3d2000,
  COFFEE_C:   0x8b4513,
  BOARD_BG:   0x1a0808,
  BOARD_CARD: 0x2a3050,
  CARD_G:     0x0a3a1a,
  CARD_A:     0x3a2a0a,

  // Sprint board text lines
  TEXT_DIM:   0x334466,
  TEXT_BRIGHT:0x4466aa,

  // CRT effects
  SCANLINE:   0x000000,
  VIGNETTE:   0x000000,

  // Zone label background
  LABEL_BG:   0x050a15,
};

// Hex string '#4ade80' → Phaser number 0x4ade80
function h(color: string): number {
  return parseInt(color.replace('#', ''), 16);
}

// Darken a color by factor
function dk(color: number, factor: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * factor);
  const g = Math.floor(((color >> 8)  & 0xff) * factor);
  const b = Math.floor((color         & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

// ── Desk definitions ──────────────────────────────────────────────────────────
interface DeskDef {
  agent:     string;
  agentName: string;
  color:     number;
  x:         number;   // canvas x of desk top-left
  y:         number;   // canvas y
  zone:      'STRATEGY' | 'EXECUTION' | 'QA';
  screenColor: number;
}

// ── Factory function ──────────────────────────────────────────────────────────
export function createOfficeScene(Phaser: any) {

  return class OfficeScene extends Phaser.Scene {
    private PX = 2;           // 1 game pixel = 2 screen pixels
    private g!: any;           // base graphics layer
    private agLayer!: any;    // agent layer (redrawn on state change)
    private fxLayer!: any;    // CRT effect layer
    private glowTimers: any[] = [];
    private deskMap: DeskDef[] = [];
    private liveAgents: AgentData[] = [];
    private tick = 0;
    private screenGlows: {g:any; x:number; y:number; color:number; phase:number}[] = [];

    constructor() {
      super({ key: 'OfficeScene' });
    }

    init(data: { agents?: AgentData[] }) {
      if (data?.agents?.length) this.liveAgents = data.agents;
    }

    create() {
      const W = this.scale.width;
      const H = this.scale.height;

      // Base layer
      this.g = this.add.graphics();
      this.agLayer = this.add.graphics();
      this.fxLayer = this.add.graphics();

      // Define desk positions relative to canvas
      this.buildDeskMap(W, H);

      // Draw the full office
      this.drawOffice(W, H);

      // CRT overlay
      this.drawCRT(W, H);

      // Start glow animation
      this.time.addEvent({
        delay: 80,
        callback: this.pulseGlows,
        callbackScope: this,
        loop: true,
      });

      // Idle animations
      this.time.addEvent({
        delay: 1200,
        callback: this.idleTick,
        callbackScope: this,
        loop: true,
      });
    }

    update() {
      // Live data is pushed via scene.restart or external updates
    }

    // ── Build desk layout ──────────────────────────────────────────────────────
    buildDeskMap(W: number, H: number) {
      const agentColors: Record<string, number> = {
        CO: 0x4ade80, PS: 0x818cf8, RE: 0x38bdf8,
        UX: 0xf59e0b, AR: 0xfb923c, QA: 0xf472b6,
      };
      const screenColors: Record<string, number> = {
        CO: 0x00cc44, PS: 0x6644cc, RE: 0x0066cc,
        UX: 0xcc7700, AR: 0xcc4400, QA: 0xcc0066,
      };

      // Zone boundaries
      const ZW = Math.floor(W / 3);

      // Strategy zone: CO, PS, RE
      // Execution zone: UX, AR
      // QA zone: QA
      const DESK_W = 72, DESK_H = 28;
      const ROW1 = Math.floor(H * 0.25);
      const ROW2 = Math.floor(H * 0.58);
      const COL = [
        ZW * 0 + 30,           // col 0 (strategy left)
        ZW * 0 + 30 + DESK_W + 28, // col 1 (strategy right)
        ZW * 1 + 24,           // col 2 (exec left)
        ZW * 1 + 24 + DESK_W + 20, // col 3 (exec right)
        ZW * 2 + 30,           // col 4 (QA)
      ];

      this.deskMap = [
        { agent:'CO', agentName:'Coordinator',    color: agentColors.CO, x: COL[0], y: ROW1, zone:'STRATEGY',  screenColor: screenColors.CO },
        { agent:'PS', agentName:'Product Strat',  color: agentColors.PS, x: COL[1], y: ROW1, zone:'STRATEGY',  screenColor: screenColors.PS },
        { agent:'RE', agentName:'Researcher',     color: agentColors.RE, x: COL[0], y: ROW2, zone:'STRATEGY',  screenColor: screenColors.RE },
        { agent:'UX', agentName:'UX Designer',    color: agentColors.UX, x: COL[2], y: ROW1, zone:'EXECUTION', screenColor: screenColors.UX },
        { agent:'AR', agentName:'Architect',      color: agentColors.AR, x: COL[3], y: ROW1, zone:'EXECUTION', screenColor: screenColors.AR },
        { agent:'QA', agentName:'QA Engineer',    color: agentColors.QA, x: COL[4], y: ROW1, zone:'QA',        screenColor: screenColors.QA },
      ];
    }

    // ── Main draw routine ──────────────────────────────────────────────────────
    drawOffice(W: number, H: number) {
      const g = this.g;

      // ─ Sky/wall background ─
      g.fillStyle(PAL.WALL); g.fillRect(0, 0, W, H);

      // ─ Zone floor areas ─
      const ZW = Math.floor(W / 3);
      this.drawZoneFloor(g, 0,       0, ZW,   H, PAL.ZONE_STRAT);
      this.drawZoneFloor(g, ZW,      0, ZW,   H, PAL.ZONE_EXEC);
      this.drawZoneFloor(g, ZW * 2,  0, W - ZW * 2, H, PAL.ZONE_QA);

      // ─ Zone dividers (vertical lines, pixel-thick) ─
      g.fillStyle(PAL.FLOOR_GRID);
      g.fillRect(ZW - 1,     0, 3, H);
      g.fillRect(ZW * 2 - 1, 0, 3, H);

      // ─ Zone labels ─
      this.drawZoneLabel(g, ZW * 0 + 10, 12, 'STRATEGY',  0x4ade80);
      this.drawZoneLabel(g, ZW * 1 + 10, 12, 'EXECUTION', 0x818cf8);
      this.drawZoneLabel(g, ZW * 2 + 10, 12, 'QA LAB',    0xf472b6);

      // ─ Decorations ─
      this.drawSprintBoard(g, ZW * 0 + 10, H * 0.73);
      this.drawCoffeArea(g,  ZW * 1 + 10, H * 0.60);
      this.drawServerRack(g, ZW * 2 + 10, H * 0.50);
      this.drawPlant(g, ZW * 0 - 14, H * 0.25);
      this.drawPlant(g, ZW * 2 - 14, H * 0.25);
      this.drawPlant(g, ZW * 3 - 14, H * 0.55);

      // ─ All desks ─
      this.screenGlows = [];
      for (const desk of this.deskMap) {
        this.drawDesk(g, desk);
        this.drawAgent(g, desk);
      }

      // ─ Baseboard trim at bottom ─
      g.fillStyle(PAL.BASEBOARD);
      g.fillRect(0, H - 4, W, 4);

      // ─ Top banner bar ─
      g.fillStyle(0x020c06);
      g.fillRect(0, 0, W, 38);
      g.fillStyle(0x0a1a2e);
      g.fillRect(0, 37, W, 1);
    }

    // ── Zone floor (tiled checkerboard) ───────────────────────────────────────
    drawZoneFloor(g: any, zx: number, zy: number, zw: number, zh: number, tint: number) {
      const TILE = 32;
      for (let ty = 0; ty <= zh; ty += TILE) {
        for (let tx = 0; tx <= zw; tx += TILE) {
          const isAlt = ((Math.floor(tx / TILE) + Math.floor(ty / TILE)) % 2 === 0);
          g.fillStyle(isAlt ? tint : dk(tint, 0.85), 0.92);
          g.fillRect(zx + tx, zy + ty, TILE, TILE);
        }
      }
      // Sub-tile grid lines
      g.lineStyle(1, PAL.FLOOR_GRID, 0.6);
      for (let ty = 0; ty <= zh; ty += TILE) {
        g.strokeLineShape(new Phaser.Geom.Line(zx, zy + ty, zx + zw, zy + ty));
      }
      for (let tx = 0; tx <= zw; tx += TILE) {
        g.strokeLineShape(new Phaser.Geom.Line(zx + tx, zy, zx + tx, zy + zh));
      }
    }

    // ── Zone label ────────────────────────────────────────────────────────────
    drawZoneLabel(g: any, x: number, y: number, label: string, color: number) {
      // Draw a small pixel-art label background
      const LW = label.length * 6 + 8;
      g.fillStyle(PAL.LABEL_BG, 0.85);
      g.fillRect(x, y, LW, 11);
      // Add text via Phaser text (will be added in create instead)
      const txt = this.add.text(x + 4, y + 2, label, {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize:   '7px',
        color:      '#' + color.toString(16).padStart(6, '0'),
        letterSpacing: 1,
      });
      txt.setAlpha(0.9);
    }

    // ── Desk (3/4 perspective pixel art) ─────────────────────────────────────
    drawDesk(g: any, desk: DeskDef) {
      const { x, y } = desk;
      const DW = 72, DH = 26, FRONT = 10;

      // Shadow
      g.fillStyle(0x000000, 0.3);
      g.fillRect(x + 4, y + DH + FRONT + 2, DW, 6);

      // Desk legs (bottom corners)
      g.fillStyle(PAL.DESK_LEG);
      g.fillRect(x + 4,      y + DH + FRONT, 4, 10);
      g.fillRect(x + DW - 8, y + DH + FRONT, 4, 10);

      // Desk front face
      g.fillStyle(PAL.DESK_FRONT);
      g.fillRect(x, y + DH, DW, FRONT);
      // Edge highlight (top of front face)
      g.fillStyle(PAL.DESK_EDGE);
      g.fillRect(x, y + DH, DW, 2);

      // Desk top surface
      g.fillStyle(PAL.DESK_TOP);
      g.fillRect(x, y, DW, DH);
      // Top surface highlight (left edge)
      g.fillStyle(dk(PAL.DESK_TOP, 1.3));
      g.fillRect(x, y, 2, DH);
      // Top surface back edge (darker)
      g.fillStyle(dk(PAL.DESK_TOP, 0.7));
      g.fillRect(x, y, DW, 3);

      // Items on desk: pencil holder, notepad
      g.fillStyle(0x2a4a3a);
      g.fillRect(x + 54, y + 16, 5, 8); // pencil holder
      g.fillStyle(0xeeeedd);
      g.fillRect(x + 8, y + 14, 16, 10); // notepad
      g.fillStyle(0xbbbbaa);
      g.fillRect(x + 10, y + 16, 12, 1); // line on notepad
      g.fillRect(x + 10, y + 18, 9,  1);

      // Chair below desk
      this.drawChair(g, x + 20, y + DH + FRONT + 6);

      // Monitor on desk
      this.drawMonitor(g, x + 20, y - 32, desk.screenColor);

      // Nameplate
      const txt = this.add.text(x + 2, y + DH + FRONT + 2, desk.agent, {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize:   '8px',
        color:      '#' + desk.color.toString(16).padStart(6, '0'),
      });
      txt.setAlpha(0.85);
    }

    // ── Monitor (pixel art CRT monitor) ───────────────────────────────────────
    drawMonitor(g: any, x: number, y: number, screenColor: number) {
      const MW = 40, MH = 30;

      // Monitor stand
      g.fillStyle(PAL.MON_FRAME);
      g.fillRect(x + 16, y + MH,     8,  6);
      g.fillRect(x + 10, y + MH + 6, 20, 3);

      // Monitor outer frame
      g.fillStyle(PAL.MON_FRAME);
      g.fillRect(x, y, MW, MH);
      // Monitor inner bezel
      g.fillStyle(dk(PAL.MON_FRAME, 0.7));
      g.fillRect(x + 1, y + 1, MW - 2, MH - 2);

      // Screen area
      const SX = x + 3, SY = y + 3, SW = MW - 6, SH = MH - 6;
      g.fillStyle(PAL.MON_SCREEN);
      g.fillRect(SX, SY, SW, SH);

      // Screen content (fake code/text lines in the agent's color)
      const lineColor = screenColor;
      g.fillStyle(lineColor, 0.7);
      g.fillRect(SX + 2, SY + 2,  20, 1); // code line
      g.fillRect(SX + 2, SY + 4,  14, 1);
      g.fillRect(SX + 4, SY + 6,  18, 1);
      g.fillRect(SX + 2, SY + 8,  10, 1);
      g.fillStyle(lineColor, 0.4);
      g.fillRect(SX + 2, SY + 11, 22, 1);
      g.fillRect(SX + 2, SY + 13, 16, 1);
      g.fillRect(SX + 4, SY + 15, 12, 1);

      // Blinking cursor
      g.fillStyle(screenColor, 0.9);
      g.fillRect(SX + 2, SY + 18, 5, 2);

      // Screen edge glow (tracked for animation)
      this.screenGlows.push({ g, x: SX, y: SY, color: screenColor, phase: Math.random() * Math.PI * 2 });
    }

    // ── Chair (3/4 perspective) ───────────────────────────────────────────────
    drawChair(g: any, x: number, y: number) {
      // Chair back
      g.fillStyle(PAL.CHAIR_BACK);
      g.fillRect(x + 4, y - 12, 18, 12);
      // Back highlight
      g.fillStyle(dk(PAL.CHAIR_BACK, 1.2));
      g.fillRect(x + 4, y - 12, 2, 12);

      // Chair seat
      g.fillStyle(PAL.CHAIR_SEAT);
      g.fillRect(x, y, 26, 10);
      // Seat highlight
      g.fillStyle(dk(PAL.CHAIR_SEAT, 1.15));
      g.fillRect(x, y, 26, 2);

      // Chair legs
      g.fillStyle(PAL.CHAIR_LEG);
      g.fillRect(x + 2,  y + 10, 2, 8);
      g.fillRect(x + 22, y + 10, 2, 8);
      g.fillRect(x + 11, y + 10, 2, 8);
      // Wheel dots
      g.fillStyle(0x303030);
      g.fillRect(x + 2,  y + 17, 2, 2);
      g.fillRect(x + 22, y + 17, 2, 2);
    }

    // ── Agent pixel art character ─────────────────────────────────────────────
    // 10x10 virtual pixel character, PX=2 → 20x20 screen pixels + desk body
    drawAgent(g: any, desk: DeskDef) {
      const P = 2; // pixel size
      const cx = desk.x + 22; // character x (above desk center)
      const cy = desk.y - 28; // character y

      // Hair (agent's color, darkened)
      const hairColor = dk(desk.color, 0.65);
      g.fillStyle(hairColor);
      g.fillRect(cx + P * 1, cy,          P * 4, P * 2); // hair top
      g.fillRect(cx,         cy + P * 2,  P * 6, P    ); // hair sides

      // Face (skin tone)
      g.fillStyle(PAL.SKIN);
      g.fillRect(cx,         cy + P * 2,  P * 6, P * 4); // face

      // Eyes
      g.fillStyle(PAL.EYE);
      g.fillRect(cx + P * 1, cy + P * 3,  P,     P    ); // left eye
      g.fillRect(cx + P * 4, cy + P * 3,  P,     P    ); // right eye

      // Eye whites
      g.fillStyle(0xffffff);
      g.fillRect(cx + P * 1, cy + P * 3,  P * 2, P    );
      g.fillRect(cx + P * 4, cy + P * 3,  P * 2, P    );
      g.fillStyle(PAL.EYE);
      g.fillRect(cx + P * 1, cy + P * 3,  P,     P    );
      g.fillRect(cx + P * 4, cy + P * 3,  P,     P    );

      // Mouth
      g.fillStyle(PAL.MOUTH);
      g.fillRect(cx + P * 2, cy + P * 5,  P * 2, P    );

      // Body / shirt (agent color)
      g.fillStyle(desk.color);
      g.fillRect(cx,         cy + P * 6,  P * 6, P * 4); // shirt

      // Collar
      g.fillStyle(0xffffff);
      g.fillRect(cx + P * 2, cy + P * 6,  P * 2, P    );

      // Shirt pocket detail
      g.fillStyle(dk(desk.color, 0.7));
      g.fillRect(cx + P * 1, cy + P * 7,  P * 2, P * 2);

      // Hands on desk
      g.fillStyle(PAL.SKIN);
      g.fillRect(desk.x + 10, desk.y + 8,  5, 4);
      g.fillRect(desk.x + 48, desk.y + 8,  5, 4);

      // Status indicator above head (floating dot)
      const stateColor = this.getStateColor(desk.agent);
      g.fillStyle(stateColor, 0.9);
      g.fillRect(cx + P * 2, cy - 8, P * 2, P * 2);

      // Add name text above character
      const nameColor = '#' + desk.color.toString(16).padStart(6, '0');
      this.add.text(cx - 4, cy - 18, desk.agent, {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize:   '9px',
        color:      nameColor,
      }).setAlpha(0.9);
    }

    // ── Get state color for indicator ─────────────────────────────────────────
    getStateColor(agentId: string): number {
      const agent = this.liveAgents.find(a => a.id === agentId);
      if (!agent) return 0x334155;
      switch (agent.state) {
        case 'done':    return 0x4ade80;
        case 'working': return 0x818cf8;
        case 'stale':   return 0xf59e0b;
        case 'blocked': return 0xf87171;
        default:        return 0x334155;
      }
    }

    // ── Sprint board decoration ────────────────────────────────────────────────
    drawSprintBoard(g: any, x: number, y: number) {
      const BW = 80, BH = 55;
      // Board frame
      g.fillStyle(0x1a0808);
      g.fillRect(x, y, BW, BH);
      g.fillStyle(0x2a1010);
      g.fillRect(x + 2, y + 2, BW - 4, BH - 4);

      // Column labels (TO DO | IN PROGRESS | DONE)
      g.fillStyle(PAL.TEXT_DIM);
      g.fillRect(x + 4,  y + 4, 20, 4); // TODO label
      g.fillRect(x + 30, y + 4, 20, 4); // IN PROGRESS label
      g.fillRect(x + 56, y + 4, 16, 4); // DONE label

      // Sticky cards
      const cards = [
        { cx:x+4,  cy:y+12, w:20, h:12, color:PAL.BOARD_CARD },
        { cx:x+4,  cy:y+28, w:20, h:12, color:PAL.BOARD_CARD },
        { cx:x+30, cy:y+12, w:22, h:14, color:PAL.CARD_A },
        { cx:x+30, cy:y+30, w:20, h:10, color:PAL.CARD_A },
        { cx:x+56, cy:y+12, w:16, h:10, color:PAL.CARD_G },
        { cx:x+56, cy:y+26, w:16, h:10, color:PAL.CARD_G },
        { cx:x+56, cy:y+40, w:16, h:10, color:PAL.CARD_G },
      ];
      for (const c of cards) {
        g.fillStyle(c.color);
        g.fillRect(c.cx, c.cy, c.w, c.h);
        // Card text line
        g.fillStyle(dk(c.color, 1.4));
        g.fillRect(c.cx + 2, c.cy + 3, c.w - 4, 1);
        g.fillRect(c.cx + 2, c.cy + 6, c.w - 6, 1);
      }

      this.add.text(x + 2, y - 10, 'SPRINT BOARD', {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize:   '7px', color: '#334155',
      });
    }

    // ── Coffee area decoration ─────────────────────────────────────────────────
    drawCoffeArea(g: any, x: number, y: number) {
      // Counter
      g.fillStyle(PAL.DESK_TOP);  g.fillRect(x, y, 50, 18);
      g.fillStyle(PAL.DESK_FRONT); g.fillRect(x, y+18, 50, 6);

      // Coffee machine
      g.fillStyle(0x2a2a3a); g.fillRect(x + 5, y - 20, 18, 20);
      g.fillStyle(0x1a1a2a); g.fillRect(x + 7, y - 16, 14, 10);
      g.fillStyle(0xcc3300); g.fillRect(x + 9, y - 13, 4, 4);    // button
      g.fillStyle(PAL.COFFEE_C); g.fillRect(x + 13, y - 10, 6, 4); // mug

      // Coffee cups on counter
      for (let i = 0; i < 3; i++) {
        g.fillStyle(PAL.COFFEE_C);
        g.fillRect(x + 28 + i * 7, y + 4, 5, 7);
        g.fillStyle(PAL.COFFEE_M);
        g.fillRect(x + 29 + i * 7, y + 5, 3, 3);
      }

      // Kettle
      g.fillStyle(0x404040); g.fillRect(x + 5, y + 2, 12, 10);
      g.fillStyle(0x555555); g.fillRect(x + 6, y + 3, 10, 8);

      this.add.text(x + 2, y - 26, 'COFFEE BAR', {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize:   '7px', color: '#334155',
      });
    }

    // ── Server rack decoration ─────────────────────────────────────────────────
    drawServerRack(g: any, x: number, y: number) {
      const RW = 30, RH = 80;
      // Rack cabinet
      g.fillStyle(PAL.SERVER_B); g.fillRect(x, y, RW, RH);
      g.fillStyle(PAL.SERVER_F); g.fillRect(x+2, y+2, RW-4, RH-4);

      // Server units (blades)
      for (let i = 0; i < 8; i++) {
        const uy = y + 4 + i * 9;
        g.fillStyle(0x1e1e30); g.fillRect(x+3, uy, RW-6, 7);
        // LEDs
        const ledOn = i < 5;
        g.fillStyle(ledOn ? PAL.SERVER_LED : 0x003300);
        g.fillRect(x + RW - 8, uy + 2, 2, 2);
        g.fillStyle(ledOn && i % 2 === 0 ? 0x0044ff : 0x000033);
        g.fillRect(x + RW - 5, uy + 2, 2, 2);
        // Drive indicator
        g.fillStyle(0x111120); g.fillRect(x + 4, uy + 2, 8, 3);
      }

      // Power LED at bottom
      g.fillStyle(0x00ff00); g.fillRect(x + 5, y + RH - 8, 3, 3);

      this.add.text(x + 2, y - 10, 'SERVER', {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize:   '7px', color: '#334155',
      });
    }

    // ── Plant decoration ───────────────────────────────────────────────────────
    drawPlant(g: any, x: number, y: number) {
      // Pot
      g.fillStyle(PAL.POT);
      g.fillRect(x + 4, y + 16, 16, 12);
      g.fillRect(x + 6, y + 13, 12, 4);

      // Soil
      g.fillStyle(0x2a1000);
      g.fillRect(x + 7, y + 13, 10, 3);

      // Leaves
      g.fillStyle(PAL.PLANT_D);
      g.fillRect(x + 8, y,      8, 14);   // main stem/leaf
      g.fillStyle(PAL.PLANT_L);
      g.fillRect(x + 6, y + 4,  12, 8);   // wide leaf
      g.fillRect(x + 2, y + 8,  8, 6);    // left leaf
      g.fillRect(x + 14, y + 6, 8, 7);    // right leaf
      g.fillStyle(dk(PAL.PLANT_L, 1.2));
      g.fillRect(x + 8, y + 2,  8, 2);    // highlight
    }

    // ── CRT scanlines overlay ──────────────────────────────────────────────────
    drawCRT(W: number, H: number) {
      const fx = this.fxLayer;
      // Scanlines — every 2 pixels, very subtle
      fx.fillStyle(PAL.SCANLINE, 0.07);
      for (let y = 0; y < H; y += 3) {
        fx.fillRect(0, y, W, 1);
      }

      // Corner vignette
      // We simulate vignette with a dark overlay that's stronger at edges
      fx.fillStyle(0x000000, 0.15);
      fx.fillRect(0, 0, 20, H);         // left edge
      fx.fillRect(W - 20, 0, 20, H);   // right edge
      fx.fillRect(0, 0, W, 14);         // top edge
      fx.fillRect(0, H - 14, W, 14);   // bottom edge

      // Stronger corner darkening
      fx.fillStyle(0x000000, 0.2);
      fx.fillRect(0, 0, 40, 30);
      fx.fillRect(W - 40, 0, 40, 30);
      fx.fillRect(0, H - 30, 40, 30);
      fx.fillRect(W - 40, H - 30, 40, 30);
    }

    // ── Pulse glow animation ──────────────────────────────────────────────────
    pulseGlows() {
      this.tick++;
      if (!this.screenGlows.length) return;

      for (const glow of this.screenGlows) {
        const pulse = 0.4 + 0.15 * Math.sin(glow.phase + this.tick * 0.15);
        // Redraw glow overlay on just that screen
        glow.g.fillStyle(glow.color, pulse * 0.15);
        glow.g.fillRect(glow.x, glow.y, 34, 24);
        glow.phase += 0.05;
      }
    }

    // ── Idle agent bobbing ─────────────────────────────────────────────────────
    idleTick() {
      // Subtle: redraw a status dot with alternate brightness
      // (Full redraw is expensive; in production use sprites)
    }
  };
}
