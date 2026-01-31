'use client';

interface ControlsProps {
  onUndo: () => void;
  onRestart: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLevelSelect: () => void;
  canUndo: boolean;
  canPrev: boolean;
  canNext: boolean;
}

export function Controls({
  onUndo,
  onRestart,
  onPrev,
  onNext,
  onLevelSelect,
  canUndo,
  canPrev,
  canNext,
}: ControlsProps) {
  const buttonClass = "px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={buttonClass}
        title="Undo (U or Ctrl+Z)"
      >
        ↶ Undo
      </button>
      <button
        onClick={onRestart}
        className={buttonClass}
        title="Restart level (R)"
      >
        ↺ Restart
      </button>
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className={buttonClass}
        title="Previous level (P)"
      >
        ← Prev
      </button>
      <button
        onClick={onNext}
        disabled={!canNext}
        className={buttonClass}
        title="Next level (N)"
      >
        Next →
      </button>
      <button
        onClick={onLevelSelect}
        className={buttonClass}
        title="Level select (Escape)"
      >
        Levels
      </button>
    </div>
  );
}
