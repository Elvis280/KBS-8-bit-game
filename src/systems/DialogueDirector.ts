import { sound } from '../audio/SoundSynth';

export interface DialogueLine {
  speaker: string;
  portrait?: string;
  text: string;
  choices?: { text: string; onSelect: () => void }[];
}

export class DialogueDirector {
  private overlayEl: HTMLElement | null = null;
  private canvasContainer: HTMLElement | null = null;
  private portraitEl: HTMLImageElement | null = null;
  private speakerEl: HTMLElement | null = null;
  private textEl: HTMLElement | null = null;
  private choicesEl: HTMLElement | null = null;
  private queue: DialogueLine[] = [];
  private currentLine: DialogueLine | null = null;
  private isTyping: boolean = false;
  private typeTimer: any = null;
  private fullText: string = '';
  private displayedIndex: number = 0;
  private onCompleteCallback: (() => void) | null = null;

  public isActive: boolean = false;

  constructor() {
    this.overlayEl = document.getElementById('dialogue-overlay');
    this.canvasContainer = document.getElementById('canvas-container');
    this.portraitEl = document.getElementById('dialogue-portrait') as HTMLImageElement;
    this.speakerEl = document.getElementById('speaker-name');
    this.textEl = document.getElementById('dialogue-text');
    this.choicesEl = document.getElementById('dialogue-choices');

    const skipBtn = document.getElementById('btn-skip-dialogue');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipAll());
    }

    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      if (e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.advance();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.skipAll();
      }
    });

    if (this.overlayEl) {
      this.overlayEl.addEventListener('click', (e) => {
        // If clicking choice button, let choice handler fire
        if ((e.target as HTMLElement).classList.contains('choice-btn')) return;
        this.advance();
      });
    }
  }

  public playCutscene(lines: DialogueLine[], onComplete?: () => void) {
    this.queue = [...lines];
    this.onCompleteCallback = onComplete || null;
    this.isActive = true;

    if (this.canvasContainer) {
      this.canvasContainer.classList.add('cinematic-mode');
    }
    if (this.overlayEl) {
      this.overlayEl.classList.remove('hidden');
    }

    this.nextLine();
  }

  public advance() {
    if (!this.isActive) return;

    if (this.isTyping) {
      // Fast forward to end of current line
      this.finishTypewriter();
    } else if (this.currentLine && this.currentLine.choices && this.currentLine.choices.length > 0) {
      // Waiting on player choice
      return;
    } else {
      this.nextLine();
    }
  }

  public skipAll() {
    if (!this.isActive) return;
    if (this.typeTimer) clearInterval(this.typeTimer);
    this.queue = [];
    this.endCutscene();
  }

  private nextLine() {
    if (this.queue.length === 0) {
      this.endCutscene();
      return;
    }

    this.currentLine = this.queue.shift()!;
    this.fullText = this.currentLine.text;
    this.displayedIndex = 0;

    // Speaker Name
    if (this.speakerEl) {
      this.speakerEl.textContent = this.currentLine.speaker;
      this.speakerEl.style.color = this.getSpeakerColor(this.currentLine.speaker);
    }

    // Portrait
    if (this.portraitEl) {
      const portraitPath = this.currentLine.portrait || this.getDefaultPortrait(this.currentLine.speaker);
      if (portraitPath) {
        this.portraitEl.src = portraitPath;
        this.portraitEl.parentElement?.classList.remove('hidden');
      } else {
        this.portraitEl.parentElement?.classList.add('hidden');
      }
    }

    // Choices hide
    if (this.choicesEl) {
      this.choicesEl.innerHTML = '';
      this.choicesEl.classList.add('hidden');
    }

    // Start Typewriter
    if (this.textEl) {
      this.textEl.textContent = '';
    }
    this.isTyping = true;
    if (this.typeTimer) clearInterval(this.typeTimer);

    this.typeTimer = setInterval(() => {
      this.displayedIndex++;
      if (this.textEl) {
        this.textEl.textContent = this.fullText.slice(0, this.displayedIndex);
      }
      if (this.displayedIndex % 2 === 0) {
        sound.playTypewriter();
      }

      if (this.displayedIndex >= this.fullText.length) {
        this.finishTypewriter();
      }
    }, 24);
  }

  private finishTypewriter() {
    if (this.typeTimer) clearInterval(this.typeTimer);
    this.isTyping = false;
    if (this.textEl) {
      this.textEl.textContent = this.fullText;
    }

    // Render choices if present
    if (this.currentLine && this.currentLine.choices && this.choicesEl) {
      this.choicesEl.innerHTML = '';
      this.choicesEl.classList.remove('hidden');
      this.currentLine.choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = ch.text;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          sound.playCoin();
          ch.onSelect();
          this.nextLine();
        });
        this.choicesEl?.appendChild(btn);
      });
    }
  }

  private endCutscene() {
    this.isActive = false;
    this.currentLine = null;
    if (this.overlayEl) {
      this.overlayEl.classList.add('hidden');
    }
    if (this.canvasContainer) {
      this.canvasContainer.classList.remove('cinematic-mode');
    }
    if (this.onCompleteCallback) {
      this.onCompleteCallback();
      this.onCompleteCallback = null;
    }
  }

  private getDefaultPortrait(speaker: string): string | null {
    const s = speaker.toUpperCase();
    if (s.includes('HERO') || s.includes('TRAVELER')) return '/assets/portraits/game/hero_portrait.png';
    if (s.includes('MASCOT') || s.includes('ZENO')) return '/assets/portraits/game/mascot_portrait.png';
    if (s.includes('YOUNG AUREL') || s.includes('YOUNG KRISH')) return '/assets/svg/young_aurel.svg';
    if (s.includes('AUREL') || s.includes('KRISH')) return '/assets/portraits/game/king_krish_portrait.png';
    if (s.includes('GUARD') || s.includes('VALEN') || s.includes('KAEL')) return '/assets/portraits/game/captain_valen_portrait.png';
    if (s.includes('ELDER') || s.includes('ROBIN')) return '/assets/portraits/game/elder_robin_portrait.png';
    if (s.includes('MERCHANT') || s.includes('ROWAN')) return '/assets/portraits/game/rowan_portrait.png';
    if (s.includes('PRIESTESS') || s.includes('SELENE')) return '/assets/portraits/game/preistess_selene_portrait.png';
    if (s.includes('RECORD') || s.includes('JOURNAL') || s.includes('INSCRIPTION')) return '/assets/svg/interact_lectern.svg';
    if (s.includes('MURAL') || s.includes('PAINTING')) return '/assets/svg/interact_mural.svg';
    if (s.includes('NOTICEBOARD')) return '/assets/svg/interact_noticeboard.svg';
    if (s.includes('MEMORIAL') || s.includes('MONUMENT') || s.includes('FOUNTAIN')) return '/assets/svg/interact_monument.svg';
    if (s.includes('MECHANISM') || s.includes('MACHINE')) return '/assets/svg/interact_machine.svg';
    if (s.includes('ANCHOR')) return '/assets/svg/interact_anchor.svg';
    return null;
  }

  private getSpeakerColor(speaker: string): string {
    const s = speaker.toUpperCase();
    if (s.includes('HERO')) return '#b45309';
    if (s.includes('MASCOT') || s.includes('ZENO')) return '#0284c7';
    if (s.includes('YOUNG AUREL') || s.includes('YOUNG KRISH')) return '#b45309';
    if (s.includes('AUREL') || s.includes('KRISH')) return '#7e22ce';
    if (s.includes('GUARD') || s.includes('VALEN') || s.includes('KAEL')) return '#b91c1c';
    if (s.includes('ELDER')) return '#15803d';
    if (s.includes('PRIESTESS') || s.includes('SELENE')) return '#6d28d9';
    if (s.includes('ROWAN') || s.includes('MERCHANT')) return '#c2410c';
    if (s.includes('RECORD') || s.includes('INSCRIPTION') || s.includes('JOURNAL')) return '#0369a1';
    if (s.includes('NARRATOR')) return '#451a03';
    return '#241c17';
  }
}

export const dialogue = new DialogueDirector();
