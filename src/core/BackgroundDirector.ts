import Phaser from 'phaser';

export class BackgroundDirector {
  private scene: Phaser.Scene;
  private bgImages: Phaser.GameObjects.Image[] = [];
  private currentRegion: string = '';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public createWorldBackgrounds() {
    const groundY = 640;

    // -------------------------------------------------------------
    // Region 1: Act I (0–1,000 px) — Lumenfall Outskirts (SVG)
    // -------------------------------------------------------------
    const bg1 = this.scene.add.image(500, groundY, 'bg_act1');
    bg1.setOrigin(0.5, 1);
    bg1.setDisplaySize(1400, 520);
    bg1.setScrollFactor(0.25);
    bg1.setDepth(-100);
    this.bgImages.push(bg1);

    // -------------------------------------------------------------
    // Region 2: Act II (1,000–2,000 px) — The Corrupted Lands (SVG)
    // -------------------------------------------------------------
    const bg2 = this.scene.add.image(1550, groundY, 'bg_act2');
    bg2.setOrigin(0.5, 1);
    bg2.setDisplaySize(1400, 520);
    bg2.setScrollFactor(0.28);
    bg2.setDepth(-100);
    this.bgImages.push(bg2);

    // -------------------------------------------------------------
    // Region 3: Act III (2,000–3,000 px) — Forgotten Sanctuary (SVG)
    // -------------------------------------------------------------
    const bg3 = this.scene.add.image(2550, groundY, 'bg_act3');
    bg3.setOrigin(0.5, 1);
    bg3.setDisplaySize(1400, 520);
    bg3.setScrollFactor(0.3);
    bg3.setDepth(-100);
    this.bgImages.push(bg3);

    // -------------------------------------------------------------
    // Region 4: Act IV (3,000–4,100 px) — Castle Ramparts & Throne Room (SVG)
    // -------------------------------------------------------------
    const bg4 = this.scene.add.image(3550, groundY, 'bg_act4');
    bg4.setOrigin(0.5, 1);
    bg4.setDisplaySize(1400, 520);
    bg4.setScrollFactor(0.32);
    bg4.setDepth(-100);
    this.bgImages.push(bg4);

    // -------------------------------------------------------------
    // Region 5: Act V (4,100–5,000 px) — The Shattered Arena / Cosmic Void (SVG)
    // -------------------------------------------------------------
    const bg5 = this.scene.add.image(4550, groundY, 'bg_act5');
    bg5.setOrigin(0.5, 1);
    bg5.setDisplaySize(1400, 520);
    bg5.setScrollFactor(0.28);
    bg5.setDepth(-100);
    this.bgImages.push(bg5);

    // -------------------------------------------------------------
    // Region 6: Epilogue (5,000–5,500 px) — Restored Golden Sunrise (SVG)
    // -------------------------------------------------------------
    const bgEpi = this.scene.add.image(5300, groundY, 'bg_epilogue');
    bgEpi.setOrigin(0.5, 1);
    bgEpi.setDisplaySize(1400, 520);
    bgEpi.setScrollFactor(0.25);
    bgEpi.setDepth(-100);
    this.bgImages.push(bgEpi);

    // Atmospheric Weather / Ambient Vector Effects
    this.createAtmosphericParticles();
  }

  private createAtmosphericParticles() {
    // 1. Act I Floating Golden Spores / Flower Petals (0..1000 px)
    for (let i = 0; i < 22; i++) {
      const petal = this.scene.add.circle(
        Phaser.Math.Between(50, 950),
        Phaser.Math.Between(200, 600),
        Phaser.Math.Between(2, 4),
        0xfbbf24,
        0.6
      );
      petal.setDepth(20);
      this.scene.tweens.add({
        targets: petal,
        x: petal.x + Phaser.Math.Between(40, 100),
        y: petal.y + Phaser.Math.Between(-30, 40),
        alpha: { from: 0.2, to: 0.8 },
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 2. Act II Corrupted Purple Embers (1000..2000 px)
    for (let i = 0; i < 25; i++) {
      const ember = this.scene.add.circle(
        Phaser.Math.Between(1050, 1950),
        Phaser.Math.Between(200, 600),
        Phaser.Math.Between(1, 3),
        0xc084fc,
        0.7
      );
      ember.setDepth(20);
      this.scene.tweens.add({
        targets: ember,
        y: ember.y - Phaser.Math.Between(50, 120),
        alpha: { from: 0.8, to: 0 },
        duration: Phaser.Math.Between(2000, 3500),
        repeat: -1,
        ease: 'Power1'
      });
    }

    // 3. Act III Divine Cyan Shimmer (2000..3000 px)
    for (let i = 0; i < 20; i++) {
      const mist = this.scene.add.circle(
        Phaser.Math.Between(2050, 2950),
        Phaser.Math.Between(220, 600),
        Phaser.Math.Between(2, 5),
        0x38bdf8,
        0.5
      );
      mist.setDepth(20);
      this.scene.tweens.add({
        targets: mist,
        y: mist.y + Phaser.Math.Between(-40, 40),
        alpha: { from: 0.1, to: 0.7 },
        duration: Phaser.Math.Between(2500, 4500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 4. Act V Swirling Void Gravity Sparks (4200..4900 px)
    for (let i = 0; i < 30; i++) {
      const spark = this.scene.add.circle(
        Phaser.Math.Between(4250, 4950),
        Phaser.Math.Between(150, 550),
        Phaser.Math.Between(2, 4),
        0xa855f7,
        0.8
      );
      spark.setDepth(20);
      this.scene.tweens.add({
        targets: spark,
        x: spark.x - Phaser.Math.Between(60, 140),
        y: spark.y - Phaser.Math.Between(40, 100),
        scale: { from: 1, to: 0.2 },
        duration: Phaser.Math.Between(1800, 3000),
        repeat: -1,
        ease: 'Quad.easeIn'
      });
    }

    // 5. Epilogue Warm Morning Sun Rays (5000..5500 px)
    for (let i = 0; i < 20; i++) {
      const mote = this.scene.add.circle(
        Phaser.Math.Between(5050, 5450),
        Phaser.Math.Between(200, 600),
        Phaser.Math.Between(2, 4),
        0xfde047,
        0.7
      );
      mote.setDepth(20);
      this.scene.tweens.add({
        targets: mote,
        y: mote.y - Phaser.Math.Between(40, 80),
        alpha: { from: 0.3, to: 0.9 },
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  public update(cameraX: number) {
    let region = 'ACT_I';
    if (cameraX >= 1000 && cameraX < 2000) region = 'ACT_II';
    else if (cameraX >= 2000 && cameraX < 3000) region = 'ACT_III';
    else if (cameraX >= 3000 && cameraX < 4100) region = 'ACT_IV';
    else if (cameraX >= 4100 && cameraX < 5000) region = 'ACT_V';
    else if (cameraX >= 5000) region = 'EPILOGUE';

    if (region !== this.currentRegion) {
      this.currentRegion = region;
      this.scene.events.emit('region:changed', region);
    }
  }
}
