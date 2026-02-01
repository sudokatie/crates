# Changelog

## [0.2.0] - 2026-01-31

### Added
- Smooth movement animations (80ms ease-out)
- Click-to-move support (click adjacent cells)
- Swipe gesture support for mobile
- Level select modal with progress tracking
- Undo button in UI (was broken, now fixed)
- Escape key opens level select
- Canvas centering and scaling support
- Vitest test suite (139 tests)

### Fixed
- Undo button was calling restart instead of undo
- Ctrl+Z / Cmd+Z now works properly for undo
- Level 5, 12, 20 had wrong crate/target counts

### Changed
- Refactored to proper file structure (one component per file)
- Separated Input.ts for keyboard/mouse/touch handling
- Separated Renderer.ts for canvas drawing with scaling
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
