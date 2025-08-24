class FlagMemory extends Phaser.Scene {
    constructor() {
        super("FlagMemory");
        this.gridCols = 4;     // 4 x 3 = 12 cartas = 6 pares
        this.gridRows = 3;
        this.cardW = 140;
        this.cardH = 90;
        this.cardMargin = 24;
        this.revealLock = false;
        this.firstPick = null;
        this.matches = 0;
        this.focusIndex = 0;   // seleção do cursor (joystick/teclado)
        this.lastPadPress = 0; // debouncing
    }

    preload() {
        // this.load.image("background", "assets/background.png");
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
        ];

        this.countries.forEach(c =>
            this.load.image(`flag_${c.code}`, `assets/flags/${c.code}.png`)
        );
    }

    create() {
        // this.background = this.add.image(0, 0, 'background').setOrigin(0, 0);

        // Centraliza o título "Flag Matcher"
        this.infoText = this.add.text(this.cameras.main.centerX, 50, "Flag Matcher", {
            fontFamily: "Arial",
            fontSize: "40px", // Aumenta o tamanho da fonte
            color: "#00ffff",
            fontStyle: "bold",
            align: "center",
            stroke: "#000000", // Adiciona uma borda preta
            strokeThickness: 4, // Espessura da borda
        }).setOrigin(0.5); // Centraliza o texto

        this.input.on('pointermove', (pointer) => {
            this.updateFocusRectWithMouse(pointer.x, pointer.y);
        });

        this.createFlags();
    }

    updateFocusRectWithMouse(mouseX, mouseY) {
        // Verifica se o mouse está sobre algum cartão
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            if (card.getBounds().contains(mouseX, mouseY)) {
                this.focusIndex = i; // Atualiza o índice de foco
                this.focusRect.setPosition(card.x, card.y); // Atualiza a posição do retângulo de foco
                break; // Sai do loop assim que encontrar um cartão
            }
        }
    }

    createFlags() {
        const cards = [];
        this.countries.forEach(c => {
            cards.push(this.makeFlagCardData(c));
            cards.push(this.makeNameCardData(c));
        });

        Phaser.Utils.Array.Shuffle(cards);

        const total = this.gridCols * this.gridRows;
        this.cards = [];
        const startX = (config.width - (this.gridCols * this.cardW + (this.gridCols - 1) * this.cardMargin)) / 2;
        const startY = (config.height - (this.gridRows * this.cardH + (this.gridRows - 1) * this.cardMargin)) / 2 + 20;

        for (let i = 0; i < total; i++) {
            const col = i % this.gridCols;
            const row = Math.floor(i / this.gridCols);
            const x = startX + col * (this.cardW + this.cardMargin) + this.cardW / 2;
            const y = startY + row * (this.cardH + this.cardMargin) + this.cardH / 2;

            const data = cards[i];
            data.x = x;
            data.y = y;

            const card = this.buildCard(data);
            card.index = i;
            this.cards.push(card);
        }

        this.focusRect = this.add.rectangle(0, 0, this.cardW + 10, this.cardH + 10)
            .setStrokeStyle(3, 0x00ff00)
            .setAlpha(0.9);
        this.updateFocusRect();

        this.input.gamepad.start();
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    makeFlagCardData(c, x, y) {
        return { kind: "flag", country: c, frameKey: `flag_${c.code}`, x: 0, y: 0 };
    }

    makeNameCardData(c, x, y) {
        return { kind: "name", country: c, frameKey: null, x: 0, y: 0 };
    }

    buildCard(data) {
        const container = this.add.container(data.x, data.y).setDepth(1);
        container.setSize(this.cardW, this.cardH);
        container.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, this.cardW, this.cardH),
            Phaser.Geom.Rectangle.Contains
        );

        container.data = {
            revealed: false,
            matched: false,
            payload: data,
        };

        const backContainer = this.createBackContainer();
        container.add([backContainer]);

        container.on("pointerdown", () => {
            this.tryReveal(container);
        });

        return container;
    }

    createFrontContainer(data) {
        let frontContainer;
        try {
            if (data.kind === "flag") {
                const img = new Phaser.GameObjects.Image(this, 0, 0, data.frameKey)
                    .setDisplaySize(this.cardW, this.cardH);

                const frame = new Phaser.GameObjects.Rectangle(this, 0, 0, this.cardW, this.cardH, 0x000000)
                    .setStrokeStyle(2, Phaser.Display.Color.GetColor(255, 255, 0))
                    .setAlpha(0.3)

                frontContainer = new Phaser.GameObjects.Container(this, 0, 0, [frame, img]);
                frontContainer.flagImage = img;
                return frontContainer;
            }

            const rect = new Phaser.GameObjects.Rectangle(this, 0, 0, this.cardW, this.cardH, 0x000000)
                .setStrokeStyle(2, Phaser.Display.Color.GetColor(255, 255, 0))
                .setAlpha(0.3)

            const name = new Phaser.GameObjects.Text(this, 0, 0, data.country.name, {
                fontFamily: "Arial", fontSize: "18px", color: "#00ffff", fontStyle: "bold",
                align: "center", wordWrap: { width: this.cardW - 20 }
            }).setOrigin(0.5);

            frontContainer = new Phaser.GameObjects.Container(this, 0, 0, [rect, name]);
            frontContainer.flagImage = null;

        } catch (err) {
            console.error("Erro durante front:", err?.stack || err);
        }

        return frontContainer;
    }

    createBackContainer() {
        const back = new Phaser.GameObjects.Rectangle(this, 0, 0, this.cardW, this.cardH, 0x1f2937)
            .setStrokeStyle(2, 0xffffff);
        const backText = new Phaser.GameObjects.Text(this, 0, 0, "?", {
            fontFamily: "Arial", fontSize: 28, color: "#00ffff", fontStyle: "bold"
        }).setOrigin(0.5);

        return new Phaser.GameObjects.Container(this, 0, 0, [back, backText]);
    }

    createCardContainer(toFront, card) {
        return toFront
            ? this.createFrontContainer(card.data.payload)
            : this.createBackContainer();
    }

    async tryReveal(card) {
        if (this.revealLock || card.data.matched || card.data.revealed) {
            return;
        }

        this.revealLock = true;
        await this.flip(card, true); // Revela o cartão

        if (!this.firstPick) {
            this.firstPick = card; // Armazena o primeiro cartão
            this.revealLock = false;
            return;
        }

        const a = this.firstPick.data.payload;
        const b = card.data.payload;
        const isSameCountry = a.country.code === b.country.code;
        const isDifferentKinds = a.kind !== b.kind;

        if (isSameCountry && isDifferentKinds) {
            this.firstPick.data.matched = true; // Marca como pareado
            card.data.matched = true;
            this.matches += 1;
            this.firstPick = null; // Reseta a primeira escolha

        } else {
            await this.delay(500);
            await this.flip(this.firstPick, false); // Vira o primeiro cartão de volta
            await this.flip(card, false); // Vira o segundo cartão de volta
            this.firstPick = null; // Reseta a primeira escolha
        }
        this.revealLock = false; // Libera o bloqueio de revelação
        if (this.matches === this.countries.length) {
            this.time.delayedCall(350, () => {
                this.infoText.setText("✔ Congratulations. You are the best!");
            });
        }
    }

    flip(card, toFront) {
        return new Promise(resolve => {
            this.tweens.add({
                targets: card,
                scaleX: 0,
                duration: 120,
                onComplete: () => {
                    card.removeAll(true); // Remove todos os filhos antes de adicionar o novo

                    card.data.revealed = toFront;
                    card.add(this.createCardContainer(toFront, card));
                    card.scene.tweens.add({ targets: card, scaleX: 1, duration: 50, onComplete: resolve });
                }
            });
        });
    }

    delay(ms) {
        return new Promise(resolve => {
            this.time.delayedCall(ms, () => resolve());
        });
    }

    update(time) {
        if (this.input.gamepad.total) {
            const pad = this.input.gamepad.getPad(0);
            const moved = this.gamepadMoveOnce(pad, time);
            if (moved) this.updateFocusRect();

            const pressA = (pad.A || (pad.buttons[0] && pad.buttons[0].pressed));
            if (pressA && time - this.lastPadPress > 120) {
                this.lastPadPress = time;
                this.tryReveal(this.cards[this.focusIndex]);
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.moveFocus(-1, 0);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.moveFocus(1, 0);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.moveFocus(0, -1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.moveFocus(0, 1);
        if (Phaser.Input.Keyboard.JustDown(this.keyEnter) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            this.tryReveal(this.cards[this.focusIndex]);
        }
    }

    gamepadMoveOnce(pad, time) {
        const DEAD = 0.3;
        const movedH = Math.abs(pad.axes.length ? pad.axes[0].getValue() : 0) > DEAD;
        const movedV = Math.abs(pad.axes.length ? pad.axes[1].getValue() : 0) > DEAD;
        const now = time;

        const left = pad.left, right = pad.right, up = pad.up, down = pad.down;

        if (now - this._lastMoveAt < 150) return false;

        if (movedH || movedV || left || right || up || down) {
            if (left || (pad.axes[0] && pad.axes[0].getValue() < -DEAD)) this.moveFocus(-1, 0);
            if (right || (pad.axes[0] && pad.axes[0].getValue() > DEAD)) this.moveFocus(1, 0);
            if (up || (pad.axes[1] && pad.axes[1].getValue() < -DEAD)) this.moveFocus(0, -1);
            if (down || (pad.axes[1] && pad.axes[1].getValue() > DEAD)) this.moveFocus(0, 1);
            this._lastMoveAt = now;
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
        const target = this.cards[this.focusIndex];
        if (!target) return;
        this.focusRect.setPosition(target.x, target.y);
    }
}

const config = {
    type: Phaser.AUTO,
    backgroundColor: Phaser.Display.Color.GetColor(10, 77, 129),
    parent: "phaser-example",
    width: window.innerWidth,
    height: window.innerHeight,
    input: { gamepad: true },
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'phaser-example',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight,
        // min: {
        //     width: 240,
        //     height: 160
        // },
        snap: {
            width: 200,
            height: 150
        }
    },
    scene: FlagMemory
};

new Phaser.Game(config);
