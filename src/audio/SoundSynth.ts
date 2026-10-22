/**
 * Web Audio API Procedural Chiptune & Ambient Sound Synthesizer
 * Produces rich retro fantasy sound effects and melodic theme music without any external audio files.
 */
export class SoundSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmInterval: any = null;
  private currentTrack: string = '';

  constructor() {
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.ctx) {
      this.stopBGM();
    }
    return !this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // -------------------------------------------------------------
  // Sound Effects (SFX)
  // -------------------------------------------------------------

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.14);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playAttack() {
    this.playSlashCombo(1);
  }

  public playSlashCombo(step: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (step === 1) {
      // Crisp horizontal high-pitch blade whoosh
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (step === 2) {
      // Heavy downward cross slash
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.13);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } else {
      // Step 3 Finisher: Heavy radiant thrust + bass punch
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);

      // Bass rumble sub-oscillator
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(120, now);
      sub.frequency.exponentialRampToValueAtTime(40, now + 0.25);
      subGain.gain.setValueAtTime(0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.26);
    }
  }

  public playSkillAttack() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // 1. Radiant beam frequency rise (chime)
    const beam = this.ctx.createOscillator();
    const beamGain = this.ctx.createGain();
    beam.type = 'sine';
    beam.frequency.setValueAtTime(440, now);
    beam.frequency.exponentialRampToValueAtTime(1100, now + 0.18);
    beamGain.gain.setValueAtTime(0.18, now);
    beamGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    beam.connect(beamGain);
    beamGain.connect(this.ctx.destination);
    beam.start(now);
    beam.stop(now + 0.36);

    // 2. Powerful cosmic blast wave
    const wave = this.ctx.createOscillator();
    const waveGain = this.ctx.createGain();
    wave.type = 'sawtooth';
    wave.frequency.setValueAtTime(260, now + 0.08);
    wave.frequency.exponentialRampToValueAtTime(55, now + 0.38);
    waveGain.gain.setValueAtTime(0.28, now + 0.08);
    waveGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    wave.connect(waveGain);
    waveGain.connect(this.ctx.destination);
    wave.start(now + 0.08);
    wave.stop(now + 0.4);
  }

  public playBoxBreak() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc1.connect(gain);
    gain.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);
  }

  public playVoidShoot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.2);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playShieldBlock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Resonant metallic deflection chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playSlimeSquish() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.16);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playShieldBreak() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playShieldPickup() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.18);
    });
  }

  public playHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playTypewriter() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650 + Math.random() * 80, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playClimb() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260 + Math.random() * 60, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.06);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playBossRoar() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.85);
  }

  public playBossDefeat() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fanfareNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C E G C E G
    fanfareNotes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const delay = idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.2, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.4);
    });
  }

  public playMagicChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const delay = idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + delay);

      gain.gain.setValueAtTime(0.08, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.45);
    });
  }

  public playCrownCrack() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Low rumble + sharp crunch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  public playDistantBell() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [440, 880, 1320];
    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now);
      osc.stop(now + 2.6);
    });
  }

  // -------------------------------------------------------------
  // Melodic Background Music (BGM)
  // -------------------------------------------------------------

  public playBGM(track: 'prologue' | 'act1' | 'act2' | 'act3' | 'boss_aurel' | 'boss_mascot' | 'epilogue') {
    if (this.currentTrack === track) return;
    this.stopBGM();
    this.currentTrack = track;
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    let step = 0;
    let tempoMs = 280;
    let melody: number[] = [];

    if (track === 'prologue') {
      tempoMs = 600;
      melody = [220, 0, 261.63, 0, 329.63, 0, 220, 0]; // Am slow ambient
    } else if (track === 'act1') {
      tempoMs = 240; // Bright, joyful adventure
      melody = [
        261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 349.23, 440.00,
        392.00, 329.63, 261.63, 293.66, 329.63, 293.66, 261.63, 0
      ];
    } else if (track === 'act2') {
      tempoMs = 340; // Eerie corrupted
      melody = [146.83, 164.81, 174.61, 196.00, 174.61, 164.81, 130.81, 0];
    } else if (track === 'act3') {
      tempoMs = 300; // Ancient temple
      melody = [196.00, 233.08, 261.63, 311.13, 293.66, 261.63, 233.08, 0];
    } else if (track === 'boss_aurel') {
      tempoMs = 180; // Fast dramatic royal clash
      melody = [
        220, 220, 261.63, 220, 329.63, 220, 293.66, 261.63,
        220, 220, 349.23, 329.63, 293.66, 261.63, 246.94, 220
      ];
    } else if (track === 'boss_mascot') {
      tempoMs = 150; // High stakes bullet hell climax
      melody = [
        329.63, 392.00, 440.00, 523.25, 493.88, 440.00, 392.00, 349.23,
        329.63, 293.66, 329.63, 392.00, 440.00, 493.88, 523.25, 587.33
      ];
    } else if (track === 'epilogue') {
      tempoMs = 360; // Sunrise warmth
      melody = [261.63, 329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63];
    }

    this.bgmInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const freq = melody[step % melody.length];
      step++;
      if (freq > 0) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = track.includes('boss') ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (tempoMs / 1000) * 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + (tempoMs / 1000));
      }
    }, tempoMs);
  }

  public stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentTrack = '';
  }
}

export const sound = new SoundSynth();
