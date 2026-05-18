class Nivel2 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel2" });
    this.score = 0;
    this.piecesPlaced = 0;
    this.errors = 0;
    this.isLevelComplete = false;
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

    // Grupos y contenedores
    this.backgroundLayer = this.add.container(0, 0);
    this.deviceLayer = this.add.container(0, 0);
    this.piecesLayer = this.add.container(0, 0);
    this.uiLayer = this.add.container(0, 0);

    this.setupBackground();
    this.setupNexusEye();
    this.setupHUD();
    this.setupDeviceScheme();
    this.spawnPieces();

    // Intro Dialogue
    this.showBriefDialogue(
      "BYTE",
      "6 piezas. Un solo orden correcto. Los conectores te indican dónde va cada una.",
      3000,
    );

    // Sistema de partículas para la explosión final
    this.particles = this.add.particles(0, 0, "flare", {
      speed: { min: 100, max: 300 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      blendMode: "ADD",
      emitting: false,
    });
  }

  setupBackground() {
    const { width, height } = this.scale;
    const g = this.add.graphics();

    g.fillStyle(0x030508, 1);
    g.fillRect(0, 0, width, height);

    const genX = width / 2;
    const genY = height / 2;

    g.fillStyle(0x0a0a14, 1);
    g.fillEllipse(genX, genY, 400, 450);
    g.lineStyle(2, 0x1a1a2a, 1);
    g.strokeEllipse(genX, genY, 400, 450);

    g.lineStyle(4, 0x333355, 0.5);
    for (let i = 0; i < 5; i++) {
      g.strokeCircle(genX, genY, 50 + i * 40);
    }

    this.generatorLeds = [];
    for (let i = 0; i < 8; i++) {
      const angle = i * (Math.PI / 4);
      const lx = genX + Math.cos(angle) * 180;
      const ly = genY + Math.sin(angle) * 180;
      const led = this.add.circle(lx, ly, 4, 0x00ff44);
      this.generatorLeds.push(led);

      this.tweens.add({
        targets: led,
        alpha: 0.3,
        duration: 500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
      });
    }

    g.lineStyle(15, 0x1a1a2a, 1);
    g.moveTo(100, 0);
    g.lineTo(100, 100);
    g.lineTo(genX - 100, genY - 150);
    g.moveTo(width - 100, 0);
    g.lineTo(width - 100, 100);
    g.lineTo(genX + 100, genY - 150);
    g.moveTo(150, height);
    g.lineTo(150, height - 100);
    g.lineTo(genX - 120, genY + 150);
    g.strokePath();

    g.fillStyle(0x0a0a14, 0.8);
    g.fillRoundedRect(width * 0.2, height * 0.2, width * 0.6, height * 0.6, 20);
    g.lineStyle(2, 0x333344, 1);
    g.strokeRoundedRect(
      width * 0.2,
      height * 0.2,
      width * 0.6,
      height * 0.6,
      20,
    );

    const light = this.add.graphics();
    light.fillGradientStyle(0x444466, 0x444466, 0x000000, 0x000000, 0.2);
    light.fillTriangle(genX, 0, 0, height, width, height);
    light.setAlpha(0.2);

    this.time.addEvent({
      delay: 2000,
      callback: () => {
        if (this.isLevelComplete) return;
        const sx = Phaser.Math.Between(0, width);
        const sy = Phaser.Math.Between(0, height);
        const spark = this.add.star(sx, sy, 5, 2, 5, 0xffffff);
        this.tweens.add({
          targets: spark,
          alpha: 0,
          scale: 2,
          duration: 200,
          onComplete: () => spark.destroy(),
        });
      },
      loop: true,
    });

    this.backgroundLayer.add([g, light]);
  }

  setupNexusEye() {
    const { width } = this.scale;
    this.nexusContainer = this.add.container(width - 60, 60);

    const bg = this.add.graphics();
    bg.lineStyle(2, 0xff2244, 0.5);
    bg.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i * 60 * (Math.PI / 180);
      const x = Math.cos(angle) * 30;
      const y = Math.sin(angle) * 30;
      if (i === 0) bg.moveTo(x, y);
      else bg.lineTo(x, y);
    }
    bg.closePath();
    bg.strokePath();

    this.eyeIris = this.add.graphics();
    this.eyeIris.fillStyle(0xff2244, 1);
    this.eyeIris.fillCircle(0, 0, 5);

    this.nexusContainer.add([bg, this.eyeIris]);
    this.uiLayer.add(this.nexusContainer);

    this.tweens.add({
      targets: this.eyeIris,
      scale: 1.5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });
  }

  setupHUD() {
    const { width } = this.scale;
    const styleHUD = { font: "bold 16px Orbitron", fill: "#00BFFF" };

    this.hudLeft = this.add.text(
      20,
      20,
      "NAVE: LEVIATHAN-X | SALA DEL GENERADOR",
      styleHUD,
    );
    this.hudRight = this.add
      .text(width - 20, 20, "PIEZAS: 0/6 | SCORE: 0", styleHUD)
      .setOrigin(1, 0);

    this.feedbackText = this.add
      .text(width / 2, 450, "", { font: "bold 24px Rajdhani", fill: "#FFFFFF" })
      .setOrigin(0.5)
      .setAlpha(0);

    this.uiLayer.add([this.hudLeft, this.hudRight, this.feedbackText]);
  }

  updateHUD() {
    this.hudRight.setText(
      `PIEZAS: ${this.piecesPlaced}/6 | SCORE: ${this.score}`,
    );
  }

  showFeedback(text, color = "#FFFFFF") {
    this.feedbackText.setText(text).setColor(color).setAlpha(1);
    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      duration: 2000,
      delay: 1000,
    });
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
        font: "16px Rajdhani",
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
      onComplete: () => {
        this.time.delayedCall(duration, () => {
          if (diag.active) {
            this.tweens.add({
              targets: diag,
              alpha: 0,
              duration: 500,
              onComplete: () => diag.destroy(),
            });
          }
        });
      },
    });
  }

  setupDeviceScheme() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    const spacing = 115;
    this.slotPositions = [
      {
        x: centerX,
        y: centerY - spacing,
        id: 1,
        label: "INICIADOR",
        desc: "dispara la secuencia",
        type: "A",
      },
      {
        x: centerX - spacing,
        y: centerY,
        id: 2,
        label: "AMPLIFICADOR",
        desc: "aumenta la señal",
        type: "B",
      },
      {
        x: centerX,
        y: centerY,
        id: 3,
        label: "NÚCLEO",
        desc: "genera el pulso",
        type: "C",
      },
      {
        x: centerX + spacing,
        y: centerY,
        id: 4,
        label: "ESTABILIZADOR",
        desc: "regula el pulso",
        type: "D",
      },
      {
        x: centerX,
        y: centerY + spacing,
        id: 5,
        label: "CONDUCTOR",
        desc: "transmite la carga",
        type: "E",
      },
      {
        x: centerX,
        y: centerY + spacing * 1.8,
        id: 6,
        label: "DETONADOR",
        desc: "activa la carga final",
        type: "F",
      },
    ];

    this.slots = [];
    this.cables = [];

    this.cableGraphics = this.add.graphics();
    this.cableGraphics.lineStyle(3, 0x333344, 1);

    const connections = [
      [0, 2],
      [1, 2],
      [3, 2],
      [2, 4],
      [4, 5],
    ];
    connections.forEach((conn) => {
      const p1 = this.slotPositions[conn[0]];
      const p2 = this.slotPositions[conn[1]];
      this.cableGraphics.moveTo(p1.x, p1.y);
      this.cableGraphics.lineTo(p2.x, p2.y);
      this.cables.push({
        p1,
        p2,
        from: conn[0] + 1,
        to: conn[1] + 1,
        active: false,
      });
    });
    this.cableGraphics.strokePath();
    this.deviceLayer.add(this.cableGraphics);

    this.slotPositions.forEach((pos) => {
      const slot = this.add.container(pos.x, pos.y);
      const bg = this.add.graphics();
      bg.fillStyle(0x1a1a1a, 0.6);
      bg.lineStyle(1, 0x444444, 1);
      this.drawPieceShape(bg, pos.type, true);

      const label = this.add
        .text(0, 55, pos.label, {
          font: "bold 11px monospace",
          fill: "#888888",
        })
        .setOrigin(0.5);
      const subLabel = this.add
        .text(0, 68, pos.desc, { font: "9px monospace", fill: "#555555" })
        .setOrigin(0.5);

      const connectors = this.add.graphics();
      connectors.lineStyle(1, 0xffd700, 0.4);
      this.drawConnectors(connectors, pos.type, false);

      slot.add([bg, label, subLabel, connectors]);
      slot.posData = pos;
      slot.isOccupied = false;
      this.slots.push(slot);
      this.deviceLayer.add(slot);
    });
  }

  spawnPieces() {
    const { width, height } = this.scale;
    const piecesData = [
      { id: 1, type: "A", name: "INICIADOR", color: 0x0044ff },
      { id: 2, type: "B", name: "AMPLIFICADOR", color: 0xff6600 },
      { id: 3, type: "C", name: "NÚCLEO", color: 0xff2244 },
      { id: 4, type: "D", name: "ESTABILIZADOR", color: 0x00aa44 },
      { id: 5, type: "E", name: "CONDUCTOR", color: 0xffaa00 },
      { id: 6, type: "F", name: "DETONADOR", color: 0xff0000 },
    ];

    piecesData.forEach((data) => {
      let px, py;
      if (Math.random() > 0.5) {
        px = Math.random() > 0.5 ? 80 : width - 80;
        py = Phaser.Math.Between(100, height - 100);
      } else {
        px = Phaser.Math.Between(100, width - 100);
        py = Math.random() > 0.5 ? 80 : height - 80;
      }
      const piece = this.createPiece(px, py, data);
      this.piecesLayer.add(piece);
    });
  }

  createPiece(x, y, data) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();
    this.drawDetailedPiece(g, data, container);
    container.add(g);
    container.setSize(70, 70);
    container.setInteractive({ draggable: true });
    container.pieceData = data;
    container.originalX = x;
    container.originalY = y;

    container.on("pointerover", () => {
      if (container.isFixed) return;
      this.showTooltip(container, data.name);
    });
    container.on("pointerout", () => this.hideTooltip());
    container.on("drag", (pointer, dragX, dragY) => {
      if (container.isFixed) return;
      container.x = dragX;
      container.y = dragY;
      this.checkSlotHover(container);
    });
    container.on("dragend", () => {
      if (container.isFixed) return;
      this.handlePieceDrop(container);
    });
    return container;
  }

  drawPieceShape(g, type, isSlot = false) {
    if (isSlot) g.lineStyle(1, 0x444444, 1);
    const size = 45;
    switch (type) {
      case "A":
        g.fillEllipse(0, 0, size * 0.8, size * 1.4);
        g.strokeEllipse(0, 0, size * 0.8, size * 1.4);
        break;
      case "B":
        g.beginPath();
        g.moveTo(-size, size * 0.4);
        g.lineTo(size, size * 0.4);
        g.lineTo(size * 0.7, -size * 0.4);
        g.lineTo(-size * 0.7, -size * 0.4);
        g.closePath();
        g.fillPath();
        g.strokePath();
        break;
      case "C":
        this.drawPolygon(g, 6, size);
        break;
      case "D":
        g.beginPath();
        g.moveTo(-size, -size * 0.4);
        g.lineTo(size, -size * 0.4);
        g.lineTo(size, size * 0.4);
        g.lineTo(-size, size * 0.4);
        g.closePath();
        g.fillPath();
        g.strokePath();
        break;
      case "E":
        g.beginPath();
        g.arc(0, 0, size * 0.7, -Math.PI / 2, Math.PI / 2, false);
        g.lineTo(size * 0.4, size * 0.7);
        g.arc(0, 0, size * 0.4, Math.PI / 2, -Math.PI / 2, true);
        g.closePath();
        g.fillPath();
        g.strokePath();
        break;
      case "F":
        this.drawPolygon(g, 8, size);
        break;
    }
  }

  drawConnectors(g, type, active = false) {
    const color = active ? 0x00ff44 : 0xffd700;
    const alpha = active ? 1 : 0.4;
    const size = 45;
    g.fillStyle(color, alpha);
    switch (type) {
      case "A":
        this.drawPin(g, 0, size * 0.7);
        break;
      case "B":
        this.drawPin(g, -size, 0);
        this.drawPin(g, size, 0);
        break;
      case "C":
        this.drawPin(g, -size, 0);
        this.drawPin(g, size, 0);
        this.drawPin(g, 0, size);
        break;
      case "D":
        this.drawPin(g, -size, 0);
        break;
      case "E":
        this.drawPin(g, 0, -size * 0.6);
        this.drawPin(g, 0, size * 0.6);
        break;
      case "F":
        this.drawPin(g, 0, -size);
        break;
    }
  }

  drawPin(g, x, y) {
    g.fillCircle(x, y, 5);
    g.lineStyle(1, 0xffffff, 0.5);
    g.strokeCircle(x, y, 5);
  }

  drawDetailedPiece(g, data, container) {
    const type = data.type;
    const size = 45;
    switch (type) {
      case "A":
        for (let i = 0; i < 15; i++) {
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0x0033cc),
            Phaser.Display.Color.ValueToColor(0x0066ff),
            15,
            i,
          );
          g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
          g.fillEllipse(0, 0, size * 0.8 - i, size * 1.4 - i);
        }
        g.lineStyle(1, 0x002288, 0.5);
        for (let i = -size * 0.6; i < size * 0.6; i += 6) {
          g.moveTo(-size * 0.4, i);
          g.lineTo(size * 0.4, i);
        }
        g.strokePath();
        g.fillStyle(0xaaaaaa, 1);
        g.fillEllipse(0, -size * 0.7, size * 0.8, size * 0.3);
        g.fillStyle(0x444444, 1);
        for (let i = 0; i < 4; i++) {
          const angle = (i * 90 * Math.PI) / 180;
          g.fillCircle(
            Math.cos(angle) * (size * 0.3),
            -size * 0.7 + Math.sin(angle) * 3,
            3,
          );
        }
        this.drawPin(g, 0, size * 0.7);
        break;
      case "B":
        g.fillGradientStyle(0xcc4400, 0xff8800, 0xcc4400, 0xff8800, 1);
        g.beginPath();
        g.moveTo(-size, size * 0.4);
        g.lineTo(size, size * 0.4);
        g.lineTo(size * 0.7, -size * 0.4);
        g.lineTo(-size * 0.7, -size * 0.4);
        g.closePath();
        g.fillPath();
        g.lineStyle(1, 0x000000, 0.3);
        for (let i = -size * 0.4; i < size * 0.4; i += 5) {
          g.moveTo(i, -size * 0.3);
          g.lineTo(i, size * 0.3);
        }
        g.strokePath();
        g.fillStyle(0xff6600, 1);
        g.fillCircle(0, size * 0.2, 4);
        this.drawPin(g, -size, 0);
        this.drawPin(g, size, 0);
        break;
      case "C":
        g.fillStyle(0xaa0022, 1);
        this.drawPolygon(g, 6, size);
        g.fillStyle(0xff2244, 1);
        this.drawPolygon(g, 6, size * 0.8);
        g.fillStyle(0x000000, 1);
        g.fillCircle(0, 0, size * 0.4);
        g.fillStyle(0xff4444, 1);
        g.fillCircle(0, 0, 5);
        const coreTxt = this.add
          .text(0, -size * 0.6, "CORE-7", {
            font: "bold 10px Rajdhani",
            fill: "#FFFFFF",
          })
          .setOrigin(0.5);
        container.add(coreTxt);
        this.drawPin(g, -size, 0);
        this.drawPin(g, size, 0);
        this.drawPin(g, 0, size);
        break;
      case "D":
        g.fillGradientStyle(0x006622, 0x00aa44, 0x006622, 0x00aa44, 1);
        g.beginPath();
        g.moveTo(-size, -size * 0.4);
        g.lineTo(size * 0.8, -size * 0.4);
        g.lineTo(size, -size * 0.3);
        g.lineTo(size, size * 0.3);
        g.lineTo(size * 0.8, size * 0.4);
        g.lineTo(-size, size * 0.4);
        g.closePath();
        g.fillPath();
        g.lineStyle(2, 0x003311, 0.5);
        g.moveTo(-size * 0.6, -size * 0.15);
        g.lineTo(size * 0.6, -size * 0.15);
        g.moveTo(-size * 0.6, 0);
        g.lineTo(size * 0.6, 0);
        g.moveTo(-size * 0.6, size * 0.15);
        g.lineTo(size * 0.6, size * 0.15);
        g.strokePath();
        this.drawPin(g, -size, 0);
        break;
      case "E":
        g.lineStyle(15, 0xaa7700, 1);
        g.beginPath();
        g.arc(0, 0, size * 0.5, -Math.PI / 2, Math.PI / 2, false);
        g.strokePath();
        g.lineStyle(1, 0xffd700, 0.2);
        for (let i = -size * 0.5; i < size * 0.5; i += 3) {
          g.moveTo(-size * 0.1, i);
          g.lineTo(size * 0.1, i);
        }
        g.strokePath();
        g.fillStyle(0x000000, 1);
        g.fillCircle(0, -size * 0.5, 7);
        g.fillCircle(0, size * 0.5, 7);
        this.drawPin(g, 0, -size * 0.5);
        this.drawPin(g, 0, size * 0.5);
        break;
      case "F":
        g.lineStyle(5, 0x000000, 1);
        g.fillStyle(0xcc0000, 1);
        this.drawPolygon(g, 8, size);
        g.lineStyle(3, 0xffff00, 1);
        g.beginPath();
        g.moveTo(0, -size * 0.4);
        g.lineTo(size * 0.3, size * 0.15);
        g.lineTo(-size * 0.3, size * 0.15);
        g.closePath();
        g.strokePath();
        g.fillStyle(0xffff00, 1);
        g.fillCircle(0, 0, 2);
        const armTxt = this.add
          .text(0, size * 0.6, "SAFE", {
            font: "bold 10px Rajdhani",
            fill: "#FFFFFF",
          })
          .setOrigin(0.5);
        container.armText = armTxt;
        container.add(armTxt);
        this.drawPin(g, 0, -size);
        break;
    }
  }

  drawPolygon(g, sides, size) {
    g.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = ((i * 360) / sides) * (Math.PI / 180);
      const px = Math.cos(angle) * size;
      const py = Math.sin(angle) * size;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  showTooltip(container, name) {
    if (this.tooltip) this.tooltip.destroy();
    this.tooltip = this.add
      .text(container.x, container.y - 70, name, {
        font: "bold 15px Rajdhani",
        fill: "#FFFFFF",
        backgroundColor: "#000000AA",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    this.uiLayer.add(this.tooltip);
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }

  checkSlotHover(container) {
    this.slots.forEach((slot) => {
      const dist = Phaser.Math.Distance.Between(
        container.x,
        container.y,
        slot.x,
        slot.y,
      );
      const bg = slot.list[0];
      const connectors = slot.list[3];
      if (dist < 70 && !slot.isOccupied) {
        const isCorrect = slot.posData.id === container.pieceData.id;
        bg.clear();
        bg.fillStyle(isCorrect ? 0x00ff44 : 0xff2244, 0.2);
        this.drawPieceShape(bg, slot.posData.type);
        connectors.clear();
        connectors.lineStyle(2, isCorrect ? 0x00ff44 : 0xff2244, 0.8);
        this.drawConnectors(connectors, slot.posData.type, true);
      } else if (!slot.isOccupied) {
        bg.clear();
        bg.fillStyle(0x1a1a1a, 0.6);
        this.drawPieceShape(bg, slot.posData.type, true);
        connectors.clear();
        connectors.lineStyle(1, 0xffd700, 0.4);
        this.drawConnectors(connectors, slot.posData.type, false);
      }
    });
  }

  handlePieceDrop(container) {
    let placed = false;
    for (let slot of this.slots) {
      const dist = Phaser.Math.Distance.Between(
        container.x,
        container.y,
        slot.x,
        slot.y,
      );
      if (dist < 60 && !slot.isOccupied) {
        if (slot.posData.id === container.pieceData.id) {
          this.placePiece(container, slot);
          placed = true;
          break;
        } else {
          this.errorPiece(container, slot);
          placed = true;
          break;
        }
      }
    }
    if (!placed) {
      this.tweens.add({
        targets: container,
        x: container.originalX,
        y: container.originalY,
        duration: 500,
        ease: "Back.easeOut",
      });
    }
  }

  placePiece(container, slot) {
    container.x = slot.x;
    container.y = slot.y;
    container.isFixed = true;
    slot.isOccupied = true;
    this.piecesPlaced++;
    this.score += 80;
    this.playSound("success");
    this.showFeedback("CONEXIÓN CORRECTA", "#00FF88");
    this.updateHUD();
    const bg = slot.list[0];
    bg.clear();
    bg.lineStyle(3, 0x00ff44, 1);
    this.drawPieceShape(bg, slot.posData.type);
    const connectors = slot.list[3];
    connectors.clear();
    connectors.lineStyle(2, 0x00ff44, 1);
    this.drawConnectors(connectors, slot.posData.type, true);
    this.tweens.add({
      targets: this.eyeIris,
      scale: 1.5 + this.piecesPlaced * 0.5,
      duration: 500,
    });
    if (this.piecesPlaced === 3)
      this.showBriefDialogue("KAI", "Mitad del camino.");
    if (this.piecesPlaced === 6) this.completeLevel();
  }

  errorPiece(container, slot) {
    this.errors++;
    this.score = Math.max(0, this.score - 20);
    this.playSound("error");
    this.showFeedback("PIEZA INCORRECTA — INTENTA OTRA", "#FF2244");
    this.updateHUD();
    this.tweens.add({
      targets: slot,
      x: slot.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        slot.x = slot.posData.x;
        this.tweens.add({
          targets: container,
          x: container.originalX,
          y: container.originalY,
          duration: 500,
          ease: "Back.easeOut",
        });
      },
    });
  }

  completeLevel() {
    this.isLevelComplete = true;
    let bonus = 0;
    if (this.errors === 0) bonus = 300;
    else if (this.errors <= 2) bonus = 150;
    this.score += bonus;
    this.updateHUD();

    // Cambiar SAFE a ARM en la pieza F
    const pieceF = this.piecesLayer.list.find((p) => p.pieceData.id === 6);
    if (pieceF && pieceF.armText) {
      pieceF.armText.setText("ARM").setColor("#FF0000");
    }

    this.showBriefDialogue("KAI", "Listo. Alejémonos de aquí.", 2000);
    this.time.delayedCall(2000, () => {
      this.showBriefDialogue("NEXUS", "¡INTRUSO EN SALA DE GENERADOR!", 2000);
      this.showBriefDialogue("BYTE", "Demasiado tarde, NEXUS.", 2000);
      const alarm = this.add.graphics();
      alarm.fillStyle(0xff0000, 0.2);
      alarm.fillRect(0, 0, this.scale.width, this.scale.height);
      this.tweens.add({
        targets: alarm,
        alpha: 0,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
      this.triggerActivationSequence();
    });
  }

  triggerActivationSequence() {
    const cableAnimDuration = 500;
    const order = [0, 1, 2, 3, 4];
    const cableGraphics = this.add.graphics();
    this.deviceLayer.add(cableGraphics);
    order.forEach((idx, i) => {
      this.time.delayedCall(i * 600, () => {
        const cable = this.cables[idx];
        this.tweens.addCounter({
          from: 0,
          to: 100,
          duration: cableAnimDuration,
          onUpdate: (tween) => {
            const val = tween.getValue() / 100;
            cableGraphics.lineStyle(4, 0x00ffff, val);
            cableGraphics.moveTo(cable.p1.x, cable.p1.y);
            const dx = cable.p2.x - cable.p1.x;
            const dy = cable.p2.y - cable.p1.y;
            cableGraphics.lineTo(cable.p1.x + dx * val, cable.p1.y + dy * val);
            cableGraphics.strokePath();
          },
        });
      });
    });
    this.time.delayedCall(4000, () => {
      this.cameras.main.shake(1000, 0.02);
      this.playSound("win");
      this.showFeedback("GENERADOR SABOTEADO", "#FF0000");
      this.feedbackText.setScale(2);
      this.time.delayedCall(2000, () => {
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("scenaVideo3", { score: this.score });
        });
      });
    });
  }

  playSound(key, volume = 0.5) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, { volume });
    }
  }

  update() {}
}
