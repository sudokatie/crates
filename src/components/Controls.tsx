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
  const buttonBase = "px-4 py-2 text-xs tracking-widest font-medium transition-colors border";
  const buttonEnabled = "bg-transparent border-[#2a2a2a] text-white hover:border-[#dc2626]";
  const buttonDisabled = "bg-transparent border-[#1a1a1a] text-[#333333] cursor-not-allowed";
  const buttonPrimary = "bg-[#dc2626] border-[#dc2626] text-white hover:bg-[#b91c1c]";

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`${buttonBase} ${canUndo ? buttonEnabled : buttonDisabled}`}
        title="Undo (U or Ctrl+Z)"
      >
        UNDO
      </button>
      <button
        onClick={onRestart}
        className={`${buttonBase} ${buttonEnabled}`}
        title="Restart level (R)"
      >
        RESTART
      </button>
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className={`${buttonBase} ${canPrev ? buttonEnabled : buttonDisabled}`}
        title="Previous level (P)"
      >
        PREV
      </button>
      <button
        onClick={onNext}
        disabled={!canNext}
        className={`${buttonBase} ${canNext ? buttonPrimary : buttonDisabled}`}
        title="Next level (N)"
      >
        NEXT
      </button>
      <button
        onClick={onLevelSelect}
        className={`${buttonBase} ${buttonEnabled}`}
        title="Level select (Escape)"
      >
        LEVELS
      </button>
    </div>
  );
}
