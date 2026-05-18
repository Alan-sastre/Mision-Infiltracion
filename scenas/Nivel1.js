class Nivel1 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel1" });
    this.score = 0;
    this.capaActual = 1;
    this.isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(
      navigator.userAgent,
    );
  }

  preload() {
    // Los sonidos se cargarán cuando los archivos existan en assets/sounds/
    // Por ahora se omiten para evitar errores 404 en consola
    /*
    this.load.audio("error", "assets/sounds/error.mp3");
    this.load.audio("success", "assets/sounds/success.mp3");
    this.load.audio("win", "assets/sounds/win.mp3");
    */
  }

  create() {
    this.musicManager = MusicManager.getInstance();
    this.setupBackground();
    this.setupNexusEye();
    this.iniciarCapa1();
  }

  setupBackground() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x030508);

    // Estrellas sutiles
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 0.3);
    for (let i = 0; i < 50; i++) {
      graphics.fillCircle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        1,
      );
    }
  }

  setupNexusEye() {
    const { width } = this.scale;
    this.nexusEye = this.add.container(width - 50, 50);
    const bg = this.add.graphics();
    bg.lineStyle(2, 0xff2244, 0.8);
    bg.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i * 60 * (Math.PI / 180);
      const x = Math.cos(angle) * 20;
      const y = Math.sin(angle) * 20;
      if (i === 0) bg.moveTo(x, y);
      else bg.lineTo(x, y);
    }
    bg.closePath();
    bg.strokePath();

    const iris = this.add.circle(0, 0, 8, 0xff2244);
    this.nexusEye.add([bg, iris]);

    this.tweens.add({
      targets: iris,
      scale: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  clearScreen(callback) {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      if (this.currentLayerContainer) this.currentLayerContainer.destroy();
      this.cameras.main.fadeIn(500, 0, 0, 0);
      callback();
    });
  }

  updateScore(points) {
    this.score += points;
  }

  playSound(key, volume = 0.5) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, { volume });
    }
  }

  updateText(line1, line2, line3 = "", color3 = "#ffffff") {
    if (this.textLine1) this.textLine1.destroy();
    if (this.textLine2) this.textLine2.destroy();
    if (this.textLine3) this.textLine3.destroy();

    const { width } = this.scale;
    this.textLine1 = this.add
      .text(width / 2, 40, line1, {
        font: "bold 28px Orbitron",
        fill: "#00BFFF",
      })
      .setOrigin(0.5);
    this.textLine2 = this.add
      .text(width / 2, 80, line2, { font: "18px Rajdhani", fill: "#ffffff" })
      .setOrigin(0.5);
    this.textLine3 = this.add
      .text(width / 2, 120, line3, { font: "bold 20px Rajdhani", fill: color3 })
      .setOrigin(0.5);

    this.currentLayerContainer.add([
      this.textLine1,
      this.textLine2,
      this.textLine3,
    ]);
  }

  showBriefDialogue(personaje, texto) {
    const { width, height } = this.scale;
    const color = personaje === "BYTE" ? "#00FF88" : "#00BFFF";
    const diag = this.add
      .text(20, height - 40, `${personaje}: ${texto}`, {
        font: "16px Rajdhani",
        fill: color,
        backgroundColor: "#00000088",
        padding: { x: 10, y: 5 },
      })
      .setAlpha(0);

    this.currentLayerContainer.add(diag);
    this.tweens.add({
      targets: diag,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        this.time.delayedCall(4000, () => {
          if (diag.active)
            this.tweens.add({
              targets: diag,
              alpha: 0,
              duration: 500,
              onComplete: () => diag.destroy(),
            });
        });
      },
    });
  }

  // --- CAPA 1 ---
  iniciarCapa1() {
    this.currentLayerContainer = this.add.container(0, 0);
    this.updateText(
      "AUTENTICACIÓN CM-7",
      "Arrastra los comandos en el orden correcto",
    );
    this.showBriefDialogue(
      "BYTE",
      "Ordena los comandos. Cada uno depende del anterior.",
    );

    const { width, height } = this.scale;

    const comandosData = [
      { id: 1, name: "PING", desc: "Verificar conexión" },
      { id: 2, name: "HANDSHAKE", desc: "Iniciar protocolo" },
      { id: 3, name: "TOKEN", desc: "Enviar credencial" },
      { id: 4, name: "VERIFICAR", desc: "Confirmar acceso" },
      { id: 5, name: "ABRIR", desc: "Ejecutar apertura" },
    ];

    // Slots
    this.slots = [];
    const slotY = height * 0.7;
    const spacing = 180;
    const startX = (width - spacing * 4) / 2;

    for (let i = 0; i < 5; i++) {
      const slot = this.add.container(startX + i * spacing, slotY);
      const bg = this.add.graphics();
      bg.lineStyle(2, 0x1a3a5a, 1);
      bg.strokeRect(-80, -35, 160, 70);
      const num = this.add
        .text(0, 0, (i + 1).toString(), {
          font: "bold 32px Orbitron",
          fill: "#1A3A5A",
        })
        .setOrigin(0.5);
      slot.add([bg, num]);
      slot.order = i + 1;
      slot.isOccupied = false;
      this.slots.push(slot);
      this.currentLayerContainer.add(slot);
    }

    // Flecha indicadora
    const arrow = this.add
      .text(width / 2, height * 0.5, "▼", {
        font: "40px Arial",
        fill: "#1A3A5A",
      })
      .setOrigin(0.5);
    this.currentLayerContainer.add(arrow);

    // Bloques
    this.bloques = [];
    const poolY = height * 0.3;
    const shuffled = [...comandosData].sort(() => Math.random() - 0.5);

    shuffled.forEach((data, i) => {
      const bloque = this.crearBloque(startX + i * spacing, poolY, data);
      this.bloques.push(bloque);
      this.currentLayerContainer.add(bloque);
    });
  }

  crearBloque(x, y, data) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a1628, 1);
    bg.fillRoundedRect(-80, -35, 160, 70, 8);
    bg.lineStyle(2, 0x00bfff, 1);
    bg.strokeRoundedRect(-80, -35, 160, 70, 8);

    const nameTxt = this.add
      .text(0, -10, data.name, { font: "bold 18px Orbitron", fill: "#ffffff" })
      .setOrigin(0.5);
    const descTxt = this.add
      .text(0, 15, data.desc, { font: "12px Rajdhani", fill: "#00BFFF" })
      .setOrigin(0.5);

    container.add([bg, nameTxt, descTxt]);
    container.setSize(160, 70);
    container.setInteractive({ draggable: true });
    container.customData = data;
    container.originalX = x;
    container.originalY = y;

    container.on("drag", (pointer, dragX, dragY) => {
      container.x = dragX;
      container.y = dragY;
    });

    container.on("dragend", () => {
      let placed = false;
      for (let slot of this.slots) {
        const dist = Phaser.Math.Distance.Between(
          container.x,
          container.y,
          slot.x,
          slot.y,
        );
        if (dist < 60 && !slot.isOccupied) {
          // Validar orden
          if (container.customData.id === slot.order) {
            this.placeBloque(container, slot);
            placed = true;
          } else {
            this.failBloque(container, slot);
          }
          break;
        }
      }
      if (!placed) {
        this.tweens.add({
          targets: container,
          x: container.originalX,
          y: container.originalY,
          duration: 300,
          ease: "Back.easeOut",
        });
      }
    });

    return container;
  }

  placeBloque(bloque, slot) {
    bloque.x = slot.x;
    bloque.y = slot.y;
    bloque.disableInteractive();
    slot.isOccupied = true;
    this.score += 60;
    this.playSound("success", 0.5);

    // Flash verde
    const flash = this.add.rectangle(slot.x, slot.y, 160, 70, 0x00ff88, 0.4);
    this.time.delayedCall(200, () => flash.destroy());

    if (this.slots.every((s) => s.isOccupied)) {
      this.finalizarCapa1();
    }
  }

  failBloque(bloque, slot) {
    this.playSound("error", 0.5);
    this.updateText(
      "AUTENTICACIÓN CM-7",
      "Arrastra los comandos en el orden correcto",
      "INCORRECTO — revisa las dependencias",
      "#FF2244",
    );

    // Shake slot
    this.tweens.add({
      targets: slot,
      x: slot.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
    });

    // Flash rojo
    const flash = this.add.rectangle(slot.x, slot.y, 160, 70, 0xff2244, 0.4);
    this.time.delayedCall(200, () => flash.destroy());

    this.tweens.add({
      targets: bloque,
      x: bloque.originalX,
      y: bloque.originalY,
      duration: 300,
      ease: "Back.easeOut",
    });
  }

  finalizarCapa1() {
    this.updateText(
      "AUTENTICACIÓN CM-7",
      "Arrastra los comandos en el orden correcto",
      "SECUENCIA VALIDADA",
      "#00FF88",
    );

    // Cascada de flashes
    this.slots.forEach((slot, i) => {
      this.time.delayedCall(i * 150, () => {
        const f = this.add.rectangle(slot.x, slot.y, 160, 70, 0x00ff88, 0.6);
        this.time.delayedCall(100, () => f.destroy());
      });
    });

    this.time.delayedCall(1500, () => {
      this.clearScreen(() => this.iniciarCapa2());
    });
  }

  // --- CAPA 2 ---
  iniciarCapa2() {
    this.capaActual = 2;
    this.currentLayerContainer = this.add.container(0, 0);
    this.updateText(
      "PATRÓN DE SEGURIDAD CM-7",
      "Une los puntos para replicar la clave de acceso",
    );
    this.showBriefDialogue(
      "BYTE",
      "He interceptado el patrón. Sigue la secuencia en el panel.",
    );

    const { width, height } = this.scale;

    // Grid de puntos
    this.dots = [];
    this.targetPattern = [0, 1, 4, 3, 6, 7, 8]; // Patrón en forma de S/Z
    this.playerPattern = [];
    this.isDrawing = false;

    const spacing = 120;
    const startX = width / 2 - spacing;
    const startY = height / 2 - spacing + 20;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = startX + col * spacing;
        const y = startY + row * spacing;
        const id = row * 3 + col;

        const dot = this.add.circle(x, y, 15, 0x1a3a5a);
        dot.setStrokeStyle(2, 0x00bfff);
        dot.setInteractive();
        dot.id = id;

        this.dots.push(dot);
        this.currentLayerContainer.add(dot);

        dot.on("pointerover", () => this.handleDotOver(dot));
        dot.on("pointerdown", () => {
          this.isDrawing = true;
          this.handleDotOver(dot);
        });
      }
    }

    this.input.on("pointerup", () => {
      if (this.isDrawing) {
        this.checkPattern();
        this.isDrawing = false;
      }
    });

    this.patternGraphics = this.add.graphics();
    this.currentLayerContainer.add(this.patternGraphics);

    // Mostrar patrón objetivo brevemente
    this.mostrarPatronObjetivo();
  }

  mostrarPatronObjetivo() {
    this.patternGraphics.clear();
    this.patternGraphics.lineStyle(4, 0x00ff88, 0.5);
    
    this.targetPattern.forEach((dotId, index) => {
      const dot = this.dots[dotId];
      this.tweens.add({
        targets: dot,
        scale: 1.5,
        duration: 200,
        yoyo: true,
        delay: index * 200
      });

      if (index > 0) {
        const prevDot = this.dots[this.targetPattern[index - 1]];
        this.time.delayedCall(index * 200, () => {
          this.patternGraphics.lineBetween(prevDot.x, prevDot.y, dot.x, dot.y);
        });
      }
    });

    this.time.delayedCall(this.targetPattern.length * 200 + 500, () => {
      this.patternGraphics.clear();
    });
  }

  handleDotOver(dot) {
    if (!this.isDrawing) return;
    if (this.playerPattern.includes(dot.id)) return;

    // Solo permitir conectar si es el siguiente en el patrón o si es el primero
    this.playerPattern.push(dot.id);
    dot.setFillStyle(0x00bfff);
    this.playSound("success", 0.3);

    this.drawPlayerPattern();
  }

  drawPlayerPattern() {
    this.patternGraphics.clear();
    this.patternGraphics.lineStyle(4, 0x00bfff, 1);
    
    if (this.playerPattern.length > 1) {
      for (let i = 1; i < this.playerPattern.length; i++) {
        const p1 = this.dots[this.playerPattern[i - 1]];
        const p2 = this.dots[this.playerPattern[i]];
        this.patternGraphics.lineBetween(p1.x, p1.y, p2.x, p2.y);
      }
    }
  }

  checkPattern() {
    const isCorrect = JSON.stringify(this.playerPattern) === JSON.stringify(this.targetPattern);

    if (isCorrect) {
      this.finalizarCapa2();
    } else {
      this.failPattern();
    }
  }

  failPattern() {
    this.playSound("error", 0.5);
    this.cameras.main.shake(200, 0.01);
    this.updateText("PATRÓN DE SEGURIDAD CM-7", "Une los puntos para replicar la clave de acceso", "PATRÓN INCORRECTO — REINTENTANDO", "#FF2244");
    
    this.patternGraphics.clear();
    this.patternGraphics.lineStyle(4, 0xff2244, 1);
    this.drawPlayerPattern();

    this.time.delayedCall(500, () => {
      this.playerPattern = [];
      this.dots.forEach(d => {
        d.setFillStyle(0x1a3a5a);
        d.setScale(1);
      });
      this.patternGraphics.clear();
      this.mostrarPatronObjetivo();
    });
  }

  finalizarCapa2() {
    this.updateText("PATRÓN DE SEGURIDAD CM-7", "Acceso concedido", "SISTEMA DESBLOQUEADO", "#00FF88");
    this.playSound("win");
    
    this.dots.forEach(d => d.setFillStyle(0x00ff88));
    this.patternGraphics.clear();
    this.patternGraphics.lineStyle(4, 0x00ff88, 1);
    this.drawPlayerPattern();

    this.time.delayedCall(2000, () => this.pantallaFinal());
  }

  pantallaFinal() {
    this.clearScreen(() => {
      const { width, height } = this.scale;
      this.add
        .text(width / 2, height / 2 - 40, "ACCESO CONCEDIDO", {
          font: "bold 48px Orbitron",
          fill: "#00FF88",
        })
        .setOrigin(0.5);
      this.add
        .text(width / 2, height / 2 + 20, "KAI está dentro de LEVIATHAN-X", {
          font: "24px Rajdhani",
          fill: "#ffffff",
        })
        .setOrigin(0.5);
      this.add
        .text(width / 2, height / 2 + 70, `SCORE FINAL: ${this.score}`, {
          font: "bold 32px Rajdhani",
          fill: "#00BFFF",
        })
        .setOrigin(0.5);

      this.time.delayedCall(3000, () => {
        this.scene.start("scenaVideo2");
      });
    });
  }

  update(time) {
    // No es necesario actualizar nada en cada frame para esta mecánica
  }
}

window.Nivel1 = Nivel1;
