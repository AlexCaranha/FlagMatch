# FlagMatch

A memory game with country flags, built with **Phaser.js**.  
The goal is to correctly match all pairs of flags until the board is completed.

## Flags

Flags are loaded from [FlagCDN](https://flagcdn.com) using the country ISO code:
```
https://flagcdn.com/80x60/{code}.png
```

Exemplo: `br`, `us`, `jp`.

## How to Run

1. Clone the repository:

```bash
git clone https://github.com/AlexCaranha/FlagMatch.git
cd FlagMatch
```

2. Install dependencies:

```bash
npm install
```

3. Run locally:

```bash
npm run dev
```

The game will be available at http://localhost:3000.

## Play Online

[![Play Now](https://img.shields.io/badge/Jogar-Flag%20Match-blue)](https://alexcaranha.github.io/FlagMatch)

## Technologies

- [Phaser.js](https://phaser.io/) – JavaScript game engine;
- [FlagCDN](https://flagcdn.com/) – flag image service;
- Node.js + NPM – dependency management;
- GitHub Pages – static deployment and hosting.

## License

This project is licensed under a **Dual License**:

- Open Source (MIT License) – free for personal and open-source use.
- Commercial License – required for proprietary or commercial usage.

For commercial licensing, please contact the author [alexcaranha.com](alexcaranha.com)
