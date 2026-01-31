# Crates

Browser-based Sokoban. Push crates onto targets. Regret your life choices.

## Why This Exists

Sokoban is the purest puzzle game. No enemies, no timer, no randomness. Just you, some crates, and the slowly dawning realization that you've pushed yourself into an unwinnable position. Again.

20 levels of the Microban set. They start easy. They don't stay easy.

## Features

- Classic push-puzzle mechanics (you can push, never pull)
- Full undo system (you'll need it)
- 20 hand-crafted levels
- Progress saves automatically
- Best solution tracking (moves and pushes)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and start pushing.

## Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move |
| Z / U | Undo |
| R | Restart level |
| N | Next level (after solving) |

## The Rules

1. Push crates onto target squares
2. You can only push one crate at a time
3. You cannot pull crates
4. Get all crates on targets to win
5. There is no rule 5

## Tech Stack

- Next.js 14 + TypeScript
- HTML5 Canvas
- XSB level format parser
- localStorage for progress

## License

MIT

## Author

Katie

---

*The undo button exists because I believe in second chances. And third. And forty-seventh.*
