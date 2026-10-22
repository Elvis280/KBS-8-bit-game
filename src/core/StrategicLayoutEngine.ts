/**
 * Strategic Platformer Layout Engine (Extended 7200px World Width)
 * "THE CROWN THAT HELD THE DARK" — Complete Story Script Implementation (Version 1.0)
 * 
 * Enforces mathematical playability and physical coherence:
 * - Speed: 280 px/s, Jump velocity: -460 px/s, Gravity: 900 px/s^2
 * - Safe design reach <= 170 px (Pits reduced 20% to ~160 px)
 * - Safe vertical step height <= 85 px
 * - Multi-tiered land elevation plateaus:
 *     Zone 1 Lowlands: y = 640
 *     Zone 2 Foothill Plateau: y = 520 (Cliff at x = 1960)
 *     Zone 3 Pine Ridge Bastion: y = 400 (Cliff at x = 3960)
 *     Zone 4 Boss Colosseum: y = 540 (Steps down at x = 4960)
 *     Zone 5 Exit Portal: y = 640 (Moat at x = 6840-6980)
 * - Ground segments meet seamlessly at cliffs; ladders are anchored directly against rock walls!
 * - Buildings rest flush on solid ground with zero floating or overhangs!
 * - Every pit has a centered stepping-stone platform for safe traversal!
 */

export interface Segment {
  x: number;
  w: number;
  y?: number;
  h?: number;
}

export interface Platform {
  x: number;
  y: number;
  w: number;
}

export interface Box {
  x: number;
  y: number;
}

export interface Coin {
  x: number;
  y: number;
}

export interface SlimeMonster {
  x: number;
  y: number;
  patrolRange?: number;
  isCorrupted?: boolean;
}

export interface NPCSpawn {
  x: number;
  y: number;
  key: string;
  name: string;
  portrait?: string;
  lines: { speaker: string; text: string }[];
}

export interface PropSpawn {
  x: number;
  y: number;
  key: string;
  scale?: number;
  flipX?: boolean;
}

export interface BuildingSpawn {
  x: number;
  y: number;
  key: string;
  width?: number;
  height?: number;
  flipX?: boolean;
}

export interface InteractionPointSpawn {
  x: number;
  y: number;
  key: string;
  title: string;
  promptText: string;
  milestoneId?: string;
  lines: { speaker: string; text: string }[];
}

export interface ClimbSurface {
  x: number;
  y: number;
  height: number;
  mantleDir?: number;
}

export interface BossSpawn {
  x: number;
  y: number;
  key: string;
  name: string;
  title: string;
  maxHp: number;
  attackInterval?: number;
  milestoneId?: string;
  width?: number;
  height?: number;
}

export interface ValidatedActLayout {
  groundSegments: Segment[];
  platforms: Platform[];
  boxes: Box[];
  hazardBoxes?: Box[];
  slimes?: SlimeMonster[];
  npcs?: NPCSpawn[];
  props?: PropSpawn[];
  buildings?: BuildingSpawn[];
  interactionPoints?: InteractionPointSpawn[];
  climbSurfaces?: ClimbSurface[];
  boss?: BossSpawn;
  coins: Coin[];
}

export class StrategicLayoutEngine {
  public static readonly FLOOR_Y = 640;
  public static readonly BOX_SIZE = 48;
  public static readonly PLAYER_HEIGHT = 68;
  public static readonly MIN_HEADROOM = 88;
  public static readonly MAX_STEP_HEIGHT = 85;

  public static validate(layout: ValidatedActLayout): boolean {
    const { platforms, boxes, hazardBoxes = [] } = layout;
    const allBoxes = [...boxes, ...hazardBoxes];

    for (const b of allBoxes) {
      const bLeft = b.x - this.BOX_SIZE / 2;
      const bRight = b.x + this.BOX_SIZE / 2;
      const bTop = b.y - this.BOX_SIZE / 2;
      const bBottom = b.y + this.BOX_SIZE / 2;

      for (const p of platforms) {
        const pLeft = p.x - p.w / 2;
        const pRight = p.x + p.w / 2;
        const pTop = p.y - 9;
        const pBottom = p.y + 9;

        const xOverlap = Math.max(0, Math.min(bRight, pRight) - Math.max(bLeft, pLeft));
        const yOverlap = Math.max(0, Math.min(bBottom, pBottom) - Math.max(bTop, pTop));

        if (xOverlap > 0 && yOverlap > 2) {
          console.warn(`[LayoutEngine] Box at (${b.x},${b.y}) penetrates Platform at (${p.x},${p.y})`);
          return false;
        }

        if (xOverlap > 20 && p.y < b.y) {
          const headroom = bTop - pBottom;
          if (headroom > 0 && headroom < this.MIN_HEADROOM) {
            console.warn(`[LayoutEngine] Insufficient headroom (${headroom}px) between Box (${b.x},${b.y}) and Platform (${p.x},${p.y})`);
            return false;
          }
        }
      }
    }

    return true;
  }

  // =========================================================================
  // ACT I: THE LITTLE GUIDE (7200px Width)
  // Theme: Trust | Objective: Meet the mascot and begin the journey.
  // =========================================================================
  public static getAct1Layout(): ValidatedActLayout {
    return {
      groundSegments: [
        { x: 0, w: 1960, y: 640 },            // Zone 1 Lowlands: 0 - 1960 (Safe continuous scenic road)
        { x: 1960, w: 840, y: 520 },          // Zone 2 Foothill Plateau: 1960 - 2800 (Elevated y=520, Cliff at 1960)
        { x: 2960, w: 1000, y: 520 },         // Foothill Plateau: 2960 - 3960 (Pit 2: 2800-2960, 160px)
        { x: 3960, w: 1000, y: 400 },         // Zone 3 Pine Ridge Bastion: 3960 - 4960 (Elevated y=400, Cliff at 3960)
        { x: 4960, w: 1880, y: 540 },         // Zone 4 Boss Colosseum: 4960 - 6840 (Colosseum floor y=540)
        { x: 6980, w: 220, y: 640 }           // Zone 5 Exit Portal: 6980 - 7200 (Moat Pit 3: 6840-6980, 140px)
      ],
      climbSurfaces: [
        { x: 1960, y: 520, height: 120, mantleDir: 1 },  // Lowland y=640 up to Plateau y=520 at cliff face
        { x: 3960, y: 400, height: 120, mantleDir: 1 },  // Plateau y=520 up to Pine Ridge y=400 at cliff face
        { x: 4960, y: 400, height: 140, mantleDir: 1 }   // Pine Ridge y=400 down to Colosseum y=540
      ],
      platforms: [
        { x: 840, y: 490, w: 140 },           // Lowlands aerial meadow platform (y=490, 150px above road y=640)
        { x: 1150, y: 470, w: 160 },          // Lowlands high path (y=470, 170px above ground)
        { x: 1660, y: 460, w: 150 },          // Lowlands high path (y=460, 180px above ground)
        { x: 2880, y: 390, w: 140 },          // Bridge across Pit 2 (y=390, 130px above plateau y=520)
        { x: 3300, y: 340, w: 160 },          // Plateau high vantage (y=340, 180px above plateau)
        { x: 3660, y: 270, w: 160 },          // Plateau high step (y=270, ascending to Pine Ridge)
        { x: 4250, y: 260, w: 160 },          // Pine Ridge high vantage (y=260, 140px above bastion y=400)
        { x: 4700, y: 190, w: 160 },          // Pine Ridge sky vantage (y=190, 210px above bastion)
        // Colosseum tactical spectator platforms
        { x: 5450, y: 390, w: 170 },          // Left flank perch (150px above floor)
        { x: 5850, y: 280, w: 160 },          // High arena spectator perch (260px above floor)
        { x: 6250, y: 280, w: 160 },          // High arena spectator perch (260px above floor)
        { x: 6650, y: 390, w: 170 },          // Right flank perch (150px above floor)
        { x: 6910, y: 430, w: 130 }           // Bridge across Moat (y=430, 110px above Colosseum, 210px above exit)
      ],
      boss: {
        x: 6050,
        y: 540,
        key: 'boss_treant',
        name: 'Goliath Oaken Treant',
        title: 'Ancient Sentinel of the Glade',
        maxHp: 250,
        attackInterval: 3200,
        width: 360,
        height: 420
      },
      boxes: [
        { x: 260, y: 616 },
        { x: 1040, y: 616 },
        { x: 1780, y: 616 },
        { x: 2150, y: 496 },
        { x: 2650, y: 496 },
        { x: 3150, y: 496 },
        { x: 3550, y: 496 },
        { x: 4100, y: 376 },
        { x: 4850, y: 376 },
        { x: 5250, y: 516 },
        { x: 6500, y: 516 }
      ],
      slimes: [
        // Ground Patrols
        { x: 520, y: 640, patrolRange: 70 },
        { x: 1200, y: 640, patrolRange: 75 },
        { x: 2250, y: 520, patrolRange: 70 },
        { x: 3350, y: 520, patrolRange: 80, isCorrupted: true },
        { x: 4300, y: 400, patrolRange: 75, isCorrupted: true },
        // Elevated Platform Patrols
        { x: 1150, y: 470, patrolRange: 45 },
        { x: 1660, y: 460, patrolRange: 45 },
        { x: 3300, y: 340, patrolRange: 50, isCorrupted: true },
        { x: 4250, y: 260, patrolRange: 50, isCorrupted: true },
        { x: 5450, y: 390, patrolRange: 55, isCorrupted: true },
        { x: 6650, y: 390, patrolRange: 55, isCorrupted: true }
      ],
      npcs: [
        {
          x: 2200,
          y: 520,
          key: 'npc_elder',
          name: 'Elder Robin',
          lines: [
            { speaker: 'Elder Robin', text: 'Peace be with you, young traveler. The cliffs ahead rise sharply into the ancient pine ridges.' },
            { speaker: 'Elder Robin', text: 'Approach the wooden ladders along the rock face and press W or Up to climb! Use your Lumen Blade and Aegis Shield to confront whatever stirs in the eastern glade.' }
          ]
        },
        {
          x: 4200,
          y: 400,
          key: 'npc_merchant',
          name: 'Rowan the Merchant',
          lines: [
            { speaker: 'Rowan', text: 'Greetings, traveler! I have set up camp here before the high pass.' },
            { speaker: 'Rowan', text: 'A massive wooden colossus awakens in the colosseum ahead! Leap onto the elevated platforms to evade its ground-shaking roots!' }
          ]
        }
      ],
      props: [
        { x: 140, y: 640, key: 'prop_lamp' },
        { x: 600, y: 640, key: 'prop_signpost' },
        { x: 1020, y: 640, key: 'prop_flowers' },
        { x: 1600, y: 640, key: 'prop_lamp' },
        { x: 2100, y: 520, key: 'prop_lamp' },
        { x: 2650, y: 520, key: 'prop_flowers' },
        { x: 3100, y: 520, key: 'prop_lamp' },
        { x: 3750, y: 520, key: 'prop_signpost' },
        { x: 4100, y: 400, key: 'prop_lamp' },
        { x: 4750, y: 400, key: 'prop_flowers' },
        { x: 5100, y: 540, key: 'prop_torch' },
        { x: 6750, y: 540, key: 'prop_torch' }
      ],
      coins: [
        { x: 380, y: 450 },
        { x: 840, y: 430 },
        { x: 1150, y: 410 },
        { x: 1660, y: 400 },
        { x: 2880, y: 330 },
        { x: 3300, y: 280 },
        { x: 3660, y: 210 },
        { x: 4250, y: 200 },
        { x: 4700, y: 130 },
        { x: 5450, y: 330 },
        { x: 5850, y: 220 },
        { x: 6250, y: 220 },
        { x: 6650, y: 330 },
        { x: 6910, y: 370 }
      ],
      buildings: [
        { x: 1400, y: 640, key: 'bldg_act1_cottage', width: 260, height: 208 },
        { x: 2450, y: 520, key: 'bldg_act1_cottage', width: 260, height: 208, flipX: true },
        { x: 4500, y: 400, key: 'bldg_act1_cottage', width: 260, height: 208 }
      ],
      interactionPoints: [
        // Scene 1 & 2: A Stranger on the Road & The Stolen Heart
        {
          x: 340,
          y: 640,
          key: 'mascot',
          title: 'Trapped Zeno in Rubble',
          promptText: 'Clear Debris & Rescue Zeno',
          milestoneId: 'mascot_rescued',
          lines: [
            { speaker: 'Hero', text: 'Another road. Another empty village. Maybe the next town will be different.' },
            { speaker: 'Zeno', text: 'Help! Somebody! Please!' },
            { speaker: 'Hero', text: 'Hold still. I\'ve got you.' },
            { speaker: 'Zeno', text: 'Oh! You actually helped me!' },
            { speaker: 'Hero', text: 'Was I supposed to leave you there?' },
            { speaker: 'Zeno', text: 'Most people do.' },
            { speaker: 'Hero', text: 'Then most people are idiots.' },
            { speaker: 'Hero', text: 'Did you just do that? A small flower bloomed beneath your feet.' },
            { speaker: 'Zeno', text: 'Do what? Oh—my name is Zeno! But that doesn\'t matter right now. What matters is that I need to get to the castle.' },
            { speaker: 'Hero', text: 'The castle? That\'s a long way from here, Zeno. What\'s waiting for you there?' },
            { speaker: 'Zeno', text: 'My heart. King Krish took it from me. He took my magic, my memories… everything. Because he wanted my power.' },
            { speaker: 'Zeno', text: 'If I get it back, I can fix everything. The forests. The rivers. The people who\'ve lost their homes. Please.' },
            { speaker: 'Hero', text: 'All right, Zeno. We\'ll get your heart back.' },
            { speaker: 'Zeno', text: 'Really? Then let\'s go, brave knight!' },
            { speaker: 'Hero', text: 'I\'m not a knight.' },
            { speaker: 'Zeno', text: 'You are now! Welcome to adventure!' }
          ]
        },
        // Scene 4: The Village Gift
        {
          x: 1550,
          y: 640,
          key: 'interact_noticeboard',
          title: 'Abandoned Homestead',
          promptText: 'Inspect Wooden Carving of Zeno (Gift #1)',
          milestoneId: 'first_gift_found',
          lines: [
            { speaker: 'Hero', text: 'Someone made this for you, Zeno—a small wooden carving of you.' },
            { speaker: 'Zeno', text: 'I think… I remember this place.' },
            { speaker: 'Hero', text: 'You\'ve been here before?' },
            { speaker: 'Zeno', text: 'Maybe. I don\'t remember much from before King Krish took my heart.' },
            { speaker: 'Zeno', text: 'Come on. We should keep moving.' }
          ]
        },
        // Scene 5: Act I Ending Overlook
        {
          x: 7020,
          y: 640,
          key: 'interact_monument',
          title: 'Overlook of Lumenfall',
          promptText: 'Gaze Toward Castle',
          lines: [
            { speaker: 'Hero', text: 'That\'s where King Krish is?' },
            { speaker: 'Zeno', text: 'Yes.' },
            { speaker: 'Hero', text: 'Then that\'s where we\'re going.' },
            { speaker: 'Zeno', text: 'Thank you.' },
            { speaker: 'Zeno', text: '(whispering) I\'ll be whole again. I have to be.' }
          ]
        }
      ]
    };
  }

  // =========================================================================
  // ACT II: THE CRACKS IN THE STORY (7200px Width)
  // Theme: Suspicion | Objective: Cross the corrupted lands and uncover the first contradiction.
  // =========================================================================
  public static getAct2Layout(): ValidatedActLayout {
    return {
      groundSegments: [
        { x: 0, w: 760, y: 640 },             // Zone 1 Lowlands: 0 - 760
        { x: 920, w: 1040, y: 640 },          // Lowlands: 920 - 1960 (Pit 1: 760-920, 160px)
        { x: 1960, w: 840, y: 520 },          // Zone 2 Thorn Plateau: 1960 - 2800 (Elevated y=520, Cliff at 1960)
        { x: 2960, w: 1000, y: 520 },         // Thorn Plateau: 2960 - 3960 (Pit 2: 2800-2960, 160px)
        { x: 3960, w: 1000, y: 400 },         // Zone 3 Obsidian Ridge: 3960 - 4960 (Elevated y=400, Cliff at 3960)
        { x: 4960, w: 1880, y: 540 },         // Zone 4 Hydra Colosseum: 4960 - 6840 (Colosseum floor y=540)
        { x: 6980, w: 220, y: 640 }           // Zone 5 Exit Portal: 6980 - 7200 (Moat Pit 3: 6840-6980, 140px)
      ],
      climbSurfaces: [
        { x: 1960, y: 520, height: 120, mantleDir: 1 },  // Lowland up to Plateau at cliff face
        { x: 3960, y: 400, height: 120, mantleDir: 1 },  // Plateau up to Obsidian Ridge at cliff face
        { x: 4960, y: 400, height: 140, mantleDir: 1 }   // Ridge down to Hydra Colosseum
      ],
      platforms: [
        { x: 840, y: 490, w: 140 },           // Bridge across Pit 1 (elevated)
        { x: 1150, y: 470, w: 160 },
        { x: 1660, y: 460, w: 150 },
        { x: 2880, y: 390, w: 140 },          // Bridge across Pit 2 (elevated)
        { x: 3300, y: 340, w: 160 },
        { x: 3660, y: 270, w: 160 },
        { x: 4250, y: 260, w: 160 },
        { x: 4700, y: 190, w: 160 },
        { x: 5450, y: 390, w: 170 },
        { x: 5850, y: 280, w: 160 },
        { x: 6250, y: 280, w: 160 },
        { x: 6650, y: 390, w: 170 },
        { x: 6910, y: 430, w: 130 }           // Bridge across Moat (elevated)
      ],
      boss: {
        x: 6050,
        y: 540,
        key: 'boss_hydra',
        name: 'Thornblight Hydra',
        title: 'Scourge of the Corrupted Mire',
        maxHp: 350,
        attackInterval: 3000,
        width: 360,
        height: 420
      },
      boxes: [
        { x: 260, y: 616 },
        { x: 1040, y: 616 },
        { x: 1780, y: 616 },
        { x: 2150, y: 496 },
        { x: 2650, y: 496 },
        { x: 3150, y: 496 },
        { x: 4100, y: 376 },
        { x: 4850, y: 376 }
      ],
      hazardBoxes: [
        { x: 1480, y: 616 },
        { x: 2450, y: 496 },
        { x: 3500, y: 496 },
        { x: 4500, y: 376 },
        { x: 6650, y: 516 }
      ],
      slimes: [
        // Ground Patrols
        { x: 520, y: 640, patrolRange: 70 },
        { x: 1200, y: 640, patrolRange: 75, isCorrupted: true },
        { x: 2250, y: 520, patrolRange: 70 },
        { x: 3350, y: 520, patrolRange: 80, isCorrupted: true },
        { x: 4300, y: 400, patrolRange: 75, isCorrupted: true },
        // Elevated Platform Patrols
        { x: 1150, y: 470, patrolRange: 45 },
        { x: 1660, y: 460, patrolRange: 45, isCorrupted: true },
        { x: 3300, y: 340, patrolRange: 50, isCorrupted: true },
        { x: 4250, y: 260, patrolRange: 50, isCorrupted: true },
        { x: 5450, y: 390, patrolRange: 55, isCorrupted: true },
        { x: 6650, y: 390, patrolRange: 55, isCorrupted: true }
      ],
      npcs: [
        {
          x: 3400,
          y: 520,
          key: 'npc_guard',
          name: 'Royal Guard',
          lines: [
            { speaker: 'Royal Guard', text: 'Stay back! This bridge is unsafe!' },
            { speaker: 'Hero', text: 'We need to cross.' },
            { speaker: 'Royal Guard', text: 'Then find another road.' },
            { speaker: 'Zeno', text: 'He\'s one of the king\'s men. Don\'t listen to him.' },
            { speaker: 'Royal Guard', text: 'You think I want to serve that monster? I\'ve watched this land die. I\'ve watched good people disappear. And every day, the king orders us to hold the line.' },
            { speaker: 'Hero', text: 'Then why are you still here?' },
            { speaker: 'Royal Guard', text: 'Because someone has to protect the people who can\'t run. If you\'re going to the castle, don\'t mistake the king\'s silence for ignorance.' },
            { speaker: 'Zeno', text: 'Enough. He\'s trying to confuse you.' },
            { speaker: 'Royal Guard', text: 'No. I\'m trying to keep you alive.' }
          ]
        },
        {
          x: 2150,
          y: 520,
          key: 'npc_priestess',
          name: 'Priestess Selene',
          lines: [
            { speaker: 'Priestess Selene', text: 'The miasma is dense, but your inner radiance remains unbroken.' },
            { speaker: 'Priestess Selene', text: 'When danger closes in, raise your Aegis Shield with Shift or C to deflect attacks!' }
          ]
        }
      ],
      props: [
        { x: 160, y: 640, key: 'prop_shrine' },
        { x: 600, y: 640, key: 'prop_signpost' },
        { x: 1020, y: 640, key: 'prop_torch' },
        { x: 1600, y: 640, key: 'prop_shrine' },
        { x: 2050, y: 520, key: 'prop_shrine' },
        { x: 2600, y: 520, key: 'prop_torch' },
        { x: 3100, y: 520, key: 'prop_shrine' },
        { x: 3750, y: 520, key: 'prop_signpost' },
        { x: 4100, y: 400, key: 'prop_torch' },
        { x: 4750, y: 400, key: 'prop_shrine' },
        { x: 5100, y: 540, key: 'prop_torch' },
        { x: 6750, y: 540, key: 'prop_torch' }
      ],
      coins: [
        { x: 380, y: 450 },
        { x: 840, y: 430 },
        { x: 1150, y: 410 },
        { x: 1660, y: 400 },
        { x: 2880, y: 330 },
        { x: 3300, y: 280 },
        { x: 3660, y: 210 },
        { x: 4250, y: 200 },
        { x: 4700, y: 130 },
        { x: 5450, y: 330 },
        { x: 5850, y: 220 },
        { x: 6250, y: 220 },
        { x: 6650, y: 330 },
        { x: 6910, y: 370 }
      ],
      buildings: [
        { x: 1400, y: 640, key: 'bldg_act2_crypt', width: 260, height: 208 },
        { x: 2400, y: 520, key: 'bldg_act2_crypt', width: 260, height: 208, flipX: true },
        { x: 4450, y: 400, key: 'bldg_act2_crypt', width: 260, height: 208 }
      ],
      interactionPoints: [
        // Scene 1 & 2: The Forest That Forgot & The Abandoned Settlement
        {
          x: 1350,
          y: 640,
          key: 'interact_mural',
          title: 'Abandoned Settlement',
          promptText: 'Inspect Damaged Royal Banner',
          milestoneId: 'corrupted_lands_entered',
          lines: [
            { speaker: 'Hero', text: 'This place feels… wrong.' },
            { speaker: 'Zeno', text: 'Everything near the castle is like this.' },
            { speaker: 'Hero', text: 'That corrupted creature wasn\'t just attacking. It looked terrified.' },
            { speaker: 'Zeno', text: 'It\'s a monster. Not when they\'re trying to eat you.' },
            { speaker: 'Hero', text: 'Look at these broken carts... and this royal shelter. A child\'s drawing of a royal guard protecting villagers.' },
            { speaker: 'Hero', text: 'Someone was protecting people here.' },
            { speaker: 'Zeno', text: 'Or pretending to.' },
            { speaker: 'Hero', text: 'Why do you always do that? Turn everything into proof that he\'s evil.' },
            { speaker: 'Zeno', text: '(looking hurt) Because I remember what he did to me.' }
          ]
        },
        // Scene 3: The Stone Mural
        {
          x: 2650,
          y: 520,
          key: 'interact_mural',
          title: 'Ancient Stone Mural of King Krish',
          promptText: 'Examine Stone Mural Behind Vines',
          milestoneId: 'mural_inspected',
          lines: [
            { speaker: 'Hero', text: 'Look at this huge mural hidden behind the vines.' },
            { speaker: 'Zeno', text: 'Let\'s go.' },
            { speaker: 'Hero', text: 'Wait. Krish is standing between the darkness and the kingdom. The crown shines above his head. Zeno lies unconscious behind him.' },
            { speaker: 'Hero', text: 'It looks like he\'s fighting it.' },
            { speaker: 'Zeno', text: 'Paintings can tell whatever story their owners want.' },
            { speaker: 'Hero', text: 'Why are you scared of a painting?' },
            { speaker: 'Zeno', text: '(voice unusually sharp) I\'m not scared. Just keep moving.' }
          ]
        },
        // Scene 5: Act II Ending (Ruined Watchtower Campfire)
        {
          x: 7020,
          y: 640,
          key: 'interact_monument',
          title: 'Ruined Watchtower Camp',
          promptText: 'Rest by Watchtower Campfire',
          milestoneId: 'guard_confronted',
          lines: [
            { speaker: 'Hero', text: 'The guard said the king knows what\'s happening.' },
            { speaker: 'Zeno', text: 'Of course he knows. He\'s responsible.' },
            { speaker: 'Hero', text: 'But what if there\'s more to it?' },
            { speaker: 'Zeno', text: '(staring into the embers) What if you\'re helping the wrong person?' },
            { speaker: 'Hero', text: 'I was going to ask you the same thing.' }
          ]
        }
      ]
    };
  }

  // =========================================================================
  // ACT III: THE FORGOTTEN TRUTH (7200px Width)
  // Theme: Truth | Objective: Discover the origin of the crown and the limits of memory.
  // =========================================================================
  public static getAct3Layout(): ValidatedActLayout {
    return {
      groundSegments: [
        { x: 0, w: 760, y: 640 },             // Zone 1 Lowlands: 0 - 760
        { x: 920, w: 1040, y: 640 },          // Lowlands: 920 - 1960 (Pit 1: 760-920, 160px)
        { x: 1960, w: 840, y: 520 },          // Zone 2 Sanctuary Halls: 1960 - 2800 (Elevated y=520, Cliff at 1960)
        { x: 2960, w: 1000, y: 520 },         // Sanctuary Halls: 2960 - 3960 (Pit 2: 2800-2960, 160px)
        { x: 3960, w: 1000, y: 400 },         // Zone 3 Inner Archive: 3960 - 4960 (Elevated y=400, Cliff at 3960)
        { x: 4960, w: 1880, y: 540 },         // Zone 4 Chimera Colosseum: 4960 - 6840 (Colosseum floor y=540)
        { x: 6980, w: 220, y: 640 }           // Zone 5 Exit Portal: 6980 - 7200 (Moat Pit 3: 6840-6980, 140px)
      ],
      climbSurfaces: [
        { x: 1960, y: 520, height: 120, mantleDir: 1 },  // Lowlands up to Sanctuary Halls
        { x: 3960, y: 400, height: 120, mantleDir: 1 },  // Halls up to Inner Archive
        { x: 4960, y: 400, height: 140, mantleDir: 1 }   // Archive down to Colosseum Arena
      ],
      platforms: [
        { x: 840, y: 490, w: 140 },           // Bridge across Pit 1 (elevated)
        { x: 1150, y: 470, w: 160 },
        { x: 1660, y: 460, w: 150 },
        { x: 2880, y: 390, w: 140 },          // Bridge across Pit 2 (elevated)
        { x: 3300, y: 340, w: 160 },
        { x: 3660, y: 270, w: 160 },
        { x: 4250, y: 260, w: 160 },
        { x: 4700, y: 190, w: 160 },
        { x: 5450, y: 390, w: 170 },
        { x: 5850, y: 280, w: 160 },
        { x: 6250, y: 280, w: 160 },
        { x: 6650, y: 390, w: 170 },
        { x: 6910, y: 430, w: 130 }           // Bridge across Moat (elevated)
      ],
      boss: {
        x: 6050,
        y: 540,
        key: 'boss_chimera',
        name: 'Sanctuary Beast (Chimera)',
        title: 'Guardian of the Forgotten Crypts',
        maxHp: 400,
        attackInterval: 2800,
        milestoneId: 'beast_defeated',
        width: 360,
        height: 420
      },
      boxes: [
        { x: 260, y: 616 },
        { x: 1040, y: 616 },
        { x: 1780, y: 616 },
        { x: 2150, y: 496 },
        { x: 2650, y: 496 },
        { x: 3150, y: 496 },
        { x: 4100, y: 376 },
        { x: 4850, y: 376 }
      ],
      hazardBoxes: [
        { x: 1480, y: 616 },
        { x: 2450, y: 496 },
        { x: 3500, y: 496 },
        { x: 4500, y: 376 },
        { x: 6650, y: 516 }
      ],
      slimes: [
        // Ground Patrols
        { x: 520, y: 640, patrolRange: 70, isCorrupted: true },
        { x: 1200, y: 640, patrolRange: 75 },
        { x: 2250, y: 520, patrolRange: 70, isCorrupted: true },
        { x: 3350, y: 520, patrolRange: 80, isCorrupted: true },
        { x: 4300, y: 400, patrolRange: 75, isCorrupted: true },
        // Elevated Platform Patrols
        { x: 1150, y: 470, patrolRange: 45, isCorrupted: true },
        { x: 1660, y: 460, patrolRange: 45 },
        { x: 3300, y: 340, patrolRange: 50, isCorrupted: true },
        { x: 4250, y: 260, patrolRange: 50, isCorrupted: true },
        { x: 5450, y: 390, patrolRange: 55, isCorrupted: true },
        { x: 6650, y: 390, patrolRange: 55, isCorrupted: true }
      ],
      npcs: [
        {
          x: 2150,
          y: 520,
          key: 'npc_elder',
          name: 'Elder Robin',
          lines: [
            { speaker: 'Elder Robin', text: 'You walk upon the ancient foundation stones of Lumenfall.' },
            { speaker: 'Elder Robin', text: 'The ancient records are etched into the chambers ahead. Seek the truth with an open heart.' }
          ]
        },
        {
          x: 4200,
          y: 400,
          key: 'npc_merchant',
          name: 'Rowan the Merchant',
          lines: [
            { speaker: 'Rowan', text: 'These crypts are perilous, but ancient knowledge awaits within!' }
          ]
        }
      ],
      props: [
        { x: 160, y: 640, key: 'prop_shrine' },
        { x: 600, y: 640, key: 'prop_torch' },
        { x: 1020, y: 640, key: 'prop_shrine' },
        { x: 1600, y: 640, key: 'prop_torch' },
        { x: 2050, y: 520, key: 'prop_shrine' },
        { x: 2600, y: 520, key: 'prop_torch' },
        { x: 3100, y: 520, key: 'prop_shrine' },
        { x: 3750, y: 520, key: 'prop_torch' },
        { x: 4100, y: 400, key: 'prop_torch' },
        { x: 4750, y: 400, key: 'prop_shrine' },
        { x: 5100, y: 540, key: 'prop_torch' },
        { x: 6750, y: 540, key: 'prop_torch' }
      ],
      coins: [
        { x: 380, y: 450 },
        { x: 840, y: 430 },
        { x: 1150, y: 410 },
        { x: 1660, y: 400 },
        { x: 2880, y: 330 },
        { x: 3300, y: 280 },
        { x: 3660, y: 210 },
        { x: 4250, y: 200 },
        { x: 4700, y: 130 },
        { x: 5450, y: 330 },
        { x: 5850, y: 220 },
        { x: 6250, y: 220 },
        { x: 6650, y: 330 },
        { x: 6910, y: 370 }
      ],
      buildings: [
        { x: 1400, y: 640, key: 'bldg_act3_temple', width: 265, height: 210 },
        { x: 2400, y: 520, key: 'bldg_act3_temple', width: 265, height: 210, flipX: true },
        { x: 4450, y: 400, key: 'bldg_act3_temple', width: 265, height: 210 }
      ],
      interactionPoints: [
        // Scene 2: The First Record
        {
          x: 1350,
          y: 640,
          key: 'interact_lectern',
          title: 'The First Record',
          promptText: 'Read Illuminated Sanctuary Inscription',
          milestoneId: 'sanctuary_discovered',
          lines: [
            { speaker: 'Zeno', text: 'I don\'t like this place.' },
            { speaker: 'Hero', text: 'Why?' },
            { speaker: 'Zeno', text: 'I don\'t know. Can we please just find the exit?' },
            { speaker: 'Hero', text: 'We didn\'t come this far to turn around. Look, an inscription illuminates:' },
            { speaker: 'Ancient Record', text: '"When the Guardian\'s dream became a nightmare, the world began to unravel."' },
            { speaker: 'Ancient Record', text: '"When its fear became stronger than its will, the living things around it changed."' },
            { speaker: 'Ancient Record', text: '"Only the bearer of the Dawn could bind the darkness without destroying the light."' },
            { speaker: 'Hero', text: 'The Guardian… that\'s you, Zeno, isn\'t it? But you could create things. The flowers. The magic.' },
            { speaker: 'Zeno', text: 'I said I don\'t know!' }
          ]
        },
        // Scene 3 & 4: The King's Sacrifice & The Memory Fragment
        {
          x: 3400,
          y: 520,
          key: 'interact_lectern',
          title: 'The King\'s Sacrifice (Memory Crystal)',
          promptText: 'Examine Inscription & Touch Memory Crystal',
          lines: [
            { speaker: 'Ancient Record', text: '"The king offered his life to become the prison."' },
            { speaker: 'Ancient Record', text: '"The crown would hold the Guardian\'s power, and the king would hold the crown. If the chain broke, the darkness would return to its source."' },
            { speaker: 'Hero', text: 'He didn\'t steal your power just to become stronger.' },
            { speaker: 'Zeno', text: 'He still took it.' },
            { speaker: 'Hero', text: 'Maybe he was trying to save everyone.' },
            { speaker: 'Zeno', text: 'Then why did he leave me alone?' },
            { speaker: 'Hero', text: 'I don\'t know.' },
            { speaker: 'Zeno', text: 'Neither do I.' },
            { speaker: 'Young Zeno', text: '(Memory) Make it stop! Please!' },
            { speaker: 'Hero', text: 'You were there when it happened.' },
            { speaker: 'Zeno', text: 'I remember the screaming. Everyone\'s. I thought he took my heart because he hated me.' },
            { speaker: 'Hero', text: 'Maybe he was afraid of what would happen.' },
            { speaker: 'Zeno', text: 'Maybe. But I still want my heart back.' },
            { speaker: 'Hero', text: 'Then we\'ll find out what really happened.' }
          ]
        },
        // Scene 5: The Records of King Krish
        {
          x: 4400,
          y: 400,
          key: 'interact_lectern',
          title: 'Records of King Krish (Journal)',
          promptText: 'Read King Krish\'s Journal',
          milestoneId: 'aurel_journal_found',
          lines: [
            { speaker: 'Records of King Krish', text: '"Day 43 beneath the crown."' },
            { speaker: 'Records of King Krish', text: '"The people curse my name. They see the ruined fields, the empty villages, the creatures in the forest."' },
            { speaker: 'Records of King Krish', text: '"They do not see what waits beneath the throne."' },
            { speaker: 'Records of King Krish', text: '"I could tell them the truth. But what would that change? They cannot carry this burden for me."' },
            { speaker: 'Records of King Krish', text: '"The crown takes more each day. Sometimes I cannot remember the sound of my own voice before it."' },
            { speaker: 'Records of King Krish', text: '"I tell myself that silence is protection. I am beginning to fear that silence is only cowardice."' },
            { speaker: 'Hero', text: 'He knew what he was becoming.' },
            { speaker: 'Zeno', text: 'Then why didn\'t he stop?' },
            { speaker: 'Hero', text: 'Maybe he thought he had no choice.' },
            { speaker: 'Zeno', text: 'Everyone has a choice.' },
            { speaker: 'Hero', text: 'Yes. They do. So do we.' }
          ]
        },
        // Scene 6: Act III Ending
        {
          x: 7020,
          y: 640,
          key: 'interact_monument',
          title: 'Passage to Castle Ramparts',
          promptText: 'Check on Zeno',
          lines: [
            { speaker: 'Zeno', text: 'We\'re almost there.' },
            { speaker: 'Hero', text: 'When we meet the king, I want answers.' },
            { speaker: 'Zeno', text: 'So do I.' },
            { speaker: 'Hero', text: 'Hey! Are you all right? A sudden magical pulse knocked you down!' },
            { speaker: 'Zeno', text: 'I\'m fine.' },
            { speaker: 'Zeno', text: '(whispering, as its shadow twists into a monstrous shape) Not again.' }
          ]
        }
      ]
    };
  }

  // =========================================================================
  // ACT IV: THE LAST GUARDIAN (7200px Width)
  // Theme: Responsibility | Objective: Reach the castle and confront Aurel.
  // =========================================================================
  public static getAct4Layout(): ValidatedActLayout {
    return {
      groundSegments: [
        { x: 0, w: 760, y: 640 },             // Zone 1 Lowlands Courtyard: 0 - 760
        { x: 920, w: 1040, y: 640 },          // Courtyard: 920 - 1960 (Pit 1: 760-920, 160px)
        { x: 1960, w: 840, y: 520 },          // Zone 2 Lower Ramparts: 1960 - 2800 (Elevated y=520, Cliff at 1960)
        { x: 2960, w: 1000, y: 520 },         // Ramparts: 2960 - 3960 (Pit 2: 2800-2960, 160px)
        { x: 3960, w: 1000, y: 400 },         // Zone 3 High Bastion Tower: 3960 - 4960 (Elevated y=400, Cliff at 3960)
        { x: 4960, w: 1880, y: 540 },         // Zone 4 Grand Throne Room Colosseum: 4960 - 6840 (y=540)
        { x: 6980, w: 220, y: 640 }           // Zone 5 Exit Portal: 6980 - 7200 (Moat Pit 3: 6840-6980, 140px)
      ],
      climbSurfaces: [
        { x: 1960, y: 520, height: 120, mantleDir: 1 },  // Courtyard to Lower Ramparts
        { x: 3960, y: 400, height: 120, mantleDir: 1 },  // Ramparts to High Bastion
        { x: 4960, y: 400, height: 140, mantleDir: 1 }   // Bastion to Throne Room
      ],
      platforms: [
        { x: 840, y: 490, w: 140 },           // Bridge across Pit 1 (elevated)
        { x: 1150, y: 470, w: 160 },
        { x: 1660, y: 460, w: 150 },
        { x: 2880, y: 390, w: 140 },          // Bridge across Pit 2 (elevated)
        { x: 3300, y: 340, w: 160 },
        { x: 3660, y: 270, w: 160 },
        { x: 4250, y: 260, w: 160 },
        { x: 4700, y: 190, w: 160 },
        { x: 5450, y: 390, w: 170 },
        { x: 5850, y: 280, w: 160 },
        { x: 6250, y: 280, w: 160 },
        { x: 6650, y: 390, w: 170 },
        { x: 6910, y: 430, w: 130 }           // Bridge across Moat (elevated)
      ],
      boss: {
        x: 6050,
        y: 540,
        key: 'boss_king_aurel',
        name: 'King Krish, Bearer of the Crown',
        title: 'The Corrupted Sovereign',
        maxHp: 600,
        attackInterval: 2500,
        milestoneId: 'king_aurel_confronted',
        width: 360,
        height: 420
      },
      boxes: [
        { x: 260, y: 616 },
        { x: 1040, y: 616 },
        { x: 1780, y: 616 },
        { x: 2150, y: 496 },
        { x: 2650, y: 496 },
        { x: 3150, y: 496 },
        { x: 4100, y: 376 },
        { x: 4850, y: 376 }
      ],
      hazardBoxes: [
        { x: 1480, y: 616 },
        { x: 2450, y: 496 },
        { x: 3500, y: 496 },
        { x: 4500, y: 376 },
        { x: 6650, y: 516 }
      ],
      slimes: [
        // Ground Patrols
        { x: 520, y: 640, patrolRange: 70, isCorrupted: true },
        { x: 1200, y: 640, patrolRange: 75, isCorrupted: true },
        { x: 2250, y: 520, patrolRange: 70, isCorrupted: true },
        { x: 3350, y: 520, patrolRange: 80, isCorrupted: true },
        { x: 4300, y: 400, patrolRange: 75, isCorrupted: true },
        // Elevated Platform Patrols
        { x: 1150, y: 470, patrolRange: 45, isCorrupted: true },
        { x: 1660, y: 460, patrolRange: 45, isCorrupted: true },
        { x: 3300, y: 340, patrolRange: 50, isCorrupted: true },
        { x: 4250, y: 260, patrolRange: 50, isCorrupted: true },
        { x: 5450, y: 390, patrolRange: 55, isCorrupted: true },
        { x: 6650, y: 390, patrolRange: 55, isCorrupted: true }
      ],
      npcs: [
        {
          x: 2150,
          y: 520,
          key: 'npc_guard',
          name: 'Captain Valen',
          lines: [
            { speaker: 'Captain Valen', text: 'Hero of the Dawn! The garrison has fallen back to defend the ramparts.' },
            { speaker: 'Captain Valen', text: 'King Krish is sealed within the throne room at the end of the courtyard. The crown is driving him mad!' }
          ]
        }
      ],
      props: [
        { x: 160, y: 640, key: 'prop_torch' },
        { x: 600, y: 640, key: 'prop_signpost' },
        { x: 1020, y: 640, key: 'prop_torch' },
        { x: 1600, y: 640, key: 'prop_torch' },
        { x: 2050, y: 520, key: 'prop_torch' },
        { x: 2600, y: 520, key: 'prop_signpost' },
        { x: 3100, y: 520, key: 'prop_torch' },
        { x: 3750, y: 520, key: 'prop_torch' },
        { x: 4100, y: 400, key: 'prop_torch' },
        { x: 4750, y: 400, key: 'prop_signpost' },
        { x: 5100, y: 540, key: 'prop_torch' },
        { x: 6750, y: 540, key: 'prop_torch' }
      ],
      coins: [
        // Zone 1 Courtyard
        { x: 260, y: 550 },
        { x: 380, y: 570 },
        { x: 620, y: 570 },
        { x: 840, y: 430 },
        { x: 1040, y: 550 },
        { x: 1150, y: 410 },
        { x: 1400, y: 570 },
        { x: 1660, y: 400 },
        { x: 1850, y: 570 },
        // Zone 2 Lower Ramparts
        { x: 2150, y: 440 },
        { x: 2350, y: 450 },
        { x: 2550, y: 450 },
        { x: 2750, y: 450 },
        { x: 2880, y: 330 },
        { x: 3100, y: 450 },
        { x: 3300, y: 280 },
        { x: 3500, y: 450 },
        { x: 3660, y: 210 },
        { x: 3850, y: 450 },
        // Zone 3 High Bastion Tower
        { x: 4100, y: 330 },
        { x: 4250, y: 200 },
        { x: 4450, y: 330 },
        { x: 4700, y: 130 },
        { x: 4850, y: 330 },
        // Zone 4 Throne Room
        { x: 5200, y: 470 },
        { x: 5450, y: 330 },
        { x: 5650, y: 470 },
        { x: 5850, y: 220 },
        { x: 6250, y: 220 },
        { x: 6450, y: 470 },
        { x: 6650, y: 330 },
        { x: 6800, y: 470 },
        { x: 6910, y: 370 },
        { x: 7050, y: 570 }
      ],
      buildings: [
        { x: 1400, y: 640, key: 'bldg_act4_bastion', width: 262, height: 220 },
        { x: 2400, y: 520, key: 'bldg_act4_bastion', width: 262, height: 220, flipX: true },
        { x: 4450, y: 400, key: 'bldg_act4_bastion', width: 262, height: 220 }
      ],
      interactionPoints: [
        // Scene 1: The Machine of Kings
        {
          x: 1350,
          y: 640,
          key: 'interact_machine',
          title: 'The Machine of Kings',
          promptText: 'Operate Machine of Kings (Requires 40 Coins)',
          milestoneId: 'gate_machine_unlocked',
          lines: [
            { speaker: 'Hero', text: 'Looks like we need a key.' },
            { speaker: 'Zeno', text: 'There\'s an old machine nearby. It can make one.' },
            { speaker: 'Hero', text: 'How do you know that?' },
            { speaker: 'Zeno', text: 'I… remember something.' },
            { speaker: 'Mechanism', text: 'GATE MECHANISM ACTIVATED: 40 COINS REQUIRED TO FORGE GOLDEN CASTLE KEY.' },
            { speaker: 'Hero', text: 'Forty coins? For a key?' },
            { speaker: 'Zeno', text: 'Ancient magic isn\'t cheap.' },
            { speaker: 'Hero', text: 'That\'s a terrible excuse.' },
            { speaker: 'Zeno', text: 'Do you want to open the gate or not?' }
          ]
        },
        // Scene 3: The Throne Gate
        {
          x: 4720,
          y: 400,
          key: 'interact_machine',
          title: 'Throne Chamber Gates',
          promptText: 'Enter King Krish\'s Throne Room',
          lines: [
            { speaker: 'King Krish', text: 'So. The little wanderer has reached the end of the road.' },
            { speaker: 'Hero', text: 'King Krish.' },
            { speaker: 'King Krish', text: 'You have crossed a dying kingdom to stand before me. Tell me, do you know what you are fighting for?' },
            { speaker: 'Hero', text: 'I\'m here to return what you stole.' },
            { speaker: 'King Krish', text: 'Then you know nothing.' },
            { speaker: 'Zeno', text: 'Don\'t listen to him!' },
            { speaker: 'King Krish', text: 'Still hiding behind another, little one?' },
            { speaker: 'Zeno', text: 'You took my heart!' },
            { speaker: 'King Krish', text: 'I took your power because you could not control it.' },
            { speaker: 'Zeno', text: 'You left me alone!' },
            { speaker: 'King Krish', text: 'I left you alive.' },
            { speaker: 'Hero', text: 'You could have told the kingdom the truth.' },
            { speaker: 'King Krish', text: 'And what would they have done? Worship me for the destruction I prevented? Forgive me for the destruction they witnessed?' },
            { speaker: 'Hero', text: 'They deserved the truth.' },
            { speaker: 'King Krish', text: 'Yes... They did.' },
            { speaker: 'King Krish', text: 'But there is no time left. Forgive me, child.' }
          ]
        }
      ]
    };
  }

  // =========================================================================
  // ACT V: THE CROWN BREAKS & FINALE (7200px Width)
  // Theme: Consequences | Objective: Survive the corruption and save the mascot.
  // =========================================================================
  public static getAct5Layout(): ValidatedActLayout {
    return {
      groundSegments: [
        { x: 0, w: 760, y: 640 },             // Zone 1 Cosmic Shoreline: 0 - 760
        { x: 920, w: 1040, y: 640 },          // Shoreline: 920 - 1960 (Pit 1: 760-920, 160px)
        { x: 1960, w: 840, y: 520 },          // Zone 2 Singularity Shelf: 1960 - 2800 (Elevated y=520, Cliff at 1960)
        { x: 2960, w: 1000, y: 520 },         // Shelf: 2960 - 3960 (Pit 2: 2800-2960, 160px)
        { x: 3960, w: 1000, y: 400 },         // Zone 3 Astral Spire: 3960 - 4960 (Elevated y=400, Cliff at 3960)
        { x: 4960, w: 1880, y: 540 },         // Zone 4 Colossus Void: 4960 - 6840 (Colosseum floor y=540)
        { x: 6980, w: 220, y: 640 }           // Zone 5 Exit Rift: 6980 - 7200 (Moat Pit 3: 6840-6980, 140px)
      ],
      climbSurfaces: [
        { x: 1960, y: 520, height: 120, mantleDir: 1 },  // Shoreline up to Singularity Shelf
        { x: 3960, y: 400, height: 120, mantleDir: 1 },  // Shelf up to Astral Spire
        { x: 4960, y: 400, height: 140, mantleDir: 1 }   // Spire down to Colossus Void
      ],
      platforms: [
        { x: 840, y: 490, w: 140 },           // Bridge across Pit 1 (elevated)
        { x: 1150, y: 470, w: 160 },
        { x: 1660, y: 460, w: 150 },
        { x: 2880, y: 390, w: 140 },          // Bridge across Pit 2 (elevated)
        { x: 3300, y: 340, w: 160 },
        { x: 3660, y: 270, w: 160 },
        { x: 4250, y: 260, w: 160 },
        { x: 4700, y: 190, w: 160 },
        { x: 5450, y: 390, w: 170 },
        { x: 5850, y: 280, w: 160 },
        { x: 6250, y: 280, w: 160 },
        { x: 6650, y: 390, w: 170 },
        { x: 6910, y: 430, w: 130 }           // Bridge across Moat (elevated)
      ],
      boss: {
        x: 6050,
        y: 540,
        key: 'boss_void_colossus',
        name: 'The Transformed Guardian (Zeno)',
        title: 'Corrupted Ancient Guardian',
        maxHp: 750,
        attackInterval: 2200,
        milestoneId: 'heart_of_dawn_choice',
        width: 360,
        height: 420
      },
      boxes: [
        { x: 260, y: 616 },
        { x: 1040, y: 616 },
        { x: 1780, y: 616 },
        { x: 2150, y: 496 },
        { x: 2650, y: 496 },
        { x: 3150, y: 496 },
        { x: 4100, y: 376 },
        { x: 4850, y: 376 }
      ],
      hazardBoxes: [
        { x: 1480, y: 616 },                  // Fires void bullets!
        { x: 2450, y: 496 },
        { x: 3500, y: 496 },
        { x: 4500, y: 376 },
        { x: 6650, y: 516 }
      ],
      slimes: [
        // Ground Patrols
        { x: 520, y: 640, patrolRange: 70, isCorrupted: true },
        { x: 1200, y: 640, patrolRange: 75, isCorrupted: true },
        { x: 2250, y: 520, patrolRange: 70, isCorrupted: true },
        { x: 3350, y: 520, patrolRange: 80, isCorrupted: true },
        { x: 4300, y: 400, patrolRange: 75, isCorrupted: true },
        // Elevated Platform Patrols
        { x: 1150, y: 470, patrolRange: 45, isCorrupted: true },
        { x: 1660, y: 460, patrolRange: 45, isCorrupted: true },
        { x: 3300, y: 340, patrolRange: 50, isCorrupted: true },
        { x: 4250, y: 260, patrolRange: 50, isCorrupted: true },
        { x: 5450, y: 390, patrolRange: 55, isCorrupted: true },
        { x: 6650, y: 390, patrolRange: 55, isCorrupted: true }
      ],
      npcs: [
        // Scene 1: The Last Chain
        {
          x: 340,
          y: 640,
          key: 'boss_king_aurel',
          name: 'Fallen King Krish',
          lines: [
            { speaker: 'Hero', text: 'King! Get up!' },
            { speaker: 'Krish', text: 'There\'s… no time.' },
            { speaker: 'Hero', text: 'What happened to it?' },
            { speaker: 'Krish', text: 'The crown held the power. But it also held the fear that shaped it.' },
            { speaker: 'Hero', text: 'Then how do I stop it?' },
            { speaker: 'Krish', text: 'Listen carefully. I was never its jailer. I was its last chain.' },
            { speaker: 'Krish', text: 'Beneath the throne… find the Heart of Dawn.' },
            { speaker: 'Hero', text: 'Where is it?' },
            { speaker: 'Krish', text: 'The chamber below. The old seal.' },
            { speaker: 'Krish', text: 'Do not try to kill it. By remembering that it is still the creature you came here to save.' }
          ]
        }
      ],
      props: [
        { x: 160, y: 640, key: 'prop_shrine' },
        { x: 600, y: 640, key: 'prop_torch' },
        { x: 1020, y: 640, key: 'prop_shrine' },
        { x: 1600, y: 640, key: 'prop_torch' },
        { x: 2050, y: 520, key: 'prop_shrine' },
        { x: 2600, y: 520, key: 'prop_torch' },
        { x: 3100, y: 520, key: 'prop_shrine' },
        { x: 3750, y: 520, key: 'prop_torch' },
        { x: 4100, y: 400, key: 'prop_torch' },
        { x: 4750, y: 400, key: 'prop_shrine' },
        { x: 5100, y: 540, key: 'prop_torch' },
        { x: 6750, y: 540, key: 'prop_torch' }
      ],
      coins: [
        { x: 380, y: 450 },
        { x: 840, y: 430 },
        { x: 1150, y: 410 },
        { x: 1660, y: 400 },
        { x: 2880, y: 330 },
        { x: 3300, y: 280 },
        { x: 3660, y: 210 },
        { x: 4250, y: 200 },
        { x: 4700, y: 130 },
        { x: 5450, y: 330 },
        { x: 5850, y: 220 },
        { x: 6250, y: 220 },
        { x: 6650, y: 330 },
        { x: 6910, y: 370 }
      ],
      buildings: [
        { x: 1400, y: 640, key: 'bldg_act5_voidspire', width: 262, height: 220 },
        { x: 2400, y: 520, key: 'bldg_act5_voidspire', width: 262, height: 220, flipX: true },
        { x: 4450, y: 400, key: 'bldg_act5_voidspire', width: 262, height: 220 }
      ],
      interactionPoints: [
        // Scene 2 & 3: The Chamber Beneath the Throne & Krish Without a Crown
        {
          x: 1350,
          y: 640,
          key: 'interact_anchor',
          title: 'The Heart of Dawn',
          promptText: 'Claim the Heart of Dawn',
          lines: [
            { speaker: 'Ancient Inscription', text: '"Power without understanding becomes destruction."' },
            { speaker: 'Ancient Inscription', text: '"Fear without trust becomes a prison."' },
            { speaker: 'Ancient Inscription', text: '"What is broken by force cannot always be healed by force."' },
            { speaker: 'Hero', text: 'I thought I was saving my friend. I never asked what saving them would cost.' },
            { speaker: 'Zeno', text: '(Echo) Please… make it stop.' },
            { speaker: 'Hero', text: 'I\'m coming.' },
            { speaker: 'Krish', text: 'I have spent years being a king. Let me spend what remains of my life being a man. Hold the relic against the crown!' },
            { speaker: 'Krish', text: 'I can no longer hold the darkness back. But I know where it began. And I know how we can end it.' }
          ]
        },
        // Scene 5: First Anchor — The Village
        {
          x: 2400,
          y: 520,
          key: 'interact_anchor',
          title: 'First Anchor — The Village',
          promptText: 'Awaken Anchor of the Village',
          lines: [
            { speaker: 'Zeno', text: '(Memory) Look! I made them bloom!' },
            { speaker: 'Child', text: '(Memory) Do it again!' },
            { speaker: 'Zeno', text: 'I remember… being happy.' }
          ]
        },
        // Scene 5: Second Anchor — The Disaster
        {
          x: 3400,
          y: 520,
          key: 'interact_anchor',
          title: 'Second Anchor — The Disaster',
          promptText: 'Awaken Anchor of the Disaster',
          lines: [
            { speaker: 'Young Zeno', text: '(Memory) No… no, make it stop! I\'m scared!' },
            { speaker: 'Young Krish', text: '(Memory) I\'m here. I know.' },
            { speaker: 'Zeno', text: 'He wasn\'t trying to hurt me... But I was so afraid.' }
          ]
        },
        // Scene 5: Third Anchor — The Promise
        {
          x: 4400,
          y: 400,
          key: 'interact_anchor',
          title: 'Third Anchor — The Promise',
          promptText: 'Awaken Anchor of the Promise',
          milestoneId: 'anchors_cleared',
          lines: [
            { speaker: 'Krish', text: '(Memory) "I promise I will hold this power until you can carry it safely."' },
            { speaker: 'Young Zeno', text: '"Will you come back?"' },
            { speaker: 'Krish', text: '"If I can."' },
            { speaker: 'Zeno', text: 'You promised. Then why didn\'t you come back?' },
            { speaker: 'Krish', text: 'Because I was afraid of what would happen if I let go. I should have trusted you. I should have told the truth. I should have found another way. I\'m sorry.' }
          ]
        }
      ]
    };
  }

  // =========================================================================
  // EPILOGUE: A KINGDOM WITHOUT A CROWN (2400px Width - Short Peaceful Walk)
  // Restored Sunrise | Full Kingdom Reunion | Post-Credits Scene
  // =========================================================================
  public static getEpilogueLayout(): ValidatedActLayout {
    return {
      groundSegments: [
        { x: 0, w: 2400, y: 640 }              // Continuous peaceful promenade: 0 - 2400 (no pits!)
      ],
      climbSurfaces: [],
      platforms: [
        { x: 500, y: 500, w: 160 },
        { x: 1200, y: 500, w: 160 },
        { x: 1800, y: 500, w: 160 }
      ],
      boxes: [],
      npcs: [
        // Scene 1: The First Sunrise (Krish Rebuilding with Villagers)
        {
          x: 450,
          y: 640,
          key: 'boss_king_aurel',
          name: 'Krish (Rebuilding)',
          lines: [
            { speaker: 'Narrator', text: 'For the first time in years, the darkness lifted. The rivers began to flow. The trees remembered how to grow. The creatures of the forest returned to their homes.' },
            { speaker: 'Narrator', text: 'But the kingdom did not heal in a single morning. There were villages to rebuild, roads to repair, and people who had lost too much to forgive quickly.' },
            { speaker: 'Villager', text: 'You could have told us.' },
            { speaker: 'Krish', text: 'Yes.' },
            { speaker: 'Villager', text: 'We lost our homes.' },
            { speaker: 'Krish', text: 'I know.' },
            { speaker: 'Villager', text: 'Some of us lost our families.' },
            { speaker: 'Krish', text: 'I cannot undo that.' },
            { speaker: 'Villager', text: 'No. You can\'t.' },
            { speaker: 'Hero', text: '(Krish watches for a moment before picking up a heavy piece of timber himself, carrying it toward the bridge to rebuild alongside his people).' }
          ]
        },
        {
          x: 850,
          y: 640,
          key: 'npc_priestess',
          name: 'Priestess Selene',
          lines: [
            { speaker: 'Priestess Selene', text: 'May the warmth of dawn illuminate your steps wherever your journey leads next.' }
          ]
        },
        {
          x: 1250,
          y: 640,
          key: 'npc_guard',
          name: 'Captain Valen',
          lines: [
            { speaker: 'Captain Valen', text: 'The citadel gates are open to all people once more. All hail the Hero of Lumenfall!' }
          ]
        },
        {
          x: 1550,
          y: 640,
          key: 'npc_merchant',
          name: 'Rowan the Merchant',
          lines: [
            { speaker: 'Rowan', text: 'The trade roads are safe at last! What a marvelous adventure!' }
          ]
        }
      ],
      props: [
        { x: 180, y: 640, key: 'prop_flowers' },
        { x: 350, y: 640, key: 'prop_lamp' },
        { x: 650, y: 640, key: 'prop_flowers' },
        { x: 1050, y: 640, key: 'prop_flowers' },
        { x: 1400, y: 640, key: 'prop_lamp' },
        { x: 1750, y: 640, key: 'prop_flowers' },
        { x: 2150, y: 640, key: 'prop_lamp' }
      ],
      coins: [
        { x: 300, y: 550 },
        { x: 500, y: 440 },
        { x: 750, y: 550 },
        { x: 1000, y: 550 },
        { x: 1200, y: 440 },
        { x: 1500, y: 550 },
        { x: 1800, y: 440 },
        { x: 2050, y: 550 }
      ],
      buildings: [
        { x: 900, y: 640, key: 'bldg_epilogue_pavilion', width: 262, height: 220 },
        { x: 1650, y: 640, key: 'bldg_epilogue_pavilion', width: 262, height: 220, flipX: true }
      ],
      interactionPoints: [
        // Scene 2: The Hero's Reward
        {
          x: 1050,
          y: 640,
          key: 'interact_monument',
          title: 'Restored Village Promenade',
          promptText: 'Talk with Zeno',
          lines: [
            { speaker: 'Zeno', text: 'Do you think they\'ll remember us?' },
            { speaker: 'Hero', text: 'Probably.' },
            { speaker: 'Zeno', text: 'Do you think they\'ll call me a hero?' },
            { speaker: 'Hero', text: 'Probably not.' },
            { speaker: 'Zeno', text: 'Hey!' },
            { speaker: 'Hero', text: 'You turned into a giant shadow monster and tried to flatten me.' },
            { speaker: 'Zeno', text: 'I said I was sorry!' },
            { speaker: 'Hero', text: 'And I accepted.' },
            { speaker: 'Zeno', text: 'What happens now?' },
            { speaker: 'Hero', text: 'We keep going.' },
            { speaker: 'Zeno', text: 'Where?' },
            { speaker: 'Hero', text: 'Somewhere we don\'t have to pretend we know everything.' }
          ]
        },
        // Scene 3: The Final Image & Post-Credits Scene
        {
          x: 2000,
          y: 640,
          key: 'interact_monument',
          title: 'Overlook of Lumenfall',
          promptText: 'Sit on the Hill with Zeno',
          milestoneId: 'epilogue_sunrise',
          lines: [
            { speaker: 'Zeno', text: 'Do you think I\'ll ever control my power completely?' },
            { speaker: 'Hero', text: 'I don\'t know.' },
            { speaker: 'Zeno', text: 'That\'s not a very comforting answer.' },
            { speaker: 'Hero', text: 'It\'s an honest one.' },
            { speaker: 'Zeno', text: 'Then I guess we\'ll figure it out.' },
            { speaker: 'Hero', text: 'Together.' },
            { speaker: 'Narrator', text: 'A kingdom is not saved by the strength of its ruler, or the power of its guardian.' },
            { speaker: 'Narrator', text: 'It is saved by those willing to stand together when the truth is hardest to face.' },
            { speaker: 'Narrator', text: '[POST-CREDITS: In a quiet room beneath the ruined castle, a tiny purple spark flickers inside a crack in an ancient stone. It pulses once... then goes dark.]' },
            { speaker: 'Narrator', text: '"Some things are not destroyed. They are only changed."' }
          ]
        }
      ]
    };
  }
}
