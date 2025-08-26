class FlagMemoryScene extends Phaser.Scene {
    constructor() {
        super("FlagMatch");

        this.titleYMargin = 100;
        this.revealLock = false;
        this.firstPick = null;
        this.matches = 0;
        this.focusIndex = 0;
        this.lastPadPress = 0;

        this.cardBorderColor = "0x00ffff";
        this.cardFontColor = "0xff00ff";
    }

    init() {
        const { width, height } = this.scale.gameSize;
        this.calculateVariables(width, height);
    }

    calculateVariables(width, height) {
        this.gridCols = width > height ? 6 : 5;
        this.gridRows = width > height ? 5 : 6;

        this.cardW = width / (this.gridCols + 1);
        this.cardH = (height - this.titleYMargin) / (this.gridRows + 1);
        this.cardXMargin = this.cardW / (this.gridCols + 1);
        this.cardYMargin = this.cardH / (this.gridRows + 1);
    }

    preload() {
        this.loadFlags();
    }

    loadFlags() {
        this.countries = [
            { code: "us", name: "United States" },
            { code: "br", name: "Brazil" },
            { code: "jp", name: "Japan" },
            { code: "de", name: "Germany" },
            { code: "fr", name: "France" },
            { code: "gb", name: "United Kingdom" },
            { code: "ca", name: "Canada" },
            { code: "au", name: "Australia" },
            { code: "it", name: "Italy" },
            { code: "es", name: "Spain" },
            { code: "cn", name: "China" },
            { code: "in", name: "India" },
            { code: "mx", name: "Mexico" },
            { code: "ru", name: "Russia" },
            { code: "za", name: "South Africa" }
        ];

        this.countries.forEach((c) => {
            this.load.image(`flag_${c.code}`, `assets/flags/${c.code}.png`);
        });
    }

    create() {
        this.cameras.main.fadeFrom(2000, Phaser.Math.Between(50, 255), Phaser.Math.Between(50, 255), Phaser.Math.Between(50, 255));

        this.revealedCards = [];
        this.locked = true; // impede cliques até o "preview" acabar

        this.infoText = this.add.text(
            this.cameras.main.centerX,
            50,
            "Flag Match",
            {
                fontFamily: "Arial",
                fontSize: "40px",
                color: "#FFD700",
                fontStyle: "bold",
                align: "center",
                stroke: "#000000",
                strokeThickness: 4,
            }
        ).setOrigin(0.5, );

        this.input.on("pointermove", (p) => {
            this.updateFocusRectWithMouse(p.x, p.y);
        });

        this.pool = [];
        this.countries.forEach((c) => {
            this.pool.push(this.makeFlagCardData(c));
            this.pool.push(this.makeNameCardData(c));
        });

        Phaser.Utils.Array.Shuffle(this.pool);

        this.createFlags();

        this.scale.on("resize", this.handleResize, this);

        this.cameras.main.on(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.restart();
        });
    }

    handleResize(gameSize) {
        const { width, height } = gameSize;

        this.calculateVariables(width, height);

        // Reposiciona cartas
        for (let i = 0; i < this.cards.length; i++) {
            const col = i % this.gridCols;
            const row = Math.floor(i / this.gridCols);

            const x = this.cardXMargin + col * (this.cardW + this.cardXMargin) + this.cardW / 2;
            const y = this.titleYMargin + row * (this.cardH + this.cardYMargin) + this.cardH / 2;

            const card = this.cards[i];
            card.x = x;
            card.y = y;

            card.setPosition(x, y);
            card.setSize(this.cardW, this.cardH);

            // Recria face atual (frente/verso)
            card.removeAll(true);
            card.add(this.createCardContainer(card.data.revealed, card));
        }

        this.infoText.setPosition(width / 2, 50);
        this.focusRect.setSize(this.cardW + 10, this.cardH + 10)
        this.updateFocusRect();
    }

    updateFocusRectWithMouse(x, y) {
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            if (card.getBounds().contains(x, y)) {
                this.focusIndex = i;
                this.focusRect.setPosition(card.x, card.y);
                break;
            }
        }
    }

    createFlags() {
        const total = this.gridCols * this.gridRows;
        this.cards = [];

        for (let i = 0; i < total; i++) {
            const col = i % this.gridCols;
            const row = Math.floor(i / this.gridCols);

            const x = this.cardXMargin + col * (this.cardW + this.cardXMargin) + this.cardW / 2;
            const y = this.titleYMargin + row * (this.cardH + this.cardYMargin) + this.cardH / 2;

            const data = this.pool[i];
            data.x = x;
            data.y = y;

            const card = this.buildCard(data);
            card.index = i;

            // 🔹 Mostra todas como reveladas no início
            card.removeAll(true);
            card.data.revealed = true;
            card.add(this.createFrontContainer(card.data.payload));

            this.cards.push(card);
        }

        this.focusRect = this.add.rectangle(
            0, 0,
            this.cardW + 10,
            this.cardH + 10
        ).setStrokeStyle(3, 0x00ff00).setAlpha(0.9);

        this.updateFocusRect();

        this.input.gamepad.start();
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // 🔹 Espera 4s e vira todas para trás, liberando o jogo
        this.time.delayedCall(4000, async () => {
            await Promise.all(this.cards.map(card => this.flip(card, false)));
            this.locked = false; // agora o jogador pode jogar
        });
    }

    makeFlagCardData(country) {
        return { kind: "flag", country, frameKey: `flag_${country.code}`, x: 0, y: 0 };
    }

    makeNameCardData(country) {
        return { kind: "name", country, frameKey: null, x: 0, y: 0 };
    }

    buildCard(data) {
        const container = this.add.container(data.x, data.y).setDepth(1);
        container.setSize(this.cardW, this.cardH);
        container.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, this.cardW, this.cardH),
            Phaser.Geom.Rectangle.Contains
        );

        container.data = { revealed: false, matched: false, payload: data };

        const back = this.createBackContainer();
        container.add([back]);

        container.on("pointerdown", () => {
            this.tryReveal(container);
        });

        return container;
    }

    createFrontContainer(data) {
        let container;
        try {
            if (data.kind === "flag") {
                const img = new Phaser.GameObjects.Image(this, 0, 0, data.frameKey)
                    .setDisplaySize(this.cardW, this.cardH);

                const border = new Phaser.GameObjects.Rectangle(
                    this, 0, 0, this.cardW, this.cardH, 0
                ).setStrokeStyle(2, Phaser.Display.Color.GetColor(255, 255, 0))
                 .setAlpha(0.3);

                container = new Phaser.GameObjects.Container(this, 0, 0, [border, img]);
                container.flagImage = img;
            } else {
                const rect = new Phaser.GameObjects.Rectangle(
                    this, 0, 0, this.cardW, this.cardH, 0xffffff
                ).setStrokeStyle(2, Phaser.Display.Color.GetColor(255, 255, 0))
                 .setAlpha(0.3);

                const text = new Phaser.GameObjects.Text(this, 0, 0, data.country.name, {
                    fontFamily: "Arial",
                    fontSize: "18px",
                    color: this.cardBorderColor,
                    fontStyle: "bold",
                    align: "center",
                    wordWrap: { width: this.cardW - 20 }
                }).setOrigin(0.5);

                container = new Phaser.GameObjects.Container(this, 0, 0, [rect, text]);
                container.flagImage = null;
            }
        } catch (err) {
            console.error("Erro durante front:", err?.stack || err);
        }
        return container;
    }

    createBackContainer() {
        const rect = new Phaser.GameObjects.Rectangle(
            this, 0, 0, this.cardW, this.cardH, 0xffffff
        ).setStrokeStyle(2, this.cardBorderColor);

        const text = new Phaser.GameObjects.Text(this, 0, 0, "?", {
            fontFamily: "Arial",
            fontSize: 28,
            color: this.cardFontColor,
            fontStyle: "bold"
        }).setOrigin(0.5);

        return new Phaser.GameObjects.Container(this, 0, 0, [rect, text]);
    }

    createCardContainer(revealed, card) {
        return revealed
            ? this.createFrontContainer(card.data.payload)
            : this.createBackContainer();
    }

    async tryReveal(card) {
        if (this.revealLock || card.data.matched || card.data.revealed) return;

        this.revealLock = true;
        await this.flip(card, true);

        if (!this.firstPick) {
            this.firstPick = card;
            this.revealLock = false;
            return;
        }

        const a = this.firstPick.data.payload;
        const b = card.data.payload;
        const sameCountry = a.country.code === b.country.code;
        const differentKind = a.kind !== b.kind;

        if (sameCountry && differentKind) {
            this.firstPick.data.matched = true;
            card.data.matched = true;
            this.matches += 1;
            this.firstPick = null;
        } else {
            await this.delay(500);
            await this.flip(this.firstPick, false);
            await this.flip(card, false);
            this.firstPick = null;
        }

        this.revealLock = false;

        if (this.matches === this.countries.length) {
            this.time.delayedCall(350, () => {
                this.infoText.setText("✔ Congratulations. You are the best!");
            });
        }
    }

    flip(card, reveal) {
        return new Promise((resolve) => {
            this.tweens.add({
                targets: card,
                scaleX: 0,
                duration: 120,
                onComplete: () => {
                    card.removeAll(true);
                    card.data.revealed = reveal;
                    card.add(this.createCardContainer(reveal, card));
                    this.tweens.add({
                        targets: card,
                        scaleX: 1,
                        duration: 50,
                        onComplete: resolve
                    });
                }
            });
        });
    }

    delay(ms) {
        return new Promise((res) => {
            this.time.delayedCall(ms, () => res());
        });
    }

    update(time) {
        if (this.input.gamepad.total) {
            const pad = this.input.gamepad.getPad(0);
            if (this.gamepadMoveOnce(pad, time)) this.updateFocusRect();

            if ((pad.A || (pad.buttons[0] && pad.buttons[0].pressed)) &&
                time - this.lastPadPress > 120) {
                this.lastPadPress = time;
                this.tryReveal(this.cards[this.focusIndex]);
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.moveFocus(-1, 0);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.moveFocus(1, 0);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.moveFocus(0, -1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.moveFocus(0, 1);

        if (Phaser.Input.Keyboard.JustDown(this.keyEnter) ||
            Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            this.tryReveal(this.cards[this.focusIndex]);
        }
    }

    gamepadMoveOnce(pad, time) {
        const threshold = 0.3;
        const hor = Math.abs(pad.axes.length ? pad.axes[0].getValue() : 0) > threshold;
        const ver = Math.abs(pad.axes.length ? pad.axes[1].getValue() : 0) > threshold;

        if (time - this._lastMoveAt < 150) return false;

        if (hor || ver || pad.left || pad.right || pad.up || pad.down) {
            if (pad.left || (pad.axes[0] && pad.axes[0].getValue() < -0.3))
                this.moveFocus(-1, 0);
            if (pad.right || (pad.axes[0] && pad.axes[0].getValue() > threshold))
                this.moveFocus(1, 0);
            if (pad.up || (pad.axes[1] && pad.axes[1].getValue() < -0.3))
                this.moveFocus(0, -1);
            if (pad.down || (pad.axes[1] && pad.axes[1].getValue() > threshold))
                this.moveFocus(0, 1);

            this._lastMoveAt = time;
            return true;
        }

        return false;
    }

    moveFocus(dx, dy) {
        const col = this.focusIndex % this.gridCols;
        const row = Math.floor(this.focusIndex / this.gridCols);

        const newCol = Phaser.Math.Clamp(col + dx, 0, this.gridCols - 1);
        const newRow = Phaser.Math.Clamp(row + dy, 0, this.gridRows - 1);

        this.focusIndex = newRow * this.gridCols + newCol;
        this.updateFocusRect();
    }

    updateFocusRect() {
        const card = this.cards[this.focusIndex];
        if (card) {
            this.focusRect.setPosition(card.x, card.y);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    backgroundColor: Phaser.Display.Color.GetColor(10, 77, 129),
    parent: "flag-match",
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: { gamepad: true },
    scene: [FlagMemoryScene]
};

new Phaser.Game(config);
