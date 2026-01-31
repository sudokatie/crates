# Changelog

## [0.2.0] - 2026-01-31

### Added
- Smooth movement animations (80ms ease-out)
- Click-to-move support (click adjacent cells)
- Level select modal with progress tracking
- Undo button in UI (was broken, now fixed)
- Escape key opens level select

### Fixed
- Undo button was calling restart instead of undo
- Ctrl+Z / Cmd+Z now works properly for undo

### Changed
- Refactored to proper file structure (one component per file)
- Separated Input.ts for keyboard/mouse handling
- Separated Renderer.ts for canvas drawing
- Separated HUD.tsx, Controls.tsx, LevelSelect.tsx components

## [0.1.0] - 2026-01-31

### Added
- Initial release
- 20 Microban levels
- Core Sokoban mechanics (push crates to targets)
- Undo system with full move history
- Progress persistence (localStorage)
- Best solution tracking
- Keyboard controls (arrows, WASD, U, R, N, P)
