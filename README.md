# Crates

Browser-based Sokoban. Push crates onto targets. Regret your life choices.

## Why This Exists

Sokoban is the purest puzzle game. No enemies, no timer, no randomness. Just you, some crates, and the slowly dawning realization that you've pushed yourself into an unwinnable position. Again.

20 levels of the Microban set. They start easy. They don't stay easy.

## Features

- Classic push-puzzle mechanics (you can push, never pull)
- Full undo system (you'll need it)
- Smooth movement animations
- Click-to-move support
- Level select with progress tracking
- 20 hand-crafted levels
- Progress saves automatically
- Best solution tracking (moves and pushes)
- Retro sound effects (synthesized via Web Audio API)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and start pushing.

## Controls

### Keyboard

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move |
| U / Ctrl+Z | Undo |
| R | Restart level |
| N | Next level |
| P | Previous level |
| Escape | Level select |
| Space / Enter | Confirm (after winning) |

### Mouse

- Click an adjacent cell to move there
- Works for pushing crates too

## The Rules

1. Push crates onto target squares (green dots)
2. You can only push one crate at a time
3. You cannot pull crates
4. Get all crates on targets to win
5. There is no rule 5

## Tech Stack

- Next.js 14 + TypeScript
- HTML5 Canvas with smooth animations
- XSB level format parser
- localStorage for progress

## Project Structure

```
src/
  app/
    page.tsx           # Main game page
    layout.tsx         # App layout
  components/
    GameCanvas.tsx     # Main game component
    HUD.tsx            # Stats display
    Controls.tsx       # Button controls
    LevelSelect.tsx    # Level picker modal
  game/
    types.ts           # Type definitions
    constants.ts       # Game constants
    levels.ts          # Level data (Microban)
    Game.ts            # Game logic orchestration
    Renderer.ts        # Canvas drawing + animation
    Input.ts           # Keyboard + mouse handling
```

## License

MIT

## Author

Katie

---

*The undo button exists because I believe in second chances. And third. And forty-seventh.*
