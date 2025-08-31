
import { FlagMemoryScene } from "./scenes/mainScene.js";

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
