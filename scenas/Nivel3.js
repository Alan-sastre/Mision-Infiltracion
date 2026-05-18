class Nivel3 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel3" });
    this.score = 0;
    this.nexusHP = 100;
    this.kaiHP = 100;
    this.currentAttackIdx = 0;
    this.totalAttacks = 3; // Reducido a 3 ataques según instrucción
    this.isLevelComplete = false;
    this.isTransitioning = false;
  }

  preload() {
    // Los sonidos se cargarán cuando los archivos existan en assets/sounds/
    /*
    this.load.audio("error", "assets/sounds/error.mp3");
    this.load.audio("success", "assets/sounds/success.mp3");
    this.load.audio("win", "assets/sounds/win.mp3");
    */
  }

  create() {
    this.musicManager = MusicManager.getInstance();
    const { width, height } = this.scale;

    // Capas
    this.backgroundLayer = this.add.container(0, 0);
    this.charactersLayer = this.add.container(0, 0);
    this.attackLayer = this.add.container(0, 0);
    this.uiLayer = this.add.container(0, 0);

    this.setupEnhancedBackground();
    this.setupEnhancedNexus();
    this.setupEnhancedKai();
    this.setupEnhancedHUD();

    // Iniciar secuencia de ataques
    this.time.delayedCall(1000, () => {
      this.showBriefDialogue(
        "NEXUS",
        "Llegaste hasta aquí. Impresionante. Pero esto termina ahora.",
        3000,
      );
      this.time.delayedCall(1500, () => {
        this.showBriefDialogue("KAI", "3 ataques. Listo.", 2000);
        this.time.delayedCall(2000, () => {
          this.startNextAttack();
        });
      });
    });

    // Partículas ambientales
    this.createAmbientParticles();
  }

  // --- MEJORA 6: FONDO DE LA SALA ---
  setupEnhancedBackground() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();

    // Gradiente de fondo
    bg.fillGradientStyle(0x050010, 0x050010, 0x100005, 0x100005, 1);
    bg.fillRect(0, 0, width, height);

    // Suelo con patrón de circuito
    bg.lineStyle(1, 0xffffff, 0.04);
    const gridSize = 80;
    for (let x = 0; x <= width; x += gridSize) {
      bg.moveTo(x, 0);
      bg.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      bg.moveTo(0, y);
      bg.lineTo(width, y);
    }
    bg.strokePath();

    // Intersecciones
    bg.fillStyle(0xffffff, 0.08);
    for (let x = 0; x <= width; x += gridSize) {
      for (let y = 0; y <= height; y += gridSize) {
        bg.fillCircle(x, y, 3);
        if (Math.random() > 0.8) {
          bg.lineStyle(1, 0xffffff, 0.1);
          bg.moveTo(x, y);
          bg.lineTo(
            x + gridSize,
            y + (Math.random() > 0.5 ? gridSize : -gridSize),
          );
          bg.strokePath();
        }
      }
    }

    // Luces dinámicas
    this.nexusLight = this.add.circle(180, height / 2, 200, 0xff0000, 0.03);
    this.kaiLight = this.add.circle(
      width - 180,
      height / 2,
      200,
      0x00ffff,
      0.03,
    );

    this.tweens.add({
      targets: [this.nexusLight, this.kaiLight],
      alpha: 0.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    // Datos fluyendo (Matrix roja)
    this.createFlowingData();

    this.backgroundLayer.add([bg, this.nexusLight, this.kaiLight]);
  }

  createFlowingData() {
    const { width, height } = this.scale;
    const columns = 5;
    const colSpacing = 30;

    const createCol = (x) => {
      const txt = this.add.text(x, 0, "", {
        font: "10px monospace",
        fill: "#FF0000",
        alpha: 0.12,
      });
      this.time.addEvent({
        delay: 500,
        callback: () => {
          let str = "";
          for (let i = 0; i < 30; i++)
            str += (Math.random() > 0.5 ? "0" : "1") + "\n";
          txt.setText(str);
        },
        loop: true,
      });
      this.backgroundLayer.add(txt);
    };

    for (let i = 0; i < columns; i++) {
      createCol(10 + i * colSpacing);
      createCol(width - 150 + i * colSpacing);
    }
  }

  createAmbientParticles() {
    for (let i = 0; i < 30; i++) {
      const p = this.add.circle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        Phaser.Math.Between(1, 2),
        Math.random() > 0.5 ? 0xff2244 : 0x00ffff,
        Phaser.Math.FloatBetween(0.2, 0.5),
      );
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-50, 50),
        y: p.y + Phaser.Math.Between(-50, 50),
        duration: Phaser.Math.Between(2000, 5000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  // --- MEJORA 1: NEXUS ---
  setupEnhancedNexus() {
    const { height } = this.scale;
    const nexusX = 180;
    const nexusY = height / 2;

    this.nexusContainer = this.add.container(nexusX, nexusY);

    // Aura exterior
    this.nexusAura = this.add.container(0, 0);
    const auraRadii = [40, 30, 20, 10];
    const auraAlphas = [0.04, 0.07, 0.1, 0.15];
    auraRadii.forEach((r, i) => {
      const circle = this.add.circle(0, 0, 110 + r, 0xff2244, auraAlphas[i]);
      this.nexusAura.add(circle);
      this.tweens.add({
        targets: circle,
        scale: 1.05,
        duration: 1000,
        delay: i * 200,
        yoyo: true,
        repeat: -1,
      });
    });

    // Hexágono exterior (Gradiente manual)
    this.nexusBody = this.add.graphics();
    this.drawEnhancedNexusBody();

    // Hexágono interior (Rotando)
    this.nexusInnerHex = this.add.graphics();
    this.drawInnerHex();

    // Anillo de datos
    this.nexusDataRing = this.add.container(0, 0);
    const ringG = this.add.graphics();
    ringG.lineStyle(2, 0xff2244, 0.4);
    ringG.strokeCircle(0, 0, 95);
    this.nexusDataRing.add(ringG);

    this.dataPoints = [];
    for (let i = 0; i < 12; i++) {
      const point = this.add.container(0, 0);
      const p = this.add.circle(95, 0, 4, 0xff4444);
      point.add(p);
      // Estela
      for (let j = 0; j < 3; j++) {
        point.add(
          this.add.circle(95, -5 - j * 5, 3 - j, 0xff4444, 0.3 - j * 0.1),
        );
      }
      point.angle = i * 30;
      this.nexusDataRing.add(point);
      this.dataPoints.push(point);
    }

    // Iris y Pupila
    this.nexusIris = this.add.graphics();
    this.drawIris();

    this.nexusPupil = this.add.ellipse(0, 0, 20, 28, 0xff0000);
    this.nexusPupil.setFillStyle(0xff0000, 1);
    // Pupila gradiente simulado
    const pupilG = this.add.graphics();
    pupilG.fillGradientStyle(0xff0000, 0xff0000, 0x000000, 0x000000, 1);
    pupilG.fillEllipse(0, 0, 20, 28);

    // Tentáculos
    this.tentacles = [];
    for (let i = 0; i < 6; i++) {
      const t = this.add.graphics();
      this.tentacles.push(t);
      this.nexusContainer.add(t);
    }

    this.nexusContainer.add([
      this.nexusAura,
      this.nexusBody,
      this.nexusInnerHex,
      this.nexusDataRing,
      this.nexusIris,
      this.nexusPupil,
    ]);
    this.charactersLayer.add(this.nexusContainer);

    // Animación idle Nexus
    this.tweens.add({
      targets: this.nexusContainer,
      y: nexusY + 10,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  drawEnhancedNexusBody() {
    const g = this.nexusBody;
    g.clear();
    const radius = 110;

    // Gradiente capa por capa
    for (let i = 0; i < 15; i++) {
      const r = radius - i * 4;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x1a0008),
        Phaser.Display.Color.ValueToColor(0xff2244),
        15,
        15 - i,
      ).color;
      g.fillStyle(color, 1);
      this.drawPolygon(g, 6, r);
    }

    // Borde doble
    g.lineStyle(3, 0xff4466, 1);
    this.drawPolygon(g, 6, radius);
    g.lineStyle(1, 0xff0000, 0.4);
    this.drawPolygon(g, 6, radius - 5);

    // Vértices
    g.fillStyle(0xff6688, 1);
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 * Math.PI) / 180;
      g.fillCircle(Math.cos(angle) * radius, Math.sin(angle) * radius, 5);
    }

    // Grietas según HP
    if (this.nexusHP <= 60) this.drawEnhancedCrack(g, 0, 0, radius, 1);
    if (this.nexusHP <= 40) {
      this.drawEnhancedCrack(g, 0, 0, radius, 2);
      // Partículas cayendo (se manejan en update)
    }
    if (this.nexusHP <= 20) {
      this.drawEnhancedCrack(g, 0, 0, radius, 3);
      // Parpadeo (se maneja en update)
    }
  }

  drawInnerHex() {
    const g = this.nexusInnerHex;
    g.clear();
    const radius = 80;
    for (let i = 0; i < 6; i++) {
      const alpha = i % 2 === 0 ? 1.0 : 0.7;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x0d0004),
        Phaser.Display.Color.ValueToColor(0xaa1122),
        10,
        5,
      ).color;
      g.fillStyle(color, alpha);
      // Dibujar solo un segmento del hexágono
      const angle1 = (i * 60 * Math.PI) / 180;
      const angle2 = ((i + 1) * 60 * Math.PI) / 180;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(angle1) * radius, Math.sin(angle1) * radius);
      g.lineTo(Math.cos(angle2) * radius, Math.sin(angle2) * radius);
      g.closePath();
      g.fillPath();
    }
  }

  drawIris() {
    const g = this.nexusIris;
    g.clear();
    // Fondo gradiente radial simulado
    for (let i = 0; i < 5; i++) {
      const r = 50 - i * 10;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x330000),
        Phaser.Display.Color.ValueToColor(0x000000),
        5,
        i,
      ).color;
      g.fillStyle(color, 1);
      g.fillCircle(0, 0, r);
    }
    // Líneas radiales
    g.lineStyle(1, 0xff2244, 0.2);
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 * Math.PI) / 180;
      g.moveTo(0, 0);
      g.lineTo(Math.cos(angle) * 50, Math.sin(angle) * 50);
    }
    // Círculos concéntricos
    for (let i = 1; i <= 3; i++) {
      g.lineStyle(1, 0xff0000, 0.2);
      g.strokeCircle(0, 0, i * 15);
    }
    g.strokePath();
  }

  drawEnhancedCrack(g, x, y, r, count) {
    g.lineStyle(2, 0x000000, 0.8);
    for (let c = 0; c < count; c++) {
      const angle = (c * 120 * Math.PI) / 180;
      g.beginPath();
      g.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      let cx = Math.cos(angle) * r;
      let cy = Math.sin(angle) * r;
      for (let i = 0; i < 4; i++) {
        cx -= Math.cos(angle) * (r / 5);
        cy -= Math.sin(angle) * (r / 5);
        g.lineTo(
          cx + (Math.random() - 0.5) * 10,
          cy + (Math.random() - 0.5) * 10,
        );
      }
      g.strokePath();
    }
  }

  // --- MEJORA 2: KAI ---
  setupEnhancedKai() {
    const { width, height } = this.scale;
    const kaiX = width - 180;
    const kaiY = height / 2 + 50;

    this.kaiContainer = this.add.container(kaiX, kaiY);

    // Aura de energía
    this.kaiAura = this.add.container(0, -30);
    this.kaiAura.add(this.add.circle(0, 0, 45, 0x00ffff, 0.05));
    this.kaiAura.add(this.add.circle(0, 0, 55, 0x00ffff, 0.03));

    // Silueta wireframe
    this.kaiBody = this.add.graphics();
    this.drawEnhancedKaiWireframe();

    // Escudo holográfico
    this.kaiShield = this.add.graphics();
    this.drawEnhancedKaiShield(false);

    this.kaiContainer.add([this.kaiAura, this.kaiBody, this.kaiShield]);
    this.charactersLayer.add(this.kaiContainer);

    // Animación escudo pulse
    this.tweens.add({
      targets: this.kaiShield,
      alpha: 0.6,
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });
  }

  drawEnhancedKaiWireframe() {
    const g = this.kaiBody;
    g.clear();
    g.lineStyle(2, 0x00ffff, 0.8);

    // --- CABEZA ROBÓTICA COMPACTA ---
    g.fillStyle(0x00ffff, 0.15);
    g.fillRoundedRect(-18, -100, 36, 28, 6);
    g.strokeRoundedRect(-18, -100, 36, 28, 6);
    // Visor de profundidad
    g.fillStyle(0x00ffff, 0.7);
    g.fillRect(-12, -92, 24, 6);
    g.lineStyle(1, 0x00ffff, 0.4);
    g.strokeRect(-12, -92, 24, 6);
    // Antena integrada
    g.lineStyle(1, 0x00ffff, 0.8);
    g.moveTo(8, -100); g.lineTo(12, -112);
    g.strokeCircle(12, -112, 2);

    // --- CUELLO / UNIÓN ---
    g.lineStyle(2, 0x00ffff, 0.6);
    g.strokeRect(-6, -72, 12, 7);

    // --- TORSO MECÁNICO REFORZADO ---
    g.lineStyle(2, 0x00ffff, 0.8);
    g.fillStyle(0x00ffff, 0.2);
    // Placa de pecho principal (forma sólida)
    g.beginPath();
    g.moveTo(-22, -65); g.lineTo(22, -65);
    g.lineTo(25, -45); g.lineTo(18, -20);
    g.lineTo(-18, -20); g.lineTo(-25, -45);
    g.closePath();
    g.fillPath();
    g.strokePath();
    // Detalles de armadura interior
    g.lineStyle(1, 0x00ffff, 0.3);
    g.moveTo(-18, -55); g.lineTo(18, -55);
    g.moveTo(-15, -45); g.lineTo(15, -45);
    g.strokePath();
    // Núcleo de energía detallado
    g.lineStyle(2, 0x00ffff, 1);
    g.strokeCircle(0, -42, 10);
    g.fillStyle(0x00ffff, 0.5);
    g.fillCircle(0, -42, 5);
    // Brillo del núcleo
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(-2, -44, 2);

    // --- BRAZOS ROBÓTICOS INTEGRADOS ---
    const drawRobotArm = (side) => {
      g.lineStyle(2, 0x00ffff, 0.8);
      // Hombro robusto
      g.strokeCircle(side * 22, -60, 6);
      g.fillStyle(0x00ffff, 0.1);
      g.fillCircle(side * 22, -60, 6);
      // Brazo superior
      g.moveTo(side * 28, -60);
      g.lineTo(side * 40, -45);
      // Articulación pistón
      g.strokeCircle(side * 40, -45, 4);
      // Antebrazo
      g.moveTo(side * 40, -45);
      g.lineTo(side * 32, -18);
      // Herramienta/Mano compacta
      g.beginPath();
      g.moveTo(side * 32, -18);
      g.lineTo(side * 38, -8);
      g.moveTo(side * 32, -18);
      g.lineTo(side * 26, -8);
      g.moveTo(side * 38, -8); g.lineTo(side * 35, -5);
      g.moveTo(side * 26, -8); g.lineTo(side * 29, -5);
      g.strokePath();
    };
    drawRobotArm(-1);
    drawRobotArm(1);

    // --- BASE DE ORUGAS INTEGRADA (SIN PATAS SEPARADAS) ---
    g.lineStyle(2, 0x00ffff, 0.8);
    g.fillStyle(0x00ffff, 0.15);
    // Chasis inferior único
    g.fillRoundedRect(-25, -20, 50, 25, 4);
    g.strokeRoundedRect(-25, -20, 50, 25, 4);
    
    // Orugas/Base de movimiento compacta
    const baseY = 5;
    g.fillStyle(0x00ffff, 0.1);
    // Cuerpo de la base
    g.fillRoundedRect(-30, baseY, 60, 35, 8);
    g.strokeRoundedRect(-30, baseY, 60, 35, 8);
    
    // Ruedas/Engranajes internos de la base
    for(let i=0; i<4; i++) {
        const rx = -18 + i * 12;
        const ry = baseY + 18;
        g.strokeCircle(rx, ry, 5);
        g.lineStyle(1, 0x00ffff, 0.4);
        g.moveTo(rx, ry - 5); g.lineTo(rx, ry + 5);
        g.moveTo(rx - 5, ry); g.lineTo(rx + 5, ry);
        g.lineStyle(2, 0x00ffff, 0.8);
    }
    
    // Banda de rodamiento superior e inferior
    g.lineStyle(2, 0x00ffff, 1);
    g.moveTo(-30, baseY + 5); g.lineTo(30, baseY + 5);
    g.moveTo(-30, baseY + 30); g.lineTo(30, baseY + 30);
    g.strokePath();
    
    // Detalles de tornillería en la base
    g.fillStyle(0x00ffff, 0.6);
    g.fillCircle(-25, baseY + 5, 2);
    g.fillCircle(25, baseY + 5, 2);
    g.fillCircle(-25, baseY + 30, 2);
    g.fillCircle(25, baseY + 30, 2);
  }

  drawEnhancedKaiShield(hit) {
    const g = this.kaiShield;
    g.clear();
    const color = hit ? 0xff2244 : 0x00ffff;
    const shieldX = -10; // Centrado con el robot
    const shieldY = -40;
    const radius = 85;

    // --- CAMPO DE FUERZA CIRCULAR COMPLETO ---
    // Relleno con gradiente radial suave
    g.fillStyle(color, hit ? 0.25 : 0.08);
    g.fillCircle(shieldX, shieldY, radius);

    // Borde exterior doble
    g.lineStyle(2, color, 0.5);
    g.strokeCircle(shieldX, shieldY, radius);
    g.lineStyle(1, color, 0.2);
    g.strokeCircle(shieldX, shieldY, radius + 5);

    // --- DETALLES HOLOGRÁFICOS INTERNOS ---
    // Red de hexágonos sutil
    g.lineStyle(1, color, 0.1);
    const hexSize = 15;
    for (let x = -radius; x < radius; x += hexSize * 1.5) {
      for (let y = -radius; y < radius; y += hexSize * Math.sqrt(3)) {
        const dist = Math.sqrt(x * x + y * y);
        if (dist < radius - 5) {
          this.drawPolygon(g, 6, hexSize, shieldX + x, shieldY + y);
        }
      }
    }

    // Anillos concéntricos de datos
    for (let i = 1; i <= 3; i++) {
      const r = i * 25;
      const alpha = 0.15 - i * 0.03;
      g.lineStyle(1, color, alpha);
      g.strokeCircle(shieldX, shieldY, r);

      // Pequeños puntos de datos en los anillos
      const dots = 8;
      g.fillStyle(color, alpha * 2);
      for (let j = 0; j < dots; j++) {
        const angle = j * (360 / dots) * (Math.PI / 180) + (this.time.now / 1000) * i;
        g.fillCircle(shieldX + Math.cos(angle) * r, shieldY + Math.sin(angle) * r, 2);
      }
    }

    // Brillo de impacto (si fue golpeado)
    if (hit) {
      g.lineStyle(4, 0xffffff, 0.6);
      g.strokeCircle(shieldX, shieldY, radius);
    }
  }

  // Sobrecarga de drawPolygon para incluir posición
  drawPolygon(g, sides, size, x = 0, y = 0) {
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 360) / sides * (Math.PI / 180);
      points.push({ x: x + Math.cos(angle) * size, y: y + Math.sin(angle) * size });
    }
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < sides; i++) g.lineTo(points[i].x, points[i].y);
    g.closePath();
    g.strokePath();
  }

  // --- MEJORA 5: BARRAS DE VIDA ---
  setupEnhancedHUD() {
    const { width } = this.scale;
    const style = { font: "bold 16px Orbitron", fill: "#FFFFFF" };

    this.attackText = this.add
      .text(width / 2, 30, `ATAQUE: 0/${this.totalAttacks}`, style)
      .setOrigin(0.5);
    this.scoreText = this.add
      .text(width / 2, 60, "SCORE: 0", {
        font: "14px Rajdhani",
        fill: "#00BFFF",
      })
      .setOrigin(0.5);

    this.hudBars = this.add.graphics();
    this.updateEnhancedLifeBars();

    this.uiLayer.add([this.attackText, this.scoreText, this.hudBars]);
  }

  updateEnhancedLifeBars() {
    const g = this.hudBars;
    const { width } = this.scale;
    g.clear();

    const barW = 240;
    const barH = 20;

    // --- NEXUS BAR ---
    const nx = 30,
      ny = 40;
    // Contenedor
    g.fillStyle(0x050510, 1);
    g.fillRect(nx, ny, barW, barH);
    g.lineStyle(1, 0x1a1a2a, 1);
    g.strokeRect(nx, ny, barW, barH);
    // Track textura
    g.lineStyle(1, 0xffffff, 0.03);
    for (let i = 0; i < barW; i += 8) {
      g.moveTo(nx + i, ny);
      g.lineTo(nx + i, ny + barH);
    }
    g.strokePath();
    // Fill
    const nFill = barW * (this.nexusHP / 100);
    g.fillGradientStyle(0xff0000, 0xff4444, 0xff0000, 0xff4444, 1);
    g.fillRect(nx, ny, nFill, barH);
    // Brillo superior
    g.lineStyle(1, 0xff8888, 0.6);
    g.moveTo(nx, ny + 1);
    g.lineTo(nx + nFill, ny + 1);
    g.strokePath();
    // Separadores
    g.lineStyle(1, 0xffffff, 0.2);
    for (let i = 0.25; i < 1; i += 0.25) {
      g.moveTo(nx + barW * i, ny);
      g.lineTo(nx + barW * i, ny + barH);
    }
    g.strokePath();
    // Etiqueta e Icono
    if (!this.nexusLabel) {
      this.nexusLabel = this.add.text(nx + 20, ny - 15, "⬢ NEXUS CORE", {
        font: "bold 12px Orbitron",
        fill: "#FF2244",
      });
      this.uiLayer.add(this.nexusLabel);
    }

    // --- KAI BAR ---
    const kx = width - barW - 30,
      ky = 40;
    g.fillStyle(0x050510, 1);
    g.fillRect(kx, ky, barW, barH);
    g.lineStyle(1, 0x1a1a2a, 1);
    g.strokeRect(kx, ky, barW, barH);
    // Track textura
    g.lineStyle(1, 0xffffff, 0.03);
    for (let i = 0; i < barW; i += 8) {
      g.moveTo(kx + i, ky);
      g.lineTo(kx + i, ky + barH);
    }
    g.strokePath();
    // Fill
    const kFill = barW * (this.kaiHP / 100);
    g.fillGradientStyle(0x0088ff, 0x00ffff, 0x0088ff, 0x00ffff, 1);
    g.fillRect(kx + (barW - kFill), ky, kFill, barH);
    // Brillo superior
    g.lineStyle(1, 0x88ffff, 0.6);
    g.moveTo(kx + (barW - kFill), ky + 1);
    g.lineTo(kx + barW, ky + 1);
    g.strokePath();
    // Separadores
    g.lineStyle(1, 0xffffff, 0.2);
    for (let i = 0.25; i < 1; i += 0.25) {
      g.moveTo(kx + barW * i, ky);
      g.lineTo(kx + barW * i, ky + barH);
    }
    g.strokePath();
    // Etiqueta e Icono
    if (!this.kaiLabel) {
      this.kaiLabel = this.add
        .text(kx + barW - 20, ky - 15, "KAI SYSTEMS 👤", {
          font: "bold 12px Orbitron",
          fill: "#00FFFF",
        })
        .setOrigin(1, 0);
      this.uiLayer.add(this.kaiLabel);
    }
  }

  // --- MEJORA 3: PANELES DE ATAQUE ---
  showAttack(idx) {
    this.attackLayer.removeAll(true);
    const { width, height } = this.scale;

    const panel = this.add.container(width / 2, height / 2);
    const bg = this.add.graphics();

    // Fondo gradiente
    bg.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x050510, 0x050510, 1);
    bg.fillRoundedRect(-320, -200, 640, 400, 15);

    // Bordes
    bg.lineStyle(2, 0x00bfff, 1);
    bg.strokeRoundedRect(-320, -200, 640, 400, 15);
    bg.lineStyle(1, 0x00bfff, 0.2);
    bg.strokeRoundedRect(-310, -190, 620, 380, 10);

    // Esquinas HUD
    bg.lineStyle(3, 0x00bfff, 1);
    const corners = [
      { x: -320, y: -200, dx: 1, dy: 1 },
      { x: 320, y: -200, dx: -1, dy: 1 },
      { x: -320, y: 200, dx: 1, dy: -1 },
      { x: 320, y: 200, dx: -1, dy: -1 },
    ];
    corners.forEach((c) => {
      bg.moveTo(c.x, c.y + c.dy * 25);
      bg.lineTo(c.x, c.y);
      bg.lineTo(c.x + c.dx * 25, c.y);
      bg.fillCircle(c.x, c.y, 4);
    });
    bg.strokePath();

    // Ruido de fondo
    bg.fillStyle(0xffffff, 0.02);
    for (let i = 0; i < 80; i++)
      bg.fillCircle(
        Phaser.Math.Between(-300, 300),
        Phaser.Math.Between(-180, 180),
        1,
      );

    panel.add(bg);

    // Separador de título
    const sep = this.add.graphics();
    sep.fillGradientStyle(0x00bfff, 0x00bfff, 0x00bfff, 0x00bfff, 0, 1, 0, 0);
    sep.fillRect(-280, -145, 560, 2);
    panel.add(sep);

    switch (idx) {
      case 1:
        this.setupAttack1(panel);
        break;
      case 2:
        this.setupAttack2(panel);
        break;
      case 3:
        this.setupAttack3(panel);
        break;
    }

    this.attackLayer.add(panel);

    // Animación de materialización
    panel.setAlpha(0);
    panel.scaleX = 0.8;
    this.tweens.add({
      targets: panel,
      alpha: 1,
      scaleX: 1,
      duration: 400,
      ease: "Back.easeOut",
    });

    // Contracción pupila NEXUS
    this.tweens.add({
      targets: this.nexusPupil,
      width: 12,
      height: 20,
      duration: 200,
      yoyo: true,
      repeat: 0,
    });
  }

  // --- ATAQUE 1: BUCLE ---
  setupAttack1(panel) {
    const title = this.add
      .text(0, -170, "ATAQUE 1: BUCLE INFINITO", {
        font: "bold 22px Orbitron",
        fill: "#FF2244",
      })
      .setOrigin(0.5);
    const q1 = this.add
      .text(0, -125, "¿Qué línea tiene el bug? ¿Cómo se corrige?", {
        font: "15px Rajdhani",
        fill: "#FFFFFF",
      })
      .setOrigin(0.5);

    // Efecto scanline en título
    const scan = this.add.graphics();
    scan.fillStyle(0x000000, 0.15);
    for (let i = 0; i < 30; i += 3) scan.fillRect(-150, -180 + i, 300, 1);

    const codeBg = this.add.graphics();
    codeBg.fillStyle(0x0d1117, 1);
    codeBg.fillRoundedRect(-220, -90, 440, 130, 8);
    panel.add([title, q1, scan, codeBg]);

    const codeLines = [
      "i = 0",
      "mientras i < 10:",
      "  i = i - 1",
      "  imprimir(i)",
    ];
    codeLines.forEach((line, i) => {
      const txt = this.add
        .text(-200, -75 + i * 28, `${i + 1}  ${line}`, {
          font: "17px monospace",
          fill: i === 2 ? "#FF6666" : "#CCDDEE",
        })
        .setInteractive();

      if (i === 2) {
        const arrow = this.add
          .text(-20, -25, "↻", { font: "45px Arial", fill: "#FF2244" })
          .setOrigin(0.5);
        this.tweens.add({
          targets: arrow,
          angle: 360,
          duration: 2000,
          repeat: -1,
        });
        panel.add(arrow);
        txt.on("pointerdown", () => this.showAttack1Options(panel));
      } else {
        txt.on("pointerdown", () => this.handleError());
      }
      panel.add(txt);
    });
  }

  showAttack1Options(panel) {
    const options = ["i = i + 1", "i = i * 2", "i = i - 2", "i = 0"];
    options.forEach((opt, i) => {
      panel.add(
        this.createEnhancedButton(0, 90 + i * 42, opt, (btn) => {
          if (opt === "i = i + 1") this.handleEnhancedSuccess(btn, 150);
          else this.handleEnhancedError(btn);
        }),
      );
    });
  }

  // --- ATAQUE 2: INDEXACIÓN ---
  setupAttack2(panel) {
    const title = this.add
      .text(0, -170, "ATAQUE 2: ROBO DE MEMORIA", {
        font: "bold 22px Orbitron",
        fill: "#FF2244",
      })
      .setOrigin(0.5);
    const q = this.add
      .text(0, -125, "¿Cuál es el comando correcto para acceder al NÚCLEO?", {
        font: "15px Rajdhani",
        fill: "#FFFFFF",
      })
      .setOrigin(0.5);

    const codeBg = this.add.graphics();
    codeBg.fillStyle(0x0d1117, 1);
    codeBg.fillRoundedRect(-260, -100, 520, 150, 8);
    panel.add([title, q, codeBg]);

    const arrayCode = 'claves = ["A-1", "B-2", "C-3", "NÚCLEO", "E-5"]';
    panel.add(
      this.add
        .text(0, -65, arrayCode, { font: "18px monospace", fill: "#FFFFFF" })
        .setOrigin(0.5),
    );

    const indices = ["0", "1", "2", "3", "4"];
    indices.forEach((idx, i) => {
      panel.add(
        this.add
          .text(-195 + i * 98, -35, `[${idx}]`, {
            font: "13px monospace",
            fill: "#00BFFF",
          })
          .setOrigin(0.5),
      );
    });

    const options = ["claves[4]", "claves[3]", "claves[2]", "claves.núcleo"];
    options.forEach((opt, i) => {
      panel.add(
        this.createEnhancedButton(0, 90 + i * 42, opt, (btn) => {
          if (opt === "claves[3]") this.handleEnhancedSuccess(btn, 150);
          else this.handleEnhancedError(btn);
        }),
      );
    });
  }

  // --- ATAQUE 3: COMPUERTAS (Adaptado como el 3ro) ---
  setupAttack3(panel) {
    const title = this.add
      .text(0, -170, "ATAQUE FINAL: CORTOCIRCUITO", {
        font: "bold 22px Orbitron",
        fill: "#FF2244",
      })
      .setOrigin(0.5);
    const q = this.add
      .text(0, -125, "Identifica la compuerta que da salida 1", {
        font: "15px Rajdhani",
        fill: "#FFFFFF",
      })
      .setOrigin(0.5);
    panel.add([title, q]);

    const g = this.add.graphics();
    g.lineStyle(4, 0x00bfff, 0.8);
    g.moveTo(-220, -50);
    g.lineTo(-120, -50);
    g.lineTo(-120, -30);
    g.moveTo(-220, 50);
    g.lineTo(-120, 50);
    g.lineTo(-120, 30);
    g.moveTo(70, 0);
    g.lineTo(180, 0);
    g.strokePath();
    panel.add(g);

    panel.add(
      this.add
        .text(-240, -50, "1", { font: "bold 24px Orbitron", fill: "#00FF88" })
        .setOrigin(0.5),
    );
    panel.add(
      this.add
        .text(-240, 50, "0", { font: "bold 24px Orbitron", fill: "#888888" })
        .setOrigin(0.5),
    );

    const gateBox = this.add.graphics();
    gateBox.fillStyle(0x0d1117, 1);
    gateBox.fillRoundedRect(-40, -40, 130, 80, 5);
    gateBox.lineStyle(2, 0x00bfff, 1);
    gateBox.strokeRoundedRect(-40, -40, 130, 80, 5);
    panel.add(gateBox);
    panel.add(
      this.add
        .text(25, 0, "[ ? ]", { font: "bold 28px Orbitron", fill: "#FFFFFF" })
        .setOrigin(0.5),
    );

    const gates = [
      { name: "AND", correct: false },
      { name: "OR", correct: true },
      { name: "XOR", correct: true },
      { name: "NAND", correct: true },
    ];

    gates.forEach((gate, i) => {
      const btn = this.createEnhancedButton(
        -230 + i * 155,
        130,
        gate.name,
        (b) => {
          if (gate.correct) this.handleEnhancedSuccess(b, 150);
          else this.handleEnhancedError(b);
        },
      );
      btn.setScale(0.8);
      panel.add(btn);
    });
  }

  // --- MEJORA 4: BOTONES ---
  createEnhancedButton(x, y, text, callback) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();

    const drawBtn = (hover) => {
      bg.clear();
      bg.fillGradientStyle(
        hover ? 0x1a2a3a : 0x0d1b2a,
        hover ? 0x1a2a3a : 0x0d1b2a,
        0x060d14,
        0x060d14,
        1,
      );
      bg.fillRoundedRect(-150, -18, 300, 36, 5);
      bg.lineStyle(hover ? 3 : 2, hover ? 0x00bfff : 0x1a3a5a, 1);
      bg.strokeRoundedRect(-150, -18, 300, 36, 5);
      bg.lineStyle(1, 0xffffff, 0.1);
      bg.strokeRoundedRect(-145, -13, 290, 26, 3);

      // Esquinas detalle
      bg.lineStyle(2, hover ? 0x00bfff : 0x1a3a5a, 1);
      bg.moveTo(-150, -8);
      bg.lineTo(-150, -18);
      bg.lineTo(-140, -18);
      bg.moveTo(150, 18);
      bg.lineTo(150, 8);
      bg.lineTo(140, 18);
      bg.strokePath();
    };

    drawBtn(false);

    const txt = this.add
      .text(0, 0, text, { font: "bold 15px Rajdhani", fill: "#AACCDD" })
      .setOrigin(0.5);
    container.add([bg, txt]);
    container.setSize(300, 36);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => {
      drawBtn(true);
      this.tweens.add({ targets: container, y: y - 2, duration: 100 });
    });
    container.on("pointerout", () => {
      drawBtn(false);
      this.tweens.add({ targets: container, y: y, duration: 100 });
    });
    container.on("pointerdown", () => callback(container));

    return container;
  }

  handleEnhancedSuccess(btn, pts) {
    const bg = btn.list[0];
    bg.fillStyle(0x00ff88, 0.4);
    bg.fillRoundedRect(-150, -18, 300, 36, 5);

    // Partículas verdes
    for (let i = 0; i < 10; i++) {
      const p = this.add.circle(
        this.scale.width / 2 + btn.x,
        this.scale.height / 2 + btn.y,
        3,
        0x00ff88,
      );
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-100, 100),
        y: p.y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        scale: 0,
        duration: 500,
        onComplete: () => p.destroy(),
      });
    }

    // Gesto de victoria KAI
    const rightArm = this.kaiBody; // Simplificado
    this.tweens.add({
      targets: this.kaiContainer,
      y: this.kaiContainer.y - 20,
      duration: 200,
      yoyo: true,
      ease: "Power2",
    });
    // Destello verde en escudo
    const flash = this.add.graphics();
    flash.fillStyle(0x00ff88, 0.3);
    flash.fillCircle(this.kaiContainer.x - 60, this.kaiContainer.y - 30, 80);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.5,
      duration: 400,
      onComplete: () => flash.destroy(),
    });

    this.score += pts;
    this.nexusHP = Math.max(0, this.nexusHP - 34);
    this.playSound("success");
    this.updateHUD();
    this.updateEnhancedLifeBars();
    this.drawEnhancedNexusBody();

    // Flash pupila Nexus al recibir daño
    this.nexusPupil.setFillStyle(0xffffff, 1);
    this.time.delayedCall(100, () => this.nexusPupil.setFillStyle(0xff0000, 1));

    this.time.delayedCall(800, () => {
      this.attackLayer.removeAll(true);
      if (this.currentAttackIdx < this.totalAttacks) {
        this.showBriefDialogue("BYTE", "Siguiente fase. ¡Dale!", 2000);
        this.time.delayedCall(2000, () => this.startNextAttack());
      } else {
        this.completeEpicLevel();
      }
    });
  }

  handleEnhancedError(btn) {
    const damage = 10;
    this.kaiHP = Math.max(10, this.kaiHP - damage);
    this.score = Math.max(0, this.score - 30);
    this.playSound("error");
    this.updateEnhancedLifeBars();
    this.cameras.main.shake(200, 0.01);

    // Texto de daño flotante
    const dmgTxt = this.add.text(this.scale.width - 150, 60, `-${damage}%`, {
      font: "bold 20px Orbitron",
      fill: "#FF2244",
    });
    this.tweens.add({
      targets: dmgTxt,
      y: 20,
      alpha: 0,
      duration: 800,
      onComplete: () => dmgTxt.destroy(),
    });

    const bg = btn.list[0];
    bg.fillStyle(0xff2244, 0.4);
    bg.fillRoundedRect(-150, -18, 300, 36, 5);

    this.tweens.add({
      targets: btn,
      x: btn.x + 8,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => (btn.x = 0),
    });

    // Ondas de impacto en escudo KAI
    for (let i = 0; i < 3; i++) {
      const wave = this.add.graphics();
      wave.lineStyle(2, 0xff2244, 0.8);
      wave.strokeCircle(this.kaiContainer.x - 60, this.kaiContainer.y - 30, 10);
      this.tweens.add({
        targets: wave,
        scale: 8,
        alpha: 0,
        duration: 600,
        delay: i * 150,
        onComplete: () => wave.destroy(),
      });
    }

    this.drawEnhancedKaiShield(true);
    this.time.delayedCall(500, () => this.drawEnhancedKaiShield(false));
  }

  // --- MEJORA 8: ANIMACIÓN FINAL ---
  completeEpicLevel() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Fase 1: Destello máximo
    const flash = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0xff2244)
      .setOrigin(0);
    flash.setAlpha(0);
    this.tweens.add({ targets: flash, alpha: 0.8, duration: 250, yoyo: true });

    // Fase 2: Fragmentos
    this.nexusBody.clear();
    this.nexusAura.destroy();
    this.nexusDataRing.destroy();
    this.nexusIris.destroy();
    this.nexusPupil.destroy();

    for (let i = 0; i < 40; i++) {
      const frag = this.add.graphics();
      frag.fillStyle(Phaser.Math.Between(0xff0000, 0xff8800), 1);
      this.drawPolygon(frag, 3, Phaser.Math.Between(5, 15));
      frag.x = this.nexusContainer.x;
      frag.y = this.nexusContainer.y;

      this.tweens.add({
        targets: frag,
        x: frag.x + Phaser.Math.Between(-400, 400),
        y: frag.y + Phaser.Math.Between(-400, 400),
        angle: 360,
        alpha: 0,
        duration: 1500,
        onComplete: () => frag.destroy(),
      });
    }

    this.playSound("win");
    this.cameras.main.shake(1000, 0.05);

    // Fase 3: Escudo de KAI se expande
    this.time.delayedCall(2000, () => {
      const kExpand = this.add.circle(
        this.kaiContainer.x,
        this.kaiContainer.y,
        10,
        0x00ffff,
        0.5,
      );
      this.tweens.add({
        targets: kExpand,
        radius: 1000,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          kExpand.destroy();
          this.showFinalTexts();
        },
      });
    });
  }

  showFinalTexts() {
    const { width, height } = this.scale;

    // Fase 4: NEXUS — DESTRUIDA
    const t1 = this.add
      .text(width / 2, height / 2 - 50, "NEXUS — DESTRUIDA", {
        font: "bold 45px Orbitron",
        fill: "#FF2244",
      })
      .setOrigin(0.5);
    t1.setScale(0);
    this.tweens.add({
      targets: t1,
      scale: 1,
      duration: 800,
      ease: "Back.easeOut",
    });

    // Fase 5: AURORA-9 LIBRE
    this.time.delayedCall(1200, () => {
      const t2 = this.add
        .text(width / 2, height / 2 + 50, "AURORA-9 LIBRE", {
          font: "bold 32px Orbitron",
          fill: "#00FFFF",
        })
        .setOrigin(0.5);
      t2.setScale(0);
      this.tweens.add({
        targets: t2,
        scale: 1,
        duration: 800,
        ease: "Back.easeOut",
      });
    });

    // Fase 6: Final
    this.time.delayedCall(4500, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () =>
        this.scene.start("scenaVideo4", { score: this.score }),
      );
    });
  }

  // --- LOGICA DE ATAQUES ---
  startNextAttack() {
    if (this.currentAttackIdx >= this.totalAttacks) return;
    this.currentAttackIdx++;
    this.attackText.setText(
      `ATAQUE: ${this.currentAttackIdx}/${this.totalAttacks}`,
    );
    this.showAttack(this.currentAttackIdx);
  }

  // --- HELPERS ---
  drawPolygon(g, sides, size) {
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = ((i * 360) / sides) * (Math.PI / 180);
      points.push({ x: Math.cos(angle) * size, y: Math.sin(angle) * size });
    }
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < sides; i++) g.lineTo(points[i].x, points[i].y);
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  showBriefDialogue(personaje, texto, duration = 4000) {
    const { width, height } = this.scale;
    const color =
      personaje === "BYTE"
        ? "#00FF88"
        : personaje === "KAI"
          ? "#00BFFF"
          : "#FF2244";
    const diag = this.add
      .text(20, height - 40, `${personaje}: ${texto}`, {
        font: "bold 16px Rajdhani",
        fill: color,
        backgroundColor: "#000000AA",
        padding: { x: 10, y: 5 },
      })
      .setAlpha(0);
    this.uiLayer.add(diag);
    this.tweens.add({
      targets: diag,
      alpha: 1,
      duration: 500,
      onComplete: () =>
        this.time.delayedCall(duration, () => {
          if (diag.active)
            this.tweens.add({
              targets: diag,
              alpha: 0,
              duration: 500,
              onComplete: () => diag.destroy(),
            });
        }),
    });
  }

  updateHUD() {
    this.scoreText.setText(`SCORE: ${this.score}`);
  }
  playSound(key) {
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume: 0.5 });
  }

  update() {
    if (this.isTransitioning) return;

    // Rotación NEXUS
    if (this.nexusInnerHex) this.nexusInnerHex.angle += 0.3;

    // Órbita puntos datos
    if (this.dataPoints) {
      this.dataPoints.forEach((p, i) => {
        p.angle += 1.14; // Aprox 0.02 rad/frame
      });
    }

    // Tentáculos sinuosos
    if (this.tentacles) {
      const time = this.time.now / 1000;
      this.tentacles.forEach((t, i) => {
        t.clear();
        const angleBase = (i * 60 * Math.PI) / 180;
        const vx = Math.cos(angleBase) * 110;
        const vy = Math.sin(angleBase) * 110;

        t.lineStyle(2, 0xff2244, 0.6);
        t.beginPath();
        t.moveTo(vx, vy);

        for (let j = 1; j <= 8; j++) {
          const tx =
            vx + Math.cos(angleBase) * (j * 15) + Math.sin(time * 4 + j) * 10;
          const ty =
            vy + Math.sin(angleBase) * (j * 15) + Math.cos(time * 4 + j) * 8;
          t.lineTo(tx, ty);
        }
        t.strokePath();
      });
    }

    // Parpadeo NEXUS bajo HP
    if (this.nexusHP <= 20 && this.nexusContainer) {
      if (Phaser.Math.Between(0, 10) > 8)
        this.nexusContainer.setAlpha(Phaser.Math.FloatBetween(0.6, 1));
      else this.nexusContainer.setAlpha(1);
    }
  }
}
