# FlagMatch

Um jogo da memória com bandeiras de países, construído com **Phaser.js**.
O objetivo é combinar pares de bandeiras corretamente até completar o tabuleiro.

## Bandeiras

As bandeiras são carregadas a partir do [FlagCDN](https://flagcdn.com) pelo código ISO do país:
```
https://flagcdn.com/80x60/{code}.png
```

Exemplo: `br`, `us`, `jp`.

## Como Rodar

1. Clone o repositório:

```bash
git clone https://github.com/AlexCaranha/FlagMatch.git
cd FlagMatch
```

2. Instalar as dependências

```bash
npm install
```

3. Rode localmente

```bash
npm run dev
```

O jogo estará disponível em http://localhost:3000.

## Acesse Online

[![Jogar Agora](https://img.shields.io/badge/Jogar-Flag%20Match-blue)](https://alexcaranha.github.io/FlagMatch)

## Tecnologias

- [Phaser.js](https://phaser.io/) – engine de jogos em JavaScript;
- [FlagCDN](https://flagcdn.com/) – serviço de imagens de bandeiras;
- Node.js + NPM – gerenciamento de dependências;
- GitHub Pages – deploy e hospedagem estática.

## License

This project is licensed under a **Dual License**:

- Open Source (MIT License) – free for personal and open-source use.  
- Commercial License – required for proprietary or commercial usage.  

For commercial licensing, please contact the author [alexcaranha.com](alexcaranha.com)
